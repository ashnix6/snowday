export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createBackground();

        const title = this.add.text(width / 2, 120, 'SNOW DAY', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#4a90d9',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            y: title.y + 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const playButton = this.createButton(width / 2, 210, 'PLAY', () => {
            this.scene.start('GameScene', { level: 0 });
        }, { width: 280, height: 80, fontSize: '36px' });

        const em = 16;
        const buttonBottom = 210 + 80 / 2;
        const instructionsY = buttonBottom + em;
        const instructions = this.add.text(width / 2, instructionsY + 65, [
            'How to Play:',
            'Click terrain to chip snow blocks',
            'Click blocks to attach to cursor, click again to place',
            'Drop blocks on NPCs to knock them out',
            'Scroll wheel or Space to rotate blocks',
            'Complete the structure to win!'
        ].join('\n'), {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#b8d4e8',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        this.createSnowfall();
    }

    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const graphics = this.add.graphics();
        // Phaser 3: fillGradientStyle(topLeft, topRight, bottomLeft, bottomRight, alpha)
        graphics.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x2a4a6a, 0x2a4a6a, 1);
        graphics.fillRect(0, 0, width, height);

        graphics.fillStyle(0xE8F4F8);
        graphics.fillRect(0, height - 100, width, 100);

        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const y = height - 100;
            const treeHeight = Phaser.Math.Between(60, 120);

            graphics.fillStyle(0x2E5A1C);
            graphics.fillTriangle(x, y - treeHeight, x - 25, y, x + 25, y);
            graphics.fillTriangle(x, y - treeHeight - 30, x - 20, y - 40, x + 20, y - 40);
        }
    }

    createButton(x, y, text, callback, options = {}) {
        const width = options.width ?? 200;
        const height = options.height ?? 60;
        const fontSize = options.fontSize ?? '28px';
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, width, height, 0x4a90d9);
        bg.setStrokeStyle(4, 0x2a70b9);

        const label = this.add.text(0, 0, text, {
            fontSize,
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(width, height);
        button.setInteractive({ useHandCursor: true });

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

    createSnowfall() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(-height, 0);
            const size = Phaser.Math.Between(2, 5);

            const snowflake = this.add.circle(x, y, size, 0xFFFFFF, 0.8);

            this.tweens.add({
                targets: snowflake,
                y: height + 50,
                x: snowflake.x + Phaser.Math.Between(-50, 50),
                duration: Phaser.Math.Between(3000, 8000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000),
                onRepeat: () => {
                    snowflake.x = Phaser.Math.Between(0, width);
                    snowflake.y = -20;
                }
            });
        }
    }
}
