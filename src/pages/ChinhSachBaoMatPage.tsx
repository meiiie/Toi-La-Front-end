'use client';

import { useState, useEffect, useRef } from 'react';
import Img from 'react-image';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Database,
  Server,
  Globe,
  Mail,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Cookie,
  Key,
  UserCheck,
  RefreshCw,
  Clock,
  HelpCircle,
} from 'lucide-react';
import SEO from '../components/SEO';

const ChinhSachBaoMat = () => {
  const theme = 'dark';
  const [isTocVisible, setIsTocVisible] = useState(true);
  const [activeSection, setActiveSection] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Parallax effect for hero section
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // SEO data
  const seoData = {
    title: 'Chính Sách Bảo Mật | Blockchain Holihu',
    description:
      'Chính sách bảo mật của nền tảng bầu cử blockchain. Tìm hiểu cách chúng tôi bảo vệ dữ liệu cá nhân và đảm bảo tính minh bạch trong quá trình bầu cử.',
    keywords: 'blockchain, bảo mật, chính sách, dữ liệu cá nhân, bầu cử, mã hóa, quyền riêng tư',
    author: 'Blockchain Election Hub',
    image:
      'https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=1200&auto=format&fit=crop',
    url: 'https://blockchain-election-hub.com/chinh-sach-bao-mat',
  };

  // Sections for the privacy policy
  const sections = [
    { id: 'gioi-thieu', title: 'Giới Thiệu', icon: <FileText className="w-5 h-5" /> },
    {
      id: 'thong-tin-thu-thap',
      title: 'Thông Tin Thu Thập',
      icon: <Database className="w-5 h-5" />,
    },
    { id: 'su-dung-thong-tin', title: 'Sử Dụng Thông Tin', icon: <Eye className="w-5 h-5" /> },
    { id: 'chia-se-thong-tin', title: 'Chia Sẻ Thông Tin', icon: <Globe className="w-5 h-5" /> },
    { id: 'bao-mat-du-lieu', title: 'Bảo Mật Dữ Liệu', icon: <Shield className="w-5 h-5" /> },
    { id: 'quyen-cua-ban', title: 'Quyền Của Bạn', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'cookie', title: 'Cookie & Công Nghệ', icon: <Cookie className="w-5 h-5" /> },
    {
      id: 'cap-nhat-chinh-sach',
      title: 'Cập Nhật Chính Sách',
      icon: <RefreshCw className="w-5 h-5" />,
    },
    { id: 'lien-he', title: 'Liên Hệ', icon: <Mail className="w-5 h-5" /> },
  ];

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide back to top button
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }

      // Update active section
      let currentSection = '';
      sections.forEach(({ id }) => {
        const section = sectionsRef.current[id];
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            currentSection = id;
          }
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  // Scroll to section
  const scrollToSection = (id: string) => {
    const section = sectionsRef.current[id];
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 100,
        behavior: 'smooth',
      });
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Light/dark mode styles
  const bgColor = theme === 'dark' ? 'bg-[#0A1416]' : 'bg-gray-50';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textSecondary = theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-600';
  const cardBg = theme === 'dark' ? 'bg-[#263238]' : 'bg-white';
  const cardBorder = theme === 'dark' ? 'border-[#455A64]' : 'border-gray-200';
  const highlightBg = theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50';
  const highlightBorder = theme === 'dark' ? 'border-[#0288D1]' : 'border-blue-200';
  const linkColor =
    theme === 'dark'
      ? 'text-[#0288D1] hover:text-[#6A1B9A]'
      : 'text-blue-600 hover:text-purple-700';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} relative overflow-hidden`}>
      <SEO {...seoData} />

      {/* Hero Section with Parallax Effect */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: y1, opacity }} className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=2000&auto=format&fit=crop"
            alt="Blockchain Security Background"
            className="object-cover opacity-20 w-full h-full"
          />
          <div
            className={`absolute inset-0 ${
              theme === 'dark'
                ? 'bg-gradient-to-b from-[#0A1416]/80 to-[#0A1416]'
                : 'bg-gradient-to-b from-gray-50/80 to-gray-50'
            }`}
          ></div>
        </motion.div>

        <motion.div style={{ y: y2 }} className="relative z-10 text-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-6 inline-block"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] blur-xl opacity-30"></div>
              <div
                className={`relative w-24 h-24 mx-auto rounded-full ${
                  theme === 'dark' ? 'bg-[#263238]' : 'bg-white'
                } flex items-center justify-center border border-[#0288D1]/30`}
              >
                <Shield className="w-12 h-12 text-[#0288D1]" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 relative"
          >
            Chính Sách Bảo Mật
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-[#6A1B9A] to-[#0288D1] opacity-20 -z-10 scale-110"></div>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`max-w-2xl mx-auto text-lg ${textSecondary}`}
          >
            Bảo vệ dữ liệu cá nhân và đảm bảo tính minh bạch là ưu tiên hàng đầu của chúng tôi
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-8"
          >
            <button
              onClick={() => scrollToSection('gioi-thieu')}
              className="px-6 py-3 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white rounded-full font-medium hover:shadow-lg hover:shadow-[#0288D1]/20 transition-all duration-300 transform hover:scale-105"
            >
              Tìm Hiểu Thêm
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="w-full lg:w-1/4 lg:sticky lg:top-24 lg:self-start mb-8 lg:mb-0">
            <div className={`${cardBg} border ${cardBorder} rounded-xl shadow-lg overflow-hidden`}>
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-[#0288D1]" />
                  Mục Lục
                </h2>
                <button
                  onClick={() => setIsTocVisible(!isTocVisible)}
                  className={`p-2 rounded-full ${
                    theme === 'dark' ? 'hover:bg-[#37474F]' : 'hover:bg-gray-100'
                  } transition-colors`}
                  aria-label="Toggle table of contents"
                >
                  {isTocVisible ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isTocVisible && (
                <nav className="p-4">
                  <ul className="space-y-3">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-colors ${
                            activeSection === section.id
                              ? `${
                                  theme === 'dark'
                                    ? 'bg-[#37474F] text-white'
                                    : 'bg-blue-50 text-blue-700'
                                }`
                              : `${
                                  theme === 'dark' ? 'hover:bg-[#37474F]/50' : 'hover:bg-gray-100'
                                }`
                          }`}
                        >
                          <span
                            className={`mr-3 ${
                              activeSection === section.id ? 'text-[#0288D1]' : ''
                            }`}
                          >
                            {section.icon}
                          </span>
                          <span>{section.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              <div className={`p-4 border-t ${cardBorder}`}>
                <Link to="/" className={`flex items-center ${linkColor} transition-colors`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span>Quay Lại Trang Chủ</span>
                </Link>
              </div>
            </div>

            {/* Last Updated Info */}
            <div className={`mt-6 ${cardBg} border ${cardBorder} rounded-xl p-4 shadow-lg`}>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-[#0288D1]" />
                <span className={textSecondary}>Cập nhật lần cuối: 01/03/2025</span>
              </div>
            </div>

            {/* Help Box */}
            <div className={`mt-6 ${cardBg} border ${cardBorder} rounded-xl p-4 shadow-lg`}>
              <h3 className="font-medium flex items-center mb-2">
                <HelpCircle className="w-4 h-4 mr-2 text-[#0288D1]" />
                Cần hỗ trợ?
              </h3>
              <p className={`text-sm ${textSecondary} mb-3`}>
                Nếu bạn có thắc mắc về chính sách bảo mật, hãy liên hệ với chúng tôi.
              </p>
              <Link
                to="/lien-he"
                className="text-sm px-4 py-2 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white rounded-full inline-flex items-center hover:shadow-lg transition-all duration-300"
              >
                <Mail className="w-3 h-3 mr-2" />
                Liên Hệ Ngay
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <div className="w-full lg:w-3/4 space-y-12">
            {/* Introduction Section */}
            <section
              id="gioi-thieu"
              ref={(el) => (sectionsRef.current['gioi-thieu'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Giới Thiệu</h2>
              </div>

              <div className="space-y-4">
                <p>
                  Chào mừng bạn đến với nền tảng bầu cử blockchain của chúng tôi. Tại Blockchain
                  Election Hub, chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn
                  với tiêu chuẩn cao nhất. Chính sách Bảo mật này mô tả cách chúng tôi thu thập, sử
                  dụng, lưu trữ và bảo vệ thông tin của bạn khi bạn sử dụng nền tảng của chúng tôi.
                </p>

                <div className={`${highlightBg} border-l-4 ${highlightBorder} p-4 rounded-r-lg`}>
                  <p className="font-medium flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-[#0288D1]" />
                    Quan trọng:
                  </p>
                  <p className={`mt-1 ${textSecondary}`}>
                    Bằng cách sử dụng nền tảng của chúng tôi, bạn đồng ý với các điều khoản của
                    Chính sách Bảo mật này. Nếu bạn không đồng ý với chính sách này, vui lòng không
                    sử dụng dịch vụ của chúng tôi.
                  </p>
                </div>

                <p>
                  Chính sách này áp dụng cho tất cả người dùng của nền tảng, bao gồm cử tri, ứng cử
                  viên, quản trị viên và khách truy cập. Chúng tôi cam kết duy trì tính minh bạch
                  trong cách chúng tôi xử lý dữ liệu của bạn, đồng thời đảm bảo rằng bạn luôn có
                  quyền kiểm soát thông tin cá nhân của mình.
                </p>

                <div className="flex items-center mt-6">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="italic">Ngày có hiệu lực: 01/03/2025</p>
                </div>
              </div>
            </section>

            {/* Information Collection Section */}
            <section
              id="thong-tin-thu-thap"
              ref={(el) => (sectionsRef.current['thong-tin-thu-thap'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <Database className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Thông Tin Thu Thập</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Thông Tin Cá Nhân</h3>
                  <p className="mb-4">
                    Chúng tôi thu thập các thông tin cá nhân sau đây từ người dùng:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border ${cardBorder} ${
                        theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                          <UserCheck className="w-4 h-4 text-[#0288D1]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Thông Tin Nhận Dạng</h4>
                          <ul className={`mt-2 space-y-1 ${textSecondary} text-sm`}>
                            <li>• Họ và tên</li>
                            <li>• Ngày sinh</li>
                            <li>• Số CMND/CCCD</li>
                            <li>• Ảnh đại diện (nếu cung cấp)</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${cardBorder} ${
                        theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                          <Mail className="w-4 h-4 text-[#0288D1]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Thông Tin Liên Hệ</h4>
                          <ul className={`mt-2 space-y-1 ${textSecondary} text-sm`}>
                            <li>• Địa chỉ email</li>
                            <li>• Số điện thoại</li>
                            <li>• Địa chỉ thường trú</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${cardBorder} ${
                        theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                          <Key className="w-4 h-4 text-[#0288D1]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Thông Tin Tài Khoản</h4>
                          <ul className={`mt-2 space-y-1 ${textSecondary} text-sm`}>
                            <li>• Tên đăng nhập</li>
                            <li>• Mật khẩu (được mã hóa)</li>
                            <li>• Địa chỉ ví blockchain</li>
                            <li>• Khóa công khai</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${cardBorder} ${
                        theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                          <Globe className="w-4 h-4 text-[#0288D1]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Dữ Liệu Kỹ Thuật</h4>
                          <ul className={`mt-2 space-y-1 ${textSecondary} text-sm`}>
                            <li>• Địa chỉ IP</li>
                            <li>• Loại thiết bị và trình duyệt</li>
                            <li>• Thông tin đăng nhập</li>
                            <li>• Dữ liệu cookie</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Dữ Liệu Bầu Cử</h3>
                  <p className="mb-4">
                    Khi tham gia bầu cử trên nền tảng của chúng tôi, chúng tôi thu thập các dữ liệu
                    sau:
                  </p>

                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                        <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                      </div>
                      <span>Thời gian và ngày bỏ phiếu</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                        <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                      </div>
                      <span>
                        Mã hash của phiếu bầu (không chứa thông tin về lựa chọn cụ thể của bạn)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-1">
                        <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                      </div>
                      <span>Xác nhận tham gia bầu cử (không tiết lộ bạn đã bỏ phiếu cho ai)</span>
                    </li>
                  </ul>

                  <div className={`mt-4 ${highlightBg} border ${highlightBorder} p-4 rounded-lg`}>
                    <p className="font-medium flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Bảo mật phiếu bầu:
                    </p>
                    <p className={`mt-1 ${textSecondary}`}>
                      Lựa chọn bỏ phiếu cụ thể của bạn được mã hóa và không thể liên kết trực tiếp
                      với danh tính của bạn. Chúng tôi sử dụng công nghệ blockchain để đảm bảo tính
                      bảo mật và toàn vẹn của phiếu bầu.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Information Usage Section */}
            <section
              id="su-dung-thong-tin"
              ref={(el) => (sectionsRef.current['su-dung-thong-tin'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <Eye className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Sử Dụng Thông Tin</h2>
              </div>

              <div className="space-y-4">
                <p>Chúng tôi sử dụng thông tin thu thập được cho các mục đích sau:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        Xác Thực Danh Tính
                      </h3>
                      <UserCheck className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Xác Thực Danh Tính
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Xác minh tư cách cử tri hợp lệ</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Ngăn chặn gian lận và bỏ phiếu trùng lặp</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Bảo vệ tài khoản người dùng</span>
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Server className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Vận Hành Hệ Thống
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Quản lý tài khoản người dùng</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Xử lý và xác nhận phiếu bầu</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Duy trì tính bảo mật và hiệu suất</span>
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Liên Lạc
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Gửi thông báo về cuộc bầu cử</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Cung cấp hỗ trợ kỹ thuật</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Phản hồi yêu cầu và thắc mắc</span>
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <RefreshCw className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Cải Thiện Dịch Vụ
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Phân tích dữ liệu sử dụng</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Nghiên cứu và phát triển tính năng mới</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Khắc phục lỗi và tối ưu hóa hiệu suất</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={`mt-6 ${highlightBg} border ${highlightBorder} p-4 rounded-lg`}>
                  <p className="font-medium flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-[#0288D1]" />
                    Lưu ý quan trọng:
                  </p>
                  <p className={`mt-1 ${textSecondary}`}>
                    Chúng tôi sẽ không sử dụng thông tin của bạn cho mục đích quảng cáo hoặc tiếp
                    thị mà không có sự đồng ý rõ ràng từ bạn. Chúng tôi cũng không bán hoặc cho thuê
                    thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào.
                  </p>
                </div>
              </div>
            </section>

            {/* Information Sharing Section */}
            <section
              id="chia-se-thong-tin"
              ref={(el) => (sectionsRef.current['chia-se-thong-tin'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <Globe className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Chia Sẻ Thông Tin</h2>
              </div>

              <div className="space-y-4">
                <p>
                  Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và chỉ chia sẻ trong các trường
                  hợp sau:
                </p>

                <div className="space-y-4 mt-4">
                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold mb-2">Nhà Cung Cấp Dịch Vụ</h3>
                    <p className={textSecondary}>
                      Chúng tôi có thể chia sẻ thông tin với các nhà cung cấp dịch vụ bên thứ ba
                      đáng tin cậy để hỗ trợ chúng tôi trong việc cung cấp dịch vụ, như lưu trữ đám
                      mây, phân tích dữ liệu, và hỗ trợ khách hàng. Các đối tác này phải tuân thủ
                      các tiêu chuẩn bảo mật nghiêm ngặt và chỉ được phép sử dụng thông tin cho mục
                      đích cụ thể đã thỏa thuận.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold mb-2">Yêu Cầu Pháp Lý</h3>
                    <p className={textSecondary}>
                      Chúng tôi có thể tiết lộ thông tin cá nhân nếu được yêu cầu bởi pháp luật,
                      lệnh tòa án, hoặc quy trình pháp lý khác. Chúng tôi cũng có thể chia sẻ thông
                      tin khi cần thiết để bảo vệ quyền, tài sản hoặc an toàn của chúng tôi, người
                      dùng của chúng tôi, hoặc công chúng.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold mb-2">Dữ Liệu Blockchain Công Khai</h3>
                    <p className={textSecondary}>
                      Do tính chất của công nghệ blockchain, một số dữ liệu như mã hash của phiếu
                      bầu và địa chỉ ví công khai sẽ được ghi lại trên blockchain và có thể truy cập
                      công khai. Tuy nhiên, thông tin này được mã hóa và không thể liên kết trực
                      tiếp với danh tính cá nhân của bạn.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold mb-2">Với Sự Đồng Ý Của Bạn</h3>
                    <p className={textSecondary}>
                      Chúng tôi có thể chia sẻ thông tin cá nhân của bạn trong các trường hợp khác
                      với sự đồng ý rõ ràng từ bạn. Bạn có thể rút lại sự đồng ý này bất cứ lúc nào.
                    </p>
                  </div>
                </div>

                <div className={`mt-6 ${highlightBg} border ${highlightBorder} p-4 rounded-lg`}>
                  <p className="font-medium flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-[#0288D1]" />
                    Cam kết của chúng tôi:
                  </p>
                  <p className={`mt-1 ${textSecondary}`}>
                    Chúng tôi không bán, cho thuê hoặc trao đổi thông tin cá nhân của bạn với bất kỳ
                    bên thứ ba nào cho mục đích tiếp thị. Mọi đối tác của chúng tôi đều phải tuân
                    thủ các tiêu chuẩn bảo mật nghiêm ngặt và chỉ được phép sử dụng thông tin cho
                    mục đích cụ thể đã thỏa thuận.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Security Section */}
            <section
              id="bao-mat-du-lieu"
              ref={(el) => (sectionsRef.current['bao-mat-du-lieu'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <Shield className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Bảo Mật Dữ Liệu</h2>
              </div>

              <div className="space-y-4">
                <p>
                  Bảo mật dữ liệu là ưu tiên hàng đầu của chúng tôi. Chúng tôi áp dụng các biện pháp
                  bảo mật tiên tiến để bảo vệ thông tin của bạn:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Mã Hóa Dữ Liệu
                    </h3>
                    <p className={`${textSecondary} text-sm mb-3`}>
                      Chúng tôi sử dụng các phương pháp mã hóa tiên tiến để bảo vệ dữ liệu:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Mã hóa SSL/TLS cho dữ liệu đang truyền</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Mã hóa AES-256 cho dữ liệu lưu trữ</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Mã hóa đầu cuối cho phiếu bầu</span>
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Bảo Mật Blockchain
                    </h3>
                    <p className={`${textSecondary} text-sm mb-3`}>
                      Công nghệ blockchain cung cấp các lớp bảo mật bổ sung:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Bất biến - dữ liệu không thể bị thay đổi</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Mật mã khóa công khai/riêng tư</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Phân tán - không có điểm lỗi đơn lẻ</span>
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Server className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Bảo Mật Cơ Sở Hạ Tầng
                    </h3>
                    <p className={`${textSecondary} text-sm mb-3`}>
                      Chúng tôi bảo vệ hệ thống của mình bằng:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Tường lửa và hệ thống phát hiện xâm nhập</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Kiểm tra bảo mật và đánh giá lỗ hổng thường xuyên</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Giám sát bảo mật 24/7</span>
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <UserCheck className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Kiểm Soát Truy Cập
                    </h3>
                    <p className={`${textSecondary} text-sm mb-3`}>
                      Chúng tôi hạn chế quyền truy cập vào dữ liệu bằng:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Xác thực đa yếu tố (MFA)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Kiểm soát truy cập dựa trên vai trò</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Ghi nhật ký và giám sát truy cập</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={`mt-6 ${highlightBg} border ${highlightBorder} p-4 rounded-lg`}>
                  <p className="font-medium flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-[#0288D1]" />
                    Lưu ý về bảo mật:
                  </p>
                  <p className={`mt-1 ${textSecondary}`}>
                    Mặc dù chúng tôi thực hiện các biện pháp bảo mật mạnh mẽ, không có phương pháp
                    truyền tải qua internet hoặc lưu trữ điện tử nào là an toàn 100%. Chúng tôi cam
                    kết sử dụng các biện pháp bảo vệ thương mại hợp lý để bảo vệ dữ liệu của bạn,
                    nhưng không thể đảm bảo an ninh tuyệt đối.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights Section */}
            <section
              id="quyen-cua-ban"
              ref={(el) => (sectionsRef.current['quyen-cua-ban'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <UserCheck className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Quyền Của Bạn</h2>
              </div>

              <div className="space-y-4">
                <p>
                  Chúng tôi tôn trọng quyền của bạn đối với dữ liệu cá nhân. Bạn có các quyền sau:
                </p>

                <div className="space-y-4 mt-4">
                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3">
                        <Eye className="w-4 h-4 text-[#0288D1]" />
                      </div>
                      <h3 className="font-semibold">Quyền Truy Cập</h3>
                    </div>
                    <p className={textSecondary}>
                      Bạn có quyền yêu cầu bản sao dữ liệu cá nhân mà chúng tôi lưu giữ về bạn. Bạn
                      có thể truy cập thông tin cá nhân của mình thông qua tài khoản của bạn hoặc
                      bằng cách liên hệ với chúng tôi.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3">
                        <RefreshCw className="w-4 h-4 text-[#0288D1]" />
                      </div>
                      <h3 className="font-semibold">Quyền Chỉnh Sửa</h3>
                    </div>
                    <p className={textSecondary}>
                      Bạn có quyền yêu cầu chúng tôi chỉnh sửa hoặc cập nhật thông tin cá nhân không
                      chính xác hoặc không đầy đủ. Bạn có thể cập nhật thông tin của mình trong phần
                      cài đặt tài khoản.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3">
                        <AlertTriangle className="w-4 h-4 text-[#0288D1]" />
                      </div>
                      <h3 className="font-semibold">Quyền Xóa</h3>
                    </div>
                    <p className={textSecondary}>
                      Bạn có quyền yêu cầu xóa dữ liệu cá nhân của mình trong một số trường hợp nhất
                      định. Tuy nhiên, lưu ý rằng một số thông tin có thể không thể xóa hoàn toàn do
                      tính chất bất biến của blockchain hoặc nghĩa vụ pháp lý.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3">
                        <Globe className="w-4 h-4 text-[#0288D1]" />
                      </div>
                      <h3 className="font-semibold">Quyền Chuyển Giao Dữ Liệu</h3>
                    </div>
                    <p className={textSecondary}>
                      Bạn có quyền nhận dữ liệu cá nhân của mình ở định dạng có cấu trúc, thông dụng
                      và có thể đọc được bằng máy, và có quyền chuyển dữ liệu đó sang một nhà cung
                      cấp dịch vụ khác.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3">
                        <AlertTriangle className="w-4 h-4 text-[#0288D1]" />
                      </div>
                      <h3 className="font-semibold">Quyền Phản Đối</h3>
                    </div>
                    <p className={textSecondary}>
                      Bạn có quyền phản đối việc xử lý dữ liệu cá nhân của mình trong một số trường
                      hợp nhất định, đặc biệt là khi dữ liệu được sử dụng cho mục đích tiếp thị trực
                      tiếp.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3">Thực Hiện Quyền Của Bạn</h3>
                  <p className="mb-4">
                    Để thực hiện bất kỳ quyền nào trong số này, vui lòng liên hệ với chúng tôi qua:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-[#0288D1]" />
                      <span>Email: privacy@blockchain-election.vn</span>
                    </li>
                    <li className="flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-[#0288D1]" />
                      <span>
                        Mẫu yêu cầu trực tuyến:{' '}
                        <Link to="/lien-he" className={linkColor}>
                          Liên hệ
                        </Link>
                      </span>
                    </li>
                  </ul>
                  <p className={`mt-4 ${textSecondary}`}>
                    Chúng tôi sẽ phản hồi yêu cầu của bạn trong vòng 30 ngày. Trong một số trường
                    hợp, chúng tôi có thể yêu cầu thông tin bổ sung để xác minh danh tính của bạn
                    trước khi xử lý yêu cầu.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies Section */}
            <section
              id="cookie"
              ref={(el) => (sectionsRef.current['cookie'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <Cookie className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Cookie & Công Nghệ</h2>
              </div>

              <div className="space-y-4">
                <p>
                  Chúng tôi sử dụng cookie và các công nghệ tương tự để cải thiện trải nghiệm của
                  bạn trên nền tảng của chúng tôi.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Cookie className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Cookie Thiết Yếu
                    </h3>
                    <p className={`${textSecondary} text-sm mb-3`}>
                      Cần thiết cho hoạt động cơ bản của trang web:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Duy trì phiên đăng nhập</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Ghi nhớ tùy chọn bảo mật</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Cân bằng tải và bảo mật</span>
                      </li>
                    </ul>
                  </div>

                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Cookie className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Cookie Phân Tích
                    </h3>
                    <p className={`${textSecondary} text-sm mb-3`}>
                      Giúp chúng tôi cải thiện nền tảng:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Phân tích lưu lượng truy cập</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Theo dõi hiệu suất trang</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-2 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                        </div>
                        <span>Hiểu cách người dùng tương tác</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3">Quản Lý Cookie</h3>
                  <p className="mb-4">Bạn có thể kiểm soát và quản lý cookie theo nhiều cách:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                      </div>
                      <span>
                        Cài đặt trình duyệt: Hầu hết các trình duyệt cho phép bạn kiểm soát cookie
                        thông qua cài đặt của chúng.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                      </div>
                      <span>
                        Tùy chọn cookie: Chúng tôi cung cấp bảng điều khiển tùy chọn cookie trên nền
                        tảng của mình.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                      </div>
                      <span>
                        Công cụ của bên thứ ba: Có nhiều công cụ và tiện ích mở rộng trình duyệt để
                        quản lý cookie.
                      </span>
                    </li>
                  </ul>

                  <div className={`mt-4 ${highlightBg} border ${highlightBorder} p-4 rounded-lg`}>
                    <p className="font-medium flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Lưu ý:
                    </p>
                    <p className={`mt-1 ${textSecondary}`}>
                      Việc vô hiệu hóa cookie thiết yếu có thể ảnh hưởng đến chức năng của nền tảng.
                      Cookie phân tích không thu thập thông tin cá nhân và chỉ được sử dụng để cải
                      thiện trải nghiệm người dùng.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Policy Updates Section */}
            <section
              id="cap-nhat-chinh-sach"
              ref={(el) => (sectionsRef.current['cap-nhat-chinh-sach'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <RefreshCw className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Cập Nhật Chính Sách</h2>
              </div>

              <div className="space-y-4">
                <p>
                  Chúng tôi có thể cập nhật Chính sách Bảo mật này theo thời gian để phản ánh những
                  thay đổi trong thực tiễn của chúng tôi, cập nhật pháp lý, hoặc cải tiến bảo mật.
                  Chúng tôi sẽ thông báo cho bạn về những thay đổi quan trọng bằng cách:
                </p>

                <ul className="space-y-2 mt-4">
                  <li className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                    </div>
                    <span>Đăng thông báo nổi bật trên nền tảng của chúng tôi</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                    </div>
                    <span>Gửi email thông báo đến địa chỉ email đã đăng ký của bạn</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-[#0288D1]" />
                    </div>
                    <span>Cập nhật "Ngày có hiệu lực" ở đầu Chính sách Bảo mật này</span>
                  </li>
                </ul>

                <p className="mt-4">
                  Chúng tôi khuyến khích bạn xem xét Chính sách Bảo mật này định kỳ để biết thông
                  tin mới nhất về cách chúng tôi bảo vệ thông tin của bạn. Việc tiếp tục sử dụng nền
                  tảng sau khi thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận Chính sách Bảo
                  mật đã sửa đổi.
                </p>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3">Lịch Sử Thay Đổi</h3>
                  <div className={`border ${cardBorder} rounded-lg overflow-hidden`}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={theme === 'dark' ? 'bg-[#37474F]' : 'bg-gray-50'}>
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          >
                            Ngày
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          >
                            Phiên bản
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          >
                            Thay đổi chính
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${cardBorder}`}>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">01/03/2025</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">1.0</td>
                          <td className="px-6 py-4 text-sm">Phiên bản ban đầu</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section
              id="lien-he"
              ref={(el) => (sectionsRef.current['lien-he'] = el)}
              className={`${cardBg} border ${cardBorder} rounded-xl p-6 md:p-8 shadow-lg`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4">
                  <Mail className="w-5 h-5 text-[#0288D1]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Liên Hệ</h2>
              </div>

              <div className="space-y-4">
                <p>
                  Nếu bạn có bất kỳ câu hỏi, thắc mắc hoặc yêu cầu nào liên quan đến Chính sách Bảo
                  mật này hoặc cách chúng tôi xử lý dữ liệu cá nhân của bạn, vui lòng liên hệ với
                  chúng tôi:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Email
                    </h3>
                    <p className="mb-2">
                      <span className="font-medium">Chung:</span>{' '}
                      <a href="mailto:contact@blockchain-election.vn" className={linkColor}>
                        contact@blockchain-election.vn
                      </a>
                    </p>
                    <p className="mb-2">
                      <span className="font-medium">Bảo mật dữ liệu:</span>{' '}
                      <a href="mailto:privacy@blockchain-election.vn" className={linkColor}>
                        privacy@blockchain-election.vn
                      </a>
                    </p>
                    <p>
                      <span className="font-medium">Hỗ trợ kỹ thuật:</span>{' '}
                      <a href="mailto:support@blockchain-election.vn" className={linkColor}>
                        support@blockchain-election.vn
                      </a>
                    </p>
                  </div>

                  <div
                    className={`p-5 rounded-xl border ${cardBorder} ${
                      theme === 'dark' ? 'bg-[#37474F]/30' : 'bg-white'
                    } shadow-sm`}
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-[#0288D1]" />
                      Địa Chỉ
                    </h3>
                    <p className="mb-2">
                      <span className="font-medium">Trụ sở chính:</span> 484 Lạch Tray, Kênh Dương,
                      Lê Chân, Hải Phòng, Việt Nam
                    </p>
                    <p>
                      <span className="font-medium">Điện thoại:</span> +84 123 456 789
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/lien-he"
                    className="px-6 py-3 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white rounded-full font-medium hover:shadow-lg hover:shadow-[#0288D1]/20 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Liên Hệ Ngay
                  </Link>

                  <Link
                    to="/faq"
                    className={`px-6 py-3 border ${cardBorder} rounded-full font-medium hover:bg-[#0288D1]/10 transition-all duration-300 flex items-center justify-center`}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Câu Hỏi Thường Gặp
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-all duration-300 transform ${
          showBackToTop
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10 pointer-events-none'
        } ${
          theme === 'dark' ? 'bg-[#0288D1] hover:bg-[#01579B]' : 'bg-[#0288D1] hover:bg-[#01579B]'
        } text-white`}
        aria-label="Lên đầu trang"
      >
        <ChevronUp className="w-6 h-6" />
      </button>

      {/* Footer */}
      <footer
        className={`mt-16 py-8 border-t ${cardBorder} ${
          theme === 'dark' ? 'bg-[#263238]' : 'bg-gray-50'
        }`}
      >
        <div className="container mx-auto px-4 text-center">
          <p className={textSecondary}>
            © {new Date().getFullYear()} Blockchain Election Hub. Bảo lưu mọi quyền.
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <Link to="/" className={linkColor}>
              Trang Chủ
            </Link>
            <Link to="/dieu-khoan-su-dung" className={linkColor}>
              Điều Khoản Sử Dụng
            </Link>
            <Link to="/lien-he" className={linkColor}>
              Liên Hệ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChinhSachBaoMat;
