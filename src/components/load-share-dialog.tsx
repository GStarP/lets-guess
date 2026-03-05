import { useState } from "react";
import { Button } from "./ui/button";
import { clearShareHash, downloadSharedJson } from "../lib/r2-sharing";

type LoadShareDialogProps = {
  presignedUrl: string;
  onLoad: (jsonText: string) => Promise<void>;
  onDismiss: () => void;
  onError: (message: string) => void;
};

export function LoadShareDialog({
  presignedUrl,
  onLoad,
  onDismiss,
  onError,
}: LoadShareDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = async () => {
    setIsLoading(true);
    try {
      const json = await downloadSharedJson(presignedUrl);
      await onLoad(json);
      clearShareHash();
    } catch (error) {
      clearShareHash();
      const detail = error instanceof Error ? error.message : "未知错误";
      onError(`加载失败：${detail}`);
      onDismiss();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    clearShareHash();
    onDismiss();
  };

  return (
    <>
      {/* 遮罩 */}
      <div className="absolute inset-0 z-40 bg-slate-900/30" />

      {/* 居中 Dialog */}
      <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
          <h2 className="mb-2 text-base font-semibold text-slate-800">
            检测到外部分享的题目
          </h2>
          <p className="text-sm text-slate-500">是否加载？</p>
          <p className="mb-4 text-sm text-slate-500">
            加载后将覆盖本地的题目数据
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleDismiss}
              className="flex-1 rounded-lg"
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                void handleLoad();
              }}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-black text-white hover:bg-slate-900"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                  </svg>
                  加载中…
                </span>
              ) : (
                "加载"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
