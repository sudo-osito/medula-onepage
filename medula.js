/* Médula · one-page. Sin dependencias. Partes que vienen de la v6 de Optimizo: títulos que se arman, texto que se escribe,
   scroll suave con la frase que detiene la página y el aura de Médula (portada de su guion visual). */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const QUIETO = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOVIL = () => innerWidth < 1020;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

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
const AZULES = { uNucleo: "#013ecc", uMedula: "#0853e0", uImpulso: "#1b75fd", uAire: "#63a7fc", uBruma: "#c6dffd", uHielo: "#f2f7fe" };
const hexA = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
function aura(cv, op) {
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) { const [x, y] = op.centro(); cv.style.background = `radial-gradient(50% 60% at ${x * 100}% ${(1 - y) * 100}%, #0853e0, #63a7fc 40%, #c6dffd 65%, #fff)`; return; }
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
// el héroe: la masa a la derecha (arriba en el celular); el cierre: la masa sube desde abajo
const AURAS = {
  heroe: { centro: () => (MOVIL() ? [.5, .86] : [.76, .56]), radio: () => (MOVIL() ? .58 : .78), intensidad: 1.15 },
  fin: { centro: () => [.5, -.12], radio: () => (MOVIL() ? .62 : .72), intensidad: 1.15 },
};
$$("canvas[data-aura]").forEach((cv) => aura(cv, AURAS[cv.dataset.aura]));

/* Médula Lite: cuenta lo que está haciendo */
const LITE = ["Leyendo Bsale…", "Cruzando con Gmail…", "Actualizando Zoho CRM…", "Listo · 3 cotizaciones abiertas"];
$$("[data-lite]").forEach((el) => {
  const txt = $(".lite__txt", el); let i = 0;
  setInterval(() => { i = (i + 1) % LITE.length; txt.style.opacity = 0; setTimeout(() => { txt.textContent = LITE[i]; txt.style.opacity = 1; }, 280); }, 2200);
});

/* ── Texto que se escribe y se borra, como un teclado ── */
function maquina(el, { una = false, ms = 0 } = {}) {
  const palabras = el.dataset.palabras.split("|");
  let i = el.textContent ? 1 : 0, vivo = false, turno = 0;
  const tipear = ms || 62, borrar = 30;
  async function correr() {
    const mio = ++turno, sigue = () => vivo && mio === turno;
    if (el.textContent) { await esperar(2200); }
    while (sigue()) {
      el.classList.add("escribiendo");
      let letras = Array.from(el.textContent);
      while (letras.length && sigue()) { letras.pop(); el.textContent = letras.join(""); await esperar(borrar); }
      const w = Array.from(palabras[i % palabras.length]);
      for (let k = 1; k <= w.length && sigue(); k++) { el.textContent = w.slice(0, k).join(""); await esperar(tipear + Math.random() * (ms ? ms * .6 : 45)); }
      el.classList.remove("escribiendo");
      if (una || !sigue()) { vivo = false; return; }
      i++; await esperar(2400);
    }
  }
  return {
    iniciar() { if (vivo) return; if (QUIETO) { el.textContent = palabras[0]; return; } vivo = true; return correr(); },
    parar() { vivo = false; turno++; el.classList.remove("escribiendo"); },
  };
}

/* Héroe: la palabra se escribe, espera, se borra y llega la siguiente */
{ const m = maquina($("#tipeo")); alVer($("#heroe"), () => m.iniciar(), () => m.parar(), 0); }

/* ── Hoy: cada app escribe su síntoma, una tras otra; al final la IA confiesa que no ve nada ── */
{
  const mesa = $("#mesa"), vens = $$(".ven", mesa), ia = $("#ia");
  const escribir = async (caja, ms) => { caja.classList.add("on", "escribe"); await esperar(350); await maquina($(".tipeo", caja), { una: true, ms }).iniciar(); caja.classList.remove("escribe"); };
  let hecho = false;
  alVer(mesa, async () => {
    if (hecho) return; hecho = true;
    for (const v of vens) { await escribir(v, 26); await esperar(180); }
    await esperar(300); await escribir(ia, 30);
  }, null, .35);
}

