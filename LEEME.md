# Landing de Ascenda

Sitio estático (HTML, CSS y JS puros). No necesita instalación ni build.

## Qué completar antes de publicar
1. `js/config.js`: teléfono, WhatsApp, correo, dirección, horario, redes y URL del sitio (todo lo marcado "PENDIENTE").
2. `js/config.js` → `formulario.endpoint`: URL del webhook de n8n (ver `../captacion/LEEME.md`), o de Formspree, Make o Zapier. Vacío = envío simulado.
   `js/config.js` → `citas`: URLs del flujo "Ascenda · Citas" para la sección Agenda (ver `../automatizaciones/LEEME.md`). Vacías = agenda simulada.
3. `index.html`: testimonios (marcados "[Testimonio de ejemplo]") y contenido de los planes (comentario "EDITABLE").
4. Dominio real en lugar de `https://www.PENDIENTE.com` en `index.html` (canonical y Open Graph), `privacidad.html`, `terminos.html`, `sitemap.xml` y `robots.txt`.
5. `privacidad.html` y `terminos.html`: razón social, país y fecha (marcados "PENDIENTE"); conviene revisarlos con un asesor legal.

## Sección "Sistema" (ASCENDA System)
Presenta el sistema de facturación e inventario para todo tipo de negocio que necesite facturar (nació en una ferretería; carpeta `ferreteria-app` en la PC de Alan). Ese sistema es una app local (Node + SQLite que corre en la computadora del cliente y se comparte por la red del negocio), así que no hay una URL pública que enlazar ni incrustar: la landing lo muestra con textos y capturas.
- Textos que cambian con el sistema (módulos, días de prueba, precio y enlace a demo en línea): `js/config.js` → `producto`. Con `demoUrl` vacío, el botón de demo no aparece.
- Capturas: `assets/producto/sistema-*.webp` (1440×860). Cuando el sistema cambie de aspecto, se sacan de nuevo con datos de ejemplo y se reemplazan con el mismo nombre.

## Diseño (rediseño cinematográfico, 2026-10-23)
La página es oscura y se cuenta "deslizando", al estilo de las webs de producto:
- **Entrada**: el logo se arma como en el video de marca y vuela a su lugar (ver abajo).
- **Inicio**: el logo de Ascenda (dibujado en SVG dentro de `index.html`) se separa en sus piezas, cada una rotulada con un servicio, y se vuelve a unir encendido ("En automático.").
- **24/7**: el número gigante se acerca y aparecen las cuatro ventajas.
- **Servicios**: galería horizontal que avanza al bajar.
- **Cómo trabajamos**: el texto se enciende palabra por palabra.
- **Cómo funciona**: los 4 pasos aparecen uno a uno con contador.
- **Para quién es**, **Beneficios**, **Recorrido** y la firma "ASCENDA" del final se animan al pasar.

Cómo funciona por dentro: cada escena tiene `data-scene` y `js/main.js` le pone la variable CSS `--p` (de 0 a 1) según lo que se haya bajado; el CSS mueve las piezas con esa variable. Los bloques con `data-view` reciben `--v`, y los que tienen `data-lit` reciben la clase `is-lit` al entrar en pantalla (`data-lit="once"` solo una vez). Si el visitante tiene activado "reducir movimiento" (o no hay JavaScript), todo se muestra quieto y completo.

### Fluidez (2026-10-23)
- **Desplazamiento suave con inercia**: la rueda del ratón usa Lenis 1.3.26 (licencia MIT), copiado en `js/vendor/lenis.min.js` para no depender de otro servidor. En celulares queda el desplazamiento táctil normal. Los enlaces del menú (`#seccion`) usan el mismo movimiento y paran justo debajo del header.
- **Animaciones ligeras**: en cada cuadro solo cambian `transform` y `opacity`. El logo del inicio está dividido en capas (`.m-layer`), una por pieza, para que el brillo no se vuelva a dibujar al moverse. Se quitaron los desenfoques de fondo (`backdrop-filter`), la sombra del 24/7 y los degradados que cambiaban en cada cuadro.
- **Medidas guardadas**: `main.js` mide la posición de cada sección una vez (y otra vez si cambia el tamaño de la página) y solo escribe un valor cuando cambia.
- Si se agrega un efecto nuevo, conviene seguir la misma regla: mover con `transform`/`opacity` y evitar `filter`, `backdrop-filter` o sombras que cambien al deslizar.

### Entrada animada y logo (2026-10-24)
- **Logo**: el del inicio está redibujado en SVG a partir del logo original (estrella de cuatro puntas, mástil, dos velas y arco), dentro de `index.html` (bloque `m-defs`). Si cambia el logo, se cambian esas formas.
- **Entrada**: cada vez que se abre o recarga la página se arma el logo como en el video de marca (un cometa traza el arco, sube el mástil con la estrella, aparecen las velas, la estrella brilla, se escribe ASCENDA y el lema). Al final el logo vuela a su lugar en el inicio mientras la página aparece por debajo. Dura unos 7,5 segundos.
- Se salta con el botón "Saltar intro", la rueda del ratón, tocando la pantalla o con cualquier tecla. No aparece si el visitante tiene "reducir movimiento", si entra con un enlace a una sección (`#contacto`, etc.) o sin JavaScript.
- Dónde está: marcado `.intro` en `index.html`, estilos "ENTRADA ANIMADA" al final de `css/styles.css`, y `initIntro` en `js/main.js` (ahí están los tiempos de cada paso). Un respaldo en el `<head>` muestra la página a los 12 s si algo fallara.

La versión anterior quedó guardada en `../landing-anterior/` (index.html, css y js).

## Modo oscuro y claro
La página arranca en oscuro. El botón del header cambia toda la página a claro (escenas incluidas; los ajustes de las escenas están al final de `css/styles.css`) y la elección se guarda en el navegador.

En celular y tablet (menos de 900 px) los servicios son una fila que se desliza con el dedo, sin escena fija.

## Cambiar colores
Están en las variables del inicio de `css/styles.css`: el bloque `:root, .zone-dark` es el tema oscuro y `:root[data-theme="light"]` el claro.

## Desplegar
Sube el contenido de esta carpeta (sin `capturas/` ni este archivo) a cualquier hosting estático:
- Netlify o Cloudflare Pages: arrastra la carpeta en su panel.
- GitHub Pages: súbela a un repositorio y activa Pages.
- Hosting tradicional: súbela por FTP a `public_html`.
Luego apunta tu dominio y da de alta `sitemap.xml` en Google Search Console.

## Probar en local
`python3 -m http.server` dentro de la carpeta y abre http://localhost:8000

## Servicio "Google NFC stand review" (2026-11-03)
Octava tarjeta de la galería de Servicios (ícono `i-nfc`): stand NFC para que los clientes dejen reseñas en Google. Pago único de RD$3,000 (moneda asumida, por confirmar con Alan). También está en la lista del formulario y en `llms.txt`; el puntaje del flujo de captación ya lo reconoce (`captacion/ascenda-captacion.n8n.json`; el flujo en vivo en n8n hay que actualizarlo aparte).
