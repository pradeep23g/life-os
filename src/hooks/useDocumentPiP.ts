import { useCallback, useEffect, useState } from 'react'

type DocumentPictureInPictureApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>
  window?: Window | null
}

type ExtendedWindow = Window & {
  documentPictureInPicture?: DocumentPictureInPictureApi
}

export function useDocumentPiP() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null)

  useEffect(() => {
    if (!pipWindow) {
      return
    }

    const handlePageHide = () => {
      setPipWindow(null)
    }

    pipWindow.addEventListener('pagehide', handlePageHide)

    return () => {
      pipWindow.removeEventListener('pagehide', handlePageHide)
    }
  }, [pipWindow])

  const openPiP = useCallback(async (width = 340, height = 220) => {
    const hostWindow = window as ExtendedWindow

    if (!hostWindow.documentPictureInPicture) {
      return null
    }

    // Reuse existing active PiP window if still open
    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus()
      return pipWindow
    }

    try {
      const nextPiPWindow = await hostWindow.documentPictureInPicture.requestWindow({
        width,
        height,
      })

      setPipWindow(nextPiPWindow)
      return nextPiPWindow
    } catch {
      return null
    }
  }, [pipWindow])

  const closePiP = useCallback(() => {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close()
      setPipWindow(null)
    }
  }, [pipWindow])

  const isSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window

  return {
    pipWindow,
    openPiP,
    closePiP,
    isSupported,
  }
}


