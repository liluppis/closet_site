import { supabase } from "./supabase"
import type { Item } from "../hooks/useItems"

export type NewItem = Pick<
  Item,
  | "name"
  | "category"
  | "brand"
  | "store"
  | "product_url"
  | "color"
  | "season"
  | "notes"
>

export async function createItem(
  input: NewItem,
  original: File,
  cutout?: Blob,
) {
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user!.id
  const id = crypto.randomUUID()
  const ext = original.name.split(".").pop() ?? "png"
  const original_path = `${uid}/${id}.${ext}`
  let cutout_path: string | null = null

  const up = await supabase.storage
    .from("originals")
    .upload(original_path, original)
  if (up.error) throw up.error

  if (cutout) {
    cutout_path = `${uid}/${id}.png`
    const c = await supabase.storage
      .from("cutouts")
      .upload(cutout_path, cutout, { contentType: "image/png" })
    if (c.error) throw c.error
  }

  const { error } = await supabase
    .from("items")
    .insert({ id, ...input, original_path, cutout_path })
  if (error) throw error
  return id
}
