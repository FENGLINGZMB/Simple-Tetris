import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      // 确保在开发模式下启用JSX源码映射
      jsxImportSource: undefined,
      jsxRuntime: 'automatic',

      // 启用构建时注入源码位置信息
      babel: {
        plugins: [
          // 我们的自定义插件：在构建时注入源码位置
          [path.resolve(__dirname, 'babel-plugin-inject-source.js')],

          // 标准的React JSX转换
          [
            '@babel/plugin-transform-react-jsx',
            {
              runtime: 'automatic',
              importSource: 'react',
              development: true, // 保持开发模式以获得更好的调试体验
            },
          ],
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
  }
}));