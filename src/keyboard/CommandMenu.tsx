import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { useKeyboard } from './useKeyboard'
import { useMatches } from '@/hooks/useQueries'
import { Kbd } from '@/components/ui/kbd'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Home,
  Swords,
  Trophy,
  User,
  Search,
  ArrowRight,
} from 'lucide-react'
import type { ApiMatch } from '@/types/api'

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Matches', path: '/matches', icon: Swords },
  { label: 'Season Board', path: '/leaderboard', icon: Trophy },
  { label: 'Profile', path: '/profile', icon: User },
] as const

const GROUP_CLS = '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground'
const ITEM_CLS = 'flex items-center gap-3 rounded-md px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground'

function matchLabel(m: ApiMatch): string {
  const t1 = m.team1?.teamSName ?? m.team1?.teamName ?? '?'
  const t2 = m.team2?.teamSName ?? m.team2?.teamName ?? '?'
  return `${t1} vs ${t2}`
}

export function CommandMenu() {
  const { commandMenuOpen, setCommandMenuOpen, setHelpModalOpen } = useKeyboard()
  const navigate = useNavigate()
  const { data: matches = [] } = useMatches()

  function go(path: string) {
    navigate(path)
    setCommandMenuOpen(false)
  }

  return (
    <Dialog open={commandMenuOpen} onOpenChange={setCommandMenuOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <Command className="flex flex-col bg-background" loop>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className={GROUP_CLS}>
              {NAV_ITEMS.map((item) => (
                <Command.Item key={item.path} value={`nav ${item.label}`} onSelect={() => go(item.path)} className={ITEM_CLS}>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>

            {matches.length > 0 && (
              <Command.Group heading="Matches" className={GROUP_CLS}>
                {matches.map((m: ApiMatch) => (
                  <Command.Item key={m.matchId} value={`match ${matchLabel(m)} ${m.matchDesc ?? ''}`} onSelect={() => go(`/matches/${m.matchId}`)} className={ITEM_CLS}>
                    <Swords className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{matchLabel(m)}</span>
                    <span className="text-xs text-muted-foreground">{m.matchDesc ?? m.state ?? ''}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className={GROUP_CLS}>
              <Command.Item
                value="keyboard shortcuts help"
                onSelect={() => { setCommandMenuOpen(false); setHelpModalOpen(true) }}
                className={ITEM_CLS}
              >
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                Keyboard shortcuts
                <Kbd className="ml-auto inline-flex">?</Kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer hint */}
          <div className="border-t px-3 py-2 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Kbd className="inline-flex">↑↓</Kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd className="inline-flex">↵</Kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <Kbd className="inline-flex">esc</Kbd>
              close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
