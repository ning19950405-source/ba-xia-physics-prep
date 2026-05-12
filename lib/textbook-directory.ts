/** 人教版（2024）义务教育教科书 · 物理 · 八年级下册 — 章节目录（用于首页导航） */

export type TextbookDirNode = {
  id: string;
  label: string;
  /** 有 children 为章或单元；无 children 为可选中的节/条目 */
  children?: TextbookDirNode[];
};

export const TEXTBOOK_EDITION_LABEL = '人教版 (2024)';
export const TEXTBOOK_VOLUME_LABEL = '八年级下册';
export const TEXTBOOK_SUBJECT = '物理';

export const TEXTBOOK_DIRECTORY: TextbookDirNode[] = [
  {
    id: 'ch7',
    label: '第七章 力',
    children: [
      { id: 'ch7-s1', label: '第1节 力' },
      { id: 'ch7-s2', label: '第2节 弹力' },
      { id: 'ch7-s3', label: '第3节 重力' },
      { id: 'ch7-review', label: '本单元综合与测试' },
    ],
  },
  {
    id: 'ch8',
    label: '第八章 运动和力',
    children: [
      { id: 'ch8-s1', label: '第1节 牛顿第一定律' },
      { id: 'ch8-s2', label: '第2节 二力平衡' },
      { id: 'ch8-s3', label: '第3节 摩擦力' },
      { id: 'ch8-review', label: '本单元综合与测试' },
    ],
  },
  {
    id: 'ch9',
    label: '第九章 压强',
    children: [
      { id: 'ch9-s1', label: '第1节 压强' },
      { id: 'ch9-s2', label: '第2节 液体的压强' },
      { id: 'ch9-s3', label: '第3节 大气压强' },
      { id: 'ch9-s4', label: '第4节 流体压强与流速的关系' },
      { id: 'ch9-review', label: '本单元综合与测试' },
    ],
  },
  {
    id: 'ch10',
    label: '第十章 浮力',
    children: [
      { id: 'ch10-s1', label: '第1节 浮力' },
      { id: 'ch10-s2', label: '第2节 阿基米德原理' },
      { id: 'ch10-s3', label: '第3节 物体的浮沉条件及应用' },
      { id: 'ch10-review', label: '本单元综合与测试' },
    ],
  },
  {
    id: 'ch11',
    label: '第十一章 功和机械能',
    children: [
      { id: 'ch11-s1', label: '第1节 功' },
      { id: 'ch11-s2', label: '第2节 功率' },
      { id: 'ch11-s3', label: '第3节 动能和势能' },
      { id: 'ch11-s4', label: '第4节 机械能及其转化' },
      { id: 'ch11-review', label: '本单元综合与测试' },
    ],
  },
  {
    id: 'ch12',
    label: '第十二章 简单机械',
    children: [
      { id: 'ch12-s1', label: '第1节 杠杆' },
      { id: 'ch12-s2', label: '第2节 滑轮' },
      { id: 'ch12-s3', label: '第3节 机械效率' },
      { id: 'ch12-review', label: '本单元综合与测试' },
    ],
  },
  { id: 'book-review', label: '本册综合' },
];

export function findDirNodePath(
  nodes: TextbookDirNode[],
  targetId: string,
  prefix: string[] = [],
): string[] | null {
  for (const n of nodes) {
    const path = [...prefix, n.label];
    if (n.id === targetId) return path;
    if (n.children?.length) {
      const hit = findDirNodePath(n.children, targetId, path);
      if (hit) return hit;
    }
  }
  return null;
}

export function isChapterNode(n: TextbookDirNode): boolean {
  return Boolean(n.children?.length);
}
