import { PageShell } from "./ui/page-shell";
import { TopBar } from "./ui/top-bar";
import { IconButton } from "./ui/icon-button";

type ResultViewProps = {
  score: number;
  total: number;
  previewUrl: string | null;
  isRendering: boolean;
  renderError: string | null;
  onBack: () => void;
  onDownload: () => void;
  onRetry: () => void;
};

export function ResultView({
  score,
  total,
  previewUrl,
  isRendering,
  renderError,
  onBack,
  onDownload,
  onRetry,
}: ResultViewProps) {
  return (
    <PageShell variant="slate">
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
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              正确数
            </span>
            <div className="text-sm font-semibold tracking-wider text-slate-500">
              {score} / {total}
            </div>
          </div>
        }
        rightSlot={
          <IconButton
            onClick={onDownload}
            disabled={isRendering || !previewUrl}
            label="下载结果图"
            className="-mr-2 hover:text-slate-800 disabled:text-slate-300"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            }
          />
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {isRendering ? (
          <div className="flex h-[480px] w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-lg">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500" />
            <p className="font-medium">正在生成结果图...</p>
          </div>
        ) : null}

        {!isRendering && renderError ? (
          <div className="flex h-[480px] w-full flex-col items-center justify-center rounded-xl border border-red-200 bg-white text-center text-red-500 shadow-lg">
            <p className="mb-3 font-medium">{renderError}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
            >
              重试生成
            </button>
          </div>
        ) : null}

        {!isRendering && !renderError && previewUrl ? (
          <img
            src={previewUrl}
            alt="结果长图预览"
            className="block w-full h-auto"
          />
        ) : null}

        {!isRendering && !renderError && !previewUrl ? (
          <div className="flex h-[480px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-lg">
            暂无结果图
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
