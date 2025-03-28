'use client';

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { NewAccountForm } from '../features/TaoTaiKhoanForm';
import { registerAccount, resetTrangThai } from '../store/slice/dangKyTaiKhoanSlice';
import type { TaoTaiKhoanTamThoi } from '../store/types';
import type { RootState, AppDispatch } from '../store/store';
import SEO from '../components/SEO';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

import { motion, AnimatePresence } from 'framer-motion';
import HexagonBackground from '../components/ui/hexagon-background';
import BlockchainNodes from '../components/ui/blockchain-nodes';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Shield,
  Wallet,
  User,
  Fingerprint,
  Layers,
  ArrowLeft,
  Cpu,
  Database,
} from 'lucide-react';
import { FaEthereum } from 'react-icons/fa';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { dangTai, loi, thanhCong, wallets } = useSelector(
    (state: RootState) => state.dangKyTaiKhoan,
  );
  const [showDialog, setShowDialog] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [hluBalance, setHluBalance] = useState('0.00');
  const [showBlockchainAnimation, setShowBlockchainAnimation] = useState(true);

  useEffect(() => {
    if (thanhCong) {
      setShowDialog(true);
      // Không reset state ngay để có thể hiển thị thông tin ví
    }
  }, [thanhCong, dispatch]);

  // Hiệu ứng blockchain animation
  useEffect(() => {
    if (showDialog) {
      // Tắt animation sau 5 giây
      const timer = setTimeout(() => {
        setShowBlockchainAnimation(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showDialog]);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleSave = async (data: TaoTaiKhoanTamThoi, recaptchaToken: string) => {
    const newAccount: TaoTaiKhoanTamThoi = {
      ...data,
      id: '0',
      trangThai: true,
      ngayThamGia: formatDate(new Date()),
      lanDangNhapCuoi: formatDate(new Date()),
    };

    try {
      if (!recaptchaToken) {
        throw new Error('reCAPTCHA token is missing');
      }

      const result = await dispatch(
        registerAccount({ account: newAccount, recaptchaToken: recaptchaToken }),
      ).unwrap();

      // Lưu thông tin người dùng từ phản hồi
      if (result && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('Đăng ký tài khoản thất bại:', error);
    }
  };

  const handleConfirm = () => {
    setShowDialog(false);
    dispatch(resetTrangThai());
    navigate('/login');
  };

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Hiệu ứng blockchain cho dialog thành công
  const BlockchainSuccessAnimation = () => {
    if (!showBlockchainAnimation) return null;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10"></div>

        {/* Animated nodes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-blue-400"
            initial={{
              x: Math.random() * 100 - 50 + '%',
              y: Math.random() * 100 - 50 + '%',
              opacity: 0,
            }}
            animate={{
              x: [
                Math.random() * 100 - 50 + '%',
                Math.random() * 100 - 50 + '%',
                Math.random() * 100 - 50 + '%',
              ],
              y: [
                Math.random() * 100 - 50 + '%',
                Math.random() * 100 - 50 + '%',
                Math.random() * 100 - 50 + '%',
              ],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          <motion.path
            d="M 50,50 C 100,100 150,50 200,100"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'loop',
            }}
          />
          <motion.path
            d="M 150,150 C 200,100 250,200 300,150"
            stroke="rgba(124, 58, 237, 0.3)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'loop',
              delay: 1,
            }}
          />
        </svg>
      </div>
    );
  };

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey="6LfL9PIqAAAAAFGQnjVFb4F7ep4FfvUAyNaz9bVJ"
      scriptProps={{
        async: false,
        defer: true,
        appendTo: 'body',
        nonce: undefined,
      }}
      container={{
        parameters: {
          badge: 'bottomright',
          theme: 'dark',
        },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F18] via-[#121A29] to-[#0D1321] text-white relative overflow-hidden">
        <SEO
          title="Đăng Ký Tài Khoản | Nền Tảng Bầu Cử Blockchain"
          description="Trang đăng ký tài khoản cho nền tảng bầu cử blockchain. Tạo tài khoản để tham gia vào quá trình bầu cử an toàn và minh bạch."
          keywords="đăng ký, tài khoản, bầu cử, blockchain, an toàn, minh bạch"
          author="Nền Tảng Bầu Cử Blockchain"
          url={window.location.href}
          image={`${window.location.origin}/logo.png`}
        />

        {/* Container cho reCAPTCHA */}
        <div id="recaptcha-container" style={{ display: 'none' }}></div>

        {/* Animated blockchain background */}
        <div className="absolute inset-0 overflow-hidden">
          <HexagonBackground density={10} opacity={0.05} />
          <BlockchainNodes nodeCount={10} />

          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-[100px] opacity-10 animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px] opacity-10 animate-float-delayed"></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Header with back button */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>

          {/* Page Title */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/30 to-[#6A1B9A]/30 rounded-full blur-lg"></div>
                <div className="relative p-4 rounded-full bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50">
                  <Layers className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Đăng Ký Tài Khoản Blockchain
            </h1>
            <div className="h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] w-[100px] mx-auto mb-6" />
            <p className="text-blue-200/80 max-w-3xl mx-auto">
              Tạo tài khoản để tham gia vào nền tảng bầu cử blockchain an toàn và minh bạch. Mỗi tài
              khoản sẽ được cấp một ví blockchain để tham gia các hoạt động trên hệ thống.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* Form Section */}
            <div className="lg:col-span-7" ref={formRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#1E293B]/30 backdrop-blur-md rounded-2xl border border-[#334155]/50 p-8"
              >
                {/* Error message */}
                <AnimatePresence>
                  {loi && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-lg p-4 mb-6 bg-red-900/20 border border-red-800/30 flex items-center"
                    >
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <p className="ml-3 text-sm text-red-300">{loi}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Component */}
                <NewAccountForm onSave={handleSave} />
              </motion.div>
            </div>

            {/* Benefits Section */}
            <div className="lg:col-span-5 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#1E293B]/30 backdrop-blur-md rounded-2xl border border-[#334155]/50 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Shield className="h-5 w-5 text-blue-400 mr-2" />
                  Công Nghệ Blockchain
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-[#1E293B]/50 rounded-lg border border-[#334155]/50">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                        <Database className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Phi Tập Trung</h3>
                        <p className="text-sm text-blue-200/70">
                          Dữ liệu được lưu trữ trên nhiều máy tính, không có điểm kiểm soát trung
                          tâm, đảm bảo tính minh bạch.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1E293B]/50 rounded-lg border border-[#334155]/50">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-4">
                        <Fingerprint className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Bất Biến</h3>
                        <p className="text-sm text-blue-200/70">
                          Dữ liệu một khi đã được ghi vào blockchain không thể bị thay đổi, đảm bảo
                          tính toàn vẹn.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1E293B]/50 rounded-lg border border-[#334155]/50">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-4">
                        <Cpu className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Smart Contract</h3>
                        <p className="text-sm text-blue-200/70">
                          Hợp đồng thông minh tự động thực thi các quy tắc đã được lập trình, đảm
                          bảo tính công bằng.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1E293B]/50 rounded-lg border border-[#334155]/50">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mr-4">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">Ví Blockchain</h3>
                        <p className="text-sm text-blue-200/70">
                          Mỗi người dùng sở hữu một ví blockchain để tương tác với hệ thống và lưu
                          trữ tài sản số.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-4">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white mb-1">Đã Có Tài Khoản?</h3>
                      <p className="text-sm text-blue-200/70 mb-3">
                        Nếu bạn đã có tài khoản, hãy đăng nhập để tham gia các cuộc bầu cử.
                      </p>
                      <Link
                        to="/login"
                        className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                      >
                        Đăng nhập ngay
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Success Dialog */}
        <AnimatePresence>
          {showDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 max-w-md w-full relative overflow-hidden"
              >
                {/* Blockchain animation background */}
                <BlockchainSuccessAnimation />

                <div className="text-center mb-4 relative z-10">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Đăng ký thành công!</h3>
                  <p className="text-blue-200/80 mt-2">
                    Tài khoản blockchain của bạn đã được tạo thành công. Bạn có thể đăng nhập ngay
                    bây giờ.
                  </p>
                </div>

                <div className="mt-4 p-4 bg-[#0D1321]/50 rounded-lg border border-[#334155]/50 relative z-10">
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <Wallet className="h-4 w-4 text-blue-400 mr-2" />
                    Thông tin ví blockchain của bạn
                  </h4>

                  {/* Hiển thị ví từ wallets nếu có */}
                  {wallets && wallets.length > 0 ? (
                    wallets.map((wallet, index) => (
                      <div key={index} className="mb-3 last:mb-0">
                        <div className="flex items-center mb-1">
                          <FaEthereum className="h-4 w-4 text-orange-400 mr-2" />
                          <span className="text-sm text-blue-200">
                            {wallet.LoaiVi === 1 ? 'Smart Contract Wallet' : 'EOA Wallet'}
                          </span>
                        </div>
                        <div className="bg-[#1E293B]/70 p-2 rounded border border-[#334155]/70">
                          <p className="text-xs text-blue-300 font-mono break-all">
                            {wallet.DiaChiVi}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Hiển thị từ dữ liệu phản hồi nếu không có wallets */
                    <div className="mb-3">
                      <div className="flex items-center mb-1">
                        <FaEthereum className="h-4 w-4 text-orange-400 mr-2" />
                        <span className="text-sm text-blue-200">Smart Contract Wallet</span>
                      </div>
                      <div className="bg-[#1E293B]/70 p-2 rounded border border-[#334155]/70">
                        <p className="text-xs text-blue-300 font-mono break-all">
                          {user?.diaChiVi || 'Đang tải...'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hiển thị ví SCW nếu có trong phản hồi */}
                  {user?.diaChiViSCW && !wallets && (
                    <div className="mb-3">
                      <div className="flex items-center mb-1">
                        <FaEthereum className="h-4 w-4 text-purple-400 mr-2" />
                        <span className="text-sm text-blue-200">Smart Contract Wallet</span>
                      </div>
                      <div className="bg-[#1E293B]/70 p-2 rounded border border-[#334155]/70">
                        <p className="text-xs text-blue-300 font-mono break-all">
                          {user.diaChiViSCW}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-blue-200/70 flex items-start">
                    <AlertCircle className="h-3 w-3 text-blue-400 mr-1 mt-0.5 flex-shrink-0" />
                    <span>
                      Lưu thông tin ví này để sử dụng trong tương lai. Bạn sẽ cần địa chỉ ví để tham
                      gia các hoạt động trên blockchain.
                    </span>
                  </div>
                </div>

                {user?.diaChiVi && (
                  <div className="mt-4 p-4 bg-[#0D1321]/50 rounded-lg border border-[#334155]/50 relative z-10">
                    <h4 className="text-white font-medium mb-3 flex items-center">
                      <Wallet className="h-4 w-4 text-blue-400 mr-2" />
                      Số dư HLU Token
                    </h4>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                        <span className="text-xs font-bold text-white">HLU</span>
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-white">
                          {hluBalance} <span className="text-blue-300 text-sm ml-1">HLU</span>
                        </p>
                        <p className="text-xs text-blue-200/70">
                          Bạn sẽ nhận được HLU Token khi tham gia các hoạt động trên hệ thống
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-center relative z-10">
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-2 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white font-medium rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(2,136,209,0.5)] transition-all duration-300"
                  >
                    Đến trang đăng nhập
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Container rõ ràng cho reCAPTCHA */}
      <div id="recaptcha-container" className="fixed bottom-4 right-4 z-50"></div>
    </GoogleReCaptchaProvider>
  );
};

export default RegisterPage;
