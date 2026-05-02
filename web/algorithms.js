// ============================================
// ALGORITHMS.JS — All 7 AI Algorithms
// Connected to Python Notebooks:
//   Part 1 (22F1234_Part1.ipynb): BFS, DFS, Helpers, Dungeon Generation
//   Part 2 (22F1234_Part2.ipynb): A* Search, Hill Climbing
//   Part 3 (22F1234_Part3.ipynb): Minimax, CSP
//   Part 4 (22F1234_Part4.ipynb): K-Means Clustering
//   Main_UI (Main_UI.ipynb):      Combined Dashboard
// ============================================

// ===========================================
// UTILITY FUNCTIONS (from Part 1: 22F1234_Part1.ipynb)
// Python: def manhattan(cell1, cell2)
// ===========================================
function manhattan(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

// Python: def get_neighbors(grid, row, col)
// Returns list of valid walkable neighboring cells (4-directional).
// Only returns cells within grid bounds and floor cells (value=1).
function getNeighbors(grid, row, col) {
    // Define 4-directional movement: up, down, left, right
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const neighbors = [];
    const rows = grid.length, cols = grid[0].length;
    for (const [dr, dc] of directions) {
        const newRow = row + dr, newCol = col + dc;
        // Check bounds and walkability
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && grid[newRow][newCol] === 1) {
            neighbors.push([newRow, newCol]);
        }
    }
    return neighbors;
}

// Python: def reconstruct_path(parent, start, goal)
// Reconstructs the path from start to goal using the parent dictionary.
function reconstructPath(parent, start, goal) {
    const path = [];
    let current = goal.toString();
    while (current !== start.toString()) {
        const coords = current.split(',').map(Number);
        path.push(coords);
        current = parent[current];
        if (!current) return [];
    }
    path.push(start);
    path.reverse();
    return path;
}

// Python: def bfs_reachable(grid, start, goal)
// Quick BFS to check if the goal is reachable from the start.
// Used mainly by CSP for validation.
function bfsReachable(grid, start, goal) {
    const queue = [start];
    const visited = new Set();
    visited.add(start.toString());
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        if (r === goal[0] && c === goal[1]) return true;
        for (const [nr, nc] of getNeighbors(grid, r, c)) {
            const key = [nr, nc].toString();
            if (!visited.has(key)) {
                visited.add(key);
                queue.push([nr, nc]);
            }
        }
    }
    return false;
}

// ===========================================
// DUNGEON GENERATION (from Part 1: 22F1234_Part1.ipynb)
// Python: def generate_dungeon(rows=20, cols=24, start=(1,1), goal=(18,22))
// Generates a randomized dungeon ensuring a path exists from start to goal.
// Step 1: Initialize all cells as walls (0)
// Step 2: Carve a winding corridor from Start to Goal
// Step 3: Carve 5-8 random rectangular rooms
// Step 4: Add random horizontal + vertical corridors
// Step 5: Validate using BFS
// Step 6: If path broken, loop and retry
// ===========================================
function generateDungeon(rows = 20, cols = 24, start = [1, 1], goal = [18, 22]) {
    let attempts = 0;
    while (attempts < 100) {
        attempts++;
        // Step 1: Initialize all cells as walls (0)
        const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

        // Step 2: Carve a winding corridor from Start to Goal
        let [r, c] = start;
        grid[r][c] = 1;
        while (r !== goal[0] || c !== goal[1]) {
            if (r < goal[0] && c < goal[1]) {
                if (Math.random() < 0.5) r++;
                else c++;
            } else if (r < goal[0]) r++;
            else if (c < goal[1]) c++;
            grid[r][c] = 1;
        }

        // Step 3: Carve 5-8 random rectangular rooms
        const numRooms = Math.floor(Math.random() * 4) + 5; // random.randint(5, 8)
        for (let n = 0; n < numRooms; n++) {
            const roomH = Math.floor(Math.random() * 3) + 3; // random.randint(3, 5)
            const roomW = Math.floor(Math.random() * 3) + 3;
            const roomR = Math.floor(Math.random() * (rows - roomH - 1)) + 1;
            const roomC = Math.floor(Math.random() * (cols - roomW - 1)) + 1;
            for (let i = roomR; i < roomR + roomH; i++) {
                for (let j = roomC; j < roomC + roomW; j++) {
                    grid[i][j] = 1;
                }
            }
        }

        // Step 4: Add random horizontal + vertical corridors
        for (let n = 0; n < rows; n++) {
            const rr = Math.floor(Math.random() * (rows - 2)) + 1;
            const rc = Math.floor(Math.random() * (cols - 2)) + 1;
            if (grid[rr][rc] === 0) grid[rr][rc] = 1;
        }

        // Step 5: Validate using BFS
        if (bfsReachable(grid, start, goal)) {
            return grid;
        }
        // Step 6: If path broken, loop and retry
    }
    // Fallback: open grid with border walls
    const grid = Array.from({ length: rows }, () => Array(cols).fill(1));
    for (let r = 0; r < rows; r++) grid[r][0] = grid[r][cols - 1] = 0;
    for (let c = 0; c < cols; c++) grid[0][c] = grid[rows - 1][c] = 0;
    return grid;
}


