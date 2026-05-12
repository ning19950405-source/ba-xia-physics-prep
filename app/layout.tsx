import type { Metadata } from 'next';
import './globals.css';
import { AppChrome } from '@/components/AppChrome';

export const metadata: Metadata = {
  title: '八下物理备课',
  description: '备课思路 → 一节课课件（独立应用）',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
