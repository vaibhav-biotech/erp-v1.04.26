/**
 * Resize/compress images before S3 upload. Uses sharp when installed.
 */
let sharp = null;
try {
  sharp = require('sharp');
} catch {
  console.warn('[imageOptimize] sharp not installed — images upload without optimization');
}

const MAX_WIDTH = parseInt(process.env.BULK_IMAGE_MAX_WIDTH || '1200', 10);
const JPEG_QUALITY = parseInt(process.env.BULK_IMAGE_JPEG_QUALITY || '82', 10);

/**
 * @param {Buffer} inputBuffer
 * @returns {Promise<{ buffer: Buffer, contentType: string, optimized: boolean, originalBytes: number, outputBytes: number }>}
 */
const optimizeImage = async (inputBuffer) => {
  const originalBytes = inputBuffer?.length || 0;

  if (!sharp || !inputBuffer || originalBytes === 0) {
    return {
      buffer: inputBuffer,
      contentType: 'image/jpeg',
      optimized: false,
      originalBytes,
      outputBytes: originalBytes,
    };
  }

  try {
    const pipeline = sharp(inputBuffer, { failOn: 'none' })
      .rotate()
      .resize({
        width: MAX_WIDTH,
        height: MAX_WIDTH,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true });

    const buffer = await pipeline.toBuffer();

    return {
      buffer,
      contentType: 'image/jpeg',
      optimized: true,
      originalBytes,
      outputBytes: buffer.length,
    };
  } catch (error) {
    console.warn('[imageOptimize] Failed, using original:', error.message);
    return {
      buffer: inputBuffer,
      contentType: 'image/jpeg',
      optimized: false,
      originalBytes,
      outputBytes: originalBytes,
    };
  }
};

module.exports = { optimizeImage };
