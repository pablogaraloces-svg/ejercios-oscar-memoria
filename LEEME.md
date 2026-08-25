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

## 🆕 Novedades de la versión 9 ("Antes de seguir" sin prisa + transición a ejercicios)

**"Antes de seguir" ya no avanza sola**
- Eliminado por completo el avance automático de esta pantalla. Ahora
  Óscar tiene todo el tiempo que necesite para leer, pensar y marcar
  cuantos recordatorios quiera, sin ningún límite de tiempo detrás.
- Nuevo botón **"Seguir ▶️"**, grande y con un parpadeo suave y continuo
  (ni agresivo ni molesto), situado debajo de los recordatorios, centrado.
  Es él quien decide cuándo continuar.

**Nueva transición: "Vamos a comenzar los ejercicios de hoy"**
- Al pulsar "Seguir", Cerebrín aparece a pantalla completa (misma
  estética cálida que la pantalla de inicio) y la voz dice "Vamos a
  comenzar los ejercicios de hoy".
- Dura unos 3 segundos (o algo más si la frase tarda más en leerse) y
  pasa sola automáticamente al primer ejercicio — sin botón, sin que haga
  falta tocar nada.
- Este mismo paso se muestra también aunque la familia no tenga
  configurado ningún recordatorio ese día, justo antes de empezar.

**Revisado a fondo para evitar fallos**: se comprobó que el nuevo
temporizador de esta transición se cancela correctamente si el paso se
abandona por cualquier motivo (evitando que un temporizador "huérfano"
pudiera saltar sobre el paso equivocado más tarde), que el orden de
pasos es correcto tanto con recordatorios como sin ellos, y que no queda
ningún resto del sistema de avance automático anterior.

## 🆕 Novedades de la versión 1.9 (nuevo juego: "El juego de los colores")

**Nuevo juego en la Sala de Juegos, inspirado en Simón**
- Tablero circular con 5 colores (azul, verde, rojo, amarillo, negro),
  cada uno con su propia nota musical (escala pentatónica: Do-Mi-Sol-La-
  Do agudo, para que cualquier secuencia aleatoria suene siempre
  agradable, sin notas disonantes).
- Cerebrín muestra una secuencia cada vez más larga (empezando por una
  sola casilla); Óscar debe repetirla tocando los colores en el mismo
  orden. Cada color se ilumina tanto cuando lo muestra Cerebrín como
  cuando lo toca Óscar, y suena su nota correspondiente en ambos casos.
- Aspecto de volumen 3D, con el mismo lenguaje visual que el botón
  SALTAR del otro juego: degradados, brillo y sombra en cada gajo del
  tablero, con un resplandor propio al iluminarse.
- **Diseño accesible a propósito**: un fallo nunca termina la partida de
  golpe — se repite la misma secuencia con ánimo hablado, sin perder lo
  ya conseguido. Solo se cierra al pulsar "Salir", o al llegar a una
  secuencia ya muy larga (celebración de "te lo sabes todo").
- Se añade a la arquitectura extensible de la Sala de Juegos ya
  preparada para esto exactamente: una entrada más en la lista de
  juegos, sin tocar nada de la pantalla en sí ni del primer juego.
- Estadísticas propias e independientes (ronda máxima alcanzada, tiempo
  jugado), guardadas por separado — nunca se mezclan con las
  estadísticas cognitivas ni con las de Cerebrín Saltarín.
- Verificado con una simulación exacta que la zona del tablero que se
  dibuja para cada color coincide siempre con la zona que detecta el
  toque, para los 5 colores.

## 🆕 Novedades de la versión 1.8 (pista de diferencias, proporciones y Cerebrín Saltarín a fondo)

**Ejercicio de "Las Diferencias" — pista corregida de raíz**
- Encontrado el motivo exacto: el sistema de pistas visuales de toda la
  app se basa en localizar "el botón correcto" entre las respuestas, pero
  este ejercicio no tiene un único botón correcto (tiene varias celdas
  por encontrar), así que la pista hablaba pero nunca llegaba a animar
  nada. Corregido reutilizando exactamente el mismo lenguaje visual que
  el resto de ejercicios (parpadeo suave), aplicado ahora a las celdas
  correctas de este ejercicio en concreto.
- **De paso, corregido un problema más serio del mismo origen**: al
  cuarto fallo, el sistema también hablaba "no te preocupes, era esta" y
  programaba el avance automático a la siguiente pantalla — aunque Óscar
  no hubiera encontrado todavía las diferencias. Ahora el ejercicio deja
  que siga intentándolo con calma hasta encontrarlas todas.

