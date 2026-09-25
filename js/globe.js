/* =========================================================
   Jornada — globo 3D de Angola a São Leopoldo
   Controlado pelo scroll (window.journeyGlobe.setProgress)
   ========================================================= */
(function () {
  const wrap = document.querySelector(".journey__visual");
  const canvas = document.getElementById("globe");
  if (!window.THREE || !canvas || !wrap) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DEG = Math.PI / 180;
  const R = 2.2;

  const COLORS = {
    cream: new THREE.Color("#e9dfcb"),
    gold: new THREE.Color("#c9a46a"),
    core: new THREE.Color("#222c3e"),
    rim: new THREE.Color("#8b98b3"),
  };
  const HOME = { lat: -12.2, lon: 17.6 };   // Angola (centro do país)
  const NOW = { lat: -10.6, lon: -52.4 };   // Brasil (centro do país)

  // Contornos simplificados de Angola e do Brasil, destacados em dourado [lon, lat]
  const ANGOLA = [[12.2,-6.0],[13.0,-5.9],[16.3,-5.9],[16.6,-7.2],[17.6,-8.1],[19.4,-7.2],[21.8,-7.3],[21.8,-9.5],[22.2,-11.0],[24.0,-11.0],[24.0,-13.0],[22.0,-13.0],[22.0,-16.2],[23.4,-17.6],[20.9,-18.3],[18.4,-17.4],[13.9,-17.4],[11.7,-17.3],[12.0,-15.8],[12.5,-13.6],[13.7,-11.3],[13.2,-9.0],[12.3,-6.1]];
  const BRASIL = [[-51.6,4.2],[-50.0,1.8],[-48.5,-1.0],[-44.5,-2.4],[-39.0,-3.0],[-35.2,-5.4],[-34.8,-7.5],[-37.0,-11.0],[-39.0,-14.0],[-39.2,-17.8],[-41.0,-22.0],[-44.5,-23.2],[-48.5,-26.5],[-49.5,-29.0],[-53.4,-33.7],[-57.6,-30.2],[-55.8,-28.2],[-53.8,-25.6],[-54.6,-25.5],[-58.2,-20.2],[-57.8,-17.5],[-60.2,-13.5],[-65.3,-10.9],[-70.6,-11.0],[-73.9,-7.4],[-73.0,-5.0],[-69.9,-4.2],[-70.0,-1.0],[-69.5,1.0],[-66.9,1.2],[-64.1,3.9],[-60.0,5.2],[-56.5,1.9],[-54.0,2.3]];

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return;
  }
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 8.4);

  const globe = new THREE.Group();
  scene.add(globe);

  function latLonToVec3(lat, lon, r) {
    const phi = (90 - lat) * DEG;
    const theta = (lon + 180) * DEG;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Contornos simplificados dos continentes [lon, lat]
  const LAND = [
    [[-17,21],[-16,28],[-10,30],[-6,36],[10,37],[11,33],[20,31],[32,31],[34,28],[39,20],[43,12],[51,12],[51,10],[42,-1],[40,-10],[40,-16],[35,-24],[33,-27],[27,-34],[20,-35],[18,-32],[12,-18],[13,-9],[9,-1],[9,4],[5,6],[-4,5],[-8,4],[-13,8],[-17,14]],
    [[-80,9],[-77,8],[-72,12],[-62,11],[-52,5],[-50,0],[-44,-2],[-35,-5],[-35,-9],[-39,-15],[-41,-22],[-48,-26],[-53,-34],[-58,-38],[-62,-39],[-65,-42],[-66,-47],[-69,-52],[-72,-54],[-75,-50],[-73,-42],[-71,-30],[-70,-18],[-76,-14],[-81,-5],[-80,-1],[-78,2]],
    [[-165,65],[-168,69],[-156,71],[-140,70],[-128,70],[-115,68],[-95,72],[-82,73],[-80,63],[-94,60],[-92,57],[-82,55],[-79,52],[-76,62],[-65,60],[-60,55],[-56,52],[-66,45],[-70,42],[-76,35],[-81,31],[-80,25],[-83,29],[-90,30],[-97,27],[-97,21],[-92,18],[-87,21],[-88,16],[-83,10],[-78,8],[-80,8],[-86,12],[-92,14],[-105,20],[-110,24],[-115,30],[-117,33],[-121,35],[-124,40],[-124,47],[-130,54],[-137,59],[-150,60],[-158,57],[-165,60]],
    [[-10,36],[-9,43],[-2,44],[-5,48],[2,51],[5,53],[8,57],[12,55],[10,59],[5,62],[14,68],[22,71],[30,70],[40,68],[44,66],[60,68],[60,55],[50,47],[40,45],[36,41],[28,41],[26,38],[22,37],[20,40],[15,45],[13,45],[16,41],[18,40],[12,44],[8,44],[3,43],[-1,37],[-5,36]],
    [[44,66],[60,69],[70,73],[80,73],[100,78],[113,74],[130,71],[150,72],[170,70],[180,66],[172,60],[163,58],[156,51],[142,59],[135,55],[141,48],[130,42],[127,35],[122,40],[122,31],[120,23],[110,20],[108,11],[105,9],[100,13],[100,3],[104,1],[98,8],[98,16],[92,21],[88,22],[80,15],[77,8],[73,17],[72,21],[66,25],[57,25],[56,27],[50,30],[48,29],[55,23],[59,22],[52,16],[45,13],[43,15],[35,28],[34,31],[36,36],[28,37],[26,40],[36,41],[40,45],[50,47],[60,55],[60,68]],
    [[114,-22],[114,-34],[118,-35],[124,-34],[132,-31],[138,-35],[141,-38],[147,-38],[150,-37],[153,-30],[153,-25],[146,-19],[142,-11],[141,-17],[136,-12],[131,-11],[126,-14],[122,-18]],
    [[-73,78],[-60,82],[-30,83],[-20,80],[-20,70],[-40,65],[-43,60],[-50,62],[-55,70],[-70,77]],
    [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
    [[-5,50],[1,51],[2,53],[-2,57],[-5,58],[-6,55],[-3,54],[-5,52]],
    [[130,31],[135,34],[140,35],[142,40],[141,45],[140,41],[136,36],[131,34]],
    [[95,5],[98,4],[104,-3],[106,-6],[102,-4],[95,3]],
    [[109,1],[117,7],[119,1],[116,-4],[110,-3]],
    [[131,-1],[141,-3],[150,-10],[141,-9],[137,-5]],
  ];
  function inPoly(lon, lat, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const isLand = (lon, lat) => LAND.some((p) => inPoly(lon, lat, p));

  const homeV = latLonToVec3(HOME.lat, HOME.lon, R);
  const nowV = latLonToVec3(NOW.lat, NOW.lon, R);

  // ---------- Pontos ----------
  const positions = [], colors = [], sizes = [];
  const step = 1.5;
  const tmp = new THREE.Color();
  for (let lat = -56; lat <= 84; lat += step) {
    const n = Math.max(1, Math.floor((360 / step) * Math.cos(lat * DEG)));
    for (let i = 0; i < n; i++) {
      const lon = -180 + (i * 360) / n;
      if (!isLand(lon, lat)) continue;
      const v = latLonToVec3(lat, lon, R);
      positions.push(v.x, v.y, v.z);
      const h = inPoly(lon, lat, ANGOLA) || inPoly(lon, lat, BRASIL) ? 1 : 0;
      tmp.copy(COLORS.cream).lerp(COLORS.gold, h);
      colors.push(tmp.r, tmp.g, tmp.b);
      sizes.push(1 + h * 0.35);
    }
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  dotGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  dotGeo.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
  const dotMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uSize: { value: 26 * pixelRatio } },
    vertexShader: `
      uniform float uSize;
      attribute vec3 color; attribute float aSize;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vec3 wn = normalize(mat3(modelMatrix) * position);
        float facing = dot(wn, normalize(cameraPosition - wp.xyz));
        vAlpha = smoothstep(-0.05, 0.4, facing);
        vColor = color;
        vec4 mv = viewMatrix * wp;
        gl_PointSize = uSize * aSize / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.2, d) * vAlpha * 0.95);
        #include <colorspace_fragment>
      }`,
  });
  const dots = new THREE.Points(dotGeo, dotMat);
  dots.renderOrder = 2;
  globe.add(dots);

  // ---------- Esfera ----------
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: { uCore: { value: COLORS.core }, uRim: { value: COLORS.rim } },
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform vec3 uCore; uniform vec3 uRim;
        varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
          gl_FragColor = vec4(mix(uCore, uRim, f * 0.35), 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  core.renderOrder = 1;
  globe.add(core);

  // Meridianos e paralelos finos
  const gridMat = new THREE.LineBasicMaterial({ color: 0xe9dfcb, transparent: true, opacity: 0.06, depthWrite: false });
  const addLine = (pts) => {
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat);
    ln.renderOrder = 2;
    globe.add(ln);
  };
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 4) pts.push(latLonToVec3(lat, lon, R * 1.003));
    addLine(pts);
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 4) pts.push(latLonToVec3(lat, lon, R * 1.003));
    addLine(pts);
  }

  // Anel orbital decorativo
  const orbit = new THREE.Mesh(
    new THREE.RingGeometry(R * 1.32, R * 1.325, 128),
    new THREE.MeshBasicMaterial({ color: 0xe9dfcb, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
  );
  orbit.rotation.x = Math.PI / 2.3;
  scene.add(orbit);

  // ---------- Arco ----------
  const mid = homeV.clone().add(nowV).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(R + homeV.distanceTo(nowV) * 0.55);
  const curve = new THREE.QuadraticBezierCurve3(homeV, mid, nowV);
  const arcMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uProgress: { value: 0 }, uColor: { value: COLORS.gold }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uProgress; uniform vec3 uColor; uniform float uTime;
      varying vec2 vUv;
      void main() {
        if (vUv.x > uProgress) discard;
        float dash = step(0.35, fract(vUv.x * 60.0 - uTime * 0.6));
        float head = smoothstep(uProgress - 0.08, uProgress, vUv.x);
        gl_FragColor = vec4(uColor + head * 0.25, mix(0.55 + 0.45 * dash, 1.0, head));
        #include <colorspace_fragment>
      }`,
  });
  const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.012, 8, false), arcMat);
  arc.renderOrder = 3;
  globe.add(arc);

  const traveler = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0xf3e6c8 }));
  traveler.renderOrder = 4;
  globe.add(traveler);

  // ---------- Marcadores ----------
  function makeMarker(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);
    g.lookAt(pos.clone().multiplyScalar(2));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.032, 32), new THREE.MeshBasicMaterial({ color: COLORS.gold }));
    dot.position.z = 0.01;
    g.add(dot);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.058, 48),
      new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.z = 0.012;
    g.add(ring);
    g.traverse((o) => { o.renderOrder = 3; });
    g.userData.ring = ring;
    globe.add(g);
    return g;
  }
  const markerA = makeMarker(homeV);
  const markerB = makeMarker(nowV);

  // ---------- Orientação ----------
  const faceAngles = (lat, lon) => {
    const v = latLonToVec3(lat, lon, 1);
    return { y: Math.atan2(-v.x, v.z), x: lat * DEG };
  };
  const A = faceAngles(HOME.lat - 2, HOME.lon - 10);
  const B = faceAngles(NOW.lat - 2, NOW.lon + 24);
  let dY = B.y - A.y;
  while (dY > Math.PI) dY -= Math.PI * 2;
  while (dY < -Math.PI) dY += Math.PI * 2;
  globe.rotation.order = "XYZ";

  // ---------- API controlada pelo scroll ----------
  const state = { progress: 0, smooth: 0 };
  window.journeyGlobe = {
    setProgress(p) { state.progress = Math.min(1, Math.max(0, p)); },
  };

  // Arrastar
  const drag = { active: false, lastX: 0, off: 0, vel: 0 };
  wrap.addEventListener("pointerdown", (e) => { drag.active = true; drag.lastX = e.clientX; });
  window.addEventListener("pointermove", (e) => {
    if (!drag.active) return;
    drag.vel = (e.clientX - drag.lastX) * 0.006;
    drag.off += drag.vel;
    drag.lastX = e.clientX;
  }, { passive: true });
  window.addEventListener("pointerup", () => { drag.active = false; });

  // Tamanho e posição
  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 0.9 ? 9.6 : 8.4;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let visible = false;
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(wrap);

  const labelA = document.getElementById("glA");
  const labelB = document.getElementById("glB");
  const tmpV = new THREE.Vector3();
  const tmpN = new THREE.Vector3();
  function placeLabel(el, marker, show, side) {
    if (!el) return;
    marker.getWorldPosition(tmpV);
    tmpN.copy(tmpV).normalize();
    const facing = tmpN.dot(tmpV.clone().sub(camera.position).multiplyScalar(-1).normalize());
    tmpV.project(camera);
    const x = (tmpV.x * 0.5 + 0.5) * wrap.clientWidth;
    const y = (-tmpV.y * 0.5 + 0.5) * wrap.clientHeight;
    el.style.transform = `translate(${x}px, ${y}px) translate(${side > 0 ? "18px" : "calc(-100% - 18px)"}, -50%)`;
    el.classList.toggle("is-visible", show && facing > 0.2);
  }

  const smoothstep = (t) => t * t * (3 - 2 * t);
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();

    state.smooth += (state.progress - state.smooth) * 0.08;
    const p = state.smooth;
    const turn = smoothstep(Math.min(1, Math.max(0, (p - 0.1) / 0.8)));

    if (!drag.active) drag.off *= 0.95;
    const idle = reduceMotion ? 0 : Math.sin(t * 0.25) * 0.04;
    globe.rotation.y = A.y + dY * turn + drag.off + idle;
    globe.rotation.x = A.x + (B.x - A.x) * turn;
    orbit.rotation.z = t * 0.05;

    const arcP = Math.min(1, Math.max(0, (p - 0.12) / 0.7));
    arcMat.uniforms.uProgress.value = arcP;
    arcMat.uniforms.uTime.value = t;
    traveler.position.copy(curve.getPoint(Math.max(0.001, arcP)));
    traveler.visible = arcP > 0.001 && arcP < 0.999;

    const pulse = (t * 0.7) % 1;
    [markerA, markerB].forEach((m, i) => {
      const on = i === 0 ? 1 : arcP >= 0.98 ? 1 : 0;
      m.scale.setScalar(Math.max(0.001, on));
      m.userData.ring.scale.setScalar(1 + pulse * 3.2);
      m.userData.ring.material.opacity = (1 - pulse) * 0.6;
    });

    renderer.render(scene, camera);

    placeLabel(labelA, markerA, true, 1);
    placeLabel(labelB, markerB, arcP >= 0.98, -1);
  }
  requestAnimationFrame(tick);
})();
