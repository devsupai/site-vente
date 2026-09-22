import sharp from 'sharp';
import fs from 'fs';

async function prepareAsset(filePath, { maxDimension = 300, rotate = 0 }) {
  let img = sharp(filePath);
  img = img.resize(maxDimension, maxDimension, { fit: 'inside' });
  if (rotate) {
    img = img.rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  img = img.ensureAlpha();
  const buffer = await img.png().toBuffer();
  const meta = await sharp(buffer).metadata();
  return { input: buffer, width: meta.width, height: meta.height };
}

function createStudioBackdropSvg(width, height, { baseColor, vignetteColor, accentColor1, accentColor2 }) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="studioLighting" cx="50%" cy="50%" r="72%">
          <stop offset="0%" stop-color="${baseColor}" stop-opacity="1" />
          <stop offset="60%" stop-color="${baseColor}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${vignetteColor}" stop-opacity="1" />
        </radialGradient>

        <linearGradient id="leafGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accentColor1}" stop-opacity="0.85" />
          <stop offset="100%" stop-color="${accentColor1}" stop-opacity="0.35" />
        </linearGradient>

        <linearGradient id="leafGradRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${accentColor2}" stop-opacity="0.85" />
          <stop offset="100%" stop-color="${accentColor2}" stop-opacity="0.35" />
        </linearGradient>
      </defs>

      <rect width="100%" height="100%" fill="url(#studioLighting)" />

      <!-- Left decorative brand leaf motifs -->
      <g transform="translate(-15, 25) scale(1.15)">
        <path d="M 40,80 C 60,30 110,40 120,90 C 110,140 60,130 40,80 Z" fill="url(#leafGradLeft)" transform="rotate(-25 80 85)" />
        <path d="M 25,180 C 45,140 85,150 95,190 C 85,230 45,220 25,180 Z" fill="url(#leafGradLeft)" transform="rotate(35 60 185)" opacity="0.75" />
        <path d="M 20,660 C 40,610 90,620 100,670 C 90,720 40,710 20,660 Z" fill="url(#leafGradLeft)" transform="rotate(40 60 665)" opacity="0.85" />
      </g>

      <!-- Right decorative brand leaf motifs -->
      <g transform="translate(1790, 25) scale(1.15)">
        <path d="M 40,70 C 60,20 110,30 120,80 C 110,130 60,120 40,70 Z" fill="url(#leafGradRight)" transform="rotate(25 80 75)" />
        <path d="M 60,220 C 80,180 120,190 130,230 C 120,270 80,260 60,220 Z" fill="url(#leafGradRight)" transform="rotate(-30 95 225)" opacity="0.7" />
        <path d="M 45,630 C 65,580 115,590 125,640 C 115,690 65,680 45,630 Z" fill="url(#leafGradRight)" transform="rotate(-35 85 635)" opacity="0.85" />
      </g>
    </svg>
  `);
}

async function buildFlatlay({ outputPath, baseColor, vignetteColor, accentColor1, accentColor2, items }) {
  const WIDTH = 1920;
  const HEIGHT = 819;

  const backdropSvg = createStudioBackdropSvg(WIDTH, HEIGHT, {
    baseColor,
    vignetteColor,
    accentColor1,
    accentColor2
  });

  const backdropBuffer = await sharp(backdropSvg).png().toBuffer();
  const compositeList = [];

  for (const item of items) {
    if (!fs.existsSync(item.file)) {
      console.warn(`File not found: ${item.file}`);
      continue;
    }

    const { input, width, height } = await prepareAsset(item.file, {
      maxDimension: item.size || 300,
      rotate: item.rotate || 0,
    });

    let posX = Math.round(item.x);
    let posY = Math.round(item.y);

    if (posX < 0) posX = 0;
    if (posX + width > WIDTH) posX = WIDTH - width;
    if (posY < 0) posY = 0;
    if (posY + height > HEIGHT) posY = HEIGHT - height;

    const shadowPadding = 20;
    const shadowW = width + shadowPadding * 2;
    const shadowH = height + shadowPadding * 2;

    let shadowX = posX - shadowPadding + 6;
    let shadowY = posY - shadowPadding + 12;

    if (shadowX < 0) shadowX = 0;
    if (shadowX + shadowW > WIDTH) shadowX = WIDTH - shadowW;
    if (shadowY < 0) shadowY = 0;
    if (shadowY + shadowH > HEIGHT) shadowY = HEIGHT - shadowH;

    const shadowSvg = Buffer.from(`
      <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <ellipse cx="${shadowW / 2}" cy="${shadowH / 2}" rx="${width * 0.44}" ry="${height * 0.44}" fill="rgba(35, 25, 18, 0.17)" filter="url(#blur)" />
      </svg>
    `);

    const shadowBuf = await sharp(shadowSvg).png().toBuffer();

    compositeList.push({
      input: shadowBuf,
      left: shadowX,
      top: shadowY,
    });

    compositeList.push({
      input,
      left: posX,
      top: posY,
    });
  }

  const finalImage = await sharp(backdropBuffer)
    .composite(compositeList)
    .webp({ quality: 90, effort: 5 })
    .toFile(outputPath);

  console.log(`Generated: ${outputPath} (${(finalImage.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  // ── 1. LIVRES & ROMANS ──
  await buildFlatlay({
    outputPath: 'public/bg_books.webp',
    baseColor: '#FFFEF6',
    vignetteColor: '#F4ECE0',
    accentColor1: '#2E7D32',
    accentColor2: '#E65100',
    items: [
      { file: 'assets/rayons/rayon_roman_livre.png', x: 50, y: 30, size: 330, rotate: -8 },
      { file: 'assets/rayons/rayon_presse_magazine.png', x: 410, y: 20, size: 280, rotate: 6 },
      { file: 'assets/rayons/rayon_quotidien_lunettes.png', x: 70, y: 550, size: 170, rotate: 18 },
      { file: 'assets/rayons/rayon_guides_carte_ign.png', x: 230, y: 490, size: 260, rotate: -10 },
      { file: 'assets/rayons/rayon_manga_volume.png', x: 1520, y: 30, size: 310, rotate: 9 },
      { file: 'assets/rayons/rayon_terroir_boussole.png', x: 1640, y: 550, size: 170, rotate: -14 },
    ]
  });

  // ── 2. PAPETERIE & BEAUX-ARTS ──
  await buildFlatlay({
    outputPath: 'public/bg_stationery.webp',
    baseColor: '#FAF8F5',
    vignetteColor: '#EBE4D8',
    accentColor1: '#1565C0',
    accentColor2: '#E65100',
    items: [
      { file: 'assets/stationery/mockup_carnet_rhodia.png', x: 50, y: 30, size: 320, rotate: -12 },
      { file: 'assets/rayons/rayon_papeterie_kaweco.png', x: 80, y: 520, size: 260, rotate: -32 },
      { file: 'assets/rayons/rayon_beauxarts_pinceau.png', x: 1520, y: 30, size: 300, rotate: 25 },
      { file: 'assets/rayons/rayon_scolaire_taillecrayon.png', x: 1620, y: 530, size: 190, rotate: -18 },
    ]
  });

  // ── 3. GOODIES & POP CULTURE ──
  await buildFlatlay({
    outputPath: 'public/bg_goodies.webp',
    baseColor: '#FCFBF9',
    vignetteColor: '#EAE8E2',
    accentColor1: '#C2185B',
    accentColor2: '#FFA000',
    items: [
      { file: 'assets/goodies/mockup_pierrot_gourmand.png', x: 60, y: 30, size: 290, rotate: -22 },
      { file: 'assets/rayons/rayon_jeux_des_meeple.png', x: 80, y: 510, size: 250, rotate: 14 },
      { file: 'assets/goodies/mockup_boosters_fan.png', x: 1440, y: 20, size: 360, rotate: 7 },
      { file: 'assets/rayons/rayon_fdj_piece.png', x: 1620, y: 540, size: 190, rotate: -12 },
    ]
  });

  // ── 4. ÉVÉNEMENTS & RENCONTRES LITTÉRAIRES ──
  await buildFlatlay({
    outputPath: 'public/bg_events.webp',
    baseColor: '#FFFEF6',
    vignetteColor: '#F2E8DC',
    accentColor1: '#388E3C',
    accentColor2: '#D84315',
    items: [
      { file: 'assets/rayons/rayon_presse_magazine.png', x: 60, y: 30, size: 300, rotate: -10 },
      { file: 'assets/rayons/rayon_quotidien_lunettes.png', x: 80, y: 540, size: 180, rotate: 20 },
      { file: 'assets/rayons/rayon_guides_carte_ign.png', x: 1500, y: 30, size: 290, rotate: 12 },
      { file: 'assets/rayons/rayon_terroir_boussole.png', x: 1630, y: 540, size: 180, rotate: -15 },
    ]
  });

  console.log('All 4 thematic flatlays created successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
