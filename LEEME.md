# Mi Acompañante Diario — PWA de estimulación cognitiva

Aplicación web progresiva (PWA), pensada para tablets Android como la **Honor Pad X9a**,
que funciona **completamente offline** una vez instalada.

## 🆕 Novedades de la versión 4

- **Pregunta de humor sin duplicar**: la tercera pantalla ahora pregunta
  siempre "¿Cómo te encuentras de humor hoy?", sin repetir la pregunta del
  saludo inicial.
- **Navegación 100% automática**: eliminado el botón "Continuar" de
  "Antes de seguir" y el botón "Continuamos" de los ejercicios. La app
  conduce a Óscar de una pantalla a otra sola, esperando siempre ~3
  segundos más de margen para que la voz y las animaciones no se corten.
- **"Antes de seguir" corregido de verdad**: cada sesión empieza con todos
  los recordatorios desmarcados (no arrastra el estado de sesiones
  anteriores), se puede marcar y desmarcar libremente para corregir un
  toque accidental, y al marcar "Hecho" el botón se pone completamente
  verde de forma inequívoca.
- **Ejercicio de memoria con animación suave**: cada dibujo "respira" a su
  propio ritmo mientras se observa, para invitar a mirarlo con calma sin
  revelar la respuesta ni resultar mareante.
- **Nuevo ejercicio: Puzle de herramientas** — falta una pieza (martillo,
  destornillador, llave inglesa, alicates, sierra, tornillo...) y, al
  elegir la correcta, se anima volando hasta el hueco y encajando.
- **Arreglado el fallo que impedía que apareciera "¿Adivinas quién es?"**:
  antes nunca llegaba a salir en la rotación de ejercicios (dependía de una
  lista fijada durante la configuración inicial, antes de cargar ninguna
  foto). Ahora, tanto este ejercicio como el nuevo puzle de herramientas
  aparecen siempre en cada sesión, con posiciones garantizadas.
- **Frase de acierto con género y parentesco reales**: "Correcto, Óscar. Él
  es Pablo, es tu yerno." — se puede indicar el género de cada familiar
  (opcional) al añadirlo o modificarlo, para que la frase suene natural sin
  inventar nunca un parentesco que no esté guardado.
- **Mi Familia interactiva**: tocar una fotografía la amplía un momento y la
  voz dice quién es y su parentesco — una ayuda de memoria voluntaria, no
  un examen.
- **Blanco corregido** en el ejercicio de colores: ahora es blanco puro,
  con un borde gris bien visible para distinguirlo del fondo.
- **Voz**: nuevos controles de velocidad (más lenta / normal / más rápida)
  y tono, en Administración > Ajustes > Voz y música.
- **"Mi evolución" renombrado a "Estadísticas"**, para que se entienda
  como la zona de seguimiento de la familia.
- **Botón "Restablecer estadísticas"**, claramente separado y con
  confirmación explícita — borra sesiones, gráficas y calendario de ánimo,
  pero nunca el perfil, la familia, las fotos, los recordatorios ni los
  ajustes.
- **Calendario de ánimo con iconos mucho más grandes**, para distinguir de
  un vistazo cómo se ha sentido Óscar cada día del mes.
- **Títulos de Administración** (Administración, Ajustes, Estadísticas,
  Editar familia) un punto más grandes y legibles.

## 🆕 Novedades de la versión 3

- **Pantalla de Óscar simplificada al máximo**: en la pantalla principal solo
  ve dos botones: "Empezar el ratito de hoy" y "Mi familia" (en modo solo
  lectura, sin poder modificar nada).
- **Administración con PIN**: un botoncito discreto 🔐 abajo a la izquierda
  (muy poco visible, para no distraer a Óscar) da acceso, tras introducir un
  PIN, a Ajustes, Mi evolución y la edición de la familia. El PIN se crea
  durante la configuración inicial y se puede cambiar luego en Ajustes > Perfil.
- **Botón "Estoy listo"** más grande, en masculino.
- **Mascota mono mucho más interactiva**: al tocarla reacciona con una
  animación divertida distinta cada vez (giro, salto, tambaleo, o un
  "achuchón"), y cambia de cara.
- **Recordatorios**: corregido de verdad el botón "Marcar hecho" — ahora, al
  pulsarlo, se pone completamente verde de forma inmediata y clara.
- **Pistas ahora son visuales, no habladas**: la voz solo avisa una vez
  ("Fíjate bien, Óscar, te voy a dar una pequeña pista") y a partir de ahí la
  ayuda es un parpadeo suave sobre la opción correcta — la voz no da más
  pistas por texto.
- **Aviso por inactividad diferenciado**: si pasa un minuto sin tocar nada,
  ya no parpadea el botón entero; se mueve solo el dibujo de la opción
  correcta (p.ej. la luna se balancea un poco), dejando el parpadeo del botón
  reservado para cuando de verdad se ha fallado varias veces.
- **Ejercicios visuales sin nombres escritos**: animales, colores, atención y
  memoria muestran solo el dibujo, nunca el texto debajo.
- **Todo más compacto**: tipografía, tarjetas y espaciados reducidos para que
  la sesión entera quepa en pantalla sin tener que hacer scroll.
- **Botón "Continuamos"** movido arriba a la derecha, junto a la barra de
  progreso, en lugar de debajo del contenido.
- **Corregido el audio de las operaciones matemáticas**: ahora la voz siempre
  dice "más" o "menos" correctamente (antes, en algunos motores de voz, el
  signo "-" se leía mal).
- **Reconocimiento familiar mejorado**: "¿Reconoces a esta persona?" con 3
  nombres, y al acertar la voz dice, por ejemplo, "Correcto, Óscar. Esta es tu
  yerno, Pablo."
- **Música de fondo con 5 ambientes** distintos para elegir (Amanecer
  tranquilo, Brisa suave, Tarde de piano, Jardín sereno, Manta cálida).
- **Selector de voz ampliado**: ahora se listan todas las voces/asistentes de
  voz instalados en la tablet (no solo los de Google), con el español
  primero. *Nota honesta*: al ser una app 100% offline, solo puede usar las
  voces que ya tenga instaladas el propio dispositivo; para voces más
  humanas y naturales, se pueden instalar voces de mayor calidad desde
  Ajustes de Android (Idiomas y entrada > Síntesis de voz > Motor de Google >
  Instalar datos de voz) y aparecerán aquí automáticamente.
- **Perfil ampliado** con peso y altura (opcionales).
- **Mi evolución** ahora incluye: gráfica de a qué horas se hacen las
  sesiones, y un **calendario del mes** que colorea cada día según el ánimo
  que marcó Óscar, con el recuento de días buenos/regulares/malos.
- **Enviar resumen en PDF**: genera un PDF con estadísticas y todas las
  gráficas, y abre el panel de compartir de Android para enviarlo por la
  app de correo que se prefiera (o lo descarga si el dispositivo no soporta
  compartir archivos). *Nota honesta*: la app no tiene servidor propio, así
  que no envía el correo ella misma — prepara el PDF y lo entrega a la app
  de correo elegida.
- **Saludo con fecha completa**: al empezar la sesión, además de saludar, la
  voz dice el día, mes y año actuales.

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
