/* ══ the fixer LAB — raymarched 3D brand mark (raw WebGL, zero dependencies) ══
   Το σχήμα ΔΕΝ είναι ζωγραφισμένο με το χέρι: διαβάζουμε το πραγματικό logo SVG,
   φτιάχνουμε signed distance field στη CPU και το κάνουμε extrude μέσα στον shader. */
(function () {
  var canvas = document.getElementById('gl');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' })
        || canvas.getContext('experimental-webgl');
  if (!gl) return;

  var SDF_N = 256;      // ανάλυση του distance field
  var SDF_RANGE = 60;   // pixels που καλύπτει το ±0.5 του byte

  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uMouse;',
    'uniform float uScroll;',
    'uniform float uHasGlyph;',
    'uniform sampler2D uSDF;',
    '',
    'const vec3 COPPER   = vec3(0.620, 0.386, 0.212);',
    'const vec3 COPPER_L = vec3(0.824, 0.596, 0.400);',
    'const float S  = 0.95;',
    'const float TH = 0.115;',
    'const float R  = 0.045;',
    'const float SDF_RANGE = ' + SDF_RANGE.toFixed(1) + ';',
    'const float SDF_HALF  = ' + (SDF_N / 2).toFixed(1) + ';',
    '',
    'mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
    'float sdRoundBox(vec3 p, vec3 b, float r){',
    '  vec3 q = abs(p) - b;',
    '  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;',
    '}',
    'float smin(float a, float b, float k){',
    '  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);',
    '  return mix(b, a, h) - k*h*(1.0-h);',
    '}',
    '',
    'float sdGlyph(vec2 q){',
    '  vec2 c = clamp(q, -1.0, 1.0);',
    '  float outside = length(q - c);',
    '  float v = texture2D(uSDF, c*0.5 + 0.5).r;',
    '  float d = (v - 0.5) * 2.0 * SDF_RANGE / SDF_HALF;',
    '  return d + outside;',
    '}',
    '',
    'float map(vec3 p){',
    '  p.xz *= rot(sin(uTime*0.21)*0.36 + uMouse.x*0.40);',
    '  p.yz *= rot(sin(uTime*0.155)*0.14 + uMouse.y*0.22 + uScroll*0.40);',
    '  float d;',
    '  if (uHasGlyph > 0.5) {',
    '    float d2 = sdGlyph(p.xy / S) * S;',
    '    float dz = abs(p.z) - TH;',
    '    d = min(max(d2, dz), 0.0) + length(max(vec2(d2, dz), 0.0)) - R;',
    '    d += 0.006 * sin(4.0*p.x + uTime*0.8) * sin(4.0*p.y + uTime*0.5);',
    '    return d * 0.72;',
    '  }',
    '  vec3 a = p; a.xy *= rot(0.785398);',
    '  vec3 b = p; b.xy *= rot(-0.785398);',
    '  d = smin(sdRoundBox(a, vec3(0.14, 1.0, 0.14), 0.065),',
    '           sdRoundBox(b, vec3(0.14, 1.0, 0.14), 0.065), 0.15);',
    '  d += 0.022 * sin(3.4*p.x + uTime*0.9) * sin(3.4*p.y + uTime*0.6) * sin(3.4*p.z);',
    '  return d * 0.82;',
    '}',
    '',
    'vec3 normalAt(vec3 p){',
    '  vec2 e = vec2(0.0022, 0.0);',
    '  return normalize(vec3(',
    '    map(p+e.xyy)-map(p-e.xyy),',
    '    map(p+e.yxy)-map(p-e.yxy),',
    '    map(p+e.yyx)-map(p-e.yyx)));',
    '}',
    'float ao(vec3 p, vec3 n){',
    '  float o = 0.0, s = 1.0;',
    '  for(int i=0;i<4;i++){',
    '    float h = 0.02 + 0.14*float(i);',
    '    o += (h - map(p + n*h)) * s;',
    '    s *= 0.72;',
    '  }',
    '  return clamp(1.0 - 1.4*o, 0.0, 1.0);',
    '}',
    '',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;',
    '  vec3 col = vec3(0.043, 0.039, 0.047);',
    '  col += COPPER * 0.070 * pow(max(0.0, 1.0 - length(uv - vec2(0.42,0.10))*0.92), 3.0);',
    '  col += (hash(gl_FragCoord.xy + fract(uTime)*13.0) - 0.5) * 0.018;',
    '',
    '  // σε κάθετη οθόνη το mark πάει ψηλά δεξιά και μικραίνει, αλλιώς κόβεται',
    '  float port = 1.0 - smoothstep(0.72, 1.15, uRes.x / uRes.y);',
    '  vec2  off  = mix(vec2(0.30, 0.055), vec2(0.105, 0.285), port);',
    '  vec3 ro = vec3(0.0, 0.0, mix(8.20, 11.20, port) + uScroll*1.6);',
    '  vec3 rd = normalize(vec3(uv - off, -1.75));',
    '',
    '  float t = 0.0; float hit = 0.0;',
    '  for(int i=0;i<92;i++){',
    '    float d = map(ro + rd*t);',
    '    if(d < 0.0014){ hit = 1.0; break; }',
    '    if(t > 13.0) break;',
    '    t += d * 0.82;',
    '  }',
    '',
    '  if(hit > 0.5){',
    '    vec3 pos = ro + rd*t;',
    '    vec3 n = normalAt(pos);',
    '    vec3 v = -rd;',
    '    vec3 l1 = normalize(vec3(0.85, 0.95, 0.65));',
    '    vec3 l2 = normalize(vec3(-0.85, -0.25, 0.45));',
    '    float dif  = max(dot(n, l1), 0.0);',
    '    float dif2 = max(dot(n, l2), 0.0);',
    '    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.2);',
    '    float spec = pow(max(dot(reflect(-l1, n), v), 0.0), 46.0);',
    '    float occ  = ao(pos, n);',
    '',
    '    vec3 r = reflect(-v, n);',
    '    float band = smoothstep(-0.25, 0.85, r.y);',
    '    vec3 env = mix(vec3(0.028, 0.024, 0.030), COPPER_L * 1.20, band);',
    '    env += vec3(1.0, 0.92, 0.80) * pow(smoothstep(0.55, 1.0, r.y), 8.0) * 0.55;',
    '    env *= 0.55 + 0.45 * smoothstep(0.15, 0.9, sin(r.x*5.0 + r.z*3.0 + uTime*0.35)*0.5+0.5);',
    '',
    '    vec3 m = COPPER * (0.045 + 0.40*dif) * occ;',
    '    m += env * COPPER * 1.65 * occ;',
    '    m += COPPER_L * dif2 * 0.16 * occ;',
    '    m += vec3(1.0, 0.90, 0.76) * spec * 1.9;',
    '    m += COPPER_L * fres * 0.60 * occ;',
    '    float fog = 1.0 - smoothstep(9.5, 13.0, t);',
    '    col = mix(col, m, fog);',
    '  }',
    '',
    '  // bloom γύρω από το σήμα, σαν να διαχέεται στον φακό',
    '  col += COPPER_L * exp(-length(uv - off) * 3.1) * 0.055;',
    '  // anamorphic streak — η οριζόντια μπλε λάμψη των σινεμασκόπ φακών',
    '  float streak = exp(-abs(uv.y - off.y) * 78.0) * exp(-abs(uv.x - off.x) * 1.5);',
    '  col += vec3(0.34, 0.55, 1.0) * streak * 0.13;',
    '',
    '  col = col / (col + vec3(0.78));',
    '  col = pow(col, vec3(0.4545));',
    '  col *= 1.0 - uScroll*0.55;',
    '',
    '  // διασπορά φακού στις άκρες + βινιέτα',
    '  float r2 = dot(uv, uv);',
    '  col.r *= 1.0 + 0.055 * r2;',
    '  col.b *= 1.0 - 0.040 * r2;',
    '  col *= 1.0 - 0.26 * pow(r2 * 1.2, 1.3);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes'),
      uTime = gl.getUniformLocation(prog, 'uTime'),
      uMouse = gl.getUniformLocation(prog, 'uMouse'),
      uScroll = gl.getUniformLocation(prog, 'uScroll'),
      uHasGlyph = gl.getUniformLocation(prog, 'uHasGlyph'),
      uSDFLoc = gl.getUniformLocation(prog, 'uSDF');

  /* ── placeholder texture μέχρι να ετοιμαστεί το SDF ── */
  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(uSDFLoc, 0);
  gl.uniform1f(uHasGlyph, 0.0);

  /* ── Felzenszwalb exact euclidean distance transform ── */
  function edt1d(f, d, v, z, n) {
    var k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
    for (var q = 1; q < n; q++) {
      var s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) {
        k--;
        s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
    }
    k = 0;
    for (var q2 = 0; q2 < n; q2++) {
      while (z[k + 1] < q2) k++;
      d[q2] = (q2 - v[k]) * (q2 - v[k]) + f[v[k]];
    }
  }
  function edt2d(grid, w, h) {
    var f = new Float64Array(Math.max(w, h)), d = new Float64Array(Math.max(w, h));
    var v = new Int32Array(Math.max(w, h)), z = new Float64Array(Math.max(w, h) + 1);
    var x, y;
    for (x = 0; x < w; x++) {
      for (y = 0; y < h; y++) f[y] = grid[y * w + x];
      edt1d(f, d, v, z, h);
      for (y = 0; y < h; y++) grid[y * w + x] = d[y];
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) f[x] = grid[y * w + x];
      edt1d(f, d, v, z, w);
      for (x = 0; x < w; x++) grid[y * w + x] = d[x];
    }
    return grid;
  }

  function buildSDF(img) {
    var N = SDF_N, INF = 1e20;
    var c = document.createElement('canvas'); c.width = c.height = N;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, N, N);
    // κεντράρισμα με padding ώστε το glyph να πιάνει ~76% του καμβά
    var pad = 0.12, box = N * (1 - pad * 2);
    var s = Math.min(box / img.width, box / img.height);
    var w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
    var data = ctx.getImageData(0, 0, N, N).data;

    var inside = new Float64Array(N * N), outside = new Float64Array(N * N);
    for (var i = 0; i < N * N; i++) {
      var a = data[i * 4 + 3] > 127;
      outside[i] = a ? 0 : INF;   // απόσταση από το μελάνι
      inside[i]  = a ? INF : 0;   // απόσταση από το κενό
    }
    edt2d(outside, N, N); edt2d(inside, N, N);

    var px = new Uint8Array(N * N);
    for (var j = 0; j < N * N; j++) {
      var sd = Math.sqrt(outside[j]) - Math.sqrt(inside[j]);   // >0 έξω, <0 μέσα
      var vv = 0.5 + sd / (2 * SDF_RANGE);
      px[j] = Math.max(0, Math.min(255, Math.round(vv * 255)));
    }
    // το texture διαβάζεται με y προς τα πάνω — γυρίζουμε τις γραμμές
    var flipped = new Uint8Array(N * N);
    for (var r = 0; r < N; r++) flipped.set(px.subarray((N - 1 - r) * N, (N - r) * N), r * N);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, N, N, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, flipped);
    gl.uniform1f(uHasGlyph, 1.0);
  }

  fetch('/assets/img/mark-gold.svg')
    .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
    .then(function (svg) {
      var img = new Image();
      img.onload = function () { try { buildSDF(img); } catch (e) { console.warn('SDF failed', e); } };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    })
    .catch(function () { /* μένει το procedural fallback */ });

  var quality = (window.innerWidth < 760 || (navigator.hardwareConcurrency || 8) < 5) ? 0.55 : 0.8;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6) * quality;
    var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  window.addEventListener('resize', function () { resize(); if (!running) draw(lastT); }, { passive: true });

  var mx = 0, my = 0, tmx = 0, tmy = 0, scroll = 0, visible = true, running = true,
      start = performance.now(), lastT = 1.6;

  window.addEventListener('pointermove', function (e) {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  var hero = document.getElementById('hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { visible = !document.hidden; });

  window.addEventListener('tf:motion', function (e) {
    running = !!e.detail;
    if (running) { start = performance.now() - lastT * 1000; }
    else { resize(); draw(lastT); }
  });

  function draw(time) {
    lastT = time;
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uScroll, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !running) return;
    mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;
    scroll = Math.min(1, (window.scrollY || 0) / Math.max(1, window.innerHeight));
    resize();
    draw((performance.now() - start) / 1000);
  }

  resize();
  draw(lastT);
  canvas.classList.add('ready');
  frame();
})();
