/**
 * pdfExport.js — Genera un PDF con el resumen de evolución (texto + gráficas)
 * sin usar ninguna librería externa ni conexión a internet: se construyen los
 * bytes del PDF a mano, incrustando cada página como una imagen JPEG (las
 * gráficas ya se dibujan en <canvas>, así que solo hay que "fotografiarlas").
 *
 * Envío por email: como la app no tiene servidor propio, no puede enviar
 * el correo ella misma. Lo que sí hace es generar el PDF y abrir el panel
 * nativo de "Compartir" de Android (si el navegador lo soporta), donde la
 * familia puede elegir directamente su app de correo y adjuntarlo. Si el
 * dispositivo no soporta compartir archivos, se descarga el PDF para
 * adjuntarlo manualmente.
 */

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getJpegSize(bytes) {
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      return { width, height };
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    i += 2 + len;
  }
  return { width: 1240, height: 1754 };
}

function concatBytes(chunks) {
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((c) => {
    out.set(c, offset);
    offset += c.length;
  });
  return out;
}

const enc = (str) => new TextEncoder().encode(str);

/** Construye un PDF de varias páginas a partir de imágenes JPEG (dataURL). */
export function buildPdfFromJpegPages(jpegDataUrls) {
  const PAGE_W = 595; // A4 en puntos (72dpi)
  const PAGE_H = 842;

  const offsets = [];
  let objCount = 3; // 1 = catálogo, 2 = /Pages, a partir de 3 van imágenes/páginas
  const pieces = [];
  let currentOffset = enc("%PDF-1.4\n").length;
  pieces.push(enc("%PDF-1.4\n"));

  function addObject(bytes) {
    offsets[objCount] = currentOffset;
    pieces.push(bytes);
    currentOffset += bytes.length;
    return objCount++;
  }

  const kids = [];

  jpegDataUrls.forEach((dataUrl) => {
    const jpegBytes = dataUrlToBytes(dataUrl);
    const { width, height } = getJpegSize(jpegBytes);

    const imgObjNum = objCount;
    const imgHeader = enc(
      `${imgObjNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    const imgFooter = enc("\nendstream\nendobj\n");
    addObject(concatBytes([imgHeader, jpegBytes, imgFooter]));

    const scale = Math.min(PAGE_W / width, PAGE_H / height);
    const drawW = width * scale;
    const drawH = height * scale;
    const offX = (PAGE_W - drawW) / 2;
    const offY = (PAGE_H - drawH) / 2;

    const content = enc(`q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${offX.toFixed(2)} ${offY.toFixed(2)} cm\n/Im0 Do\nQ\n`);
    const contentObjNum = objCount;
    addObject(concatBytes([enc(`${contentObjNum} 0 obj\n<< /Length ${content.length} >>\nstream\n`), content, enc("\nendstream\nendobj\n")]));

    const pageObjNum = objCount;
    const pageBytes = enc(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /XObject << /Im0 ${imgObjNum} 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`
    );
    addObject(pageBytes);
    kids.push(`${pageObjNum} 0 R`);
  });

  offsets[2] = currentOffset;
  const pagesObj = enc(`2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${kids.length} >>\nendobj\n`);
  pieces.push(pagesObj);
  currentOffset += pagesObj.length;

  offsets[1] = currentOffset;
  const catalogObj = enc(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  pieces.push(catalogObj);
  currentOffset += catalogObj.length;

  const xrefStart = currentOffset;
  const totalObjs = objCount;
  let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
  for (let n = 1; n < totalObjs; n++) {
    const off = offsets[n] ?? 0;
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pieces.push(enc(xref));

  const trailer = enc(`trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
  pieces.push(trailer);

  const pdfBytes = concatBytes(pieces);
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/** Convierte una lista de <canvas> (ya dibujados) en páginas JPEG A4 y genera el PDF final. */
export function canvasesToPdfBlob(canvasList) {
  const jpegDataUrls = canvasList.map((c) => c.toDataURL("image/jpeg", 0.9));
  return buildPdfFromJpegPages(jpegDataUrls);
}

/** Comparte (o descarga si no es posible) el PDF generado. */
export async function shareOrDownloadPdf(blob, filename) {
  const file = new File([blob], filename, { type: "application/pdf" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Resumen de evolución",
        text: "Resumen de evolución para compartir por correo u otra app.",
      });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
