// useIpfsModel.tsx - React Hook để tải model 3D từ IPFS
import { useState, useEffect, useCallback, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { ipfsToGatewayUrl, isIpfsUrl, sanitize3DModelUrl, IPFS_GATEWAYS } from './ipfsUtils';
import * as THREE from 'three';

interface UseIpfsModelOptions {
  fallbackUrl?: string;
  autoRetry?: boolean;
  maxRetries?: number;
  onSuccess?: (url: string) => void;
  onError?: (error: any) => void;
}

interface UseIpfsModelResult {
  resolvedUrl: string | null;
  isLoading: boolean;
  error: any | null;
  scene: THREE.Group | null;
  progress: number;
  currentGateway: number;
  totalGateways: number;
  retry: () => void;
  tryNextGateway: () => void;
}

/**
 * Hook React để tải model 3D từ IPFS với xử lý lỗi và thử lại
 */
export function useIpfsModel(
  modelUrl: string | null,
  options: UseIpfsModelOptions = {},
): UseIpfsModelResult {
  const {
    fallbackUrl = '',
    autoRetry = true,
    maxRetries = IPFS_GATEWAYS.length,
    onSuccess,
    onError,
  } = options;

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentGateway, setCurrentGateway] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Lấy scene từ model
  const { scene } = useGLTF(resolvedUrl || '', undefined, (error) => {
    console.error('Error loading model:', error);
    setError(error);

    if (autoRetry && retryCount < maxRetries) {
      // Thử gateway tiếp theo
      tryNextGateway();
    } else if (onError) {
      onError(error);
    }
  });

  // Thử gateway tiếp theo
  const tryNextGateway = useCallback(() => {
    setCurrentGateway((prev) => (prev + 1) % IPFS_GATEWAYS.length);
    setRetryCount((prev) => prev + 1);
    setIsLoading(true);
    setError(null);
  }, []);

  // Thử lại từ đầu
  const retry = useCallback(() => {
    setCurrentGateway(0);
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
    setProgress(0);
  }, []);

  // Tạo URL phù hợp cho model 3D
  const processModelUrl = useCallback(
    (url: string | null): string | null => {
      if (!url) return null;

      try {
        // Làm sạch URL
        const sanitizedUrl = sanitize3DModelUrl(url);

        // Nếu là URL IPFS, chuyển đổi sang URL gateway
        if (isIpfsUrl(sanitizedUrl)) {
          return ipfsToGatewayUrl(sanitizedUrl, currentGateway);
        }

        // Trả về URL gốc nếu không phải IPFS
        return sanitizedUrl;
      } catch (err) {
        console.error('Error processing model URL:', err);
        return url;
      }
    },
    [currentGateway],
  );

  // Kiểm tra khả năng truy cập của URL
  const checkUrlAccessibility = useCallback(async (url: string): Promise<boolean> => {
    try {
      // Bỏ qua kiểm tra với file local
      if (url.startsWith('/') || url.startsWith('./')) return true;

      // Tạo AbortController mới cho mỗi yêu cầu
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Thử tải HEAD request với timeout
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 5000); // 5 giây timeout

      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // Tránh lỗi CORS trong kiểm tra
        cache: 'no-cache',
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch (e) {
      console.warn(`URL không thể truy cập: ${url}`, e);
      return false;
    }
  }, []);

  // Xử lý khi URL thay đổi
  useEffect(() => {
    if (!modelUrl) {
      setResolvedUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Hủy bỏ các yêu cầu đang chờ
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }

    const loadModel = async () => {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      try {
        // Xử lý URL
        const processedUrl = processModelUrl(modelUrl);
        if (!processedUrl) {
          throw new Error('Invalid model URL');
        }

        // Kiểm tra URL có thể truy cập
        const isAccessible = await checkUrlAccessibility(processedUrl);
        if (!isAccessible && isIpfsUrl(modelUrl) && currentGateway < IPFS_GATEWAYS.length - 1) {
          // Thử gateway tiếp theo
          tryNextGateway();
          return;
        }

        // Đặt URL đã xử lý
        setResolvedUrl(processedUrl);

        // Báo thành công
        if (onSuccess) {
          onSuccess(processedUrl);
        }
      } catch (err) {
        console.error('Error loading model:', err);
        setError(err);

        if (autoRetry && retryCount < maxRetries) {
          // Thử lại sau 2 giây
          retryTimerRef.current = setTimeout(() => {
            tryNextGateway();
          }, 2000);
        } else if (onError) {
          onError(err);
        }
      }
    };

    loadModel();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }

      // Xóa cache model
      if (resolvedUrl) {
        try {
          useGLTF.clear(resolvedUrl);
        } catch (e) {
          console.log('Error clearing model cache:', e);
        }
      }
    };
  }, [
    modelUrl,
    currentGateway,
    retryCount,
    autoRetry,
    maxRetries,
    processModelUrl,
    checkUrlAccessibility,
    onSuccess,
    onError,
    tryNextGateway,
    resolvedUrl,
  ]);

  // Đặt progress = 100 sau khi tải xong
  useEffect(() => {
    if (scene && isLoading) {
      setIsLoading(false);
      setProgress(100);
    }
  }, [scene, isLoading]);

  return {
    resolvedUrl,
    isLoading,
    error,
    scene,
    progress,
    currentGateway,
    totalGateways: IPFS_GATEWAYS.length,
    retry,
    tryNextGateway,
  };
}
