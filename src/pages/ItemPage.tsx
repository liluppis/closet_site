import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useItems, type Item } from "../hooks/useItems"
import { supabase } from "../lib/supabase"
import { CATEGORIES, type Category } from "../lib/categories"

const FIELDS = [
  "name",
  "brand",
  "store",
  "product_url",
  "color",
  "season",
  "notes",
] as const

export function ItemPage() {
  const { id } = useParams()
  const { data: items, isLoading } = useItems()
  const item = items?.find((i) => i.id === id)
  if (isLoading) return null
  if (!item) return <Link to="/">←</Link>
  return <ItemEditor item={item} />
}

function ItemEditor({ item }: { item: Item }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [category, setCategory] = useState<Category>(item.category)
  const [fields, setFields] = useState({
    name: item.name,
    brand: item.brand ?? "",
    store: item.store ?? "",
    product_url: item.product_url ?? "",
    color: item.color ?? "",
    season: item.season ?? "",
    notes: item.notes ?? "",
  })

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("items")
        .update({
          name: fields.name,
          category,
          brand: fields.brand || null,
          store: fields.store || null,
          product_url: fields.product_url || null,
          color: fields.color || null,
          season: fields.season || null,
          notes: fields.notes || null,
        })
        .eq("id", item.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  })

  const remove = useMutation({
    mutationFn: async () => {
      if (item.original_path)
        await supabase.storage.from("originals").remove([item.original_path])
      if (item.cutout_path)
        await supabase.storage.from("cutouts").remove([item.cutout_path])
      const { error } = await supabase.from("items").delete().eq("id", item.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      navigate(`/?category=${item.category}`)
    },
  })

  return (
    <>
      <Link to={`/?category=${item.category}`}>{t("item.back")}</Link>
      <div>
        <img
          src={item.url}
          alt={item.name}
          style={{ maxWidth: 320, width: "100%" }}
        />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </select>
        {FIELDS.map((k) => (
          <input
            key={k}
            required={k === "name"}
            value={fields[k]}
            onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
            placeholder={t(`form.${k}`)}
          />
        ))}
        <button type="submit" disabled={save.isPending}>
          {save.isPending ? t("item.saving") : t("item.save")}
        </button>
      </form>
      <button
        onClick={() => {
          if (window.confirm(t("item.confirmDelete"))) remove.mutate()
        }}
      >
        {t("item.delete")}
      </button>
      {(save.error || remove.error) && (
        <p>{(save.error ?? remove.error)!.message}</p>
      )}
    </>
  )
}
