'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import {
  FaHome,
  FaPlus,
  FaBell,
  FaUserShield,
  FaUserTag,
  FaSearch,
  FaBars,
  FaPoll,
  FaMoon,
  FaSun,
  FaFileAlt,
  FaQrcode,
  FaAward,
  FaChartBar,
  FaCode,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import SidebarItem from './SidebarItem';
import UserMenu from './UserMenu';
import type { RootState } from '../store/store';
import { Switch } from './ui/Switch';
import { Layers } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const search = event.target.value;
    if (search) {
      setSearchParams({ search });
    } else {
      setSearchParams({});
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isAdmin = currentUser?.vaiTro
    ? currentUser?.vaiTro.tenVaiTro?.includes('Quan Tri Vien')
    : false;

  return (
    <>
      {/* Mobile Navigation */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 z-50 ${
          isDropdownOpen ? 'h-screen' : 'h-auto'
        }`}
      >
        <div className="bg-gradient-to-b from-[#0A0F18] to-[#121A29] text-white border-b border-[#2A3A5A] shadow-lg">
          <div className="flex items-center justify-between p-4 h-16">
            <NavLink to="/" aria-label="Trang chủ" className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-2">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                HoLiHu BlockVote
              </h1>
            </NavLink>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-white bg-[#1E293B] p-2 rounded-lg transition-all duration-200 hover:bg-[#2A3A5A] hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              aria-label="Mở/Đóng menu"
            >
              <FaBars size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-16 bg-gradient-to-b from-[#0A0F18] to-[#121A29] backdrop-blur-md overflow-auto z-40 pb-6"
            >
              <div className="p-4">
                {/* UserMenu at the top for mobile */}
                <div className="mb-4">
                  <UserMenu />
                </div>

                {/* Tìm kiếm đã được di chuyển lên trên */}
                <div className="relative mb-4">
                  <input
                    type="search"
                    name="search"
                    placeholder="Tìm kiếm"
                    defaultValue={searchParams.get('search') ?? ''}
                    onChange={handleSearch}
                    className="w-full p-2 pl-10 rounded-lg text-white bg-[#1E293B]/70 border border-[#2A3A5A] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                    tabIndex={0}
                    aria-label="Tìm kiếm"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                </div>

                <div className="border-t border-[#2A3A5A] my-4"></div>

                <div className="space-y-1 mb-6">
                  <div className="px-3 py-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    Menu chính
                  </div>
                  <SidebarItem to="/app" icon={<FaHome />} label="Trang chủ" />
                  <SidebarItem
                    to="/app/tao-phien-bau-cu"
                    icon={<FaPlus />}
                    label="Tạo cuộc bầu cử"
                  />
                  <SidebarItem to="/app/upcoming-elections" icon={<FaBell />} label="Thông báo" />
                  <SidebarItem
                    to="/app/user-elections"
                    icon={<FaPoll />}
                    label="Quản lý cuộc bầu cử"
                  />
                </div>

                <div className="space-y-1 mb-6">
                  <div className="px-3 py-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    Công cụ
                  </div>
                  <SidebarItem to="/app/quan-ly-file" icon={<FaFileAlt />} label="Quản Lý File" />
                  <SidebarItem to="/app/quet-ma-qr" icon={<FaQrcode />} label="Quét mã QR" />
                  <SidebarItem to="/app/quan-ly-thanh-tuu" icon={<FaAward />} label="Thành Tựu" />
                  <SidebarItem
                    to="/app/ket-qua-bau-cu"
                    icon={<FaChartBar />}
                    label="Kết Quả Bầu Cử"
                  />
                </div>

                {isAdmin && (
                  <div className="space-y-1 mb-6">
                    <div className="px-3 py-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                      Quản trị viên
                    </div>
                    <SidebarItem
                      to="/app/role-management"
                      icon={<FaUserShield />}
                      label="Quản lý vai trò"
                    />
                    <SidebarItem
                      to="/app/role-assignment"
                      icon={<FaUserTag />}
                      label="Phân quyền"
                    />
                    <SidebarItem
                      to="/app/quan-ly-smart-contract"
                      icon={<FaCode />}
                      label="Quản Lý Smart Contract"
                    />
                  </div>
                )}

                {/* Chế độ tối được di chuyển xuống dưới cùng */}
                <div className="border-t border-[#2A3A5A] mt-6 mb-4 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-200">Chế độ tối</span>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={toggleDarkMode}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar */}
      <motion.nav
        className={`text-white h-screen fixed top-0 left-0 bg-gradient-to-b from-[#0A0F18] to-[#121A29] border-r border-[#2A3A5A] shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out z-40 overflow-y-auto hidden md:block`}
        initial={false}
        animate={{
          width: isSidebarOpen ? 280 : 80,
        }}
        transition={{ duration: 0.3 }}
        aria-label="Sidebar"
        role="navigation"
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6">
            {isSidebarOpen ? (
              <NavLink to="/" aria-label="Trang chủ" className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-2">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  HoLiHu BlockVote
                </h1>
              </NavLink>
            ) : (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <button
                  onClick={toggleSidebar}
                  className="text-white bg-[#1E293B] p-2 rounded-lg transition-all duration-200 hover:bg-[#2A3A5A] hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                  aria-label="Mở/Đóng thanh bên"
                >
                  <FaBars size={18} />
                </button>
              </div>
            )}

            {isSidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="text-white bg-[#1E293B] p-2 rounded-lg transition-all duration-200 hover:bg-[#2A3A5A] hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                aria-label="Mở/Đóng thanh bên"
              >
                <FaBars size={18} />
              </button>
            )}
          </div>

          {/* UserMenu at the top for desktop */}
          <div className="mb-6">
            <UserMenu isCollapsed={!isSidebarOpen} />
          </div>

          {/* Tìm kiếm đã được di chuyển lên trên */}
          {isSidebarOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative mb-4"
            >
              <input
                type="search"
                name="search"
                placeholder="Tìm kiếm"
                defaultValue={searchParams.get('search') ?? ''}
                onChange={handleSearch}
                className="w-full p-2 pl-10 rounded-lg text-white bg-[#1E293B]/70 border border-[#2A3A5A] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                tabIndex={0}
                aria-label="Tìm kiếm"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
            </motion.div>
          ) : (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => alert('Mở chế độ tìm kiếm')}
                className="p-2 rounded-lg bg-[#1E293B] hover:bg-[#2A3A5A] transition-colors duration-200"
                aria-label="Tìm kiếm"
              >
                <FaSearch className="h-5 w-5 text-blue-400" />
              </button>
            </div>
          )}

          <div className="border-t border-[#2A3A5A] my-4"></div>

          <div className="space-y-1 mt-4 mb-6">
            {isSidebarOpen && (
              <div className="px-3 py-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Menu chính
              </div>
            )}
            <SidebarItem
              to="/app"
              icon={<FaHome />}
              label="Trang chủ"
              isCollapsed={!isSidebarOpen}
            />
            <SidebarItem
              to="/app/tao-phien-bau-cu"
              icon={<FaPlus />}
              label="Tạo cuộc bầu cử"
              isCollapsed={!isSidebarOpen}
            />
            <SidebarItem
              to="/app/upcoming-elections"
              icon={<FaBell />}
              label="Thông báo"
              isCollapsed={!isSidebarOpen}
            />
            <SidebarItem
              to="/app/user-elections"
              icon={<FaPoll />}
              label="Quản lý cuộc bầu cử"
              isCollapsed={!isSidebarOpen}
            />
          </div>

          <div className="space-y-1 mb-6">
            {isSidebarOpen && (
              <div className="px-3 py-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Công cụ
              </div>
            )}
            <SidebarItem
              to="/app/quan-ly-file"
              icon={<FaFileAlt />}
              label="Quản Lý File"
              isCollapsed={!isSidebarOpen}
            />
            <SidebarItem
              to="/app/quet-ma-qr"
              icon={<FaQrcode />}
              label="Quét mã QR"
              isCollapsed={!isSidebarOpen}
            />
            <SidebarItem
              to="/app/quan-ly-thanh-tuu"
              icon={<FaAward />}
              label="Thành Tựu"
              isCollapsed={!isSidebarOpen}
            />
            <SidebarItem
              to="/app/ket-qua-bau-cu"
              icon={<FaChartBar />}
              label="Kết Quả Bầu Cử"
              isCollapsed={!isSidebarOpen}
            />
          </div>

          {isAdmin && (
            <div className="space-y-1 mb-6">
              {isSidebarOpen && (
                <div className="px-3 py-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Quản trị viên
                </div>
              )}
              <SidebarItem
                to="/app/role-management"
                icon={<FaUserShield />}
                label="Quản lý vai trò"
                isCollapsed={!isSidebarOpen}
              />
              <SidebarItem
                to="/app/role-assignment"
                icon={<FaUserTag />}
                label="Phân quyền"
                isCollapsed={!isSidebarOpen}
              />
              <SidebarItem
                to="/app/quan-ly-smart-contract"
                icon={<FaCode />}
                label="Quản Lý Smart Contract"
                isCollapsed={!isSidebarOpen}
              />
            </div>
          )}

          {/* Thêm div flex-grow để đẩy chế độ tối xuống dưới cùng */}
          <div className="flex-grow"></div>

          {/* Thêm div flex-grow để đẩy chế độ tối xuống dưới cùng */}
          <div className="flex-grow"></div>

          {/* Chế độ tối được di chuyển xuống dưới cùng */}
          <div className="border-t border-[#2A3A5A] mt-2 pt-4 pb-4">
            {isSidebarOpen ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-200">Chế độ tối</span>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                  sunIcon={<FaSun className="text-yellow-500" />}
                  moonIcon={<FaMoon className="text-gray-300" />}
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-[#1E293B] hover:bg-[#2A3A5A] transition-colors duration-200"
                >
                  {isDarkMode ? (
                    <FaMoon className="h-5 w-5 text-blue-400" />
                  ) : (
                    <FaSun className="h-5 w-5 text-yellow-400" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Sidebar;
