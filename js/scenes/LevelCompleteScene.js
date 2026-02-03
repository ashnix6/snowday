export class LevelCompleteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelCompleteScene' });
    }

    init(data) {
        this.completedLevel = data.level;
        this.hasNextLevel = data.hasNextLevel;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground();

        const title = this.add.text(width / 2, height / 3, 'LEVEL COMPLETE!', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#4a90d9',
            strokeThickness: 6
        }).setOrigin(0.5);

        title.setScale(0);
        this.tweens.add({
            targets: title,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });

        this.createCelebration();

        const buttonY = height / 2 + 50;

        if (this.hasNextLevel) {
            this.createButton(width / 2, buttonY, 'NEXT LEVEL', () => {
                this.scene.start('GameScene', { level: this.completedLevel + 1 });
            });
        }

        this.createButton(width / 2, buttonY + 80, 'REPLAY', () => {
            this.scene.start('GameScene', { level: this.completedLevel });
        });

        this.createButton(width / 2, buttonY + 160, 'MAIN MENU', () => {
            this.scene.start('MenuScene');
        });

        if (!this.hasNextLevel) {
            const winText = this.add.text(width / 2, height / 2 - 20, 'You completed all levels!', {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFD700',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.tweens.add({
                targets: winText,
                scale: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x2a4a6a, 0x2a4a6a);
        graphics.fillRect(0, 0, width, height);

        graphics.fillStyle(0xE8F4F8);
        graphics.fillRect(0, height - 80, width, 80);
    }

    createCelebration() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3, 0xF38181];

        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = height + 50;
            const size = Phaser.Math.Between(5, 15);
            const color = colors[Phaser.Math.Between(0, colors.length - 1)];

            const confetti = this.add.rectangle(x, y, size, size * 2, color);
            confetti.setAngle(Phaser.Math.Between(0, 360));

            this.tweens.add({
                targets: confetti,
                y: Phaser.Math.Between(-50, height / 2),
                x: confetti.x + Phaser.Math.Between(-100, 100),
                angle: confetti.angle + Phaser.Math.Between(-360, 360),
                duration: Phaser.Math.Between(1500, 3000),
                delay: Phaser.Math.Between(0, 500),
                ease: 'Quad.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: confetti,
                        y: height + 100,
                        duration: 2000,
                        ease: 'Quad.easeIn',
                        onComplete: () => confetti.destroy()
                    });
                }
            });
        }

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(-height, 0);
            const size = Phaser.Math.Between(2, 6);

            const snowflake = this.add.circle(x, y, size, 0xFFFFFF, 0.8);

            this.tweens.add({
                targets: snowflake,
                y: height + 50,
                x: snowflake.x + Phaser.Math.Between(-50, 50),
                duration: Phaser.Math.Between(3000, 8000),
                repeat: -1,
                onRepeat: () => {
                    snowflake.x = Phaser.Math.Between(0, width);
                    snowflake.y = -20;
                }
            });
        }
    }

    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 200, 50, 0x4a90d9);
        bg.setStrokeStyle(3, 0x2a70b9);

        const label = this.add.text(0, 0, text, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(200, 50);
        button.setInteractive({ useHandCursor: true });

        button.setScale(0);
        this.tweens.add({
            targets: button,
            scale: 1,
            duration: 300,
            delay: 300,
            ease: 'Back.easeOut'
        });

        button.on('pointerover', () => {
            bg.setFillStyle(0x5aa0e9);
            this.tweens.add({
                targets: button,
                scale: 1.05,
                duration: 100
            });
        });

        button.on('pointerout', () => {
            bg.setFillStyle(0x4a90d9);
            this.tweens.add({
                targets: button,
                scale: 1,
                duration: 100
            });
        });

        button.on('pointerdown', () => {
            this.tweens.add({
                targets: button,
                scale: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
        });

        return button;
    }
}
