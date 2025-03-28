'use client';

import type React from 'react';
import { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Download, Share2, Info, ClipboardCopy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/AlterDialog';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './ui/Toast';

interface EnhancedQRCodeProps {
  result: string;
  electionName: string;
}

const EnhancedQRCode: React.FC<EnhancedQRCodeProps> = ({ result, electionName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const inviteLink = `${window.location.origin}/invite?token=${result}`;

  useEffect(() => {
    if (canvasRef.current) {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src =
        'https://gateway.pinata.cloud/ipfs/bafkreif6omfzsnwhnw72mp3ronvze523g6wlw2jfw4hsnb2mz7djn4lbku';
      logo.onload = () => {
        setLogoLoaded(true);
        generateQR(logo);
      };
    }
  }, []);

  const generateQR = async (logo: HTMLImageElement) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    canvas.width = 400;
    canvas.height = 560;

    const scale = 1;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrCanvas = document.createElement('canvas');
    QRCode.toCanvas(qrCanvas, inviteLink, {
      width: 280 * scale,
      margin: 0,
      color: {
        dark: '#4666FF',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });

    const qrSize = 280 * scale;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = 120 * scale;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    const logoSize = 60 * scale;
    const logoX = qrX + (qrSize - logoSize) / 2;
    const logoY = qrY + (qrSize - logoSize) / 2;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

    ctx.fillStyle = '#1E293B';
    ctx.font = `bold ${24 * scale}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Bầu Cử Blockchain', canvas.width / 2, 80 * scale);

    ctx.font = `${18 * scale}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText(electionName, canvas.width / 2, 445 * scale);

    ctx.font = `${18 * scale}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'left';
    ctx.fillText('Quét mã QR để đăng ký trở thành Cử Tri', 40 * scale, canvas.height - 60 * scale);
    ctx.fillText(`Phiên bầu cử: ${electionName}`, 40 * scale, canvas.height - 30 * scale);

    ctx.strokeStyle = '#4666FF';
    ctx.lineWidth = 2 * scale;

    ctx.beginPath();
    ctx.moveTo(20 * scale, 20 * scale);
    ctx.lineTo(50 * scale, 20 * scale);
    ctx.moveTo(20 * scale, 20 * scale);
    ctx.lineTo(20 * scale, 50 * scale);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width - 20 * scale, canvas.height - 20 * scale);
    ctx.lineTo(canvas.width - 50 * scale, canvas.height - 20 * scale);
    ctx.moveTo(canvas.width - 20 * scale, canvas.height - 20 * scale);
    ctx.lineTo(canvas.width - 20 * scale, canvas.height - 50 * scale);
    ctx.stroke();

    canvas.style.width = `${canvas.width / scale}px`;
    canvas.style.height = `${canvas.height / scale}px`;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `QR_Code_${electionName}.png`;
      link.click();
    }
  };

  const handleShare = () => {
    setShowInfo(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    });
  };

  return (
    <ToastProvider>
      <Card className="w-full max-w-md mx-auto bg-white shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-[#4666FF] to-[#4666FF]/90 pb-6">
          <CardTitle className="text-2xl font-bold text-center text-white">
            Mã QR Mời Cử Tri
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center -mt-4 p-6 bg-white rounded-t-2xl">
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-md"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 bg-gray-50/50 p-6 rounded-b-lg">
          <div className="flex justify-between w-full gap-4">
            <AlertDialog open={showInfo} onOpenChange={setShowInfo}>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1 bg-white text-[#4666FF] hover:bg-[#4666FF]/5 border-[#4666FF]/20 transition-all duration-300 ease-in-out hover:scale-105"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Chia sẻ liên kết
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Chia sẻ liên kết mời</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="w-full p-2 border rounded mt-2"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button onClick={handleCopy}>
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    Sao chép
                  </Button>
                  <AlertDialogAction className="bg-[#4666FF] text-white hover:bg-[#4666FF]/90">
                    Đóng
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-[#4666FF] text-white hover:bg-[#4666FF]/90 transition-all duration-300 ease-in-out hover:scale-105"
            >
              <Download className="mr-2 h-4 w-4" />
              Tải mã QR
            </Button>
          </div>
          <Button
            variant="link"
            className="text-gray-500 hover:text-[#4666FF] transition-all duration-300 ease-in-out hover:scale-105"
            onClick={() => setShowInfo(true)}
          >
            <Info className="mr-1 h-4 w-4" />
            Thông tin thêm
          </Button>
        </CardFooter>
      </Card>

      <ToastViewport />
      {showToast && (
        <Toast>
          <div className="flex">
            <div className="flex-1">
              <ToastTitle>Sao chép thành công</ToastTitle>
              <ToastDescription>Liên kết đã được sao chép vào clipboard.</ToastDescription>
            </div>
            <ToastClose />
          </div>
        </Toast>
      )}
    </ToastProvider>
  );
};

export default EnhancedQRCode;
