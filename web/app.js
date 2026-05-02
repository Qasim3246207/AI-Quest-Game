// ============================================
// APP.JS — Main Application Controller
// ============================================

// ----------- State -----------
const APP = {
    grid: null,
    start: [1, 1],
    goal: [18, 22],
    rows: 20,
    cols: 24,
    renderers: {},
    isRunning: false,
    animationSpeed: 3, // 1-5
    currentAlgo: 'bfs',
    results: {},
};

// ----------- Initialize -----------
function init() {
    // Generate dungeon
    APP.grid = generateDungeon(APP.rows, APP.cols, APP.start, APP.goal);

    // Create renderers for each panel
    const panelIds = ['bfs', 'dfs', 'astar', 'hill', 'minimax', 'csp', 'kmeans'];
    for (const id of panelIds) {
        APP.renderers[id] = new DungeonRenderer(`canvas-${id}`, APP.rows, APP.cols);
        APP.renderers[id].renderEmpty(APP.grid, APP.start, APP.goal);
    }

    // Setup event listeners
    setupEventListeners();

    // Setup particles
    initParticles();

    // Handle resize
    window.addEventListener('resize', () => {
        for (const id of panelIds) {
            APP.renderers[id].resize();
            reRender(id);
        }
        initParticles();
    });

    addLog('info', 'Dungeon generated! Select an algorithm and click RUN AI.');
    addLog('info', `Grid: ${APP.rows}×${APP.cols} | Start: (${APP.start}) | Goal: (${APP.goal})`);
}

function setupEventListeners() {
    // Algorithm selector
    document.getElementById('algo-select').addEventListener('change', (e) => {
        APP.currentAlgo = e.target.value;
        highlightPanel(APP.currentAlgo);
    });

    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        APP.animationSpeed = parseInt(e.target.value);
        const labels = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Instant'];
        document.getElementById('speed-label').textContent = labels[APP.animationSpeed - 1];
    });

    // Run AI button
    document.getElementById('btn-run').addEventListener('click', () => {
        if (APP.isRunning) return;
        runSelectedAlgorithm();
    });

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
        resetBoard();
    });

    // New Dungeon button
    document.getElementById('btn-new').addEventListener('click', () => {
        newDungeon();
    });
}

// ----------- Algorithm Execution -----------
async function runSelectedAlgorithm() {
    const algo = APP.currentAlgo;
    APP.isRunning = true;
    updateRunButton(true);

    if (algo === 'all') {
        await runAllAlgorithms();
    } else {
        await runSingleAlgorithm(algo);
    }

    APP.isRunning = false;
    updateRunButton(false);
}

async function runAllAlgorithms() {
    const algos = ['bfs', 'dfs', 'astar', 'hill', 'minimax', 'csp', 'kmeans'];
    for (const algo of algos) {
        await runSingleAlgorithm(algo);
    }
    addLog('success', '✅ All algorithms completed!');
}