**Proporciones — familia, cálculo y herramientas más compactos**
- Referencia usada: Animales (sin tocar). Familia, Cálculo y Herramientas
  ajustados para acercarse a ese mismo equilibrio.
- **Corregido un fallo real que yo mismo había introducido** en la
  versión anterior: al agrandar los números de Cálculo, usé por error la
  misma rama de código que también muestra los nombres de Familia — así
  que los nombres se agrandaron sin querer a la vez. Separados
  correctamente, cada uno con su propio tamaño.
- Cálculo: cuadrados y números reducidos, además de la cuenta visual de
  abajo, para que quepa todo sin scroll.
- Herramientas: botones ligeramente más compactos, icono todavía grande
  y fácil de identificar.

**Cerebrín Saltarín — revisión a fondo**
- **Animales sustituyen a los cuadrados**: cabra, oveja, burro y vaca,
  cada uno dibujado a mano con rasgos propios para reconocerse de un
  vistazo (orejas largas del burro, cuernos y barba de la cabra, lana
  rizada de la oveja, manchas de la vaca).
- Salto más alto (verificado matemáticamente: 90px de margen de sobra
  sobre la altura del animal), manteniéndose natural y fácil de
  anticipar.
- Hitbox revisada: con un margen de tolerancia para que un roce mínimo
  nunca cuente como choque.
- Al chocar: el animal se tiñe de rojo y recupera su color original
  progresivamente (no se queda en rojo fijo), con una pequeña sacudida.
  Cerebrín tiembla rápidamente un instante y recupera el control de
  inmediato — el juego nunca se detiene.
- Nuevo sistema de puntuación con penalización moderada: -5 puntos al
  chocar, -3 puntos si un premio se queda sin coger — nunca baja de
  cero, para no confundir con números negativos (verificado con una
  simulación).
- Globos de colores (+10 / +40 / +100, con el valor integrado y legible
  dentro del propio globo), además de las estrellas (+20) ya existentes,
  ambos con su valor siempre visible.
- Música mejorada: patrón más musical (con silencios propios, no una
  simple repetición nota a nota) y percusión ligera (bombo + hi-hat) para
  una producción más rica, con el volumen ligeramente más alto pero
  manteniendo siempre la jerarquía voz > efectos > música.
- **Controles rediseñados por completo**: SALTAR ahora es un botón
  redondo, rojo, con letras blancas, relieve y sombra de máquina arcade
  real, situado a la derecha. Reiniciar y Salir, más discretos, a la
  izquierda. El escenario queda limpio y centrado, sin ningún botón
  encima.

## 🆕 Novedades de la versión 1.7 (proporciones de ejercicios y ajustes finos de Cerebrín Saltarín)

**Página principal**
- "Mi familia" y "Sala de juegos" en fila horizontal, con recuadros más
  compactos (no necesitan el mismo tamaño que las tarjetas de un
  ejercicio, ya que su icono es solo decorativo).

**Ejercicios — proporción corregida en toda la app**
- El marco blanco de las tarjetas de respuesta se ha reducido de forma
  general (de 250px a 185px de alto, y de 200px a 150px en las rejillas
  de 3 columnas), manteniendo exactamente el mismo tamaño de dibujo que
  ya gustaba — así el dibujo ocupa mucha más proporción de la tarjeta,
  en vez de verse pequeño dentro de un recuadro grande y vacío. Afecta
  por igual a memoria, atención, colores, herramientas, animales,
  diferencias, intruso y compra — mismo criterio en todos.
- **Corregidos dos fallos reales** que se habían quedado sin ajustar en
  la ronda anterior (cuando se aumentó el tamaño de los dibujos, estos
  dos casos concretos se quedaron con su tamaño antiguo, muy pequeño
  dentro de la tarjeta ya agrandada): el color en el ejercicio de
  Colores (de 52px a 96px) y los números en el ejercicio de Cálculo (de
  un tamaño de letra pequeño a uno grande y en negrita, a la altura
  visual del resto de dibujos).
- Tarjetas de estudio del ejercicio de memoria, también reducidas de
  marco (manteniendo el tamaño del dibujo).
- Con estos cambios, la altura total de una rejilla de 4 respuestas baja
  unos 130px — cabe cómodamente en pantalla sin necesidad de scroll.

