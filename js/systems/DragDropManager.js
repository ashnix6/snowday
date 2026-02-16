export class DragDropManager {
    constructor(scene) {
        this.scene = scene;
        this.draggedBlock = null;
        this.originalPosition = { x: 0, y: 0 };
        this._attachJustHappened = false;
        this._pendingPlace = false;

        this.setupInput();
    }

    setupInput() {
        this.scene.input.on('pointerdown', this.onPointerDown, this);
        this.scene.input.on('pointerup', this.onPointerUp, this);
        this.scene.input.on('wheel', this.onWheel, this);
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    onPointerDown(pointer) {
        if (this.draggedBlock) {
            this._pendingPlace = true;
            return;
        }

        const under = this.scene.input.hitTestPointer(pointer);

        let block = (under || []).find(
            obj => this.scene.heldBlocks && this.scene.heldBlocks.includes(obj) && !obj.isPlaced
        );
        if (block) {
            this.draggedBlock = block;
            this.originalPosition = { x: block.x, y: block.y };
            block.setDepth(1000);
            block.isDragging = true;
            this._attachJustHappened = true;
            if (this.scene.removeDragPlaceHint) this.scene.removeDragPlaceHint();
            this.scene.tweens.add({
                targets: block,
                scale: 1.1,
                duration: 100
            });
            return;
        }

        const placedBlock = (under || []).find(
            obj => obj.isPlaced && this.scene.structure &&
                this.scene.structure.placedBlocks.some(pb => pb.block === obj)
        );
        if (placedBlock) {
            if (pointer.button === 2) {
                if (this.scene.pickUpPlacedBlock(placedBlock)) {
                    this.draggedBlock = placedBlock;
                    this.originalPosition = { x: placedBlock.x, y: placedBlock.y };
                    placedBlock.setDepth(1000);
                    placedBlock.isDragging = true;
                    this._attachJustHappened = true;
                    this.scene.tweens.add({
                        targets: placedBlock,
                        scale: 1.1,
                        duration: 100
                    });
                }
            } else if (pointer.button === 0) {
                this.scene.strengthenPlacedBlock(placedBlock);
            }
        }
    }

    update() {
        if (!this.draggedBlock || !this.draggedBlock.isDragging) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.scene.spawnBlock();
            }
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.draggedBlock.rotate();
        }

        const pointer = this.scene.input.activePointer;
        const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.draggedBlock.x = world.x;
        this.draggedBlock.y = world.y;

        const overDiscard = this.isInDiscardZone(world.x, world.y);
        this.draggedBlock.setDiscardPreview(overDiscard);

        if (overDiscard) {
            this.draggedBlock.setHighlight(false);
            if (this.scene.structure) this.scene.structure.clearPlacementPreview();
        } else if (this.scene.structure) {
            const canPlace = this.scene.structure.canPlaceBlock(
                this.draggedBlock, world.x, world.y
            );
            this.draggedBlock.setHighlight(canPlace);
            this.scene.structure.setPlacementPreview(
                this.draggedBlock, world.x, world.y
            );
        }
    }

    onPointerUp(pointer) {
        if (!this.draggedBlock || !this.draggedBlock.isDragging) return;

        if (this._attachJustHappened) {
            this._attachJustHappened = false;
            return;
        }

        if (!this._pendingPlace) return;
        this._pendingPlace = false;

        const gameObject = this.draggedBlock;
        gameObject.isDragging = false;
        gameObject.setDiscardPreview(false);
        gameObject.setHighlight(false);
        if (this.scene.structure) this.scene.structure.clearPlacementPreview();

        const world = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const dropResult = this.scene.handleBlockDrop(gameObject, pointer, world);

        if (dropResult.handled) {
            gameObject.setScale(1);
            this.draggedBlock = null;
            return;
        }

        this.scene.tweens.add({
            targets: gameObject,
            scale: 1,
            duration: 100
        });

        if (this.isInDiscardZone(world.x, world.y)) {
            this.discardBlock(gameObject);
        } else {
            this.returnToOriginal(gameObject);
        }

        this.draggedBlock = null;
    }

    onWheel(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        if (this.draggedBlock && this.draggedBlock.isDragging) {
            this.draggedBlock.rotate();
        }
    }

    isInDiscardZone(worldX, worldY) {
        const discardZone = this.scene.discardZone;
        if (!discardZone) return false;

        return worldX >= discardZone.x &&
               worldX <= discardZone.x + discardZone.width &&
               worldY >= discardZone.y &&
               worldY <= discardZone.y + discardZone.height;
    }

    discardBlock(block) {
        this.scene.tweens.add({
            targets: block,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                const index = this.scene.heldBlocks.indexOf(block);
                if (index > -1) {
                    this.scene.heldBlocks.splice(index, 1);
                }
                block.destroy();
            }
        });
    }

    returnToOriginal(block) {
        block.setDepth(100);
        this.scene.tweens.add({
            targets: block,
            x: this.originalPosition.x,
            y: this.originalPosition.y,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    destroy() {
        this.scene.input.off('pointerdown', this.onPointerDown, this);
        this.scene.input.off('pointerup', this.onPointerUp, this);
        this.scene.input.off('wheel', this.onWheel, this);
    }
}
