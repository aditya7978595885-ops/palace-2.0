const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export interface ProcessedImageResult {
  dataUrl: string;
  aspectRatio: number;
  width: number;
  height: number;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase()) && !ALLOWED_EXTENSIONS.test(file.name)) {
    return 'Please choose a JPG, JPEG, PNG, or WEBP photograph.';
  }
  if (file.size > 25 * 1024 * 1024) {
    return 'Image file is too large (maximum 25 MB).';
  }
  return null;
}

export function processUploadedImage(
  file: File,
  maxDimension = 1400,
  quality = 0.88
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      reject(new Error(validationError));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('The selected file is not a valid image.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve({
          dataUrl,
          aspectRatio: width / Math.max(height, 1),
          width,
          height,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read local file.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
