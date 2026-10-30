/* Médula · one-page v3. Sin dependencias. Títulos que se arman, aura de Médula (portada de su guion visual), isla dinámica,
   escena fija atada al scroll (las apps sueltas → «Eso es Médula.») y animaciones que avanzan solas. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOVIL = () => innerWidth < 1020;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const tramo = (k, a, b) => clamp((k - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const lerp = (a, b, k) => a + (b - a) * k;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const DISCOVERY = "https://wa.me/56988989824?text=" + encodeURIComponent("Hola, quiero agendar un Discovery de Médula.");

/* Todos los CTA van al Discovery (WhatsApp mientras no haya link propio) */
$$("[data-discovery]").forEach((a) => { a.href = DISCOVERY; a.target = "_blank"; a.rel = "noopener"; });

/* ── Títulos que se arman palabra por palabra ── */
$$(".arma").forEach((h) => {
  let i = 0;
  const partir = (txt, cls) => txt.split(/(\s+)/).map((w) => (w.trim() ? `<span class="pal"><span class="${cls || ""}" style="--i:${i++}">${w}</span></span>` : w)).join("");
  h.innerHTML = [...h.childNodes].map((n) => (n.nodeType === 3 ? partir(n.textContent) : partir(n.textContent, n.className))).join("");
});
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } }), { threshold: .15 });
$$("[data-r], .arma").forEach((n) => io.observe(n));

function alVer(el, entrar, salir, umbral = .1) {
  new IntersectionObserver(([e]) => (e.isIntersecting ? entrar() : salir && salir()), { threshold: umbral }).observe(el);
}
function bucleVisible(el, cuadro, fps = 60) {
  let vivo = false, raf = 0, ultimo = 0;
  const paso = (ahora) => { if (!vivo) return; raf = requestAnimationFrame(paso); if (ahora - ultimo < 1000 / fps - 2) return; ultimo = ahora; cuadro(); };
  alVer(el, () => { if (!vivo) { vivo = true; raf = requestAnimationFrame(paso); } }, () => { vivo = false; cancelAnimationFrame(raf); }, 0);
  if (QUIETO) requestAnimationFrame(() => cuadro());
}