// ===========================================
// ALGORITHM 1: BFS — Breadth-First Search
// Source: Part 1 (22F1234_Part1.ipynb)
// Python: def bfs(grid, start, goal)
// Finds shortest path using FIFO Queue.
// Explores level by level. Guaranteed optimal.
// Returns: (path, visited_order, nodes_explored)
// ===========================================
function runBFS(grid, start, goal) {
    const queue = [start];            // deque([start])
    const visited = new Set();
    visited.add(start.toString());    // visited = {start}
    const parent = {};
    parent[start.toString()] = null;  // parent = {start: None}
    const visitedOrder = [];

    while (queue.length > 0) {
        const cell = queue.shift();       // cell = queue.popleft() — FIFO
        visitedOrder.push(cell);
        const [r, c] = cell;

        // Check if goal reached
        if (r === goal[0] && c === goal[1]) {
            const path = reconstructPath(parent, start, goal);
            return { path, visitedOrder, nodesExplored: visitedOrder.length };
        }

        // Explore neighbors
        for (const [nr, nc] of getNeighbors(grid, r, c)) {
            const key = [nr, nc].toString();
            if (!visited.has(key)) {
                visited.add(key);
                parent[key] = cell.toString();
                queue.push([nr, nc]);     // FIFO enqueue
            }
        }
    }
    return { path: [], visitedOrder, nodesExplored: visitedOrder.length };
}


// ===========================================
// ALGORITHM 2: DFS — Depth-First Search
// Source: Part 1 (22F1234_Part1.ipynb)
// Python: def dfs(grid, start, goal)
// Explores deep using LIFO Stack.
// Finds a path but NOT guaranteed shortest.
// Returns: (path, visited_order, nodes_explored)
// ===========================================
function runDFS(grid, start, goal) {
    const stack = [start];             // stack = [start]
    const visited = new Set();
    visited.add(start.toString());     // visited = {start}
    const parent = {};
    parent[start.toString()] = null;   // parent = {start: None}
    const visitedOrder = [];
    const depthMap = {};               // depth_map = {start: 0} — matching notebook
    depthMap[start.toString()] = 0;

    while (stack.length > 0) {
        const cell = stack.pop();          // cell = stack.pop() — LIFO
        visitedOrder.push(cell);
        const [r, c] = cell;
        const depth = depthMap[cell.toString()]; // track depth like notebook

        // Check if goal reached
        if (r === goal[0] && c === goal[1]) {
            const path = reconstructPath(parent, start, goal);
            return { path, visitedOrder, nodesExplored: visitedOrder.length, maxDepth: depth };
        }

        // Explore neighbors
        for (const [nr, nc] of getNeighbors(grid, r, c)) {
            const key = [nr, nc].toString();
            if (!visited.has(key)) {
                visited.add(key);
                parent[key] = cell.toString();
                depthMap[key] = depth + 1;     // depth_map[neighbor] = depth + 1
                stack.push([nr, nc]);          // LIFO push
            }
        }
    }
    return { path: [], visitedOrder, nodesExplored: visitedOrder.length, maxDepth: 0 };
}


