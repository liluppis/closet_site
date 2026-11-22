import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useItems } from "../hooks/useItems"
import { CATEGORIES, type Category } from "../lib/categories"
import { ItemForm } from "../components/ItemForm"

export function Wardrobe() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const category = (params.get("category") ?? "tops") as Category
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const { data: items = [], error } = useItems()

  const shown = items.filter(
    (i) =>
      i.category === category &&
      `${i.name} ${i.brand ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <>
      <nav>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            aria-pressed={c === category}
            onClick={() => setParams({ category: c })}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </nav>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("wardrobe.search")}
      />
      <button onClick={() => setAdding(!adding)}>{t("wardrobe.add")}</button>
      {adding && (
        <ItemForm defaultCategory={category} onDone={() => setAdding(false)} />
      )}
      {error && <p>{error.message}</p>}
      {shown.length === 0 && <p>{t("wardrobe.empty")}</p>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {shown.map((i) => (
          <Link key={i.id} to={`/items/${i.id}`}>
            <img
              src={i.url}
              alt={i.name}
              loading="lazy"
              style={{ width: "100%" }}
            />
          </Link>
        ))}
      </div>
    </>
  )
}
