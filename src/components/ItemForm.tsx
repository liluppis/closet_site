import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { CATEGORIES, type Category } from "../lib/categories"
import { createItem } from "../lib/createItem"
import { cutOut, trimTransparent } from "../lib/cutout"

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

  // nytt för friläggning
  const [mode, setMode] = useState<"auto" | "own">("auto")
  const [cutout, setCutout] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)
  const [useOriginal, setUseOriginal] = useState(false)
  const [cutoutError, setCutoutError] = useState<string | null>(null)

  const previewUrl = useMemo(
    () => (cutout ? URL.createObjectURL(cutout) : null),
    [cutout],
  )
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  async function handleFile(f: File | null, m: "auto" | "own" = mode) {
    setFile(f)
    setCutout(null)
    setUseOriginal(false)
    setCutoutError(null)
    if (!f) return
    setBusy(true)
    try {
      setCutout(m === "auto" ? await cutOut(f) : await trimTransparent(f))
    } catch (e) {
      setCutoutError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

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
        useOriginal ? undefined : (cutout ?? undefined),
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
      <label>
        <input
          type="radio"
          checked={mode === "auto"}
          onChange={() => {
            setMode("auto")
            if (file) handleFile(file, "auto")
          }}
        />
        {t("form.auto")}
      </label>
      <label>
        <input
          type="radio"
          checked={mode === "own"}
          onChange={() => {
            setMode("own")
            if (file) handleFile(file, "own")
          }}
        />
        {t("form.own")}
      </label>
      <input
        type="file"
        accept="image/*"
        required
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {busy && <p>{t("form.working")}</p>}
      {cutoutError && <p>{cutoutError}</p>}
      {previewUrl && (
        <>
          <div
            style={{
              background: "#ff00ff",
              padding: 8,
              display: "inline-block",
            }}
          >
            <img src={previewUrl} alt="" style={{ maxWidth: 240 }} />
          </div>
          <label>
            <input
              type="checkbox"
              checked={useOriginal}
              onChange={(e) => setUseOriginal(e.target.checked)}
            />
            {t("form.useOriginal")}
          </label>
        </>
      )}

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
      <button type="submit" disabled={mutation.isPending || busy}>
        {mutation.isPending ? t("form.saving") : t("form.save")}
      </button>
      {mutation.error && <p>{mutation.error.message}</p>}
    </form>
  )
}
