/* =========================================================
   Hero — maquete 3D de uma "região econômica"
   Blocos em estilo de maquete de arquitetura que reagem ao cursor.
   ========================================================= */
(function () {
  const wrap = document.getElementById("cityWrap");
  const canvas = document.getElementById("city");
  const tag = document.getElementById("cityTag");
  if (!window.THREE || !canvas || !wrap) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);

  const COLORS = {
    ivory: new THREE.Color("#f1ece2"),
    ivory2: new THREE.Color("#e6dfd1"),
    navy: new THREE.Color("#2f3a4e"),
    navyDeep: new THREE.Color("#1f2838"),
    gold: new THREE.Color("#b08d57"),
  };

  // ---------- Luzes ----------
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b4, 1.6));
  const sun = new THREE.DirectionalLight(0xfff6e8, 2.6);
  sun.position.set(-14, 26, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // ---------- Grade de blocos ----------
  const mobile = window.innerWidth < 820;
  const N = mobile ? 13 : 17;
  const GAP = 1.22;
  const half = ((N - 1) * GAP) / 2;
  const PLATE_H = 0.35;

  // Base da maquete
  const plateSize = N * GAP + 1.4;
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(plateSize, PLATE_H, plateSize),
    new THREE.MeshStandardMaterial({ color: COLORS.ivory2, roughness: 0.95 })
  );
  plate.position.y = PLATE_H / 2;
  plate.receiveShadow = true;
  plate.castShadow = true;
  scene.add(plate);

  // Linhas finas desenhadas sobre a base (como um mapa)
  const lineMat = new THREE.LineBasicMaterial({ color: COLORS.navy, transparent: true, opacity: 0.12 });
  const border = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(plateSize, PLATE_H, plateSize)),
    lineMat
  );
  border.position.copy(plate.position);
  scene.add(border);

  // Sombra no "chão" (transparente, só a sombra aparece)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Campo de alturas: dois "polos" econômicos + ondulação suave
  function heightAt(nx, nz) {
    const g = (x, z, cx, cz, s) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / s);
    let h = 0.35;
    h += 6.2 * g(nx, nz, 0.22, -0.18, 0.09);
    h += 3.6 * g(nx, nz, -0.42, 0.36, 0.07);
    h += 2.2 * g(nx, nz, 0.5, 0.55, 0.05);
    h += 0.5 * (Math.sin(nx * 7.0 + 1.3) * Math.cos(nz * 5.0) + 1);
    return h;
  }

  const cells = [];
  let tallest = null;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      // avenidas: algumas linhas/colunas vazias
      if (i % 6 === 3 || j % 6 === 3) continue;
      const x = i * GAP - half;
      const z = j * GAP - half;
      const nx = x / half, nz = z / half;
      const base = heightAt(nx, nz) * (0.75 + Math.random() * 0.5);
      const cell = {
        x, z, base,
        cur: 0,
        dist: Math.hypot(nx, nz),
        phase: Math.random() * Math.PI * 2,
        w: 0.7 + Math.random() * 0.2,
      };
      cells.push(cell);
      if (!tallest || base > tallest.base) tallest = cell;
    }
  }

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.02 });
  const blocks = new THREE.InstancedMesh(boxGeo, boxMat, cells.length);
  blocks.castShadow = true;
  blocks.receiveShadow = true;
  blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  cells.forEach((c, idx) => {
    let col = COLORS.ivory;
    const r = Math.random();
    if (c === tallest) col = COLORS.gold;
    else if (c.base > 3.2 && r < 0.45) col = COLORS.navy;
    else if (r < 0.07) col = COLORS.navyDeep;
    blocks.setColorAt(idx, col);
  });
  blocks.instanceColor.needsUpdate = true;
  scene.add(blocks);

  // ---------- Câmera (isométrica) ----------
  const cam = { az: Math.PI / 4, el: 0.62, r: 60, zoom: 1 };
  const target = new THREE.Vector3(0, 2.2, 0);
  let frustum = 26;

  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const a = w / h;
    frustum = Math.max(22, (plateSize * 1.5) / a);
    camera.left = (-frustum * a) / 2;
    camera.right = (frustum * a) / 2;
    camera.top = frustum / 2;
    camera.bottom = -frustum / 2;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- Interação ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PLATE_H);
  const hit = new THREE.Vector3();
  const hover = { x: 0, z: 0, strength: 0, active: false };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

  wrap.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) {
      hover.x = hit.x;
      hover.z = hit.z;
      hover.active = Math.abs(hit.x) < half + 2 && Math.abs(hit.z) < half + 2;
    }
  });
  wrap.addEventListener("pointerleave", () => { hover.active = false; });
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // ---------- Intro ----------
  const intro = { p: reduceMotion ? 1 : 0 };
  window.cityIntro = function () {
    if (!window.gsap || reduceMotion) { intro.p = 1; return; }
    gsap.to(intro, { p: 1, duration: 3.2, ease: "power3.out" });
  };

  // ---------- Visibilidade ----------
  let visible = true;
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(wrap);

  // ---------- Loop ----------
  const dummy = new THREE.Object3D();
  const topPos = new THREE.Vector3();
  const clock = new THREE.Clock();
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();

    mouse.sx += (mouse.x - mouse.sx) * 0.04;
    mouse.sy += (mouse.y - mouse.sy) * 0.04;
    hover.strength += ((hover.active ? 1 : 0) - hover.strength) * 0.08;

    // Rotação suave + scroll
    const heroH = wrap.offsetHeight || window.innerHeight;
    const sp = Math.min(1, Math.max(0, window.scrollY / heroH));
    const drift = reduceMotion ? 0 : Math.sin(t * 0.08) * 0.12;
    const az = cam.az + drift + mouse.sx * 0.18 + sp * 0.5 + (1 - intro.p) * -0.6;
    const el = cam.el + mouse.sy * 0.05 - sp * 0.12;
    camera.position.set(
      target.x + cam.r * Math.cos(el) * Math.sin(az),
      target.y + cam.r * Math.sin(el),
      target.z + cam.r * Math.cos(el) * Math.cos(az)
    );
    camera.zoom = 1 + sp * 0.25 + (1 - intro.p) * -0.12;
    camera.updateProjectionMatrix();
    camera.lookAt(target);

    // Blocos
    for (let k = 0; k < cells.length; k++) {
      const c = cells[k];
      const local = Math.min(1, Math.max(0, (intro.p * 1.6 - c.dist * 0.55)));
      const wave = reduceMotion ? 0 : Math.sin(t * 0.9 + c.phase + c.x * 0.25) * 0.08;
      const dx = c.x - hover.x, dz = c.z - hover.z;
      const lift = hover.strength * 3.2 * Math.exp(-(dx * dx + dz * dz) / 7);
      const targetH = Math.max(0.05, c.base * ease(local) * (1 + wave) + lift * ease(local));
      c.cur += (targetH - c.cur) * 0.1;

      dummy.position.set(c.x, PLATE_H, c.z);
      dummy.scale.set(c.w, Math.max(0.001, c.cur), c.w);
      dummy.updateMatrix();
      blocks.setMatrixAt(k, dummy.matrix);
    }
    blocks.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);

    // Etiqueta sobre o bloco dourado
    if (tag && tallest) {
      topPos.set(tallest.x, PLATE_H + tallest.cur + 0.4, tallest.z).project(camera);
      const x = (topPos.x * 0.5 + 0.5) * wrap.clientWidth;
      const y = (-topPos.y * 0.5 + 0.5) * wrap.clientHeight;
      tag.style.transform = `translate(${x}px, ${y}px) translate(-50%, -140%)`;
      tag.classList.toggle("is-visible", intro.p > 0.85 && sp < 0.5);
    }
  }
  requestAnimationFrame(tick);
})();
