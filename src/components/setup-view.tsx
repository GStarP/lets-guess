import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DraftItemWithPreview, ToastMessage } from "../types";
import { PageShell } from "./ui/page-shell";
import { TopBar } from "./ui/top-bar";
import { IconButton } from "./ui/icon-button";
import { Button } from "./ui/button";
import { ShareDialog } from "./share-dialog";

type SetupViewProps = {
  items: DraftItemWithPreview[];
  isBusy: boolean;
  message: ToastMessage | null;
  onUpload: (files: File[]) => Promise<void>;
  onImport: (file: File | null) => Promise<void>;
  onExport: () => Promise<void>;
  onClear: () => Promise<void>;
  onNameChange: (id: string, value: string) => void;
  onRemove: (id: string) => Promise<void>;
  onStart: () => void;
  onDismissMessage: () => void;
  onShareSuccess: (message: string) => void;
  onShareError: (message: string) => void;
  buildExportJsonString: () => Promise<string>;
};

function getToastStyle(message: ToastMessage): {
  shellClassName: string;
  icon: ReactNode;
} {
  if (message.type === "error") {
    return {
      shellClassName: "border border-red-200 bg-red-50 text-red-700",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="13" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" />
        </svg>
      ),
    };
  }

  if (message.type === "success") {
    return {
      shellClassName:
        "border border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <circle cx="12" cy="12" r="9" />
          <polyline points="8.5 12.5 11 15 15.5 9.5" />
        </svg>
      ),
    };
  }

  return {
    shellClassName: "border border-indigo-200 bg-indigo-50 text-indigo-700",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
      >
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <circle cx="12" cy="8" r="0.5" fill="currentColor" />
      </svg>
    ),
  };
}

export function SetupView({
  items,
  isBusy,
  message,
  onUpload,
  onImport,
  onExport,
  onClear,
  onNameChange,
  onRemove,
  onStart,
  onDismissMessage,
  onShareSuccess,
  onShareError,
  buildExportJsonString,
}: SetupViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onDismissMessage();
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message, onDismissMessage]);

  const canStart = !isBusy;
  const toastStyle = message ? getToastStyle(message) : null;

  const openUploadPicker = () => {
    const input = uploadInputRef.current;
    if (!input) {
      return;
    }

    // Reset before opening picker so selecting the same file still triggers change.
    input.value = "";
    input.click();
  };

  return (
    <PageShell>
      {message ? (
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-40 flex justify-center">
          <div
            className={`pointer-events-auto flex max-w-full items-center gap-2 rounded-xl px-3 py-2 text-sm shadow-sm ${toastStyle?.shellClassName ?? ""}`}
          >
            <span className="shrink-0">{toastStyle?.icon}</span>
            <span className="truncate">{message.text}</span>
            <button
              type="button"
              onClick={onDismissMessage}
              className="shrink-0 text-current/70 transition-colors hover:text-current"
              aria-label="关闭提示"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      <TopBar
        sticky
        leftSlot={
          <IconButton
            onClick={openUploadPicker}
            disabled={isBusy}
            label="上传图片"
            className="-ml-2 hover:text-indigo-600"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            }
          />
        }
        rightSlot={
          <IconButton
            onClick={() => setMenuOpen(true)}
            label="更多操作"
            className="-mr-2 hover:text-indigo-600"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            }
          />
        }
      />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        <div className="grid grid-cols-2 gap-3">
          {items.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-slate-400">
              暂无题目，请先上传图片
            </div>
          ) : null}

          {items.map((item) => {
            return (
              <div
                key={item.id}
                className="group flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt="题目图片"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      图片不可用
                    </div>
                  )}

                  <IconButton
                    variant="surface"
                    onClick={async () => {
                      await onRemove(item.id);
                    }}
                    label="删除题目"
                    className="absolute right-1 top-1 text-slate-400 hover:text-red-500"
                    icon={
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-3.5 w-3.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    }
                  />
                </div>

                <input
                  type="text"
                  value={item.correctName}
                  onChange={(event) =>
                    onNameChange(item.id, event.target.value)
                  }
                  placeholder="输入正确名称"
                  className="w-full border-none bg-transparent px-1 py-1 text-center text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent p-6">
        <Button
          onClick={onStart}
          disabled={!canStart}
          fullWidth
          className="bg-black text-white hover:bg-slate-900"
        >
          <span>开始游戏</span>
        </Button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 z-40 bg-slate-900/30"
            aria-label="关闭菜单"
          />

          <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white p-4">
            <div className="space-y-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  importInputRef.current?.click();
                  setMenuOpen(false);
                }}
              >
                导入 JSON
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={async () => {
                  setMenuOpen(false);
                  await onExport();
                }}
              >
                导出 JSON
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setMenuOpen(false);
                  setShareOpen(true);
                }}
              >
                分享题目
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={async () => {
                  setMenuOpen(false);
                  if (window.confirm("确认清空所有题目与图片吗？")) {
                    await onClear();
                  }
                }}
              >
                清空数据
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={async (event) => {
          const files = event.currentTarget.files
            ? Array.from(event.currentTarget.files)
            : [];
          event.currentTarget.value = "";
          await onUpload(files);
        }}
      />

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (event) => {
          await onImport(event.currentTarget.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />

      {shareOpen ? (
        <ShareDialog
          exportJson={buildExportJsonString}
          onClose={() => setShareOpen(false)}
          onSuccess={(msg) => {
            setShareOpen(false);
            onShareSuccess(msg);
          }}
          onError={(msg) => {
            onShareError(msg);
          }}
        />
      ) : null}
    </PageShell>
  );
}
