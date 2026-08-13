# Mi Acompañante Diario — PWA de estimulación cognitiva

Aplicación web progresiva (PWA), pensada para tablets Android como la **Honor Pad X9a**,
que funciona **completamente offline** una vez instalada.

## 🆕 Novedades de la versión 2

- **Pantalla adaptada a 2508×1504** (Honor Pad X9a) sin scroll lateral, y totalmente
  utilizable tanto en horizontal como en vertical en cualquier tablet.
- **"Mi evolución"** (antes "Cómo voy"): ahora incluye, además de la precisión general,
  una gráfica de **en qué tipo de ejercicio falla más**, un recuento de **los estados
  de ánimo marcados día a día**, y el **porcentaje de cumplimiento de los recordatorios**.
- **Mi familia**: cada persona se muestra en una tarjeta con su foto; el botón
  "Modificar" permite cambiar nombre, parentesco o foto, y desde ahí también se
  puede **quitar** a la persona.
- **Voz**: se puede elegir, de entre las voces en español instaladas en la tablet
  (incluida la de Google si el dispositivo la tiene), cuál usar. Todo funciona
  sin conexión: es el propio sistema Android el que ya trae los motores de voz.
- **Mascota**: ahora es un mono/macaco simpático (🐵) que cambia de cara según
  Óscar acierta, falla, o está pensando.
- **Celebraciones más emotivas**: al acertar aparece una animación de confeti +
  un emoji que "explota" en el centro de la pantalla con partículas.
- **Botón "Continuamos"**: al terminar cada ejercicio aparece (parpadeando) un
  botón para avanzar cuando el usuario quiera, además de un avance automático
  con más margen de tiempo para que la voz y la animación no se corten.
- **Sonidos de animales**: al tocar cada animal suena un efecto sintetizado
  simpático (sin necesidad de archivos de audio ni conexión a internet).
- **Ejercicio de familia**: adivinar el nombre de la persona en la foto, con
  3 opciones y orden aleatorio.
- **Reacciones de voz según el ánimo**: si la respuesta es positiva, la voz
  se alegra; si es menos buena, anima con una frase motivadora (siempre variada).
- **Recordatorios**: corregido el botón "Hecho" (ahora responde de forma
  inmediata y fiable).
- **Nuevo ejercicio "Encuentra las diferencias"**: dos imágenes con 3
  diferencias reales que hay que tocar en la segunda.
- **Ayuda pasado un minuto**: si no se toca nada en un ejercicio, pasado un
  minuto la voz anima suavemente y se resalta una pista visual.
