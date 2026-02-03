import sharp from 'sharp';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const sourcePath = join(projectRoot, 'assets', 'penguin-source.png');
const outputPath = join(projectRoot, 'assets', 'penguin.png');

const inputPath = process.argv[2] ? join(process.cwd(), process.argv[2]) : sourcePath;

if (!existsSync(inputPath)) {
  console.error('Source image not found. Place penguin image at assets/penguin-source.png or pass path as argument.');
  process.exit(1);
}

const threshold = 248;

const { data, info } = await sharp(inputPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r >= threshold && g >= threshold && b >= threshold) {
    data[i + 3] = 0;
  }
}

await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(outputPath);

console.log('Saved transparent penguin to', outputPath);
