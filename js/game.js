import { BootScene } from './scenes/BootScene.js';

import { GameScene } from './scenes/GameScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';

const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 540;

let _isRotated = false;
const container = document.getElementById('game-container');

function checkPortrait() {
    return window.innerHeight > window.innerWidth;
}

function applyOrientation() {
    const portrait = checkPortrait();
    if (portrait && !_isRotated) {
        _isRotated = true;
        container.classList.add('force-landscape');
    } else if (!portrait && _isRotated) {
        _isRotated = false;
        container.classList.remove('force-landscape');
    }
}

// Set initial orientation before creating the game
applyOrientation();

// Try to lock orientation on supported browsers
try {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
} catch (e) {}

// Capture pointer event coordinates before Phaser processes them.
// Capturing-phase listeners run before Phaser's listeners, so these
// values are always current when ScaleManager.transformX/Y are called.
let _lastPointerPageX = 0;
let _lastPointerPageY = 0;

function capturePointerEvent(e) {
    if (e.touches && e.touches.length > 0) {
        _lastPointerPageX = e.touches[0].pageX;
        _lastPointerPageY = e.touches[0].pageY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        _lastPointerPageX = e.changedTouches[0].pageX;
        _lastPointerPageY = e.changedTouches[0].pageY;
    } else {
        _lastPointerPageX = e.pageX;
        _lastPointerPageY = e.pageY;
    }
}

['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'].forEach(type => {
    window.addEventListener(type, capturePointerEvent, true);
});

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

// Override parent bounds so Phaser sees the un-rotated container dimensions
const origGetParentBounds = game.scale.getParentBounds.bind(game.scale);
game.scale.getParentBounds = function () {
    const result = origGetParentBounds();
    if (_isRotated) {
        const w = this.parentSize.width;
        const h = this.parentSize.height;
        this.parentSize.setSize(h, w);
    }
    return result;
};

// Override ScaleManager.transformX/transformY to reverse the CSS rotation.
// transformX needs the viewport pageY (and vice versa) because the axes are swapped
// by the -90deg rotation. We use the values captured in the capturing-phase listener.
const origTransformX = game.scale.transformX.bind(game.scale);
const origTransformY = game.scale.transformY.bind(game.scale);

game.scale.transformX = function (pageX) {
    if (!_isRotated) return origTransformX(pageX);

    const rect = game.canvas.getBoundingClientRect();
    const cy = rect.top + rect.height / 2;
    const dy = _lastPointerPageY - cy;
    // Reverse -90deg: game X comes from viewport Y (inverted)
    const rx = -dy;
    const displayW = rect.height; // pre-rotation width = rotated height
    return (rx / displayW + 0.5) * DESIGN_WIDTH;
};

game.scale.transformY = function (pageY) {
    if (!_isRotated) return origTransformY(pageY);

    const rect = game.canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const dx = _lastPointerPageX - cx;
    // Reverse -90deg: game Y comes from viewport X
    const ry = dx;
    const displayH = rect.width; // pre-rotation height = rotated width
    return (ry / displayH + 0.5) * DESIGN_HEIGHT;
};

// Refresh scaling after overrides are in place
game.scale.refresh();

window.addEventListener('resize', () => {
    applyOrientation();
    game.scale.refresh();
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        applyOrientation();
        game.scale.refresh();
    }, 100);
});
