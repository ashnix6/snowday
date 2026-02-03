export class Block extends Phaser.GameObjects.Container {
    constructor(scene, x, y, shape, color, cellSize = 32) {
        super(scene, x, y);

        this.scene = scene;
        this.shape = shape;
        this.color = color;
        this.cellSize = cellSize;
        this.cells = [];
        this.isDragging = false;
        this.isPlaced = false;
        this.health = 3;
        this.maxHealth = 3;

        this.createVisual();
        this.setSize(this.width, this.height);
        this.setInteractive({ useHandCursor: true });
        this.setInHandStyle();
        this.setDepth(100);

        scene.add.existing(this);
    }

    createVisual() {
        this.cells.forEach(cell => cell.destroy());
        this.cells = [];

        const rows = this.shape.length;
        const cols = this.shape[0].length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.shape[r][c] === 1) {
                    const cell = this.createCell(
                        c * this.cellSize - (cols * this.cellSize) / 2 + this.cellSize / 2,
                        r * this.cellSize - (rows * this.cellSize) / 2 + this.cellSize / 2
                    );
                    this.cells.push(cell);
                    this.add(cell);
                }
            }
        }

        this.width = cols * this.cellSize;
        this.height = rows * this.cellSize;
        if (this.isPlaced) this.setHealthStyle(this.health);
        else this.setInHandStyle();
    }

    createCell(x, y) {
        // Use Graphics for consistent stroke rendering (matches grid outline)
        const brickSize = this.cellSize - 4;
        const halfBrick = brickSize / 2;

        const graphics = this.scene.add.graphics();
        graphics.setPosition(x, y);

        // Draw shadow
        const highlightOffset = Math.round(this.cellSize / 6);
        const highlightSize = Math.round(this.cellSize / 3);
        graphics.fillStyle(0x4a90d9, 0.3);
        graphics.fillRect(
            highlightOffset - highlightSize / 2,
            highlightOffset - highlightSize / 2,
            highlightSize,
            highlightSize
        );

        // Draw main brick (fill then stroke)
        graphics.fillStyle(this.color, 1);
        graphics.fillRect(-halfBrick, -halfBrick, brickSize, brickSize);
        graphics.lineStyle(2, 0x4a90d9, 1);
        graphics.strokeRect(-halfBrick, -halfBrick, brickSize, brickSize);

        // Draw highlight
        graphics.fillStyle(0xFFFFFF, 0.4);
        graphics.fillRect(
            -highlightOffset - highlightSize / 2,
            -highlightOffset - highlightSize / 2,
            highlightSize,
            highlightSize
        );

        // Store references for color changes
        graphics._brickSize = brickSize;
        graphics._halfBrick = halfBrick;
        graphics._highlightOffset = highlightOffset;
        graphics._highlightSize = highlightSize;
        graphics._fillColor = this.color;
        graphics._strokeColor = 0x4a90d9;

        return graphics;
    }

    rotate() {
        const rows = this.shape.length;
        const cols = this.shape[0].length;
        const newShape = [];

        for (let c = 0; c < cols; c++) {
            newShape[c] = [];
            for (let r = rows - 1; r >= 0; r--) {
                newShape[c][rows - 1 - r] = this.shape[r][c];
            }
        }

        this.shape = newShape;
        this.createVisual();
    }

    getGridCells(gridX, gridY, cellSize) {
        const cells = [];
        const rows = this.shape.length;
        const cols = this.shape[0].length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.shape[r][c] === 1) {
                    cells.push({ x: gridX + c, y: gridY + r });
                }
            }
        }

        return cells;
    }

    blendColor(base, tint) {
        const r = Math.min(255, ((base >> 16) & 0xFF) * ((tint >> 16) & 0xFF) / 255);
        const g = Math.min(255, ((base >> 8) & 0xFF) * ((tint >> 8) & 0xFF) / 255);
        const b = Math.min(255, (base & 0xFF) * (tint & 0xFF) / 255);
        return (r << 16) | (g << 8) | b;
    }

    setCellFillColor(color) {
        this.cells.forEach(cell => {
            if (cell._fillColor !== undefined) {
                cell._fillColor = color;
                this.redrawCell(cell);
            }
        });
    }

    setCellStrokeColor(color) {
        this.cells.forEach(cell => {
            if (cell._strokeColor !== undefined) {
                cell._strokeColor = color;
                this.redrawCell(cell);
            }
        });
    }

    redrawCell(graphics) {
        const halfBrick = graphics._halfBrick;
        const brickSize = graphics._brickSize;
        const highlightOffset = graphics._highlightOffset;
        const highlightSize = graphics._highlightSize;

        graphics.clear();

        // Draw shadow
        graphics.fillStyle(0x4a90d9, 0.3);
        graphics.fillRect(
            highlightOffset - highlightSize / 2,
            highlightOffset - highlightSize / 2,
            highlightSize,
            highlightSize
        );

        // Draw main brick
        graphics.fillStyle(graphics._fillColor, 1);
        graphics.fillRect(-halfBrick, -halfBrick, brickSize, brickSize);
        graphics.lineStyle(2, graphics._strokeColor, 1);
        graphics.strokeRect(-halfBrick, -halfBrick, brickSize, brickSize);

        // Draw highlight
        graphics.fillStyle(0xFFFFFF, 0.4);
        graphics.fillRect(
            -highlightOffset - highlightSize / 2,
            -highlightOffset - highlightSize / 2,
            highlightSize,
            highlightSize
        );
    }

    setInHandStyle() {
        this.setCellFillColor(this.blendColor(this.color, 0xFFE080));
        this.setCellStrokeColor(0xFFD700);
    }

    setPlacedStyle() {
        this.setCellFillColor(this.color);
        this.setCellStrokeColor(0x4a90d9);
    }

    setHealthStyle(health) {
        this.health = health;
        const tint = health >= 3 ? 0xB8FFB8 : health === 2 ? 0xFFFFB8 : 0xFFB8B8;
        const strokeColor = health >= 3 ? 0x00AA00 : health === 2 ? 0xCCAA00 : 0xCC0000;
        this.setCellFillColor(this.blendColor(this.color, tint));
        this.setCellStrokeColor(strokeColor);
    }

    takeDamage(amount) {
        if (!this.isPlaced) return this.health;
        this.health = Math.max(0, this.health - amount);
        if (this.health > 0) this.setHealthStyle(this.health);
        return this.health;
    }

    setHighlight(enabled) {
        const tint = enabled ? 0xA0FFA0 : (this.isPlaced ? (this.health >= 3 ? 0xB8FFB8 : this.health === 2 ? 0xFFFFB8 : 0xFFB8B8) : 0xFFE080);
        const strokeColor = enabled ? 0x00FF00 : (this.isPlaced ? (this.health >= 3 ? 0x00AA00 : this.health === 2 ? 0xCCAA00 : 0xCC0000) : 0xFFD700);
        this.setCellFillColor(this.blendColor(this.color, tint));
        this.setCellStrokeColor(strokeColor);
    }

    flash(color = 0xFF0000) {
        const originalColors = this.cells.map(cell => cell._fillColor);
        this.setCellFillColor(color);
        if (this._flashTimer) this._flashTimer.remove();
        this._flashTimer = this.scene.time.delayedCall(300, () => {
            this._flashTimer = null;
            if (!this.scene || !this.cells) return;
            this.cells.forEach((cell, i) => {
                cell._fillColor = originalColors[i];
                this.redrawCell(cell);
            });
        });
    }

    destroy() {
        if (this._flashTimer) {
            this._flashTimer.remove();
            this._flashTimer = null;
        }
        this.cells.forEach(cell => {
            if (cell && cell.destroy) cell.destroy();
        });
        super.destroy();
    }
}