**Cerebrín Saltarín — ajustes finos**
- **Encontrada una segunda causa real de la flotación**: la propia
  imagen tenía un margen transparente de hasta 47px por los lados
  (residuo de un procesado anterior), además del problema de proporción
  ya corregido antes. Generada una versión recortada a medida,
  específica para el juego, sin tocar la imagen que usa el resto de la
  app. De paso, corregido un fallo de sincronización: el cálculo de la
  proporción se hacía antes de que la imagen terminara de cargar, y
  nunca llegaba a usar el valor real.
- Obstáculos más pequeños en general, con un 25% de probabilidad de
  salir más alargados (nunca más altos).
- Al chocar contra un obstáculo, se pone en rojo claro con un pequeño
  efecto de sacudida a modo de señal de error, breve y sin resultar
  agresivo.
- Estrellas más grandes, alternadas con pajaritos (dibujo propio), cada
  uno con su propia puntuación.
- Los puntos ya solo suben al superar bien un obstáculo o al conseguir
  una estrella/pájaro — eliminado el goteo de puntos por el mero hecho
  de avanzar por el recorrido.
- Reiniciar y Salir reubicados a la izquierda de la pantalla, a la
  misma altura que SALTAR, en vez de debajo (menos alto de pantalla
  ocupado).

## 🆕 Novedades de la versión 1.6 ("Cerebrín Saltarín" + Sala de Juegos)

**Cerebrín ya no flota — bug real encontrado y corregido**
- Calculé matemáticamente el motivo exacto: el dibujo de Cerebrín no es
  cuadrado (relación 0,88), pero el código asumía que sí lo era al
  posicionarlo, dejando un hueco de ~11px entre sus pies y el suelo.
  Corregido para que se apoye exactamente sobre la línea del suelo,
  usando el alto real del dibujo respetando su proporción original.
- Salto pulido con un pequeño efecto de "chafado" (más estirado al
  despegar, más achatado al aterrizar) para reforzar visualmente el
  impulso y el aterrizaje.

**Música arcade y efectos de sonido**
- Nueva música de fondo propia, alegre y con aire retro, en bucle
  fluido (sin cortes), a volumen moderado para no tapar la voz.
- 5 efectos de sonido distintos: saltar, superar un obstáculo, chocar
  (suave, sin sensación de penalización grave), conseguir un premio, y
  una fanfarria especial al llegar a la meta.
- La música se "agacha" un instante cada vez que suena un efecto, para
  que se oiga con claridad — la voz y los efectos tienen prioridad.
- **Corregido un conflicto real de audio**: la música relajante normal
  de la app no se paraba en ningún momento durante la sesión de
  ejercicios, así que se habría solapado con la música arcade tanto en
  el juego de descanso como en la Sala de Juegos. Ahora se detiene
  explícitamente en ambos puntos de entrada.

**Voz ocasional durante el juego**
- "¡Ya falta poquito!" y "¡Lo estás haciendo muy bien!", cada una una
  sola vez por partida, cerca del final del recorrido — nunca de forma
  continua.

**Premios en la parte superior**
- Estrellas ⭐ que dan +20 puntos, con una altura calculada
  matemáticamente para que SIEMPRE haga falta saltar (por encima de la
  cabeza de Cerebrín de pie) y SIEMPRE sean alcanzables (por debajo del
  punto más alto real del salto, verificado con una simulación física
  frame a frame, no solo con la fórmula teórica). Nunca aparecen a la
  vez que un obstáculo cercano.

**Sala de Juegos — nueva sección**
- Nuevo botón en la portada, junto a "Mi familia", con el mismo
  lenguaje visual (relieve, sombra, respiración sutil).
- Pantalla propia con tarjetas grandes por juego (icono, nombre,
  descripción, mejor puntuación, botón JUGAR) — arquitectura pensada
  para añadir más juegos en el futuro sin tocar esta pantalla.
- Primer juego disponible: Cerebrín Saltarín.
- Diferenciación real entre "juego libre" (desde la Sala de Juegos, sin
  hacer antes los ejercicios) y "juego de descanso" (al terminar una
  sesión cognitiva) — cada uno con su propio destino al pulsar "Salir".

**Estadísticas del juego, completamente independientes**
- Nuevo almacén propio en la base de datos: partidas jugadas, mejor
  puntuación, última puntuación y tiempo jugado — nunca se mezcla con
  memoria, atención, cálculo ni con la dificultad cognitiva.

