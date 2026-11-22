import { useTranslation } from "react-i18next"

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function setLang(lang: "sv" | "en") {
    i18n.changeLanguage(lang)
    localStorage.setItem("lang", lang)
  }

  return (
    <div>
      <button onClick={() => setLang("sv")}>SV</button>
      <button onClick={() => setLang("en")}>EN</button>
    </div>
  )
}
