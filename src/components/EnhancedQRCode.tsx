'use client';

import type React from 'react';
import { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Download, QrCode, Share2, Link, Copy } from 'lucide-react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './ui/Toast';
import { Input } from './ui/Input';

interface EnhancedQRCodeProps {
  result: string;
  electionName: string;
}

const EnhancedQRCode: React.FC<EnhancedQRCodeProps> = ({ result, electionName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '' });
  const [isGenerating, setIsGenerating] = useState(true);

  const inviteLink = `${window.location.origin}/invite?token=${result}`;
  const shortenedLink =
    inviteLink.length > 30
      ? `${inviteLink.substring(0, 20)}...${inviteLink.substring(inviteLink.length - 10)}`
      : inviteLink;

  useEffect(() => {
    if (canvasRef.current) {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src =
        'https://gateway.pinata.cloud/ipfs/bafkreif6omfzsnwhnw72mp3ronvze523g6wlw2jfw4hsnb2mz7djn4lbku';
      logo.onload = () => {
        generateQR(logo);
        setTimeout(() => setIsGenerating(false), 600);
      };
    }
  }, [result, electionName]);

  const generateQR = async (logo: HTMLImageElement) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Responsive canvas size
    const isMobile = window.innerWidth < 768;
    const scale = isMobile ? 0.8 : 1;

    const size = 400 * scale;
    canvas.width = size;
    canvas.height = size;

    // Background - Trắng cho chế độ sáng, tối cho chế độ tối
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generate QR code
    const qrCanvas = document.createElement('canvas');
    QRCode.toCanvas(qrCanvas, inviteLink, {
      width: 320 * scale,
      margin: 0,
      color: {
        dark: '#000000', // Màu tối cho chế độ sáng
        light: '#FFFFFF', // Màu sáng cho chế độ sáng
      },
      errorCorrectionLevel: 'H',
    });

    // Position QR code
    const qrSize = 320 * scale;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = (canvas.height - qrSize) / 2 + 10 * scale; // Dịch xuống một chút để có chỗ cho tiêu đề

    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Add logo in center of QR code
    const logoSize = 70 * scale;
    const logoX = qrX + (qrSize - logoSize) / 2;
    const logoY = qrY + (qrSize - logoSize) / 2;

    // White background for logo
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    // Add "HoLiHu Blockchain" text at top
    ctx.fillStyle = '#000000'; // Màu sẽ được xử lý bởi CSS
    ctx.font = `bold ${18 * scale}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('HoLiHu Blockchain', canvas.width / 2, 30 * scale);

    // Add border
    ctx.strokeStyle = '#000000'; // Màu viền sẽ được xử lý bởi CSS
    ctx.lineWidth = 1 * scale;
    const borderRadius = 10 * scale;
    const borderPadding = 10 * scale;

    // Rounded rectangle function
    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    roundRect(
      borderPadding,
      borderPadding,
      canvas.width - 2 * borderPadding,
      canvas.height - 2 * borderPadding,
      borderRadius,
    );
    ctx.stroke();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Tạo một canvas mới để vẽ với màu sắc phù hợp cho việc tải xuống
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = canvas.width;
      downloadCanvas.height = canvas.height;
      const ctx = downloadCanvas.getContext('2d');

      if (ctx) {
        // Vẽ nền tối cho chế độ tối
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

        // Vẽ nội dung từ canvas gốc với màu đảo ngược
        ctx.drawImage(canvas, 0, 0);

        // Đảo ngược màu sắc cho chế độ tối
        const imageData = ctx.getImageData(0, 0, downloadCanvas.width, downloadCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Đảo ngược màu cho tất cả các pixel trừ logo
          if (!(data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 0)) {
            data[i] = 255 - data[i]; // red
            data[i + 1] = 255 - data[i + 1]; // green
            data[i + 2] = 255 - data[i + 2]; // blue
          }
        }
        ctx.putImageData(imageData, 0, 0);

        // Tạo URL và tải xuống
        const image = downloadCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `HoLiHu_QR_${electionName.replace(/\s+/g, '_')}.png`;
        link.click();

        setToastMessage({
          title: 'Tải xuống thành công',
          description: 'Mã QR đã được tải xuống thiết bị của bạn.',
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
  };

  const handleShare = async () => {
    try {
      const canvas = canvasRef.current;
      if (canvas && navigator.share) {
        // Tạo một canvas mới để vẽ với màu sắc phù hợp cho việc chia sẻ
        const shareCanvas = document.createElement('canvas');
        shareCanvas.width = canvas.width;
        shareCanvas.height = canvas.height;
        const ctx = shareCanvas.getContext('2d');

        if (ctx) {
          // Vẽ nền tối cho chế độ tối
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height);

          // Vẽ nội dung từ canvas gốc với màu đảo ngược
          ctx.drawImage(canvas, 0, 0);

          // Đảo ngược màu sắc cho chế độ tối
          const imageData = ctx.getImageData(0, 0, shareCanvas.width, shareCanvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            // Đảo ngược màu cho tất cả các pixel trừ logo
            if (!(data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 0)) {
              data[i] = 255 - data[i]; // red
              data[i + 1] = 255 - data[i + 1]; // green
              data[i + 2] = 255 - data[i + 2]; // blue
            }
          }
          ctx.putImageData(imageData, 0, 0);

          // Tạo blob và chia sẻ
          const blob = await new Promise<Blob>((resolve) => {
            shareCanvas.toBlob((blob) => {
              if (blob) resolve(blob);
            }, 'image/png');
          });

          const file = new File([blob], `HoLiHu_QR_${electionName.replace(/\s+/g, '_')}.png`, {
            type: 'image/png',
          });

          await navigator.share({
            title: `HoLiHu Blockchain - Mã QR mời tham gia ${electionName}`,
            text: 'Quét mã QR này để tham gia phiên bầu cử trên HoLiHu Blockchain',
            files: [file],
          });
        }
      } else {
        handleDownload();
      }
    } catch (error) {
      console.error('Lỗi khi chia sẻ:', error);
      handleDownload();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        setToastMessage({
          title: 'Sao chép thành công',
          description: 'Đường dẫn mời đã được sao chép vào clipboard.',
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      })
      .catch((err) => {
        console.error('Lỗi khi sao chép:', err);
      });
  };

  return (
    <ToastProvider>
      <Card className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-200 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <QrCode className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              Mã QR Bầu Cử
            </CardTitle>
          </div>
          <CardDescription className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Quét mã QR này để tham gia phiên bầu cử
          </CardDescription>
        </CardHeader>

        <CardContent className="flex justify-center p-6 relative">
          <div className="relative">
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-lg z-10">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent animate-spin mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Đang tạo mã QR...</p>
                </div>
              </div>
            )}
            <div className="p-4 bg-white dark:bg-[#0f172a] rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
              <canvas
                ref={canvasRef}
                className="rounded-lg dark:invert"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>
        </CardContent>

        {/* Link mã mời */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Link className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <Input
                value={shortenedLink}
                readOnly
                className="pl-9 pr-20 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 border-0 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Sao chép
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30">
          <span>
            Phiên bầu cử:{' '}
            <span className="text-gray-700 dark:text-gray-300 font-medium">{electionName}</span>
          </span>
        </div>

        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700/50">
          <Button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-all duration-300 border-0"
          >
            <Download className="mr-2 h-4 w-4" />
            Tải mã QR
          </Button>
          {navigator.share && (
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Chia sẻ
            </Button>
          )}
        </CardFooter>
      </Card>

      <ToastViewport className="fixed bottom-0 right-0 p-4 flex flex-col gap-2 w-full max-w-sm z-50" />
      {showToast && (
        <Toast className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md">
          <div className="flex">
            <div className="flex-1">
              <ToastTitle className="text-gray-900 dark:text-gray-100 text-sm">
                {toastMessage.title}
              </ToastTitle>
              <ToastDescription className="text-gray-600 dark:text-gray-400 text-xs">
                {toastMessage.description}
              </ToastDescription>
            </div>
            <ToastClose className="text-gray-500 dark:text-gray-400" />
          </div>
        </Toast>
      )}
    </ToastProvider>
  );
};

export default EnhancedQRCode;
