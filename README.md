# 八下物理备课（ba-xia-physics-prep）

独立于 [OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) 仓库的备课应用：先产出可编辑的**备课思路**，再生成**一节课课件**并支持 **PPTX 导出**。

## 开发

```bash
cd 八下物理备课
cp .env.example .env.local
# 编辑 .env.local 填入 OPENAI_API_KEY

pnpm install
pnpm dev
```

安装依赖后会执行 `postinstall`：运行 `scripts/patch-next-devtools-zh.mjs`，把 **Next 开发模式左下角** Turbopack 指示器菜单里的英文（如 Preferences、Route）替换为中文。**升级 `next` 版本后**若菜单又变回英文，请对照 `node_modules/next/dist/compiled/next-devtools/index.js` 更新脚本中的替换表。

默认端口 **3001**（避免与 OpenMAIC 3000 冲突）。

## 模型配置（与 OpenMAIC 对齐）

右上角 **齿轮「设置」** 打开弹窗（左侧分类、中间厂商、右侧密钥与模型），保存到浏览器 `localStorage`。**每个厂商（OpenAI、DeepSeek 等）的 API Key 与 Base URL 分开保存**，切换中间列表不会把密钥带到别的厂商。请求 API 时会带上与 OpenMAIC 相同的请求头（使用**当前选中厂商**那一套）：

| 请求头 | 含义 |
|--------|------|
| `x-model` | `provider:modelId`，如 `openai:gpt-4o-mini`、`anthropic:claude-sonnet-4-20250514`、`google:gemini-2.0-flash` |
| `x-provider-type` | `openai`（含一切 OpenAI 兼容网关）、`anthropic`、`google` |
| `x-api-key` | 可选；不填则服务端使用 `.env.local` 中的 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` |
| `x-base-url` | 可选；兼容网关地址 |

设置内 **「测试连接」** 会调用服务端 `POST /api/llm-ping`（短超时内发一条极小 `generateText` 探测密钥与 Base URL）。实现见 `app/api/llm-ping/route.ts`、`lib/ping-base-url.ts`、`lib/model-runtime.ts`、`lib/client-model-storage.ts`、`lib/llm-provider-presets.ts`、`components/ModelSettingsDialog.tsx`、`components/AppChrome.tsx`。

## 连接超时 / 无法访问 api.openai.com

若日志出现 `Connect Timeout` 或无法连接 `api.openai.com:443`，常见原因：

1. **网络不可达**：部分网络环境无法直连 OpenAI 官方域名。  
2. **处理**：在 `.env.local` 中设置 **`OPENAI_BASE_URL`** 为你当前网络下可访问的 **OpenAI 兼容 API** 地址（由云厂商、学校网关或合规中转提供），并把 **`DEFAULT_MODEL`** 改成该网关文档中的模型名。  
3. **超时**：可通过 **`OPENAI_FETCH_TIMEOUT_MS`** 加大等待时间（默认 120000，上限 300000，代码内已做上下限裁剪）。

应用已对底层 `fetch` 使用可配置超时，避免默认过短的连接超时。

## 流程

1. `/` 输入课题与提示词 → 生成备课思路  
2. `/plan` 查看/编辑重点、要点、环节与时长 → 确认  
3. `/deck` 浏览简化幻灯片 → 下载 PPTX  

## 说明（与计划的差异）

当前版本使用 **程序化 `pptxgenjs` 幻灯片**（标题 + 要点），便于独立运行、依赖面小。若需与 OpenMAIC **完全一致的画布编辑器与复杂版式**，需在 AGPL 前提下从 OpenMAIC **按需拷贝** `components/slide-renderer` 与 `lib/export` 等模块（见项目计划文档）。

## 许可证

AGPL-3.0（若后续大量复用 OpenMAIC 源码，请保持许可证一致或取得授权）。
