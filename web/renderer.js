// ============================================
// RENDERER.JS — Canvas Rendering Engine
// ============================================

const COLORS = {
    wall: '#1a1a24',
    wallLight: '#242434',
    floor: '#d4d4e0',
    floorDark: '#c0c0d0',
    visited: '#7d3c98',
    visitedDim: '#5b2c6f',
    pathBFS: '#3498DB',
    pathDFS: '#9B59B6',
    pathAStar: '#2ECC71',
    pathHill: '#E67E22',
    start: '#1ABC9C',
    startGlow: '#16a085',
    goal: '#F39C12',
    goalGlow: '#E67E22',
    enemy: '#E74C3C',
    enemyGlow: '#C0392B',
    wizard: '#3498DB',
    wizardGlow: '#2980B9',
    gridLine: 'rgba(255,255,255,0.03)',
    clusterColors: [
        ['#E74C3C', '#c0392b'],  // Red
        ['#3498DB', '#2980b9'],  // Blue
        ['#2ECC71', '#27ae60'],  // Green
    ],
    centroid: '#F1C40F',
    cspConflict: '#E74C3C',
    cspRemoved: '#E74C3C',
    cspOk: '#2ECC71',
};

class DungeonRenderer {
    constructor(canvasId, rows = 20, cols = 24) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.rows = rows;
        this.cols = cols;
        this.cellSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.displayWidth = rect.width;
        this.displayHeight = rect.height;