## 🆕 Novedades de la versión 1.5 (dibujos más grandes, juego de descanso y estadísticas revisadas a fondo)

**Ejercicios — dibujos más grandes y botones más cuadrados**
- Botones de respuesta: de 108px a 250px de alto (proporción mucho menos
  alargada, sin llegar a ser un cuadrado perfecto), con una variante
  propia para las rejillas de 3 columnas (200px) para que ejercicios con
  más opciones sigan viéndose cómodos.
- Iconos dentro de los botones: de 64px a 118px (92px en rejillas de 3
  columnas).
- Dibujos de memoria, piezas del puzle de herramientas y recuadros de
  diferencias, todos aumentados de forma coherente entre sí.
- Nada de la estructura, lógica ni línea gráfica se ha tocado — solo
  tamaños y proporciones.

**Nuevo: Juego de descanso**
- Al terminar los ejercicios cognitivos, un pequeño juego de reflejos
  protagonizado por Cerebrín: corre automáticamente y solo hay que tocar
  SALTAR para esquivar obstáculos. Sin vidas ni penalizaciones duras —
  es un premio relajante, no un reto.
- Puntuación sencilla, barra de progreso, meta, y opciones de Reiniciar
  y Finalizar (con confirmación antes de cortar la partida a medias).
- Al terminar (o finalizar antes de tiempo): "¡Muy bien!" + puntos +
  Repetir/Finalizar. Finalizar continúa exactamente con el cierre normal
  de la sesión, sin ningún cambio en ese sistema.
- Completamente independiente de las estadísticas cognitivas: no llama
  en ningún momento a `reportResult()` ni a la dificultad adaptativa.

**Estadística de "dificultad" — corregida de raíz**
- Encontrado un fallo real: el sistema solo contaba un fallo cuando
  Óscar se rendía tras 4 intentos seguidos en el mismo ejercicio. Si
  fallaba 1, 2 o 3 veces y luego acertaba, se contaba exactamente igual
  que un acierto a la primera — la dificultad real quedaba muy
  infravalorada. Corregido reutilizando el mismo dato que ya se
  guardaba (número de pistas usadas antes de acertar), sin inventar
  ningún sistema de cálculo nuevo.

**Solapamiento de títulos de categorías — corregido de raíz**
- Con hasta 9-10 categorías de ejercicio, el gráfico (de ancho fijo)
  no tenía espacio suficiente y los títulos se pisaban entre sí. Ahora
  el gráfico se ensancha automáticamente según haga falta (con scroll
  horizontal en su contenedor si hay muchas categorías), y cada título
  ajusta su tamaño de letra o se parte en dos líneas antes que
  solaparse con el de al lado.

**Restablecer estadística por categoría**
- Nueva lista con cada categoría por separado (aciertos %) y su propio
  botón "Restablecer", con confirmación explícita antes de borrar. Borra
  solo esa categoría — el resto de estadísticas, la familia, la salud y
  las sesiones no se ven afectadas en absoluto.

**PDF "Enviar resumen" — reestructurado por completo**
- Nueva organización profesional: Resumen cognitivo (nombre y periodo) →
  Actividad (sesiones, ejercicios, tiempo total y medio) → Estadísticas
  cognitivas (aciertos por categoría, en tabla) → Dificultad (con los
  mismos datos ya corregidos) → Salud (con tabla Fecha/Oxígeno/Tensión)
  → Medicación.
- Nunca usa frases de diagnóstico ("todo está bien", "riesgo bajo") — es
  un registro de seguimiento, no una valoración médica.
- Comprobado que cabe correctamente en A4 sin solapamientos, incluso con
  el máximo de registros de salud.

## 🆕 Novedades de la versión 1.4 (correcciones y diseño del ejercicio de diferencias)

**Medicación y horarios**
- Corregido: el botón "Guardar cambios" quedaba oculto por un límite de
  altura del desplegable, insuficiente desde que se añadió la sección de
  medicación. Ya es visible siempre, sin importar cuántos medicamentos
  tenga cada momento del día.

**Salud → Historial**
- Ahora se puede tocar cualquier registro del historial para corregir
  sus datos (oxígeno, tensión alta y baja) de ese día concreto. Al
  guardar (o cancelar), se vuelve automáticamente a la vista de
  historial.

**Ejercicio de diferencias — rediseñado**
- El parpadeo del recuadro que hay que tocar ya no es un encendido/apagado
  brusco: ahora es una retroiluminación suave y continua, que sube y baja
  de intensidad como una respiración, sin apagarse nunca del todo.
