'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { logoutThat } from '../store/slice/dangXuatTaiKhoanSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useWeb3 } from '../context/Web3Context';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  History,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { FaEthereum } from 'react-icons/fa';
import { fetchAddressDetails } from '../store/sliceBlockchain/blockchainSlice';

interface UserMenuProps {
  isCollapsed?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ isCollapsed = false }) => {
  const { taiKhoan: user } = useSelector((state: RootState) => state.dangNhapTaiKhoan);
  const { hluBalance, isLoading: blockchainLoading } = useSelector(
    (state: RootState) => state.blockchain,
  );
  const { disconnectWallet } = useWeb3();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Cập nhật vị trí menu khi toggle
  useEffect(() => {
    if (isAccountMenuOpen && buttonRef.current && !isMobile) {
      const rect = buttonRef.current.getBoundingClientRect();

      if (isCollapsed) {
        // Khi sidebar thu gọn, hiển thị menu bên phải của nút
        setMenuPosition({
          top: rect.top,
          left: rect.right + 8,
        });
      } else {
        // Khi sidebar mở rộng, hiển thị menu bên dưới nút
        setMenuPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    }
  }, [isAccountMenuOpen, isCollapsed, isMobile]);

  // Lấy thông tin ví khi component mount
  useEffect(() => {
    if (user?.diaChiVi) {
      dispatch(fetchAddressDetails(user.diaChiVi));
    }
  }, [dispatch, user?.diaChiVi]);

  // Định dạng tên người dùng
  const formatName = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Lấy tên hiển thị
  const displayName = user?.tenHienThi || user?.diaChiVi || user?.email || 'Khách';

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

  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      setIsAccountMenuOpen(false);
      await dispatch(logoutThat());
      if (user?.isMetaMask) {
        disconnectWallet();
      }
      toast.success('Đăng xuất thành công');
      navigate('/');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  // Làm mới số dư
  const refreshBalance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.diaChiVi) return;

    setIsRefreshing(true);
    try {
      await dispatch(fetchAddressDetails(user.diaChiVi));
      toast.success('Đã cập nhật thông tin ví');
    } catch (error) {
      toast.error('Không thể cập nhật thông tin ví');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Click bên ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Replace the copyToClipboard function with this more robust implementation
  const copyToClipboard = (text: string) => {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);

    // Select and copy the text
    textArea.focus();
    textArea.select();

    let successful = false;
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            toast.success('Đã sao chép địa chỉ ví');
          })
          .catch(() => {
            // Fallback to document.execCommand
            successful = document.execCommand('copy');
            if (successful) {
              toast.success('Đã sao chép địa chỉ ví');
            } else {
              toast.error('Không thể sao chép địa chỉ ví');
            }
          });
      } else {
        // Fallback for browsers without clipboard API
        successful = document.execCommand('copy');
        if (successful) {
          toast.success('Đã sao chép địa chỉ ví');
        } else {
          toast.error('Không thể sao chép địa chỉ ví');
        }
      }
    } catch (err) {
      console.error('Lỗi khi sao chép:', err);
      toast.error('Không thể sao chép địa chỉ ví');
    }

    // Clean up
    document.body.removeChild(textArea);
  };

  return (
    <div className="relative user-menu-container" ref={menuRef}>
      {isCollapsed ? (
        // Collapsed version
        <button
          ref={buttonRef}
          onClick={toggleAccountMenu}
          className="w-full flex justify-center items-center p-2"
          aria-expanded={isAccountMenuOpen}
          aria-haspopup="true"
        >
          <div className="aspect-square w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            {user?.anhDaiDien ? (
              <img
                src={user.anhDaiDien || '/placeholder.svg?height=48&width=48'}
                alt={displayName}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
        </button>
      ) : (
        // Expanded version
        <button
          ref={buttonRef}
          onClick={toggleAccountMenu}
          className="w-full flex items-center space-x-2 bg-[#1E293B]/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#334155]/50 hover:bg-[#1E293B]/80 transition-colors duration-200"
          aria-expanded={isAccountMenuOpen}
          aria-haspopup="true"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            {user?.anhDaiDien ? (
              <img
                src={user.anhDaiDien || '/placeholder.svg?height=40&width=40'}
                alt={displayName}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{formatName(displayName)}</p>
            <p className="text-xs text-blue-300 truncate">{userRole}</p>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-blue-300 transition-transform duration-200 flex-shrink-0 ${
              isAccountMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      <AnimatePresence>
        {isAccountMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              ${isMobile ? 'absolute right-0 top-full mt-2 z-50 w-full' : 'fixed z-[60] w-64'}
            `}
            style={{
              transformOrigin: isMobile ? 'top right' : isCollapsed ? 'left center' : 'top left',
              ...(isMobile
                ? {}
                : {
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`,
                  }),
            }}
          >
            <div className="bg-[#1E293B]/90 backdrop-blur-md rounded-xl border border-[#334155]/70 shadow-lg overflow-hidden">
              {/* User info header */}
              <div className="p-4 border-b border-[#334155]/70">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    {user?.anhDaiDien ? (
                      <img
                        src={user.anhDaiDien || '/placeholder.svg?height=40&width=40'}
                        alt={displayName}
                        className="h-full w-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {formatName(displayName)}
                    </p>
                    <p className="text-xs text-blue-300 truncate">{userRole}</p>
                  </div>
                </div>

                {/* User badges/status */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {user?.diaChiVi && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (user.diaChiVi) {
                          copyToClipboard(user.diaChiVi);
                        } else {
                          toast.error('Địa chỉ ví không hợp lệ');
                        }
                      }}
                      className="flex items-center bg-[#0D1321]/50 px-2 py-1 rounded-full border border-[#334155]/50 hover:bg-[#0D1321]/70 hover:border-blue-500/50 active:bg-[#0D1321]/90 transition-colors duration-200 group cursor-pointer"
                      title="Nhấn để sao chép địa chỉ ví"
                    >
                      <FaEthereum className="h-3 w-3 text-orange-400 mr-1" />
                      <span className="text-xs text-blue-200 group-hover:text-blue-300">
                        {`${user.diaChiVi.substring(0, 4)}...${user.diaChiVi.substring(
                          user.diaChiVi.length - 4,
                        )}`}
                      </span>
                    </button>
                  )}

                  <div className="flex items-center bg-[#0D1321]/50 px-2 py-1 rounded-full border border-[#334155]/50">
                    <Shield className="h-3 w-3 text-green-400 mr-1" />
                    <span className="text-xs text-blue-200">Đã xác thực</span>
                  </div>
                </div>

                {/* Wallet balance */}
                {user?.diaChiVi && (
                  <div className="mt-3 p-3 bg-[#0D1321]/70 rounded-lg border border-[#334155]/70 flex items-center justify-between">
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 text-blue-400 mr-2" />
                      <div>
                        <span className="text-xs text-blue-300">Số dư HLU</span>
                        <p className="text-sm font-medium text-white">
                          {blockchainLoading ? (
                            <span className="inline-block w-12 h-4 bg-[#334155]/50 rounded animate-pulse"></span>
                          ) : (
                            `${formatBalance(hluBalance)} HLU`
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={refreshBalance}
                      disabled={isRefreshing || blockchainLoading}
                      className="p-1.5 rounded-md bg-[#334155]/50 hover:bg-[#334155] transition-colors duration-200 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 text-blue-300 ${
                          isRefreshing || blockchainLoading ? 'animate-spin' : ''
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Menu items */}
              <div className="py-1">
                <NavLink
                  to="/app/account-info"
                  className="flex items-center px-4 py-2.5 text-sm text-blue-100 hover:bg-blue-600/20 transition-colors duration-200"
                  onClick={() => setIsAccountMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-3 text-blue-400" />
                  Thông tin tài khoản
                </NavLink>

                <NavLink
                  to="/app/lich-su"
                  className="flex items-center px-4 py-2.5 text-sm text-blue-100 hover:bg-blue-600/20 transition-colors duration-200"
                  onClick={() => setIsAccountMenuOpen(false)}
                >
                  <History className="h-4 w-4 mr-3 text-blue-400" />
                  Lịch sử hoạt động
                </NavLink>

                <NavLink
                  to="/app/settings"
                  className="flex items-center px-4 py-2.5 text-sm text-blue-100 hover:bg-blue-600/20 transition-colors duration-200"
                  onClick={() => setIsAccountMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3 text-blue-400" />
                  Cài đặt
                </NavLink>

                <div className="border-t border-[#334155]/70 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-300 hover:bg-red-600/20 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4 mr-3 text-red-400" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1E293B] rounded-xl border border-[#334155] p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
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
                  onClick={confirmLogout}
                  className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                >
                  Đăng xuất
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
