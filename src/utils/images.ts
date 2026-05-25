type ImageToDataUrlOptions = {
  maxInputBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

const DEFAULT_MAX_INPUT_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Không thể đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('File ảnh không hợp lệ hoặc không thể hiển thị.'));
    image.src = src;
  });
}

export async function imageFileToDataUrl(file: File, options: ImageToDataUrlOptions = {}): Promise<string> {
  const {
    maxInputBytes = DEFAULT_MAX_INPUT_BYTES,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Vui lòng chọn file ảnh JPG, PNG hoặc WEBP.');
  }

  if (file.size > maxInputBytes) {
    const maxMb = Math.round(maxInputBytes / 1024 / 1024);
    throw new Error(`Ảnh vượt quá ${maxMb}MB. Vui lòng chọn ảnh nhỏ hơn.`);
  }

  // SVG/GIF can lose content when drawn to canvas, so keep the original data URL.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return readAsDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return readAsDataUrl(file);

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