/* ── El aura de Médula: un fluido que se arma con puntos; el grano ES el degradado ── */
const AURA_V = "attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }";
const RUIDO = `vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}
float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<3;i++){s+=a*snoise(p);p*=2.02;a*=0.5;}return s;}`;
const CAMPO_F = `precision highp float; varying vec2 vUv; uniform float uTiempo, uScroll, uAspecto, uFuerza, uIntensidad, uRadio; uniform vec2 uPuntero, uCentro; ${RUIDO}
void main(){
  float aspecto = uAspecto; vec2 p = vec2(vUv.x * aspecto, vUv.y); float t = uTiempo * 0.045;
  vec2 dp = p - vec2(uPuntero.x * aspecto, uPuntero.y); float cerca = exp(-dot(dp, dp) * 7.0) * uFuerza; p += normalize(dp + 1e-4) * cerca * 0.06;
  vec2 q = vec2(fbm(p * 0.55 + vec2(0.0, t)), fbm(p * 0.55 + vec2(5.2, -t * 0.8)));
  vec2 r = vec2(fbm(p * 0.5 + 1.1 * q + vec2(1.7 - t * 0.6, 9.2 + uScroll * 0.3)), fbm(p * 0.5 + 1.1 * q + vec2(8.3, 2.8 + t * 0.5)));
  float campo = fbm(p * 0.42 + 0.9 * r);
  vec2 centro = vec2(uCentro.x * aspecto + 0.08 * sin(t * 1.2), uCentro.y - 0.06 * sin(uScroll * 0.9));
  float masa = 1.0 - smoothstep(0.0, uRadio, length((vec2(vUv.x * aspecto, vUv.y) - centro) * vec2(0.8, 1.05)));
  float d = clamp((masa * 1.3 + campo * 0.32 - 0.1) * uIntensidad, 0.0, 1.0);
  vec2 flujo = 1.1 * q + 0.9 * r + vec2(t * 1.5, uScroll * 0.6);
  gl_FragColor = vec4(d, flujo, 1.0);
}`;
const PUNTOS_F = `precision highp float; varying vec2 vUv; uniform sampler2D uCampo; uniform float uPuntillismo, uTamPunto, uArrastre, uPixel;
uniform vec3 uNucleo, uMedula, uImpulso, uAire, uBruma, uHielo;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 degradado(float d){ vec3 col = vec3(1.0); col = mix(col, uHielo, smoothstep(0.0, 0.12, d)); col = mix(col, uBruma, smoothstep(0.1, 0.36, d)); col = mix(col, uAire, smoothstep(0.26, 0.54, d)); col = mix(col, uImpulso, smoothstep(0.44, 0.72, d)); col = mix(col, uMedula, smoothstep(0.6, 0.85, d)); col = mix(col, uNucleo, smoothstep(0.76, 1.0, d)); return col; }
void main(){
  vec4 c = texture2D(uCampo, vUv); float d = c.r; vec2 flujo = c.gb;
  float celda = max(1.0, uTamPunto * uPixel); vec2 coord = gl_FragCoord.xy / celda + flujo * uArrastre;
  float umbral = hash(floor(coord)) - 0.5; float amplitud = uPuntillismo * (0.1 + 0.16 * smoothstep(0.0, 0.25, d));
  gl_FragColor = vec4(degradado(clamp(d + umbral * amplitud, 0.0, 1.0)), 1.0);
}`;
const AZULES = { uNucleo: "#1d3a7c", uMedula: "#294d9c", uImpulso: "#3a63be", uAire: "#7d9bda", uBruma: "#cbd7f0", uHielo: "#f1f4fb" };
const hexA = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
function aura(cv, op) {
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) { const [x, y] = op.centro(); cv.style.background = `radial-gradient(50% 60% at ${x * 100}% ${(1 - y) * 100}%, #294d9c, #7d9bda 40%, #cbd7f0 65%, #fff)`; return; }
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; };
  const prog = (f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, AURA_V)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); return p; };
  const pc = prog(CAMPO_F), pp = prog(PUNTOS_F);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(), fbo = gl.createFramebuffer();
  let w = 1, h = 1, cw = 1, ch = 1, dpr = 1;
  const ajustar = () => {
    dpr = Math.min(2, devicePixelRatio || 1); w = Math.max(2, Math.round(cv.clientWidth * dpr)); h = Math.max(2, Math.round(cv.clientHeight * dpr)); cv.width = w; cv.height = h;
    cw = Math.max(2, w >> 1); ch = Math.max(2, h >> 1);
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cw, ch, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  ajustar(); addEventListener("resize", ajustar);
  const ptr = { x: .5, y: .5, px: .5, py: .5, vel: 0 };
  cv.parentElement.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width; ptr.y = 1 - (e.clientY - r.top) / r.height; });
  gl.useProgram(pp); Object.entries(AZULES).forEach(([k, v]) => gl.uniform3fv(gl.getUniformLocation(pp, k), hexA(v)));
  gl.uniform1f(gl.getUniformLocation(pp, "uPuntillismo"), .7); gl.uniform1f(gl.getUniformLocation(pp, "uTamPunto"), 1.6); gl.uniform1f(gl.getUniformLocation(pp, "uArrastre"), 18);
  const U = (p, n) => gl.getUniformLocation(p, n);
  let tiempo = 12, scroll = 0, ultimo = performance.now();
  bucleVisible(cv, () => {
    const ahora = performance.now(), dt = Math.min(.1, (ahora - ultimo) / 1000); ultimo = ahora;
    tiempo += dt * .35;
    const suav = 1 - Math.pow(1 - .027, dt * 60), dx = ptr.x - ptr.px, dy = ptr.y - ptr.py; ptr.px += dx * suav; ptr.py += dy * suav;
    ptr.vel = Math.min(1, ptr.vel * Math.pow(.97, dt * 60) + Math.hypot(dx, dy) * .17);
    scroll += (scrollY / innerHeight - scroll) * (1 - Math.pow(.96, dt * 60));
    const [cx, cy] = op.centro();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, cw, ch); gl.useProgram(pc);
    gl.uniform1f(U(pc, "uTiempo"), tiempo); gl.uniform1f(U(pc, "uScroll"), scroll); gl.uniform1f(U(pc, "uAspecto"), w / h);
    gl.uniform2f(U(pc, "uPuntero"), ptr.px, ptr.py); gl.uniform1f(U(pc, "uFuerza"), ptr.vel); gl.uniform2f(U(pc, "uCentro"), cx, cy);
    gl.uniform1f(U(pc, "uIntensidad"), op.intensidad); gl.uniform1f(U(pc, "uRadio"), op.radio());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.useProgram(pp);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U(pp, "uCampo"), 0); gl.uniform1f(U(pp, "uPixel"), dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, 30);
}
const AURAS = {
  heroe: { centro: () => (MOVIL() ? [.5, 1.06] : [.5, .98]), radio: () => (MOVIL() ? .5 : .66), intensidad: 1.18 },
  fin: { centro: () => [.5, -.2], radio: () => (MOVIL() ? .56 : .66), intensidad: 1.15 },
};
$$("canvas[data-aura]").forEach((cv) => aura(cv, AURAS[cv.dataset.aura]));

