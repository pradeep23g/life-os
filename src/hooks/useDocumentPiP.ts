import { useCallback, useEffect, useState } from 'react'

type DocumentPictureInPictureApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>
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

  const openPiP = useCallback(async (width = 300, height = 200) => {
    const hostWindow = window as ExtendedWindow

    if (!hostWindow.documentPictureInPicture) {
      return null
    }

    const nextPiPWindow = await hostWindow.documentPictureInPicture.requestWindow({
      width,
      height,
    })

    setPipWindow(nextPiPWindow)
    return nextPiPWindow
  }, [])

  return {
    pipWindow,
    openPiP,
  }
}

