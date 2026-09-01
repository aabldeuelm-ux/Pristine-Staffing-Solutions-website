import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const LOGO_SCALE = 0.0114;
const NAVY_DEPTH = 10;
const TEAL_RECESS_DEPTH = 0.75;
const ROTATION_SPEED = 0.008;
const FALLBACK_Y = -0.85;
const FALLBACK_X = 0.35;
const FRAME_PADDING = 0.66;
const TILT_MAX = 0.28;
const TILT_SMOOTHING = 0.035;

function prefersReducedMotion() {
  return (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function rendererCapabilities() {
  try {
    const canvas = document.createElement('canvas');
    const test = new THREE.WebGLRenderer({ canvas, antialias: true });
    const ok = test.capabilities.isWebGL2;
    test.dispose();
    return ok;
  } catch (err) {
    return false;
  }
}

function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(1, 1, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  return renderer;
}

function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(35, 1, 1, 200);
  camera.position.set(0, 0, 12);
  camera.lookAt(0, 0, 0);

  const spin = new THREE.Group(); // slow auto-rotation on Y
  const parallax = new THREE.Group(); // mouse tilt, no auto-spin
  const logo = new THREE.Group(); // holds extruded meshes at origin
  parallax.add(logo);
  spin.add(parallax);
  scene.add(spin);

  return { scene, camera, spin, parallax, logo };
}

function createEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return env;
}

function createLights(dark) {
  const key = new THREE.DirectionalLight('#fff6e6', dark ? 3.6 : 3.0);
  key.position.set(-6, 8, 5);

  const fill = new THREE.DirectionalLight('#1F4B44', dark ? 1.5 : 1.2);
  fill.position.set(5, -3, 4);

  const rim = new THREE.DirectionalLight('#e8e2d0', dark ? 1.9 : 1.6);
  rim.position.set(-2, 5, -6);

  const ambient = new THREE.AmbientLight('#ffffff', dark ? 0.55 : 0.4);

  return [key, fill, rim, ambient];
}

function makeMaterial(fill, envMap) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(fill),
    metalness: 0.6,
    roughness: 0.35,
    envMap,
    envMapIntensity: 1.1,
  });
}

function addExtrudedShapes(node, shapeList, fill, envMap, depth, zOffset) {
  const mat = makeMaterial(fill, envMap);
  const extrusion = {
    depth,
    bevelEnabled: true,
    bevelThickness: 2,
    bevelSize: 1.2,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 8,
    steps: 1,
  };

  shapeList.forEach((shape) => {
    const geometry = new THREE.ExtrudeGeometry(shape, extrusion);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.z = zOffset;
    node.add(mesh);
  });
}

function mirrorGeometryY(geometry) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, -pos.getY(i));

  const index = geometry.index;
  if (index) {
    const arr = index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const b = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = b;
    }
  }

  geometry.computeVertexNormals();
  pos.needsUpdate = true;
}

function centerGeometryAtOrigin(node) {
  const box = new THREE.Box3().setFromObject(node);
  const center = box.getCenter(new THREE.Vector3());

  node.traverse((obj) => {
    if (obj.isMesh) obj.geometry.translate(-center.x, -center.y, -center.z);
  });

  return new THREE.Box3().setFromObject(node).getSize(new THREE.Vector3());
}

function buildLogo(logoGroup, envMap) {
  const loader = new SVGLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      '/pristine-logo.svg',
      (data) => {
        const navyShapes = [];
        const tealShapes = [];
        const navy = new THREE.Color(0x070963);
        const teal = new THREE.Color(0x1facad);

        data.paths.forEach((path) => {
          const fill =
            path.userData && path.userData.style && path.userData.style.fill;
          if (!fill || fill === 'none') return;

          const color = new THREE.Color(fill);
          const target = color.equals(navy)
            ? navyShapes
            : color.equals(teal)
              ? tealShapes
              : null;
          if (!target) return;

          path.toShapes(true).forEach((shape) => target.push(shape));
        });

        addExtrudedShapes(logoGroup, navyShapes, '#070963', envMap, NAVY_DEPTH, 0);
        addExtrudedShapes(
          logoGroup,
          tealShapes,
          '#1facad',
          envMap,
          NAVY_DEPTH,
          -TEAL_RECESS_DEPTH
        );

        logoGroup.traverse((obj) => {
          if (obj.isMesh) mirrorGeometryY(obj.geometry);
        });

        const size = centerGeometryAtOrigin(logoGroup);
        logoGroup.scale.set(LOGO_SCALE, LOGO_SCALE, LOGO_SCALE);

        // TEMP: verify centering + sizing
        console.log(
          `[hero3d] logo centered at origin, size after scale — w: ${(size.x * LOGO_SCALE).toFixed(3)}, h: ${(size.y * LOGO_SCALE).toFixed(3)}, d: ${(size.z * LOGO_SCALE).toFixed(3)}, raw svg h: ${size.y.toFixed(2)}`
        );

        resolve(size.x * LOGO_SCALE, size.y * LOGO_SCALE, size.z * LOGO_SCALE);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function fitDistance(size, aspect, fovDeg, padding) {
  const vFov = (fovDeg * Math.PI) / 180;
  // visible height needed must cover height AND width (given aspect)
  const neededHeight = Math.max(size.y * padding, (size.x * padding) / aspect);
  return neededHeight / (2 * Math.tan(vFov / 2));
}

function resizeRenderer(renderer, camera, container) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) return;

  renderer.setSize(width, height, false);
  const aspect = width / height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  return aspect;
}

