/**
 * three-goodies.js
 * Interactive WebGL 3D showcase for Goodies products:
 * - 3D Fan-out presentation for the combo card on "all" categories
 * - Individual 360° 3D stages for Pokémon & Harry Potter boosters on "cartes" tab
 * - Procedural PBR materials with realistic foil sheen and dynamic cursor lighting
 * - IntersectionObserver to halt rendering loops when out of viewport (0% GPU idle)
 */

import * as THREE from 'three';
import pokemonFrontTexUrl from './assets/goodies/booster_texture_front.png';
import pokemonBackTexUrl from './assets/goodies/booster_texture_back.png';
import fifaFrontTexUrl from './assets/goodies/booster_fifa_texture_front.png';
import fifaBackTexUrl from './assets/goodies/booster_fifa_texture_back.png';
import hpFrontTexUrl from './assets/goodies/booster_hp_texture_front.png';
import hpBackTexUrl from './assets/goodies/booster_hp_texture_back.png';
import monopolyFrontTexUrl from './assets/goodies/monopoly_front.jpg';
import monopolyBackTexUrl from './assets/goodies/monopoly_back.jpg';
import monopolySideLongTexUrl from './assets/goodies/monopoly_side_long.jpg';
import monopolySideShortTexUrl from './assets/goodies/monopoly_side_short.jpg';

// Shared Pouch Geometry Generator (True flow-wrap booster proportions: 2.10:1 ratio)
function createPouchGeometry() {
  const pouchWidth = 1.18;
  const pouchHeight = 2.48;
  const pouchDepth = 0.12;

  const segX = 32;
  const segY = 64;
  const segZ = 6;

  const geometry = new THREE.BoxGeometry(pouchWidth, pouchHeight, pouchDepth, segX, segY, segZ);
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    const normY = (v.y / (pouchHeight / 2));
    const absY = Math.abs(normY);
    const normX = (v.x / (pouchWidth / 2));
    const absX = Math.abs(normX);

    if (absY > 0.88) {
      const crimpFactor = (absY - 0.88) / 0.12;
      v.z *= (1 - crimpFactor * 0.85);
      v.z += Math.sin(v.x * 58) * 0.004 * (1 - crimpFactor * 0.5);
    } else {
      const bulgeFactorY = Math.cos(normY * Math.PI * 0.5);
      const bulgeFactorX = Math.cos(normX * Math.PI * 0.5);
      const bulge = Math.max(0, bulgeFactorY * bulgeFactorX);

      if (absX > 0.82) {
        const edgeFactor = (absX - 0.82) / 0.18;
        v.z *= (1 - edgeFactor * 0.7);
      }

      if (v.z > 0) {
        v.z += bulge * 0.050;
      } else {
        v.z -= bulge * 0.030;
      }
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

// Helper to create pouch mesh with PBR materials
function createPouchMesh(geometry, textureLoader, frontUrl, backUrl, onLoad) {
  const frontTex = textureLoader.load(frontUrl, onLoad);
  frontTex.colorSpace = THREE.SRGBColorSpace;

  const backTex = textureLoader.load(backUrl);
  backTex.colorSpace = THREE.SRGBColorSpace;

  const sideMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.85,
    roughness: 0.35,
  });

  const crimpMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.75,
    roughness: 0.45,
  });

  const frontMat = new THREE.MeshPhysicalMaterial({
    map: frontTex,
    metalness: 0.68,
    roughness: 0.28,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
    reflectivity: 0.8,
  });

  const backMat = new THREE.MeshPhysicalMaterial({
    map: backTex,
    metalness: 0.82,
    roughness: 0.34,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
  });

  const materials = [sideMat, sideMat, crimpMat, crimpMat, frontMat, backMat];
  return new THREE.Mesh(geometry, materials);
}