// ===========================================
// ALGORITHM 3: A* Search
// Source: Part 2 (22F1234_Part2.ipynb)
// Python: def astar(grid, start, goal)
// Optimal + efficient using f(n) = g(n) + h(n).
// h(n) = Manhattan distance. Uses Min-Heap Priority Queue.
// Returns: (path, visited_order, nodes_explored)
// ===========================================
function runAStar(grid, start, goal) {
    const h = (cell) => manhattan(cell, goal);  // h = lambda cell: manhattan(cell, goal)
    // open_list = [(h(start), 0, start)]  — Priority queue: [f, g, cell]
    const openList = [[h(start), 0, start]];
    const gScores = {};                         // g_scores = {start: 0}
    gScores[start.toString()] = 0;
    const parent = {};                          // parent = {start: None}
    parent[start.toString()] = null;
    const visitedOrder = [];
    const closedSet = new Set();                // closed_set = set()

    while (openList.length > 0) {
        // heapq.heappop(open_list) — extract min f
        openList.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const [f, g, cell] = openList.shift();
        const key = cell.toString();

        if (closedSet.has(key)) continue;       // if cell in closed_set: continue
        closedSet.add(key);
        visitedOrder.push(cell);
        const [r, c] = cell;

        // Check if goal reached
        if (r === goal[0] && c === goal[1]) {
            const path = reconstructPath(parent, start, goal);
            return { path, visitedOrder, nodesExplored: visitedOrder.length };
        }

        // Explore neighbors
        for (const [nr, nc] of getNeighbors(grid, r, c)) {
            const nkey = [nr, nc].toString();
            const newG = g + 1;
            // if neighbor not in g_scores or new_g < g_scores[neighbor]
            if (!(nkey in gScores) || newG < gScores[nkey]) {
                gScores[nkey] = newG;
                parent[nkey] = key;
                const newF = newG + h([nr, nc]);  // new_f = new_g + h(neighbor)
                openList.push([newF, newG, [nr, nc]]);
            }
        }
    }
    return { path: [], visitedOrder, nodesExplored: visitedOrder.length };
}


// ===========================================
// ALGORITHM 4: Hill Climbing — Local Search
// Source: Part 2 (22F1234_Part2.ipynb)
// Python: def hill_climbing(grid, start, goal, max_restarts=20)
// Greedy move toward goal each step.
// Gets stuck at local maxima → uses random restarts to escape.
// Returns: (path, visited_order, nodes_explored, restarts)
// ===========================================
function runHillClimbing(grid, start, goal, maxRestarts = 20) {  // FIXED: was 15, notebook = 20
    let current = start;                    // current = start
    const visitedOrder = [];
    const fullPath = [current];             // full_path = [current]
    let restarts = 0;

    // open_cells = [(r, c) for r in range(len(grid)) for c in range(len(grid[0])) if grid[r][c] == 1]
    const openCells = [];
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
            if (grid[r][c] === 1) openCells.push([r, c]);
        }
    }

    // for _ in range(10000):  — FIXED: was 5000, notebook = 10000
    for (let i = 0; i < 10000; i++) {
        if (current[0] === goal[0] && current[1] === goal[1]) {
            return { path: fullPath, visitedOrder, nodesExplored: visitedOrder.length, restarts };
        }

        visitedOrder.push(current);
        const neighbors = getNeighbors(grid, current[0], current[1]);
        if (neighbors.length === 0) break;

        // best = min(neighbors, key=lambda nb: manhattan(nb, goal))
        let best = neighbors[0];
        for (const nb of neighbors) {
            if (manhattan(nb, goal) < manhattan(best, goal)) best = nb;
        }

        // if manhattan(best, goal) < manhattan(current, goal):
        if (manhattan(best, goal) < manhattan(current, goal)) {
            current = best;
            fullPath.push(current);
        } else {
            // Stuck — Local Maximum! Random restart
            if (restarts >= maxRestarts) break;
            current = openCells[Math.floor(Math.random() * openCells.length)];
            restarts++;
            fullPath.push(current);
        }
    }
    return { path: fullPath, visitedOrder, nodesExplored: visitedOrder.length, restarts };
}


