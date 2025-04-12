# Cài đặt với flag legacy-peer-deps để tránh xung đột
npm install --save-dev vite @vitejs/plugin-react vite-plugin-node-polyfills --legacy-peer-deps

# Tạo file vite.config.js phù hợp cho ứng dụng 3D/Blockchain
$viteConfig = @'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process", "util", "stream", "events"],
    }),
  ],
  define: {
    "process.env": {},
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "three": path.resolve("node_modules/three"),
    },
  },
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 1600,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ["three"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
'@

Set-Content -Path "vite.config.js" -Value $viteConfig

# Di chuyển và chỉnh sửa index.html
if (Test-Path ".\public\index.html") {
    $htmlContent = Get-Content -Path ".\public\index.html" -Raw
    $htmlContent = $htmlContent -replace '<div id="root"></div>', '<div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>'
    Set-Content -Path ".\index.html" -Value $htmlContent
}

# Chỉnh sửa package.json
$packageJsonPath = ".\package.json"
$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json

# Lưu lại scripts cũ
$oldScripts = $packageJson.scripts

# Tạo scripts mới
$packageJson.scripts = @{
    "start" = "vite"
    "build" = "vite build"
    "preview" = "vite preview"
}

# Thêm lại các scripts khác
foreach ($key in $oldScripts.PSObject.Properties.Name) {
    if ($key -ne "start" -and $key -ne "build" -and $key -ne "eject" -and $key -ne "test") {
        $packageJson.scripts | Add-Member -MemberType NoteProperty -Name $key -Value $oldScripts.$key
    }
}

# Lưu package.json
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath

# Chuyển đổi index.js thành index.jsx nếu cần
if (Test-Path ".\src\index.js" -and -not (Test-Path ".\src\index.jsx")) {
    Copy-Item -Path ".\src\index.js" -Destination ".\src\index.jsx" -Force
}

# Tạo file .env cho Vite nếu chưa có
if (Test-Path ".\.env") {
    $envContent = Get-Content -Path ".\.env" -Raw
    $envContent = $envContent -replace "REACT_APP_", "VITE_"
    Set-Content -Path ".\.env" -Value $envContent
}

Write-Host "Chuyển đổi sang Vite hoàn tất!" -ForegroundColor Green
Write-Host "Tiếp theo bạn nên chạy: npm run build --legacy-peer-deps" -ForegroundColor Yellow