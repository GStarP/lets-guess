import { useRef, type TouchEvent } from "react";
import type { GameSessionState } from "../types";

type GameViewProps = {
  session: GameSessionState;
  imageUrlByImageId: Record<string, string>;
  selectedNames: string[];
  currentSelectedName: string | null;
  allSelected: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectName: (name: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
};

const SWIPE_THRESHOLD = 42;

export function GameView({
  session,
  imageUrlByImageId,
  selectedNames,
  currentSelectedName,
  allSelected,
  onBack,
  onPrev,
  onNext,
  onSelectName,
  onReasonChange,
  onSubmit,
}: GameViewProps) {
  const currentItem = session.items[session.currentIndex];
  const total = session.items.length;
  const currentNumber = session.currentIndex + 1;
  const currentReason = session.reasonByImageId[currentItem.imageId] ?? "";
  const availableNames = session.nameOrder.filter(
    (name) => !selectedNames.includes(name),
  );

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);

  const canGoPrev = session.currentIndex > 0;
  const canGoNext = session.currentIndex < total - 1;

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (startXRef.current === null || startYRef.current === null) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > SWIPE_THRESHOLD
    ) {
      if (deltaX < 0) {
        onNext();
      } else {
        onPrev();
      }
    }

    startXRef.current = null;
    startYRef.current = null;
  };

  return (
    <section className="flex h-full w-full flex-col bg-gray-50">
      <header className="z-10 flex h-12 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          aria-label="返回出题页"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="text-sm font-semibold tracking-wider text-slate-500">
          {currentNumber} / {total}
        </div>

        <div className="-mr-2 h-8 w-8" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="flex min-h-12 items-center justify-center">
          {currentSelectedName ? (
            <button
              type="button"
              onClick={() => onSelectName(currentSelectedName)}
              className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-base font-bold text-white transition-colors hover:bg-slate-900"
            >
              <span>{currentSelectedName}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="h-4 w-4 opacity-70"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <span className="px-2 text-sm text-slate-400">请选择下方名称</span>
          )}
        </div>

        <div
          className="group relative mx-auto aspect-square w-full max-w-[18.5rem] shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {imageUrlByImageId[currentItem.imageId] ? (
            <img
              src={imageUrlByImageId[currentItem.imageId]}
              alt="当前题目图片"
              className="h-full w-full object-cover transition-transform duration-700"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
              图片加载失败
            </div>
          )}

          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-transparent p-3 text-slate-700 transition-colors hover:bg-white/45 disabled:pointer-events-none disabled:opacity-0"
            aria-label="上一张"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-transparent p-3 text-slate-700 transition-colors hover:bg-white/45 disabled:pointer-events-none disabled:opacity-0"
            aria-label="下一张"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
            理由
          </label>
          <textarea
            value={currentReason}
            rows={2}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="（选填）"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col pb-2">
          {allSelected ? (
            <div className="flex min-h-0 flex-1 items-center">
              <button
                type="button"
                onClick={onSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-base font-bold text-white transition-all active:scale-95 hover:bg-slate-900"
              >
                查看结果
              </button>
            </div>
          ) : (
            <>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                名称
              </label>
              <div className="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto rounded-xl bg-white/60 p-2">
                {availableNames.length > 0 ? (
                  availableNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onSelectName(name)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
                    >
                      {name}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">暂无可选名称</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