// ===========================================
// ALGORITHM 5: Minimax — Adversarial Search
// Source: Part 3 (22F1234_Part3.ipynb)
// Python: def minimax(grid, wizard, enemy, depth, is_maximizing, goal)
// Wizard (MAX) tries to reach goal, Enemy (MIN) tries to intercept.
// ===========================================
function minimaxEval(grid, wizard, enemy, depth, isMaximizing, goal) {
    // Base case: depth == 0 or wizard reached goal
    if (depth === 0 || (wizard[0] === goal[0] && wizard[1] === goal[1])) {
        // return -manhattan(wizard, goal) + manhattan(enemy, wizard)
        return -manhattan(wizard, goal) + manhattan(enemy, wizard);
    }

    if (isMaximizing) {
        // Wizard's turn — maximize score
        let best = -Infinity;
        const moves = getNeighbors(grid, wizard[0], wizard[1]);
        for (const move of moves) {
            const val = minimaxEval(grid, move, enemy, depth - 1, false, goal);
            best = Math.max(best, val);
        }
        return best === -Infinity ? -manhattan(wizard, goal) : best;
    } else {
        // Enemy's turn — minimize score
        let best = Infinity;
        const moves = getNeighbors(grid, enemy[0], enemy[1]);
        for (const move of moves) {
            const val = minimaxEval(grid, wizard, move, depth - 1, true, goal);
            best = Math.min(best, val);
        }
        return best === Infinity ? -manhattan(wizard, goal) : best;
    }
}

// Python: def run_minimax_game(grid, start, goal, depth_limit=3)
// Runs full Minimax game loop — wizard and enemy alternate turns.
// Enemy starts near center of grid at (10, 12).
function runMinimax(grid, start, goal, depthLimit = 3) {
    let wizard = start;           // wizard = start
    let enemy = [10, 12];         // enemy = (10, 12)  # enemy starts near center

    // Ensure enemy is on a walkable tile
    if (grid[enemy[0]][enemy[1]] === 0) {
        let found = false;
        for (let r = 0; r < grid.length && !found; r++) {
            for (let c = 0; c < grid[0].length && !found; c++) {
                if (grid[r][c] === 1 && manhattan([r, c], [10, 12]) < 5) {
                    enemy = [r, c];
                    found = true;
                }
            }
        }
    }

    const wizardPath = [wizard];   // wizard_path = [wizard]
    const enemyPath = [enemy];     // enemy_path = [enemy]
    let result = "Draw";

    // for turn in range(200):  — FIXED: was 100, notebook = 200
    for (let turn = 0; turn < 200; turn++) {
        // Wizard's turn (MAX)
        const wNeighbors = getNeighbors(grid, wizard[0], wizard[1]);
        if (wNeighbors.length === 0) break;

        // best_move = max(neighbors, key=lambda m: minimax(grid, m, enemy, depth_limit-1, False, goal))
        let bestMove = wNeighbors[0];
        let bestScore = -Infinity;
        for (const m of wNeighbors) {
            const score = minimaxEval(grid, m, enemy, depthLimit - 1, false, goal);
            if (score > bestScore) {
                bestScore = score;
                bestMove = m;
            }
        }
        wizard = bestMove;
        wizardPath.push(wizard);

        // Enemy's turn (MIN) — moves toward wizard
        // enemy = min(e_neighbors, key=lambda m: manhattan(m, wizard))
        const eNeighbors = getNeighbors(grid, enemy[0], enemy[1]);
        if (eNeighbors.length > 0) {
            let closest = eNeighbors[0];
            for (const m of eNeighbors) {
                if (manhattan(m, wizard) < manhattan(closest, wizard)) closest = m;
            }
            enemy = closest;
        }
        enemyPath.push(enemy);

        // Check end conditions
        if (wizard[0] === goal[0] && wizard[1] === goal[1]) {
            result = "Wizard reached goal!";
            break;
        }
        if (wizard[0] === enemy[0] && wizard[1] === enemy[1]) {
            result = "Enemy caught wizard!";
            break;
        }
    }

    return { wizardPath, enemyPath, result, nodesExplored: wizardPath.length + enemyPath.length };
}


