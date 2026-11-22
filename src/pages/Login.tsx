// src/pages/Login.tsx
import { type FormEvent, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabase"

export function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  if (sent) return <p>{t("login.sent")}</p>
  return (
    <form onSubmit={submit}>
      <h1>{t("login.title")}</h1>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("login.email")}
      />
      <button type="submit">{t("login.send")}</button>
      {error && <p>{error}</p>}
    </form>
  )
}
