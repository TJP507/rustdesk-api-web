import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './',
    server: {
      open: true,
      port: Number(env.VITE_DEV_PORT) || 8888,
      proxy: {
        [env.VITE_SERVER_API || '/api/admin']: {
          target: env.VITE_SERVER_PATH || 'http://127.0.0.1:21114',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      emptyOutDir: true,
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('element-plus') || id.includes('@element-plus')) return 'element-plus'
              if (id.includes('@vue') || id.includes('/vue/') || id.includes('pinia')) return 'vue'
              return 'vendor'
            }
          },
          chunkFileNames: 'static/chunk/[name]-[hash].js',
          entryFileNames: 'static/entry/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        vue$: 'vue/dist/vue.runtime.esm-bundler.js',
      },
    },
    plugins: [vue()],
  }
})
