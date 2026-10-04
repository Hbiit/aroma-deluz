import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BRAND_BG = '#2D1229'; // Official deep royal plum background (#2d1229)

async function run() {
  console.log('Generating revised assets for Aroma De Luz mobile app...');

  const srcTransparent = path.resolve('public/brand-logo-transparent.png');
  const targetDir = path.resolve('../aroma-app/assets');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Header Wordmark: "Aroma De Luz" + "ALL ABOUT SCENT" (No flame/leaves icon)
  console.log('1. Generating header-wordmark.png...');
  const headerBuf = await sharp(srcTransparent)
    .extract({ left: 0, top: 260, width: 804, height: 250 })
    .png()
    .toBuffer();

  await sharp(headerBuf)
    .trim()
    .png()
    .toFile(path.join(targetDir, 'header-wordmark.png'));

  const repoTargetDir = path.resolve('aroma-app/assets');
  if (!fs.existsSync(repoTargetDir)) fs.mkdirSync(repoTargetDir, { recursive: true });
  fs.copyFileSync(path.join(targetDir, 'header-wordmark.png'), path.join(repoTargetDir, 'header-wordmark.png'));

  // 2. Icon: Emblem + "Aroma De Luz" (WITHOUT TAGLINE) on exact #2D1229 background
  console.log('2. Generating icon.png (1024x1024)...');
  const emblemBuf = await sharp(srcTransparent)
    .extract({ left: 0, top: 10, width: 804, height: 410 })
    .png()
    .toBuffer();

  const trimmedEmblemBuf = await sharp(emblemBuf)
    .trim()
    .resize({ width: 760, height: 760, fit: 'inside' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([
      {
        input: trimmedEmblemBuf,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(targetDir, 'icon.png'));

  fs.copyFileSync(path.join(targetDir, 'icon.png'), path.join(repoTargetDir, 'icon.png'));

  // 3. Android Adaptive Icon (Foreground: Emblem + "Aroma De Luz" without tagline inside 66% safe zone on transparent)
  console.log('3. Generating adaptive-icon.png (1024x1024)...');
  const adaptiveSizedBuf = await sharp(trimmedEmblemBuf)
    .resize({ width: 560, height: 560, fit: 'inside' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: adaptiveSizedBuf,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(targetDir, 'adaptive-icon.png'));

  fs.copyFileSync(path.join(targetDir, 'adaptive-icon.png'), path.join(repoTargetDir, 'adaptive-icon.png'));

  // 4. Splash Screen (1284x2778 high resolution on #2D1229)
  console.log('4. Generating splash.png (1284x2778)...');
  const fullLogoTrimmed = await sharp(srcTransparent)
    .trim()
    .resize({ width: 950, height: 800, fit: 'inside' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([
      {
        input: fullLogoTrimmed,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(targetDir, 'splash.png'));

  fs.copyFileSync(path.join(targetDir, 'splash.png'), path.join(repoTargetDir, 'splash.png'));

  // 5. Official Google 'G' Logo (128x128 crisp SVG rendered to PNG)
  console.log('5. Generating google-g-logo.png...');
  const googleSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="128" height="128">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
  `;

  await sharp(Buffer.from(googleSvg))
    .png()
    .toFile(path.join(targetDir, 'google-g-logo.png'));

  fs.copyFileSync(path.join(targetDir, 'google-g-logo.png'), path.join(repoTargetDir, 'google-g-logo.png'));

  console.log('All revised assets generated successfully!');
}

run().catch((err) => {
  console.error('Asset generation error:', err);
  process.exit(1);
});
