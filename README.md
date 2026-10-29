# Médula · one-page

Página de una sola vista para Médula, con el esqueleto de la v6 de Optimizo (siempre clara, retícula de cuatro columnas, texto que se escribe) y la identidad de Médula (Geist, aura de puntos solo en héroe y cierre, nunca el orbe).

- **En línea:** https://sudo-osito.github.io/medula-onepage/ (GitHub Pages, rama `main`; cada push republica).
- **Local:** `python3 -m http.server 4411 --bind 127.0.0.1` → http://127.0.0.1:4411/
- **Textos:** narrativas comerciales de Médula v1.0 (A: héroe · C: frase y cierre · D: cómo funciona · B: cierre) + datos de medula.condorai.cl (170+ integraciones, seguridad, preguntas, contacto).
- **Precios:** `compartido/planes.ts` de master (Team, Business, Enterprise). Si cambian allá, cambiar acá.
- **Recorrido:** ver v2 abajo.

**v2 (29-oct):** pedido de Max: fuera prueba gratis, precios y «Entrar»; un solo CTA «Agenda tu Discovery» (WhatsApp mientras no haya link real). Recorrido TOFU → MOFU → BOFU: héroe + franja de sistemas al pie (estilo Neiden: corre y desaparece tras la primera línea de la retícula) → Hoy → frase → tabla Sin Médula / Con Médula → cómo funciona → seguridad → preguntas → cómo trabajamos (4 etapas del método de Optimizo, narrativa de Bastián) + cierre con el CTA.

**v3 (29-oct):** upgrade visual tras estudiar Neiden, OneFin y Nexra (capturas headless). Navegación como isla flotante centrada que marca la sección; héroe centrado con el aura arriba y la **isla dinámica** de Médula (negra, cambia de ancho con resorte, muestra la app que está leyendo y una barra de avance); franja con **dos cintas opuestas** recortadas en las líneas exteriores de la retícula; **hoja blanca** que sube sobre el héroe. «Hoy» + «Eso es Médula.» son ahora **una sola escena fija atada al scroll** (360vh): las apps entran desde los lados y escriben su problema al ritmo del scroll, la IA confiesa que no ve nada, todo viaja al centro y se vuelve el símbolo, la frase se enciende palabra por palabra y aparece «Eso es Médula.». Tabla Sin/Con; cómo funciona en dos tarjetas (chat + pasos que se despliegan); seguridad en tarjetas con interfaz viva (cifrado, base propia, aprobación, registro); frase gigante que corre con el scroll; método en 4 tarjetas y cierre con el aura.

**v4 (29-oct):** símbolo de Médula protagonista en el héroe (≈200 px, halo, ondas que salen como impulsos, se inclina hacia el puntero); tabla Sin/Con rehecha como «nervio»: Sin a la izquierda (se tacha y queda atrás), el tema al centro y Con Médula en un panel con un nervio azul que baja con el scroll y enciende cada nodo; orden final: … seguridad → frase gigante → Cómo trabajamos → Preguntas → cierre con CTA y aura.

**v5 · celular (29-oct):** recorrido de celular rehecho sin tocar PC (todo en `@media (max-width: 560px)` + carruseles en JS). Página 12.870 → 8.640 px. Héroe completo en la primera pantalla con la franja a la vista y botones lado a lado; escena fija 290vh; tabla con «Hoy · …» en una línea y Médula en su tarjeta (fondo blanco para que la retícula no cruce el texto); Cómo funciona con los pasos en 2 × 2 arriba, la descripción del paso activo y el chat justo debajo; Seguridad y Cómo trabajamos como carruseles con puntos (el método avanza solo y se centra, y si deslizas manda la persona); sin la tarjeta «¿Tienes otra duda?» (el cierre viene enseguida); cierre y footer compactos.
