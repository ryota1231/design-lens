export function calculateResizeDimensions(args: {
  width: number;
  height: number;
  maxLongSide: number;
}): { width: number; height: number } {
  const { width, height, maxLongSide } = args;
  if (width <= maxLongSide && height <= maxLongSide) {
    return { width, height };
  }

  const ratio = width >= height ? maxLongSide / width : maxLongSide / height;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function compressImage(args: {
  source: Blob;
  maxLongSide: number;
  quality?: number;
}): Promise<Blob> {
  const { source, maxLongSide, quality = 0.85 } = args;

  const objectUrl = URL.createObjectURL(source);
  try {
    const img = await loadImage(objectUrl);
    const dim = calculateResizeDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
      maxLongSide,
    });

    const canvas = document.createElement('canvas');
    canvas.width = dim.width;
    canvas.height = dim.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context が取得できません');

    ctx.drawImage(img, 0, 0, dim.width, dim.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob が null を返しました'))),
        'image/jpeg',
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像読み込み失敗'));
    img.src = src;
  });
}
