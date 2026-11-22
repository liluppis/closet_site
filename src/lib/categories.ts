export const CATEGORIES = [
  "jackets",
  "outerwear",
  "shoes",
  "bottoms",
  "tops",
  "layers",
  "dresses",
  "bags",
  "jewelry",
] as const
export type Category = (typeof CATEGORIES)[number]
