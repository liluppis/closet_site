import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import i18n from "i18next"
import App from "./App.tsx"

function setLang(lang: "sv" | "en") {
  i18n.changeLanguage(lang)
  localStorage.setItem("lang", lang)
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
