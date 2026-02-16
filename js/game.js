import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';

const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 540;

// Try to lock orientation on supported browsers
try {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
} catch (e) {}

const config = {
    type: Phaser.AUTO,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a2a4a',
    roundPixels: true,
    pixelArt: true,
    scene: [BootScene, GameScene, LevelCompleteScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        activePointers: 3
    }
};

const game = new Phaser.Game(config);

// Resume AudioContext after first user gesture (required by Chrome autoplay policy)
function resumeAudioOnGesture() {
    if (game.sound && game.sound.context && game.sound.context.state === 'suspended') {
        game.sound.context.resume();
    }
    document.body.removeEventListener('click', resumeAudioOnGesture);
    document.body.removeEventListener('touchstart', resumeAudioOnGesture);
}
document.body.addEventListener('click', resumeAudioOnGesture, { once: true });
document.body.addEventListener('touchstart', resumeAudioOnGesture, { once: true });
