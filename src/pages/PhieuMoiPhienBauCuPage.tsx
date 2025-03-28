'use client';

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { xacThucPhieuMoi, thamGiaPhienBauCu } from '../store/slice/phieuMoiPhienBauCuSlice';
import { guiOtp, xacMinhOtp } from '../store/slice/maOTPSlice';
import type { RootState, AppDispatch } from '../store/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import ModalOTP from '../components/ModalOTP';
import {
  ToastProvider,
  Toast,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '../components/ui/Toast';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface ErrorState {
  message: string;
  code: number;
}

export default function PhieuMoiPhienBauCuPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [token, setToken] = useState<string | null>(null);
  const [sdt, setSdt] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { phieuMoi, dangTai, loi } = useSelector((state: RootState) => state.phieuMoiPhienBauCu);
  const { phienDangNhapChiTiet } = useSelector((state: RootState) => state.phienDangNhap);
  const { guiOtpThanhCong, xacMinhOtpThanhCong } = useSelector((state: RootState) => state.maOTP);
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      if (phienDangNhapChiTiet) {
        dispatch(xacThucPhieuMoi(tokenParam))
          .unwrap()
          .catch((err) => {
            handleError(err);
          });
      } else {
        navigate(`/login?redirectTo=${encodeURIComponent(`/invite?token=${tokenParam}`)}`);
      }
    } else {
      setError({ message: 'Không tìm thấy mã mời hợp lệ.', code: 404 });
      setIsValidating(false);
    }
  }, [searchParams, dispatch, phienDangNhapChiTiet, navigate]);

  useEffect(() => {
    if (phieuMoi) {
      setIsValidating(false);
    }
  }, [phieuMoi]);

  useEffect(() => {
    if (loi) {
      handleError(loi);
    }
  }, [loi]);

  const handleError = (error: any) => {
    let errorState: ErrorState = {
      message: 'Đã xảy ra lỗi không xác định.',
      code: 500,
    };

    if (typeof error === 'string') {
      if (error.includes('400')) {
        errorState = { message: 'Yêu cầu không hợp lệ.', code: 400 };
        setError(errorState);
      } else if (error.includes('401')) {
        errorState = {
          message: 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại.',
          code: 401,
        };
        setError(errorState);
      } else if (error.includes('404')) {
        errorState = { message: 'Không tìm thấy phiếu mời hoặc phiên bầu cử.', code: 404 };
        setError(errorState);
      } else if (error.includes('409')) {
        errorState = { message: 'Bạn đã tham gia phiên bầu cử này.', code: 409 };
        setError(errorState);
      } else if (error.includes('500')) {
        errorState = { message: 'Lỗi máy chủ. Vui lòng thử lại sau.', code: 500 };
        setError(errorState);
      } else {
        errorState = {
          message: `Đã xảy ra lỗi: ${error}`,
          code: 500,
        };
        setError(errorState);
      }
    } else if (error.response) {
      const status = error.response.status;
      if (status === 400) {
        errorState = { message: 'Yêu cầu không hợp lệ.', code: 400 };
        setError(errorState);
      } else if (status === 401) {
        errorState = {
          message: 'Bạn không có quyền truy cập. Vui lòng đăng nhập lại.',
          code: 401,
        };
        setError(errorState);
      } else if (status === 404) {
        errorState = { message: 'Không tìm thấy phiếu mời hoặc phiên bầu cử.', code: 404 };
        setError(errorState);
      } else if (status === 409) {
        errorState = { message: 'Bạn đã tham gia phiên bầu cử này.', code: 409 };
        setError(errorState);
      } else if (status === 500) {
        errorState = { message: 'Lỗi máy chủ. Vui lòng thử lại sau.', code: 500 };
        setError(errorState);
      } else {
        errorState = {
          message: `Đã xảy ra lỗi: ${error.response.statusText}`,
          code: status,
        };
        setError(errorState);
      }
    } else if (error.request) {
      errorState = {
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
        code: 0,
      };
      setError(errorState);
    }

    setIsValidating(false);
  };

  const handleJoin = async () => {
    if (token && user?.email) {
      try {
        setIsOtpModalOpen(true);
        await dispatch(guiOtp(user.email)).unwrap();
      } catch (error) {
        handleError(error);
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
        handleError(error);
      }
    }
  };

  const handleResendOtp = () => {
    if (user?.email) {
      dispatch(guiOtp(user.email)).unwrap().catch(handleError);
    }
  };

  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Đang xác thực mã mời...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="mr-2" />
              Lỗi {error.code}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/')}>Quay lại trang chủ</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Tham gia phiên bầu cử</CardTitle>
            <CardDescription>Nhập số điện thoại của bạn để tham gia</CardDescription>
          </CardHeader>
          <CardContent>
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
}