/* ── Navegación ── */
const nav = $("#nav");
function pintarNav() { nav.classList.toggle("bajo", scrollY > 8); }

/* ── Scroll suave (solo con mouse o trackpad; en el celular queda el nativo) y bloqueo mientras la frase se escribe ── */
const suave = { y: scrollY, meta: scrollY, activo: false, bloqueado: false, viaje: false };
{
  const fino = !QUIETO && matchMedia("(pointer: fine)").matches;
  const paso = () => {
    suave.y += (suave.meta - suave.y) * .12;
    if (Math.abs(suave.meta - suave.y) < .5) { suave.y = suave.meta; suave.activo = false; suave.viaje = false; }
    scrollTo(0, suave.y);
    if (suave.activo) requestAnimationFrame(paso);
  };
  addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;
    if (suave.bloqueado) { e.preventDefault(); return; }
    if (!fino || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); suave.viaje = false;
    if (!suave.activo) suave.y = suave.meta = scrollY;
    const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1);
    suave.meta = clamp(suave.meta + d, 0, document.documentElement.scrollHeight - innerHeight);
    if (!suave.activo) { suave.activo = true; requestAnimationFrame(paso); }
  }, { passive: false });
  addEventListener("touchmove", (e) => suave.bloqueado && e.preventDefault(), { passive: false });
  addEventListener("keydown", (e) => { if (suave.bloqueado && [" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "End", "Home"].includes(e.key)) e.preventDefault(); });
  addEventListener("scroll", () => { if (!suave.activo) suave.y = suave.meta = scrollY; }, { passive: true });
  // los enlaces internos viajan suave y no se detienen en la frase
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const t = a.getAttribute("href") === "#inicio" ? document.body : $(a.getAttribute("href")); if (!t || QUIETO) return;
    e.preventDefault(); suave.viaje = true; suave.y = scrollY;
    suave.meta = clamp(t.getBoundingClientRect().top + scrollY - (t === document.body ? 0 : 64), 0, document.documentElement.scrollHeight - innerHeight);
    if (!suave.activo) { suave.activo = true; requestAnimationFrame(paso); }
  }));
}
function irA(y) { suave.activo = false; suave.y = suave.meta = y; scrollTo(0, y); }

/* ── La frase: al llegar, la página se detiene hasta que termina de escribirse ── */
let pintarFrase = () => {};
{
  const sec = $("#frase"), ls = $$(".frase__l", sec), ms = ls.map((l, i) => maquina($(".tipeo", l), { una: true, ms: i ? 40 : 7 }));
  let estado = 0; // 0 esperando · 1 escribiendo · 2 listo
  async function escribir() {
    estado = 1; suave.bloqueado = true;
    const r = sec.getBoundingClientRect(); irA(Math.round(scrollY + r.top + r.height / 2 - innerHeight / 2));
    const suelta = setTimeout(() => (suave.bloqueado = false), 4500);
    for (const [i, l] of ls.entries()) { l.classList.add("on"); await ms[i].iniciar(); await esperar(i ? 0 : 260); if (i < ls.length - 1) l.classList.remove("on"); }
    await esperar(300);
    clearTimeout(suelta); suave.bloqueado = false; estado = 2;
  }
  pintarFrase = () => {
    if (estado || suave.viaje) return;
    const r = sec.getBoundingClientRect(), centro = r.top + r.height / 2;
    if (QUIETO) { if (r.top < innerHeight) { estado = 2; ms.forEach((m) => m.iniciar()); } return; }
    if (centro <= innerHeight * .55 && r.bottom > innerHeight * .3) escribir();
  };
}

