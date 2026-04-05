import { useRef, useState } from 'react'
import type { ApiPlayer } from '@/types/api'
import { playerKey, normalizeRole } from '@/fantasy/dream11Rules'
import { playerImageUrl } from '@/api/client'
import { Button } from '@/components/ui/button'
import { StatusBanner } from '../components/StatusBanner'
import { Loader2, Check, Minus } from 'lucide-react'

interface Step2Props {
  selectedList: ApiPlayer[]
  captainId: string | null
  viceCaptainId: string | null
  captainViceErrors: string[]
  onSelectCaptain: (key: string) => void
  onSelectViceCaptain: (key: string) => void
  onRemove: (key: string) => void
  onSave: () => void
  canSave: boolean
  saving: boolean
  success: boolean
}

export function Step2CaptainPicker({
  selectedList, captainId, viceCaptainId, captainViceErrors,
  onSelectCaptain, onSelectViceCaptain, onRemove, onSave, canSave, saving, success,
}: Step2Props) {
  const [removing, setRemoving] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleRemove = (pk: string) => {
    setRemoving(pk)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      onRemove(pk)
      setRemoving(null)
    }, 350)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status */}
      <StatusBanner
        apiError={null}
        hint={null}
        validationError={null}
        captainViceError={captainViceErrors.length > 0 ? captainViceErrors[0] : null}
      />

      {/* Instruction */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <p className="text-sm text-muted-foreground">
          Assign Captain (2x) and Vice-Captain (1.5x) for your squad.
        </p>
      </div>

      {/* Player rows with C / VC chips */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 space-y-2">
        {selectedList.map((p) => {
          const pk = playerKey(p)
          const isCap = captainId === pk
          const isVc = viceCaptainId === pk
          const role = normalizeRole(p.type)
          const isRemoving = removing === pk

          return (
            <div
              key={pk}
              className="transition-all duration-300 ease-in-out origin-top pt-2 pl-2"
              style={{
                opacity: isRemoving ? 0 : 1,
                transform: isRemoving ? 'scaleY(0) translateX(60px)' : 'scaleY(1) translateX(0)',
                maxHeight: isRemoving ? 0 : 200,
                marginBottom: isRemoving ? 0 : undefined,
              }}
            >
              <div
                className={`relative flex items-center gap-3 w-full p-3.5 rounded-2xl border-2 ${
                  isCap
                    ? 'border-blue-500 bg-blue-500/8'
                    : isVc
                    ? 'border-violet-500 bg-violet-500/8'
                    : 'border-border bg-card'
                }`}
              >
                {/* iOS minus circle — top-left */}
                <button
                  type="button"
                  onClick={() => handleRemove(pk)}
                  className="absolute -top-1.5 -left-1.5 z-10 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md cursor-pointer active:scale-90 transition-transform"
                >
                  <Minus className="h-3.5 w-3.5 stroke-3" />
                </button>

                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`h-12 w-12 rounded-full overflow-hidden bg-muted ${
                      isCap ? 'ring-[2.5px] ring-blue-500' : isVc ? 'ring-[2.5px] ring-violet-500' : 'ring-1 ring-border'
                    }`}
                  >
                    <img
                      src={playerImageUrl(p.imageId)}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {(isCap || isVc) && (
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-sm ${
                        isCap ? 'bg-blue-500 text-white' : 'bg-violet-500 text-white'
                      }`}
                    >
                      {isCap ? 'C' : 'VC'}
                    </span>
                  )}
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{role} · {p.team?.teamSName ?? p.team?.teamName ?? ''}</p>
                </div>

                {/* C / VC chips */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectCaptain(pk)}
                    className={`h-9 px-3 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                      isCap
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-blue-500/15 hover:text-blue-400'
                    }`}
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectViceCaptain(pk)}
                    className={`h-9 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                      isVc
                        ? 'bg-violet-500 text-white shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-violet-500/15 hover:text-violet-400'
                    }`}
                  >
                    VC
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save CTA */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm px-4 py-3">
        <Button
          disabled={!canSave || saving || success}
          onClick={onSave}
          className="w-full h-12 rounded-xl text-sm font-semibold gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <Check className="h-4 w-4" /> : null}
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save Squad'}
        </Button>
      </div>
    </div>
  )
}
