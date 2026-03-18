import type { NextConfig } from 'next';

// `serverBodySizeLimit` は Next.js 15 の ExperimentalConfig 型定義に未記載だが
// ランタイムでは有効なオプション。型エラーを回避するため交差型でキャスト。
const nextConfig: NextConfig = {
  experimental: {
    serverBodySizeLimit: '100mb', // formData バッファルートの上限
  } as NextConfig['experimental'] & { serverBodySizeLimit: string },
};

export default nextConfig;
