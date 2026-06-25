const DEFAULT_MAX_DIMENSION = 512;
const DEFAULT_TARGET_BYTES = 380_000;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this image. Try a JPG, PNG, or WEBP file."));
    };
    image.src = objectUrl;
  });
}

function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress image."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not prepare image upload."));
    reader.readAsDataURL(blob);
  });
}

async function renderWebpBlob(
  image: HTMLImageElement,
  maxDimension: number,
  quality: number
): Promise<Blob> {
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not process image.");
  }

  context.drawImage(image, 0, 0, width, height);
  return canvasToWebpBlob(canvas, quality);
}

/** Compresses any supported photo to a WEBP data URL suitable for avatar storage. */
export async function compressImageToWebpDataUrl(
  file: File,
  options?: {
    maxDimension?: number;
    targetBytes?: number;
  }
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const image = await loadImageFromFile(file);
  const targetBytes = options?.targetBytes ?? DEFAULT_TARGET_BYTES;
  let maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  let quality = 0.9;
  let blob = await renderWebpBlob(image, maxDimension, quality);

  while (blob.size > targetBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await renderWebpBlob(image, maxDimension, quality);
  }

  while (blob.size > targetBytes && maxDimension > 192) {
    maxDimension = Math.round(maxDimension * 0.85);
    quality = 0.82;
    blob = await renderWebpBlob(image, maxDimension, quality);

    while (blob.size > targetBytes && quality > 0.45) {
      quality -= 0.08;
      blob = await renderWebpBlob(image, maxDimension, quality);
    }
  }

  if (blob.size > targetBytes) {
    throw new Error("Could not compress this image enough. Try a different photo.");
  }

  return blobToDataUrl(blob);
}
