# 基于 Cloudflare R2 的题目数据共享功能设计

## 1. 文档信息

- 文档版本：v1.0
- 更新时间：2026-03-03
- 功能状态：设计阶段

## 2. 功能概述

在出题页新增"分享"入口，允许出题人将当前题目数据 JSON 上传至自有 Cloudflare R2 存储桶，并生成一个带有预签名下载链接的分享 URL。接收方访问该 URL 后，应用自动检测并提示是否加载题目数据。

整个流程为**纯前端**实现，无需自建后端，基于 R2 的 S3 兼容 API 在浏览器端完成签名、上传与预签名 URL 生成。

## 3. 前置条件（R2 配置要求）

出题人在使用分享功能前，需确保其 R2 存储桶已完成以下配置：

### 3.1 CORS 规则

需允许浏览器直接跨域访问（PUT 上传 + GET 下载）。在 R2 控制台或通过 API 设置 Bucket 的 CORS 规则：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

> 生产场景可将 `AllowedOrigins` 限制为应用实际部署的域名。

### 3.2 API Token 权限

建议使用 R2 专用 API Token（而非账号主密钥），并将权限范围收窄至目标 Bucket 的对象读写权限。

## 4. 用户流程

### 4.1 出题方（分享方）

1. 在出题页，点击顶部栏"更多"菜单，选择**分享**。
2. 弹出分享 Dialog，包含以下表单字段：
   - **R2 Endpoint**：存储桶的 S3 兼容端点，格式为 `https://<account-id>.r2.cloudflarestorage.com`
   - **Bucket 名称**：目标存储桶名
   - **Access Key ID**
   - **Secret Access Key**
3. 表单填写完整后，**生成分享链接**按钮变为可点击状态。
4. 点击**生成分享链接**：
   1. 用预签名 PUT URL 将题目 JSON 上传到 R2（文件名见第 6.2 节）。
   2. 生成对应文件的预签名 GET URL（有效期 1 天）。
   3. 将预签名 GET URL 进行 Base64URL 编码后拼接到当前页面 URL 的 hash 中：`#share=<base64url>`。
   4. 将完整分享链接复制到剪贴板。
   5. 显示成功提示（Toast）。
5. 凭证在用户点击**生成分享链接**后保存至 `localStorage`，下次打开分享 Dialog 时自动填充。

### 4.2 接收方（猜题方）

1. 打开分享链接（URL 中含 `#share=<base64url>`）。
2. 应用初始化完成后，检测到 hash 中存在 `share` 参数，弹出**加载确认 Dialog**：
   - 提示文字："检测到分享的题目数据，是否加载？"
   - 操作按钮：**加载** / **取消**
3. 点击**加载**：
   1. 解码 Base64URL 得到预签名 GET URL。
   2. fetch 下载 JSON 数据。
   3. 走现有 `parseImportDocument` 流程校验并导入，覆盖当前本地题目草稿。
   4. 调用 `history.replaceState` 清除 URL 中的 hash 参数。
   5. 导入成功后显示成功 Toast；若下载或校验失败则显示错误 Toast，题目保持原样。
4. 点击**取消**：关闭 Dialog，同样清除 URL hash，应用维持当前状态。

## 5. UI 组件设计

### 5.1 分享 Dialog

```
┌─────────────────────────────────────────┐
│  分享题目                                │
├─────────────────────────────────────────┤
│  R2 Endpoint                            │
│  [ https://xxx.r2.cloudflarestorage.com ]│
│                                         │
│  Bucket 名称                             │
│  [ my-bucket                          ] │
│                                         │
│  Access Key ID                          │
│  [ ************************           ] │
│                                         │
│  Secret Access Key                      │
│  [ ************************           ] │
│                                         │
│           [ 取消 ]  [ 生成分享链接 ▶ ]   │
└─────────────────────────────────────────┘
```

- 四个字段均填写后，**生成分享链接**按钮才可点击。
- 生成过程中按钮显示加载状态，禁止重复点击。
- Secret Access Key 字段默认遮蔽，提供显示/隐藏切换。

### 5.2 加载确认 Dialog

