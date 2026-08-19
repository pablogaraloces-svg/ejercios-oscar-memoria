# Mi Acompañante Diario — PWA de estimulación cognitiva

Aplicación web progresiva (PWA), pensada para tablets Android como la **Honor Pad X9a**,
que funciona **completamente offline** una vez instalada.

## 🆕 Novedades de la versión 6 (actualización incremental)

Todo lo siguiente se ha añadido **sobre** el código existente, sin reescribir
ni sustituir ninguna pantalla, ejercicio ni sistema que ya funcionaba.

**Página principal**
- Ya no aparece la frase de saludo arriba: ahora se muestra la hora actual
  (grande, como un reloj) y la fecha, actualizándose solas cada 15s.
- Fondo propio y exclusivo de la portada (varios degradados suaves de
  color superpuestos sobre una base cálida), distinto al resto de
  pantallas, que conservan su fondo general.
- Botón "Empezar el ratito de hoy" más estrecho, con una respiración
  suave y continua (cambio muy leve de tamaño y brillo) para que se
  identifique de un vistazo, sin parpadeos bruscos.
- Crédito de autoría discreto en la esquina, como ya existía.

**Relieve en todos los botones**
- Nuevo sistema de "bisel" compartido por todos los botones y tarjetas de
  respuesta de la aplicación (empezar, familia, ejercicios, administración,
  confirmación, selección...): un brillo superior sutil y una sombra
  inferior dan sensación de botón físico, y al pulsar se hunde ligeramente.

**Primera pantalla de la sesión**
- Se mantiene el saludo de siempre, y ahora también dice la hora actual.

**Estado de ánimo**
- Cada emoticono tiene su propia animación de "respiración" suave y
  escalonada (no se mueven todos a la vez), para que se sientan vivos sin
  distraer.

**"¿Has hecho alguna cosita hoy?"**
- Corregido: ya no avanza sola si Óscar no ha marcado nada. En cuanto
  marca (o corrige) algo, espera un momento breve y continúa. Sigue
  pudiendo marcar varias cosas y desmarcarlas libremente.

**Ejercicio de herramientas**
- Corregida la confusión visual: cortar un cable ahora usa **tijeras**
  (se elimina el icono de pinza/prensa que generaba confusión). El
  **tornillo** y la **tuerca** ahora usan un dibujo propio inequívoco (ya
  no dependen de emojis ambiguos como 🔩 o del engranaje ⚙️).

**Familia (ejercicio) y memoria**
- El reconocimiento familiar ahora usa 4 respuestas (antes 3) cuando hay
  familiares suficientes cargados, con la foto más grande y los botones
  algo más compactos para que todo quepa bien equilibrado.
- Los ejercicios de memoria ("recuerda cuál vimos antes") ahora muestran
  siempre 4 opciones de respuesta (antes podían ser solo 3), con las
  imágenes iniciales más grandes, mejor centradas y más separadas.

**Voz más natural**
- El nombre "Óscar" ya no se repite varias veces seguidas dentro de un
  mismo ejercicio o pantalla: como máximo se dice una vez por paso,
  incluso combinando la frase de transición, las pistas y el mensaje de
  acierto.

**Administración → Editar familia**
- Se puede mantener pulsado el icono ⠿ de una persona y arrastrarla para
  cambiar el orden (se mueve todo su bloque: foto, nombre, parentesco...).
  El nuevo orden se guarda y es la única fuente de verdad: "Mi familia"
  (la vista de Óscar) usa automáticamente ese mismo orden.

**Administración → Estadísticas**
- Nueva gráfica de "tiempo dedicado cada día": si hay varias sesiones el
  mismo día, se suman todas (nunca se sobrescriben entre sí).
- Nuevo apartado de Salud dentro de Estadísticas, con historial
  cronológico y promedios mensuales.

**Nuevo apartado: Administración → Salud**
- Formulario sencillo para oxígeno en sangre y tensión arterial (alta y
  baja). Cada medición se guarda con fecha y hora, sin sobrescribir las
  anteriores. Los promedios de oxígeno y tensión se calculan siempre por
  separado, nunca mezclados, pensado para poder consultarse o mostrarse a
  un médico.

## 🆕 Novedades de la versión 7 (Cerebrín + nuevos ejercicios)

**Cerebrín, la nueva mascota oficial**
- Sustituye por completo al mono anterior en toda la aplicación (sesión,
  portada, pantalla de inicio, modal de salida, configuración inicial).
- Ya no hay texto grande duplicado arriba repitiendo lo que dice la
  mascota: el mensaje vive únicamente en el globo de diálogo de Cerebrín.
- El globo ahora sale de su propia columna, junto a Cerebrín — nunca
  puede solaparse con el ejercicio, las imágenes ni los botones, y crece
  verticalmente sin romper el diseño si el mensaje es largo.
- Boca animada mientras habla por voz (sincronizada con el propio sistema
  de texto a voz) y en reposo cuando termina.
- Animación de "pensando" propia al empezar cada ejercicio.

**Pantalla de inicio nueva**
- Cerebrín a pantalla completa, centrado, con el crédito "Diseñado y
  programado por Pablo Garaloces · 2026" debajo. Dura ~3 segundos,
  preparando la app en segundo plano, con una transición final suave
  (sin pantalla negra ni saltos).
- Pequeña melodía de bienvenida (se salta silenciosamente, sin errores,
  si el navegador bloquea el sonido automático).

**Página principal**
- Nuevo bloque de meteorología (icono, temperatura y descripción sencilla)
  integrado junto al reloj. Usa la ubicación del dispositivo si se
  autoriza y un servicio meteorológico sin necesidad de clave de API; si
  no hay datos disponibles, simplemente se oculta sin afectar al resto de
  la aplicación.