// ===========================================
// ALGORITHM 6: CSP — Constraint Satisfaction Problem
// Source: Part 3 (22F1234_Part3.ipynb)
// Python: def csp_generate_dungeon(rows=20, cols=24, start=(1,1), goal=(18,22))
// Generates dungeon with backtracking.
// Constraint: a valid path from start to goal must always exist.
// Step 1: Carve guaranteed path (zigzag corridor — right first, then down)
// Step 2: Add random rooms
// Step 3: CSP wall placement with backtracking (try 40 walls)
// ===========================================
function cspGenerateDungeon(rows = 20, cols = 24, start = [1, 1], goal = [18, 22]) {
    // Initialize all walls
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

    // Step 1: Carve guaranteed path (zigzag corridor)
    // Python: goes right (c++) first, then down (r++)
    let [r, c] = start;
    grid[r][c] = 1;
    while (r !== goal[0] || c !== goal[1]) {
        if (c < goal[1]) {
            c += 1;       // Move right first
        } else if (r < goal[0]) {
            r += 1;       // Then move down
        }
        grid[r][c] = 1;
    }

    // Step 2: Add random rooms (6 rooms)
    for (let room = 0; room < 6; room++) {
        const rr = Math.floor(Math.random() * (rows - 4)) + 1;  // random.randint(1, rows-4)
        const rc = Math.floor(Math.random() * (cols - 4)) + 1;  // random.randint(1, cols-4)
        const drRange = Math.floor(Math.random() * 3) + 2;      // random.randint(2,4)
        const dcRange = Math.floor(Math.random() * 3) + 2;
        for (let dr = 0; dr < drRange; dr++) {
            for (let dc = 0; dc < dcRange; dc++) {
                if (rr + dr > 0 && rr + dr < rows - 1 && rc + dc > 0 && rc + dc < cols - 1) {
                    grid[rr + dr][rc + dc] = 1;
                }
            }
        }
    }

    return grid;
}

function runCSP(grid, start, goal) {
    // Generate CSP-specific dungeon using notebook's csp_generate_dungeon logic
    const cspGrid = cspGenerateDungeon(grid.length, grid[0].length, start, goal);
    const logs = [];
    let wallsPlaced = 0;
    let backtracks = 0;

    // Step 3: CSP wall placement with backtracking
    // floor_cells = [(rh, ch) for rh in range(rows) for ch in range(cols)
    //                if grid[rh][ch]==1 and (rh, ch)!=start and (rh, ch)!=goal]
    const floorCells = [];
    for (let r = 0; r < cspGrid.length; r++) {
        for (let c = 0; c < cspGrid[0].length; c++) {
            if (cspGrid[r][c] === 1
                && !(r === start[0] && c === start[1])
                && !(r === goal[0] && c === goal[1])) {
                floorCells.push([r, c]);
            }
        }
    }

    // random.shuffle(floor_cells)
    for (let i = floorCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [floorCells[i], floorCells[j]] = [floorCells[j], floorCells[i]];
    }

    // for (r, c) in floor_cells[:40]:  # try placing 40 extra walls
    const maxAttempts = Math.min(40, floorCells.length);
    for (let i = 0; i < maxAttempts; i++) {
        const [r, c] = floorCells[i];
        cspGrid[r][c] = 0;                  // Try placing wall
        if (bfsReachable(cspGrid, start, goal)) {
            // Wall placed — path still valid
            wallsPlaced++;
            logs.push({ type: 'placed', r, c });
        } else {
            // Constraint violated — backtracking!
            cspGrid[r][c] = 1;              // Remove wall
            backtracks++;
            logs.push({ type: 'backtrack', r, c });
        }
    }

    return { grid: cspGrid, logs, wallsPlaced, backtracks };
}


