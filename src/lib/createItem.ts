// src/lib/createItem.ts
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

export async function createItem(input: NewItem, file: File) {
  const { data: auth } = await supabase.auth.getUser()
  const id = crypto.randomUUID()
  const ext = file.name.split(".").pop() ?? "png"
  const original_path = `${auth.user!.id}/${id}.${ext}`

  const up = await supabase.storage
    .from("originals")
    .upload(original_path, file)
  if (up.error) throw up.error

  const { error } = await supabase
    .from("items")
    .insert({ id, ...input, original_path })
  if (error) throw error
  return id
}
