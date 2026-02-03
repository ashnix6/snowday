export class Structure {
  constructor(scene, outline, x, y, cellSize = 32) {
    this.scene = scene;
    this.outline = outline;
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.cellSize = cellSize;
    this.filledCells = new Set();
    this.placedBlocks = [];
    this.ghostGraphics = null;
    this.filledGraphics = null;
    this.previewGraphics = null;

    this.totalCells = this.countTotalCells();
    this.createVisual();
  }

  /**
   * Update structure position (e.g. on viewport resize) so outline and grid stay aligned.
   */
  setPosition(x, y) {
    this.x = Math.round(x);
    this.y = Math.round(y);
  }

  countTotalCells() {
    let count = 0;
    for (let r = 0; r < this.outline.length; r++) {
      for (let c = 0; c < this.outline[r].length; c++) {
        if (this.outline[r][c] === 1) count++;
      }
    }
    return count;
  }

  createVisual() {
    if (this.ghostGraphics) this.ghostGraphics.destroy();
    if (this.filledGraphics) this.filledGraphics.destroy();
    if (this.previewGraphics) this.previewGraphics.destroy();

    this.ghostGraphics = this.scene.add.graphics();
    this.filledGraphics = this.scene.add.graphics();
    this.previewGraphics = this.scene.add.graphics();
    this.previewGraphics.setDepth(1);

    this.drawOutline();
  }

  drawOutline() {
    this.ghostGraphics.clear();
    this.ghostGraphics.lineStyle(2, 0x4a90d9, 0.9);
    // Draw full cell as ghost boundary so bricks (drawn smaller with stroke) fit inside without overlapping
    for (let r = 0; r < this.outline.length; r++) {
      for (let c = 0; c < this.outline[r].length; c++) {
        if (this.outline[r][c] === 1) {
          const cellX = this.x + c * this.cellSize;
          const cellY = this.y + r * this.cellSize;

          const key = `${c},${r}`;
          if (!this.filledCells.has(key)) {
            this.ghostGraphics.strokeRect(
              cellX,
              cellY,
              this.cellSize,
              this.cellSize
            );
          }
        }
      }
    }
  }

  getGridPosition(worldX, worldY) {
    const gridX = Math.floor((worldX - this.x) / this.cellSize);
    const gridY = Math.floor((worldY - this.y) / this.cellSize);
    return { gridX, gridY };
  }

  /**
   * Get the grid (col, row) for the block's top-left corner when the block center is at (worldX, worldY).
   * Uses structure origin (this.x, this.y) so grid matches the drawn outline exactly.
   */
  getBlockGridPosition(block, worldX, worldY) {
    const cols = block.shape[0].length;
    const rows = block.shape.length;
    const blockW = cols * this.cellSize;
    const blockH = rows * this.cellSize;
    const topLeftWorldX = worldX - blockW / 2;
    const topLeftWorldY = worldY - blockH / 2;
    const gridX = Math.floor((topLeftWorldX - this.x) / this.cellSize);
    const gridY = Math.floor((topLeftWorldY - this.y) / this.cellSize);
    return { gridX, gridY };
  }

  canPlaceBlock(block, worldX, worldY) {
    const result = this.getBestPlacement(block, worldX, worldY);
    return result !== null;
  }

  /**
   * Try (gridX, gridY) and nearby positions; return the valid placement whose snapped
   * position is closest to (worldX, worldY), so snapping follows bottom/left/right/top
   * when the brick is closer to those edges.
   */
  getBestPlacement(block, worldX, worldY) {
    const { gridX, gridY } = this.getBlockGridPosition(block, worldX, worldY);
    const blockW = block.shape[0].length * this.cellSize;
    const blockH = block.shape.length * this.cellSize;
    const radius = 1;
    let best = null;
    let bestDistSq = Infinity;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const gx = gridX + dx;
        const gy = gridY + dy;
        if (!this.isValidPlacement(block, gx, gy)) continue;
        const snappedX = this.x + gx * this.cellSize + blockW / 2;
        const snappedY = this.y + gy * this.cellSize + blockH / 2;
        const distSq = (worldX - snappedX) ** 2 + (worldY - snappedY) ** 2;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          best = { gridX: gx, gridY: gy };
        }
      }
    }
    return best;
  }

  isValidPlacement(block, gridX, gridY) {
    const cells = block.getGridCells(gridX, gridY, this.cellSize);
    for (const cell of cells) {
      if (
        cell.y < 0 ||
        cell.y >= this.outline.length ||
        cell.x < 0 ||
        cell.x >= this.outline[0].length
      ) {
        return false;
      }
      if (this.outline[cell.y][cell.x] !== 1) {
        return false;
      }
      const key = `${cell.x},${cell.y}`;
      if (this.filledCells.has(key)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Show exactly where the block will land: draw the block shape outline (per cell), not a single rectangle.
   */
  setPlacementPreview(block, worldX, worldY) {
    this.previewGraphics.clear();
    const placement = this.getBestPlacement(block, worldX, worldY);
    if (!placement) return;
    const { gridX, gridY } = placement;
    const blockW = block.shape[0].length * this.cellSize;
    const blockH = block.shape.length * this.cellSize;
    const left = this.x + gridX * this.cellSize;
    const top = this.y + gridY * this.cellSize;
    const inset = 2;
    const brickSize = this.cellSize - 4;
    this.previewGraphics.fillStyle(0x00dd00, 0.45);
    this.previewGraphics.lineStyle(2, 0x00ff00, 0.95);
    for (let r = 0; r < block.shape.length; r++) {
      for (let c = 0; c < block.shape[r].length; c++) {
        if (block.shape[r][c] === 1) {
          const cellX = left + c * this.cellSize + inset;
          const cellY = top + r * this.cellSize + inset;
          this.previewGraphics.fillRect(cellX, cellY, brickSize, brickSize);
          this.previewGraphics.strokeRect(cellX, cellY, brickSize, brickSize);
        }
      }
    }
  }

  clearPlacementPreview() {
    if (this.previewGraphics) this.previewGraphics.clear();
  }

  placeBlock(block, worldX, worldY) {
    const placement = this.getBestPlacement(block, worldX, worldY);
    if (!placement) return false;
    const { gridX, gridY } = placement;
    const cells = block.getGridCells(gridX, gridY, this.cellSize);

    const placedBlock = {
      block: block,
      cells: cells.map((c) => ({ ...c })),
    };

    for (const cell of cells) {
      const key = `${cell.x},${cell.y}`;
      this.filledCells.add(key);
    }

    this.placedBlocks.push(placedBlock);

    const blockW = block.shape[0].length * this.cellSize;
    const blockH = block.shape.length * this.cellSize;
    const snappedX = Math.round(this.x + gridX * this.cellSize + blockW / 2);
    const snappedY = Math.round(this.y + gridY * this.cellSize + blockH / 2);
    block.x = snappedX;
    block.y = snappedY;
    block.isPlaced = true;
    block.health = 3;
    block.maxHealth = 3;
    block.setHealthStyle(3);
    block.setDepth(10);

    this.drawOutline();
    this.createFilledEffect(cells);

    return true;
  }

  createFilledEffect(cells) {
    for (const cell of cells) {
      const worldX = this.x + cell.x * this.cellSize + this.cellSize / 2;
      const worldY = this.y + cell.y * this.cellSize + this.cellSize / 2;

      for (let i = 0; i < 5; i++) {
        const particle = this.scene.add.circle(
          worldX + Phaser.Math.Between(-10, 10),
          worldY + Phaser.Math.Between(-10, 10),
          Phaser.Math.Between(2, 5),
          0xffffff
        );

        this.scene.tweens.add({
          targets: particle,
          y: particle.y - Phaser.Math.Between(20, 40),
          alpha: 0,
          scale: 0,
          duration: 500,
          onComplete: () => particle.destroy(),
        });
      }
    }
  }

  removeBlock(block) {
    const index = this.placedBlocks.findIndex((pb) => pb.block === block);
    if (index === -1) return;

    const placedBlock = this.placedBlocks[index];
    for (const cell of placedBlock.cells) {
      const key = `${cell.x},${cell.y}`;
      this.filledCells.delete(key);
    }

    this.placedBlocks.splice(index, 1);
    block.destroy();
    this.drawOutline();
  }

  /**
   * Remove block from structure without destroying it (so it can be moved/replaced).
   */
  unplaceBlock(block) {
    const index = this.placedBlocks.findIndex((pb) => pb.block === block);
    if (index === -1) return false;

    const placedBlock = this.placedBlocks[index];
    for (const cell of placedBlock.cells) {
      const key = `${cell.x},${cell.y}`;
      this.filledCells.delete(key);
    }
    this.placedBlocks.splice(index, 1);
    this.drawOutline();
    return true;
  }

  /**
   * Get grid cell coordinates (x, y) for a shape when its top-left is at (gridX, gridY).
   */
  getCellsFromShape(shape, gridX, gridY) {
    const cells = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          cells.push({ x: gridX + c, y: gridY + r });
        }
      }
    }
    return cells;
  }

  /**
   * Check if a raw shape can be placed at (gridX, gridY) without overlapping outline or filled cells.
   */
  isShapePlacementValid(shape, gridX, gridY) {
    const cells = this.getCellsFromShape(shape, gridX, gridY);
    const cols = this.outline[0].length;
    const rows = this.outline.length;
    for (const cell of cells) {
      if (cell.y < 0 || cell.y >= rows || cell.x < 0 || cell.x >= cols) {
        return false;
      }
      if (this.outline[cell.y][cell.x] !== 1) {
        return false;
      }
      const key = `${cell.x},${cell.y}`;
      if (this.filledCells.has(key)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Return a new shape rotated 90° clockwise (does not mutate original).
   */
  static rotateShapeCopy(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const out = [];
    for (let c = 0; c < cols; c++) {
      out[c] = [];
      for (let r = rows - 1; r >= 0; r--) {
        out[c][rows - 1 - r] = shape[r][c];
      }
    }
    return out;
  }

  /**
   * Get tetromino keys that have at least one valid placement in the current empty cells.
   * Used to bias block spawns when progress is high.
   */
  getUsefulTetrominoKeys(tetrominoes) {
    const keys = Object.keys(tetrominoes);
    const cols = this.outline[0].length;
    const rows = this.outline.length;
    const useful = [];

    for (const key of keys) {
      let shape = tetrominoes[key].shape.map((row) => [...row]);
      let found = false;
      for (let rot = 0; rot < 4 && !found; rot++) {
        const w = shape[0].length;
        const h = shape.length;
        for (let gy = 0; gy <= rows - h && !found; gy++) {
          for (let gx = 0; gx <= cols - w && !found; gx++) {
            if (this.isShapePlacementValid(shape, gx, gy)) {
              found = true;
              useful.push(key);
            }
          }
        }
        shape = Structure.rotateShapeCopy(shape);
      }
    }
    return useful;
  }

  getCompletion() {
    return this.filledCells.size / this.totalCells;
  }

  isComplete() {
    return this.filledCells.size >= this.totalCells;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.outline[0].length * this.cellSize,
      height: this.outline.length * this.cellSize,
    };
  }

  getRandomPlacedBlock() {
    if (this.placedBlocks.length === 0) return null;
    return this.placedBlocks[
      Phaser.Math.Between(0, this.placedBlocks.length - 1)
    ];
  }

  destroy() {
    if (this.ghostGraphics) this.ghostGraphics.destroy();
    if (this.filledGraphics) this.filledGraphics.destroy();
    if (this.previewGraphics) this.previewGraphics.destroy();
    this.placedBlocks.forEach((pb) => pb.block.destroy());
  }
}
