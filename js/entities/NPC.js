import { Snowball } from './Snowball.js';

export class NPC extends Phaser.GameObjects.Container {
    constructor(scene, x, y, side = 'left') {
        super(scene, x, y);

        this.scene = scene;
        this.side = side;
        this.health = 3;
        this.maxHealth = 3;
        this.isKnockedOut = false;
        this.knockoutTimer = 0;
        this.throwCooldown = 0;
        this.throwInterval = Phaser.Math.Between(5500, 8500);

        this.createVisual();
        scene.add.existing(this);
    }

    createVisual() {
        this.removeAll(true);

        const bodyColor = 0xFF6B35;
        const shadowColor = 0xCC5528;

        const body = this.scene.add.ellipse(0, 10, 40, 50, bodyColor);
        body.setStrokeStyle(2, shadowColor);

        const head = this.scene.add.circle(0, -25, 20, 0xFFDBBF);
        head.setStrokeStyle(2, 0xDDBBA8);

        const eyeOffsetX = this.side === 'left' ? 5 : -5;
        const leftEye = this.scene.add.circle(-6 + eyeOffsetX, -28, 4, 0x333333);
        const rightEye = this.scene.add.circle(6 + eyeOffsetX, -28, 4, 0x333333);

        const noseX = this.side === 'left' ? 12 : -12;
        const nose = this.scene.add.triangle(noseX, -25, 0, -5, 0, 5, 15, 0, 0xFF8C42);
        if (this.side === 'right') {
            nose.setScale(-1, 1);
        }

        const hatColor = 0x2E5A1C;
        const hat = this.scene.add.rectangle(0, -45, 30, 15, hatColor);
        const hatTop = this.scene.add.rectangle(0, -55, 20, 15, hatColor);

        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();

        this.add([body, head, leftEye, rightEye, nose, hat, hatTop, this.healthBar]);

        this.bobTween = this.scene.tweens.add({
            targets: this,
            y: this.y + 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    updateHealthBar() {
        this.healthBar.clear();

        const barWidth = 40;
        const barHeight = 6;
        const x = -barWidth / 2;
        const y = -70;

        this.healthBar.fillStyle(0x333333);
        this.healthBar.fillRect(x, y, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? 0x00FF00 : healthPercent > 0.25 ? 0xFFFF00 : 0xFF0000;
        this.healthBar.fillStyle(healthColor);
        this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);

        this.healthBar.lineStyle(1, 0xFFFFFF);
        this.healthBar.strokeRect(x, y, barWidth, barHeight);
    }

    update(delta, structure) {
        if (this.isKnockedOut) {
            this.knockoutTimer -= delta;
            if (this.knockoutTimer <= 0) {
                this.respawn();
            }
            return null;
        }

        this.throwCooldown -= delta;
        if (this.throwCooldown <= 0 && structure) {
            this.throwCooldown = this.throwInterval;
            return this.throwSnowball(structure);
        }

        return null;
    }

    throwSnowball(structure) {
        const bounds = structure.getBounds();
        const targetX = bounds.x + Phaser.Math.Between(0, bounds.width);
        const targetY = bounds.y + Phaser.Math.Between(0, bounds.height);

        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 100,
            yoyo: true
        });

        const throwX = this.side === 'left' ? this.x + 30 : this.x - 30;
        return new Snowball(this.scene, throwX, this.y - 20, targetX, targetY);
    }

    hit() {
        this.health--;
        this.updateHealthBar();

        this.scene.tweens.add({
            targets: this,
            x: this.x + (this.side === 'left' ? -20 : 20),
            duration: 100,
            yoyo: true
        });

        for (let i = 0; i < 10; i++) {
            const particle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-20, 20),
                this.y + Phaser.Math.Between(-30, 20),
                Phaser.Math.Between(3, 8),
                0xFFFFFF
            );

            this.scene.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(30, 60),
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }

        if (this.health <= 0) {
            this.knockout();
        }
    }

    knockout() {
        this.isKnockedOut = true;
        this.knockoutTimer = 10000;
        this.setAlpha(0.3);

        if (this.bobTween) {
            this.bobTween.pause();
        }

        const koText = this.scene.add.text(this.x, this.y - 80, 'K.O.!', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FF0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: koText,
            y: koText.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => koText.destroy()
        });
    }

    respawn() {
        this.isKnockedOut = false;
        this.health = this.maxHealth;
        this.setAlpha(1);
        this.updateHealthBar();

        if (this.bobTween) {
            this.bobTween.resume();
        }

        this.setScale(0);
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });
    }

    getBounds() {
        return new Phaser.Geom.Rectangle(this.x - 25, this.y - 60, 50, 80);
    }

    destroy() {
        if (this.bobTween) {
            this.bobTween.stop();
        }
        super.destroy();
    }
}
