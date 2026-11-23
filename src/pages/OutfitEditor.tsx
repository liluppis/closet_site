import { useEffect, useRef, useState } from "react"
import {
  Stage,
  Layer,
  Rect,
  Image as KImage,
  Text,
  Transformer,
} from "react-konva"
import type Konva from "konva"
import useImage from "use-image"
import { useItems } from "../hooks/useItems"
import { useTranslation } from "react-i18next"
import { CATEGORIES, type Category } from "../lib/categories"

const FORMATS = {
  portrait: { w: 720, h: 1280 },
  square: { w: 1080, h: 1080 },
} as const
type Format = keyof typeof FORMATS
const DISPLAY_W = 360
const BASE_W = 300

type Placed = {
  uid: string
  url: string
  x: number
  y: number
  scale: number
  rotation: number
}

type Patch = Partial<Pick<Placed, "x" | "y" | "scale" | "rotation">>

function PlacedImage({
  p,
  onSelect,
  onChange,
}: {
  p: Placed
  onSelect: () => void
  onChange: (patch: Patch) => void
}) {
  const [img] = useImage(p.url, "anonymous")
  if (!img) return null
  const h = (img.height / img.width) * BASE_W
  return (
    <KImage
      id={p.uid}
      image={img}
      x={p.x}
      y={p.y}
      width={BASE_W}
      height={h}
      scaleX={p.scale}
      scaleY={p.scale}
      rotation={p.rotation}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const n = e.target
        onChange({
          x: n.x(),
          y: n.y(),
          scale: n.scaleX(),
          rotation: n.rotation(),
        })
      }}
    />
  )
}

export default function OutfitEditor() {
  const { data: items = [] } = useItems()
  const { t } = useTranslation()
  const [cat, setCat] = useState<Category | "all">("all")
  const visible = items.filter((i) => cat === "all" || i.category === cat)
  const [placed, setPlaced] = useState<Placed[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [past, setPast] = useState<Placed[][]>([])
  const [future, setFuture] = useState<Placed[][]>([])
  const [format, setFormat] = useState<Format>("portrait")
  const [title, setTitle] = useState("")
  const { w: W, h: H } = FORMATS[format]
  const S = DISPLAY_W / W
  const trRef = useRef<Konva.Transformer>(null)

  // Koppla Transformern till det markerade plagget
  useEffect(() => {
    const tr = trRef.current
    if (!tr) return
    const node = selectedId
      ? tr.getStage()?.findOne("#" + selectedId)
      : undefined
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, placed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault()
        redo()
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        remove()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  // Alla ändringar går via commit, som sparar en historikpost
  const commit = (next: Placed[]) => {
    setPast((p) => [...p, placed])
    setFuture([])
    setPlaced(next)
  }

  const undo = () => {
    if (past.length === 0) return
    setFuture((f) => [placed, ...f])
    setPlaced(past[past.length - 1])
    setPast(past.slice(0, -1))
    setSelectedId(null)
  }

  const redo = () => {
    if (future.length === 0) return
    setPast((p) => [...p, placed])
    setPlaced(future[0])
    setFuture(future.slice(1))
    setSelectedId(null)
  }

  const add = (url: string) => {
    const uid = crypto.randomUUID()
    commit([...placed, { uid, url, x: 200, y: 400, scale: 1, rotation: 0 }])
    setSelectedId(uid)
  }

  const update = (uid: string, patch: Patch) =>
    commit(placed.map((p) => (p.uid === uid ? { ...p, ...patch } : p)))

  const remove = () => {
    commit(placed.filter((p) => p.uid !== selectedId))
    setSelectedId(null)
  }

  const move = (dir: 1 | -1) => {
    const i = placed.findIndex((p) => p.uid === selectedId)
    const j = i + dir
    if (i < 0 || j < 0 || j >= placed.length) return
    const next = [...placed]
    ;[next[i], next[j]] = [next[j], next[i]]
    commit(next)
  }
  const deselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target.name() === "bg") setSelectedId(null)
  }

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
          />
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
          >
            <option value="portrait">Porträtt</option>
            <option value="square">Kvadrat</option>
          </select>
        </div>
        <Stage
          width={W * S}
          height={H * S}
          scaleX={S}
          scaleY={S}
          onMouseDown={deselect}
          onTouchStart={deselect}
        >
          <Layer>
            <Rect name="bg" width={W} height={H} fill="#f5f0e8" />
            <Text
              text={title}
              x={0}
              y={48}
              width={W}
              align="center"
              fontSize={56}
              fontFamily="Georgia, serif"
              fill="#3a342c"
              listening={false}
            />
            {placed.map((p) => (
              <PlacedImage
                key={p.uid}
                p={p}
                onSelect={() => setSelectedId(p.uid)}
                onChange={(patch) => update(p.uid, patch)}
              />
            ))}
            <Transformer
              ref={trRef}
              keepRatio
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
            />
          </Layer>
        </Stage>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button disabled={past.length === 0} onClick={undo}>
            Ångra
          </button>
          <button disabled={future.length === 0} onClick={redo}>
            Gör om
          </button>
          <button disabled={!selectedId} onClick={() => move(1)}>
            Fram
          </button>
          <button disabled={!selectedId} onClick={() => move(-1)}>
            Bak
          </button>
          <button disabled={!selectedId} onClick={remove}>
            Ta bort
          </button>
        </div>
      </div>

      <div style={{ width: 300 }}>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}
        >
          <button
            onClick={() => setCat("all")}
            style={{ fontWeight: cat === "all" ? "bold" : "normal" }}
          >
            {t("wardrobe.all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{ fontWeight: cat === c ? "bold" : "normal" }}
            >
              {t(`categories.${c}`)}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 90px)",
            gap: 8,
            alignContent: "start",
          }}
        >
          {visible.map(
            (i) =>
              i.url && (
                <img
                  key={i.id}
                  src={i.url}
                  onClick={() => add(i.url!)}
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: "contain",
                    background: "#f5f0e8",
                    cursor: "pointer",
                  }}
                />
              ),
          )}
        </div>
      </div>
    </div>
  )
}
