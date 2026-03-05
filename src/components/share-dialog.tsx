import { useState } from "react";
import { Button } from "./ui/button";
import {
  loadR2CredentialsFromLocalStorage,
  saveR2CredentialsToLocalStorage,
} from "../lib/local-storage";
import { buildShareLink, uploadAndGetShareUrl } from "../lib/r2-sharing";
import type { R2Credentials } from "../types";
import { TextInput } from "./ui/text-input";

type ShareDialogProps = {
  /** 当前题目的 JSON 字符串，由外部生成并传入 */
  exportJson: () => Promise<string>;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function ShareDialog({
  exportJson,
  onClose,
  onSuccess,
  onError,
}: ShareDialogProps) {
  const saved = loadR2CredentialsFromLocalStorage();

  const [endpoint, setEndpoint] = useState(saved?.endpoint ?? "");
  const [bucket, setBucket] = useState(saved?.bucket ?? "");
  const [accessKeyId, setAccessKeyId] = useState(saved?.accessKeyId ?? "");
  const [secretAccessKey, setSecretAccessKey] = useState(
    saved?.secretAccessKey ?? "",
  );
  const [isWorking, setIsWorking] = useState(false);

  const canSubmit =
    endpoint.trim() !== "" &&
    bucket.trim() !== "" &&
    accessKeyId.trim() !== "" &&
    secretAccessKey.trim() !== "" &&
    !isWorking;

  const handleGenerate = async () => {
    if (!canSubmit) return;

    setIsWorking(true);

    const credentials: R2Credentials = {
      endpoint: endpoint.trim(),
      bucket: bucket.trim(),
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
    };

    try {
      const json = await exportJson();
      const presignedGetUrl = await uploadAndGetShareUrl(credentials, json);
      const shareLink = buildShareLink(presignedGetUrl);

      await navigator.clipboard.writeText(shareLink);
      saveR2CredentialsToLocalStorage(credentials);

      onSuccess("分享链接已复制到剪贴板");
      onClose();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "未知错误";
      onError(`分享失败：${detail}`);
    } finally {
      setIsWorking(false);
    }
  };

  const labelClass = "mb-1 block text-xs font-medium text-slate-500";

  return (
    <>
      {/* 遮罩 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 z-40 bg-slate-900/30"
        aria-label="关闭"
      />

      {/* 底部面板 */}
      <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold text-slate-800">分享题目</h2>
        </div>

        <div className="space-y-3 px-4 pb-4">
          <div>
            <label className={labelClass}>R2 Endpoint</label>
            <TextInput
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://<account-id>.r2.cloudflarestorage.com"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div>
            <label className={labelClass}>Bucket 名称</label>
            <TextInput
              type="text"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="my-bucket"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div>
            <label className={labelClass}>Access Key ID</label>
            <TextInput
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="Access Key ID"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div>
            <label className={labelClass}>Secret Access Key</label>
            <TextInput
              type="text"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="Secret Access Key"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 rounded-lg"
          >
            取消
          </Button>
          <Button
            onClick={() => {
              void handleGenerate();
            }}
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-black text-white hover:bg-slate-900"
          >
            {isWorking ? (
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
                生成中…
              </span>
            ) : (
              "生成分享链接"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
