import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

/** Switches between light and dark, starting from whichever is showing. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const dark =
    theme === 'dark' ||
    (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={dark ? 'Light theme' : 'Dark theme'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