/* ── Cómo funciona: la conversación avanza sola y enciende su paso; un clic salta a ese paso ── */
{
  const chat = $("#chat"), pasos = $$(".paso"), sec = $("#como-in");
  const DUR = [3000, 3600, 2200, 3600]; // cuánto dura cada paso: conecta, entiende, decides, actúa
  let actual = 0, t0 = performance.now(), previo = performance.now(), pausa = false;
  const fase = (f) => {
    chat.dataset.fase = f;
    $$(".msj", chat).forEach((m) => m.classList.toggle("on", !m.dataset.f || +m.dataset.f <= f));
  };
  const ir = (i) => { actual = i; t0 = performance.now(); fase(i + 1); pasos.forEach((p, j) => { p.classList.toggle("activo", j === i); p.style.setProperty("--prog", 0); }); };
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

/* ── Integraciones: dos cintas que corren en sentidos opuestos ── */
{
  const A = [["zoho.svg", "Zoho", "ERP y CRM"], ["defontana.svg", "Defontana", "ERP"], ["bsale.png", "Bsale", "Boletas y ventas"], ["softland.png", "Softland", "ERP"], ["shopify.svg", "Shopify", "Ecommerce"], ["mercadolibre.svg", "Mercado Libre", "Marketplace"], ["googlecalendar.svg", "Calendario", "Agenda"], ["whatsapp.svg", "WhatsApp", "Mensajería"]];
  const B = [["gmail.svg", "Gmail", "Correo"], ["microsoftexcel.svg", "Excel", "Planillas"], ["googlesheets.svg", "Sheets", "Planillas"], ["microsoftoutlook.svg", "Outlook", "Correo"], ["microsoftteams.svg", "Teams", "Reuniones"], ["notion.svg", "Notion", "Documentos"], ["slack.svg", "Slack", "Equipo"], ["claude.svg", "Claude", "IA"], ["openai.svg", "ChatGPT", "IA"]];
  const placa = ([img, n, t]) => `<div class="placa"><img src="recursos/logos/${img}" alt=""><div><b>${n}</b><small>${t}</small></div></div>`;
  $("#fila-a").innerHTML = [...A, ...A].map(placa).join(""); $("#fila-b").innerHTML = [...B, ...B].map(placa).join("");
}

/* ── Precios: mensual o anual (el anual paga 10 meses) ── */
{
  const pesos = (n) => "$" + Math.round(n).toLocaleString("es-CL");
  const elegir = (periodo) => {
    $$(".periodo button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.periodo === periodo));
    $$(".plan__precio[data-mensual]").forEach((p) => {
      const b = $("b", p), nota = p.nextElementSibling, men = +p.dataset.mensual, anu = +p.dataset.anual;
      b.style.opacity = 0;
      setTimeout(() => {
        b.textContent = pesos(periodo === "anual" ? anu / 12 : men);
        nota.textContent = periodo === "anual" ? `${pesos(anu)} por usuario al año` : "Pagando mes a mes";
        b.style.opacity = 1;
      }, 180);
    });
  };
  $$(".periodo button").forEach((b) => b.addEventListener("click", () => elegir(b.dataset.periodo)));
}

/* ── Menú del celular y progreso de lectura ── */
{
  const boton = $("#nav-menu"), menu = $("#menu-movil");
  const cerrar = () => { nav.classList.remove("abierto"); boton.setAttribute("aria-expanded", false); boton.setAttribute("aria-label", "Abrir el menú"); };
  boton.addEventListener("click", () => { const ab = nav.classList.toggle("abierto"); boton.setAttribute("aria-expanded", ab); boton.setAttribute("aria-label", ab ? "Cerrar el menú" : "Abrir el menú"); });
  $$("a", menu).forEach((a) => a.addEventListener("click", cerrar));
  addEventListener("keydown", (e) => e.key === "Escape" && cerrar());
}
const progreso = $("#progreso");
function pintarProgreso() { progreso.style.setProperty("--p", clamp(scrollY / (document.documentElement.scrollHeight - innerHeight))); }

/* ── Un solo bucle de scroll ── */
let pendiente = false;
function alScroll() { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; pintarNav(); pintarProgreso(); pintarFrase(); }); }
addEventListener("scroll", alScroll, { passive: true }); addEventListener("resize", alScroll);
alScroll();
