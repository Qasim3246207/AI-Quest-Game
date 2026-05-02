# ⚔️ AI Quest Game — Visualization of AI Algorithms in Dungeon Pathfinding

Interactive web-based visualization of 7 AI algorithms solving dungeon pathfinding problems.

## 🎮 Algorithms

| # | Algorithm | Type | Source |
|---|-----------|------|--------|
| 1 | **BFS** (Breadth-First Search) | Uninformed Search | Part 1 |
| 2 | **DFS** (Depth-First Search) | Uninformed Search | Part 1 |
| 3 | **A*** (A-Star Search) | Informed Search | Part 2 |
| 4 | **Hill Climbing** | Local Search | Part 2 |
| 5 | **Minimax** | Adversarial Search | Part 3 |
| 6 | **CSP** (Constraint Satisfaction) | Backtracking | Part 3 |
| 7 | **K-Means Clustering** | Unsupervised ML | Part 4 |

## 🚀 Run Web UI

```bash
npx -y serve web -l 3000
```

Then open **http://localhost:3000**

## 📁 Project Structure

```
├── 22F1234_Part1.ipynb    # BFS, DFS, helpers, dungeon generation
├── 22F1234_Part2.ipynb    # A*, Hill Climbing
├── 22F1234_Part3.ipynb    # Minimax, CSP
├── 22F1234_Part4.ipynb    # K-Means, UI widgets
├── Main_UI.ipynb          # Combined matplotlib dashboard
└── web/
    ├── index.html         # Main HTML structure
    ├── index.css          # Dark dungeon theme styling
    ├── algorithms.js      # All 7 algorithms (JS port of notebooks)
    ├── renderer.js        # Canvas rendering engine
    └── app.js             # Application controller & animations
```