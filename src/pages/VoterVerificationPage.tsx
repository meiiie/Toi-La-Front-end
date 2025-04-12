import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alter';
import {
  CheckCircle,
  AlertTriangle,
  Loader,
  Lock,
  Key,
  UserPlus,
  Wallet,
  ArrowRight,
  Home,
} from 'lucide-react';
import { AppDispatch, RootState } from '../store/store';
import { xacThucTokenCuTri } from '../store/slice/maOTPSlice';

/**
 * Trang xác thực cử tri với thiết kế tân vị lai kết hợp yếu tố blockchain
 */
const VoterVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const dispatch = useDispatch<AppDispatch>();
  const { dangTai, loi, xacThucTokenThanhCong, thongTinXacThuc } = useSelector(
    (state: RootState) => state.maOTP,
  );

  const [status, setStatus] = useState<
    'verifying' | 'success' | 'needWallet' | 'needAccount' | 'error'
  >('verifying');
  const [message, setMessage] = useState('Đang xác thực...');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [verifyProgress, setVerifyProgress] = useState(0);

  // Hiệu ứng đếm phần trăm xác thực
  useEffect(() => {
    if (status === 'verifying') {
      const interval = setInterval(() => {
        setVerifyProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [status]);

  // Xác thực token
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token xác thực không hợp lệ');
        return;
      }

      try {
        // Dispatch action thay vì gọi API trực tiếp
        await dispatch(xacThucTokenCuTri(token));
      } catch (error) {
        console.error('Error during token verification:', error);
      }
    };

    verifyToken();
  }, [token, dispatch]);

  // Xử lý kết quả xác thực từ Redux store
  useEffect(() => {
    if (dangTai) return;

    if (loi) {
      setStatus('error');
      setMessage(loi);
      setVerifyProgress(100);
      return;
    }

    if (thongTinXacThuc) {
      // Một lần nữa sử dụng setTimeout để giữ animation
      setTimeout(() => {
        if (xacThucTokenThanhCong) {
          if (thongTinXacThuc.hasWallet) {
            setStatus('success');
            setMessage('Xác thực thành công! Bạn đã sẵn sàng tham gia bỏ phiếu trên blockchain.');
          } else if (thongTinXacThuc.hasAccount) {
            setStatus('needWallet');
            setMessage(
              'Email đã được xác thực, nhưng bạn cần liên kết ví blockchain để tham gia bỏ phiếu.',
            );
            setAccountId(thongTinXacThuc.accountId || null);
          } else {
            setStatus('needAccount');
            setMessage(
              'Email đã được xác thực, nhưng bạn cần tạo tài khoản và liên kết ví blockchain để tham gia bỏ phiếu.',
            );
          }
        } else {
          setStatus('error');
          setMessage(thongTinXacThuc.message || 'Xác thực không thành công');
        }
        setVerifyProgress(100);
      }, 1500);
    }
  }, [dangTai, loi, xacThucTokenThanhCong, thongTinXacThuc]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-blue-900 p-4 relative overflow-hidden">
      {/* Background elements - Binary/blockchain effect */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-blue-400 font-mono text-xs"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s infinite linear`,
                opacity: 0.7,
              }}
            >
              {Math.random() > 0.5 ? '0' : '1'}
            </div>
          ))}

          {/* Blockchain nodes */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`node-${i}`}
              className="absolute w-4 h-4 rounded-full bg-blue-400"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `pulse ${3 + Math.random() * 5}s infinite ease-in-out`,
                opacity: 0.3,
              }}
            />
          ))}

          {/* Blockchain connections */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
                <stop offset="50%" stopColor="rgba(59, 130, 246, 0.5)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
              </linearGradient>
            </defs>
            {Array.from({ length: 10 }).map((_, i) => {
              const x1 = Math.random() * 100;
              const y1 = Math.random() * 100;
              const x2 = Math.random() * 100;
              const y2 = Math.random() * 100;
              return (
                <line
                  key={`line-${i}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="url(#line-gradient)"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              );
            })}
          </svg>
        </div>
      </div>

      <Card className="w-full max-w-md bg-gray-900/80 backdrop-blur-md border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white relative z-10 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />

        <CardHeader className="text-center relative z-10">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(59,130,246,0.7)]">
            {status === 'verifying' && <Loader className="h-8 w-8 text-white animate-spin" />}
            {status === 'success' && <CheckCircle className="h-8 w-8 text-white" />}
            {status === 'needWallet' && <Wallet className="h-8 w-8 text-white" />}
            {status === 'needAccount' && <UserPlus className="h-8 w-8 text-white" />}
            {status === 'error' && <AlertTriangle className="h-8 w-8 text-white" />}
          </div>
          <CardTitle className="text-2xl font-bold text-white flex flex-col items-center gap-2">
            <div className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Xác thực cử tri
            </div>
            <div className="text-sm font-light text-blue-300">HoLiHu Blockchain</div>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10">
          {status === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-full h-2 bg-gray-700 rounded-full mb-6 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${verifyProgress}%` }}
                />
              </div>
              <div className="flex items-center">
                <Key className="h-5 w-5 mr-2 text-blue-300" />
                <p className="text-blue-300">{message}</p>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Đang xác thực token an toàn trên blockchain...
              </p>
            </div>
          )}

          {status === 'success' && (
            <Alert className="bg-green-900/30 border-green-500/30 mb-4">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <AlertTitle className="font-bold text-green-300">Xác thực thành công!</AlertTitle>
              <AlertDescription className="text-green-300/90">
                {message}
                <div className="mt-2 flex items-center text-sm text-green-300/70">
                  <Lock className="h-4 w-4 mr-1" />
                  Thông tin của bạn đã được mã hóa và lưu trữ an toàn trên blockchain
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status === 'needWallet' && (
            <Alert className="bg-blue-900/30 border-blue-500/30 mb-4">
              <Wallet className="h-5 w-5 text-blue-400" />
              <AlertTitle className="font-bold text-blue-300">Xác thực email thành công</AlertTitle>
              <AlertDescription className="text-blue-300/90">
                {message}
                <div className="mt-2 flex items-center text-sm text-blue-300/70">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Bạn cần liên kết ví để hoàn tất quá trình xác thực
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status === 'needAccount' && (
            <Alert className="bg-purple-900/30 border-purple-500/30 mb-4">
              <UserPlus className="h-5 w-5 text-purple-400" />
              <AlertTitle className="font-bold text-purple-300">
                Xác thực email thành công
              </AlertTitle>
              <AlertDescription className="text-purple-300/90">
                {message}
                <div className="mt-2 flex items-center text-sm text-purple-300/70">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Bạn cần tạo tài khoản và liên kết ví để hoàn tất quá trình, sau khi tạo tài khoản
                  xong, hãy nhấn lại liên kết trên email.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert className="bg-red-900/30 border-red-500/30 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <AlertTitle className="font-bold text-red-300">Lỗi xác thực</AlertTitle>
              <AlertDescription className="text-red-300/90">
                {message}
                <div className="mt-2 flex items-center text-sm text-red-300/70">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Vui lòng liên hệ với quản trị viên để được hỗ trợ
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 relative z-10">
          {status === 'success' && (
            <Button
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 flex items-center"
              asChild
            >
              <Link to="/app/user-elections">
                Đi đến trang bầu cử
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}

          {status === 'needWallet' && (
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 flex items-center"
              asChild
            >
              <Link to={`/app/user/profile/${accountId}/wallet`}>
                Liên kết ví blockchain
                <Wallet className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}

          {status === 'needAccount' && (
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 flex items-center"
              asChild
            >
              <Link to="/register">
                Tạo tài khoản
                <UserPlus className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center justify-center"
            asChild
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Về trang chủ
            </Link>
          </Button>
        </CardFooter>

        {/* Hiệu ứng ánh sáng chạy qua thẻ */}
        <div
          className={`absolute inset-0 pointer-events-none overflow-hidden ${status !== 'verifying' ? 'hidden' : ''}`}
        >
          <div
            className="absolute h-44 w-20 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-[100px] -translate-y-24 -rotate-45 animate-[shimmer_2s_infinite]"
            style={{
              top: '0%',
              left: '0%',
              transform: 'translateX(-100%) rotate(-45deg)',
              animation: 'shimmer 1.5s infinite linear',
            }}
          />
        </div>
      </Card>

      {/* Thêm CSS cho các animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) rotate(-45deg);
          }
          100% {
            transform: translateX(500%) rotate(-45deg);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default VoterVerificationPage;
