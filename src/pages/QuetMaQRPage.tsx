'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertTriangle, Upload, QrCode, ImageIcon, CheckCircle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import Html5QrcodeWrapper from '../components/Html5QrcodeWrapper';
import ModalOTP from '../components/ModalOTP';
import { xacThucPhieuMoi, thamGiaPhienBauCu } from '../store/slice/phieuMoiPhienBauCuSlice';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import { guiOtp, xacMinhOtp } from '../store/slice/maOTPSlice';
import type { RootState, AppDispatch } from '../store/store';
import { Loader2 } from 'lucide-react';
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from '../components/ui/Toast';
import { clearState } from '../store/slice/phieuMoiPhienBauCuSlice';

type QRDataType = 'TEXT' | 'URL' | 'EMAIL' | 'PHONE' | 'SMS' | 'WIFI' | 'VCARD' | 'OTHER';

interface QRData {
  type: QRDataType;
  content: string;
}

const QuetMaQRPage: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sdt, setSdt] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { phieuMoi, dangTai, loi } = useSelector((state: RootState) => state.phieuMoiPhienBauCu);
  const { cuocBauCu } = useSelector((state: RootState) => state.cuocBauCuById);
  const { guiOtpThanhCong, xacMinhOtpThanhCong } = useSelector((state: RootState) => state.maOTP);
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  useEffect(() => {
    dispatch(clearState());
    if (phieuMoi) {
      setIsValidating(false);
      setError(null);
      dispatch(fetchPhienBauCuById(phieuMoi.phienBauCuId));
      dispatch(fetchCuocBauCuById(phieuMoi.cuocBauCuId));
    }
  }, [phieuMoi, dispatch]);

  useEffect(() => {
    if (loi) {
      handleError('Đã xảy ra lỗi khi quét mã QR. Vui lòng thử lại.', loi);
    }
  }, [loi]);

  const handleScan = (decodedText: string) => {
    processQRData(decodedText);
    setScanning(false);
    setError(null); // Reset error when scanning is successful
  };

  const handleError = (message: string, error: any) => {
    setError(message);
    setIsValidating(true); // Ẩn ô input khi có lỗi
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, img.width, img.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              processQRData(code.data);
              setError(null); // Reset error when file upload is successful
            } else {
              setError('Không thể đọc mã QR từ ảnh. Vui lòng thử lại với ảnh khác.');
              setIsValidating(true); // Ẩn ô input khi có lỗi
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const processQRData = (data: string) => {
    let type: QRDataType = 'TEXT';
    if (data.startsWith('http://') || data.startsWith('https://')) {
      type = 'URL';
    } else if (data.startsWith('mailto:')) {
      type = 'EMAIL';
    } else if (data.startsWith('tel:')) {
      type = 'PHONE';
    } else if (data.startsWith('sms:')) {
      type = 'SMS';
    } else if (data.startsWith('WIFI:')) {
      type = 'WIFI';
    } else if (data.startsWith('BEGIN:VCARD')) {
      type = 'VCARD';
    }
    setScannedData({ type, content: data });
    if (type === 'URL') {
      const url = new URL(data);
      const tokenParam = url.searchParams.get('token');
      if (tokenParam) {
        setToken(tokenParam);
        dispatch(xacThucPhieuMoi(tokenParam))
          .unwrap()
          .then(() => {
            setIsValidating(false);
            setError(null); // Reset error when token is valid
          })
          .catch((err) => {
            handleError('Error message', err);
          });
      } else {
        setError('Không tìm thấy mã mời hợp lệ.');
        setIsValidating(true); // Ẩn ô input khi có lỗi
      }
    } else {
      setError('Mã QR không hợp lệ.');
      setIsValidating(true); // Ẩn ô input khi có lỗi
    }
  };

  const handleJoin = async () => {
    if (token && user?.email) {
      try {
        setIsOtpModalOpen(true);
        await dispatch(guiOtp(user.email)).unwrap();
      } catch (error) {
        handleError('Đã xảy ra lỗi khi gửi OTP.', error);
      }
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (token && user?.email) {
      try {
        const response = await dispatch(xacMinhOtp({ email: user.email, otp })).unwrap();
        if (response.success) {
          await handleThamGiaPhienBauCu();
        } else {
          setOtpError('Mã OTP không hợp lệ. Vui lòng thử lại.');
        }
      } catch (error) {
        setOtpError('Mã OTP không hợp lệ. Vui lòng thử lại.');
      }
    }
  };

  const handleThamGiaPhienBauCu = async () => {
    if (token) {
      try {
        await dispatch(thamGiaPhienBauCu({ token, sdt })).unwrap();
        setToastMessage('Tham gia phiên bầu cử thành công!');
        setIsOtpModalOpen(false);
        setTimeout(() => {
          navigate(`/app/elections/${phieuMoi?.cuocBauCuId}`);
        }, 2000);
      } catch (error) {
        handleError('Đã xảy ra lỗi khi tham gia phiên bầu cử.', error);
      }
    }
  };

  const handleResendOtp = () => {
    if (user?.email) {
      dispatch(guiOtp(user.email))
        .unwrap()
        .catch((error) => handleError('Đã xảy ra lỗi khi gửi OTP.', error));
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <CardTitle className="text-xl font-semibold text-white">Quét mã QR</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {scanning ? (
              <div className="relative">
                <Html5QrcodeWrapper
                  fps={10}
                  qrbox={Math.max(250, 50)}
                  disableFlip={false}
                  verbose={false}
                  onScan={handleScan}
                  onError={handleError}
                />
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Quét ảnh có sẵn
                    </Button>
                    <Button
                      onClick={() => setScanning(false)}
                      className="bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Mã QR của tôi
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={() => setScanning(true)}
                  className="w-full bg-sky-500 hover:bg-sky-600"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Bắt đầu quét
                </Button>
                <div className="relative">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Tải lên ảnh mã QR
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            )}
            {scannedData && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <h3 className="font-semibold mb-2 text-white">Thông tin mã QR:</h3>
                <p className="mb-2 text-gray-300">
                  <strong className="text-white">Loại:</strong> {scannedData.type}
                </p>
                <p className="mb-4 break-words text-gray-300">
                  <strong className="text-white">Nội dung:</strong> {scannedData.content}
                </p>
                {token && !isValidating && !error && (
                  <div className="space-y-4">
                    {cuocBauCu && (
                      <div className="mb-4">
                        <p className="text-gray-300">
                          <strong className="text-white">Tên cuộc bầu cử:</strong>{' '}
                          {cuocBauCu.tenCuocBauCu}
                        </p>
                        <p className="text-gray-300">
                          <strong className="text-white">Ngày bắt đầu:</strong>{' '}
                          {cuocBauCu.ngayBatDau}
                        </p>
                        <p className="text-gray-300">
                          <strong className="text-white">Ngày kết thúc:</strong>{' '}
                          {cuocBauCu.ngayKetThuc}
                        </p>
                      </div>
                    )}
                    <Input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={sdt}
                      onChange={(e) => setSdt(e.target.value)}
                      className="mb-4"
                    />
                    <Button onClick={handleJoin} disabled={dangTai || !sdt} className="w-full">
                      {dangTai ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        'Tham gia'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {error && (
              <div className="mt-4 text-red-400 flex items-center p-4 bg-red-900/20 rounded-lg">
                <AlertTriangle className="mr-2 h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <ModalOTP
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          onVerify={handleVerifyOtp}
          email={user?.email || ''}
          onResend={handleResendOtp}
          error={otpError}
        />

        {toastMessage && (
          <Toast variant="default" className="bg-green-500 text-white">
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              <ToastTitle>Thành công</ToastTitle>
            </div>
            <ToastDescription>{toastMessage}</ToastDescription>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport />
      </div>
    </ToastProvider>
  );
};

export default QuetMaQRPage;