async function runSingleAlgorithm(algo) {
    setStatus(algo, 'running', 'Running...');
    highlightPanel(algo);
    const renderer = APP.renderers[algo];
    const startTime = performance.now();

    switch (algo) {
        case 'bfs': {
            addLog('info', '▶ Running BFS (Breadth-First Search)...');
            const result = runBFS(APP.grid, APP.start, APP.goal);
            APP.results.bfs = result;
            const elapsed = performance.now() - startTime;

            await animatePathfinding(renderer, APP.grid, APP.start, APP.goal,
                result.visitedOrder, result.path, COLORS.pathBFS);

            updateStats(result.nodesExplored, result.path.length, elapsed);
            addLog('path', `BFS: ${result.nodesExplored} nodes explored, path length: ${result.path.length}`);
            break;
        }
        case 'dfs': {
            addLog('info', '▶ Running DFS (Depth-First Search)...');
            const result = runDFS(APP.grid, APP.start, APP.goal);
            APP.results.dfs = result;
            const elapsed = performance.now() - startTime;

            await animatePathfinding(renderer, APP.grid, APP.start, APP.goal,
                result.visitedOrder, result.path, COLORS.pathDFS);

            updateStats(result.nodesExplored, result.path.length, elapsed);
            addLog('path', `DFS: ${result.nodesExplored} nodes explored, path length: ${result.path.length}, max depth: ${result.maxDepth}`);
            break;
        }
        case 'astar': {
            addLog('info', '▶ Running A* (A-Star Search)...');
            const result = runAStar(APP.grid, APP.start, APP.goal);
            APP.results.astar = result;
            const elapsed = performance.now() - startTime;

            await animatePathfinding(renderer, APP.grid, APP.start, APP.goal,
                result.visitedOrder, result.path, COLORS.pathAStar);

            updateStats(result.nodesExplored, result.path.length, elapsed);
            addLog('path', `A*: ${result.nodesExplored} nodes explored, path length: ${result.path.length}`);
            break;
        }
        case 'hill': {
            addLog('info', '▶ Running Hill Climbing (Local Search)...');
            const result = runHillClimbing(APP.grid, APP.start, APP.goal);
            APP.results.hill = result;
            const elapsed = performance.now() - startTime;

            await animateHillClimbing(renderer, APP.grid, APP.start, APP.goal,
                result.visitedOrder, result.path);

            updateStats(result.nodesExplored, result.path.length, elapsed);
            addLog('warn', `Hill Climbing: ${result.nodesExplored} nodes, ${result.restarts} restarts`);
            break;
        }
        case 'minimax': {
            addLog('info', '▶ Running Minimax (Adversarial Search)...');
            const result = runMinimax(APP.grid, APP.start, APP.goal);
            APP.results.minimax = result;
            const elapsed = performance.now() - startTime;

            await animateMinimax(renderer, APP.grid, APP.start, APP.goal,
                result.wizardPath, result.enemyPath);

            updateStats(result.nodesExplored, result.wizardPath.length, elapsed);
            addLog('explore', `Minimax: ${result.result} (${result.wizardPath.length} wizard moves)`);
            break;
        }
        case 'csp': {
            addLog('info', '▶ Running CSP (Constraint Satisfaction Problem)...');
            addLog('info', 'CSP: Generating own dungeon with zigzag corridor (Part 3 logic)...');
            const result = runCSP(APP.grid, APP.start, APP.goal);
            APP.results.csp = result;
            const elapsed = performance.now() - startTime;

            // CSP generates its own dungeon — animate using CSP's grid directly
            await animateCSP(renderer, result.grid, result.grid, APP.start, APP.goal, result.logs);

            updateStats(result.wallsPlaced + result.backtracks, result.wallsPlaced, elapsed);
            addLog('success', `CSP: ${result.wallsPlaced} walls placed, ${result.backtracks} backtracks (constraint: path must exist)`);
            break;
        }
        case 'kmeans': {
            addLog('info', '▶ Running K-Means Clustering (K=3)...');
            const result = runKMeans(APP.grid, 3);
            APP.results.kmeans = result;
            const elapsed = performance.now() - startTime;

            await animateKMeans(renderer, APP.grid, result.openCells, result.labels,
                result.centroids, 3);

            updateStats(result.openCells.length, result.iterations, elapsed);
            addLog('success', `K-Means: Converged in ${result.iterations} iterations, ${result.openCells.length} cells`);
            break;
        }
    }

    setStatus(algo, 'done', 'Done ✓');
}

// ----------- Animation Functions -----------
function getDelay() {
    const delays = [80, 40, 15, 5, 0];
    return delays[APP.animationSpeed - 1];
}

function sleep(ms) {
    return ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
}

async function animatePathfinding(renderer, grid, start, goal, visitedOrder, path, color) {
    const delay = getDelay();
    const batchSize = delay === 0 ? visitedOrder.length : Math.max(1, Math.floor(5 / Math.max(1, delay / 10)));

    renderer.clear();
    renderer.drawGrid(grid);

    // Animate exploration
    for (let i = 0; i < visitedOrder.length; i += batchSize) {
        const batch = visitedOrder.slice(0, i + batchSize);
        renderer.clear();
        renderer.drawGrid(grid);
        renderer.drawVisited(batch, color);
        renderer.drawStart(start);
        renderer.drawGoal(goal);
        if (delay > 0) await sleep(delay);
    }

    // Animate path
    if (path.length > 0) {
        for (let i = 2; i <= path.length; i++) {
            renderer.clear();
            renderer.drawGrid(grid);
            renderer.drawVisited(visitedOrder, color);
            renderer.drawPath(path.slice(0, i), color);
            renderer.drawStart(start);
            renderer.drawGoal(goal);
            if (delay > 0) await sleep(delay * 2);
        }
    }

    // Final render
    renderer.renderPathfinding(grid, start, goal, visitedOrder, path, color);
}

