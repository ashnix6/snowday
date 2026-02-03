export class Snowball extends Phaser.GameObjects.Container {
    constructor(scene, x, y, targetX, targetY, speed = 300) {
        super(scene, x, y);

        this.scene = scene;
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.active = true;
        this.gravity = 450;

        this.createVisual();
        scene.add.existing(this);

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const timeToTarget = Math.max(0.3, dist / speed);
        this.velocityX = dx / timeToTarget;
        this.velocityY = (dy - 0.5 * this.gravity * timeToTarget * timeToTarget) / timeToTarget;
    }

    createVisual() {
        const main = this.scene.add.circle(0, 0, 8, 0xFFFFFF);
        main.setStrokeStyle(2, 0xCCDDFF);

        const highlight = this.scene.add.circle(-2, -2, 3, 0xFFFFFF, 0.8);

        this.add([main, highlight]);

        for (let i = 0; i < 3; i++) {
            const trail = this.scene.add.circle(0, 0, 4, 0xFFFFFF, 0.3);
            this.add(trail);
        }
    }

    update(delta) {
        if (!this.active) return;

        const dt = delta / 1000;
        this.velocityY += this.gravity * dt;
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;

        this.rotation += 0.1;

        if (this.x < -50 || this.x > this.scene.game.config.width + 50 ||
            this.y < -50 || this.y > this.scene.game.config.height + 50) {
            this.destroy();
        }
    }

    hitTarget() {
        this.active = false;

        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-5, 5),
                this.y + Phaser.Math.Between(-5, 5),
                Phaser.Math.Between(2, 6),
                0xFFFFFF
            );

            const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
            const dist = Phaser.Math.Between(20, 50);

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * dist,
                y: particle.y + Math.sin(angle) * dist,
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        this.destroy();
    }

    getBounds() {
        return new Phaser.Geom.Circle(this.x, this.y, 8);
    }
}