function disposeGroup(group) {
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

export function initHero3D(container) {
  if (!container) return null;
  if (!rendererCapabilities()) return null;

  const reduced = prefersReducedMotion();
  const hasHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  let pointerInside = false;
  let hostVisible = true;
  let logoSize = null;
  let targetTiltX = 0;
  let targetTiltY = 0;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero3d__canvas';
  container.appendChild(canvas);

  const renderer = createRenderer(canvas);
  const { scene, camera, spin, parallax, logo } = createScene(container);
  const envMap = createEnvironment(renderer);

  const initialDark =
    document.documentElement.getAttribute('data-theme') === 'dark';
  const lights = createLights(initialDark);
  const [keyLight, fillLight, rimLight, ambientLight] = lights;
  lights.forEach((light) => scene.add(light));

  const syncThemeLights = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    keyLight.intensity = dark ? 3.6 : 3.0;
    fillLight.intensity = dark ? 1.5 : 1.2;
    rimLight.intensity = dark ? 1.9 : 1.6;
    ambientLight.intensity = dark ? 0.55 : 0.4;
  };
  window.addEventListener('theme:toggle', syncThemeLights);

  let animationId = null;
  let disposed = false;
  let logoReady = false;
  let observer = null;
  let ro = null;

  const onPointerEnter = () => {
    pointerInside = true;
  };
  const onPointerLeave = () => {
    pointerInside = false;
    targetTiltX = 0;
    targetTiltY = 0;
  };
  const onPointerDown = () => {
    pointerInside = true;
  };
  const onPointerUp = () => {
    pointerInside = false;
  };
  const onPointerMove = (event) => {
    if (reduced || !hasHover) return;
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2; // -1..1
    targetTiltY = x * TILT_MAX; // rotate y opposite cursor x
    targetTiltX = y * TILT_MAX * 0.6;
  };

  const onResize = () => {
    const aspect = resizeRenderer(renderer, camera, container);
    if (aspect && logoSize) {
      camera.position.z = fitDistance(
        logoSize,
        Math.max(aspect, 1e-4),
        35,
        FRAME_PADDING
      );
    }
  };

  const animate = () => {
    if (disposed) return;
    animationId = requestAnimationFrame(animate);

    if (logoReady && hostVisible && !reduced) {
      if (!pointerInside) spin.rotation.y += ROTATION_SPEED;
      // smooth tilt toward cursor (parallax), independent of spin
      if (hasHover) {
        parallax.rotation.x += (targetTiltX - parallax.rotation.x) * TILT_SMOOTHING;
        parallax.rotation.y += (targetTiltY - parallax.rotation.y) * TILT_SMOOTHING;
      }
    } else if (logoReady && reduced) {
      spin.rotation.y = FALLBACK_Y;
      spin.rotation.x = FALLBACK_X;
      parallax.rotation.set(0, 0, 0);
    }

    renderer.render(scene, camera);
  };

  const dispose = () => {
    disposed = true;
    if (animationId) cancelAnimationFrame(animationId);
    if (observer) observer.disconnect();
    if (ro) ro.disconnect();
    container.removeEventListener('pointerenter', onPointerEnter);
    container.removeEventListener('pointerleave', onPointerLeave);
    container.removeEventListener('pointerdown', onPointerDown);
    container.removeEventListener('pointerup', onPointerUp);
    container.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('theme:toggle', syncThemeLights);
    disposeGroup(spin);
    envMap.dispose();
    renderer.dispose();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) hostVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(container);
  }

  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(onResize);
    ro.observe(container);
  }

  container.addEventListener('pointerenter', onPointerEnter, { passive: true });
  container.addEventListener('pointerleave', onPointerLeave, { passive: true });
  container.addEventListener('pointerdown', onPointerDown, { passive: true });
  container.addEventListener('pointerup', onPointerUp, { passive: true });
  container.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', onResize);

  onResize();
  animate();

  buildLogo(logo, envMap)
    .then(([w, h, d]) => {
      if (disposed) return;
      logoSize = { x: w, y: h, z: d };
      logoReady = true;
      onResize();
    })
    .catch(() => {
      if (disposed) return;
      logoReady = true;
      onResize();
    });

  return { dispose };
}