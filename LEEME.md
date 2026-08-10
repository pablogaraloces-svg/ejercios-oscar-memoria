# Mi Acompañante Diario — PWA de estimulación cognitiva

Aplicación web progresiva (PWA), pensada para tablets Android como la **Honor Pad X9a**,
que funciona **completamente offline** una vez instalada.

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
│  │  ├─ phrases.js        → saludos, motivación, cierre (según hora del día)
│  │  ├─ voice.js          → voz opcional (Web Speech API, sin internet)
│  │  ├─ mascot.js         → comportamiento de la mascota
│  │  ├─ adaptiveDifficulty.js → sube/baja dificultad de forma invisible
│  │  ├─ hints.js          → ayudas progresivas (suave → pista → resaltado → solución)
│  │  ├─ reminders.js      → recordatorios configurables por la familia
│  │  ├─ reports.js        → cálculo de estadísticas + gráfica en canvas
│  │  └─ confetti.js       → celebración visual
│  ├─ exercises/           → biblioteca de ejercicios (memoria, atención, cálculo,
│  │                          colores, animales, fotos familiares)
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
