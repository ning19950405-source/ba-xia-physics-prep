/**
 * 将 Next.js 开发模式左下角指示器菜单中的固定英文文案替换为简体中文。
 * 依赖 next 发行版内 compiled 产物中的字面量；若升级 Next 后 patch 未生效，请检查并更新本脚本中的替换表。
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);

let file;
try {
  file = require.resolve('next/dist/compiled/next-devtools/index.js');
} catch {
  console.warn('[patch-next-devtools-zh] 未找到 next，跳过。');
  process.exit(0);
}

let s = fs.readFileSync(file, 'utf8');
if (s.includes('label:"偏好设置"') && !s.includes('label:"Preferences"')) {
  console.log('[patch-next-devtools-zh] 已是中文菜单，跳过。');
  process.exit(0);
}
const origLen = s.length;

/** 按顺序替换；先替换较长、较具体的模式，避免误伤 */
const pairs = [
  ['label:"Route Info"', 'label:"路由信息"'],
  ['label:"Preferences"', 'label:"偏好设置"'],
  ['label:"Bundler"', 'label:"打包器"'],
  ['label:"Route"', 'label:"路由"'],
  ['?"Static":"Dynamic"', '?"静态":"动态"'],
  ['title:"Turbopack is enabled."', 'title:"已启用 Turbopack。"'],
  [
    'title:"Learn about Turbopack and how to enable it in your application."',
    'title:"了解如何在项目中启用 Turbopack。"',
  ],
  ['title:"Loading..."', 'title:"加载中…"'],
  ['title:"Current route is ".concat', 'title:"当前路由为 ".concat'],
];

let missing = 0;
for (const [en, zh] of pairs) {
  if (!s.includes(en)) {
    console.warn(`[patch-next-devtools-zh] 未匹配到片段，可能 Next 版本已变，请更新脚本：${en.slice(0, 56)}…`);
    missing += 1;
    continue;
  }
  s = s.split(en).join(zh);
}

if (s.length === origLen && missing === pairs.length) {
  console.warn('[patch-next-devtools-zh] 未做任何替换。');
  process.exit(0);
}

fs.writeFileSync(file, s);
console.log('[patch-next-devtools-zh] 已写入中文菜单文案 →', file);
