import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [react()],
    // ⚠️ GitHub Pages / AppsGeyser 部署关键配置：
    // 必须使用 './' (相对路径)。
    base: './',
    build: {
      // 将输出目录改为 'docs'，以便直接使用 GitHub Pages 的 /docs 文件夹部署模式
      outDir: 'docs',
      emptyOutDir: true,
      assetsDir: 'assets'
    },
    server: {
      port: 3000
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  }
})