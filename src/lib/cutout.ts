import { removeBackground } from "@imgly/background-removal"

async function toPng(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1500 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("Kunde inte konvertera bilden")),
      "image/png",
    ),
  )
}

export async function cutOut(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<Blob> {
  const png = await toPng(file)
  const blob = await removeBackground(png, {
    progress: (_key: string, current: number, total: number) =>
      onProgress?.(current / total),
  })
  return trimTransparent(blob)
}

export async function trimTransparent(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob)
  const src = document.createElement("canvas")
  src.width = bmp.width
  src.height = bmp.height
  const ctx = src.getContext("2d")!
  ctx.drawImage(bmp, 0, 0)
  const { data, width, height } = ctx.getImageData(0, 0, src.width, src.height)

  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return blob // helt genomskinlig, lämna oförändrad

  const w = maxX - minX + 1
  const h = maxY - minY + 1
  const out = document.createElement("canvas")
  out.width = w
  out.height = h
  out.getContext("2d")!.drawImage(src, minX, minY, w, h, 0, 0, w, h)
  return new Promise((resolve) => out.toBlob((b) => resolve(b!), "image/png"))
}
