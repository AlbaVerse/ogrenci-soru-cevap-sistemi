import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/theme-context'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
  const { resolvedTheme, toggle } = useTheme()
  const dark = resolvedTheme === 'dark'
  const Icon = dark ? Sun : Moon
  return (
    <Button variant="ghost" iconOnly onClick={toggle} aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}>
      <Icon className="size-5" aria-hidden="true" />
    </Button>
  )
}