- "Imagen 1" e "Imagen 2" han dejado de ser un texto suelto: ahora son
  cápsulas elegantes con relieve propio (recuerdan a un botón, sin
  serlo — no responden al tacto). La cápsula de "Imagen 2" parpadea
  exactamente al mismo ritmo que el recuadro, para que la vista asocie
  ambas señales.

**Botón de salir**
- Corregido el solape con los nombres del ejercicio de reconocimiento
  familiar: el botón se encoge discretamente solo durante ese ejercicio y
  recupera su tamaño normal en el siguiente paso (o en cuanto se vuelve a
  la portada, por cualquier camino).

## 🆕 Novedades de la versión 1.3 (correcciones y medicación)

**Administración**
- Corregido el solape del texto "Mantén pulsado ⠿..." con el primer
  botón: ahora queda pegado justo debajo del título, sin invadir nada.

**Perfiles**
- Al eliminar un perfil, la aplicación ya no salta a la pantalla
  principal: se queda en Perfiles, mostrando el resto de fichas.
- **Nueva sección de medicación por perfil**: Mañana / Mediodía / Noche,
  cada una con su lista de medicamentos (nombre, cantidad —admite
  "1/2" para media pastilla— y hora). Se guarda al instante en cuanto se
  añade o se quita algo.

**"¿Cómo te encuentras hoy?"**
- Corregido el corte de voz: ahora la pantalla espera al menos 4
  segundos, pero si la frase es más larga de leer, se alarga
  automáticamente (con 1,5s de margen) para que nunca se corte a mitad.

**Ejercicio de cálculo**
- Añadida (sin tocar nada existente) una cuenta visual grande en la
  parte inferior, tipo "4 − 2 = ?", con el interrogante parpadeando hasta
  que Óscar acierta, momento en el que se sustituye por el resultado real
  con una pequeña animación. Números grandes y muy legibles.

**Botón de salir**
- Nueva opción "Ir al inicio", junto a las dos que ya había ("Seguir un
  poco más" y "Salir"), para volver a la portada sin cerrar la app.

**Página principal**
- Cerebrín aparece ahora también de fondo, muy grande pero muy sutil
  (apenas un 7% de opacidad), fundido con el degradado, a la derecha de
  la pantalla — un toque personal que no interfiere con la lectura de
  los botones. Se desactiva automáticamente en modo alto contraste.

**Estadísticas**
- Nuevo resumen de medicación (mañana/mediodía/noche, con nombre,
  cantidad y hora), con el mismo diseño limpio de tarjetas que el resto
  de la pantalla, y también incluido en el PDF exportable.

## 🆕 Novedades de la versión 1.2 (perfiles múltiples, fechas en español, PDF ampliado)

**Sistema de versiones reiniciado**
- A partir de esta actualización, la app se considera "ya funcional de
  verdad" y el contador vuelve a empezar en 1.1 (esta ronda de cambios ya
  es la 1.2). Se mantiene el esquema de decimales por cambio pequeño.

**Fechas en español (fallo real corregido de raíz)**
- Nueva utilidad compartida (`js/core/dateUtils.js`) que separa la clave
  interna de guardado (estable, sin idioma) del texto que se muestra
  (siempre en español). Corregidas las 10 apariciones del problema en
  Salud, Estadísticas, recordatorios y ánimo diario. De paso, se corrigió
  un fallo latente: antes las fechas no ordenaban cronológicamente de
  verdad (solo alfabéticamente por el nombre del día en inglés).

**PDF de Estadísticas ampliado**
- Antes faltaban datos reales al exportar (la gráfica de tiempo dedicado
  por día, el calendario de ánimo completo, y toda la sección de Salud no
  se incluían). Ahora se exporta todo, con un diseño limpio por bloques
  que crea páginas nuevas automáticamente según haga falta. Preparado
  para ampliarse fácilmente: cada vez que se añada una estadística nueva
  a la pantalla, basta con añadir una línea al PDF para que se incluya
  también ahí.

**Sin música en Administración**
- La música de fondo (pensada solo para el ratito de Óscar) se apaga en
  cuanto se entra en Administración con el PIN, y se reanuda sola al
  volver a la pantalla principal.

**Botones de Administración reordenables**
- Igual que las fotos de familia: mantén pulsado ⠿ para colocar Ajustes,
  Estadísticas, Salud y Editar familia en el orden que prefieras. El
  orden se guarda y se respeta la próxima vez.

