export class CollisionManager {
  constructor(scene) {
    this.scene = scene;
  }

  checkSnowballCollisions(snowballs, structure, npcs) {
    const toRemove = [];

    for (const snowball of snowballs) {
      if (!snowball.active) continue;

      const snowballBounds = snowball.getBounds();

      const placedBlock = this.checkStructureHit(snowballBounds, structure);
      if (placedBlock) {
        snowball.hitTarget();
        const block = placedBlock.block;
        const remainingHealth = block.takeDamage(1);
        if (remainingHealth <= 0) {
          structure.removeBlock(block);
        }
        toRemove.push(snowball);
        continue;
      }
    }

    return toRemove;
  }

  checkStructureHit(snowballBounds, structure) {
    for (const placedBlock of structure.placedBlocks) {
      for (const cell of placedBlock.cells) {
        const cellX = structure.x + cell.x * structure.cellSize;
        const cellY = structure.y + cell.y * structure.cellSize;
        const cellRect = new Phaser.Geom.Rectangle(
          cellX,
          cellY,
          structure.cellSize,
          structure.cellSize
        );

        if (
          Phaser.Geom.Intersects.CircleToRectangle(snowballBounds, cellRect)
        ) {
          return placedBlock;
        }
      }
    }
    return null;
  }

  checkBlockHitsNPC(block, npcs) {
    const blockBounds = new Phaser.Geom.Rectangle(
      block.x - block.width / 2,
      block.y - block.height / 2,
      block.width,
      block.height
    );

    for (const npc of npcs) {
      if (npc.isKnockedOut) continue;

      const npcBounds = npc.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(blockBounds, npcBounds)) {
        return npc;
      }
    }

    return null;
  }

  isPointInStructure(x, y, structure) {
    const bounds = structure.getBounds();
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }
}
