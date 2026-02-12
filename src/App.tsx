import { useCallback, useEffect, useMemo, useState } from 'react'
import { GameView } from './components/game-view'
import { ResultView } from './components/result-view'
import { SetupView } from './components/setup-view'
import { useGameSession } from './hooks/use-game-session'
import { usePuzzleDraft } from './hooks/use-puzzle-draft'
import { normalizeName } from './lib/name-utils'
import { renderResultCanvas } from './lib/result-canvas'
import { triggerDownload } from './lib/image-utils'
import type { AppView, ResultEntry } from './types'

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('结果图生成失败'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}

function App() {
  const [view, setView] = useState<AppView>('setup')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null)
  const [isRenderingResult, setIsRenderingResult] = useState(false)
  const [resultError, setResultError] = useState<string | null>(null)

  const {
    items,
    itemsWithPreview,
    previewUrlByImageId,
    validation,
    isBusy,
    message,
    uploadImages,
    updateItemName,
    removeItem,
    clearAll,
    importFromJson,
    exportToJson,
    clearMessage,
    pushMessage,
  } = usePuzzleDraft()

  const {
    session,
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
  } = useGameSession()

  const replaceResultPreview = useCallback((nextUrl: string | null) => {
    setResultPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }

      return nextUrl
    })
  }, [])

  useEffect(
    () => () => {
      if (resultPreviewUrl) {
        URL.revokeObjectURL(resultPreviewUrl)
      }
    },
    [resultPreviewUrl],
  )

  const resultEntries = useMemo(() => {
    if (!session) {
      return []
    }

    return session.items.map<ResultEntry>((item) => {
      const selectedName = session.selectedNameByImageId[item.imageId] ?? '未选择'
      const reason = session.reasonByImageId[item.imageId]?.trim() ?? ''

      return {
        id: item.id,
        imageUrl: previewUrlByImageId[item.imageId] ?? '',
        selectedName,
        reason,
        isCorrect: normalizeName(selectedName) === normalizeName(item.correctName),
      }
    })
  }, [previewUrlByImageId, session])

  const renderResult = useCallback(async () => {
    if (!session) {
      return
    }

    setResultError(null)
    setIsRenderingResult(true)

    try {
      const canvas = await renderResultCanvas(resultEntries)
      const blob = await canvasToBlob(canvas)
      setResultBlob(blob)
      replaceResultPreview(URL.createObjectURL(blob))
    } catch (error) {
      const detail = error instanceof Error ? error.message : '未知错误'
      setResultError(`结果图生成失败：${detail}`)
      setResultBlob(null)
      replaceResultPreview(null)
    }

    setIsRenderingResult(false)
  }, [replaceResultPreview, resultEntries, session])

  const handleStart = useCallback(() => {
    if (!validation.canStart) {
      if (validation.countError) {
        pushMessage({ type: 'error', text: validation.countError })
      } else if (validation.emptyNameIds.size > 0) {
        pushMessage({ type: 'error', text: '请先填写所有图片名称' })
      } else if (validation.duplicateNameIds.size > 0) {
        pushMessage({ type: 'error', text: '存在重复名称，请修改后再开始' })
      }

      return
    }

    startSession(items)
    setResultBlob(null)
    setResultError(null)
    replaceResultPreview(null)
    setView('game')
  }, [items, pushMessage, replaceResultPreview, startSession, validation])

  const handleBackFromGame = useCallback(() => {
    resetSession()
    setView('setup')
  }, [resetSession])

  const handleSubmitGame = useCallback(() => {
    if (!allSelected) {
      return
    }

    setView('result')
    void renderResult()
  }, [allSelected, renderResult])

  const handleBackFromResult = useCallback(() => {
    resetSession()
    setResultBlob(null)
    setResultError(null)
    replaceResultPreview(null)
    setView('setup')
  }, [replaceResultPreview, resetSession])

  const handleDownloadResult = useCallback(() => {
    if (!resultBlob) {
      return
    }

    triggerDownload(resultBlob, `lets-guess-result-${Date.now()}.png`)
  }, [resultBlob])

  return (
    <main
      id="app-container"
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-gray-50"
    >
      {view === 'setup' ? (
        <SetupView
          items={itemsWithPreview}
          isBusy={isBusy}
          message={message}
          onUpload={uploadImages}
          onImport={importFromJson}
          onExport={exportToJson}
          onClear={clearAll}
          onNameChange={updateItemName}
          onRemove={removeItem}
          onStart={handleStart}
          onDismissMessage={clearMessage}
        />
      ) : null}

      {view === 'game' && session ? (
        <GameView
          session={session}
          imageUrlByImageId={previewUrlByImageId}
          selectedNames={selectedNames}
          currentSelectedName={currentSelectedName}
          allSelected={allSelected}
          onBack={handleBackFromGame}
          onPrev={goPrev}
          onNext={goNext}
          onSelectName={selectCurrentName}
          onReasonChange={setCurrentReason}
          onSubmit={handleSubmitGame}
        />
      ) : null}

      {view === 'result' && session ? (
        <ResultView
          score={score}
          total={session.items.length}
          previewUrl={resultPreviewUrl}
          isRendering={isRenderingResult}
          renderError={resultError}
          onBack={handleBackFromResult}
          onDownload={handleDownloadResult}
          onRetry={() => {
            void renderResult()
          }}
        />
      ) : null}
    </main>
  )
}

export default App