**Portada más limpia**
- Eliminado el mensaje "Estoy aquí para acompañarte, sin prisa 💛".

**Icono más profesional**
- El icono maskable (el que usa Android para el icono real de la tablet)
  ya no tiene el degradado de fondo que se veía unos segundos al abrir la
  app: ahora es blanco liso, sin tocar el diseño de Cerebrín.

**Nombre de la app corregido**
- Donde antes aparecía "Acompañante" (la etiqueta del icono en la
  pantalla de inicio de Android, y el título de la pestaña del
  navegador), ahora aparece "Cerebrín" en todos los sitios.

**Perfiles múltiples (la novedad más grande)**
- La pestaña "Perfil" de Ajustes pasa a llamarse "Perfiles" y permite
  tener a varias personas usando la misma aplicación, cada una con sus
  propias estadísticas, familia, recordatorios y salud completamente
  separados entre sí.
- Cada perfil tiene su propia ficha: foto (igual que las fotos de
  familia), edad, peso, altura y un campo de **Observaciones** libre.
- Al tocar la foto y el nombre de una persona se abre un desplegable con
  un pequeño efecto de "crecer con rebote" al abrir (estilo Apple), donde
  se puede editar la ficha, cambiar a ese perfil ("Usar este perfil") o
  eliminarlo (nunca se puede eliminar el último que quede).
- Se pueden añadir perfiles nuevos desde ahí mismo.
- Al cambiar de perfil, toda la aplicación (ejercicios, familia,
  recordatorios, salud, estadísticas) pasa a mostrar automáticamente los
  datos de la persona elegida — no hace falta ningún cambio adicional en
  el resto de la app, porque todo ya se guardaba internamente separado
  por persona.
- **Dos fallos reales de fondo, corregidos de paso**: el registro diario
  de ánimo no llevaba ninguna marca de a qué perfil pertenecía (con dos
  personas el mismo día, una sobrescribía el ánimo de la otra), y
  "resetear estadísticas" borraba el ánimo y los recordatorios de
  **todos** los perfiles en vez de solo el activo. Ambos corregidos.
- Al eliminar un perfil se borran también, en cascada, todos sus datos
  asociados (sesiones, recordatorios, progreso, salud) — nunca queda
  información huérfana guardada sin dueño.

## 🆕 Novedades de la versión 11.1 (correcciones puntuales)

**Nuevo esquema de numeración de versiones**
- A partir de ahora, los cambios puntuales suman un decimal (11.1, 11.2,
  11.3...) en vez de subir el número entero cada vez. Cuando se acumule
  una actualización grande, se pasará a la versión 12 y se reiniciará el
  decimal. Así hay margen para muchos ajustes finos sin que el número
  crezca demasiado rápido.

**Familia: corregido el corte de fotos (causa real, no un parche)**
- Encontrado el motivo exacto: el contenedor con scroll interno de la
  lista de familiares no tenía `min-height: 0`, un detalle técnico de
  Flexbox sin el cual ese tipo de contenedor no se limita a su espacio
  disponible ni activa correctamente su propio scroll — en su lugar,
  "empuja" y corta el contenido de toda la pantalla. Corregido de forma
  general (beneficia también, de forma silenciosa, a otras pantallas con
  scroll interno como Estadísticas, Ajustes o Salud).
- Además, se ha reducido el espacio que ocupaban la barra superior y el
  título en esta pantalla, para aprovechar mejor el alto disponible y ver
  cómodamente a los grupos familiares.

**"Estoy listo": el botón ya no se solapa con el calendario**
- Sustituido el cálculo manual de posición (que podía fallar según el
  ancho real del botón) por una rejilla de 3 columnas donde el calendario
  y el botón viven en columnas completamente independientes — así es
  geométricamente imposible que se solapen, sea cual sea su tamaño. El
  botón queda además un poco más arriba, en el hueco entre el calendario
  y el borde derecho de la pantalla.

## 🆕 Novedades de la versión 11 (correcciones de detalle y ajuste fino)

**Familia**
- Corregido un fallo real de rendimiento: el scroll de la pantalla iba
  lento y tardaba en reaccionar porque `touch-action: none` (pensado solo
  para el icono de arrastre ⠿) se estaba aplicando sin querer a toda la
  tarjeta, desactivando el gesto de scroll nativo del navegador en
  cualquier punto que se tocara. Ya solo afecta al asa de arrastre.
