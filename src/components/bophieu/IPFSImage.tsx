import React, { useState, useEffect } from 'react';

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
  showStatus?: boolean;
  style?: React.CSSProperties;
}

/**
 * IPFSImage - Component hiển thị ảnh từ IPFS với tự động chuyển đổi gateway
 */
const IPFSImage: React.FC<IPFSImageProps> = ({
  src,
  alt = 'IPFS Image',
  className = '',
  fallbackSrc = 'https://placehold.co/400x400/e2e8f0/667085?text=Image+Not+Found',
  width,
  height,
  showStatus = true,
  style = {},
}) => {
  const [currentGateway, setCurrentGateway] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Chuyển đổi từ URL ipfs:// sang URL gateway
  const getGatewayUrl = (ipfsUrl: string, gatewayIndex: number = 0): string => {
    // Nếu URL đã là URL HTTP/HTTPS thông thường, trả về nguyên dạng
    if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
      return ipfsUrl;
    }

    // Trích xuất CID từ URL IPFS
    if (ipfsUrl.startsWith('ipfs://')) {
      const cid = ipfsUrl.replace('ipfs://', '');
      return `${IPFS_GATEWAYS[gatewayIndex]}${cid}`;
    }

    // Trường hợp không xác định, trả về URL gốc
    return ipfsUrl;
  };

  // Tính toán URL hiện tại
  const currentUrl = src ? getGatewayUrl(src, currentGateway) : fallbackSrc;

  // Thử gateway tiếp theo
  const tryNextGateway = () => {
    setError(true);
    setIsLoading(true);
    setCurrentGateway((prev) => (prev + 1) % IPFS_GATEWAYS.length);
    setRetryCount((prev) => prev + 1);
  };

  // Đặt lại khi src thay đổi
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setRetryCount(0);
    setCurrentGateway(0);
  }, [src]);

  if (!src) {
    return <img src={fallbackSrc} alt={alt} className={className} style={style} />;
  }

  return (
    <div className="relative inline-block" style={{ width, height, ...style }}>
      <img
        src={currentUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        onLoad={() => {
          setIsLoading(false);
          setError(false);
        }}
        onError={() => {
          // Nếu đã thử hết tất cả các gateway, hiển thị fallback
          if (currentGateway === IPFS_GATEWAYS.length - 1) {
            setIsLoading(false);
            setError(true);
          } else {
            tryNextGateway();
          }
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <svg
            className="w-6 h-6 text-blue-500 animate-spin"
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
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
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
      {showStatus && src.startsWith('ipfs://') && !error && !isLoading && (
        <div className="absolute bottom-1 right-1 bg-blue-600/90 text-white px-1.5 py-0.5 rounded-md text-xs font-medium shadow-sm backdrop-blur-sm flex items-center">
          <svg
            className="w-3 h-3 mr-1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
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
            <svg
              className="w-3 h-3 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"></path>
            </svg>
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
};

export default IPFSImage;
