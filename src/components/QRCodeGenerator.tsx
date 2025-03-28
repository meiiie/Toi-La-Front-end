import type React from 'react';
import QRCode from 'react-qr-code';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Share2, Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  inviteLink: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ inviteLink }) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    // You can add a toast notification here to inform the user that the link has been copied
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('QRCode');
    if (!svg) {
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'QRCode';
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Mã QR Mời Cử Tri</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <QRCode id="QRCode" value={inviteLink} size={200} />
        <Input
          value={inviteLink}
          readOnly
          className="w-full"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleCopyLink} className="bg-blue-500 hover:bg-blue-600 text-white">
          <Share2 className="mr-2 h-4 w-4" />
          Sao chép liên kết
        </Button>
        <Button onClick={handleDownloadQR} className="bg-green-500 hover:bg-green-600 text-white">
          <Download className="mr-2 h-4 w-4" />
          Tải mã QR
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QRCodeGenerator;