        const cellW = this.displayWidth / this.cols;
        const cellH = this.displayHeight / this.rows;
        this.cellSize = Math.floor(Math.min(cellW, cellH));
        this.offsetX = Math.floor((this.displayWidth - this.cellSize * this.cols) / 2);
        this.offsetY = Math.floor((this.displayHeight - this.cellSize * this.rows) / 2);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
        this.ctx.fillStyle = '#0a0a12';
        this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
    }

    drawGrid(grid) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = this.offsetX + c * this.cellSize;
                const y = this.offsetY + r * this.cellSize;

                if (grid[r][c] === 0) {
                    // Wall with subtle pattern
                    this.ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.wall : COLORS.wallLight;
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    // Wall inner shadow
                    this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                } else {
                    // Floor tile with subtle checkerboard
                    this.ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.floor : COLORS.floorDark;
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                }

                // Grid lines
                this.ctx.strokeStyle = COLORS.gridLine;
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            }
        }
    }

    drawVisited(visitedOrder, color = COLORS.visited) {
        const dimColor = this.dimColor(color, 0.6);
        for (const [r, c] of visitedOrder) {
            const x = this.offsetX + c * this.cellSize;
            const y = this.offsetY + r * this.cellSize;
            this.ctx.fillStyle = dimColor;
            this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
        }
    }

    drawPath(path, color, lineWidth = 3) {
        if (path.length < 2) return;

        const cs = this.cellSize;
        const half = cs / 2;

        // Draw path cells
        for (const [r, c] of path) {
            const x = this.offsetX + c * cs;
            const y = this.offsetY + r * cs;
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        }

        // Draw path line
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        const [sr, sc] = path[0];
        this.ctx.moveTo(this.offsetX + sc * cs + half, this.offsetY + sr * cs + half);
        for (let i = 1; i < path.length; i++) {
            const [pr, pc] = path[i];
            this.ctx.lineTo(this.offsetX + pc * cs + half, this.offsetY + pr * cs + half);
        }
        this.ctx.stroke();

        // Draw arrows/dots on path
        for (let i = 0; i < path.length; i++) {
            const [r, c] = path[i];
            const cx = this.offsetX + c * cs + half;
            const cy = this.offsetY + r * cs + half;

            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
            this.ctx.arc(cx, cy, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawStart(start) {
        const [r, c] = start;
        const x = this.offsetX + c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;
        const cs = this.cellSize;

        // Glow
        this.ctx.shadowColor = COLORS.startGlow;
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = COLORS.start;
        this.ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        this.ctx.shadowBlur = 0;

        // Icon - wizard hat
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `${Math.max(8, cs * 0.55)}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🧙', x + cs / 2, y + cs / 2);
    }

    drawGoal(goal) {
        const [r, c] = goal;
        const x = this.offsetX + c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;
        const cs = this.cellSize;

        // Glow
        this.ctx.shadowColor = COLORS.goalGlow;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = COLORS.goal;
        this.ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        this.ctx.shadowBlur = 0;

        // Icon - treasure
        this.ctx.font = `${Math.max(8, cs * 0.55)}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🏆', x + cs / 2, y + cs / 2);
    }

    drawEnemy(pos) {
        const [r, c] = pos;
        const x = this.offsetX + c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;
        const cs = this.cellSize;

        this.ctx.shadowColor = COLORS.enemyGlow;
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = COLORS.enemy;
        this.ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        this.ctx.shadowBlur = 0;

        this.ctx.font = `${Math.max(8, cs * 0.55)}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('👹', x + cs / 2, y + cs / 2);
    }

    drawClusters(openCells, labels, centroids, k = 3) {
        const cs = this.cellSize;
        for (let i = 0; i < openCells.length; i++) {
            const [r, c] = openCells[i];
            const cluster = labels[i];
            const x = this.offsetX + c * cs;
            const y = this.offsetY + r * cs;

            const [main, dark] = COLORS.clusterColors[cluster % COLORS.clusterColors.length];
            this.ctx.fillStyle = (r + c) % 2 === 0 ? main : dark;
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
            this.ctx.globalAlpha = 1.0;
        }

        // Draw centroids
        for (let ki = 0; ki < centroids.length; ki++) {
            const [cr, cc] = centroids[ki];
            const cx = this.offsetX + cc * cs + cs / 2;
            const cy = this.offsetY + cr * cs + cs / 2;

            this.ctx.shadowColor = COLORS.centroid;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.fillStyle = COLORS.centroid;
            this.ctx.arc(cx, cy, cs * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Label
            this.ctx.fillStyle = '#111';
            this.ctx.font = `bold ${Math.max(7, cs * 0.4)}px ${getComputedStyle(document.body).fontFamily}`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ki + 1, cx, cy);
        }
    }

    drawCSPMarkers(logs) {
        const cs = this.cellSize;
        for (const log of logs) {
            const x = this.offsetX + log.c * cs;
            const y = this.offsetY + log.r * cs;

            if (log.type === 'placed') {
                // Wall placed successfully - small green check
                this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
                this.ctx.fillRect(x, y, cs, cs);
            } else {
                // Backtrack - red X
                this.ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
                this.ctx.fillRect(x, y, cs, cs);
            }
        }
    }

    // Helper: dim a hex color
    dimColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }

    // Full render for pathfinding algorithms (BFS, DFS, A*)
    renderPathfinding(grid, start, goal, visitedOrder, path, pathColor) {
        this.clear();
        this.drawGrid(grid);
        this.drawVisited(visitedOrder, pathColor);
        this.drawPath(path, pathColor);
        this.drawStart(start);
        this.drawGoal(goal);
    }

    // Render Hill Climbing
    renderHillClimbing(grid, start, goal, visitedOrder, path) {
        this.clear();
        this.drawGrid(grid);
        this.drawVisited(visitedOrder, COLORS.pathHill);
        this.drawPath(path, COLORS.pathHill);
        this.drawStart(start);
        this.drawGoal(goal);
    }

    // Render Minimax
    renderMinimax(grid, start, goal, wizardPath, enemyPath) {
        this.clear();
        this.drawGrid(grid);

        // Draw wizard path
        this.drawPath(wizardPath, COLORS.wizard, 2);

        // Draw enemy path
        for (const [r, c] of enemyPath) {
            const x = this.offsetX + c * this.cellSize;
            const y = this.offsetY + r * this.cellSize;
            this.ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
            this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
        }

        // Draw final positions
        if (wizardPath.length > 0) {
            this.drawStart(wizardPath[wizardPath.length - 1]);
        }
        if (enemyPath.length > 0) {
            this.drawEnemy(enemyPath[enemyPath.length - 1]);
        }
        this.drawStart(start);
        this.drawGoal(goal);
    }

    // Render CSP
    renderCSP(grid, cspGrid, start, goal, logs) {
        this.clear();
        this.drawGrid(cspGrid);
        this.drawCSPMarkers(logs);
        this.drawStart(start);
        this.drawGoal(goal);
    }

    // Render K-Means
    renderKMeans(grid, openCells, labels, centroids, k) {
        this.clear();
        this.drawGrid(grid);
        this.drawClusters(openCells, labels, centroids, k);
    }

    // Render empty grid
    renderEmpty(grid, start, goal) {
        this.clear();
        this.drawGrid(grid);
        this.drawStart(start);
        this.drawGoal(goal);
    }
}
