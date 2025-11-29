/**
 * Luminous Echo Grid
 * A sophisticated, breathing grid animation for the hero section
 * Inspired by neural networks and bioluminescent systems
 */

class LuminousEchoGrid {
    constructor() {
        this.canvas = document.getElementById('luminousGridCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.pixelRatio = window.devicePixelRatio || 1;

        // Grid configuration
        this.gridSize = 120; // HUGE grid cells
        this.gridColor = 'rgba(255, 255, 255, 0.25)'; // Much brighter white
        this.glowColor = 'rgba(0, 200, 255, '; // Bright cyan glow

        // State management
        this.cells = new Map(); // Track cell glow states
        this.awakingCells = new Set(); // Cells currently waking up
        this.propagatingPaths = []; // Active propagation paths
        this.lastAwakeTime = 0;
        this.awakeInterval = 4000; // 4 seconds between awakenings (MORE FREQUENT)
        this.dormancyVariance = 2000; // ±2 seconds randomness

        // Mouse tracking
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseActive = false;

        // Setup
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeGrid();
        this.animate();
    }

    setupCanvas() {
        this.canvas.width = this.width * this.pixelRatio;
        this.canvas.height = this.height * this.pixelRatio;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.mouseActive = false);
        this.canvas.addEventListener('mouseenter', () => this.mouseActive = true);
    }

    initializeGrid() {
        const colsCount = Math.ceil(this.width / this.gridSize) + 1;
        const rowsCount = Math.ceil(this.height / this.gridSize) + 1;

        for (let row = 0; row < rowsCount; row++) {
            for (let col = 0; col < colsCount; col++) {
                const key = `${row},${col}`;
                this.cells.set(key, {
                    row,
                    col,
                    x: col * this.gridSize,
                    y: row * this.gridSize,
                    glow: 0, // Current glow intensity (0-1)
                    targetGlow: 0, // Target glow intensity
                    awakening: false
                });
            }
        }
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.setupCanvas();
        this.cells.clear();
        this.awakingCells.clear();
        this.propagatingPaths = [];
        this.initializeGrid();
    }

    onMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.mouseActive = true;
    }

    /**
     * Main animation loop using requestAnimationFrame
     */
    animate() {
        const now = Date.now();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw base grid
        this.drawBaseGrid();

        // Update cell states
        this.updateCells();

        // Handle awakening events (dormancy -> awakening)
        this.handleAwakening(now);

        // Handle propagation
        this.updatePropagation();

        // Draw glowing cells
        this.drawGlowingCells();

        // Continue animation
        requestAnimationFrame(() => this.animate());
    }

    /**
     * Draw the faint base grid structure
     */
    drawBaseGrid() {
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;

        const colsCount = Math.ceil(this.width / this.gridSize) + 1;
        const rowsCount = Math.ceil(this.height / this.gridSize) + 1;

        // Vertical lines
        for (let col = 0; col < colsCount; col++) {
            const x = col * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let row = 0; row < rowsCount; row++) {
            const y = row * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Handle periodic awakening events
     */
    handleAwakening(now) {
        // Check if it's time to awaken a new cell
        if (now - this.lastAwakeTime > this.awakeInterval) {
            this.lastAwakeTime = now;

            // Add randomness to next awakening
            this.awakeInterval = 12000 + (Math.random() - 0.5) * this.dormancyVariance;

            // Select a random cell to awaken
            const cellArray = Array.from(this.cells.values());
            const randomCell = cellArray[Math.floor(Math.random() * cellArray.length)];

            if (randomCell) {
                randomCell.awakening = true;
                randomCell.targetGlow = 1.0; // Maximum glow
                this.awakingCells.add(`${randomCell.row},${randomCell.col}`);

                // Start propagation from this cell
                this.startPropagation(randomCell.row, randomCell.col);
            }
        }
    }

    /**
     * Start propagation from a given cell
     */
    startPropagation(startRow, startCol) {
        const maxDistance = Math.floor(Math.random() * 3) + 3; // Propagate 3-6 cells
        const direction = Math.floor(Math.random() * 4); // 0=up, 1=right, 2=down, 3=left

        const path = {
            cells: [],
            progress: 0,
            speed: 0.04 + Math.random() * 0.05, // FASTER propagation
            currentDistance: 0,
            maxDistance: maxDistance,
            direction: direction,
            startRow: startRow,
            startCol: startCol
        };

        // Pre-calculate path
        let row = startRow;
        let col = startCol;
        const dr = [-1, 0, 1, 0][direction];
        const dc = [0, 1, 0, -1][direction];

        // Sometimes allow multi-directional spread
        const multiDir = Math.random() < 0.3;

        for (let i = 0; i < maxDistance; i++) {
            const key = `${row},${col}`;
            if (this.cells.has(key)) {
                path.cells.push({ row, col, intensity: 1 - (i / maxDistance) });
            }
            row += dr;
            col += dc;

            // Occasionally branch off
            if (multiDir && Math.random() < 0.4) {
                const branchDir = direction + (Math.random() < 0.5 ? 1 : -1);
                const nDr = [-1, 0, 1, 0][branchDir % 4];
                const nDc = [0, 1, 0, -1][branchDir % 4];
                row += nDr;
                col += nDc;
            }
        }

        this.propagatingPaths.push(path);
    }

    /**
     * Update all active propagations
     */
    updatePropagation() {
        this.propagatingPaths = this.propagatingPaths.filter(path => {
            path.progress += path.speed;

            if (path.progress < 1) {
                // Apply glow to cells along the path
                const pathIndex = Math.floor(path.progress * path.cells.length);
                for (let i = 0; i <= pathIndex; i++) {
                    const cell = path.cells[i];
                    const key = `${cell.row},${cell.col}`;
                    if (this.cells.has(key)) {
                        const gridCell = this.cells.get(key);
                        const fadeOut = Math.max(0, 1 - ((path.progress - (i / path.cells.length)) * 3));
                        gridCell.targetGlow = Math.max(gridCell.targetGlow, cell.intensity * fadeOut * 0.7);
                    }
                }
                return true;
            }
            return false;
        });
    }

    /**
     * Update individual cell glow states (smooth transitions)
     */
    updateCells() {
        const easing = 0.15; // Smoothing factor for glow transitions

        this.cells.forEach((cell, key) => {
            // Smoothly transition glow to target
            cell.glow += (cell.targetGlow - cell.glow) * easing;

            // Prevent awakening cells from dropping too quickly
            if (cell.awakening && cell.glow < 0.1) {
                cell.awakening = false;
                cell.targetGlow = 0;
            }

            // Natural decay
            if (cell.glow > 0 && !cell.awakening && cell.targetGlow === 0) {
                cell.targetGlow = Math.max(0, cell.glow - 0.02);
            }
        });
    }

    /**
     * Draw cells with glow effect
     */
    drawGlowingCells() {
        this.cells.forEach((cell, key) => {
            if (cell.glow > 0.05) { // Only draw if glow is visible
                this.drawCellGlow(cell);
            }
        });
    }

    /**
     * Draw a single cell's glow with blur effect
     */
    drawCellGlow(cell) {
        const halfSize = this.gridSize / 2;
        const intensity = cell.glow;

        // Draw MASSIVE soft glow using multiple blurred circles
        for (let i = 5; i > 0; i--) {
            const blur = i * 25;
            const alpha = intensity * (1.0 / i);

            this.ctx.fillStyle = this.glowColor + alpha + ')';
            this.ctx.shadowColor = this.glowColor + '0.5)';
            this.ctx.shadowBlur = 60;

            this.ctx.beginPath();
            this.ctx.arc(
                cell.x + halfSize,
                cell.y + halfSize,
                this.gridSize + blur,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }

        // Reset
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        // Draw BRIGHT center point
        this.ctx.fillStyle = this.glowColor + (intensity * 1.5) + ')';
        this.ctx.beginPath();
        this.ctx.arc(cell.x + halfSize, cell.y + halfSize, 15, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new LuminousEchoGrid();
    });
} else {
    new LuminousEchoGrid();
}
