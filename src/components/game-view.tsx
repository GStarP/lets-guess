import { useRef, type TouchEvent } from "react";
import type { GameSessionState } from "../types";
import { PageShell } from "./ui/page-shell";
import { TopBar } from "./ui/top-bar";
import { IconButton } from "./ui/icon-button";
import { Button } from "./ui/button";

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
    <PageShell>
      <TopBar
        leftSlot={
          <IconButton
            onClick={onBack}
            label="返回出题页"
            className="-ml-2 hover:text-slate-800"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            }
          />
        }
        centerSlot={
          <div className="text-sm font-semibold tracking-wider text-slate-500">
            {currentNumber} / {total}
          </div>
        }
        rightSlot={<div className="-mr-2 h-8 w-8" />}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="flex min-h-12 items-center justify-center">
          {currentSelectedName ? (
            <Button
              onClick={() => onSelectName(currentSelectedName)}
              className="rounded-full px-5 py-2 hover:bg-slate-900"
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
            </Button>
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

          <IconButton
            onClick={onPrev}
            disabled={!canGoPrev}
            label="上一张"
            className="absolute left-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 bg-transparent text-slate-700 hover:bg-white/45 disabled:pointer-events-none disabled:opacity-0"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            }
          />

          <IconButton
            onClick={onNext}
            disabled={!canGoNext}
            label="下一张"
            className="absolute right-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 bg-transparent text-slate-700 hover:bg-white/45 disabled:pointer-events-none disabled:opacity-0"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
            理由
          </label>
          <textarea
            value={currentReason}
            rows={1}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="（选填）"
            className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col pb-2">
          {allSelected ? (
            <div className="flex min-h-0 flex-1 items-center">
              <Button
                onClick={onSubmit}
                fullWidth
                className="text-base font-bold"
              >
                查看结果
              </Button>
            </div>
          ) : (
            <>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                名称
              </label>
              <div className="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto rounded-xl p-2">
                {availableNames.length > 0 ? (
                  availableNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onSelectName(name)}
                      className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-500 hover:bg-slate-200 hover:text-slate-900 active:scale-95"
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
    </PageShell>
  );
}
