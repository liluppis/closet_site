import { useState, type ChangeEvent, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { CATEGORIES, type Category } from "../lib/categories"
import { createItem } from "../lib/createItem"

const FIELDS = [
  "name",
  "brand",
  "store",
  "product_url",
  "color",
  "season",
  "notes",
] as const

export function ItemForm({
  defaultCategory,
  onDone,
}: {
  defaultCategory: Category
  onDone: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<Category>(defaultCategory)
  const [fields, setFields] = useState({
    name: "",
    brand: "",
    store: "",
    product_url: "",
    color: "",
    season: "",
    notes: "",
  })

  const set =
    (k: (typeof FIELDS)[number]) => (e: ChangeEvent<HTMLInputElement>) =>
      setFields({ ...fields, [k]: e.target.value })

  const mutation = useMutation({
    mutationFn: () =>
      createItem(
        {
          name: fields.name,
          category,
          brand: fields.brand || null,
          store: fields.store || null,
          product_url: fields.product_url || null,
          color: fields.color || null,
          season: fields.season || null,
          notes: fields.notes || null,
        },
        file!,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      onDone()
    },
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (file) mutation.mutate()
  }

  return (
    <form onSubmit={submit}>
      <input
        type="file"
        accept="image/*"
        required
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
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
          onChange={set(k)}
          placeholder={t(`form.${k}`)}
        />
      ))}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? t("form.saving") : t("form.save")}
      </button>
      {mutation.error && <p>{mutation.error.message}</p>}
    </form>
  )
}
