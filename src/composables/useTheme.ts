import { ref } from "vue";

export type ThemeMode = "light" | "dark";

function initialTheme(): ThemeMode {
  const stored = window.localStorage.getItem("matrix-calculator-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const theme = ref<ThemeMode>(initialTheme());

  function applyTheme(): void {
    document.documentElement.classList.toggle("app-dark", theme.value === "dark");
    document.documentElement.style.colorScheme = theme.value;
  }

  function toggleTheme(): void {
    theme.value = theme.value === "light" ? "dark" : "light";
    window.localStorage.setItem("matrix-calculator-theme", theme.value);
    applyTheme();
  }

  applyTheme();
  return { theme, toggleTheme };
}
