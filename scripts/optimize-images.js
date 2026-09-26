import sharp from 'sharp';
import fs from 'fs';

async function optimizeOne(filePath, options = {}) {
  if (!fs.existsSync(filePath)) return;
  const inputBuffer = fs.readFileSync(filePath);
  let pipeline = sharp(inputBuffer);

  if (options.resize) {
    pipeline = pipeline.resize(options.resize);
  }

  if (options.format === 'webp') {
    pipeline = pipeline.webp(options.webpOptions || { quality: 80 });
  } else if (options.format === 'jpeg' || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    pipeline = pipeline.jpeg(options.jpegOptions || { quality: 82, mozjpeg: true });
  } else if (options.format === 'png' || filePath.endsWith('.png')) {
    pipeline = pipeline.png(options.pngOptions || { compressionLevel: 9, effort: 7 });
  }

  const outputBuffer = await pipeline.toBuffer();
  fs.writeFileSync(options.destPath || filePath, outputBuffer);
  console.log(`✓ Optimized ${options.destPath || filePath} (${Math.round(inputBuffer.length/1024)} KB -> ${Math.round(outputBuffer.length/1024)} KB)`);
}

async function run() {
  console.log('Optimizing images via in-memory buffers...');

  // 1. Missing WebP for events
  if (fs.existsSync('assets/events/event_dedicace.png')) {
    await optimizeOne('assets/events/event_dedicace.png', {
      destPath: 'assets/events/event_dedicace.webp',
      format: 'webp',
      resize: { width: 700, withoutEnlargement: true }
    });
    await optimizeOne('assets/events/event_dedicace.png', {
      resize: { width: 700, withoutEnlargement: true }
    });
  }

  if (fs.existsSync('assets/events/event_cafe.png')) {
    await optimizeOne('assets/events/event_cafe.png', {
      destPath: 'assets/events/event_cafe.webp',
      format: 'webp',
      resize: { width: 800, withoutEnlargement: true }
    });
    await optimizeOne('assets/events/event_cafe.png', {
      resize: { width: 800, withoutEnlargement: true }
    });
  }

  // Clean up any stray _opt files if created previously
  for (const f of ['assets/books/sentiers_sauvages_opt.jpg', 'assets/books/le_monde_sans_fin_opt.jpg']) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  // 2. Huge book covers
  await optimizeOne('assets/books/le_monde_sans_fin.jpg', {
    resize: { width: 600, withoutEnlargement: true }
  });

  await optimizeOne('assets/books/sentiers_sauvages.jpg', {
    resize: { width: 600, withoutEnlargement: true }
  });

  await optimizeOne('assets/books/la_faille.jpg', {
    resize: { width: 500, withoutEnlargement: true }
  });

  await optimizeOne('assets/books/enfants_du_fleuve.jpg', {
    resize: { width: 500, withoutEnlargement: true }
  });

  // 3. Goodies packshots
  await optimizeOne('assets/goodies/mockup_boosters_fan.png', {
    resize: { width: 560, withoutEnlargement: true }
  });

  await optimizeOne('assets/goodies/mockup_booster_pokemon.png', {
    resize: { width: 560, withoutEnlargement: true }
  });

  await optimizeOne('assets/goodies/mockup_booster_panini_fifa.png', {
    resize: { width: 560, withoutEnlargement: true }
  });

  await optimizeOne('assets/goodies/mockup_booster_harry_potter.png', {
    resize: { width: 560, withoutEnlargement: true }
  });

  // 4. Stationery packshots
  await optimizeOne('assets/stationery/mockup_canson_dessin.jpg', {
    resize: { width: 600, withoutEnlargement: true }
  });

  await optimizeOne('assets/stationery/mockup_pinceaux_artiste.png', {
    resize: { width: 600, withoutEnlargement: true }
  });

  await optimizeOne('assets/stationery/mockup_feuilles_clairefontaine.jpg', {
    resize: { width: 600, withoutEnlargement: true }
  });

  console.log('Done optimizing images.');
}

run().catch(err => {
  console.error('Optimization error:', err);
  process.exit(1);
});
