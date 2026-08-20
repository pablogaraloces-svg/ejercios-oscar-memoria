/**
 * dragReorder.js — Arrastrar y soltar genérico, con Pointer Events (no
 * con el Drag & Drop nativo de HTML5, poco fiable al tacto en tablets
 * Android). Pensado para reutilizarse en cualquier lista reordenable de
 * la aplicación (Administración, y en el futuro cualquier otra).
 *
 * `container` puede ser una rejilla o una lista vertical de una columna:
 * funciona igual en ambos casos, ya que compara posiciones reales en
 * pantalla (getBoundingClientRect), no coordenadas de rejilla.
 */
export function wireDragReorder(handle, item, container, index, onReordered) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let overIdx = null;

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    item.style.transform = `translate(${dx}px, ${dy}px) scale(1.03) rotate(0.5deg)`;

    const siblings = [...container.children];
    let hoverIdx = null;
    siblings.forEach((c, i) => {
      if (c === item) return;
      const r = c.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        hoverIdx = i;
      }
    });
    siblings.forEach((c) => c.classList.remove("drag-over"));
    if (hoverIdx !== null) siblings[hoverIdx].classList.add("drag-over");
    overIdx = hoverIdx;
  };

  const finishDrag = async () => {
    dragging = false;
    item.classList.remove("dragging");
    item.style.transform = "";
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", finishDrag);
    document.removeEventListener("pointercancel", finishDrag);
    [...container.children].forEach((c) => c.classList.remove("drag-over"));

    if (overIdx !== null && overIdx !== index) {
      await onReordered(index, overIdx);
    }
  };

  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    overIdx = null;
    startX = e.clientX;
    startY = e.clientY;
    item.classList.add("dragging");
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", finishDrag);
    document.addEventListener("pointercancel", finishDrag);
  });
}
