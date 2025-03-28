'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from './store/store';
import { NavLink, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from './components/SEO';
import { toast } from 'react-hot-toast';
import { logoutThat } from './store/slice/dangXuatTaiKhoanSlice';
import HexagonBackground from './components/ui/hexagon-background';
import BlockchainNodes from './components/ui/blockchain-nodes';
import {
  Layers,
  Vote,
  User,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Shield,
  CheckCircle2,
  Users,
  Wallet,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { FaEthereum } from 'react-icons/fa';
import { fetchAddressDetails } from './store/sliceBlockchain/blockchainSlice';
import MetaMaskSetupButton from './components/ui/MetaMaskSetupButton';

export default function Main() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { taiKhoan: user, accessToken } = useSelector((state: RootState) => state.dangNhapTaiKhoan);
  const {
    hluBalance,
    addressDetails,
    isLoading: blockchainLoading,
    error: blockchainError,
  } = useSelector((state: RootState) => state.blockchain);
  const [greeting, setGreeting] = useState('Chào Mừng');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Cập nhật thời gian hiện tại
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Xác định lời chào dựa trên thời gian
  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Chào Buổi Sáng');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Chào Buổi Chiều');
    } else {
      setGreeting('Chào Buổi Tối');
    }
  }, [currentTime]);

  // Lấy thông tin ví và số dư khi component mount
  useEffect(() => {
    if (user?.diaChiVi && !fetchAttempted) {
      setFetchAttempted(true);
      try {
        dispatch(fetchAddressDetails(user.diaChiVi))
          .unwrap()
          .catch((error) => {
            console.error('Lỗi khi lấy thông tin blockchain:', error);
          });
      } catch (error) {
        console.error('Lỗi khi dispatch fetchAddressDetails:', error);
      }
    }
  }, [dispatch, user?.diaChiVi, fetchAttempted]);

  // Kiểm tra xác thực
  if (!user || !accessToken) {
    return <Navigate to="/" />;
  }

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await dispatch(logoutThat());
      toast.success('Đăng xuất thành công');
      navigate('/');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  // Định dạng tên người dùng
  const formatName = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Lấy tên hiển thị
  const displayName = user.tenHienThi || user.tenDangNhap || 'Người dùng';

  // Lấy vai trò người dùng
  const userRole = Array.isArray(user?.vaiTro)
    ? user?.vaiTro.map((vaiTro) => vaiTro.tenVaiTro).join(', ')
    : user?.vaiTro?.tenVaiTro || 'Cử tri';

  // Định dạng số dư
  const formatBalance = (balance: string | null) => {
    if (!balance) return '0.00';
    const num = Number.parseFloat(balance);
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Làm mới số dư
  const refreshBalance = async () => {
    if (!user?.diaChiVi) return;

    setIsRefreshing(true);
    try {
      await dispatch(fetchAddressDetails(user.diaChiVi)).unwrap();
      toast.success('Đã cập nhật thông tin ví');
    } catch (error) {
      toast.error('Không thể cập nhật thông tin ví');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <SEO
        title={`${greeting} | Nền Tảng Bầu Cử Blockchain`}
        description="Trang chính của nền tảng bầu cử blockchain. Bắt đầu tham gia vào quá trình bầu cử an toàn và minh bạch."
        keywords="bầu cử, blockchain, trang chính, an toàn, minh bạch"
        author="Nền Tảng Bầu Cử Blockchain"
        url={window.location.href}
        image={`${window.location.origin}/logo.png`}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#0A0F18] via-[#121A29] to-[#0D1321] relative overflow-hidden">
        {/* Animated blockchain background */}
        <div className="absolute inset-0 overflow-hidden">
          <HexagonBackground density={10} opacity={0.05} />
          <BlockchainNodes nodeCount={10} />

          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-[100px] opacity-10 animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px] opacity-10 animate-float-delayed"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-16">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl mr-4">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                BlockVote
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4 mr-4">
                <div className="bg-[#1E293B]/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#334155]/50">
                  <Clock className="h-5 w-5 text-blue-400 inline mr-2" />
                  <span className="text-blue-100">
                    {currentTime.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <MetaMaskSetupButton variant="outline" size="sm" />
              </div>

              <div className="relative">
                <button
                  onClick={() => navigate('/app/account-info')}
                  className="flex items-center space-x-3 bg-[#1E293B]/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#334155]/50 hover:bg-[#1E293B]/80 transition-colors duration-200"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{formatName(displayName)}</p>
                    <p className="text-xs text-blue-300">{userRole}</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors duration-200"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-5 w-5 text-red-400" />
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Welcome section */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#1E293B]/30 backdrop-blur-md rounded-2xl border border-[#334155]/50 p-8 h-full"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
                  <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-70"></div>
                      <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-[#1E293B]">
                        {user.anhDaiDien ? (
                          <img
                            src={user.anhDaiDien || '/placeholder.svg'}
                            alt={displayName}
                            className="h-full w-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {greeting},{' '}
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        {formatName(displayName)}
                      </span>
                      !
                    </h1>
                    <p className="text-blue-200/80 mb-4">
                      Chào mừng bạn đến với nền tảng bầu cử blockchain an toàn và minh bạch.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {user.diaChiVi && (
                        <div className="flex items-center bg-[#1E293B]/50 px-3 py-1.5 rounded-full border border-[#334155]/50">
                          <FaEthereum className="h-4 w-4 text-orange-400 mr-2" />
                          <span className="text-xs text-blue-200">
                            {`${user.diaChiVi.substring(0, 6)}...${user.diaChiVi.substring(user.diaChiVi.length - 4)}`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center bg-[#1E293B]/50 px-3 py-1.5 rounded-full border border-[#334155]/50">
                        <Shield className="h-4 w-4 text-green-400 mr-2" />
                        <span className="text-xs text-blue-200">Đã xác thực</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Information Section */}
                {user.diaChiVi && (
                  <div className="mb-8 bg-[#1E293B]/50 backdrop-blur-sm rounded-xl border border-[#334155]/50 p-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div className="flex items-center mb-3 md:mb-0">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mr-3">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Thông Tin Ví</h3>
                          <p className="text-sm text-blue-200/70">Smart Contract Wallet</p>
                        </div>
                      </div>

                      <button
                        onClick={refreshBalance}
                        disabled={isRefreshing || blockchainLoading}
                        className="flex items-center space-x-2 bg-[#1E293B]/70 hover:bg-[#1E293B] px-3 py-1.5 rounded-lg border border-[#334155]/50 transition-colors duration-200 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-4 w-4 text-blue-400 ${isRefreshing || blockchainLoading ? 'animate-spin' : ''}`}
                        />
                        <span className="text-sm text-blue-200">Làm mới</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0D1321]/50 rounded-lg border border-[#334155]/50 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-blue-300">Địa chỉ ví</span>
                          {addressDetails?.roles && (
                            <div className="flex items-center space-x-1">
                              {addressDetails.roles.isAdmin && (
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                              {addressDetails.roles.isMinter && (
                                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                                  Minter
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <FaEthereum className="h-5 w-5 text-orange-400 mr-2" />
                          <p className="text-white font-mono text-sm break-all">{user.diaChiVi}</p>
                        </div>
                      </div>

                      <div className="bg-[#0D1321]/50 rounded-lg border border-[#334155]/50 p-4">
                        <span className="text-sm text-blue-300 block mb-2">Số dư HLU Token</span>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-white">HLU</span>
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-white">
                              {blockchainLoading ? (
                                <span className="inline-block w-16 h-6 bg-[#334155]/50 rounded animate-pulse"></span>
                              ) : (
                                formatBalance(hluBalance)
                              )}
                              <span className="text-blue-300 text-sm ml-1">HLU</span>
                            </p>
                            {addressDetails?.discountRate && addressDetails.discountRate > 0 && (
                              <p className="text-xs text-green-400">
                                Giảm phí: {addressDetails.discountRate}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {blockchainError && (
                      <div className="mt-3 p-3 bg-red-900/20 border border-red-800/30 rounded-lg flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                        <p className="text-sm text-red-300">{blockchainError}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NavLink
                    to="/app/cuoc-bau-cu"
                    className="group bg-gradient-to-br from-[#1E293B]/50 to-[#1E293B]/30 hover:from-blue-900/20 hover:to-purple-900/20 backdrop-blur-sm rounded-xl border border-[#334155]/50 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  >
                    <div className="flex items-start">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <Vote className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Cuộc Bầu Cử</h3>
                        <p className="text-sm text-blue-200/70 mb-3">
                          Tham gia các cuộc bầu cử đang diễn ra
                        </p>
                        <div className="flex items-center text-blue-400 text-sm font-medium">
                          Xem tất cả
                          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/app/ket-qua"
                    className="group bg-gradient-to-br from-[#1E293B]/50 to-[#1E293B]/30 hover:from-blue-900/20 hover:to-purple-900/20 backdrop-blur-sm rounded-xl border border-[#334155]/50 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  >
                    <div className="flex items-start">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Kết Quả</h3>
                        <p className="text-sm text-blue-200/70 mb-3">
                          Xem kết quả các cuộc bầu cử đã kết thúc
                        </p>
                        <div className="flex items-center text-blue-400 text-sm font-medium">
                          Xem thống kê
                          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/app/lich-su"
                    className="group bg-gradient-to-br from-[#1E293B]/50 to-[#1E293B]/30 hover:from-blue-900/20 hover:to-purple-900/20 backdrop-blur-sm rounded-xl border border-[#334155]/50 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  >
                    <div className="flex items-start">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Lịch Sử Bầu Cử</h3>
                        <p className="text-sm text-blue-200/70 mb-3">
                          Xem lại các phiếu bầu của bạn
                        </p>
                        <div className="flex items-center text-blue-400 text-sm font-medium">
                          Xem lịch sử
                          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </NavLink>

                  <NavLink
                    to="/app/account-info"
                    className="group bg-gradient-to-br from-[#1E293B]/50 to-[#1E293B]/30 hover:from-blue-900/20 hover:to-purple-900/20 backdrop-blur-sm rounded-xl border border-[#334155]/50 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  >
                    <div className="flex items-start">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Tài Khoản</h3>
                        <p className="text-sm text-blue-200/70 mb-3">
                          Quản lý thông tin cá nhân và cài đặt
                        </p>
                        <div className="flex items-center text-blue-400 text-sm font-medium">
                          Cài đặt
                          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </NavLink>
                </div>
              </motion.div>
            </div>

            {/* Stats and upcoming elections */}
            <div className="lg:col-span-4 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-[#1E293B]/30 backdrop-blur-md rounded-2xl border border-[#334155]/50 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                  Trạng Thái Hệ Thống
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-[#1E293B]/50 rounded-lg border border-[#334155]/50">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-sm text-blue-200">Blockchain</span>
                    </div>
                    <span className="text-sm text-green-400">Hoạt động</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#1E293B]/50 rounded-lg border border-[#334155]/50">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-sm text-blue-200">Máy chủ</span>
                    </div>
                    <span className="text-sm text-green-400">Hoạt động</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#1E293B]/50 rounded-lg border border-[#334155]/50">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-sm text-blue-200">Xác thực</span>
                    </div>
                    <span className="text-sm text-green-400">Hoạt động</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#1E293B]/30 backdrop-blur-md rounded-2xl border border-[#334155]/50 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 text-blue-400 mr-2" />
                  Cuộc Bầu Cử Sắp Tới
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">Bầu Ban Chủ Nhiệm CLB</h3>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                        Sắp diễn ra
                      </span>
                    </div>
                    <p className="text-sm text-blue-200/70 mb-3">
                      Bầu chọn ban chủ nhiệm câu lạc bộ nhiệm kỳ 2023-2024
                    </p>
                    <div className="flex justify-between text-xs text-blue-300">
                      <span>Bắt đầu: 10/06/2023</span>
                      <span>Kết thúc: 15/06/2023</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1E293B]/50 rounded-lg border border-[#334155]/50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">Bầu Đại Biểu Hội Nghị</h3>
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                        Chuẩn bị
                      </span>
                    </div>
                    <p className="text-sm text-blue-200/70 mb-3">
                      Bầu đại biểu tham dự hội nghị sinh viên toàn quốc
                    </p>
                    <div className="flex justify-between text-xs text-blue-300">
                      <span>Bắt đầu: 20/06/2023</span>
                      <span>Kết thúc: 25/06/2023</span>
                    </div>
                  </div>
                </div>

                <NavLink
                  to="/app/cuoc-bau-cu"
                  className="flex items-center justify-center mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  Xem tất cả cuộc bầu cử
                  <ChevronRight className="h-4 w-4 ml-1" />
                </NavLink>
              </motion.div>
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-12 text-center text-blue-200/50 text-sm">
            <p>© 2023 BlockVote - Nền tảng bầu cử blockchain. Bản quyền thuộc về Holihu.</p>
          </footer>
        </div>
      </div>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
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
              className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Xác nhận đăng xuất</h3>
              <p className="text-blue-200/80 mb-6">
                Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 px-4 bg-[#334155] hover:bg-[#475569] text-white rounded-lg transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                >
                  Đăng xuất
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
