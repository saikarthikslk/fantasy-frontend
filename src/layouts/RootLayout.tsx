import { Outlet } from 'react-router-dom'
import { TokenCapture } from '../components/TokenCapture'
import { useState } from 'react'
import { useAuthToken } from '../auth/useAuthToken'
import { CommandMenu } from '@/keyboard/CommandMenu'
import { ShortcutsHelpModal } from '@/keyboard/ShortcutsHelpModal'

export function RootLayout() {
  const [, settoken1] = useState<string | null>(useAuthToken())

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TokenCapture setroot={settoken1} />

      {/* No header — brand lives in the landing hero */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Keyboard UI — portals to body */}
      <CommandMenu />
      <ShortcutsHelpModal />
    </div>
  )
}
