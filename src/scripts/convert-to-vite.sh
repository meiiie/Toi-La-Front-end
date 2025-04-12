#!/bin/bash
# Cài đặt dependencies cho Vite
npm install --save-dev vite @vitejs/plugin-react vite-plugin-node-polyfills

# Tạo file vite.config.js đặc biệt cho dự án blockchain
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream', 'events'],
    }),
  ],
  define: {
    'process.env': process.env,
    global: 'globalThis',
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['web3', 'ethers', '@web3-react/core'],
        },
      },
    },
  },
});
EOF

# Di chuyển index.html từ public ra thư mục gốc
cp public/index.html .
sed -i 's|<div id="root"></div>|<div id="root"></div>\n    <script type="module" src="/src/index.jsx"></script>|' index.html

# Đổi tên index.js thành index.jsx nếu cần
if [ -f "src/index.js" ]; then
  cp src/index.js src/index.jsx
fi

# Cập nhật package.json
sed -i 's|"start": "react-scripts start"|"start": "vite"|' package.json
sed -i 's|"build": "react-scripts build"|"build": "vite build"|' package.json
sed -i 's|"test": "react-scripts test"|"test": "vitest"|' package.json
sed -i 's|"eject": "react-scripts eject"|"preview": "vite preview"|' package.json

# Chuyển đổi biến môi trường
if [ -f ".env" ]; then
  cp .env .env.backup
  sed 's/REACT_APP_/VITE_/g' .env.backup > .env.new
  mv .env.new .env
fi

echo "Chuyển đổi hoàn tất!"