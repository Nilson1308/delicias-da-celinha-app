const MAX_SIZE = 300
const JPEG_QUALITY = 0.7

/**
 * Redimensiona um canvas para no máximo MAX_SIZE x MAX_SIZE mantendo proporção,
 * depois desenha em um novo canvas quadrado e retorna Base64 JPEG.
 * @param {HTMLCanvasElement} sourceCanvas - Canvas (ex.: do cropper)
 * @returns {string} data URL "data:image/jpeg;base64,..."
 */
export function compressToBase64(sourceCanvas) {
  const size = Math.min(MAX_SIZE, sourceCanvas.width, sourceCanvas.height)
  const out = document.createElement('canvas')
  out.width = size
  out.height = size
  const ctx = out.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, size, size)
  return out.toDataURL('image/jpeg', JPEG_QUALITY)
}
