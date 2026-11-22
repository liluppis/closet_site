import { useQuery } from "@tanstack/react-query"
import { supabase } from "../lib/supabase"
import type { Category } from "../lib/categories"

export type Item = {
  id: string
  name: string
  category: Category
  brand: string | null
  store: string | null
  product_url: string | null
  color: string | null
  season: string | null
  notes: string | null
  original_path: string | null
  cutout_path: string | null
  created_at: string
  url?: string
}

async function sign(bucket: string, paths: string[]) {
  if (!paths.length) return new Map<string, string>()
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, 3600)
  return new Map(
    (data ?? []).flatMap((d) =>
      d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [],
    ),
  )
}

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    staleTime: 30 * 60 * 1000, // länkarna går ut efter 60 minuter
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      const rows = data as Item[]
      const cut = await sign(
        "cutouts",
        rows.flatMap((i) => (i.cutout_path ? [i.cutout_path] : [])),
      )
      const orig = await sign(
        "originals",
        rows.flatMap((i) =>
          !i.cutout_path && i.original_path ? [i.original_path] : [],
        ),
      )
      return rows.map((i) => ({
        ...i,
        url: i.cutout_path
          ? cut.get(i.cutout_path)
          : i.original_path
            ? orig.get(i.original_path)
            : undefined,
      }))
    },
  })
}
