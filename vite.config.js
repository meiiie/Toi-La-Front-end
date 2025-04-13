import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream', 'events'],
    }),
  ],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      three: path.resolve('node_modules/three'),
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 6000, // Tăng giới hạn cảnh báo
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', '@headlessui/react'],
          web3: ['web3', 'ethers'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  // Đảm bảo mã hóa URL đúng
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    },
    port: 3000,
    middlewareMode: 'html',
    fs: {
      strict: true,
      allow: ['..'],
    },
  },
  preview: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    },
    port: 5000,
  },
});
