import { useKeyboard } from './useKeyboard'
import { ALL_SHORTCUTS, SHORTCUT_GROUPS } from './shortcuts'
import { Kbd } from '@/components/ui/kbd'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Info } from 'lucide-react'

export function ShortcutsHelpModal() {
  const { helpModalOpen, setHelpModalOpen, setHelpCustomizing, disabledShortcuts, toggleShortcut } = useKeyboard()

  const grouped = SHORTCUT_GROUPS.map((group) => ({
    label: group,
    shortcuts: ALL_SHORTCUTS.filter((s) => s.group === group),
  })).filter((g) => g.shortcuts.length > 0)

  return (
    <Dialog open={helpModalOpen} onOpenChange={(open) => { setHelpModalOpen(open); if (!open) setHelpCustomizing(false) }}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription className="mt-0.5">
            Toggle shortcuts on or off. Changes apply immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {grouped.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {group.shortcuts.map((s) => {
                  const enabled = !disabledShortcuts.has(s.id)
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-1.5 px-1.5 rounded-md hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`text-sm ${!enabled ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {s.label}
                        </span>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer shrink-0">
                                <Info className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-56 text-xs">
                              {s.description}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-1">
                          {s.keys.map((k, j) => (
                            <span key={j} className="flex items-center gap-0.5">
                              {j > 0 && (
                                <span className="text-[10px] text-muted-foreground mx-0.5">then</span>
                              )}
                              <Kbd className={`inline-flex min-w-[22px] h-[22px] text-[11px] ${!enabled ? 'opacity-40' : ''}`}>{k}</Kbd>
                            </span>
                          ))}
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => toggleShortcut(s.id, checked)}
                          className="scale-75 origin-right"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
