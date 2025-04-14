'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store/store';
import { login, refreshJwtToken, loginWithMetaMask } from '../store/slice/dangNhapTaiKhoanSlice';
import { fetchLatestSession } from '../store/slice/phienDangNhapSlice';
import { useWeb3 } from '../context/Web3Context';
import LoginForm from '../features/LoginForm';
import { users } from '../data/constants';
import SEO from '../components/SEO';
import HexagonBackground from '../components/ui/hexagon-background';
import BlockchainNodes from '../components/ui/blockchain-nodes';
import {
  AlertCircle,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  Key,
  Fingerprint,
  Database,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { FaEthereum } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Use-toast';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
// Import utilities để xử lý cache quyền truy cập
import { clearAllAccessCache, resetSecurityState } from '../utils/authUtils';

// Đã được cung cấp từ context
declare global {
  interface Window {
    ethereum: any;
  }
}

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'metamask'>('credentials');
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(true);
  const [isSigningWithMetaMask, setIsSigningWithMetaMask] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dangTai } = useSelector(
    (state: RootState) => state.dangNhapTaiKhoan as { dangTai: boolean },
  );
  const { phienDangNhapChiTiet } = useSelector((state: RootState) => state.phienDangNhap);
  const { connectWallet, isConnecting, isMetaMaskInstalled, currentAccount, signMessage } =
    useWeb3();
  const metaMaskLoginTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Initialize blockchain nodes for animation
  const [blockchainNodes, setBlockchainNodes] = useState<
    Array<{ x: number; y: number; size: number }>
  >([]);

  useEffect(() => {
    // Generate random blockchain nodes for the animation
    const nodes = Array.from({ length: 12 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
    }));
    setBlockchainNodes(nodes);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (metaMaskLoginTimeoutRef.current) {
        clearTimeout(metaMaskLoginTimeoutRef.current);
      }
    };
  }, []);

  const handleAutoLogin = useCallback(async () => {
    try {
      setIsAutoLoggingIn(true);

      // Chỉ thực hiện tự động đăng nhập với JWT, không tự động đăng nhập với MetaMask
      const result = await dispatch(refreshJwtToken());

      if (refreshJwtToken.fulfilled.match(result)) {
        const { accessToken, user } = result.payload;
        if (accessToken) {
          // Đặt thông tin người dùng hiện tại
          resetSecurityState(user.id);

          // Lưu thông tin người dùng
          localStorage.setItem(
            'user_data',
            JSON.stringify({
              id: user.id,
              username: user.tenDangNhap,
              role: user.vaiTro?.tenVaiTro || 'Nguoi Dung',
            }),
          );

          dispatch(await fetchLatestSession(user.id.toString()));
          const redirectTo = searchParams.get('redirectTo');
          localStorage.setItem('isLoggedOut', 'false');

          if (redirectTo) {
            navigate(decodeURIComponent(redirectTo));
          } else {
            navigate('/main');
          }
          addToast({
            title: 'Thành công',
            description: 'Đăng nhập tự động thành công!',
            variant: 'success',
            duration: 3000,
          });
        }
      }
    } catch (err) {
      // Don't show error for auto login failure
      console.log('Auto login failed:', err);
    } finally {
      setIsAutoLoggingIn(false);
    }
  }, [dispatch, navigate, searchParams, addToast, executeRecaptcha]);

  useEffect(() => {
    // Perform auto login when component mounts
    handleAutoLogin();

    // Get saved username if available
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, [handleAutoLogin]);

  useEffect(() => {
    if (phienDangNhapChiTiet) {
      const redirectTo = searchParams.get('redirectTo');

      if (redirectTo) {
        navigate(decodeURIComponent(redirectTo));
      } else {
        navigate('/main');
      }
    }
  }, [phienDangNhapChiTiet, navigate, searchParams]);

  const handleReCaptchaVerify = useCallback((token: string) => {
    setRecaptchaToken(token);
  }, []);

  // Cập nhật cách xử lý reCAPTCHA trong LoginPage
  // Thêm useEffect để xử lý reCAPTCHA khi component mount

  useEffect(() => {
    // Xử lý reCAPTCHA khi component mount
    const handleReCaptcha = async () => {
      if (executeRecaptcha) {
        try {
          const token = await executeRecaptcha('login_page');
          setRecaptchaToken(token);
        } catch (error) {
          console.error('reCAPTCHA error:', error);
        }
      }
    };

    handleReCaptcha();
  }, [executeRecaptcha]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    try {
      setError('');

      if (!recaptchaToken) {
        setError('Không thể xác minh reCAPTCHA, vui lòng thử lại');
        return;
      }

      // Xóa tất cả cache quyền truy cập trước khi đăng nhập người dùng mới
      clearAllAccessCache();

      const result = await dispatch(
        login({
          tenDangNhap: username,
          matKhau: password,
          recaptchaToken: recaptchaToken,
        }),
      );

      if (login.fulfilled.match(result)) {
        const { accessToken, user } = result.payload;
        if (accessToken) {
          if (rememberMe) {
            localStorage.setItem('rememberedUsername', username);
          } else {
            localStorage.removeItem('rememberedUsername');
          }

          // Reset trạng thái bảo mật và lưu thông tin người dùng mới
          resetSecurityState(user.id);

          // Lưu thông tin người dùng
          localStorage.setItem(
            'user_data',
            JSON.stringify({
              id: user.id,
              username: user.tenDangNhap,
              role: user.vaiTro?.tenVaiTro || 'Nguoi Dung',
            }),
          );

          dispatch(await fetchLatestSession(user.id.toString()));
          const redirectTo = searchParams.get('redirectTo');
          localStorage.setItem('isLoggedOut', 'false');

          addToast({
            title: 'Thành công',
            description: 'Đăng nhập thành công!',
            variant: 'success',
            duration: 3000,
          });

          // Chuyển hướng ngay lập tức
          if (redirectTo) {
            navigate(decodeURIComponent(redirectTo));
          } else {
            navigate('/main');
          }

          // Nếu tài khoản có liên kết MetaMask, thử kết nối ẩn
          if (user.isMetaMask && user.diaChiVi) {
            try {
              // Kiểm tra MetaMask đã cài đặt
              if (!isMetaMaskInstalled) {
                addToast({
                  title: 'Thông báo',
                  description:
                    'Tài khoản của bạn đã liên kết với MetaMask, nhưng MetaMask chưa được cài đặt',
                  duration: 5000,
                });
                return;
              }

              // Thử kết nối MetaMask
              const walletAddress = await connectWallet();

              if (walletAddress) {
                // So sánh địa chỉ ví
                if (walletAddress.toLowerCase() === user.diaChiVi.toLowerCase()) {
                  addToast({
                    title: 'Thành công',
                    description: 'Đã tự động kết nối với MetaMask!',
                    variant: 'success',
                    duration: 3000,
                  });
                } else {
                  addToast({
                    title: 'Lỗi',
                    description: 'Ví MetaMask không khớp với ví đã liên kết!',
                    variant: 'destructive',
                    duration: 5000,
                  });
                }
              } else {
                addToast({
                  title: 'Thông báo',
                  description:
                    'Không thể kết nối MetaMask, bạn vẫn có thể dùng tài khoản bình thường',
                  duration: 5000,
                });
              }
            } catch (err) {
              console.error('Lỗi khi kết nối MetaMask:', err);
              addToast({
                title: 'Thông báo',
                description:
                  'Không thể kết nối MetaMask, bạn vẫn có thể dùng tài khoản bình thường',
                duration: 5000,
              });
            }
          }
        } else {
          setError('Tên đăng nhập hoặc mật khẩu không chính xác');
        }
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    }
  };

  const handleOpenLoginForm = () => {
    setIsLoginFormOpen(true);
  };

  const handleCloseLoginForm = () => {
    setIsLoginFormOpen(false);
  };

  const handleMetaMaskLogin = async () => {
    // Ngăn chặn nhiều lần click liên tiếp
    if (isSigningWithMetaMask || isConnecting) {
      return;
    }

    try {
      setError('');
      setIsSigningWithMetaMask(true);

      if (!isMetaMaskInstalled) {
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      if (!recaptchaToken) {
        setError('Không thể xác minh reCAPTCHA, vui lòng thử lại');
        return;
      }

      // Xóa tất cả cache quyền truy cập trước khi đăng nhập
      clearAllAccessCache();

      // Kết nối ví nếu chưa có
      let walletAddress = currentAccount;
      if (!walletAddress) {
        walletAddress = await connectWallet();
      }

      if (!walletAddress) {
        throw new Error('Không thể kết nối với MetaMask. Vui lòng thử lại.');
      }

      // Hiển thị thông báo đang chờ ký
      addToast({
        title: 'Đang xử lý',
        description: 'Vui lòng ký thông điệp trong MetaMask...',
        duration: 10000,
      });

      // Tạo thông điệp để ký
      const nonce = `Đăng nhập vào Blockchain Voting\nNonce: ${Date.now()}${Math.random()
        .toString(36)
        .substring(2)}`;

      // Thêm thời gian chờ để tránh nhiều lần click
      const signature = await signMessage(nonce);

      if (!signature) {
        throw new Error('Không thể ký thông điệp với MetaMask.');
      }

      // Thêm thời gian chờ để tránh nhiều lần click
      metaMaskLoginTimeoutRef.current = setTimeout(async () => {
        try {
          // Sử dụng action loginWithMetaMask từ dangNhapTaiKhoanSlice
          const result = await dispatch(
            loginWithMetaMask({
              diaChiVi: walletAddress,
              nonce,
              signature,
              recaptchaToken: recaptchaToken,
            }),
          );
          console.log('result', result);

          if (loginWithMetaMask.fulfilled.match(result)) {
            const { user } = result.payload;

            // Reset trạng thái bảo mật và lưu thông tin người dùng mới
            resetSecurityState(user.id);

            // Lưu thông tin người dùng
            localStorage.setItem(
              'user_data',
              JSON.stringify({
                id: user.id,
                username: user.tenDangNhap,
                role: user.vaiTro?.tenVaiTro || 'Nguoi Dung',
                walletAddress: walletAddress,
              }),
            );

            // Đặt cờ là chưa đăng xuất
            localStorage.setItem('isLoggedOut', 'false');

            addToast({
              title: 'Thành công',
              description: 'Đăng nhập với MetaMask thành công!',
              variant: 'success',
              duration: 3000,
            });

            navigate('/main');
          } else {
            throw new Error((result.payload as string) || 'Đăng nhập với MetaMask thất bại.');
          }
        } catch (err: any) {
          setError(err.message || 'Không thể đăng nhập với MetaMask. Vui lòng thử lại.');
          addToast({
            title: 'Lỗi',
            description: err.message || 'Lỗi đăng nhập với MetaMask',
            variant: 'destructive',
            duration: 5000,
          });
        } finally {
          setIsSigningWithMetaMask(false);
        }
      }, 500); // Thêm độ trễ 500ms để tránh nhiều lần click
    } catch (err: any) {
      setError(err.message || 'Không thể đăng nhập với MetaMask. Vui lòng thử lại.');
      addToast({
        title: 'Lỗi',
        description: err.message || 'Lỗi đăng nhập với MetaMask',
        variant: 'destructive',
        duration: 5000,
      });
      setIsSigningWithMetaMask(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0F18] via-[#121A29] to-[#0D1321] p-4 relative overflow-hidden">
      <SEO
        title="Đăng nhập | Nền Tảng Bầu Cử Blockchain"
        description="Trang đăng nhập vào hệ thống Bầu Cử Blockchain."
        keywords="đăng nhập, bầu cử, blockchain, tài khoản"
        author="Blockchain Voting"
        image="./tai_xuong.jpg"
        url="https://holihu.online/login"
      />

      {/* Animated blockchain background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Hexagonal grid pattern */}
        <HexagonBackground />

        {/* Animated nodes and connections */}
        <BlockchainNodes nodeCount={15} />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-[100px] opacity-20 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px] opacity-15 animate-float-delayed"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-5xl flex flex-col md:flex-row bg-[#0C1424]/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(79,139,255,0.3)] border border-[#2A3A5A]"
      >
        {/* Left side - Blockchain voting branding */}
        <div className="md:w-2/5 p-8 bg-gradient-to-br from-[#0E1A2D] to-[#162A45] flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="flex items-center mb-6">
                <Layers className="h-8 w-8 text-blue-400 mr-3" />
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  BlockVote
                </h1>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Bầu Cử Blockchain</h2>
              <p className="text-blue-200/80 mb-8">
                Hệ thống bầu cử minh bạch, an toàn và bất biến dựa trên công nghệ blockchain.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Bảo mật tuyệt đối</h3>
                  <p className="text-blue-200/60 text-sm">Mã hóa đầu cuối và xác thực đa lớp</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Dữ liệu bất biến</h3>
                  <p className="text-blue-200/60 text-sm">
                    Kết quả bầu cử được lưu trữ vĩnh viễn trên blockchain
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                  <Fingerprint className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Xác thực danh tính</h3>
                  <p className="text-blue-200/60 text-sm">Đảm bảo mỗi cử tri chỉ bầu một lần</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="#4F8BFF"
                d="M45.7,-77.2C59.1,-69.3,70.3,-57.4,78.9,-43.5C87.6,-29.6,93.8,-14.8,93.4,-0.2C93,14.3,86,28.6,76.8,41.1C67.6,53.6,56.2,64.2,43.1,72.5C30,80.8,15,86.8,-0.2,87.1C-15.3,87.4,-30.7,82.1,-44.1,73.7C-57.5,65.3,-69,53.9,-76.8,40.1C-84.6,26.3,-88.7,10.1,-87.1,-5.4C-85.5,-20.9,-78.2,-35.8,-68.1,-48.2C-58,-60.6,-45.1,-70.5,-31.5,-77.9C-17.9,-85.3,-3.6,-90.2,9.7,-87.1C23,-84,32.3,-85.1,45.7,-77.2Z"
                transform="translate(100 100)"
              />
            </svg>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="md:w-3/5 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Đăng nhập</h2>
            <p className="text-blue-200/70">Truy cập vào hệ thống bầu cử blockchain</p>
          </div>

          {/* Login tabs */}
          <div className="flex mb-8 border-b border-[#2A3A5A]">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`pb-3 px-4 font-medium text-sm flex items-center ${
                activeTab === 'credentials'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-blue-200/60 hover:text-blue-200'
              }`}
            >
              <Key className="h-4 w-4 mr-2" />
              Đăng nhập với tài khoản
            </button>
            <button
              onClick={() => setActiveTab('metamask')}
              className={`pb-3 px-4 font-medium text-sm flex items-center ${
                activeTab === 'metamask'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-blue-200/60 hover:text-blue-200'
              }`}
            >
              <FaEthereum className="h-4 w-4 mr-2" />
              Đăng nhập với MetaMask
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'credentials' ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-blue-200 mb-2"
                    >
                      Tên đăng nhập
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-blue-400/60" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="bg-[#162A45]/50 border border-[#2A3A5A] focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-3 sm:text-sm rounded-lg text-white placeholder-blue-200/40"
                        placeholder="Nhập tên đăng nhập"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-blue-200 mb-2"
                    >
                      Mật khẩu
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-blue-400/60" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="bg-[#162A45]/50 border border-[#2A3A5A] focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 py-3 sm:text-sm rounded-lg text-white placeholder-blue-200/40"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-blue-400/60 hover:text-blue-400 focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-[#2A3A5A] rounded bg-[#162A45]/50"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-blue-200">
                        Ghi nhớ đăng nhập
                      </label>
                    </div>
                    <div className="text-sm">
                      <Link
                        to="/tim-tai-khoan"
                        className="font-medium text-blue-400 hover:text-blue-300"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                  </div>

                  {/* reCAPTCHA component - hidden but functional */}
                  <div className="hidden">
                    <div id="recaptcha-container"></div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-md bg-red-900/20 border border-red-800/30 p-4"
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-300">{error}</h3>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#0C1424] transition-all duration-200"
                      disabled={dangTai}
                    >
                      {dangTai ? (
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      ) : null}
                      {dangTai ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="metamask"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-[#162A45]/50 border border-[#2A3A5A] rounded-lg p-6 text-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                    alt="MetaMask"
                    className="w-16 h-16 mx-auto mb-4"
                  />
                  <h3 className="text-xl font-medium text-white mb-2">Đăng nhập với MetaMask</h3>
                  <p className="text-blue-200/70 mb-6">
                    Kết nối ví MetaMask của bạn để đăng nhập an toàn vào hệ thống bầu cử blockchain
                  </p>

                  {currentAccount && (
                    <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                      <p className="text-blue-200 text-sm">
                        Đã kết nối:{' '}
                        <span className="font-medium">
                          {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* reCAPTCHA component - hidden but functional */}
                  <div className="hidden">
                    <div id="recaptcha-container-metamask"></div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-md bg-red-900/20 border border-red-800/30 p-4 mb-6"
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-300">{error}</h3>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleMetaMaskLogin}
                    disabled={isConnecting || isSigningWithMetaMask}
                    className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white ${
                      isMetaMaskInstalled
                        ? 'bg-[#F6851B] hover:bg-[#E2761B]'
                        : 'bg-[#F6851B] hover:bg-[#E2761B]'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F6851B] focus:ring-offset-[#0C1424] transition-all duration-200 ${
                      isConnecting || isSigningWithMetaMask ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isConnecting || isSigningWithMetaMask ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        {isConnecting ? 'Đang kết nối...' : 'Đang ký thông điệp...'}
                      </>
                    ) : !isMetaMaskInstalled ? (
                      <>
                        <FaEthereum className="mr-2 h-5 w-5" />
                        Cài đặt MetaMask
                      </>
                    ) : (
                      <>
                        <FaEthereum className="mr-2 h-5 w-5" />
                        {currentAccount ? 'Đăng nhập với MetaMask' : 'Kết nối với MetaMask'}
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center text-blue-200/60 text-sm">
                  <p>Chưa cài đặt MetaMask?</p>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Tải MetaMask
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent users section */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Tài khoản gần đây</h3>
            <div className="grid grid-cols-4 gap-3">
              {users.slice(0, 3).map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.05 }}
                  className="p-3 bg-[#162A45]/50 border border-[#2A3A5A] rounded-lg flex flex-col items-center cursor-pointer hover:border-blue-400/50 transition-colors duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-2 overflow-hidden">
                    <img
                      src={user.avatar || '/placeholder.svg?height=48&width=48'}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-blue-200 truncate w-full text-center">
                    {user.name}
                  </span>
                </motion.div>
              ))}
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={handleOpenLoginForm}
                className="p-3 bg-[#162A45]/50 border border-[#2A3A5A] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400/50 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                  <span className="text-blue-400 text-xl">+</span>
                </div>
                <span className="text-xs font-medium text-blue-200">Thêm tài khoản</span>
              </motion.div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-blue-200/60 text-sm">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-400 hover:text-blue-300 inline-flex items-center"
              >
                Đăng ký ngay
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* {isAutoLoggingIn && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0F18]/80 backdrop-blur-sm z-50">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-200 font-medium">Đang đăng nhập tự động...</p>
          </div>
        </div>
      )} */}
      {isLoginFormOpen && (
        <LoginForm onClose={handleCloseLoginForm} onRecaptchaVerify={handleReCaptchaVerify} />
      )}
    </div>
  );
};

export default LoginPage;
