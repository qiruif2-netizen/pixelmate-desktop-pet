export interface PixelateOptions {
  size: number;
  paletteSize: number;
  removeNearWhite: boolean;
}

type Rgb = [number, number, number];

export function quantizeChannel(value: number, levels: number): number {
  if (levels <= 1) return 0;
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

export function paletteLevels(paletteSize: number): number {
  return Math.max(2, Math.round(Math.cbrt(Math.max(8, paletteSize))));
}

interface ColorBox {
  colors: Rgb[];
  range: number;
  channel: 0 | 1 | 2;
}

function describeBox(colors: Rgb[]): ColorBox {
  const min: Rgb = [255, 255, 255];
  const max: Rgb = [0, 0, 0];
  for (const color of colors) {
    for (let channel = 0; channel < 3; channel += 1) {
      min[channel] = Math.min(min[channel], color[channel]);
      max[channel] = Math.max(max[channel], color[channel]);
    }
  }
  const ranges = max.map((value, channel) => value - min[channel]);
  const channel = ranges.indexOf(Math.max(...ranges)) as 0 | 1 | 2;
  return { colors, range: ranges[channel], channel };
}

/**
 * Median-cut palette extraction. Every output color is averaged from colors
 * present in the source image, so quantization cannot invent cyan/purple hues
 * that were not in the photograph.
 */
export function extractPalette(data: Uint8ClampedArray, requestedSize: number): Rgb[] {
  const colors: Rgb[] = [];
  const pixelCount = data.length / 4;
  const sampleStep = Math.max(1, Math.floor(pixelCount / 12_000));
  for (let pixel = 0; pixel < pixelCount; pixel += sampleStep) {
    const offset = pixel * 4;
    if (data[offset + 3] < 32) continue;
    colors.push([data[offset], data[offset + 1], data[offset + 2]]);
  }
  if (!colors.length) return [[0, 0, 0]];

  const targetSize = Math.max(2, Math.min(64, requestedSize));
  const boxes: ColorBox[] = [describeBox(colors)];
  while (boxes.length < targetSize) {
    boxes.sort((a, b) => b.range * b.colors.length - a.range * a.colors.length);
    const candidate = boxes.shift();
    if (!candidate || candidate.colors.length < 2 || candidate.range === 0) {
      if (candidate) boxes.unshift(candidate);
      break;
    }
    candidate.colors.sort((a, b) => a[candidate.channel] - b[candidate.channel]);
    const middle = Math.floor(candidate.colors.length / 2);
    boxes.push(describeBox(candidate.colors.slice(0, middle)));
    boxes.push(describeBox(candidate.colors.slice(middle)));
  }

  return boxes.map(({ colors: boxColors }) => {
    const sum = boxColors.reduce<Rgb>(
      (total, color) => [total[0] + color[0], total[1] + color[1], total[2] + color[2]],
      [0, 0, 0],
    );
    return sum.map((value) => Math.round(value / boxColors.length)) as Rgb;
  });
}

export function nearestPaletteColor(red: number, green: number, blue: number, palette: Rgb[]): Rgb {
  let nearest = palette[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const color of palette) {
    // Red-mean color distance better matches human vision than plain RGB.
    const redMean = (red + color[0]) / 2;
    const deltaRed = red - color[0];
    const deltaGreen = green - color[1];
    const deltaBlue = blue - color[2];
    const distance =
      (2 + redMean / 256) * deltaRed * deltaRed +
      4 * deltaGreen * deltaGreen +
      (2 + (255 - redMean) / 256) * deltaBlue * deltaBlue;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = color;
    }
  }
  return nearest;
}

/** Remove only background-like pixels connected to an image edge. */
export function edgeBackgroundMask(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height);
  const queued = new Uint8Array(width * height);
  const edgeSamples: Rgb[] = [];
  const sample = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    if (data[offset + 3] > 16) edgeSamples.push([data[offset], data[offset + 1], data[offset + 2]]);
  };
  for (let x = 0; x < width; x += 1) { sample(x, 0); sample(x, height - 1); }
  for (let y = 1; y < height - 1; y += 1) { sample(0, y); sample(width - 1, y); }
  if (!edgeSamples.length) return mask;

  // Median edge color is resistant to the subject touching one image edge.
  const background = ([0, 1, 2] as const).map((channel) => {
    const values = edgeSamples.map((color) => color[channel]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  }) as unknown as Rgb;
  const toleranceSquared = 46 * 46;
  const resemblesBackground = (index: number) => {
    const offset = index * 4;
    if (data[offset + 3] < 16) return true;
    const dr = data[offset] - background[0];
    const dg = data[offset + 1] - background[1];
    const db = data[offset + 2] - background[2];
    return dr * dr + dg * dg + db * db <= toleranceSquared;
  };

  const queue: number[] = [];
  const enqueue = (index: number) => {
    if (!queued[index] && resemblesBackground(index)) {
      queued[index] = 1;
      queue.push(index);
    }
  };
  for (let x = 0; x < width; x += 1) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y += 1) { enqueue(y * width); enqueue(y * width + width - 1); }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    mask[index] = 1;
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index < width * (height - 1)) enqueue(index + width);
  }
  return mask;
}

export async function pixelateImage(
  source: string,
  options: PixelateOptions,
): Promise<string> {
  const image = await loadImage(source);
  const maxSide = Math.max(16, Math.min(256, options.size));
  const ratio = Math.min(maxSide / image.naturalWidth, maxSide / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("当前环境不支持 Canvas 图片处理");

  context.imageSmoothingEnabled = true;
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  const backgroundMask = options.removeNearWhite
    ? edgeBackgroundMask(pixels.data, width, height)
    : new Uint8Array(width * height);

  for (let pixel = 0; pixel < backgroundMask.length; pixel += 1) {
    if (backgroundMask[pixel]) pixels.data[pixel * 4 + 3] = 0;
  }
  const palette = extractPalette(pixels.data, options.paletteSize);

  for (let i = 0; i < pixels.data.length; i += 4) {
    if (pixels.data[i + 3] < 32) continue;
    const nearest = nearestPaletteColor(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2], palette);
    pixels.data[i] = nearest[0];
    pixels.data[i + 1] = nearest[1];
    pixels.data[i + 2] = nearest[2];
  }

  context.putImageData(pixels, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片读取失败，请更换 PNG、JPG 或 WebP 文件"));
    image.src = source;
  });
}

export function readImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("请选择图片文件"));
  if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error("图片不能超过 8MB"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