/* ── La isla dinámica: se expande con resorte para contar qué hace Médula, y se recoge entre tareas ── */
{
  const isla = $("#isla"), txt = $("#isla-txt"), app = $("#isla-app"), barra = $("#isla-barra");
  const ESTADOS = [
    { t: "Leyendo Bsale…", app: "bsale.png" },
    { t: "Cruzando con Gmail…", app: "gmail.svg" },
    { t: "Actualizando Zoho CRM…", app: "zoho.svg" },
    { t: "Listo · 3 cotizaciones abiertas", ok: true },
    { t: "Médula", corto: true },
  ];
  const medir = () => { isla.style.width = "auto"; const w = isla.offsetWidth; return w; };
  async function pasar(e) {
    txt.classList.add("sale"); app.classList.add("sale");
    await esperar(200);
    txt.textContent = e.t;
    app.className = "isla__app sale" + (e.ok ? " ok" : "");
    app.innerHTML = e.ok ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : e.app ? `<img src="recursos/logos/${e.app}" alt="">` : "";
    app.style.display = e.corto ? "none" : "";
    isla.classList.toggle("listo", !!(e.ok || e.corto));
    const antes = isla.offsetWidth; const despues = medir();
    isla.style.width = antes + "px"; isla.offsetWidth; isla.style.width = despues + "px";
    isla.classList.add("latido"); setTimeout(() => isla.classList.remove("latido"), 260);
    await esperar(120);
    txt.classList.remove("sale"); app.classList.remove("sale");
  }
  let i = 0, vivo = false;
  async function ciclo() {
    while (vivo) {
      const e = ESTADOS[i % ESTADOS.length]; await pasar(e);
      const dur = e.corto ? 900 : e.ok ? 1700 : 1350;
      barra.style.transition = "none"; barra.style.transform = "scaleX(0)"; barra.offsetWidth;
      if (!e.ok && !e.corto) { barra.style.transition = `transform ${dur}ms linear`; barra.style.transform = "scaleX(1)"; }
      await esperar(dur); i++;
    }
  }
  isla.style.width = medir() + "px";
  if (QUIETO) { txt.textContent = ESTADOS[0].t; } else alVer(isla, () => { if (!vivo) { vivo = true; ciclo(); } }, () => (vivo = false), 0);
}

/* ── Texto que se escribe y se borra, como un teclado ── */
function maquina(el) {
  const palabras = el.dataset.palabras.split("|");
  let i = 1, vivo = false, turno = 0;
  async function correr() {
    const mio = ++turno, sigue = () => vivo && mio === turno;
    await esperar(2200);
    while (sigue()) {
      el.classList.add("escribiendo");
      let letras = Array.from(el.textContent);
      while (letras.length && sigue()) { letras.pop(); el.textContent = letras.join(""); await esperar(30); }
      const w = Array.from(palabras[i % palabras.length]);
      for (let k = 1; k <= w.length && sigue(); k++) { el.textContent = w.slice(0, k).join(""); await esperar(62 + Math.random() * 45); }
      el.classList.remove("escribiendo");
      i++; await esperar(2400);
    }
  }
  return { iniciar() { if (vivo || QUIETO) return; vivo = true; correr(); }, parar() { vivo = false; turno++; el.classList.remove("escribiendo"); } };
}
{ const m = maquina($("#tipeo")); alVer($("#heroe"), () => m.iniciar(), () => m.parar(), 0); }

