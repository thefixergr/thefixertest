/* ══ ιστοσελίδες. — υγρή σφαίρα από κοράλι (raw WebGL raymarching, χωρίς βιβλιοθήκες) ══ */
(function () {
  var canvas = document.getElementById('gl');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' })
        || canvas.getContext('experimental-webgl');
  if (!gl) return;

  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll;',
    'const vec3 CORAL = vec3(1.0, 0.33, 0.20);',
    'const vec3 PEACH = vec3(1.0, 0.62, 0.50);',
    'const vec3 DEEP  = vec3(0.30, 0.06, 0.04);',
    'mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
    '',
    '// η σφαίρα: βασική ακτίνα + δύο στρώσεις αργής "υγρής" παραμόρφωσης',
    'float map(vec3 p){',
    '  p.xz *= rot(uTime*0.12 + uMouse.x*0.35);',
    '  p.yz *= rot(sin(uTime*0.09)*0.25 + uMouse.y*0.22 + uScroll*0.5);',
    '  float d = length(p) - 1.0;',
    '  float t = uTime*0.55;',
    '  d += 0.085 * sin(2.6*p.x + t) * sin(2.4*p.y + 0.8*t) * sin(2.8*p.z + 0.6*t);',
    '  d += 0.030 * sin(6.0*p.y + 1.4*t + 2.0*p.x) * sin(5.0*p.z - 0.9*t);',
    '  d += 0.012 * sin(13.0*p.x + 2.0*t) * sin(11.0*p.z);',
    '  return d * 0.80;',
    '}',
    'vec3 normalAt(vec3 p){ vec2 e=vec2(0.0025,0.0);',
    '  return normalize(vec3(map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx))); }',
    'float ao(vec3 p, vec3 n){ float o=0.0, s=1.0;',
    '  for(int i=0;i<4;i++){ float h=0.03+0.16*float(i); o += (h - map(p+n*h))*s; s*=0.7; }',
    '  return clamp(1.0-1.3*o, 0.0, 1.0); }',
    '',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;',
    '  float port = 1.0 - smoothstep(0.72, 1.15, uRes.x / uRes.y);',
    '  vec2  off  = mix(vec2(0.30, 0.04), vec2(0.10, 0.30), port);',
    '  vec3 col = vec3(0.043, 0.039, 0.043);',
    '  col += CORAL * 0.060 * pow(max(0.0, 1.0 - length(uv - off)*1.1), 3.0);',
    '  col += (hash(gl_FragCoord.xy + fract(uTime)*13.0) - 0.5) * 0.016;',
    '',
    '  vec3 ro = vec3(0.0, 0.0, mix(7.4, 9.6, port) + uScroll*1.6);',
    '  vec3 rd = normalize(vec3(uv - off, -1.75));',
    '  float t = 0.0; float hit = 0.0;',
    '  for(int i=0;i<84;i++){ float d = map(ro + rd*t); if(d < 0.0015){ hit = 1.0; break; } if(t > 15.0) break; t += d*0.85; }',
    '',
    '  if(hit > 0.5){',
    '    vec3 pos = ro + rd*t; vec3 n = normalAt(pos); vec3 v = -rd;',
    '    vec3 l1 = normalize(vec3(0.8, 0.9, 0.7)); vec3 l2 = normalize(vec3(-0.9, -0.3, 0.4));',
    '    float dif = max(dot(n,l1),0.0), dif2 = max(dot(n,l2),0.0);',
    '    float fres = pow(1.0 - max(dot(n,v),0.0), 3.0);',
    '    float spec = pow(max(dot(reflect(-l1,n),v),0.0), 90.0);',
    '    float spec2 = pow(max(dot(reflect(-l2,n),v),0.0), 24.0);',
    '    float occ = ao(pos, n);',
    '    vec3 r = reflect(-v, n);',
    '    float band = smoothstep(-0.3, 0.9, r.y);',
    '    vec3 env = mix(DEEP, CORAL, band) * (0.55 + 0.45*smoothstep(0.1,0.9, sin(r.x*4.0 + r.z*3.0 + uTime*0.3)*0.5+0.5));',
    '    // υγρό, γυαλιστερό υλικό: βαθύ κοράλι στη σκιά, ροδακινί στις άκρες',
    '    vec3 m = mix(DEEP, CORAL*0.92, 0.08 + 0.92*pow(dif, 1.6)) * occ;',
    '    m += env * 0.14 * occ;',
    '    m += CORAL * dif2 * 0.10;',
    '    m += vec3(1.0,0.86,0.78) * spec * 1.1;',
    '    m += PEACH * spec2 * 0.16;',
    '    m += PEACH * fres * 0.24 * occ;',
    '    float fog = 1.0 - smoothstep(11.0, 14.5, t);',
    '    col = mix(col, m, fog);',
    '  }',
    '  // bloom + anamorphic streak (ψυχρό μπλε, συμπληρωματικό του κοραλιού)',
    '  col += CORAL * exp(-length(uv - off) * 3.4) * 0.07;',
    '  float streak = exp(-abs(uv.y - off.y) * 80.0) * exp(-abs(uv.x - off.x) * 1.6);',
    '  col += vec3(0.35, 0.55, 1.0) * streak * 0.11;',
    '  col = col / (col + vec3(0.72));',
    '  float lum = dot(col, vec3(0.299,0.587,0.114)); col = mix(vec3(lum), col, 1.35);',
    '  col = pow(col, vec3(0.4545));',
    '  col *= 1.0 - uScroll*0.55;',
    '  float r2 = dot(uv, uv);',
    '  col.r *= 1.0 + 0.05*r2; col.b *= 1.0 - 0.04*r2;',
    '  col *= 1.0 - 0.26*pow(r2*1.2, 1.3);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src){ var s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
  var vs=compile(gl.VERTEX_SHADER,VERT), fs=compile(gl.FRAGMENT_SHADER,FRAG); if(!vs||!fs) return;
  var prog=gl.createProgram(); gl.attachShader(prog,vs); gl.attachShader(prog,fs); gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){ console.warn(gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);
  var buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var uRes=gl.getUniformLocation(prog,'uRes'), uTime=gl.getUniformLocation(prog,'uTime'),
      uMouse=gl.getUniformLocation(prog,'uMouse'), uScroll=gl.getUniformLocation(prog,'uScroll');

  var quality = (window.innerWidth < 760 || (navigator.hardwareConcurrency || 8) < 5) ? 0.55 : 0.8;
  function resize(){ var dpr=Math.min(window.devicePixelRatio||1,1.6)*quality;
    var w=Math.max(1,Math.round(canvas.clientWidth*dpr)), h=Math.max(1,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); }
    gl.uniform2f(uRes,canvas.width,canvas.height); }
  var mx=0,my=0,tmx=0,tmy=0,scroll=0,visible=true,running=true,start=performance.now(),lastT=2.0;
  window.addEventListener('resize',function(){ resize(); if(!running) draw(lastT); },{passive:true});
  window.addEventListener('pointermove',function(e){ tmx=(e.clientX/innerWidth-0.5)*2; tmy=(e.clientY/innerHeight-0.5)*2; },{passive:true});
  var hero=document.getElementById('hero');
  if(hero&&'IntersectionObserver' in window) new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{threshold:0}).observe(hero);
  document.addEventListener('visibilitychange',function(){ visible=!document.hidden; });
  window.addEventListener('tf:motion',function(e){ running=!!e.detail; if(running){ start=performance.now()-lastT*1000; } else { resize(); draw(lastT); } });
  function draw(time){ lastT=time; gl.uniform1f(uTime,time); gl.uniform2f(uMouse,mx,my); gl.uniform1f(uScroll,scroll); gl.drawArrays(gl.TRIANGLES,0,3); }
  function frame(){ requestAnimationFrame(frame); if(!visible||!running) return;
    mx+=(tmx-mx)*0.045; my+=(tmy-my)*0.045; scroll=Math.min(1,(window.scrollY||0)/Math.max(1,innerHeight)); resize(); draw((performance.now()-start)/1000); }
  resize(); draw(lastT); canvas.classList.add('ready'); frame();
})();