// --- 1. Setup 3D Fan-out Stage (Combo Card on 'all') ---
function setupBoosterFanStage(stage) {
  if (!stage) return;

  const itemWrapper = stage.querySelector('.goodies-3d-item');
  const fallbackImg = itemWrapper ? itemWrapper.querySelector('img') : null;

  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'goodies-3d-canvas-container';
  canvasContainer.setAttribute('aria-label', 'Vue 3D interactive en éventail des boosters Pokémon et Harry Potter (Glisser pour faire pivoter à 360°)');
  canvasContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 5;
    cursor: grab;
    opacity: 0;
    transition: opacity 0.5s ease;
    touch-action: pan-y;
  `;

  const badge360 = document.createElement('div');
  badge360.className = 'goodies-3d-badge-interactive';
  badge360.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
    </svg>
    <span>3D • Éventail 360°</span>
  `;
  badge360.style.cssText = `
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.90);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #222;
    display: flex;
    align-items: center;
    gap: 5px;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;
  stage.appendChild(badge360);
  stage.appendChild(canvasContainer);

  const width = stage.clientWidth || 280;
  const height = stage.clientHeight || 290;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 0, 5.2);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasContainer.appendChild(renderer.domElement);
  } catch (e) {
    console.warn('WebGL not supported for Three.js Goodies Fan', e);
    badge360.remove();
    canvasContainer.remove();
    return;
  }

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
  mainLight.position.set(2.5, 4.0, 3.5);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xbad7ff, 1.3);
  fillLight.position.set(-3.0, -1.0, 2.0);
  scene.add(fillLight);

  const cursorLight = new THREE.PointLight(0xffffff, 3.8, 7, 1.5);
  cursorLight.position.set(0, 0, 3.0);
  scene.add(cursorLight);

  // Geometry and Textures
  const textureLoader = new THREE.TextureLoader();
  const geometry = createPouchGeometry();

  let loadedCount = 0;
  const checkLoaded = () => {
    loadedCount++;
    if (loadedCount >= 3) {
      canvasContainer.style.opacity = '1';
      if (fallbackImg) fallbackImg.style.opacity = '0';
    }
  };

  const fanGroup = new THREE.Group();

  // Pokemon Mesh (left of fan, flared wide like a hand of cards: +16° tilt, top spreads left, bottom clusters at base)
  const pokemonMesh = createPouchMesh(geometry, textureLoader, pokemonFrontTexUrl, pokemonBackTexUrl, checkLoaded);
  pokemonMesh.position.set(-0.46, -0.06, -0.08);
  pokemonMesh.rotation.set(0.04, 0.14, 0.28);
  pokemonMesh.scale.set(0.94, 0.94, 0.94);
  fanGroup.add(pokemonMesh);

  // Harry Potter Mesh (right of fan, flared wide like a hand of cards: -16° tilt, top spreads right, bottom clusters at base)
  const hpMesh = createPouchMesh(geometry, textureLoader, hpFrontTexUrl, hpBackTexUrl, checkLoaded);
  hpMesh.position.set(0.46, -0.06, -0.05);
  hpMesh.rotation.set(0.04, -0.14, -0.28);
  hpMesh.scale.set(0.94, 0.94, 0.94);
  fanGroup.add(hpMesh);

  // Panini FIFA World Cup 2026 Mesh (center front, standing straight in majesty)
  const fifaMesh = createPouchMesh(geometry, textureLoader, fifaFrontTexUrl, fifaBackTexUrl, checkLoaded);
  fifaMesh.position.set(0.0, 0.04, 0.12);
  fifaMesh.rotation.set(0.02, 0.0, 0.0);
  fifaMesh.scale.set(0.96, 0.96, 0.96);
  fanGroup.add(fifaMesh);

  scene.add(fanGroup);

  const baseFanRot = { x: 0.02, y: -0.06, z: 0 };
  fanGroup.rotation.set(baseFanRot.x, baseFanRot.y, baseFanRot.z);

  // Drag & Hover Interaction
  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let dragVelocityX = 0;
  let dragVelocityY = 0;
  let targetRotY = baseFanRot.y;
  let targetRotX = baseFanRot.x;
  let userHasInteracted = false;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchHasDragged = false;
  let isVerticalScroll = false;

  canvasContainer.addEventListener('pointerdown', (e) => {
    isDragging = true;
    userHasInteracted = true;
    touchHasDragged = false;
    isVerticalScroll = false;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    dragVelocityX = 0;
    dragVelocityY = 0;
    canvasContainer.style.cursor = 'grabbing';
    if (e.pointerType !== 'touch') {
      try {
        canvasContainer.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    badge360.style.opacity = '0';
  });

  canvasContainer.addEventListener('pointermove', (e) => {
    const rect = canvasContainer.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    cursorLight.position.x = nx * 3.8;
    cursorLight.position.y = -ny * 3.8;

    if (isDragging) {
      if (e.pointerType === 'touch') {
        const totalDx = e.clientX - touchStartX;
        const totalDy = e.clientY - touchStartY;
        if (!touchHasDragged && Math.abs(totalDy) > 8 && Math.abs(totalDy) > Math.abs(totalDx)) {
          isVerticalScroll = true;
          isDragging = false;
          return;
        }
        if (Math.abs(totalDx) > 8) {
          touchHasDragged = true;
        }
      }
      if (isVerticalScroll) return;

      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      dragVelocityX = deltaX * 0.012;
      dragVelocityY = deltaY * 0.012;

      fanGroup.rotation.y += dragVelocityX;
      fanGroup.rotation.x = Math.max(-0.6, Math.min(0.6, fanGroup.rotation.x + dragVelocityY));
      targetRotY = fanGroup.rotation.y;
      targetRotX = fanGroup.rotation.x;
    } else {
      if (!userHasInteracted) {
        targetRotY = baseFanRot.y + nx * 0.42;
        targetRotX = baseFanRot.x - ny * 0.32;
        // Subtle card fanning spread on hover: opening the fan outwards
        const spread = Math.abs(nx) * 0.10;
        pokemonMesh.position.x = -0.46 - spread * 0.4;
        pokemonMesh.rotation.z = 0.28 + spread * 0.35;
        hpMesh.position.x = 0.46 + spread * 0.4;
        hpMesh.rotation.z = -0.28 - spread * 0.35;
      }
    }
  });

  const endDrag = (e) => {
    if (isDragging) {
      isDragging = false;
      canvasContainer.style.cursor = 'grab';
      try {
        canvasContainer.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  canvasContainer.addEventListener('pointerup', endDrag);
  canvasContainer.addEventListener('pointercancel', endDrag);

  canvasContainer.addEventListener('pointerleave', () => {
    if (!isDragging && !userHasInteracted) {
      targetRotY = baseFanRot.y;
      targetRotX = baseFanRot.x;
      pokemonMesh.position.x = -0.46;
      pokemonMesh.rotation.z = 0.28;
      fifaMesh.position.x = 0.0;
      hpMesh.position.x = 0.46;
      hpMesh.rotation.z = -0.28;
    }
  });

  const updateSize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  };
  const resizeObserver = new ResizeObserver(updateSize);
  resizeObserver.observe(stage);
  window.addEventListener('resize', updateSize);

  let animationFrameId = null;
  let isRendering = false;
  let clock = new THREE.Clock();

  function render() {
    if (!isRendering) return;

    const elapsedTime = clock.getElapsedTime();

    if (!isDragging) {
      if (Math.abs(dragVelocityX) > 0.0001) {
        fanGroup.rotation.y += dragVelocityX;
        dragVelocityX *= 0.92;
        targetRotY = fanGroup.rotation.y;
      } else if (!userHasInteracted) {
        fanGroup.rotation.y += (targetRotY - fanGroup.rotation.y) * 0.08;
        fanGroup.rotation.x += (targetRotX - fanGroup.rotation.x) * 0.08;
      }
    }

    const floatOffset = Math.sin(elapsedTime * 2.2) * 0.035;
    fanGroup.position.y = floatOffset;

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(render);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!isRendering) {
            isRendering = true;
            clock.start();
            render();
          }
        } else {
          isRendering = false;
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(stage);
}

// --- 2. Setup Single Booster Stage (Individual Cards on 'cartes' tab) ---
function setupBoosterStage(stage, frontTexUrl, backTexUrl, ariaLabel) {
  if (!stage) return;

  const itemWrapper = stage.querySelector('.goodies-3d-item');
  const fallbackImg = itemWrapper ? itemWrapper.querySelector('img') : null;

  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'goodies-3d-canvas-container';
  canvasContainer.setAttribute('aria-label', ariaLabel);
  canvasContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 5;
    cursor: grab;
    opacity: 0;
    transition: opacity 0.5s ease;
    touch-action: pan-y;
  `;

  const badge360 = document.createElement('div');
  badge360.className = 'goodies-3d-badge-interactive';
  badge360.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
    </svg>
    <span>3D • Glisser 360°</span>
  `;
  badge360.style.cssText = `
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.90);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #222;
    display: flex;
    align-items: center;
    gap: 5px;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;
  stage.appendChild(badge360);
  stage.appendChild(canvasContainer);

  const width = stage.clientWidth || 280;
  const height = stage.clientHeight || 290;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(0, 0, 4.6);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasContainer.appendChild(renderer.domElement);
  } catch (e) {
    console.warn('WebGL not supported for Three.js Goodies', e);
    badge360.remove();
    canvasContainer.remove();
    return;
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
  mainLight.position.set(2.5, 4.0, 3.5);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xbad7ff, 1.2);
  fillLight.position.set(-3.0, -1.0, 2.0);
  scene.add(fillLight);

  const cursorLight = new THREE.PointLight(0xffffff, 3.5, 6, 1.5);
  cursorLight.position.set(0, 0, 2.8);
  scene.add(cursorLight);

  const textureLoader = new THREE.TextureLoader();
  const geometry = createPouchGeometry();
  const boosterMesh = createPouchMesh(geometry, textureLoader, frontTexUrl, backTexUrl, () => {
    canvasContainer.style.opacity = '1';
    if (fallbackImg) fallbackImg.style.opacity = '0';
  });
  scene.add(boosterMesh);

  // Upright, slender orientation with natural 3D angle
  const baseRotation = { x: 0.03, y: -0.18, z: -0.02 };
  boosterMesh.rotation.set(baseRotation.x, baseRotation.y, baseRotation.z);

  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let dragVelocityX = 0;
  let dragVelocityY = 0;
  let targetRotY = baseRotation.y;
  let targetRotX = baseRotation.x;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchHasDragged = false;
  let isVerticalScroll = false;

  canvasContainer.addEventListener('pointerdown', (e) => {
    isDragging = true;
    userHasInteracted = true;
    touchHasDragged = false;
    isVerticalScroll = false;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    dragVelocityX = 0;
    dragVelocityY = 0;
    canvasContainer.style.cursor = 'grabbing';
    if (e.pointerType !== 'touch') {
      try {
        canvasContainer.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    badge360.style.opacity = '0';
  });

  canvasContainer.addEventListener('pointermove', (e) => {
    const rect = canvasContainer.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    cursorLight.position.x = nx * 3.5;
    cursorLight.position.y = -ny * 3.5;

    if (isDragging) {
      if (e.pointerType === 'touch') {
        const totalDx = e.clientX - touchStartX;
        const totalDy = e.clientY - touchStartY;
        if (!touchHasDragged && Math.abs(totalDy) > 8 && Math.abs(totalDy) > Math.abs(totalDx)) {
          isVerticalScroll = true;
          isDragging = false;
          return;
        }
        if (Math.abs(totalDx) > 8) {
          touchHasDragged = true;
        }
      }
      if (isVerticalScroll) return;

      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      dragVelocityX = deltaX * 0.012;
      dragVelocityY = deltaY * 0.012;

      boosterMesh.rotation.y += dragVelocityX;
      boosterMesh.rotation.x = Math.max(-0.6, Math.min(0.6, boosterMesh.rotation.x + dragVelocityY));
      targetRotY = boosterMesh.rotation.y;
      targetRotX = boosterMesh.rotation.x;
    } else {
      if (!userHasInteracted) {
        targetRotY = baseRotation.y + nx * 0.45;
        targetRotX = baseRotation.x - ny * 0.35;
      }
    }
  });

  const endDrag = (e) => {
    if (isDragging) {
      isDragging = false;
      canvasContainer.style.cursor = 'grab';
      try {
        canvasContainer.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  canvasContainer.addEventListener('pointerup', endDrag);
  canvasContainer.addEventListener('pointercancel', endDrag);

  canvasContainer.addEventListener('pointerleave', () => {
    if (!isDragging && !userHasInteracted) {
      targetRotY = baseRotation.y;
      targetRotX = baseRotation.x;
    }
  });

  const updateSize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  };
  const resizeObserver = new ResizeObserver(updateSize);
  resizeObserver.observe(stage);
  window.addEventListener('resize', updateSize);

  let animationFrameId = null;
  let isRendering = false;
  let clock = new THREE.Clock();

  function render() {
    if (!isRendering) return;

    const elapsedTime = clock.getElapsedTime();

    if (!isDragging) {
      if (Math.abs(dragVelocityX) > 0.0001) {
        boosterMesh.rotation.y += dragVelocityX;
        dragVelocityX *= 0.92;
        targetRotY = boosterMesh.rotation.y;
      } else if (!userHasInteracted) {
        boosterMesh.rotation.y += (targetRotY - boosterMesh.rotation.y) * 0.08;
        boosterMesh.rotation.x += (targetRotX - boosterMesh.rotation.x) * 0.08;
      }
    }

    const floatOffset = Math.sin(elapsedTime * 2.2) * 0.035;
    boosterMesh.position.y = floatOffset;
    if (!isDragging && !userHasInteracted) {
      boosterMesh.rotation.z = baseRotation.z + Math.sin(elapsedTime * 1.5) * 0.015;
    }

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(render);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!isRendering) {
            isRendering = true;
            clock.start();
            render();
          }
        } else {
          isRendering = false;
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(stage);
}

// --- 3. Setup Monopoly Game Box 3D Stage ---
function setupMonopolyStage(stage) {
  if (!stage) return;

  const itemWrapper = stage.querySelector('.goodies-3d-item');
  const fallbackImg = itemWrapper ? itemWrapper.querySelector('img') : null;

  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'goodies-3d-canvas-container';
  canvasContainer.setAttribute('aria-label', 'Vue 3D interactive de la boîte de jeu Monopoly Édition Classique France (Glisser pour faire pivoter à 360°)');
  canvasContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 5;
    cursor: grab;
    opacity: 0;
    transition: opacity 0.5s ease;
    touch-action: pan-y;
  `;

  const badge360 = document.createElement('div');
  badge360.className = 'goodies-3d-badge-interactive';
  badge360.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
    </svg>
    <span>3D • Glisser 360°</span>
  `;
  badge360.style.cssText = `
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.90);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #222;
    display: flex;
    align-items: center;
    gap: 5px;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;
  stage.appendChild(badge360);
  stage.appendChild(canvasContainer);

  const width = stage.clientWidth || 280;
  const height = stage.clientHeight || 290;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(0, 0, 4.8);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasContainer.appendChild(renderer.domElement);
  } catch (e) {
    console.warn('WebGL not supported for Three.js Monopoly', e);
    badge360.remove();
    canvasContainer.remove();
    return;
  }

  // Balanced PBR Studio Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.3);
  mainLight.position.set(2.8, 4.0, 3.2);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xbad7ff, 1.1);
  fillLight.position.set(-3.0, -1.0, 2.0);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffedd5, 0.9);
  rimLight.position.set(0, 3.5, -3.0);
  scene.add(rimLight);

  const cursorLight = new THREE.PointLight(0xffffff, 3.5, 7, 1.4);
  cursorLight.position.set(0, 0, 3.0);
  scene.add(cursorLight);

  // Textures Loading & sRGB calibration
  const textureLoader = new THREE.TextureLoader();
  let loadedCount = 0;
  function onTexLoaded() {
    loadedCount++;
    if (loadedCount >= 4) {
      canvasContainer.style.opacity = '1';
      if (fallbackImg) fallbackImg.style.opacity = '0';
    }
  }

  const frontTex = textureLoader.load(monopolyFrontTexUrl, onTexLoaded);
  frontTex.colorSpace = THREE.SRGBColorSpace;

  const backTex = textureLoader.load(monopolyBackTexUrl, onTexLoaded);
  backTex.colorSpace = THREE.SRGBColorSpace;

  const sideLongTex = textureLoader.load(monopolySideLongTexUrl, onTexLoaded);
  sideLongTex.colorSpace = THREE.SRGBColorSpace;

  const sideShortTex = textureLoader.load(monopolySideShortTexUrl, onTexLoaded);
  sideShortTex.colorSpace = THREE.SRGBColorSpace;

  // Clone and orient textures for perfect face symmetry
  const sideShortLeftTex = sideShortTex.clone();
  sideShortLeftTex.wrapS = THREE.RepeatWrapping;
  sideShortLeftTex.repeat.x = -1;
  sideShortLeftTex.offset.x = 1;
  sideShortLeftTex.needsUpdate = true;

  const sideLongTopTex = sideLongTex.clone();
  sideLongTopTex.wrapT = THREE.RepeatWrapping;
  sideLongTopTex.repeat.y = -1;
  sideLongTopTex.offset.y = 1;
  sideLongTopTex.needsUpdate = true;

  // Realistic satin/semi-gloss coated cardboard properties
  const cardboardMatProps = {
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.32,
    clearcoatRoughness: 0.28,
  };

  const rightMat = new THREE.MeshPhysicalMaterial({ map: sideShortTex, ...cardboardMatProps });
  const leftMat = new THREE.MeshPhysicalMaterial({ map: sideShortLeftTex, ...cardboardMatProps });
  const topMat = new THREE.MeshPhysicalMaterial({ map: sideLongTopTex, ...cardboardMatProps });
  const bottomMat = new THREE.MeshPhysicalMaterial({ map: sideLongTex, ...cardboardMatProps });
  const frontMat = new THREE.MeshPhysicalMaterial({ map: frontTex, ...cardboardMatProps });
  const backMat = new THREE.MeshPhysicalMaterial({ map: backTex, ...cardboardMatProps });

  // Material array order for BoxGeometry:
  // 0: +X (Right side)
  // 1: -X (Left side)
  // 2: +Y (Top side)
  // 3: -Y (Bottom side)
  // 4: +Z (Front face)
  // 5: -Z (Back face)
  const boxMaterials = [rightMat, leftMat, topMat, bottomMat, frontMat, backMat];

  // Box Dimensions: 4:3 aspect ratio, authentic board game depth (19%)
  const boxWidth = 2.44;
  const boxHeight = 1.83;
  const boxDepth = 0.36;

  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  const boxMesh = new THREE.Mesh(geometry, boxMaterials);
  scene.add(boxMesh);

  // Natural presentation angle showing front and side depth
  const baseRotation = { x: 0.12, y: -0.34, z: 0.02 };
  boxMesh.rotation.set(baseRotation.x, baseRotation.y, baseRotation.z);

  // Mouse & Touch Drag Controls with Inertia
  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let dragVelocityX = 0;
  let dragVelocityY = 0;
  let targetRotY = baseRotation.y;
  let targetRotX = baseRotation.x;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchHasDragged = false;
  let isVerticalScroll = false;

  canvasContainer.addEventListener('pointerdown', (e) => {
    isDragging = true;
    userHasInteracted = true;
    touchHasDragged = false;
    isVerticalScroll = false;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    dragVelocityX = 0;
    dragVelocityY = 0;
    canvasContainer.style.cursor = 'grabbing';
    if (e.pointerType !== 'touch') {
      try {
        canvasContainer.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    badge360.style.opacity = '0';
  });

  canvasContainer.addEventListener('pointermove', (e) => {
    const rect = canvasContainer.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    cursorLight.position.x = nx * 3.5;
    cursorLight.position.y = -ny * 3.5;

    if (isDragging) {
      if (e.pointerType === 'touch') {
        const totalDx = e.clientX - touchStartX;
        const totalDy = e.clientY - touchStartY;
        if (!touchHasDragged && Math.abs(totalDy) > 8 && Math.abs(totalDy) > Math.abs(totalDx)) {
          isVerticalScroll = true;
          isDragging = false;
          return;
        }
        if (Math.abs(totalDx) > 8) {
          touchHasDragged = true;
        }
      }
      if (isVerticalScroll) return;

      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      dragVelocityX = deltaX * 0.010;
      dragVelocityY = deltaY * 0.010;

      boxMesh.rotation.y += dragVelocityX;
      boxMesh.rotation.x = Math.max(-0.65, Math.min(0.65, boxMesh.rotation.x + dragVelocityY));
      targetRotY = boxMesh.rotation.y;
      targetRotX = boxMesh.rotation.x;
    } else {
      if (!userHasInteracted) {
        targetRotY = baseRotation.y + nx * 0.40;
        targetRotX = baseRotation.x - ny * 0.30;
      }
    }
  });

  const stopDrag = (e) => {
    if (isDragging) {
      isDragging = false;
      canvasContainer.style.cursor = 'grab';
      try {
        canvasContainer.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  canvasContainer.addEventListener('pointerup', stopDrag);
  canvasContainer.addEventListener('pointercancel', stopDrag);

  // Resize handler
  function updateSize() {
    const w = stage.clientWidth || 280;
    const h = stage.clientHeight || 290;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  const resizeObserver = new ResizeObserver(updateSize);
  resizeObserver.observe(stage);
  window.addEventListener('resize', updateSize);

  let animationFrameId = null;
  let isRendering = false;
  let clock = new THREE.Clock();

  function render() {
    if (!isRendering) return;

    const elapsedTime = clock.getElapsedTime();

    if (!isDragging) {
      if (Math.abs(dragVelocityX) > 0.0001) {
        boxMesh.rotation.y += dragVelocityX;
        dragVelocityX *= 0.92;
        targetRotY = boxMesh.rotation.y;
      } else if (!userHasInteracted) {
        boxMesh.rotation.y += (targetRotY - boxMesh.rotation.y) * 0.08;
        boxMesh.rotation.x += (targetRotX - boxMesh.rotation.x) * 0.08;
      }
    }

    const floatOffset = Math.sin(elapsedTime * 2.0) * 0.025;
    boxMesh.position.y = floatOffset;
    if (!isDragging && !userHasInteracted) {
      boxMesh.rotation.z = baseRotation.z + Math.sin(elapsedTime * 1.3) * 0.012;
    }

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(render);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!isRendering) {
            isRendering = true;
            clock.start();
            render();
          }
        } else {
          isRendering = false;
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(stage);
}

// Master Initialization
export function initThreeGoodies() {
  // 1. Combo Fan-out stage on 'all'
  const fanStage = document.querySelector('.goodies-3d-stage[data-booster-type="fan"]');
  if (fanStage) {
    setupBoosterFanStage(fanStage);
  }

  // 2. Individual Pokemon stage
  const pokemonStage = document.querySelector('.goodies-3d-stage[data-booster-type="pokemon"]');
  if (pokemonStage) {
    setupBoosterStage(
      pokemonStage,
      pokemonFrontTexUrl,
      pokemonBackTexUrl,
      'Vue 3D interactive du booster Pokémon Mascarade Crépusculaire (Glisser pour faire pivoter à 360°)'
    );
  }

  // 3. Individual Panini FIFA World Cup 2026 stage
  const fifaStage = document.querySelector('.goodies-3d-stage[data-booster-type="panini-fifa"]');
  if (fifaStage) {
    setupBoosterStage(
      fifaStage,
      fifaFrontTexUrl,
      fifaBackTexUrl,
      'Vue 3D interactive du booster Panini FIFA World Cup 2026 Adrenalyn XL (Glisser pour faire pivoter à 360°)'
    );
  }

  // 4. Individual Harry Potter stage
  const hpStage = document.querySelector('.goodies-3d-stage[data-booster-type="harry-potter"]');
  if (hpStage) {
    setupBoosterStage(
      hpStage,
      hpFrontTexUrl,
      hpBackTexUrl,
      'Vue 3D interactive du booster Panini Harry Potter ALWAYS (Glisser pour faire pivoter à 360°)'
    );
  }

  // 5. Monopoly Game Box 3D stage
  const monopolyStage = document.querySelector('.goodies-3d-stage[data-booster-type="monopoly"]');
  if (monopolyStage) {
    setupMonopolyStage(monopolyStage);
  }
}

