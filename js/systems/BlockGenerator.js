import { Block } from '../entities/Block.js';
import { TETROMINOES } from '../levels/LevelData.js';

export class BlockGenerator {
    constructor(scene, cellSize = 32) {
        this.scene = scene;
        this.cellSize = cellSize;
        this.tetrominoKeys = Object.keys(TETROMINOES);
    }

    generateRandomBlock(x, y, options = {}) {
        const preferredKeys = options.preferredKeys || [];
        let key;
        if (preferredKeys.length > 0 && Phaser.Math.FloatBetween(0, 1) < 0.75) {
            key = preferredKeys[Phaser.Math.Between(0, preferredKeys.length - 1)];
        } else {
            key = this.tetrominoKeys[Phaser.Math.Between(0, this.tetrominoKeys.length - 1)];
        }
        const tetromino = TETROMINOES[key];

        const shapeCopy = tetromino.shape.map(row => [...row]);

        const rotations = Phaser.Math.Between(0, 3);
        for (let i = 0; i < rotations; i++) {
            this.rotateShape(shapeCopy);
        }

        return new Block(this.scene, x, y, shapeCopy, tetromino.color, this.cellSize);
    }

    rotateShape(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const newShape = [];

        for (let c = 0; c < cols; c++) {
            newShape[c] = [];
            for (let r = rows - 1; r >= 0; r--) {
                newShape[c][rows - 1 - r] = shape[r][c];
            }
        }

        shape.length = 0;
        newShape.forEach(row => shape.push(row));
    }

    getRandomTetrominoType() {
        return this.tetrominoKeys[Phaser.Math.Between(0, this.tetrominoKeys.length - 1)];
    }
}
