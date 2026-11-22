import type { ReactNode } from "react"
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
} from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useSession } from "./hooks/useSession"
import { supabase } from "./lib/supabase"
import { Login } from "./pages/Login"
import { LanguageSwitcher } from "./components/LanguageSwitcher"
import { Wardrobe } from "./pages/Wardrobe"
import { ItemPage } from "./pages/ItemPage"

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
        <NavLink to="/">{t("nav.wardrobe")}</NavLink>{" "}
        <span>{t("nav.outfit")}</span> <span>{t("nav.collections")}</span>{" "}
        <span>{t("nav.wishlist")}</span>
        <LanguageSwitcher />
        <button onClick={() => supabase.auth.signOut()}>
          {t("nav.logout")}
        </button>
      </nav>
      <main>
        <Outlet />
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
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route path="/" element={<Wardrobe />} />
            <Route path="/items/:id" element={<ItemPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
