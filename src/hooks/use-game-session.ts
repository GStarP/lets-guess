import { useCallback, useMemo, useState } from 'react'
import { normalizeName, shuffleArray } from '../lib/name-utils'
import type { GameSessionState, PuzzleDraftItem } from '../types'

type UseGameSessionResult = {
  session: GameSessionState | null
  currentItem: PuzzleDraftItem | null
  currentSelectedName: string | null
  selectedNames: string[]
  allSelected: boolean
  score: number
  startSession: (items: PuzzleDraftItem[]) => void
  resetSession: () => void
  goPrev: () => void
  goNext: () => void
  selectCurrentName: (name: string) => void
  setCurrentReason: (reason: string) => void
  isNameTakenByOther: (name: string, currentImageId: string) => boolean
}

function createSessionState(items: PuzzleDraftItem[]): GameSessionState {
  const selectedNameByImageId: Record<string, string | null> = {}
  const reasonByImageId: Record<string, string> = {}

  for (const item of items) {
    selectedNameByImageId[item.imageId] = null
    reasonByImageId[item.imageId] = ''
  }

  return {
    items,
    currentIndex: 0,
    nameOrder: shuffleArray(items.map((item) => item.correctName.trim())),
    selectedNameByImageId,
    reasonByImageId,
  }
}

export function useGameSession(): UseGameSessionResult {
  const [session, setSession] = useState<GameSessionState | null>(null)

  const startSession = useCallback((items: PuzzleDraftItem[]) => {
    setSession(createSessionState(items.map((item) => ({ ...item }))))
  }, [])

  const resetSession = useCallback(() => {
    setSession(null)
  }, [])

  const currentItem = useMemo(() => {
    if (!session) {
      return null
    }

    return session.items[session.currentIndex] ?? null
  }, [session])

  const currentSelectedName = useMemo(() => {
    if (!session || !currentItem) {
      return null
    }

    return session.selectedNameByImageId[currentItem.imageId] ?? null
  }, [currentItem, session])

  const selectedNames = useMemo(() => {
    if (!session) {
      return []
    }

    return Object.values(session.selectedNameByImageId).filter((value): value is string => Boolean(value))
  }, [session])

  const allSelected = useMemo(() => {
    if (!session) {
      return false
    }

    return session.items.every((item) => Boolean(session.selectedNameByImageId[item.imageId]))
  }, [session])

  const score = useMemo(() => {
    if (!session) {
      return 0
    }

    return session.items.reduce((total, item) => {
      const selected = session.selectedNameByImageId[item.imageId]
      if (!selected) {
        return total
      }

      return normalizeName(selected) === normalizeName(item.correctName) ? total + 1 : total
    }, 0)
  }, [session])

  const goPrev = useCallback(() => {
    setSession((current) => {
      if (!current || current.currentIndex === 0) {
        return current
      }

      return {
        ...current,
        currentIndex: current.currentIndex - 1,
      }
    })
  }, [])

  const goNext = useCallback(() => {
    setSession((current) => {
      if (!current || current.currentIndex >= current.items.length - 1) {
        return current
      }

      return {
        ...current,
        currentIndex: current.currentIndex + 1,
      }
    })
  }, [])

  const isNameTakenByOther = useCallback((name: string, currentImageId: string) => {
    if (!session) {
      return false
    }

    for (const [imageId, selectedName] of Object.entries(session.selectedNameByImageId)) {
      if (imageId !== currentImageId && selectedName === name) {
        return true
      }
    }

    return false
  }, [session])

  const selectCurrentName = useCallback(
    (name: string) => {
      setSession((current) => {
        if (!current) {
          return current
        }

        const item = current.items[current.currentIndex]
        if (!item) {
          return current
        }

        const currentSelection = current.selectedNameByImageId[item.imageId]
        const hasConflict = Object.entries(current.selectedNameByImageId).some(
          ([imageId, selectedName]) => imageId !== item.imageId && selectedName === name,
        )

        if (hasConflict) {
          return current
        }

        return {
          ...current,
          selectedNameByImageId: {
            ...current.selectedNameByImageId,
            [item.imageId]: currentSelection === name ? null : name,
          },
        }
      })
    },
    [],
  )

  const setCurrentReason = useCallback((reason: string) => {
    setSession((current) => {
      if (!current) {
        return current
      }

      const item = current.items[current.currentIndex]
      if (!item) {
        return current
      }

      return {
        ...current,
        reasonByImageId: {
          ...current.reasonByImageId,
          [item.imageId]: reason,
        },
      }
    })
  }, [])

  return {
    session,
    currentItem,
    currentSelectedName,
    selectedNames,
    allSelected,
    score,
    startSession,
    resetSession,
    goPrev,
    goNext,
    selectCurrentName,
    setCurrentReason,
    isNameTakenByOther,
  }
}
