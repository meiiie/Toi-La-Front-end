'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { NavLink, Link, useSearchParams, useLocation } from 'react-router-dom';
import { FaSignInAlt, FaList, FaHome, FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { HiOutlineCube } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import UserMenu from './UserMenu';
import { Button } from '../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/Dropdown-Menu';
import { Input } from '../components/ui/Input';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const [, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setSearchParams({ search: value });
  };

  const isCurrentPath = (path: string) => location.pathname === path;

  const headerBg =
    theme === 'dark'
      ? isScrolled
        ? 'bg-[#0A1416]/80 backdrop-blur-md shadow-[0_4px_30px_rgba(2,136,209,0.2)]'
        : 'bg-transparent'
      : isScrolled
        ? 'bg-white/80 backdrop-blur-md shadow-[0_4px_30px_rgba(2,136,209,0.1)]'
        : 'bg-transparent';

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-500 ${headerBg}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div
              className={`relative rounded-full p-2 border border-[#0288D1]/30 group-hover:border-[#0288D1] transition-colors duration-300 ${
                theme === 'dark' ? 'bg-[#0A1416]' : 'bg-white'
              }`}
            >
              <HiOutlineCube className="h-8 w-8 text-[#0288D1] group-hover:text-[#E1F5FE] transition-colors duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span
              className={`font-bold text-xl tracking-wider ${
                theme === 'dark' ? 'text-white' : 'text-[#0A1416]'
              }`}
            >
              BLOCKCHAIN
            </span>
            <span className="text-xs text-[#B0BEC5] tracking-widest">BẦU CỬ MINH BẠCH</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <NavLink
            to={user ? '/app' : '/'}
            className={({ isActive }) =>
              `text-base font-medium transition-all duration-300 relative group ${
                isActive
                  ? 'text-[#0288D1]'
                  : theme === 'dark'
                    ? 'text-white hover:text-[#0288D1]'
                    : 'text-[#0A1416] hover:text-[#0288D1]'
              } ${isCurrentPath(user ? '/app' : '/') ? 'pointer-events-none' : ''}`
            }
          >
            <div className="flex items-center space-x-2">
              <FaHome className="text-lg" />
              <span>{user ? 'Trang Chủ Bầu Cử' : 'Trang Chủ'}</span>
            </div>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] group-hover:w-full transition-all duration-300"></span>
          </NavLink>

          <NavLink
            to="/elections"
            className={({ isActive }) =>
              `text-base font-medium transition-all duration-300 relative group ${
                isActive
                  ? 'text-[#0288D1]'
                  : theme === 'dark'
                    ? 'text-white hover:text-[#0288D1]'
                    : 'text-[#0A1416] hover:text-[#0288D1]'
              } ${isCurrentPath('/elections') ? 'pointer-events-none' : ''}`
            }
          >
            <div className="flex items-center space-x-2">
              <FaList className="text-lg" />
              <span>Xem Các Cuộc Bầu Cử</span>
            </div>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] group-hover:w-full transition-all duration-300"></span>
          </NavLink>

          {!user ? (
            <NavLink
              to="/login"
              className="px-6 py-2 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full text-white font-medium text-base flex items-center gap-2 shadow-[0_0_15px_rgba(2,136,209,0.3)] hover:shadow-[0_0_25px_rgba(2,136,209,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <FaSignInAlt className="text-lg" />
              <span>Đăng Nhập</span>
            </NavLink>
          ) : (
            <UserMenu />
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </nav>

        {/* Search and Mobile Menu */}
        <div className="flex items-center space-x-6">
          {location.pathname === '/elections' && (
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-[#0288D1] text-lg" />
              </div>
              <Input
                type="text"
                placeholder="Tìm kiếm cuộc bầu cử"
                value={searchTerm}
                onChange={handleSearchChange}
                className={`w-72 pl-10 pr-4 py-2 border border-[#455A64] focus:border-[#0288D1] rounded-full placeholder-[#B0BEC5] focus:ring-[#0288D1]/30 focus:ring-2 outline-none transition-all duration-300 ${
                  theme === 'dark' ? 'bg-[#263238]/80 text-white' : 'bg-white/90 text-[#0A1416]'
                }`}
              />
            </div>
          )}

          {/* Mobile Menu Button */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden relative">
                <div className="absolute inset-0 bg-[#0288D1]/10 rounded-full blur-md opacity-0 hover:opacity-70 transition-opacity duration-300"></div>
                <div
                  className={`relative rounded-full p-2 border border-[#455A64] hover:border-[#0288D1] transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-[#263238]/80' : 'bg-white/90'
                  }`}
                >
                  {menuOpen ? (
                    <FaTimes
                      className={theme === 'dark' ? 'text-white h-5 w-5' : 'text-[#0A1416] h-5 w-5'}
                    />
                  ) : (
                    <FaBars
                      className={theme === 'dark' ? 'text-white h-5 w-5' : 'text-[#0A1416] h-5 w-5'}
                    />
                  )}
                </div>
                <span className="sr-only">Mở menu</span>
              </Button>
            </DropdownMenuTrigger>

            {/* Mobile Menu Dropdown */}
            <DropdownMenuContent
              align="end"
              className={`w-72 backdrop-blur-md border border-[#455A64] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] p-4 mt-2 z-50 ${
                theme === 'dark' ? 'bg-[#263238]/95' : 'bg-white/95'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <DropdownMenuItem
                  asChild
                  className={`hover:bg-[#37474F] rounded-lg transition-colors duration-200 p-3 ${
                    theme === 'dark' ? '' : 'hover:bg-[#E1F5FE]'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <NavLink
                    to={user ? '/app' : '/'}
                    className={`flex items-center space-x-3 ${
                      theme === 'dark'
                        ? 'text-white hover:text-[#0288D1]'
                        : 'text-[#0A1416] hover:text-[#0288D1]'
                    }`}
                  >
                    <FaHome className="text-xl text-[#0288D1]" />
                    <span>{user ? 'Trang Chủ Bầu Cử' : 'Trang Chủ'}</span>
                  </NavLink>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className={`hover:bg-[#37474F] rounded-lg transition-colors duration-200 p-3 ${
                    theme === 'dark' ? '' : 'hover:bg-[#E1F5FE]'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <NavLink
                    to="/elections"
                    className={`flex items-center space-x-3 ${
                      theme === 'dark'
                        ? 'text-white hover:text-[#0288D1]'
                        : 'text-[#0A1416] hover:text-[#0288D1]'
                    }`}
                  >
                    <FaList className="text-xl text-[#0288D1]" />
                    <span>Xem Các Cuộc Bầu Cử</span>
                  </NavLink>
                </DropdownMenuItem>

                {!user ? (
                  <DropdownMenuItem
                    asChild
                    className={`hover:bg-[#37474F] rounded-lg transition-colors duration-200 p-3 ${
                      theme === 'dark' ? '' : 'hover:bg-[#E1F5FE]'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <NavLink
                      to="/login"
                      className={`flex items-center space-x-3 ${
                        theme === 'dark'
                          ? 'text-white hover:text-[#0288D1]'
                          : 'text-[#0A1416] hover:text-[#0288D1]'
                      }`}
                    >
                      <FaSignInAlt className="text-xl text-[#0288D1]" />
                      <span>Đăng Nhập</span>
                    </NavLink>
                  </DropdownMenuItem>
                ) : (
                  <div className="p-3">
                    <UserMenu inMobileMenu={true} />
                  </div>
                )}

                {location.pathname === '/elections' && (
                  <div className="relative mt-4 p-3">
                    <div className="absolute inset-y-0 left-3 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-[#0288D1] text-lg" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Tìm kiếm cuộc bầu cử"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className={`w-full pl-10 pr-4 py-2 border border-[#455A64] focus:border-[#0288D1] rounded-full placeholder-[#B0BEC5] focus:ring-[#0288D1]/30 focus:ring-2 outline-none transition-all duration-300 ${
                        theme === 'dark' ? 'bg-[#37474F] text-white' : 'bg-white text-[#0A1416]'
                      }`}
                    />
                  </div>
                )}

                {/* Theme Toggle in Mobile Menu */}
                <div className="flex justify-center mt-4">
                  <ThemeToggle />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Animated Border Bottom */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#0288D1]/50 to-transparent"></div>
    </header>
  );
}
