/* ══ the fixer LAB — raymarched 3D hero (raw WebGL, zero dependencies) ══ */
(function () {
  var canvas = document.getElementById('gl');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' })
        || canvas.getContext('experimental-webgl');
  if (!gl) return;

  var VERT = [
    'attribute vec2 p;',
    'void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uMouse;',
    'uniform float uScroll;',
    '',
    'const vec3 COPPER   = vec3(0.620, 0.386, 0.212);',
    'const vec3 COPPER_L = vec3(0.824, 0.596, 0.400);',
    '',
    'mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
    '',
    'float sdRoundBox(vec3 p, vec3 b, float r){',
    '  vec3 q = abs(p) - b;',
    '  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;',
    '}',
    'float smin(float a, float b, float k){',
    '  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);',
    '  return mix(b, a, h) - k*h*(1.0-h);',
    '}',
    '',
    '// the brand mark: a 3D "x" built from two rounded bars',
    'float map(vec3 p){',
    '  p.yz *= rot(-0.30 + uMouse.y*0.32 + uScroll*0.55);',
    '  p.xz *= rot(uTime*0.22 + uMouse.x*0.55);',
    '  vec3 a = p; a.xy *= rot(0.785398);',
    '  vec3 b = p; b.xy *= rot(-0.785398);',
    '  float bar1 = sdRoundBox(a, vec3(0.140, 1.00, 0.140), 0.065);',
    '  float bar2 = sdRoundBox(b, vec3(0.140, 1.00, 0.140), 0.065);',
    '  float d = smin(bar1, bar2, 0.15);',
    '  d += 0.022 * sin(3.4*p.x + uTime*0.9) * sin(3.4*p.y + uTime*0.6) * sin(3.4*p.z);',
    '  return d * 0.82;',
    '}',
    '',
    'vec3 normalAt(vec3 p){',
    '  vec2 e = vec2(0.0016, 0.0);',
    '  return normalize(vec3(',
    '    map(p+e.xyy)-map(p-e.xyy),',
    '    map(p+e.yxy)-map(p-e.yxy),',
    '    map(p+e.yyx)-map(p-e.yyx)));',
    '}',
    '',
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
    '  // background: deep charcoal with a warm bloom on the right',
    '  vec3 col = vec3(0.043, 0.039, 0.047);',
    '  col += COPPER * 0.070 * pow(max(0.0, 1.0 - length(uv - vec2(0.42,0.10))*0.92), 3.0);',
    '  float grain = hash(gl_FragCoord.xy + fract(uTime)*13.0);',
    '  col += (grain - 0.5) * 0.018;',
    '',
    '  vec3 ro = vec3(0.0, 0.0, 5.30 + uScroll*1.2);',
    '  vec3 rd = normalize(vec3(uv - vec2(0.33, -0.02), -1.75));',
    '',
    '  float t = 0.0; float hit = 0.0;',
    '  for(int i=0;i<78;i++){',
    '    vec3 pos = ro + rd*t;',
    '    float d = map(pos);',
    '    if(d < 0.0012){ hit = 1.0; break; }',
    '    if(t > 8.5) break;',
    '    t += d;',
    '  }',
    '',
    '  if(hit > 0.5){',
    '    vec3 pos = ro + rd*t;',
    '    vec3 n = normalAt(pos);',
    '    vec3 v = -rd;',
    '    vec3 l1 = normalize(vec3(0.85, 0.95, 0.65));',
    '    vec3 l2 = normalize(vec3(-0.85, -0.25, 0.45));',
    '',
    '    float dif  = max(dot(n, l1), 0.0);',
    '    float dif2 = max(dot(n, l2), 0.0);',
    '    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.2);',
    '    float spec = pow(max(dot(reflect(-l1, n), v), 0.0), 46.0);',
    '    float occ  = ao(pos, n);',
    '',
    '    // metal: low diffuse, strong specular + faux environment reflection',
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
    '    float fog = exp(-0.055 * t * t);',
    '    col = mix(col, m, fog);',
    '  }',
    '',
    '  col = col / (col + vec3(0.78));',            // tonemap
    '  col = pow(col, vec3(0.4545));',              // gamma
    '  col *= 1.0 - uScroll*0.55;',
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
      uScroll = gl.getUniformLocation(prog, 'uScroll');

  var quality = (window.innerWidth < 760 || navigator.hardwareConcurrency < 5) ? 0.55 : 0.8;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6) * quality;
    var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize, { passive: true });

  var mx = 0, my = 0, tmx = 0, tmy = 0, scroll = 0, visible = true, running = true, start = performance.now();

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
    if (running) { start = performance.now() - 1000; frame(); } else { draw(0.0); }
  });

  function draw(time) {
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uScroll, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  var raf = null;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible || !running) return;
    mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;
    scroll = Math.min(1, (window.scrollY || 0) / Math.max(1, window.innerHeight));
    resize();
    draw((performance.now() - start) / 1000);
  }

  resize();
  draw(0);
  canvas.classList.add('ready');
  if (document.documentElement.classList.contains('no-motion')) { running = false; }
  frame();
})();