async function animateHillClimbing(renderer, grid, start, goal, visitedOrder, path) {
    const delay = getDelay();
    renderer.clear();
    renderer.drawGrid(grid);

    for (let i = 2; i <= path.length; i++) {
        renderer.clear();
        renderer.drawGrid(grid);
        renderer.drawVisited(visitedOrder.slice(0, Math.min(i, visitedOrder.length)), COLORS.pathHill);
        renderer.drawPath(path.slice(0, i), COLORS.pathHill);
        renderer.drawStart(start);
        renderer.drawGoal(goal);
        if (delay > 0) await sleep(delay);
    }

    renderer.renderHillClimbing(grid, start, goal, visitedOrder, path);
}

async function animateMinimax(renderer, grid, start, goal, wizardPath, enemyPath) {
    const delay = getDelay();

    for (let i = 1; i <= wizardPath.length; i++) {
        renderer.clear();
        renderer.drawGrid(grid);
        renderer.drawPath(wizardPath.slice(0, i), COLORS.wizard, 2);

        for (let j = 0; j < Math.min(i, enemyPath.length); j++) {
            const [r, c] = enemyPath[j];
            const x = renderer.offsetX + c * renderer.cellSize;
            const y = renderer.offsetY + r * renderer.cellSize;
            renderer.ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
            renderer.ctx.fillRect(x + 1, y + 1, renderer.cellSize - 2, renderer.cellSize - 2);
        }

        if (i > 0) {
            renderer.drawStart(wizardPath[i - 1]);
        }
        if (i <= enemyPath.length && i > 0) {
            renderer.drawEnemy(enemyPath[i - 1]);
        }
        renderer.drawGoal(goal);
        if (delay > 0) await sleep(delay * 3);
    }

    renderer.renderMinimax(grid, start, goal, wizardPath, enemyPath);
}

async function animateCSP(renderer, grid, cspGrid, start, goal, logs) {
    const delay = getDelay();

    // Start from a fresh CSP grid before wall placement
    // Rebuild base grid by reversing placed walls to show the process
    const baseGrid = cspGrid.map(row => [...row]);
    // Re-open all placed walls (they will be animated one by one)
    for (const log of logs) {
        if (log.type === 'placed') {
            baseGrid[log.r][log.c] = 1;
        }
    }

    const tempGrid = baseGrid.map(row => [...row]);

    renderer.clear();
    renderer.drawGrid(tempGrid);
    renderer.drawStart(start);
    renderer.drawGoal(goal);

    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log.type === 'placed') {
            tempGrid[log.r][log.c] = 0;  // Wall placed successfully
        }
        renderer.clear();
        renderer.drawGrid(tempGrid);
        renderer.drawCSPMarkers(logs.slice(0, i + 1));
        renderer.drawStart(start);
        renderer.drawGoal(goal);
        if (delay > 0) await sleep(delay * 2);
    }

    renderer.renderCSP(grid, cspGrid, start, goal, logs);
}

async function animateKMeans(renderer, grid, openCells, labels, centroids, k) {
    const delay = getDelay();

    // Animate cluster assignment
    const batchSize = delay === 0 ? openCells.length : Math.max(5, Math.floor(openCells.length / 20));

    for (let i = 0; i < openCells.length; i += batchSize) {
        renderer.clear();
        renderer.drawGrid(grid);
        const partialCells = openCells.slice(0, i + batchSize);
        const partialLabels = labels.slice(0, i + batchSize);
        renderer.drawClusters(partialCells, partialLabels, centroids, k);
        if (delay > 0) await sleep(delay);
    }

    renderer.clear();
    renderer.drawGrid(grid);
    renderer.drawClusters(openCells, labels, centroids, k);
}