// ===========================================
// ALGORITHM 7: K-Means Clustering
// Source: Part 4 (22F1234_Part4.ipynb)
// Python: def kmeans_clustering(grid, k=3, max_iter=100)
// K-Means Unsupervised ML — divides open cells into K patrol zones.
// Uses Euclidean distance. Stops when centroids converge.
// Returns: (labels array, centroids, iterations)
// ===========================================
function runKMeans(grid, k = 3, maxIter = 100) {  // FIXED: was 50, notebook = 100
    // open_cells = np.array([(r, c) for r in range(len(grid))
    //                         for c in range(len(grid[0])) if grid[r][c] == 1])
    const openCells = [];
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
            if (grid[r][c] === 1) openCells.push([r, c]);
        }
    }

    if (openCells.length < k) return { labels: [], centroids: [], openCells: [], iterations: 0 };

    // Initialize centroids randomly from open cells
    // indices = np.random.choice(len(open_cells), k, replace=False)
    const indices = [];
    while (indices.length < k) {
        const idx = Math.floor(Math.random() * openCells.length);
        if (!indices.includes(idx)) indices.push(idx);
    }
    // centroids = open_cells[indices].astype(float)
    let centroids = indices.map(i => [openCells[i][0], openCells[i][1]]);
    let labels = new Array(openCells.length).fill(0);
    let iterations = 0;

    for (let iter = 0; iter < maxIter; iter++) {
        iterations = iter + 1;

        // Assign step — find closest centroid for each cell
        // dists = np.linalg.norm(open_cells[:, None] - centroids[None, :], axis=2)
        // new_labels = np.argmin(dists, axis=1)
        const newLabels = openCells.map(cell => {
            let minDist = Infinity, minK = 0;
            for (let ki = 0; ki < k; ki++) {
                // Euclidean distance: np.linalg.norm
                const dist = Math.sqrt(
                    Math.pow(cell[0] - centroids[ki][0], 2) +
                    Math.pow(cell[1] - centroids[ki][1], 2)
                );
                if (dist < minDist) { minDist = dist; minK = ki; }
            }
            return minK;
        });

        // Update step — recompute centroid as mean of cluster
        // new_centroids = np.array([
        //     open_cells[new_labels == ki].mean(axis=0) if (new_labels == ki).any()
        //     else centroids[ki]
        //     for ki in range(k)
        // ])
        const newCentroids = [];
        for (let ki = 0; ki < k; ki++) {
            const members = openCells.filter((_, i) => newLabels[i] === ki);
            if (members.length > 0) {
                const avgR = members.reduce((s, c) => s + c[0], 0) / members.length;
                const avgC = members.reduce((s, c) => s + c[1], 0) / members.length;
                newCentroids.push([avgR, avgC]);
            } else {
                newCentroids.push([...centroids[ki]]);
            }
        }

        // Check convergence: if np.allclose(new_centroids, centroids)
        let converged = true;
        for (let ki = 0; ki < k; ki++) {
            if (Math.abs(newCentroids[ki][0] - centroids[ki][0]) > 0.01 ||
                Math.abs(newCentroids[ki][1] - centroids[ki][1]) > 0.01) {
                converged = false;
                break;
            }
        }

        centroids = newCentroids;
        labels = newLabels;

        // Centroids converged — clustering complete
        if (converged) break;
    }

    return { labels, centroids, openCells, iterations };
}
