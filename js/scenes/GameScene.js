import { Block } from '../entities/Block.js';
import { Structure } from '../entities/Structure.js';
import { NPC } from '../entities/NPC.js';
import { BlockGenerator } from '../systems/BlockGenerator.js';
import { DragDropManager } from '../systems/DragDropManager.js';
import { CollisionManager } from '../systems/CollisionManager.js';
import { OUTLINES, TETROMINOES } from '../levels/LevelData.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.currentLevel = data.level || 0;
    }

    create() {
        this.cellSize = 28;
        this.heldBlocks = [];
        this.npcs = [];
        this.snowballs = [];
        this.chipCooldown = 0;
        this.maxHeldBlocks = 5;

        this.createBackground();
        this.createTerrain();
        this.createStructure();
        this.createNPCs();
        this.createNPCClouds();
        this.createUI();
        this.createDiscardZone();

        this.blockGenerator = new BlockGenerator(this, this.cellSize);
        this.dragDropManager = new DragDropManager(this);
        this.collisionManager = new CollisionManager(this);

        this.createSnowfall();

        this.blocksCreated = 0;
        this.spawnInitialBlock();
        this.createTutorial();
    }

    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x2a4a6a, 0x2a4a6a);
        graphics.fillRect(0, 0, width, height);

        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height / 2);
            const size = Phaser.Math.Between(1, 2);
            const star = this.add.circle(x, y, size, 0xFFFFFF, Phaser.Math.FloatBetween(0.3, 0.8));
        }
    }

    createTerrain() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.terrainY = height - 80;
        this.terrainHeight = 80;

        this.terrainGraphics = this.add.graphics();
        this.drawTerrain();

        this.terrainZone = this.add.zone(width / 2, this.terrainY + this.terrainHeight / 2, width, this.terrainHeight);
        this.terrainZone.setInteractive();
        this.terrainZone.on('pointerdown', this.onTerrainClick, this);
    }

    drawTerrain() {
        const width = this.cameras.main.width;

        this.terrainGraphics.clear();

        this.terrainGraphics.fillStyle(0xE8F4F8);
        this.terrainGraphics.fillRect(0, this.terrainY, width, this.terrainHeight);

        this.terrainGraphics.fillStyle(0xD0E8F0);
        for (let x = 0; x < width; x += 40) {
            const waveHeight = Math.sin(x * 0.05) * 5 + 5;
            this.terrainGraphics.fillRect(x, this.terrainY, 20, waveHeight);
        }

        this.terrainGraphics.fillStyle(0xBED8E8);
        this.terrainGraphics.fillRect(0, this.terrainY + this.terrainHeight - 10, width, 10);
    }

    createStructure() {
        const outline = OUTLINES[this.currentLevel];
        const width = this.cameras.main.width;

        const structureWidth = outline.grid[0].length * this.cellSize;
        const structureHeight = outline.grid.length * this.cellSize;
        const structureX = (width - structureWidth) / 2;
        const structureY = this.terrainY - structureHeight - 40;

        this.structure = new Structure(this, outline.grid, structureX, structureY, this.cellSize);
    }

    createNPCs() {
        const outline = OUTLINES[this.currentLevel];
        const npcCount = outline.npcCount;
        const height = this.cameras.main.height;
        const width = this.cameras.main.width;

        for (let i = 0; i < npcCount; i++) {
            const leftY = this.terrainY - 50 - i * 80;
            const leftNPC = new NPC(this, 60, leftY, 'left');
            this.npcs.push(leftNPC);

            const rightY = this.terrainY - 50 - i * 80;
            const rightNPC = new NPC(this, width - 60, rightY, 'right');
            this.npcs.push(rightNPC);
        }
    }

    createNPCClouds() {
        const width = this.cameras.main.width;
        const cloudY = 90;
        const leftCenterX = 100;
        const rightCenterX = width - 100;
        const cloudRadius = 75;

        this.leftCloudZone = {
            x: leftCenterX - cloudRadius,
            y: cloudY - cloudRadius,
            width: cloudRadius * 2,
            height: cloudRadius * 2
        };
        this.rightCloudZone = {
            x: rightCenterX - cloudRadius,
            y: cloudY - cloudRadius,
            width: cloudRadius * 2,
            height: cloudRadius * 2
        };
        this.leftCloudCenter = { x: leftCenterX, y: cloudY };
        this.rightCloudCenter = { x: rightCenterX, y: cloudY };

        const drawCloud = (centerX) => {
            const g = this.add.graphics();
            g.fillStyle(0xE8F4F8, 0.95);
            g.lineStyle(2, 0xB8D4E8, 0.8);
            const r = 38;
            g.fillCircle(centerX - 35, cloudY, r);
            g.strokeCircle(centerX - 35, cloudY, r);
            g.fillCircle(centerX, cloudY - 25, r);
            g.strokeCircle(centerX, cloudY - 25, r);
            g.fillCircle(centerX + 35, cloudY, r);
            g.strokeCircle(centerX + 35, cloudY, r);
            g.fillCircle(centerX - 18, cloudY + 15, r * 0.85);
            g.strokeCircle(centerX - 18, cloudY + 15, r * 0.85);
            g.fillCircle(centerX + 18, cloudY + 15, r * 0.85);
            g.strokeCircle(centerX + 18, cloudY + 15, r * 0.85);
        };

        drawCloud(leftCenterX);
        drawCloud(rightCenterX);

        }

    createUI() {
        const width = this.cameras.main.width;
        const outline = OUTLINES[this.currentLevel];

        this.levelText = this.add.text(width / 2, 20, `Level ${this.currentLevel + 1}: ${outline.name}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.statusLineText = this.add.text(width / 2, 52, 'Progress: 0%  ·  Blocks: 0/5', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#b8d4e8'
        }).setOrigin(0.5, 0);

        this.progressBar = this.add.graphics();
        this.updateProgressBar();
    }

    updateProgressBar() {
        const width = this.cameras.main.width;
        const progress = this.structure.getCompletion();

        this.progressBar.clear();

        this.progressBar.fillStyle(0x333333);
        this.progressBar.fillRect(width / 2 - 100, 72, 200, 15);

        this.progressBar.fillStyle(0x4a90d9);
        this.progressBar.fillRect(width / 2 - 100, 72, 200 * progress, 15);

        this.progressBar.lineStyle(2, 0xffffff);
        this.progressBar.strokeRect(width / 2 - 100, 72, 200, 15);

        this.statusLineText.setText(`Progress: ${Math.round(progress * 100)}%  ·  Blocks: ${this.heldBlocks.length}/${this.maxHeldBlocks}`);
    }

    createDiscardZone() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const zoneW = 80;
        const zoneH = 70;
        const w = 24;
        const h = 32;
        const lidH = 6;
        const marginBottom = 8;
        // Bottom-align: bottom of can (body) at marginBottom above bottom of screen
        const cy = height - marginBottom + lidH;
        const cx = width / 2;

        this.discardZone = {
            x: cx - zoneW / 2,
            y: cy - zoneH / 2,
            width: zoneW,
            height: zoneH
        };

        const g = this.add.graphics();
        g.fillStyle(0xCC2222, 0.95);
        g.fillRect(cx - w / 2, cy - lidH - h, w, h);
        g.fillStyle(0xDD3333, 0.95);
        g.fillRect(cx - w / 2 - 2, cy - lidH - h - lidH, w + 4, lidH);
        g.lineStyle(1, 0x991111);
        g.strokeRect(cx - w / 2, cy - lidH - h, w, h);
        g.strokeRect(cx - w / 2 - 2, cy - lidH - h - lidH, w + 4, lidH);
        this.add.text(cx, cy - lidH - h / 2, '♻', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    createSnowfall() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(-height, 0);
            const size = Phaser.Math.Between(1, 3);

            const snowflake = this.add.circle(x, y, size, 0xFFFFFF, 0.6);
            snowflake.setDepth(-1);

            this.tweens.add({
                targets: snowflake,
                y: height + 50,
                x: snowflake.x + Phaser.Math.Between(-30, 30),
                duration: Phaser.Math.Between(4000, 10000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000),
                onRepeat: () => {
                    snowflake.x = Phaser.Math.Between(0, width);
                    snowflake.y = -20;
                }
            });
        }
    }

    spawnInitialBlock() {
        if (this.heldBlocks.length >= this.maxHeldBlocks) return;

        const bounds = this.structure.getBounds();
        const minMargin = bounds.width / 2;
        const spawnX = bounds.x - minMargin;
        const startY = this.terrainY;
        const endY = this.terrainY - 60;

        const block = this.blockGenerator.generateRandomBlock(spawnX, startY, {});
        this.heldBlocks.push(block);

        block.setScale(0);
        this.tweens.add({ targets: block, scale: 1, duration: 150, ease: 'Back.easeOut' });
        this.tweens.add({ targets: block, x: spawnX, y: endY, duration: 450, ease: 'Sine.easeInOut' });
        this.updateBlocksText();
    }

    createTutorial() {
        this.tutorialLayer = this.add.container(0, 0);
        this.tutorialLayer.setDepth(5000);
        this.tutorialLayer.setAlpha(0.9);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const textStyle = {
            fontSize: '12px',
            fontFamily: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive",
            color: '#ffffff',
            stroke: '#1a2a4a',
            strokeThickness: 3,
            align: 'center'
        };

        const drawChalkArrow = (fromX, fromY, toX, toY) => {
            const g = this.add.graphics();
            const steps = 10;
            const dx = (toX - fromX) / steps;
            const dy = (toY - fromY) / steps;
            const angle = Math.atan2(toY - fromY, toX - fromX);
            const headLen = 8;

            // Pre-compute jittered path so border and fill share the same shape
            const seed = fromX * 7 + fromY * 13;
            const pts = [{ x: fromX, y: fromY }];
            for (let i = 0; i < steps; i++) {
                const r1 = Math.sin(seed + i * 17.3) * 1.5;
                const r2 = Math.cos(seed + i * 23.7) * 1.5;
                pts.push({
                    x: fromX + dx * (i + 1) + r1,
                    y: fromY + dy * (i + 1) + r2
                });
            }

            // Dark border pass
            g.lineStyle(3, 0x1a2a4a, 0.6);
            for (let i = 0; i < pts.length - 1; i++) {
                g.lineBetween(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
            }
            g.lineBetween(toX, toY, toX + Math.cos(angle + 2.6) * headLen, toY + Math.sin(angle + 2.6) * headLen);
            g.lineBetween(toX, toY, toX + Math.cos(angle - 2.6) * headLen, toY + Math.sin(angle - 2.6) * headLen);

            // White chalk pass
            g.lineStyle(1.2, 0xFFFFFF, 0.85);
            for (let i = 0; i < pts.length - 1; i++) {
                g.lineBetween(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
            }
            g.lineBetween(toX, toY, toX + Math.cos(angle + 2.6) * headLen, toY + Math.sin(angle + 2.6) * headLen);
            g.lineBetween(toX, toY, toX + Math.cos(angle - 2.6) * headLen, toY + Math.sin(angle - 2.6) * headLen);

            return g;
        };

        const items = [];

        // 1. NPC - arrow at left NPC, label offset so it doesn't overlap
        const leftNpc = this.npcs.find(n => n.side === 'left');
        if (leftNpc) {
            const labelX = 15, labelY = leftNpc.y - 120;
            const g = drawChalkArrow(labelX + 50, labelY + 12, leftNpc.x + 20, leftNpc.y - 50);
            const t = this.add.text(labelX, labelY, 'Throws\nsnowballs!', textStyle).setOrigin(0, 1);
            items.push(g, t);
        }

        // 2. Snow ground - click to spawn blocks
        {
            const tx = width * 0.78, ty = this.terrainY - 8;
            const g = drawChalkArrow(tx, ty, tx - 15, this.terrainY + 12);
            const t = this.add.text(tx, ty - 5, 'Click for blocks', textStyle).setOrigin(0.5, 1);
            items.push(g, t);
        }

        // 3. Cloud - drop block to KO NPC, label well below cloud
        {
            const cx = width - 100, cy = 90;
            const g = drawChalkArrow(cx, cy + 80, cx, cy + 45);
            const t = this.add.text(cx, cy + 85, 'Drop to KO', textStyle).setOrigin(0.5, 0);
            items.push(g, t);
        }

        // 4. Spawned block - drag and place (removed on first drag)
        {
            const sb = this.structure.getBounds();
            const bx = sb.x - sb.width / 2;
            const by = this.terrainY - 55;
            const g = drawChalkArrow(bx - 50, by - 15, bx - 8, by);
            const t = this.add.text(bx - 55, by - 18, 'Drag & place', textStyle).setOrigin(1, 1);
            this.dragPlaceHint = { arrow: g, text: t };
            items.push(g, t);
        }

        // 5. Fill to win - arrow pointing at progress bar (y=72, centered)
        {
            const barX = width / 2 + 110;
            const barY = 79;
            const g = drawChalkArrow(barX + 45, barY, barX + 5, barY);
            const t = this.add.text(barX + 50, barY, 'Fill to win!', textStyle).setOrigin(0, 0.5);
            items.push(g, t);
        }

        // 6. Trash - discard blocks
        {
            const tx = width / 2 + 48, ty = height - 42;
            const g = drawChalkArrow(tx, ty, width / 2 + 16, ty + 3);
            const t = this.add.text(tx + 5, ty, 'Discard', textStyle).setOrigin(0, 0.5);
            items.push(g, t);
        }

        for (const item of items) {
            this.tutorialLayer.add(item);
        }
    }

    removeDragPlaceHint() {
        if (this.dragPlaceHint) {
            const { arrow, text } = this.dragPlaceHint;
            this.dragPlaceHint = null;
            this.tweens.add({ targets: arrow, alpha: 0, duration: 200, onComplete: () => arrow.destroy() });
            this.tweens.add({ targets: text, alpha: 0, duration: 200, onComplete: () => text.destroy() });
        }
    }

    fadeTutorial() {
        this.blocksCreated++;
        if (this.tutorialLayer && this.blocksCreated <= 10) {
            const alpha = Math.max(0, 0.9 * (1 - this.blocksCreated / 10));
            this.tweens.add({
                targets: this.tutorialLayer,
                alpha: alpha,
                duration: 300
            });
            if (this.blocksCreated >= 10) {
                this.time.delayedCall(350, () => {
                    if (this.tutorialLayer) {
                        this.tutorialLayer.destroy();
                        this.tutorialLayer = null;
                    }
                });
            }
        }
    }

    spawnBlock() {
        if (this.heldBlocks.length >= this.maxHeldBlocks) return;
        this.fadeTutorial();

        const bounds = this.structure.getBounds();
        const minMargin = bounds.width / 2;
        const leftLimit = bounds.x - minMargin;
        const rightLimit = bounds.x + bounds.width + minMargin;
        const spawnX = [leftLimit, rightLimit][Phaser.Math.Between(0, 1)];

        const startX = spawnX;
        const startY = this.terrainY;
        const endY = this.terrainY - 60;
        const arcPeakY = this.terrainY - 140;

        const progress = this.structure.getCompletion();
        const preferredKeys = progress >= 0.9 ? this.structure.getUsefulTetrominoKeys(TETROMINOES) : [];
        const block = this.blockGenerator.generateRandomBlock(startX, startY, { preferredKeys });
        this.heldBlocks.push(block);

        block.setScale(0);
        this.tweens.add({
            targets: block,
            scale: 1,
            duration: 150,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: block,
            x: spawnX,
            y: endY,
            duration: 450,
            ease: 'Sine.easeInOut'
        });

        this.updateBlocksText();
    }

    onTerrainClick(pointer) {
        if (this.chipCooldown > 0) return;
        if (this.heldBlocks.length >= this.maxHeldBlocks) return;

        this.chipCooldown = 500;
        this.fadeTutorial();

        const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.createChipEffect(world.x, world.y);

        const bounds = this.structure.getBounds();
        const minMargin = bounds.width / 2;
        const leftLimit = bounds.x - minMargin;
        const rightLimit = bounds.x + bounds.width + minMargin;
        const spawnX = [leftLimit, rightLimit][Phaser.Math.Between(0, 1)];

        const startX = world.x;
        const startY = this.terrainY;
        const endY = this.terrainY - 60;
        const arcPeakY = this.terrainY - 140;

        const progress = this.structure.getCompletion();
        const preferredKeys = progress >= 0.9 ? this.structure.getUsefulTetrominoKeys(TETROMINOES) : [];
        const block = this.blockGenerator.generateRandomBlock(startX, startY, { preferredKeys });
        this.heldBlocks.push(block);

        block.setScale(0);
        this.tweens.add({
            targets: block,
            scale: 1,
            duration: 150,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: block,
            x: spawnX,
            y: endY,
            duration: 450,
            ease: 'Sine.easeInOut'
        });

        this.updateBlocksText();
    }

    createChipEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(
                x + Phaser.Math.Between(-20, 20),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(3, 8),
                0xFFFFFF
            );

            const angle = Phaser.Math.Between(-150, -30) * Math.PI / 180;
            const speed = Phaser.Math.Between(100, 250);

            this.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed,
                y: particle.y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(400, 800),
                onComplete: () => particle.destroy()
            });
        }

        this.cameras.main.shake(50, 0.005);
    }

    createCloudStrike(cloudX, cloudY, targetNPC) {
        const rainCount = 30;
        const rainLength = 8;
        const rainWidth = 2;

        for (let i = 0; i < rainCount; i++) {
            const startX = cloudX + Phaser.Math.Between(-50, 50);
            const startY = cloudY + Phaser.Math.Between(-20, 30);
            const rain = this.add.graphics();
            rain.lineStyle(rainWidth, 0xB8D4E8, 0.9);
            rain.lineBetween(0, 0, 0, rainLength);
            rain.setPosition(startX, startY);

            this.tweens.add({
                targets: rain,
                y: this.terrainY + 50,
                alpha: 0.2,
                duration: Phaser.Math.Between(400, 700),
                delay: Phaser.Math.Between(0, 150),
                onComplete: () => rain.destroy()
            });
        }

        const drawLightning = (g, fromX, fromY, toX, toY, steps = 6) => {
            g.clear();
            g.lineStyle(3, 0xFFFFFF, 0.95);
            const dx = (toX - fromX) / steps;
            const dy = (toY - fromY) / steps;
            let x = fromX, y = fromY;
            for (let i = 1; i <= steps; i++) {
                const nextX = fromX + dx * i + Phaser.Math.Between(-15, 15);
                const nextY = fromY + dy * i + Phaser.Math.Between(-8, 8);
                g.lineBetween(x, y, nextX, nextY);
                x = nextX;
                y = nextY;
            }
        };

        const lightning = this.add.graphics();
        lightning.setPosition(0, 0);
        lightning.setDepth(2000);

        drawLightning(lightning, cloudX, cloudY, targetNPC.x, targetNPC.y);
        lightning.setAlpha(1);
        this.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 80,
            hold: 40,
            yoyo: true
        });

        this.time.delayedCall(120, () => {
            drawLightning(lightning, cloudX, cloudY, targetNPC.x, targetNPC.y);
            lightning.setAlpha(1);
            this.tweens.add({
                targets: lightning,
                alpha: 0,
                duration: 60,
                onComplete: () => {
                    lightning.destroy();
                }
            });
        });

        this.time.delayedCall(350, () => {
            this.cameras.main.shake(80, 0.008);
        });
    }

    updateBlocksText() {
        const progress = this.structure.getCompletion();
        this.statusLineText.setText(`Progress: ${Math.round(progress * 100)}%  ·  Blocks: ${this.heldBlocks.length}/${this.maxHeldBlocks}`);
    }

    handleBlockDrop(block, pointer, worldPoint) {
        const world = worldPoint || this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const wx = world.x;
        const wy = world.y;

        const pointInZone = (px, py, zone) =>
            zone && px >= zone.x && px <= zone.x + zone.width &&
            py >= zone.y && py <= zone.y + zone.height;

        const inLeftCloud = pointInZone(wx, wy, this.leftCloudZone) || pointInZone(block.x, block.y, this.leftCloudZone);
        const inRightCloud = pointInZone(wx, wy, this.rightCloudZone) || pointInZone(block.x, block.y, this.rightCloudZone);

        if (inLeftCloud || inRightCloud) {
            const sideNPCs = this.npcs.filter(npc => !npc.isKnockedOut && (inLeftCloud ? npc.side === 'left' : npc.side === 'right'));
            const target = sideNPCs[0];
            if (target) {
                this.removeHeldBlock(block);
                this.tweens.killTweensOf(block);
                block.destroy();
                target.hit();
                const cloudCenter = inLeftCloud ? this.leftCloudCenter : this.rightCloudCenter;
                this.createCloudStrike(cloudCenter.x, cloudCenter.y, target);
                return { handled: true };
            }
        }

        const hitNPC = this.collisionManager.checkBlockHitsNPC(block, this.npcs);
        if (hitNPC) {
            hitNPC.hit();
            this.removeHeldBlock(block);
            return { handled: true };
        }

        if (this.structure.canPlaceBlock(block, wx, wy)) {
            this.structure.placeBlock(block, wx, wy);
            this.removeHeldBlock(block);
            this.updateProgressBar();

            if (this.structure.isComplete()) {
                this.levelComplete();
            }

            return { handled: true };
        }

        return { handled: false };
    }

    removeHeldBlock(block) {
        const index = this.heldBlocks.indexOf(block);
        if (index > -1) {
            this.heldBlocks.splice(index, 1);
        }
        this.updateBlocksText();
    }

    pickUpPlacedBlock(block) {
        if (!block.isPlaced || !this.structure.unplaceBlock(block)) return false;
        block.isPlaced = false;
        block.setInteractive({ useHandCursor: true });
        block.setInHandStyle();
        this.heldBlocks.push(block);
        this.updateBlocksText();
        this.updateProgressBar();
        return true;
    }

    strengthenPlacedBlock(block) {
        if (!block.isPlaced || block.health >= block.maxHealth) return false;
        block.health = Math.min(block.maxHealth, block.health + 1);
        block.setHealthStyle(block.health);
        return true;
    }

    levelComplete() {
        this.time.delayedCall(500, () => {
            this.scene.start('LevelCompleteScene', {
                level: this.currentLevel,
                hasNextLevel: this.currentLevel < OUTLINES.length - 1
            });
        });
    }

    update(time, delta) {
        this.dragDropManager.update();

        if (this.chipCooldown > 0) {
            this.chipCooldown -= delta;
        }

        for (const npc of this.npcs) {
            const snowball = npc.update(delta, this.structure);
            if (snowball) {
                this.snowballs.push(snowball);
            }
        }

        for (let i = this.snowballs.length - 1; i >= 0; i--) {
            const snowball = this.snowballs[i];
            snowball.update(delta);

            if (!snowball.active) {
                this.snowballs.splice(i, 1);
            }
        }

        const removed = this.collisionManager.checkSnowballCollisions(
            this.snowballs,
            this.structure,
            this.npcs
        );

        for (const snowball of removed) {
            const index = this.snowballs.indexOf(snowball);
            if (index > -1) {
                this.snowballs.splice(index, 1);
            }
        }

        this.updateProgressBar();
    }
}