- El título "Mi familia" / "Editar familia" ha salido de la barra
  superior (que ahora solo tiene los botones) y es ahora un titular
  propio, grande, centrado arriba, con un sutil degradado de color en el
  propio texto.

**Portada**
- Añadida la versión de la aplicación justo debajo del crédito de
  autoría, alineada con él por la izquierda, mismo gris, un punto de
  letra más grande.

**Pantalla "Estoy listo"**
- El saludo de arriba y el calendario de abajo ahora comparten el mismo
  eje central (antes el botón "Estoy listo" al lado del calendario
  desplazaba su centro visual). El botón ahora "flota" a la derecha sin
  descentrar nada.

**"Antes de seguir"**
- El botón "Seguir" se ha subido un poco para que el brillo de su
  parpadeo no invada visualmente la lista de recordatorios de justo
  debajo.

**Pantalla final**
- Sustituida la copa por Cerebrín a buen tamaño, despidiéndose con una
  entrada animada suave — una despedida más elegante y sutil.

**Icono de la aplicación**
- Corregido de verdad esta vez: en vez de recomponer un diseño nuevo, se
  ha adaptado el diseño ORIGINAL (el que se subió al proyecto, con su
  tarjeta y el texto "CEREBRÍN") extendiendo matemáticamente sus propios
  colores hacia las esquinas transparentes mediante relleno por vecino
  más cercano + un desenfoque suave solo en esa zona extendida — sin
  tocar ni un píxel del diseño original en sí. El resultado es un icono
  a sangre completa, sin ninguna costura visible, que respeta al 100% la
  identidad visual original.

## 🆕 Novedades de la versión 10 (calendario, diferencias, familia y transiciones)

**Calendario de "Estoy listo"**
- La voz simplificada dice ahora con claridad el día de la semana, el día
  y el mes ("Hoy es miércoles, 19 de agosto"), sin el año (que alargaba
  la frase y restaba protagonismo al día de la semana).
- El botón "Estoy listo" se ha movido junto al calendario (a su lado, no
  debajo), más pequeño que el CTA de la portada pero con el mismo
  parpadeo, sin pisar nada; en vertical se apila automáticamente.

**Ejercicio de diferencias**
- Los dos recuadros de imágenes ahora son más grandes (de 58 a 80 píxeles
  por celda), para verse mejor.
- Títulos más claros: "IMAGEN 1" / "IMAGEN 2" en mayúsculas.
- Eliminado el texto "TOCA AQUÍ": ahora el propio recuadro que hay que
  tocar se ilumina por los bordes de forma sutil e intermitente, para que
  la vista vaya sola hacia él.

**Ejercicio de familia**
- Quitado el fondo/"escenario" gris que aparecía detrás de la foto (se
  dejó tal cual, con su marco y sombra propios, sin recuadro extra).
- Botones de nombres algo más pequeños.
- Al acertar, la propia foto hace un pequeño "latido" (zoom con rebote),
  además del brillo verde del botón elegido.

**Transición entre ejercicios**
- Añadido un desvanecido de salida sutil (200 ms) específicamente entre
  un ejercicio y el siguiente, para que el cambio no se sienta tan de
  golpe. El resto de pantallas de la sesión mantiene su transición
  habitual, sin este paso extra.

**Icono de la aplicación regenerado**
- El icono (incluido el maskable, que es el que usa Android para el
  icono real de la tablet) tenía dos fondos superpuestos y el texto
  "CEREBRÍN" incrustado, lo que se veía desajustado. Se ha regenerado
  desde cero usando el personaje limpio sobre el mismo degradado cálido
  que ya se usa para la mascota en el resto de la app — así el icono de
  la tablet es visualmente coherente con el diseño interno.

## 🆕 Novedades de la versión 9 (número de versión, calendario y ajustes de ritmo)

**Número de versión visible**
- Debajo del crédito de autoría en la pantalla de inicio aparece ahora
  "Versión 9". Vive en un único archivo (`js/core/version.js`), sincronizado
  con la versión de caché del Service Worker, para que siempre se sepa con
  un vistazo qué versión hay instalada en la tablet. Se incrementará en
  cada actualización futura.

**Pantalla "Estoy listo" rediseñada**
- Sustituida la fecha/hora sueltas (que quedaban frías) por una tarjeta de
  calendario del mes actual, limpia y ordenada al estilo Apple: todos los
  días del mes, con el día de hoy resaltado con un círculo de color y una
  pequeña animación al aparecer.
