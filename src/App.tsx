import type { ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useSession } from "./hooks/useSession"
import { supabase } from "./lib/supabase"
import { Login } from "./pages/Login"
import { LanguageSwitcher } from "./components/LanguageSwitcher"

const queryClient = new QueryClient()

function Protected({ children }: { children: ReactNode }) {
  const session = useSession()
  if (session === undefined) return null
  return session ? children : <Navigate to="/login" replace />
}

function Layout() {
  const { t } = useTranslation()
  return (
    <>
      <nav>
        <span>{t("nav.wardrobe")}</span> <span>{t("nav.outfit")}</span>{" "}
        <span>{t("nav.collections")}</span> <span>{t("nav.wishlist")}</span>
        <LanguageSwitcher />
        <button onClick={() => supabase.auth.signOut()}>
          {t("nav.logout")}
        </button>
      </nav>
      <main>
        <h1>{t("nav.wardrobe")}</h1>
      </main>
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
