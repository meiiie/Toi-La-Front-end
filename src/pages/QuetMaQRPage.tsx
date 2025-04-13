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
  const [processingImage, setProcessingImage] = useState(false);
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
    console.error('QR Error:', error);
    setError(message);
    setIsValidating(true); // Ẩn ô input khi có lỗi
    setProcessingImage(false);
  };

  // Hàm tiền xử lý hình ảnh trước khi phân tích QR
  const preprocessImage = (img: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');

    // Kích thước tối đa để xử lý (giảm kích thước ảnh quá lớn)
    const MAX_SIZE = 1000;
    let width = img.width;
    let height = img.height;

    // Tính toán tỷ lệ để giảm kích thước nếu cần
    if (width > MAX_SIZE || height > MAX_SIZE) {
      const ratio = width / height;
      if (width > height) {
        width = MAX_SIZE;
        height = Math.floor(width / ratio);
      } else {
        height = MAX_SIZE;
        width = Math.floor(height * ratio);
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Vẽ hình ảnh với kích thước mới
    ctx.drawImage(img, 0, 0, width, height);

    return canvas;
  };

  // Hàm cố gắng lọc lỗi nhiễu, tăng độ tương phản và làm rõ hình ảnh
  const enhanceImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Tăng độ tương phản và chuyển sang đen trắng để dễ nhận diện
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Tính giá trị grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Tăng độ tương phản (threshold đơn giản)
      const threshold = 120;
      const newValue = gray < threshold ? 0 : 255;

      data[i] = data[i + 1] = data[i + 2] = newValue;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      setError(null);

      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        handleError('File không hợp lệ. Vui lòng chọn file hình ảnh.', 'Invalid file type');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              // Bước 1: Tiền xử lý hình ảnh
              const processedCanvas = preprocessImage(img);

              // Bước 2: Tăng cường chất lượng hình ảnh
              const enhancedCanvas = enhanceImage(processedCanvas);

              // Bước 3: Thử phân tích ở nhiều kích thước
              let code = null;
              const ctx = enhancedCanvas.getContext('2d');

              if (ctx) {
                const imageData = ctx.getImageData(
                  0,
                  0,
                  enhancedCanvas.width,
                  enhancedCanvas.height,
                );
                code = jsQR(imageData.data, imageData.width, imageData.height);

                // Nếu không thành công, thử các phương pháp khác
                if (!code) {
                  // Phương pháp 1: Đảo ngược màu sắc
                  const invertedData = new Uint8ClampedArray(imageData.data);
                  for (let i = 0; i < invertedData.length; i += 4) {
                    invertedData[i] = 255 - invertedData[i];
                    invertedData[i + 1] = 255 - invertedData[i + 1];
                    invertedData[i + 2] = 255 - invertedData[i + 2];
                  }
                  const invertedImageData = new ImageData(
                    invertedData,
                    imageData.width,
                    imageData.height,
                  );
                  ctx.putImageData(invertedImageData, 0, 0);
                  code = jsQR(invertedImageData.data, imageData.width, imageData.height);
                }
              }

              if (code) {
                processQRData(code.data);
                setProcessingImage(false);
              } else {
                // Nếu tất cả các phương pháp đều thất bại
                handleError(
                  'Không thể đọc mã QR từ ảnh. Vui lòng thử lại với ảnh khác hoặc ảnh có chất lượng tốt hơn.',
                  'QR code not found',
                );
              }
            } catch (err) {
              handleError('Lỗi khi xử lý hình ảnh. Vui lòng thử lại.', err);
            }
          };
          img.onerror = () => {
            handleError('Lỗi khi tải hình ảnh. Vui lòng thử lại.', 'Image load error');
          };
          img.src = e.target?.result as string;
        } catch (err) {
          handleError('Lỗi khi đọc file. Vui lòng thử lại.', err);
        }
      };
      reader.onerror = () => {
        handleError('Lỗi khi đọc file. Vui lòng thử lại.', 'File read error');
      };
      reader.readAsDataURL(file);
    }
  };

  const processQRData = (data: string) => {
    try {
      let type: QRDataType = 'TEXT';

      // Nhật ký dữ liệu đầu vào để gỡ lỗi
      console.log('QR Data content:', data);

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
        try {
          const url = new URL(data);
          console.log('URL parsed:', url.toString());
          console.log('URL params:', Array.from(url.searchParams.entries()));

          const tokenParam = url.searchParams.get('token');
          if (tokenParam) {
            setToken(tokenParam);
            console.log('Token found:', tokenParam);

            dispatch(xacThucPhieuMoi(tokenParam))
              .unwrap()
              .then(() => {
                setIsValidating(false);
                setError(null);
              })
              .catch((err) => {
                handleError('Lỗi xác thực mã mời: ' + (err.message || 'Không xác định'), err);
              });
          } else {
            // Thử phương pháp thay thế để tìm token
            // Kiểm tra xem URL có chứa `/invite/` hoặc mẫu tương tự không
            const urlParts = url.pathname.split('/');
            const possibleToken = urlParts[urlParts.length - 1];

            if (possibleToken && possibleToken.length > 10) {
              console.log('Trying alternative token from path:', possibleToken);
              setToken(possibleToken);

              dispatch(xacThucPhieuMoi(possibleToken))
                .unwrap()
                .then(() => {
                  setIsValidating(false);
                  setError(null);
                })
                .catch(() => {
                  setError('Không tìm thấy mã mời hợp lệ trong URL.');
                  setIsValidating(true);
                });
            } else {
              setError('Không tìm thấy mã mời hợp lệ trong URL.');
              setIsValidating(true);
            }
          }
        } catch (urlError) {
          console.error('URL parsing error:', urlError);

          // Nếu URL không hợp lệ, kiểm tra xem dữ liệu có phải là token trực tiếp không
          if (data.length > 10 && !data.includes(' ')) {
            console.log('Trying direct token:', data);
            setToken(data);

            dispatch(xacThucPhieuMoi(data))
              .unwrap()
              .then(() => {
                setIsValidating(false);
                setError(null);
              })
              .catch(() => {
                setError('Mã QR không chứa URL hợp lệ hoặc mã mời.');
                setIsValidating(true);
              });
          } else {
            setError('URL trong mã QR không hợp lệ.');
            setIsValidating(true);
          }
        }
      } else {
        // Thử xem dữ liệu văn bản có phải là token trực tiếp không
        if (data.length > 10 && !data.includes(' ')) {
          console.log('Trying direct token from text:', data);
          setToken(data);

          dispatch(xacThucPhieuMoi(data))
            .unwrap()
            .then(() => {
              setIsValidating(false);
              setError(null);
            })
            .catch(() => {
              setError('Mã QR không chứa mã mời hợp lệ.');
              setIsValidating(true);
            });
        } else {
          setError('Mã QR không hợp lệ. Hãy quét mã QR từ hệ thống HoLiHu Blockchain.');
          setIsValidating(true);
        }
      }
    } catch (err) {
      handleError('Lỗi khi xử lý dữ liệu mã QR.', err);
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
                  disabled={processingImage}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Bắt đầu quét
                </Button>
                <div className="relative">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    variant="outline"
                    disabled={processingImage}
                  >
                    {processingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý ảnh...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Tải lên ảnh mã QR
                      </>
                    )}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={processingImage}
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