- El reloj digital ya no es un texto suelto: está integrado en la propia
  cabecera del calendario, junto al mes, con tipografía tabular (los
  números no "bailan" al cambiar) dentro de una cápsula de color cálido.
- El botón "Estoy listo" ahora parpadea (mismo estilo que el resto de la
  app) y queda colocado abajo, con espacio de sobra alrededor de todo el
  conjunto.

**"¿Cómo te encuentras de humor hoy?" más ágil**
- Corregido: antes, tras marcar un icono, podía tardar bastante más de lo
  esperado en avanzar (el margen de seguridad de la voz se sumaba de más).
  Ahora son exactamente 4 segundos tras la selección, ni más ni menos.

**"Antes de seguir": botón "Seguir" arriba a la derecha**
- Reubicado desde abajo hasta la esquina superior derecha de la pantalla,
  bien visible y sin pisar nunca el título ni la lista de recordatorios
  (se reserva automáticamente el hueco necesario, y en vertical se coloca
  centrado arriba en vez de a la derecha, para que siempre quede cómodo).

## 🆕 Novedades de la versión 8 (inicio, Cerebrín vivo, familia y climatología)

**Pantalla de inicio: causa raíz corregida**
- Encontrado y corregido el motivo real de que a veces se vieran pantallas
  antiguas antes de Cerebrín: el Service Worker servía el HTML principal
  en modo "caché primero" para todo, incluido el propio documento. Ahora
  el documento HTML se sirve siempre en modo "red primero" (con caché
  como respaldo si no hay conexión), así que la app carga siempre la
  versión más reciente desde el primer instante — no era un problema de
  "tapar" nada, sino de qué versión se estaba sirviendo.
- Secuencia de entrada/pausa/salida de Cerebrín: aparece con un suave
  acercamiento, hace un pequeño balanceo (simulando saludo), se asienta en
  su pose oficial (pulgar arriba), una pequeña pausa, y una despedida
  animada antes de pasar a la página principal — todo por transform y
  opacity (ligero para la tablet). La duración prioriza la fluidez sobre
  cumplir exactamente 3 segundos.
- Nuevo sonido de bienvenida: un colchón cálido de fondo + un pequeño
  destello mágico ascendente, en vez del pitido anterior.

**Cerebrín, más vivo**
- Halo/onda de voz detrás de Cerebrín mientras habla: dos anillos que se
  expanden y desvanecen en bucle, sutiles y semitransparentes, que
  desaparecen en cuanto deja de hablar. Reutiliza el mismo estado que ya
  activaba la animación de la boca, sin tocar el sistema de voz.
- Globo de diálogo ahora se adapta de verdad al contenido: compacto si el
  mensaje es corto, crece (y ajusta el texto) si es largo, sin desbordarse
  nunca. Tipografía algo más cálida sin sacrificar legibilidad.

**Ejercicio de familia**
- La fotografía ahora se presenta sobre un "escenario" con degradado
  sutil y sombra ambiental (inspirado en interfaces tipo Apple), dando
  sensación de profundidad. La foto sigue siendo la protagonista.

**Página principal**
- **Corregido un fallo real** por el que la climatología nunca llegaba a
  aparecer: la aplicación solo lo intentaba una vez por sesión y, si ese
  primer intento fallaba (permiso aún no concedido, GPS lento…), se
  quedaba oculta para siempre. Ahora se reintenta cada vez que se vuelve
  a la portada, sin pedir permisos de más gracias a la caché interna de
  20 minutos ya existente. Los datos siguen siendo reales (Open-Meteo +
  ubicación del dispositivo), nunca simulados.
- El botón "Mi familia" ahora tiene su propia animación de respiración,
  igual de discreta que la de "Empezar el ratito de hoy" pero con un
  ritmo y un desfase distintos, para que nunca "respiren" los dos a la
  vez.

**Una honestidad técnica**: la mascota es una única imagen estática (no
hay fotogramas separados de ojos cerrados o distintas sonrisas), así que
el "parpadeo" y el "cambio de sonrisa" de la entrada no están animados
literalmente — en su lugar, la sensación de vida se consigue con el
balanceo de brazo/cuerpo, el acercamiento y el asentamiento final. Si en
algún momento se genera una versión de Cerebrín con los ojos en una capa
separada, se podría añadir un parpadeo real sin tocar el resto.

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
