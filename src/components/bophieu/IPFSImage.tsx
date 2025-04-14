import React, { useState, useEffect } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { processIpfsImageUrl } from '../../utils/ballotUtils';

// Danh sách các gateway IPFS công khai
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
];

interface IPFSImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  width?: number | string;
  height?: number | string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * IPFSImage - Component xử lý các hình ảnh từ IPFS với tự động thử các gateway khác nhau
 */
const IPFSImage: React.FC<IPFSImageProps> = ({
  src,
  alt = 'IPFS Image',
  className = '',
  fallbackSrc = 'https://placehold.co/400x400/e2e8f0/667085?text=Image+Not+Found',
  width,
  height,
  onLoad,
  onError,
}) => {
  const [currentGateway, setCurrentGateway] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Tính toán URL hiện tại
  const currentUrl = src
    ? src.startsWith('ipfs://')
      ? `${IPFS_GATEWAYS[currentGateway]}${src.replace('ipfs://', '')}`
      : src
    : fallbackSrc;

  // Thử gateway tiếp theo
  const tryNextGateway = () => {
    if (currentGateway < IPFS_GATEWAYS.length - 1) {
      setError(false);
      setIsLoading(true);
      setCurrentGateway((prev) => prev + 1);
      setRetryCount((prev) => prev + 1);
    } else {
      setError(true);
      setIsLoading(false);
      if (onError) onError();
    }
  };

  // Reset trạng thái khi src thay đổi
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setRetryCount(0);
    setCurrentGateway(0);
  }, [src]);

  // Xử lý khi tải hình ảnh thành công
  const handleImageLoaded = () => {
    setIsLoading(false);
    setError(false);
    if (onLoad) onLoad();
  };

  // Xử lý khi có lỗi tải hình ảnh
  const handleImageError = () => {
    // Thử gateway tiếp theo nếu hình ảnh từ IPFS
    if (src.startsWith('ipfs://') && currentGateway < IPFS_GATEWAYS.length - 1) {
      console.log(`Gateway ${currentGateway + 1} failed, trying next gateway`);
      tryNextGateway();
    } else {
      setError(true);
      setIsLoading(false);
      if (onError) onError();
    }
  };

  if (!src) {
    return <img src={fallbackSrc} alt={alt} className={className} />;
  }

  return (
    <div className="relative inline-block" style={{ width, height }}>
      <img
        src={currentUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        onLoad={handleImageLoaded}
        onError={handleImageError}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {error && !isLoading && (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}

      {/* IPFS Badge */}
      {!isLoading && !error && src.startsWith('ipfs://') && (
        <div className="absolute bottom-1 right-1 bg-blue-600/90 text-white px-1.5 py-0.5 rounded-md text-xs font-medium shadow-sm backdrop-blur-sm flex items-center">
          <Database className="w-3 h-3 mr-1" />
          IPFS {currentGateway + 1}/{IPFS_GATEWAYS.length}
        </div>
      )}

      {/* Retry Button */}
      {error && retryCount >= IPFS_GATEWAYS.length && (
        <div className="absolute top-1 right-1">
          <button
            onClick={() => {
              setCurrentGateway(0);
              setRetryCount(0);
              setIsLoading(true);
              setError(false);
            }}
            className="bg-blue-600/90 text-white px-1.5 py-0.5 rounded-md text-xs font-medium shadow-sm backdrop-blur-sm flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
};

export default IPFSImage;