/* ── Franja: dos cintas en sentidos opuestos ── */
{
  const A = [["zoho.svg", "Zoho"], ["defontana.svg", "Defontana"], ["bsale.png", "Bsale"], ["softland.png", "Softland"], ["shopify.svg", "Shopify"], ["mercadolibre.svg", "Mercado Libre"], ["whatsapp.svg", "WhatsApp"], ["googlecalendar.svg", "Calendario"], ["claude.svg", "Claude"]];
  const B = [["gmail.svg", "Gmail"], ["microsoftexcel.svg", "Excel"], ["googlesheets.svg", "Sheets"], ["microsoftoutlook.svg", "Outlook"], ["microsoftteams.svg", "Teams"], ["notion.svg", "Notion"], ["slack.svg", "Slack"], ["openai.svg", "ChatGPT"]];
  const sis = ([img, n]) => `<span class="sis"><img src="recursos/logos/${img}" alt="">${n}</span>`;
  const llenar = (id, L) => { $(id).innerHTML = [...L, ...L, ...L, ...L].map(sis).join(""); };
  llenar("#fila-a", A); llenar("#fila-b", B);
}

/* ── Héroe: al bajar, el contenido se aleja un poco mientras la hoja blanca sube ── */
const heroeIn = $("#heroe-in");
function pintarHeroe() {
  const k = clamp(scrollY / innerHeight);
  heroeIn.style.transform = `translateY(${k * 60}px) scale(${1 - k * .05})`;
  heroeIn.style.opacity = 1 - k * .9;
}

/* ── La escena fija, atada al scroll ──
   0–.42 las apps entran y escriben · .40–.56 la IA no ve nada · .56–.70 todo se junta en el símbolo
   · .66–.88 la frase se enciende palabra por palabra · .88–1 «Eso es Médula.» */