- **Ejercicio de memoria**: introducción hablada variada ("Óscar, fíjate bien
  en estas imágenes…"), 10 segundos fijos de estudio, y preguntas que no se
  repiten siempre igual.
- **Ejercicio de animales**: corregido el género gramatical ("¿Cuál es la
  vaca?") y ahora solo se muestra el dibujo, sin el nombre debajo.
- **20 ejercicios diarios** variados en lugar de 8.
- **Música de fondo relajante**, generada en el propio dispositivo (sin
  archivos ni internet), con control de volumen y opción de apagarla en Ajustes.

## 📲 Instalación en la Honor Pad X9a (o cualquier tablet Android)

**Opción A — Instalar como app (recomendado):**
1. Sube la carpeta `oscar-pwa` completa a algún sitio accesible desde la tablet:
   - Lo más sencillo: usa una extensión como *Web Server for Chrome*, o sube la carpeta
     a un hosting gratuito (GitHub Pages, Netlify, Vercel) — cualquiera sirve, **solo
     hace falta abrirla una vez con internet**; después funciona sin conexión.
2. Abre la dirección con **Chrome** en la tablet.
3. Chrome mostrará un aviso "Añadir a pantalla de inicio" / "Instalar aplicación".
   Acéptalo. Se instalará un icono como el de cualquier otra app.
4. A partir de ahí, **ya no hace falta conexión a internet**: todo (textos, iconos,
   ejercicios, fotos de familiares, progreso) se guarda en el propio dispositivo.

**Opción B — Servidor local sin subir a internet:**
1. Instala una app como "HTTP Server" o "KSWEB" desde Play Store (una sola vez).
2. Copia la carpeta `oscar-pwa` a la memoria de la tablet.
3. Sirve esa carpeta localmente y abre `http://localhost:PUERTO` en Chrome.
4. Instala la PWA desde el menú de Chrome ("Añadir a pantalla de inicio").

> Importante: por seguridad, los navegadores solo permiten instalar y guardar datos
> offline en páginas servidas por **HTTPS** o por `localhost`. Un simple archivo
> `index.html` abierto con doble clic no habilita el Service Worker.

## 🧩 Arquitectura (modular, pensada para crecer)

```
oscar-pwa/
├─ index.html              → estructura de pantallas
├─ manifest.json           → metadatos de instalación PWA
├─ service-worker.js       → caché offline de todos los recursos
├─ css/styles.css          → sistema de diseño (colores, tamaños, animaciones)
├─ js/
│  ├─ app.js               → router principal, conecta todas las pantallas
│  ├─ core/
│  │  ├─ db.js             → IndexedDB (perfil, recordatorios, progreso, sesiones)
│  │  ├─ state.js          → estado en memoria + catálogos por defecto
│  │  ├─ phrases.js        → saludos, motivación, cierre, reacciones de ánimo
│  │  ├─ voice.js          → voz opcional y seleccionable (Web Speech API, sin internet)
│  │  ├─ music.js          → música de fondo generativa (Web Audio, sin archivos)
│  │  ├─ sounds.js         → efectos de sonido de animales (Web Audio)
│  │  ├─ mascot.js         → mono/macaco con expresiones según acierto/fallo
│  │  ├─ adaptiveDifficulty.js → sube/baja dificultad de forma invisible
│  │  ├─ hints.js          → ayudas progresivas (suave → pista → resaltado → solución)
│  │  ├─ reminders.js      → recordatorios configurables por la familia
│  │  ├─ reports.js        → estadísticas (precisión, fallos por categoría, ánimo, cumplimiento)
│  │  └─ confetti.js       → celebraciones visuales
│  ├─ exercises/           → biblioteca de ejercicios (memoria, atención, cálculo,
│  │                          colores, animales, diferencias, fotos familiares)
│  └─ screens/              → onboarding, sesión diaria, ajustes, familia, informes
└─ assets/icons/            → iconos de la app en todos los tamaños
```

Para **añadir una nueva funcionalidad en el futuro** (por ejemplo, un nuevo tipo de
ejercicio), solo hace falta crear un archivo nuevo en `js/exercises/` con la misma
forma que los demás y añadirlo en `js/exercises/index.js`. El resto de la app no
necesita tocarse.

## 🧠 Qué incluye ya

- Sesión diaria de 20-25 min: saludo cálido según la hora → preguntas de bienestar
  configurables → recordatorios del día → 8 ejercicios variados → cierre motivador.
- Recordatorios personalizables (medicación, agua, dientes, paseo, ejercicio,
  audífonos, crema, rehabilitación) + botón para crear recordatorios propios
  (p. ej. "echarse crema en brazos y piernas").
- Dificultad adaptativa invisible por categoría de ejercicio.
- Ayudas progresivas ante errores, nunca con tono negativo.
- Mascota discreta que anima y señala, sin ser intrusiva.
- Voz opcional, cercana y desactivable.
- Reconocimiento de fotos familiares (se añaden desde "Mi familia").
- Informes sencillos con racha de días, sesiones totales y precisión media.
- Accesibilidad: alto contraste, texto grande/muy grande, reducir animaciones,
  botones enormes (mínimo 88px de alto), sin gestos complejos.
- Botón fijo de salir con confirmación amable y guardado automático.
- Todo el progreso se guarda localmente (IndexedDB) — no se pierde nada al cerrar.

## 🔧 Notas técnicas

- No requiere backend ni cuentas de usuario: todo vive en el dispositivo.
- Las fotos de familiares se guardan como imágenes locales (no se suben a ningún sitio).
- Si en el futuro se quiere sincronizar entre dispositivos o hacer copia de seguridad,
  el módulo `db.js` ya centraliza todo el acceso a datos, lo que facilita añadir
  una exportación/backup sin rehacer la app.
