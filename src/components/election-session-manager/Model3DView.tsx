// Model3DViewer.tsx
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  OrbitControls,
  Stage,
  Environment,
  Html,
  ContactShadows,
  Float,
  PresentationControls,
  Sparkles,
  useProgress,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Spinner } from '../../components/ui/Spinner';
import * as THREE from 'three';
import { useIpfsModel } from '../../utils/useIpfsModel';
import {
  ipfsToGatewayUrl,
  isIpfsUrl,
  IPFS_GATEWAYS,
  sanitize3DModelUrl,
} from '../../utils/ipfsUtils';
import { RefreshCw, Database, AlertTriangle, Info, ShieldAlert, Box } from 'lucide-react';

interface Model3DViewerProps {
  modelUrl: string;
  height?: string;
  autoRotate?: boolean;
  className?: string;
  backgroundColor?: string;
  rotationSpeed?: number;
  showControls?: boolean;
}

// Loader component với hiệu ứng đẹp
function Loader() {
  const { progress, active } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center backdrop-blur-sm bg-white/30 dark:bg-black/30 p-6 rounded-lg shadow-lg">
        <Spinner size="large" className="text-blue-500" />
        <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <p className="text-sm font-medium mt-2 text-gray-800 dark:text-gray-200">
          {active ? `${Math.round(progress)}% loaded` : 'Preparing model...'}
        </p>
      </div>
    </Html>
  );
}

// Hiệu ứng phát sáng cho model
const GlowEffect = () => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <Sparkles
      ref={ref}
      count={50}
      scale={[10, 10, 10]}
      size={0.6}
      speed={0.3}
      opacity={0.5}
      color="#88ccff"
      noise={0.5}
    />
  );
};

// Component hiển thị model 3D
interface Model3DProps {
  url: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  onError?: (error: any) => void;
}