let pintarEscena = () => {};
{
  const sec = $("#hoy"), cab = $("#esc-cab"), vens = $$(".ven", sec), ia = $("#ia"), fin = $("#esc-fin"), sim = $(".esc__sim", fin), frase = $("#frase"), eso = $("#eso"), barra = $("#esc-barra");
  frase.innerHTML = frase.textContent.split(" ").map((w) => `<span>${w}</span>`).join(" ");
  const palabras = $$("span", frase);
  const teclear = (el, k) => { const t = el.dataset.txt, n = Math.round(t.length * clamp(k)); if (el._n !== n) { el.textContent = t.slice(0, n); el._n = n; } el.classList.toggle("tecleando", k > 0 && k < 1); };
  const desde = vens.map((v) => v.dataset.desde.split(",").map(Number));
  pintarEscena = () => {
    const r = sec.getBoundingClientRect();
    const k = QUIETO ? (r.top < innerHeight ? 1 : 0) : clamp(-r.top / (r.height - innerHeight));
    barra.style.setProperty("--p", k);
    const junta = eo(tramo(k, .56, .7));
    // el encabezado se va cuando todo se junta
    cab.style.opacity = 1 - tramo(k, .54, .62);
    cab.style.transform = `translateY(${-30 * tramo(k, .54, .62)}px)`;
    // cada app entra desde su lado, escribe su problema y al final viaja al centro
    vens.forEach((v, i) => {
      const a = .02 + i * .07, e = eo(tramo(k, a, a + .1)), [dx, dy, rot] = desde[i];
      const rv = v.getBoundingClientRect(), cx = innerWidth / 2 - (rv.left + rv.width / 2 - (v._tx || 0)), cy = innerHeight * .5 - (rv.top + rv.height / 2 - (v._ty || 0));
      const tx = lerp(dx * innerWidth * .35 * (1 - e), cx, junta), ty = lerp(dy * innerHeight * .35 * (1 - e), cy, junta);
      v._tx = tx; v._ty = ty;
      const dim = 1 - (MOVIL() ? .75 : .45) * tramo(k, .42, .48) * (1 - junta);
      v.style.opacity = e * dim * (1 - tramo(k, .62, .69));
      v.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot * (1 - e) + rot * .25}deg) scale(${lerp(.9 + .1 * e, .3, junta)})`;
      v.style.filter = `blur(${(1 - e) * 8 + junta * 4}px)`;
      teclear($("p", v), tramo(k, a + .06, a + .16));
    });
    // la pregunta a la IA y su respuesta
    const ei = eo(tramo(k, .4, .45));
    ia.style.opacity = ei * (1 - tramo(k, .56, .62));
    ia.style.transform = `translateX(-50%) translateY(${(1 - ei) * 30}px) scale(${lerp(.96 + .04 * ei, .6, junta)})`;
    teclear($("[data-txt]", ia), tramo(k, .45, .53));
    // el símbolo aparece donde todo se juntó, la frase se enciende y llega «Eso es Médula.»
    const es = eo(tramo(k, .62, .7));
    sim.style.opacity = es; sim.style.transform = `scale(${.3 + .7 * es}) rotate(${(1 - es) * -40}deg)`;
    frase.style.opacity = tramo(k, .64, .68);
    const lit = tramo(k, .66, .86) * palabras.length;
    palabras.forEach((p, i) => p.classList.toggle("on", i < lit));
    const ee = eo(tramo(k, .87, .95));
    eso.style.opacity = ee; eso.style.transform = `translateY(${(1 - ee) * 30}px)`; eso.style.filter = `blur(${(1 - ee) * 10}px)`;
    eso.style.backgroundPosition = `${100 - tramo(k, .9, 1) * 100}% 0`;
  };
}

/* ── Sin Médula / Con Médula: el nervio baja con el scroll y enciende cada fila al pasar ── */
const vs = $("#vs"), nervio = $("#nervio"), filasVs = $$(".vs__fila");
function pintarVs() {
  const r = vs.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  const k = QUIETO ? 1 : clamp((innerHeight * .62 - r.top) / r.height);
  nervio.style.setProperty("--p", k);
  filasVs.forEach((f) => { const rf = f.querySelector(".vs__con").getBoundingClientRect(); f.classList.toggle("on", rf.top + rf.height / 2 < innerHeight * .62 || QUIETO); });
}

/* ── Héroe: el símbolo se inclina hacia el puntero ── */
{
  const sim = $("#sim img");
  if (!QUIETO && matchMedia("(pointer: fine)").matches) $("#heroe").addEventListener("pointermove", (e) => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .3;
    sim.style.setProperty("--rx", `${x * 22}deg`); sim.style.setProperty("--ry", `${-y * 18}deg`);
  });
}

/* ── Cómo funciona: la conversación avanza sola y despliega su paso; un clic salta a ese paso ── */
{
  const chat = $("#chat"), pasos = $$(".paso"), sec = $("#como-in");
  const DUR = [2600, 3200, 2000, 3200];
  let actual = 0, t0 = performance.now(), previo = performance.now(), pausa = false;
  const fase = (f) => { chat.dataset.fase = f; $$(".msj", chat).forEach((m) => m.classList.toggle("on", !m.dataset.f || +m.dataset.f <= f)); };
  const desc = $("#paso-desc");
  const ir = (i) => { actual = i; t0 = performance.now(); fase(i + 1); pasos.forEach((p, j) => { p.classList.toggle("activo", j === i); p.style.setProperty("--prog", 0); }); desc.textContent = $("p", pasos[i]).textContent; };
  pasos.forEach((p, i) => $("button", p).addEventListener("click", () => ir(i)));
  sec.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && (pausa = true));
  sec.addEventListener("pointerleave", () => (pausa = false));
  if (QUIETO) { fase(4); pasos.forEach((p) => p.classList.add("activo")); }
  else {
    alVer(sec, () => { if (chat.dataset.fase === "0") ir(0); }, null, .3);
    bucleVisible(sec, () => {
      const ahora = performance.now(), dt = ahora - previo; previo = ahora;
      if (chat.dataset.fase === "0") return;
      if (pausa) { t0 += Math.min(dt, 100); return; }
      const k = clamp((ahora - t0) / DUR[actual]); pasos[actual].style.setProperty("--prog", k);
      if (k >= 1) {
        if (actual < pasos.length - 1) ir(actual + 1);
        else { fase(0); setTimeout(() => ir(0), 700); t0 = Infinity; }
      }
    }, 30);
  }
}

/* ── Seguridad: cada tarjeta muestra lo suyo ── */
{
  // cifrado: el nombre del archivo se vuelve cifra y vuelve
  const el = $("#cifra"), claro = el.textContent, HEX = "0123456789abcdef";
  const cifrar = (k) => Array.from(claro).map((c, i) => (i / claro.length < k ? (c === "." ? "·" : HEX[(Math.random() * 16) | 0]) : c)).join("");
  let t = 0;
  bucleVisible(el, () => { t = (t + 1) % 150; const k = t < 50 ? t / 50 : t < 90 ? 1 : 1 - (t - 90) / 50; el.textContent = cifrar(clamp(k)); }, 30);
  // permiso: el dedo aprueba cada tanto
  const permiso = $("#permiso");
  alVer(permiso, () => { if (permiso._i) return; permiso._i = setInterval(() => { permiso.classList.add("toca"); setTimeout(() => permiso.classList.remove("toca"), 700); }, 2200); }, () => { clearInterval(permiso._i); permiso._i = 0; }, .3);
  // registro: las líneas aparecen una a una y vuelven a empezar
  const log = $$("#log li");
  let n = 0;
  alVer($("#log"), () => { if (log._i) return; log._i = setInterval(() => { if (n === log.length) { log.forEach((l) => l.classList.remove("on")); n = -1; } else log[n].classList.add("on"); n++; }, 800); }, () => { clearInterval(log._i); log._i = 0; }, .3);
}

/* ── Celular: seguridad y método se deslizan de lado; los puntos dicen dónde vas ── */
function carrusel(cont, alCambiar) {
  const items = [...cont.children], puntos = document.createElement("div");
  puntos.className = "desliza"; puntos.setAttribute("aria-hidden", "true");
  puntos.innerHTML = items.map(() => "<i></i>").join(""); cont.after(puntos);
  const marcar = (i) => [...puntos.children].forEach((p, j) => p.classList.toggle("on", j === i));
  let t = 0;
  const cercano = () => { const c = cont.scrollLeft + cont.clientWidth / 2; let m = 0, d = 1e9; items.forEach((el, i) => { const dd = Math.abs(el.offsetLeft + el.offsetWidth / 2 - c); if (dd < d) { d = dd; m = i; } }); return m; };
  cont.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(() => { const i = cercano(); marcar(i); alCambiar && alCambiar(i); }, 90); }, { passive: true });
  marcar(0);
  return { ir(i) { if (!MOVIL()) return; const el = items[i]; cont.scrollTo({ left: el.offsetLeft - (cont.clientWidth - el.offsetWidth) / 2, behavior: QUIETO ? "auto" : "smooth" }); marcar(i); } };
}
carrusel($(".bento"));

/* ── La frase gigante: las dos líneas se encuentran al centro según el scroll ── */
const gig = $("#gigante"), gigA = $("#gig-a"), gigB = $("#gig-b");
function pintarGigante() {
  const r = gig.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  const e = QUIETO ? 1 : eo(clamp((innerHeight - r.top) / (innerHeight * .75)));
  gigA.style.transform = `translateX(${(1 - e) * -45}vw)`; gigB.style.transform = `translateX(${(1 - e) * 45}vw)`;
  gigA.style.opacity = gigB.style.opacity = .15 + .85 * e;
}

/* ── Cómo trabajamos: la etapa activa avanza sola; un clic elige ── */
{
  const sec = $("#etapas"), etapas = $$(".etapa", sec), DUR = 4500;
  let actual = 0, t0 = performance.now(), pausa = false, previo = performance.now(), solo = 0;
  const marcar = (i) => { actual = i; t0 = performance.now(); etapas.forEach((p, j) => { p.classList.toggle("activo", j === i); p.style.setProperty("--prog", 0); }); };
  // si la persona desliza, manda ella: la etapa centrada queda activa
  const car = carrusel(sec, (i) => { if (performance.now() < solo) return; if (i !== actual) marcar(i); });
  const ir = (i) => { marcar(i); solo = performance.now() + 700; car.ir(i); };
  etapas.forEach((p, i) => p.addEventListener("click", () => ir(i)));
  sec.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && (pausa = true));
  sec.addEventListener("pointerleave", () => (pausa = false));
  let suelta = 0;
  sec.addEventListener("touchstart", () => { pausa = true; clearTimeout(suelta); }, { passive: true });
  sec.addEventListener("touchend", () => { suelta = setTimeout(() => (pausa = false), 4000); }, { passive: true });
  if (QUIETO) etapas.forEach((p) => p.classList.add("activo"));
  else bucleVisible(sec, () => {
    const ahora = performance.now(), dt = ahora - previo; previo = ahora;
    if (pausa) { t0 += Math.min(dt, 100); return; }
    const k = clamp((ahora - t0) / DUR); etapas[actual].style.setProperty("--prog", k);
    if (k >= 1) ir((actual + 1) % etapas.length);
  }, 30);
}

/* ── Scroll suave (solo con mouse o trackpad; en el celular queda el nativo) ── */
{
  const fino = !QUIETO && matchMedia("(pointer: fine)").matches;
  const s = { y: scrollY, meta: scrollY, activo: false };
  const paso = () => {
    s.y += (s.meta - s.y) * .12;
    if (Math.abs(s.meta - s.y) < .5) { s.y = s.meta; s.activo = false; }
    scrollTo(0, s.y);
    if (s.activo) requestAnimationFrame(paso);
  };
  const ir = (meta) => { s.meta = clamp(meta, 0, document.documentElement.scrollHeight - innerHeight); if (!s.activo) { s.activo = true; s.y = scrollY; requestAnimationFrame(paso); } };
  addEventListener("wheel", (e) => {
    if (e.ctrlKey || !fino || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (!s.activo) s.y = s.meta = scrollY;
    ir(s.meta + e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1));
  }, { passive: false });
  addEventListener("scroll", () => { if (!s.activo) s.y = s.meta = scrollY; }, { passive: true });
  $$('a[href^="#"]:not([data-discovery])').forEach((a) => a.addEventListener("click", (e) => {
    const h = a.getAttribute("href"), t = h === "#inicio" ? document.body : $(h); if (!t || QUIETO) return;
    e.preventDefault(); s.meta = scrollY;
    // la escena fija se muestra completa al llegar a «Qué es»
    ir(t === document.body ? 0 : t.getBoundingClientRect().top + scrollY - (h === "#hoy" ? 0 : 90));
  }));
}

/* ── Navegación: se encoge al bajar y marca la sección en la que estás; menú del celular ── */
const nav = $("#nav"), enlaces = $$(".nav__links a");
function pintarNav() {
  nav.classList.toggle("bajo", scrollY > 40);
  let aqui = null;
  enlaces.forEach((a) => { const t = $(a.getAttribute("href")); if (t && t.getBoundingClientRect().top < innerHeight * .4) aqui = a; });
  enlaces.forEach((a) => a.classList.toggle("aqui", a === aqui));
}
{
  const boton = $("#nav-menu"), menu = $("#menu-movil");
  const cerrar = () => { nav.classList.remove("abierto"); boton.setAttribute("aria-expanded", false); boton.setAttribute("aria-label", "Abrir el menú"); };
  boton.addEventListener("click", () => { const ab = nav.classList.toggle("abierto"); boton.setAttribute("aria-expanded", ab); boton.setAttribute("aria-label", ab ? "Cerrar el menú" : "Abrir el menú"); });
  $$("a", menu).forEach((a) => a.addEventListener("click", cerrar));
  addEventListener("keydown", (e) => e.key === "Escape" && cerrar());
}

/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarHeroe(); pintarEscena(); pintarVs(); pintarGigante(); }); }
addEventListener("scroll", alScroll, { passive: true }); addEventListener("resize", alScroll);
alScroll();
