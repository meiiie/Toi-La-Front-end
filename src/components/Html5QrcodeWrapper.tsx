'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Loader2 } from 'lucide-react';

interface Html5QrcodeWrapperProps {
  fps?: number;
  qrbox?: number | { width: number; height: number };
  disableFlip?: boolean;
  verbose?: boolean;
  onScan: (decodedText: string, decodedResult: any) => void;
  onError: (errorMessage: string, error: any) => void;
}

const Html5QrcodeWrapper: React.FC<Html5QrcodeWrapperProps> = ({
  fps = 10,
  qrbox,
  disableFlip = false,
  verbose = false,
  onScan,
  onError,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      #reader {
        position: relative !important;
        padding: 0 !important;
        border: none !important;
      }
      #reader__scan_region {
        position: relative;
        min-height: 400px;
        background: #000000dd;
        border-radius: 16px;
        overflow: hidden;
      }
      #reader__scan_region video {
        max-width: 100%;
        border-radius: 16px;
      }
      #reader__scan_region::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 250px;
        height: 250px;
        transform: translate(-50%, -50%);
        border: 2px solid #0ea5e9;
        border-radius: 16px;
        z-index: 1;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
      }
      #reader__scan_region::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background: #0ea5e9;
        animation: scan 2s linear infinite;
      }
      @keyframes scan {
        0% { transform: translateY(-100px); }
        100% { transform: translateY(100px); }
      }
      #reader__camera_permission_button {
        padding: 12px 24px;
        background: #0ea5e9;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        margin: 16px 0;
        transition: all 0.2s;
      }
      #reader__camera_permission_button:hover {
        background: #0284c7;
      }
      #reader__dashboard {
        padding: 16px !important;
        border: none !important;
        margin: 0 !important;
        background: transparent !important;
      }
      #reader__dashboard_section_swaplink {
        display: none !important;
      }
      #reader__status_span {
        display: none !important;
      }
      .scan-region-highlight-svg {
        stroke: #0ea5e9 !important;
        stroke-width: 4px !important;
      }
      #reader__camera_selection {
        padding: 8px;
        border-radius: 8px;
        border: 1px solid #374151;
        background: #1f2937;
        color: white;
        width: 100%;
        margin-bottom: 16px;
      }
    `;
    document.head.appendChild(style);

    const qrBoxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
      const minEdgePercentage = 0.7;
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
      return {
        width: qrboxSize,
        height: qrboxSize,
      };
    };

    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      {
        fps,
        qrbox: qrBoxFunction,
        aspectRatio: 1,
        disableFlip: false,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      verbose,
    );

    const onScanSuccess = (decodedText: string, decodedResult: any) => {
      setIsScanning(false);
      onScan(decodedText, decodedResult);
    };

    const onScanError = (errorMessage: string, error: any) => {};

    scannerRef.current.render(onScanSuccess, onScanError);
    setIsScanning(true);

    setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
      document.head.removeChild(style);
    };
  }, [fps, verbose, onScan, onError]); // Removed unnecessary dependencies: qrbox, disableFlip

  return (
    <div className="relative text-gray-300">
      <div id="reader" className="overflow-hidden rounded-2xl shadow-lg" />
      {isInitializing ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-2xl">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <span className="text-white">Đang khởi tạo camera...</span>
          </div>
        </div>
      ) : (
        isScanning && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-sky-500">
            <Camera className="h-4 w-4 animate-pulse" />
            <span>Di chuyển camera đến vùng chứa mã QR để quét</span>
          </div>
        )
      )}
    </div>
  );
};

export default Html5QrcodeWrapper;