```
┌──────────────────────────────────┐
│  加载分享的题目？                  │
├──────────────────────────────────┤
│  检测到分享链接中包含题目数据。     │
│  加载后将覆盖当前本地题目草稿。     │
│                                  │
│         [ 取消 ]  [ 加载 ]        │
└──────────────────────────────────┘
```

- 加载过程中按钮显示加载状态。
- 若当前本地题目草稿为空，则不显示"覆盖"提示。

## 6. 技术设计

### 6.1 签名库

使用 [`aws4fetch`](https://github.com/mhart/aws4fetch)（基于 Web Crypto API，无 Node.js 依赖，适合浏览器环境）实现 S3 兼容签名。

```
pnpm add aws4fetch
```

### 6.2 上传文件命名

格式：`lg-<base36_timestamp>-<4位随机hex>.json`

示例：`lg-lk3p2a-f3c1.json`

- 时间戳 base36 编码约 7 位，具备时序信息且足够短。
- 4 位随机 hex 防同一秒内冲突。

### 6.3 URL Hash 格式

```
https://example.com/#share=<base64url(presignedGetUrl)>
```

- 使用标准 Base64URL（`+` → `-`，`/` → `_`，无 `=` 填充）。
- 解析时取 `location.hash` 中 `share=` 之后的部分进行 `atob`（需先还原 Base64 标准字符）。
- 多个 hash 参数时以 `&` 分隔，`share` 参数优先解析。

### 6.4 预签名 URL 生成流程

```
1. 构造上传目标 URL：
   PUT https://<endpoint>/<bucket>/<filename>

2. 生成预签名 PUT URL（有效期 300 秒，仅用于本次上传）：
   - 使用 aws4fetch AwsClient 签名
   - Content-Type: application/json

3. fetch PUT 上传 JSON 内容

4. 构造下载目标 URL：
   GET https://<endpoint>/<bucket>/<filename>

5. 生成预签名 GET URL（有效期 86400 秒 = 1 天）：
   - 使用 aws4fetch AwsClient 签名

6. 对预签名 GET URL 进行 Base64URL 编码
```

### 6.5 凭证持久化

- Key：`lets-guess:r2-credentials:v1`
- 存储结构：

```json
{
  "endpoint": "https://xxx.r2.cloudflarestorage.com",
  "bucket": "my-bucket",
  "accessKeyId": "...",
  "secretAccessKey": "..."
}
```

- 每次成功生成分享链接后更新；不成功不覆盖。
- 打开分享 Dialog 时读取并填充至表单。

### 6.6 接收方初始化检测

在 `App.tsx` 的顶层 `useEffect`（依赖数组为空）中执行：

```typescript
const hash = new URLSearchParams(location.hash.slice(1));
const shareParam = hash.get("share");
if (shareParam) {
  // 触发显示加载确认 Dialog 的状态
}
```

检测到 `share` 参数后，设置应用级状态 `pendingShareUrl: string | null`，传入 `SetupView` 触发 Dialog 展示。

## 7. 新增类型定义

```typescript
// src/types.ts 新增

export type R2Credentials = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};
```

## 8. 错误处理

| 场景                                           | 处理方式                                                      |
| ---------------------------------------------- | ------------------------------------------------------------- |
| 表单字段未填写完整                             | 生成按钮保持禁用，无需报错                                    |
| 上传失败（网络/CORS/认证）                     | Toast 错误提示，提示检查凭证与 CORS 配置，不写入 localStorage |
| 预签名 GET URL 下载失败（链接过期/文件不存在） | Toast 错误提示"链接已失效或无法访问"                          |
| 下载内容 JSON 校验失败                         | 复用现有导入错误提示逻辑                                      |
| URL hash 中 Base64 解码失败                    | 静默忽略，不弹 Dialog                                         |

## 9. 范围约定

- **不提供 R2 存储桶的生命周期管理**：用户需自行清理 R2 中的历史文件。
- **不支持分享链接续期**：链接过期后需重新分享。
- **不校验 Endpoint/Bucket 格式**：仅在生成失败时报错。
- **不显示预签名链接有效期提示**。
