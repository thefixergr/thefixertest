/* ══ ιστοσελίδες. — το σήμα του thefixer σε smooth 3D (raw WebGL raymarching)
   Διαβάζουμε το πραγματικό SVG, φτιάχνουμε 2D signed distance field στη CPU και
   "φουσκώνουμε" το σχήμα σε σωλήνα με κυκλική διατομή: παντού στρογγυλό, πουθενά γωνία.
   Η τελεία γίνεται πραγματική σφαίρα. Presets για δοκιμές: ?mat=clay|gloss|stone  ?col=coral|sand|ivory */
(function () {
  var canvas = document.getElementById('gl');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' })
        || canvas.getContext('experimental-webgl');
  if (!gl) return;

  var q = new URLSearchParams(location.search);
  var MAT = { clay: 0, gloss: 1, stone: 2 }[q.get('mat') || 'clay'] || 0;
  var COLS = { coral: [1.0, 0.36, 0.22], sand: [0.86, 0.66, 0.50], ivory: [0.93, 0.89, 0.84] };
  var COL = COLS[q.get('col') || 'coral'] || COLS.coral;

  var SDF_N = 256, SDF_RANGE = 60;

  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll;',
    'uniform float uHasGlyph; uniform sampler2D uSDF; uniform vec3 uDot; uniform vec3 uCol; uniform float uMat;',
    'const float S = 1.05;',            // half-extent του σήματος σε world units
    'const float W = 0.19;',            // ακτίνα σωλήνα σε texture units
    'const float SDF_RANGE = ' + SDF_RANGE.toFixed(1) + ';',
    'const float SDF_HALF = ' + (SDF_N / 2).toFixed(1) + ';',
    'mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
    'float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0); return mix(b, a, h) - k*h*(1.0-h); }',
    '',
    'float sdGlyph2(vec2 t){',           // 2D distance σε texture units, t ∈ [-1,1]
    '  vec2 c = clamp(t, -1.0, 1.0);',
    '  float v = texture2D(uSDF, c*0.5 + 0.5).r;',
    '  return (v - 0.5) * 2.0 * SDF_RANGE / SDF_HALF + length(t - c);',
    '}',
    'vec3 xf(vec3 p){',                   // κοινή περιστροφή
    '  p.xz *= rot(sin(uTime*0.19)*0.36 + uMouse.x*0.40);',
    '  p.yz *= rot(sin(uTime*0.17)*0.16 + uMouse.y*0.25 + uScroll*0.45);',
    '  return p;',
    '}',
    'float map(vec3 p){',
    '  p = xf(p);',
    '  if (uHasGlyph < 0.5) { return length(p) - 0.8; }',
    '  vec2 t = p.xy / S;',
    '  float d2 = sdGlyph2(t);',                         // <0 μέσα στο σχήμα
    '  float a  = max(d2 + W, 0.0);',                    // 0 στον άξονα .. W στην ακμή
    '  float body = (length(vec2(a, p.z / S)) - W) * S;',// σωλήνας κυκλικής διατομής
    '  float dot_ = length(p - vec3(uDot.xy * S, 0.0)) - uDot.z * S;',
    '  return min(body, dot_) * 0.85;',
    '}',
    'vec3 normalAt(vec3 p){ vec2 e=vec2(0.0022,0.0);',
    '  return normalize(vec3(map(p+e.xyy)-map(p-e.xyy), map(p+e.yxy)-map(p-e.yxy), map(p+e.yyx)-map(p-e.yyx))); }',
    'float ao(vec3 p, vec3 n){ float o=0.0, s=1.0;',
    '  for(int i=0;i<4;i++){ float h=0.03+0.15*float(i); o += (h - map(p+n*h))*s; s*=0.7; } return clamp(1.0-1.25*o,0.0,1.0); }',
    '',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;',
    '  float port = 1.0 - smoothstep(0.72, 1.15, uRes.x / uRes.y);',
    '  vec2 off = mix(vec2(0.31, 0.03), vec2(0.10, 0.30), port);',
    '  vec3 col = vec3(0.043, 0.039, 0.043);',
    '  col += uCol * 0.05 * pow(max(0.0, 1.0 - length(uv - off)*1.1), 3.0);',
    '  col += (hash(gl_FragCoord.xy + fract(uTime)*13.0) - 0.5) * 0.016;',
    '  vec3 ro = vec3(0.0, 0.0, mix(6.9, 9.4, port) + uScroll*1.5);',
    '  vec3 rd = normalize(vec3(uv - off, -1.75));',
    '  float t = 0.0, hit = 0.0;',
    '  for(int i=0;i<90;i++){ float d = map(ro + rd*t); if(d < 0.0014){ hit = 1.0; break; } if(t > 14.0) break; t += d * 0.9; }',
    '  if(hit > 0.5){',
    '    vec3 pos = ro + rd*t, n = normalAt(pos), v = -rd;',
    '    vec3 l1 = normalize(vec3(0.7, 0.9, 0.8)), l2 = normalize(vec3(-0.8, -0.2, 0.5));',
    '    float occ = ao(pos, n);',
    '    float wrap = clamp(dot(n, l1)*0.55 + 0.45, 0.0, 1.0);',   // half-lambert: μαλακό, "πήλινο"
    '    float dif2 = max(dot(n, l2), 0.0);',
    '    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.6);',
    '    float spec = pow(max(dot(reflect(-l1, n), v), 0.0), mix(18.0, 140.0, step(0.5, uMat) * (1.0 - step(1.5, uMat))));',
    '    vec3 base = uCol;',
    '    vec3 shade = base * (0.16 + 0.84 * pow(wrap, 1.25)) * occ;',
    '    shade += base * dif2 * 0.14;',
    '    shade += mix(base, vec3(1.0), 0.45) * fres * 0.26 * occ;',        // ζεστό rim
    '    // clay: πολύ ήπιο spec · gloss: σκληρό highlight · stone: σχεδόν καθόλου + λίγο grain στην επιφάνεια',
    '    float specAmt = uMat < 0.5 ? 0.10 : (uMat < 1.5 ? 0.85 : 0.04);',
    '    shade += vec3(1.0, 0.95, 0.9) * spec * specAmt;',
    '    if (uMat > 1.5) shade *= 0.94 + 0.06 * hash(floor(pos.xy * 90.0));',
    '    float fog = 1.0 - smoothstep(10.5, 14.0, t);',
    '    col = mix(col, shade, fog);',
    '  }',
    '  col += uCol * exp(-length(uv - off) * 3.6) * 0.045;',
    '  float streak = exp(-abs(uv.y - off.y) * 80.0) * exp(-abs(uv.x - off.x) * 1.6);',
    '  col += vec3(0.35, 0.55, 1.0) * streak * 0.08;',
    '  col = col / (col + vec3(0.78));',
    '  float lum = dot(col, vec3(0.299,0.587,0.114)); col = mix(vec3(lum), col, 1.28);',
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
  var U={}; ['uRes','uTime','uMouse','uScroll','uHasGlyph','uSDF','uDot','uCol','uMat'].forEach(function(k){ U[k]=gl.getUniformLocation(prog,k); });
  gl.uniform3f(U.uCol, COL[0], COL[1], COL[2]); gl.uniform1f(U.uMat, MAT);

  var tex=gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,1,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,new Uint8Array([0]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.uSDF,0); gl.uniform1f(U.uHasGlyph,0.0); gl.uniform3f(U.uDot, 0.0, 0.0, 0.0);

  /* Felzenszwalb EDT */
  function edt1d(f,d,v,z,n){ var k=0; v[0]=0; z[0]=-1e20; z[1]=1e20;
    for(var q=1;q<n;q++){ var s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);
      while(s<=z[k]){ k--; s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]); }
      k++; v[k]=q; z[k]=s; z[k+1]=1e20; }
    k=0; for(var q2=0;q2<n;q2++){ while(z[k+1]<q2) k++; d[q2]=(q2-v[k])*(q2-v[k])+f[v[k]]; } }
  function edt2d(g,w,h){ var m=Math.max(w,h), f=new Float64Array(m), d=new Float64Array(m), v=new Int32Array(m), z=new Float64Array(m+1), x,y;
    for(x=0;x<w;x++){ for(y=0;y<h;y++) f[y]=g[y*w+x]; edt1d(f,d,v,z,h); for(y=0;y<h;y++) g[y*w+x]=d[y]; }
    for(y=0;y<h;y++){ for(x=0;x<w;x++) f[x]=g[y*w+x]; edt1d(f,d,v,z,w); for(x=0;x<w;x++) g[y*w+x]=d[x]; } return g; }

  function buildSDF(img, dotFrac){
    var N=SDF_N, INF=1e20, c=document.createElement('canvas'); c.width=c.height=N;
    var ctx=c.getContext('2d'); var pad=0.12, box=N*(1-pad*2);
    var s=Math.min(box/img.width, box/img.height), w=img.width*s, h=img.height*s, x0=(N-w)/2, y0=(N-h)/2;
    ctx.drawImage(img,x0,y0,w,h);
    var data=ctx.getImageData(0,0,N,N).data, inside=new Float64Array(N*N), outside=new Float64Array(N*N);
    for(var i=0;i<N*N;i++){ var a=data[i*4+3]>127; outside[i]=a?0:INF; inside[i]=a?INF:0; }
    edt2d(outside,N,N); edt2d(inside,N,N);
    var px=new Uint8Array(N*N);
    for(var j=0;j<N*N;j++){ var sd=Math.sqrt(outside[j])-Math.sqrt(inside[j]); px[j]=Math.max(0,Math.min(255,Math.round((0.5+sd/(2*SDF_RANGE))*255))); }
    var flipped=new Uint8Array(N*N); for(var r=0;r<N;r++) flipped.set(px.subarray((N-1-r)*N,(N-r)*N), r*N);
    gl.bindTexture(gl.TEXTURE_2D,tex); gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,N,N,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,flipped);
    // η τελεία: από συντεταγμένες SVG → texture units [-1,1]
    var dx=(x0 + dotFrac[0]*w)/N*2-1, dy=-((y0 + dotFrac[1]*h)/N*2-1), dr=dotFrac[2]*h/N*2;
    gl.uniform3f(U.uDot, dx, dy, dr); gl.uniform1f(U.uHasGlyph,1.0);
  }

  fetch('/assets/img/mark.svg').then(function(r){ return r.ok ? r.text() : Promise.reject(); }).then(function(svg){
    // η τελεία (πρώτο path) βγαίνει από το SDF — τη ζωγραφίζουμε ως αληθινή σφαίρα
    var body = svg.replace(/<path[^>]*d="M335\.29,44\.61[^"]*"[^>]*\/>/, '');
    var img=new Image();
    img.onload=function(){ try{ buildSDF(img, [291.7/335.34, 43.7/370.68, 43.7/370.68]); }catch(e){ console.warn('SDF failed',e); } };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(body);
  }).catch(function(){});

  var quality=(innerWidth<760||(navigator.hardwareConcurrency||8)<5)?0.6:1.0;
  function resize(){ var dpr=Math.min(devicePixelRatio||1,1.6)*quality, w=Math.max(1,Math.round(canvas.clientWidth*dpr)), h=Math.max(1,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); } gl.uniform2f(U.uRes,canvas.width,canvas.height); }
  var mx=0,my=0,tmx=0,tmy=0,scroll=0,visible=true,running=true,start=performance.now(),lastT=2.0;
  addEventListener('resize',function(){ resize(); if(!running) draw(lastT); },{passive:true});
  addEventListener('pointermove',function(e){ tmx=(e.clientX/innerWidth-0.5)*2; tmy=(e.clientY/innerHeight-0.5)*2; },{passive:true});
  var hero=document.getElementById('hero'); if(hero&&'IntersectionObserver' in window) new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{threshold:0}).observe(hero);
  document.addEventListener('visibilitychange',function(){ visible=!document.hidden; });
  addEventListener('tf:motion',function(e){ running=!!e.detail; if(running){ start=performance.now()-lastT*1000; } else { resize(); draw(lastT); } });
  function draw(time){ lastT=time; gl.uniform1f(U.uTime,time); gl.uniform2f(U.uMouse,mx,my); gl.uniform1f(U.uScroll,scroll); gl.drawArrays(gl.TRIANGLES,0,3); }
  function frame(){ requestAnimationFrame(frame); if(!visible||!running) return; mx+=(tmx-mx)*0.045; my+=(tmy-my)*0.045; scroll=Math.min(1,(scrollY||0)/Math.max(1,innerHeight)); resize(); draw((performance.now()-start)/1000); }
  resize(); draw(lastT); canvas.classList.add('ready'); frame();
})();