// ----------- UI Updates -----------
function updateStats(nodes, pathLen, timeMs) {
    document.getElementById('stat-nodes').textContent = nodes.toLocaleString();
    document.getElementById('stat-path').textContent = pathLen.toLocaleString();
    document.getElementById('stat-time').textContent = timeMs < 1 ? `${timeMs.toFixed(3)} ms` : `${(timeMs / 1000).toFixed(3)} s`;

    // Estimate memory (rough: nodes * ~64 bytes)
    const memoryBytes = nodes * 64;
    const memoryKB = (memoryBytes / 1024).toFixed(2);
    const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);
    document.getElementById('stat-memory').textContent = memoryBytes > 1024 * 1024 ? `${memoryMB} MB` : `${memoryKB} KB`;
}

function setStatus(algo, state, text) {
    const el = document.getElementById(`status-${algo}`);
    if (el) {
        el.className = `panel-status ${state}`;
        el.textContent = text;
    }
}

function highlightPanel(algo) {
    document.querySelectorAll('.algo-panel').forEach(p => p.classList.remove('active'));
    if (algo !== 'all') {
        const panel = document.getElementById(`panel-${algo}`);
        if (panel) panel.classList.add('active');
    }
}

function updateRunButton(isRunning) {
    const btn = document.getElementById('btn-run');
    if (isRunning) {
        btn.classList.add('running');
        btn.innerHTML = '<span class="btn-icon">⏳</span> RUNNING...';
    } else {
        btn.classList.remove('running');
        btn.innerHTML = '<span class="btn-icon">▶</span> RUN AI';
    }
}

function addLog(type, message) {
    const logArea = document.getElementById('log-area');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;

    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    entry.textContent = `[${timestamp}] ${message}`;

    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;

    // Keep only last 100 entries
    while (logArea.children.length > 100) {
        logArea.removeChild(logArea.firstChild);
    }
}

function resetBoard() {
    const panelIds = ['bfs', 'dfs', 'astar', 'hill', 'minimax', 'csp', 'kmeans'];
    for (const id of panelIds) {
        APP.renderers[id].renderEmpty(APP.grid, APP.start, APP.goal);
        setStatus(id, '', '');
    }
    APP.results = {};
    document.getElementById('stat-nodes').textContent = '—';
    document.getElementById('stat-path').textContent = '—';
    document.getElementById('stat-time').textContent = '—';
    document.getElementById('stat-memory').textContent = '—';
    addLog('info', '🔄 Board reset.');
}

function newDungeon() {
    APP.grid = generateDungeon(APP.rows, APP.cols, APP.start, APP.goal);
    resetBoard();
    addLog('info', '🗺️ New dungeon generated!');
}

function reRender(id) {
    const renderer = APP.renderers[id];
    const result = APP.results[id];

    if (!result) {
        renderer.renderEmpty(APP.grid, APP.start, APP.goal);
        return;
    }

    switch (id) {
        case 'bfs':
            renderer.renderPathfinding(APP.grid, APP.start, APP.goal, result.visitedOrder, result.path, COLORS.pathBFS);
            break;
        case 'dfs':
            renderer.renderPathfinding(APP.grid, APP.start, APP.goal, result.visitedOrder, result.path, COLORS.pathDFS);
            break;
        case 'astar':
            renderer.renderPathfinding(APP.grid, APP.start, APP.goal, result.visitedOrder, result.path, COLORS.pathAStar);
            break;
        case 'hill':
            renderer.renderHillClimbing(APP.grid, APP.start, APP.goal, result.visitedOrder, result.path);
            break;
        case 'minimax':
            renderer.renderMinimax(APP.grid, APP.start, APP.goal, result.wizardPath, result.enemyPath);
            break;
        case 'csp':
            renderer.renderCSP(result.grid, result.grid, APP.start, APP.goal, result.logs);
            break;
        case 'kmeans':
            renderer.renderKMeans(APP.grid, result.openCells, result.labels, result.centroids, 3);
            break;
    }
}

// ----------- Particles Background -----------
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.5 + 0.1,
            color: ['#F4C430', '#3498DB', '#2ECC71', '#9B59B6'][Math.floor(Math.random() * 4)],
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(244, 196, 48, ${0.05 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// ----------- Start Application -----------
document.addEventListener('DOMContentLoaded', init);
