import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "dark" | "light" | "system"
export type AccentColor = "blue" | "cyan" | "green" | "purple" | "amber"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultAccent?: AccentColor
  storageKey?: string
  storageKeyAccent?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  accent: "blue",
  setAccent: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultAccent = "blue",
  storageKey = "vite-ui-theme",
  storageKeyAccent = "vite-ui-accent",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const [accent, setAccentState] = useState<AccentColor>(
    () => (localStorage.getItem(storageKeyAccent) as AccentColor) || defaultAccent
  )

  // Apply dark/light class to root
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  // Apply data-accent attribute to root
  useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute("data-accent", accent)
  }, [accent])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
    accent,
    setAccent: (newAccent: AccentColor) => {
      localStorage.setItem(storageKeyAccent, newAccent)
      setAccentState(newAccent)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
