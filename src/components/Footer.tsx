'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { FaFacebook, FaTwitter, FaGithub, FaDiscord } from 'react-icons/fa';
import {
  HiOutlineCube,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineGlobe,
} from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { subscribe, resetState } from '../store/slice/nhanThongTinSlice';
import type { RootState, AppDispatch } from '../store/store';
import type { SubscribeData } from '../store/types';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Redux state
  const dispatch = useDispatch<AppDispatch>();
  const { loading, success, message, error } = useSelector(
    (state: RootState) => state.nhanThongTin,
  );

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetState());
    };
  }, [dispatch]);

  // Reset form after successful submission
  useEffect(() => {
    if (success) {
      setEmail('');

      // Reset state after 5 seconds
      const timer = setTimeout(() => {
        dispatch(resetState());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  // Validate email
  const validateEmail = (email: string): boolean => {
    const regex = /\S+@\S+\.\S+/;
    if (!email) {
      setEmailError('Email không được để trống');
      return false;
    } else if (!regex.test(email)) {
      setEmailError('Địa chỉ email không hợp lệ');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Handle form submission
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateEmail(email)) {
      const subscribeData: SubscribeData = { email };
      dispatch(subscribe(subscribeData));
    }
  };

  // Light mode styles
  const lightBg = 'bg-[#f5f5f5]';
  const lightBgMedium = 'bg-[#e0e0e0]';
  const lightText = 'text-[#212121]';
  const lightTextSecondary = 'text-[#616161]';
  const lightBorder = 'border-[#bdbdbd]';
  const lightHoverBg = 'hover:bg-[#e1f5fe]';

  return (
    <footer
      className={`relative ${
        theme === 'dark' ? 'bg-[#0A1416]' : lightBg
      } text-white overflow-hidden`}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="hexagon-grid opacity-10">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="hexagon"
              style={
                {
                  '--x': `${Math.random() * 100}%`,
                  '--y': `${Math.random() * 100}%`,
                  '--size': `${Math.random() * 100 + 50}px`,
                  '--rotation': `${Math.random() * 360}deg`,
                  '--opacity': Math.random() * 0.1 + 0.05,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>

      {/* Top Wave Divider */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 120"
          className={`w-full ${theme === 'dark' ? 'fill-[#263238]' : 'fill-[#e0e0e0]'}`}
        >
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* Main Footer Content */}
      <div
        className={`relative ${theme === 'dark' ? 'bg-[#263238]' : lightBgMedium} pt-12 pb-16 z-10`}
      >
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full blur-md opacity-70"></div>
                <div
                  className={`relative rounded-full p-2 border border-[#0288D1]/30 ${
                    theme === 'dark' ? 'bg-[#0A1416]' : 'bg-white'
                  }`}
                >
                  <HiOutlineCube className="h-8 w-8 text-[#0288D1]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-bold text-xl tracking-wider ${
                    theme === 'dark' ? 'text-white' : lightText
                  }`}
                >
                  BLOCKCHAIN
                </span>
                <span className="text-xs text-[#B0BEC5] tracking-widest">BẦU CỬ MINH BẠCH</span>
              </div>
            </div>

            <p
              className={`${
                theme === 'dark' ? 'text-[#B0BEC5]' : lightTextSecondary
              } leading-relaxed`}
            >
              Nền tảng bầu cử blockchain đầu tiên tại Việt Nam, mang đến sự minh bạch tuyệt đối và
              bảo mật không thể xâm phạm.
            </p>

            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-[#37474F] hover:bg-[#0288D1]'
                    : `bg-[#e0e0e0] ${lightHoverBg}`
                }`}
                aria-label="Facebook"
              >
                <FaFacebook size={18} className={theme === 'dark' ? 'text-white' : lightText} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-[#37474F] hover:bg-[#0288D1]'
                    : `bg-[#e0e0e0] ${lightHoverBg}`
                }`}
                aria-label="Twitter"
              >
                <FaTwitter size={18} className={theme === 'dark' ? 'text-white' : lightText} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-[#37474F] hover:bg-[#0288D1]'
                    : `bg-[#e0e0e0] ${lightHoverBg}`
                }`}
                aria-label="GitHub"
              >
                <FaGithub size={18} className={theme === 'dark' ? 'text-white' : lightText} />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-[#37474F] hover:bg-[#0288D1]'
                    : `bg-[#e0e0e0] ${lightHoverBg}`
                }`}
                aria-label="Discord"
              >
                <FaDiscord size={18} className={theme === 'dark' ? 'text-white' : lightText} />
              </a>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-6">
            <h3
              className={`text-xl font-bold relative inline-block ${
                theme === 'dark' ? 'text-white' : lightText
              }`}
            >
              Liên Kết Nhanh
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]"></div>
            </h3>

            <ul className="space-y-4">
              <li>
                <a
                  href="/"
                  className={`${
                    theme === 'dark'
                      ? 'text-[#B0BEC5] hover:text-white'
                      : `${lightTextSecondary} hover:text-[#0288D1]`
                  } transition-colors duration-300 flex items-center`}
                >
                  <span className="w-2 h-2 bg-[#0288D1] rounded-full mr-3"></span>
                  Trang Chủ
                </a>
              </li>
              <li>
                <a
                  href="/elections"
                  className={`${
                    theme === 'dark'
                      ? 'text-[#B0BEC5] hover:text-white'
                      : `${lightTextSecondary} hover:text-[#0288D1]`
                  } transition-colors duration-300 flex items-center`}
                >
                  <span className="w-2 h-2 bg-[#0288D1] rounded-full mr-3"></span>
                  Xem Các Cuộc Bầu Cử
                </a>
              </li>
              <li>
                <a
                  href="https://geth.holihu.online"
                  className={`${
                    theme === 'dark'
                      ? 'text-[#B0BEC5] hover:text-white'
                      : `${lightTextSecondary} hover:text-[#0288D1]`
                  } transition-colors duration-300 flex items-center`}
                >
                  <span className="w-2 h-2 bg-[#0288D1] rounded-full mr-3"></span>
                  Về Chúng Tôi
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className={`${
                    theme === 'dark'
                      ? 'text-[#B0BEC5] hover:text-white'
                      : `${lightTextSecondary} hover:text-[#0288D1]`
                  } transition-colors duration-300 flex items-center`}
                >
                  <span className="w-2 h-2 bg-[#0288D1] rounded-full mr-3"></span>
                  Câu Hỏi Thường Gặp
                </a>
              </li>
              <li>
                <a
                  href="/lien-he"
                  className={`${
                    theme === 'dark'
                      ? 'text-[#B0BEC5] hover:text-white'
                      : `${lightTextSecondary} hover:text-[#0288D1]`
                  } transition-colors duration-300 flex items-center`}
                >
                  <span className="w-2 h-2 bg-[#0288D1] rounded-full mr-3"></span>
                  Liên Hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h3
              className={`text-xl font-bold relative inline-block ${
                theme === 'dark' ? 'text-white' : lightText
              }`}
            >
              Liên Hệ
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]"></div>
            </h3>

            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <HiOutlineGlobe className="text-[#0288D1] text-xl mt-1 flex-shrink-0" />
                <span className={theme === 'dark' ? 'text-[#B0BEC5]' : lightTextSecondary}>
                  484 Lạch Tray, Kênh Dương, Lê Chân, Hải Phòng, Việt Nam
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <svg
                  className="text-[#0288D1] h-5 w-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:contact@blockchain-election.vn"
                  className={`${
                    theme === 'dark'
                      ? 'text-[#B0BEC5] hover:text-white'
                      : `${lightTextSecondary} hover:text-[#0288D1]`
                  } transition-colors duration-300`}
                >
                  contact@blockchain-election.vn
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <svg
                  className="text-[#0288D1] h-5 w-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className={theme === 'dark' ? 'text-[#B0BEC5]' : lightTextSecondary}>
                  +84 123 456 789
                </span>
              </li>
            </ul>

            <div className="pt-4">
              <h4
                className={
                  theme === 'dark' ? 'text-white font-medium mb-3' : `${lightText} font-medium mb-3`
                }
              >
                Đăng Ký Nhận Tin
              </h4>

              {/* Success Message */}
              {success && (
                <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded-lg flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-green-800 text-sm">{message}</span>
                </div>
              )}

              {/* Error Message */}
              {(error || emailError) && (
                <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-800 text-sm">{error || emailError}</span>
                </div>
              )}

              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  className={`flex-grow px-4 py-2 border focus:outline-none ${
                    emailError
                      ? 'border-red-500'
                      : theme === 'dark'
                        ? 'bg-[#37474F] border-[#455A64] focus:border-[#0288D1] text-white placeholder-[#B0BEC5]'
                        : 'bg-white border-[#bdbdbd] focus:border-[#0288D1] text-[#212121] placeholder-[#9e9e9e]'
                  } rounded-l-full`}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-r-full text-white font-medium hover:shadow-[0_0_15px_rgba(2,136,209,0.5)] transition-all duration-300 flex items-center justify-center ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Đăng Ký'}
                </button>
              </form>
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-6">
            <h3
              className={`text-xl font-bold relative inline-block ${
                theme === 'dark' ? 'text-white' : lightText
              }`}
            >
              Trường Đại Học Hàng Hải Việt Nam
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]"></div>
            </h3>

            <div
              className={`rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)] border ${
                theme === 'dark' ? 'border-[#455A64]' : lightBorder
              }`}
            >
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                title="Map to Trường Đại Học Hàng Hải Việt Nam"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.1234567890123!2d106.6947662!3d20.8372291!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a7a9c2ee478df%3A0x6039ffe1614ede5c!2sTr%C6%B0%E1%BB%9Dng%20%C4%90%E1%BA%A1i%20h%E1%BB%8Dc%20H%C3%A0ng%20h%E1%BA%A3i%20Vi%E1%BB%87t%20Nam!5e0!3m2!1svi!2s!4v1690000000000!5m2!1svi!2s"
                aria-label="Bản đồ đến Trường Đại Học Hàng Hải Việt Nam"
              ></iframe>
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=Trường+Đại+Học+Hàng+Hải+Việt+Nam,484+Lạch+Tray,Kênh+Dương,Lê+Chân,Hải+Phòng,Việt+Nam&travelmode=driving"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-[#0288D1] hover:text-white transition-colors duration-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Chỉ đường từ vị trí của bạn</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className={`relative ${theme === 'dark' ? 'bg-[#0A1416]' : lightBg} py-6 z-10`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div
              className={
                theme === 'dark' ? 'text-[#B0BEC5] text-sm' : `${lightTextSecondary} text-sm`
              }
            >
              &copy; {currentYear} Ứng Dụng Bầu Cử Blockchain. All rights reserved.
            </div>

            <div className="flex space-x-6">
              <a
                href="/chinh-sach-bao-mat"
                className={`${
                  theme === 'dark'
                    ? 'text-[#B0BEC5] hover:text-white'
                    : `${lightTextSecondary} hover:text-[#0288D1]`
                } text-sm transition-colors duration-300 flex items-center space-x-2`}
              >
                <HiOutlineShieldCheck className="text-[#0288D1]" />
                <span>Chính sách bảo mật</span>
              </a>
              <a
                href="/dieu-khoan-su-dung"
                className={`${
                  theme === 'dark'
                    ? 'text-[#B0BEC5] hover:text-white'
                    : `${lightTextSecondary} hover:text-[#0288D1]`
                } text-sm transition-colors duration-300 flex items-center space-x-2`}
              >
                <HiOutlineLockClosed className="text-[#0288D1]" />
                <span>Điều khoản sử dụng</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