const Model3D: React.FC<Model3DProps> = ({
  url,
  autoRotate = true,
  rotationSpeed = 1,
  onError,
}) => {
  const modelRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  // Xử lý lỗi và báo cáo lên component cha
  const handleError = (error: any) => {
    console.error(`Model3D error loading ${url}:`, error);
    setHasError(true);
    if (onError) {
      onError(error);
    }
  };

  // Sử dụng hook tùy chỉnh để tải model từ IPFS
  const { scene, isLoading, error } = useIpfsModel(url, {
    autoRetry: true,
    maxRetries: 3,
    onError: handleError,
  });

  // Hiệu ứng chuyển động nhẹ
  useFrame((state) => {
    if (modelRef.current && !autoRotate) {
      // Hiệu ứng "thở" nếu không tự động xoay
      modelRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  // Nếu URL không hợp lệ, hiển thị lỗi
  if (!url) {
    return (
      <Html center>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center max-w-xs">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            URL mô hình không hợp lệ
          </p>
        </div>
      </Html>
    );
  }

  // Hiển thị loader trong quá trình tải
  if (isLoading) {
    return <Loader />;
  }

  // Hiển thị lỗi nếu có
  if (error || hasError || !scene) {
    return (
      <Html center>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center max-w-xs">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            Không thể tải mô hình 3D
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {error?.message || 'Kiểm tra định dạng file và đường dẫn'}
          </p>
        </div>
      </Html>
    );
  }

  // Render model 3D khi đã tải xong
  return (
    <>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2} enabled={!autoRotate}>
        <Stage
          environment="city"
          intensity={0.8}
          contactShadow={{ opacity: 0.7, blur: 3 }}
          shadows
          adjustCamera={false}
          preset="soft"
        >
          <group ref={modelRef} scale={1.5}>
            <primitive object={scene} dispose={null} />
          </group>
        </Stage>
      </Float>

      <GlowEffect />

      <ContactShadows opacity={0.6} scale={10} blur={2} far={10} resolution={256} color="#000000" />

      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={rotationSpeed}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        dampingFactor={0.05}
        rotateSpeed={0.8}
        makeDefault
      />
    </>
  );
};

// Component chính Model3DViewer
const Model3DViewer: React.FC<Model3DViewerProps> = ({
  modelUrl,
  height = '300px',
  autoRotate = true,
  className = '',
  backgroundColor = '#f8f9fa',
  rotationSpeed = 1.5,
  showControls = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [modelLoadStatus, setModelLoadStatus] = useState<'idle' | 'loading' | 'error' | 'success'>(
    'idle',
  );

  // Kiểm tra xem modelUrl có phải là URL IPFS không
  const isIpfsModel = useMemo(() => isIpfsUrl(modelUrl), [modelUrl]);

  // Chuyển đổi URL IPFS sang URL gateway
  const resolvedModelUrl = useMemo(() => {
    if (!modelUrl) return '';

    try {
      // Nếu là URL IPFS, chuyển thành URL gateway
      if (isIpfsModel) {
        // Kiểm tra và làm sạch URL trước khi chuyển đổi
        const sanitizedUrl = sanitize3DModelUrl(modelUrl);
        // Luôn bắt đầu với gateway đầu tiên (dedicated Pinata gateway) nếu đây là lần tải đầu tiên
        const gatewayToUse = retryCount === 0 ? 0 : currentGatewayIndex;
        return ipfsToGatewayUrl(sanitizedUrl, gatewayToUse);
      }

      // Nếu không phải URL IPFS, trả về nguyên bản
      return modelUrl;
    } catch (error) {
      console.error('Error resolving model URL:', error);
      return modelUrl;
    }
  }, [modelUrl, isIpfsModel, currentGatewayIndex, retryCount]);

  // Kiểm tra xem lỗi có liên quan đến CORS không
  const isCorsRelatedError = (error: any): boolean => {
    if (!error) return false;

    const errorStr = error.toString().toLowerCase();
    return (
      errorStr.includes('cors') ||
      errorStr.includes('cross-origin') ||
      errorStr.includes('network error') ||
      errorStr.includes('failed to fetch') ||
      errorStr.includes('unexpected token <') // Thường là HTML thay vì JSON/GLB - dấu hiệu của lỗi CORS hoặc 404
    );
  };

  // Xử lý lỗi từ việc tải model
  const handleModelError = (err: any) => {
    console.error('Model loading error:', err);

    // Kiểm tra nếu lỗi liên quan đến CORS, thử gateway khác ngay lập tức
    if (isCorsRelatedError(err) && isIpfsModel && currentGatewayIndex < IPFS_GATEWAYS.length - 1) {
      console.log('Phát hiện lỗi CORS, thử gateway IPFS tiếp theo...');
      setCurrentGatewayIndex((prev) => prev + 1);
      setRetryCount((prev) => prev + 1);
      setModelLoadStatus('loading');
      return;
    }

    // Các lỗi khác
    setError(err?.message || 'Không thể tải mô hình 3D');
    setIsLoading(false);
    setModelLoadStatus('error');

    // Thử chuyển sang gateway tiếp theo nếu sử dụng IPFS
    if (isIpfsModel && currentGatewayIndex < IPFS_GATEWAYS.length - 1) {
      setCurrentGatewayIndex((prev) => prev + 1);
      setRetryCount((prev) => prev + 1);
    }
  };

  // Thử gateway tiếp theo
  const tryNextGateway = () => {
    setCurrentGatewayIndex((prev) => (prev + 1) % IPFS_GATEWAYS.length);
    setRetryCount((prev) => prev + 1);
    setError(null);
    setIsLoading(true);
    setModelLoadStatus('loading');
  };

  // Thử lại từ đầu
  const retryFromStart = () => {
    setCurrentGatewayIndex(0);
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
    setModelLoadStatus('loading');
  };

  // Theo dõi thay đổi của modelUrl để reset trạng thái
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setModelLoadStatus('loading');
    setCurrentGatewayIndex(0);
    setRetryCount(0);
  }, [modelUrl]);

  // Nếu có lỗi, hiển thị thông báo lỗi
  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4 max-w-md">
          <ShieldAlert className="h-10 w-10 mx-auto text-red-500 mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>

          <div className="flex flex-col gap-2">
            {isIpfsModel && currentGatewayIndex < IPFS_GATEWAYS.length - 1 && (
              <button
                onClick={tryNextGateway}
                className="px-3 py-1 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1 inline" />
                Thử gateway khác ({currentGatewayIndex + 1}/{IPFS_GATEWAYS.length})
              </button>
            )}

            <button
              onClick={retryFromStart}
              className="px-3 py-1 text-xs font-medium bg-green-50 hover:bg-green-100 text-green-700 rounded-md dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3 mr-1 inline" />
              Thử lại từ đầu
            </button>

            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800/30 p-2 rounded">
              <span className="block mb-1 font-medium">Thông tin chi tiết:</span>
              <span className="block">
                URL: {modelUrl.length > 30 ? `${modelUrl.substring(0, 30)}...` : modelUrl}
              </span>
              {isIpfsModel && (
                <span className="block">Gateway: {IPFS_GATEWAYS[currentGatewayIndex]}</span>
              )}
              <span className="block">Số lần thử: {retryCount}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-gray-100/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/80 rounded-md z-10 backdrop-blur-sm">
          <Spinner size="large" className="text-blue-500 mb-3" />
          <p className="text-sm text-blue-600 dark:text-blue-400 max-w-[80%] text-center">
            Đang tải mô hình 3D...
            {isIpfsModel && (
              <span className="block text-xs mt-1">
                Gateway IPFS: {currentGatewayIndex + 1}/{IPFS_GATEWAYS.length}
              </span>
            )}
          </p>
        </div>
      )}

      <Canvas
        ref={canvasRef}
        shadows
        dpr={[1, 2]} // Responsive pixel ratio
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 5], fov: 18 }}
        className={`rounded-md ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(backgroundColor));
          // Ẩn loading khi canvas được tạo
          setIsLoading(false);
        }}
      >
        <color attach="background" args={[backgroundColor]} />

        <Environment preset="city" />

        <React.Suspense fallback={<Loader />}>
          <PresentationControls
            global
            snap
            zoom={1.5}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
          >
            <ErrorBoundary fallback={<Loader />} onError={handleModelError}>
              <Model3D
                url={resolvedModelUrl}
                autoRotate={autoRotate}
                rotationSpeed={rotationSpeed}
                onError={handleModelError}
              />
            </ErrorBoundary>
          </PresentationControls>
        </React.Suspense>
      </Canvas>

      {/* Chỉ báo xoay */}
      {autoRotate && !isLoading && !error && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
          <svg
            className="w-3 h-3 inline-block animate-spin mr-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Đang xoay
        </div>
      )}

      {/* Thông tin IPFS */}
      {isIpfsModel && !isLoading && !error && (
        <div className="absolute top-2 left-2 text-xs flex items-center text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
          <Database className="w-3 h-3 mr-1" />
          <span>
            IPFS {currentGatewayIndex + 1}/{IPFS_GATEWAYS.length}
            <span className="ml-1 text-blue-500 dark:text-blue-400">
              {IPFS_GATEWAYS[currentGatewayIndex].includes('plum-characteristic')
                ? '(Dedicated Gateway)'
                : ''}
            </span>
          </span>
        </div>
      )}

      {/* Model Type Badge */}
      {!isLoading && !error && (
        <div className="absolute top-2 right-2 text-xs flex items-center text-indigo-600 dark:text-indigo-400 bg-white/40 dark:bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
          <Box className="w-3 h-3 mr-1" />
          <span>3D Model</span>
        </div>
      )}

      {/* Hướng dẫn sử dụng (tùy chọn) */}
      {showControls && !isLoading && !error && (
        <div className="absolute bottom-2 left-2 text-xs flex items-center text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
          <Info className="w-3 h-3 mr-1" />
          <span>Kéo để xoay, lăn để thu phóng</span>
        </div>
      )}
    </div>
  );
};

// Error boundary component để bắt lỗi từ React Three Fiber
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError?: (error: any) => void;
}> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error('3D Model error caught:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default Model3DViewer;
