'use client';

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, loginWithMetaMask } from '../store/slice/dangNhapTaiKhoanSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Use-toast';
import HexagonBackground from '../components/ui/hexagon-background';
import {
  FaLock,
  FaUser,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaSpinner,
  FaEthereum,
} from 'react-icons/fa';
import { HiOutlineCube } from 'react-icons/hi';
import type { AppDispatch, RootState } from '../store/store';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useWeb3 } from '../context/Web3Context';
// Thêm import mới
import { clearAllAccessCache, resetSecurityState } from '../utils/authUtils';

declare global {
  interface Window {
    ethereum: any;
  }
}

interface LoginFormProps {
  onClose: () => void;
  onRecaptchaVerify: (token: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onRecaptchaVerify }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'metamask'>('password');
  const [isSigningWithMetaMask, setIsSigningWithMetaMask] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { connectWallet, isConnecting, currentAccount, signMessage } = useWeb3();
  const theme = 'dark';
  interface DangNhapTaiKhoanState {
    dangTai: boolean;
  }

  const { dangTai: reduxLoading } = useSelector(
    (state: RootState) => state.dangNhapTaiKhoan as DangNhapTaiKhoanState,
  );
  const { executeRecaptcha } = useGoogleReCaptcha();
  const metaMaskLoginTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (metaMaskLoginTimeoutRef.current) {
        clearTimeout(metaMaskLoginTimeoutRef.current);
      }
    };
  }, []);

  // Xử lý reCAPTCHA khi component mount
  useEffect(() => {
    const handleReCaptcha = async () => {
      if (executeRecaptcha) {
        try {
          const token = await executeRecaptcha('login_form');
          setRecaptchaToken(token);
          onRecaptchaVerify(token);
        } catch (error) {
          console.error('reCAPTCHA error:', error);
        }
      }
    };

    handleReCaptcha();
  }, [executeRecaptcha, onRecaptchaVerify]);

  const handleReCaptchaVerify = useCallback(
    (token: string) => {
      setRecaptchaToken(token);
      onRecaptchaVerify(token);
    },
    [onRecaptchaVerify],
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Sử dụng token reCAPTCHA đã lưu hoặc thực hiện reCAPTCHA mới
      let captchaToken = recaptchaToken;
      if (!captchaToken && executeRecaptcha) {
        captchaToken = await executeRecaptcha('login_form');
        handleReCaptchaVerify(captchaToken);
      }

      if (!captchaToken) {
        setError('Không thể xác minh reCAPTCHA, vui lòng thử lại');
        setIsLoading(false);
        return;
      }

      // Xóa tất cả cache quyền truy cập trước khi đăng nhập
      clearAllAccessCache();

      const result = await dispatch(
        login({
          tenDangNhap: username,
          matKhau: password,
          recaptchaToken: captchaToken,
        }),
      );

      if (login.fulfilled.match(result)) {
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
          }),
        );

        // Nếu tài khoản có liên kết MetaMask, thử kết nối ẩn
        if (user.isMetaMask && user.diaChiVi) {
          try {
            // Kiểm tra MetaMask đã cài đặt
            if (typeof window.ethereum === 'undefined') {
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
              description: 'Không thể kết nối MetaMask, bạn vẫn có thể dùng tài khoản bình thường',
              duration: 5000,
            });
          }
        }

        // Đăng nhập thành công, chuyển hướng ngay lập tức
        addToast({
          title: 'Thành công',
          description: 'Đăng nhập thành công!',
          variant: 'success',
          duration: 3000,
        });
        onClose();
        navigate('/main');
      } else {
        setError((result.payload as string) || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/tim-tai-khoan');
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const handleMetaMaskLogin = async () => {
    // Ngăn chặn nhiều lần click liên tiếp
    if (isSigningWithMetaMask || isConnecting) {
      return;
    }

    setIsLoading(true);
    setError('');
    setIsSigningWithMetaMask(true);

    try {
      // Sử dụng token reCAPTCHA đã lưu hoặc thực hiện reCAPTCHA mới
      let captchaToken = recaptchaToken;
      if (!captchaToken && executeRecaptcha) {
        captchaToken = await executeRecaptcha('metamask_login_form');
        handleReCaptchaVerify(captchaToken);
      }

      if (!captchaToken) {
        setError('Không thể xác minh reCAPTCHA, vui lòng thử lại');
        setIsLoading(false);
        setIsSigningWithMetaMask(false);
        return;
      }

      // Xóa tất cả cache quyền truy cập trước khi đăng nhập
      clearAllAccessCache();

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

      const nonce = `Đăng nhập vào Blockchain Voting\nNonce: ${Date.now()}${Math.random()
        .toString(36)
        .substring(2)}`;
      const signature = await signMessage(nonce);

      // Đóng toast loading
      if (!signature) {
        throw new Error('Không thể ký thông điệp với MetaMask.');
      }

      // Thêm thời gian chờ để tránh nhiều lần click
      metaMaskLoginTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await dispatch(
            loginWithMetaMask({
              diaChiVi: walletAddress,
              nonce,
              signature,
              recaptchaToken: captchaToken,
            }),
          );

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

            addToast({
              title: 'Thành công',
              description: 'Đăng nhập với MetaMask thành công!',
              variant: 'success',
              duration: 3000,
            });
            onClose();
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
          setIsLoading(false);
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
      setIsLoading(false);
      setIsSigningWithMetaMask(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="absolute inset-0 bg-black bg-opacity-70 z-0"></div>
      <HexagonBackground density={15} opacity={0.1} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`w-full max-w-md relative z-10 overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(2,136,209,0.3)] ${
          theme === 'dark' ? 'bg-[#0A1416]' : 'bg-white'
        }`}
      >
        <button
          className="absolute top-4 right-4 z-20 transition-colors duration-200"
          onClick={onClose}
          aria-label="Đóng"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/20 to-[#6A1B9A]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div
              className={`relative p-2 rounded-full ${
                theme === 'dark'
                  ? 'bg-[#263238]/50 text-[#B0BEC5] hover:text-white'
                  : 'bg-gray-100/50 text-gray-500 hover:text-gray-700'
              } backdrop-blur-sm`}
            >
              <FaTimes className="h-5 w-5" />
            </div>
          </div>
        </button>

        <div className="absolute inset-0 bg-gradient-to-br from-[#0288D1]/5 to-[#6A1B9A]/5 z-0"></div>

        <div className="p-8 relative z-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full blur-md opacity-70"></div>
                <div
                  className={`relative rounded-full p-3 border border-[#0288D1]/30 ${
                    theme === 'dark' ? 'bg-[#0A1416]' : 'bg-white'
                  }`}
                >
                  <HiOutlineCube className="h-10 w-10 text-[#0288D1]" />
                </div>
              </div>
            </div>
            <h2
              className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#E1F5FE] to-[#0288D1]`}
            >
              Đăng Nhập Hệ Thống
            </h2>
            <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-600'}`}>
              Truy cập vào nền tảng bầu cử blockchain
            </p>
          </div>

          <div className="flex mb-6 border-b border-[#455A64]">
            <button
              className={`flex-1 py-3 text-center relative ${
                activeTab === 'password'
                  ? 'text-[#0288D1] font-medium'
                  : theme === 'dark'
                    ? 'text-[#B0BEC5]'
                    : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('password')}
            >
              <span className="flex items-center justify-center">
                <FaUser className="mr-2" />
                Mật Khẩu
              </span>
              {activeTab === 'password' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]"
                  layoutId="activeTab"
                />
              )}
            </button>
            <button
              className={`flex-1 py-3 text-center relative ${
                activeTab === 'metamask'
                  ? 'text-[#0288D1] font-medium'
                  : theme === 'dark'
                    ? 'text-[#B0BEC5]'
                    : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('metamask')}
            >
              <span className="flex items-center justify-center">
                <FaEthereum className="mr-2" />
                MetaMask
              </span>
              {activeTab === 'metamask' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]"
                  layoutId="activeTab"
                />
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'password' ? (
              <motion.div
                key="password-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label
                      htmlFor="username"
                      className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-[#E1F5FE]' : 'text-gray-700'
                      }`}
                    >
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                          theme === 'dark' ? 'text-[#0288D1]' : 'text-gray-400'
                        }`}
                      >
                        <FaUser className="h-5 w-5" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          theme === 'dark'
                            ? 'bg-[#263238] border-[#455A64] text-white focus:border-[#0288D1]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0288D1]'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200`}
                        placeholder="Nhập tên đăng nhập"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-[#E1F5FE]' : 'text-gray-700'
                      }`}
                    >
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                          theme === 'dark' ? 'text-[#0288D1]' : 'text-gray-400'
                        }`}
                      >
                        <FaLock className="h-5 w-5" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className={`block w-full pl-10 pr-10 py-2 border ${
                          theme === 'dark'
                            ? 'bg-[#263238] border-[#455A64] text-white focus:border-[#0288D1]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0288D1]'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200`}
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`${
                            theme === 'dark'
                              ? 'text-[#B0BEC5] hover:text-white'
                              : 'text-gray-400 hover:text-gray-500'
                          } focus:outline-none`}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? (
                            <FaEyeSlash className="h-5 w-5" />
                          ) : (
                            <FaEye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
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
                        className={`rounded-lg p-3 ${
                          theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <FaExclamationCircle
                            className={`h-5 w-5 ${
                              theme === 'dark' ? 'text-red-400' : 'text-red-500'
                            }`}
                          />
                          <div className="ml-3">
                            <p
                              className={`text-sm ${
                                theme === 'dark' ? 'text-red-200' : 'text-red-800'
                              }`}
                            >
                              {error}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:shadow-[0_0_15px_rgba(2,136,209,0.5)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0288D1]"
                      disabled={isLoading || reduxLoading}
                    >
                      {isLoading || reduxLoading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                          Đang đăng nhập...
                        </>
                      ) : (
                        'Đăng nhập'
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className={`text-sm font-medium ${
                        theme === 'dark'
                          ? 'text-[#0288D1] hover:text-[#E1F5FE]'
                          : 'text-[#0288D1] hover:text-[#01579B]'
                      } transition-colors duration-200`}
                    >
                      Quên mật khẩu?
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAccount}
                      className={`text-sm font-medium ${
                        theme === 'dark'
                          ? 'text-[#0288D1] hover:text-[#E1F5FE]'
                          : 'text-[#0288D1] hover:text-[#01579B]'
                      } transition-colors duration-200`}
                    >
                      Tạo tài khoản mới
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="metamask-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                      alt="MetaMask"
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                  <h3
                    className={`text-lg font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Đăng nhập với MetaMask
                  </h3>
                  <p
                    className={`mt-2 text-sm ${
                      theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-600'
                    }`}
                  >
                    Kết nối ví MetaMask của bạn để đăng nhập an toàn
                  </p>
                  {currentAccount && (
                    <p
                      className={`mt-2 text-sm ${
                        theme === 'dark' ? 'text-[#E1F5FE]' : 'text-gray-700'
                      }`}
                    >
                      Đã kết nối: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
                    </p>
                  )}
                </div>

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
                      className={`rounded-lg p-3 mb-6 ${
                        theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <FaExclamationCircle
                          className={`h-5 w-5 ${
                            theme === 'dark' ? 'text-red-400' : 'text-red-500'
                          }`}
                        />
                        <div className="ml-3">
                          <p
                            className={`text-sm ${
                              theme === 'dark' ? 'text-red-200' : 'text-red-800'
                            }`}
                          >
                            {error}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleMetaMaskLogin}
                  disabled={isLoading || isConnecting || isSigningWithMetaMask || reduxLoading}
                  className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium transition-all duration-300 
                    bg-[#FF9E0D] hover:bg-[#F5841F] text-[#151515]
                    ${
                      isLoading || isConnecting || isSigningWithMetaMask || reduxLoading
                        ? 'opacity-70 cursor-not-allowed'
                        : ''
                    }`}
                >
                  {isLoading || isConnecting || isSigningWithMetaMask || reduxLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                      {isConnecting
                        ? 'Đang kết nối...'
                        : isSigningWithMetaMask
                          ? 'Đang ký thông điệp...'
                          : 'Đang xử lý...'}
                    </>
                  ) : (
                    <>
                      <FaEthereum className="mr-2 h-5 w-5" />
                      {currentAccount ? 'Đăng nhập với MetaMask' : 'Kết nối với MetaMask'}
                    </>
                  )}
                </button>

                <div className="mt-6 text-center">
                  <p className={`text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-600'}`}>
                    Chưa có MetaMask?{' '}
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-medium ${
                        theme === 'dark'
                          ? 'text-[#0288D1] hover:text-[#E1F5FE]'
                          : 'text-[#0288D1] hover:text-[#01579B]'
                      } transition-colors duration-200`}
                    >
                      Cài đặt ngay
                    </a>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#0288D1]/10 to-transparent rounded-tr-full"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#6A1B9A]/10 to-transparent rounded-bl-full"></div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