**Navegación corregida**
- El botón de volver atrás de los ejercicios ahora vuelve siempre al paso
  inmediatamente anterior de la sesión (no al principio de la app).

**Ejercicios**
- Mensaje de espera por inactividad simplificado a "Tranquilo, tómate tu
  tiempo."
- La animación de la copa final ya no se superpone al texto de
  felicitación: se ancla más abajo y es ligeramente más pequeña.
- El ejercicio de "encuentra las diferencias" ahora dice claramente
  "Imagen 1" / "Imagen 2" y "TOCA AQUÍ" en vez de letras A/B.
- **Nuevo ejercicio "El intruso"**: 4 imágenes, 3 de una misma categoría
  (animales, cocina, herramientas, frutas, transporte) y 1 que no
  pertenece al grupo.
- **Nuevo ejercicio "La compra"**: Cerebrín dice qué hay que comprar
  ("Hoy vamos a comprar leche") y Óscar elige el producto correcto entre
  varios cotidianos.
- Ambos ejercicios nuevos usan exactamente el mismo sistema visual,
  botones, voz y resultados que el resto — no son una interfaz aparte.

## 🎨 Rediseño visual profesional (sistema de diseño v2)

Revisión completa del aspecto visual, sin tocar ni una sola línea de lógica,
función o flujo de la aplicación. Cambios 100% en `css/styles.css` (más un
único retoque puramente decorativo: la paleta de colores del confeti).

**Qué cambió:**
- **Paleta cálida y serena** inspirada en Apple Health / Calm / Headspace:
  azules y verdes suavizados, ámbar cálido en vez de amarillo saturado,
  coral suave en vez de rosa chillón.
- **Fondo con degradado sutil** en vez de color plano, en toda la app.
- **Sistema de sombras estratificado** (`--shadow-xs/soft/lift` + sombras
  de "brillo" a color a juego con cada botón: verde para éxito, ámbar para
  acento, coral para aviso, azul para primario) — sensación de profundidad
  tipo iOS/iPadOS.
- **Radios más generosos** (18/26/34px + `--radius-full` para cápsulas),
  para ese aspecto redondeado y amigable tipo iPad.
- **Botones**: degradado direccional, ligera elevación al pasar el ratón,
  sombra de color a juego con la acción.
- **Tarjetas y opciones de ejercicio**: superficie con degradado sutil,
  elevación al pasar por encima, el emoji ahora vive dentro de una
  "burbuja" circular con sombra interior (efecto de icono premium).
- **Mascota**: aro degradado más rico y sombra de brillo ámbar a su
  alrededor, con borde blanco tipo avatar.
- **Burbuja de voz**: ahora tiene una pequeña "colita" (como un mensaje de
  chat), en vez de ser un simple rectángulo.
- **Modales**: fondo con desenfoque (`backdrop-filter: blur`) y aparición
  con un pequeño rebote (curva de easing tipo resorte), como las hojas
  modales de iOS.
- **Barra de progreso**: degradado con brillo en el extremo, pista con
  sombra interior.
- **Tipografía**: se prioriza la fuente de sistema de Apple (para ese
  aspecto "iPad") con caída elegante a Android/otros, ligero
  `letter-spacing` negativo en títulos grandes para un look más
  "diseñado".
- **Microanimaciones**: nueva curva de easing tipo resorte
  (`--ease-spring`) para celebraciones, aciertos y aparición de modales,
  además de la curva suave ya existente para el resto.
- **Modo alto contraste**: todos los degradados se convierten
  automáticamente en colores planos de máximo contraste (no se ha perdido
  nada de accesibilidad; de hecho queda más robusto que antes, ya que
  ahora todo el sistema de "brillos" también se neutraliza en ese modo).

**Garantía de que no se ha roto nada:** se comprobó, de forma automática y
exhaustiva, que las 91 clases y los 17 `@keyframes` que usa el HTML/JS
existen exactamente igual en el nuevo CSS (ni un nombre cambiado), que la
sintaxis de todo el proyecto sigue siendo válida, y que todos los
`import`/`export`, IDs y archivos cargan sin errores.

## 🆕 Novedades de la versión 5 (correcciones puntuales tras testeo)

- **Puzle de herramientas coherente**: ahora el objeto y la herramienta
  correcta siempre tienen relación lógica real (tornillo→destornillador,
  tronco de madera→sierra, clavo→martillo, tuerca→llave inglesa, cable
  eléctrico→alicates), en vez de piezas de contexto sin sentido.
- **Cálculo con algo más de reto**: ~30% de las veces aparecen operaciones
  con números de dos cifras (tipo "12 + 12"), alternando con las fáciles.
- **La voz guía de un ejercicio a otro**: frases variadas ("Vamos a
  continuar con el siguiente ejercicio, Óscar"...) antes de cada nuevo
  ejercicio (a partir del segundo), ya que no hay botón "Siguiente".
- **Pantalla final sin botón**: felicita a Óscar, guarda la sesión y vuelve
  sola a la pantalla principal; icono de fiesta más grande y mensaje
  centrado.
- **Crédito discreto** en la esquina superior derecha de la pantalla
  principal: "© Diseñado y programado por Pablo Garaloces 2026", con la
  misma sutileza visual que el botón de administración.
- **Recuperación de PIN**: tras 5 intentos fallidos, se ofrece una pregunta
  de seguridad configurable para poder entrar y definir un PIN nuevo.
- **Ajustes reorganizados**: nueva pestaña "🔑 Contraseña admin" (PIN +
  pregunta de seguridad), separada del Perfil; el campo de nombre ahora se
  llama "Nombre del paciente" para evitar confusiones con el PIN de
  administración.

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
