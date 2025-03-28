'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  Clock,
  Shield,
  Users,
  Lock,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
  Copy,
  Home,
} from 'lucide-react';
import SEO from '../components/SEO';

const DieuKhoanSuDungPage = () => {
  const theme = 'dark';
  const [isTocVisible, setIsTocVisible] = useState(true);
  const [activeSection, setActiveSection] = useState('');
  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll animation
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.1], [0, 8]);

  // Sections for the table of contents
  const sections = [
    { id: 'gioi-thieu', title: 'Giới Thiệu' },
    { id: 'chap-nhan-dieu-khoan', title: 'Chấp Nhận Điều Khoản' },
    { id: 'muc-dich-su-dung', title: 'Mục Đích Sử Dụng' },
    { id: 'quyen-va-nghia-vu', title: 'Quyền Và Nghĩa Vụ' },
    { id: 'quyen-cua-nen-tang', title: 'Quyền Của Nền Tảng' },
    { id: 'bao-mat-thong-tin', title: 'Bảo Mật Thông Tin' },
    { id: 'bao-mat-blockchain', title: 'Bảo Mật Blockchain' },
    { id: 'quyen-so-huu-tri-tue', title: 'Quyền Sở Hữu Trí Tuệ' },
    { id: 'giai-quyet-tranh-chap', title: 'Giải Quyết Tranh Chấp' },
    { id: 'mien-tru-trach-nhiem', title: 'Miễn Trừ Trách Nhiệm' },
    { id: 'thay-doi-dieu-khoan', title: 'Thay Đổi Điều Khoản' },
    { id: 'lien-he', title: 'Liên Hệ' },
  ];

  // SEO data
  const seoData = {
    title: 'Điều Khoản Sử Dụng | Blockchain Holihu',
    description:
      'Điều khoản sử dụng của nền tảng bầu cử blockchain. Hiểu rõ quyền và trách nhiệm của bạn khi tham gia vào hệ thống bầu cử minh bạch và an toàn.',
    keywords:
      'điều khoản sử dụng, bầu cử blockchain, quyền và trách nhiệm, bảo mật blockchain, minh bạch, bầu cử điện tử',
    author: 'Blockchain Election Hub',
    image:
      'https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=1200&auto=format&fit=crop',
    url: 'https://blockchain-election-hub.com/dieu-khoan-su-dung',
  };

  // Handle scroll and intersection observer
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);

      // Find the current active section
      const sectionElements = sections.map((section) => ({
        id: section.id,
        element: document.getElementById(section.id),
      }));

      const currentSection = sectionElements.find((section) => {
        if (!section.element) return false;
        const rect = section.element.getBoundingClientRect();
        return rect.top <= 150 && rect.bottom >= 150;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sections]);

  // Handle hash change for direct links
  useEffect(() => {
    const handleHashChange = () => {
      const id = window.location.hash.replace('#', '');
      if (id) {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Copy URL to clipboard
  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      // Update URL without reloading the page
      window.history.pushState(null, '', `#${id}`);
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Light/dark mode styles
  const bgColor = theme === 'dark' ? 'bg-[#0A1416]' : 'bg-gray-50';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const cardBg = theme === 'dark' ? 'bg-[#263238]' : 'bg-white';
  const cardBorder = theme === 'dark' ? 'border-[#455A64]' : 'border-gray-200';
  const sectionBg = theme === 'dark' ? 'bg-[#1E272C]' : 'bg-gray-50';
  const highlightColor = theme === 'dark' ? 'text-[#0288D1]' : 'text-blue-600';
  const secondaryTextColor = theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} relative overflow-hidden`}>
      <SEO {...seoData} />

      {/* Header */}
      <motion.header
        style={{
          opacity: headerOpacity,
          backdropFilter: `blur(${headerBlur}px)`,
        }}
        className="sticky top-0 z-50 bg-opacity-80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            to="/"
            className={`flex items-center space-x-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            } hover:opacity-80 transition-opacity`}
          >
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full blur-sm opacity-70"></div>
              <div
                className={`relative flex items-center justify-center w-full h-full rounded-full ${
                  theme === 'dark' ? 'bg-[#0A1416]' : 'bg-white'
                } border border-[#0288D1]/30`}
              >
                <FileText className="h-5 w-5 text-[#0288D1]" />
              </div>
            </div>
            <div>
              <span className="font-bold">Blockchain Election</span>
              <span className="hidden md:inline"> | Điều Khoản Sử Dụng</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={copyUrlToClipboard}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${
                theme === 'dark'
                  ? 'bg-[#37474F] hover:bg-[#455A64] text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } transition-colors`}
              aria-label="Copy URL"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-sm hidden md:inline">Sao chép URL</span>
                </>
              )}
            </button>

            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${
                theme === 'dark'
                  ? 'bg-[#0288D1] hover:bg-[#01579B] text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } transition-colors`}
            >
              <Home className="h-4 w-4" />
              <span className="text-sm hidden md:inline">Trang Chủ</span>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <div
        className={`relative py-16 ${theme === 'dark' ? 'bg-[#1A2327]' : 'bg-blue-50'} border-b ${
          theme === 'dark' ? 'border-[#37474F]' : 'border-blue-100'
        } overflow-hidden`}
      >
        {/* Background Hexagons */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Điều Khoản Sử Dụng
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`text-xl ${secondaryTextColor} max-w-3xl mx-auto`}
            >
              Hiểu rõ quyền và trách nhiệm của bạn khi tham gia vào hệ thống bầu cử blockchain minh
              bạch và an toàn của chúng tôi
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-wrap justify-center gap-4"
            >
              <div
                className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  theme === 'dark' ? 'bg-[#37474F] text-[#B0BEC5]' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Cập nhật: 15/03/2025</span>
              </div>
              <div
                className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  theme === 'dark' ? 'bg-[#37474F] text-[#B0BEC5]' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Info className="h-4 w-4" />
                <span>Phiên bản: 2.1.0</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
        {/* Table of Contents - Sidebar */}
        <aside className="w-full lg:w-1/4 lg:sticky lg:top-24 lg:self-start mb-8 lg:mb-0">
          <div
            className={`${cardBg} border ${cardBorder} rounded-xl shadow-lg overflow-hidden transition-all duration-300`}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-[#0288D1]" />
                Mục lục
              </h2>
              <button
                onClick={() => setIsTocVisible(!isTocVisible)}
                className={`p-2 rounded-full ${
                  theme === 'dark' ? 'hover:bg-[#37474F]' : 'hover:bg-gray-100'
                } transition-colors`}
                aria-label="Toggle Table of Contents"
              >
                {isTocVisible ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>

            {isTocVisible && (
              <nav className="p-4">
                <ul className="space-y-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-colors ${
                          activeSection === section.id
                            ? theme === 'dark'
                              ? 'bg-[#0288D1]/20 text-[#0288D1]'
                              : 'bg-blue-50 text-blue-600'
                            : theme === 'dark'
                              ? 'hover:bg-[#37474F] text-[#B0BEC5]'
                              : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            activeSection === section.id
                              ? 'bg-[#0288D1]'
                              : theme === 'dark'
                                ? 'bg-[#455A64]'
                                : 'bg-gray-300'
                          }`}
                        ></div>
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div
              className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <Link
                to="/chinh-sach-bao-mat"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-[#37474F] text-[#B0BEC5]'
                    : 'hover:bg-gray-100 text-gray-700'
                } transition-colors`}
              >
                <Shield className="h-4 w-4 text-[#0288D1]" />
                <span>Xem Chính Sách Bảo Mật</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="w-full lg:w-3/4" ref={contentRef}>
          <div
            className={`${cardBg} border ${cardBorder} rounded-xl shadow-lg overflow-hidden mb-8`}
          >
            <div className="p-6 md:p-8">
              <section id="gioi-thieu" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Giới Thiệu</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Chào mừng bạn đến với nền tảng bầu cử blockchain - một hệ thống bầu cử hiện đại
                    dựa trên công nghệ blockchain, được thiết kế để đảm bảo tính minh bạch, bảo mật
                    và toàn vẹn dữ liệu trong các cuộc bầu cử.
                  </p>

                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Điều khoản sử dụng này ("Điều Khoản") quy định các điều kiện và điều khoản chi
                    phối việc sử dụng nền tảng bầu cử blockchain của chúng tôi, bao gồm tất cả các
                    tính năng, chức năng, API và dịch vụ liên quan (gọi chung là "Nền Tảng"). Bằng
                    việc truy cập hoặc sử dụng Nền Tảng, bạn đồng ý bị ràng buộc bởi các Điều Khoản
                    này.
                  </p>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                    } flex items-start space-x-3 mb-4`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        theme === 'dark' ? 'text-amber-400' : 'text-amber-500'
                      }`}
                    />
                    <p
                      className={`text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}`}
                    >
                      Vui lòng đọc kỹ các Điều Khoản này trước khi sử dụng Nền Tảng. Nếu bạn không
                      đồng ý với bất kỳ phần nào của Điều Khoản, vui lòng không sử dụng Nền Tảng.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Shield className="h-8 w-8 text-[#0288D1] mb-2" />
                      <h3 className="font-semibold mb-2">Bảo Mật Tuyệt Đối</h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Dữ liệu được mã hóa và lưu trữ an toàn trên blockchain
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Users className="h-8 w-8 text-[#6A1B9A] mb-2" />
                      <h3 className="font-semibold mb-2">Minh Bạch Hoàn Toàn</h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Mọi giao dịch đều được ghi lại và có thể kiểm chứng
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Lock className="h-8 w-8 text-[#00796B] mb-2" />
                      <h3 className="font-semibold mb-2">Không Thể Thay Đổi</h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Dữ liệu một khi đã được ghi vào blockchain không thể bị sửa đổi
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section id="chap-nhan-dieu-khoan" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-green-500 to-teal-600">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Chấp Nhận Điều Khoản</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Bằng việc truy cập hoặc sử dụng Nền Tảng, bạn xác nhận rằng bạn đã đọc, hiểu và
                    đồng ý bị ràng buộc bởi các Điều Khoản này. Nếu bạn không đồng ý với bất kỳ phần
                    nào của Điều Khoản, vui lòng không sử dụng Nền Tảng.
                  </p>

                  <h3 className="text-xl font-semibold mb-3">Điều Kiện Sử Dụng</h3>
                  <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Độ tuổi:</span> Bạn phải từ 18 tuổi trở lên hoặc
                      đã đạt độ tuổi trưởng thành theo quy định của pháp luật tại quốc gia của bạn,
                      tùy thuộc vào độ tuổi nào cao hơn.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Năng lực pháp lý:</span> Bạn phải có đầy đủ năng
                      lực pháp lý để tham gia vào một thỏa thuận ràng buộc pháp lý.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Tuân thủ pháp luật:</span> Bạn đồng ý sử dụng
                      Nền Tảng tuân theo tất cả các luật và quy định hiện hành.
                    </li>
                  </ul>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#37474F]' : 'bg-gray-50'
                    } border-l-4 border-[#0288D1] mb-4`}
                  >
                    <h4 className="font-semibold mb-2">Lưu ý quan trọng</h4>
                    <p
                      className={`text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}`}
                    >
                      Chúng tôi có quyền thay đổi, sửa đổi, bổ sung hoặc xóa bỏ các phần của Điều
                      Khoản này vào bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng
                      tải trên Nền Tảng. Việc bạn tiếp tục sử dụng Nền Tảng sau khi các thay đổi
                      được đăng tải đồng nghĩa với việc bạn chấp nhận những thay đổi đó.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                    <div className="flex items-center">
                      <Shield className="h-10 w-10 text-white mr-4" />
                      <div>
                        <h3 className="text-white font-bold">Cam Kết Bảo Mật</h3>
                        <p className="text-white text-opacity-90 text-sm">
                          Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/chinh-sach-bao-mat"
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    >
                      Tìm hiểu thêm
                    </Link>
                  </div>
                </div>
              </section>

              <section id="muc-dich-su-dung" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Mục Đích Sử Dụng</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Nền Tảng của chúng tôi được thiết kế để cung cấp một hệ thống bầu cử minh bạch,
                    an toàn và đáng tin cậy dựa trên công nghệ blockchain. Mục đích sử dụng của Nền
                    Tảng bao gồm:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                          1
                        </span>
                        Tổ Chức Bầu Cử
                      </h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Cho phép các tổ chức, cơ quan, doanh nghiệp tạo và quản lý các cuộc bầu cử
                        an toàn, minh bạch với kết quả không thể thay đổi.
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-2">
                          2
                        </span>
                        Tham Gia Bỏ Phiếu
                      </h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Cho phép cử tri tham gia bỏ phiếu một cách an toàn, bảo mật và có thể xác
                        minh phiếu bầu của mình.
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">
                          3
                        </span>
                        Kiểm Tra Kết Quả
                      </h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Cho phép xem và xác minh kết quả bầu cử một cách công khai, minh bạch thông
                        qua blockchain.
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-2">
                          4
                        </span>
                        Nghiên Cứu & Phát Triển
                      </h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Hỗ trợ nghiên cứu và phát triển các ứng dụng blockchain trong lĩnh vực bầu
                        cử và quản trị.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-3">Đối Tượng Sử Dụng</h3>
                  <ul className="list-disc pl-5 space-y-2 mb-4">
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Người bỏ phiếu:</span> Cá nhân tham gia vào các
                      cuộc bầu cử được tổ chức trên Nền Tảng.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Người tổ chức bầu cử:</span> Cá nhân hoặc tổ
                      chức tạo và quản lý các cuộc bầu cử.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Người giám sát:</span> Cá nhân hoặc tổ chức được
                      ủy quyền để giám sát quá trình bầu cử.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Nhà phát triển:</span> Cá nhân hoặc tổ chức sử
                      dụng API của Nền Tảng để phát triển các ứng dụng liên quan.
                    </li>
                  </ul>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#37474F]' : 'bg-amber-50'
                    } border-l-4 border-amber-500 mb-4`}
                  >
                    <h4 className="font-semibold mb-2 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                      Hạn chế sử dụng
                    </h4>
                    <p
                      className={`text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}`}
                    >
                      Nền Tảng không được sử dụng cho các mục đích bất hợp pháp, gian lận, hoặc bất
                      kỳ hoạt động nào vi phạm pháp luật hiện hành. Chúng tôi có quyền từ chối dịch
                      vụ đối với bất kỳ người dùng nào vi phạm các điều khoản này.
                    </p>
                  </div>
                </div>
              </section>

              <section id="quyen-va-nghia-vu" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Quyền Và Nghĩa Vụ</h2>
                </div>

                <div className="ml-16">
                  <h3 className="text-xl font-semibold mb-3">Quyền Của Người Dùng</h3>
                  <ul className="list-disc pl-5 space-y-2 mb-6">
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Quyền truy cập:</span> Bạn có quyền truy cập và
                      sử dụng Nền Tảng theo các Điều Khoản này.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Quyền riêng tư:</span> Bạn có quyền yêu cầu
                      thông tin về dữ liệu cá nhân của mình được thu thập và lưu trữ.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Quyền xóa dữ liệu:</span> Bạn có quyền yêu cầu
                      xóa dữ liệu cá nhân của mình (ngoại trừ dữ liệu đã được ghi vào blockchain).
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Quyền xác minh:</span> Bạn có quyền xác minh
                      phiếu bầu của mình đã được ghi nhận chính xác trên blockchain.
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3">Nghĩa Vụ Của Người Dùng</h3>
                  <ul className="list-disc pl-5 space-y-2 mb-6">
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Cung cấp thông tin chính xác:</span> Bạn phải
                      cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký và sử dụng Nền
                      Tảng.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Bảo mật tài khoản:</span> Bạn chịu trách nhiệm
                      duy trì tính bảo mật của tài khoản và mật khẩu của mình.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Không lạm dụng:</span> Bạn không được sử dụng
                      Nền Tảng cho bất kỳ mục đích bất hợp pháp hoặc trái phép nào.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Không can thiệp:</span> Bạn không được cố gắng
                      can thiệp vào hoạt động bình thường của Nền Tảng hoặc cố gắng truy cập trái
                      phép vào hệ thống.
                    </li>
                  </ul>

                  <div
                    className={`p-5 rounded-lg ${
                      theme === 'dark' ? 'bg-[#1E272C]' : 'bg-white'
                    } border ${theme === 'dark' ? 'border-[#455A64]' : 'border-gray-200'} mb-6`}
                  >
                    <h3 className="text-xl font-semibold mb-4">
                      Trách Nhiệm Của Người Tổ Chức Bầu Cử
                    </h3>
                    <div className="space-y-4">
                      <div className="flex">
                        <div
                          className={`w-10 h-10 rounded-full ${
                            theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                          } flex items-center justify-center mr-3 flex-shrink-0`}
                        >
                          <CheckCircle className="h-5 w-5 text-[#0288D1]" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Thiết lập cuộc bầu cử công bằng</h4>
                          <p className={`text-sm ${secondaryTextColor}`}>
                            Đảm bảo thiết lập các cuộc bầu cử một cách công bằng, minh bạch và tuân
                            thủ các quy định pháp luật hiện hành.
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        <div
                          className={`w-10 h-10 rounded-full ${
                            theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                          } flex items-center justify-center mr-3 flex-shrink-0`}
                        >
                          <CheckCircle className="h-5 w-5 text-[#0288D1]" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Xác minh danh tính người bỏ phiếu</h4>
                          <p className={`text-sm ${secondaryTextColor}`}>
                            Thực hiện các biện pháp hợp lý để xác minh danh tính của người bỏ phiếu
                            và đảm bảo tính hợp lệ của cuộc bầu cử.
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        <div
                          className={`w-10 h-10 rounded-full ${
                            theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                          } flex items-center justify-center mr-3 flex-shrink-0`}
                        >
                          <CheckCircle className="h-5 w-5 text-[#0288D1]" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Công bố kết quả chính xác</h4>
                          <p className={`text-sm ${secondaryTextColor}`}>
                            Công bố kết quả bầu cử một cách chính xác và kịp thời, đồng thời cung
                            cấp phương tiện để xác minh kết quả.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="quyen-cua-nen-tang" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Quyền Của Nền Tảng</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Chúng tôi bảo lưu các quyền sau đây liên quan đến việc vận hành và quản lý Nền
                    Tảng:
                  </p>

                  <div className="space-y-4 mb-6">
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Quyền Đình Chỉ Hoặc Chấm Dứt Truy Cập</h3>
                      <p className={`${secondaryTextColor}`}>
                        Chúng tôi có quyền đình chỉ hoặc chấm dứt quyền truy cập của bạn vào Nền
                        Tảng nếu bạn vi phạm các Điều Khoản này hoặc có hành vi lạm dụng Nền Tảng.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Quyền Sửa Đổi Điều Khoản</h3>
                      <p className={`${secondaryTextColor}`}>
                        Chúng tôi có quyền sửa đổi, cập nhật hoặc thay đổi các Điều Khoản này vào
                        bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên
                        Nền Tảng.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Quyền Sửa Đổi Nền Tảng</h3>
                      <p className={`${secondaryTextColor}`}>
                        Chúng tôi có quyền sửa đổi, tạm ngừng hoặc ngừng cung cấp Nền Tảng hoặc bất
                        kỳ tính năng nào của Nền Tảng vào bất kỳ lúc nào mà không cần thông báo
                        trước.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Quyền Giám Sát</h3>
                      <p className={`${secondaryTextColor}`}>
                        Chúng tôi có quyền giám sát việc sử dụng Nền Tảng để đảm bảo tuân thủ các
                        Điều Khoản này và bảo vệ tính toàn vẹn của Nền Tảng.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                    } border-l-4 border-[#0288D1] mb-4`}
                  >
                    <h4 className="font-semibold mb-2">Lưu ý quan trọng</h4>
                    <p
                      className={`text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}`}
                    >
                      Mặc dù chúng tôi có các quyền nêu trên, chúng tôi không thể và sẽ không can
                      thiệp vào dữ liệu đã được ghi vào blockchain. Tính bất biến của blockchain đảm
                      bảo rằng một khi dữ liệu đã được xác nhận và ghi lại, nó không thể bị thay
                      đổi, ngay cả bởi chúng tôi.
                    </p>
                  </div>
                </div>
              </section>

              <section id="bao-mat-thong-tin" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Bảo Mật Thông Tin</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và duy trì tính bảo mật của
                    dữ liệu. Việc thu thập và sử dụng thông tin cá nhân của bạn được quy định trong
                    Chính Sách Bảo Mật của chúng tôi.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Mã Hóa Dữ Liệu</h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Tất cả dữ liệu cá nhân và phiếu bầu được mã hóa bằng các thuật toán mã hóa
                        tiên tiến trước khi được lưu trữ.
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Xác Thực Đa Yếu Tố</h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Chúng tôi sử dụng xác thực đa yếu tố để đảm bảo chỉ những người dùng được ủy
                        quyền mới có thể truy cập vào tài khoản.
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Kiểm Toán Bảo Mật</h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Hệ thống của chúng tôi được kiểm toán bảo mật thường xuyên bởi các chuyên
                        gia bảo mật độc lập.
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Bảo Vệ Danh Tính</h3>
                      <p className={`text-sm ${secondaryTextColor}`}>
                        Danh tính của người bỏ phiếu được bảo vệ, đảm bảo tính bí mật của lá phiếu.
                      </p>
                    </div>
                  </div>

                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Để biết thêm chi tiết về cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá
                    nhân của bạn, vui lòng tham khảo{' '}
                    <Link to="/chinh-sach-bao-mat" className={`${highlightColor} hover:underline`}>
                      Chính Sách Bảo Mật
                    </Link>{' '}
                    của chúng tôi.
                  </p>
                </div>
              </section>

              <section id="bao-mat-blockchain" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Bảo Mật Blockchain</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Nền Tảng của chúng tôi sử dụng công nghệ blockchain để đảm bảo tính minh bạch,
                    bảo mật và toàn vẹn dữ liệu trong quá trình bầu cử.
                  </p>

                  <div className="relative overflow-hidden rounded-xl mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-10"></div>
                    <div
                      className={`relative p-6 ${
                        theme === 'dark' ? 'bg-[#1E272C]/80' : 'bg-white/80'
                      } backdrop-blur-sm border ${
                        theme === 'dark' ? 'border-[#455A64]' : 'border-gray-200'
                      }`}
                    >
                      <h3 className="text-xl font-semibold mb-4">
                        Đặc Điểm Bảo Mật Của Blockchain
                      </h3>

                      <div className="space-y-4">
                        <div className="flex">
                          <div
                            className={`w-10 h-10 rounded-full ${
                              theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                            } flex items-center justify-center mr-3 flex-shrink-0`}
                          >
                            <span className="font-bold text-[#0288D1]">1</span>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Tính Bất Biến</h4>
                            <p className={`text-sm ${secondaryTextColor}`}>
                              Một khi dữ liệu đã được ghi vào blockchain, nó không thể bị thay đổi
                              hoặc xóa bỏ, đảm bảo tính toàn vẹn của kết quả bầu cử.
                            </p>
                          </div>
                        </div>

                        <div className="flex">
                          <div
                            className={`w-10 h-10 rounded-full ${
                              theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                            } flex items-center justify-center mr-3 flex-shrink-0`}
                          >
                            <span className="font-bold text-[#0288D1]">2</span>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Phân Tán</h4>
                            <p className={`text-sm ${secondaryTextColor}`}>
                              Dữ liệu được lưu trữ trên nhiều nút trong mạng blockchain, loại bỏ
                              điểm yếu của hệ thống tập trung và tăng cường khả năng chống lại các
                              cuộc tấn công.
                            </p>
                          </div>
                        </div>

                        <div className="flex">
                          <div
                            className={`w-10 h-10 rounded-full ${
                              theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                            } flex items-center justify-center mr-3 flex-shrink-0`}
                          >
                            <span className="font-bold text-[#0288D1]">3</span>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Mã Hóa</h4>
                            <p className={`text-sm ${secondaryTextColor}`}>
                              Mọi giao dịch đều được mã hóa bằng các thuật toán mã hóa tiên tiến,
                              đảm bảo tính bảo mật và riêng tư.
                            </p>
                          </div>
                        </div>

                        <div className="flex">
                          <div
                            className={`w-10 h-10 rounded-full ${
                              theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                            } flex items-center justify-center mr-3 flex-shrink-0`}
                          >
                            <span className="font-bold text-[#0288D1]">4</span>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Minh Bạch</h4>
                            <p className={`text-sm ${secondaryTextColor}`}>
                              Mọi giao dịch đều có thể được xác minh bởi bất kỳ ai có quyền truy cập
                              vào blockchain, đảm bảo tính minh bạch của quá trình bầu cử.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#37474F]' : 'bg-amber-50'
                    } border-l-4 border-amber-500 mb-4`}
                  >
                    <h4 className="font-semibold mb-2 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                      Lưu ý quan trọng
                    </h4>
                    <p
                      className={`text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}`}
                    >
                      Mặc dù blockchain cung cấp mức độ bảo mật cao, nhưng không có hệ thống nào là
                      hoàn toàn không thể bị tấn công. Chúng tôi liên tục cập nhật và cải tiến các
                      biện pháp bảo mật để đảm bảo Nền Tảng của chúng tôi luôn an toàn và đáng tin
                      cậy.
                    </p>
                  </div>
                </div>
              </section>

              <section id="quyen-so-huu-tri-tue" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Quyền Sở Hữu Trí Tuệ</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Tất cả quyền sở hữu trí tuệ liên quan đến Nền Tảng, bao gồm nhưng không giới hạn
                    ở mã nguồn, thiết kế, logo, thương hiệu, và nội dung, đều thuộc về chúng tôi
                    hoặc các bên cấp phép cho chúng tôi.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Giấy Phép Sử Dụng</h3>
                      <p className={`${secondaryTextColor}`}>
                        Chúng tôi cấp cho bạn giấy phép có giới hạn, không độc quyền, không thể
                        chuyển nhượng để sử dụng Nền Tảng theo các Điều Khoản này. Giấy phép này
                        không cấp cho bạn bất kỳ quyền nào khác đối với Nền Tảng hoặc nội dung của
                        chúng tôi.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Hạn Chế</h3>
                      <p className={`${secondaryTextColor}`}>
                        Bạn không được sao chép, sửa đổi, phân phối, bán, cho thuê, cấp phép lại,
                        thực hiện công khai, truyền tải, phát sóng, hoặc khai thác Nền Tảng hoặc nội
                        dung của chúng tôi mà không có sự cho phép rõ ràng bằng văn bản từ chúng
                        tôi.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Phản Hồi</h3>
                      <p className={`${secondaryTextColor}`}>
                        Nếu bạn cung cấp bất kỳ ý kiến, đề xuất, hoặc phản hồi nào về Nền Tảng,
                        chúng tôi có thể sử dụng những phản hồi đó mà không có nghĩa vụ bồi thường
                        cho bạn.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                    } border-l-4 border-[#0288D1] mb-4`}
                  >
                    <h4 className="font-semibold mb-2">Lưu ý về phần mềm mã nguồn mở</h4>
                    <p
                      className={`text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}`}
                    >
                      Nền Tảng của chúng tôi có thể sử dụng một số phần mềm mã nguồn mở. Các thành
                      phần mã nguồn mở này được cấp phép theo các điều khoản riêng của chúng, và
                      việc sử dụng các thành phần đó tuân theo các điều khoản cấp phép tương ứng.
                    </p>
                  </div>
                </div>
              </section>

              <section id="giai-quyet-tranh-chap" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-teal-500 to-green-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Giải Quyết Tranh Chấp</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Trong trường hợp phát sinh tranh chấp liên quan đến việc sử dụng Nền Tảng hoặc
                    các Điều Khoản này, chúng tôi khuyến khích bạn liên hệ với chúng tôi trước tiên
                    để tìm kiếm giải pháp thân thiện.
                  </p>

                  <h3 className="text-xl font-semibold mb-3">Quy Trình Giải Quyết Tranh Chấp</h3>
                  <ol className="list-decimal pl-5 space-y-2 mb-6">
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Thông báo:</span> Bên khiếu nại phải gửi thông
                      báo bằng văn bản cho bên còn lại, mô tả chi tiết về tranh chấp.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Thương lượng thiện chí:</span> Các bên sẽ cố
                      gắng giải quyết tranh chấp thông qua thương lượng thiện chí trong vòng 30 ngày
                      kể từ ngày nhận được thông báo.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Hòa giải:</span> Nếu thương lượng không thành
                      công, các bên có thể đồng ý sử dụng dịch vụ hòa giải của bên thứ ba.
                    </li>
                    <li className={secondaryTextColor}>
                      <span className="font-medium">Trọng tài hoặc tòa án:</span> Nếu hòa giải không
                      thành công, tranh chấp sẽ được giải quyết thông qua trọng tài hoặc tòa án có
                      thẩm quyền.
                    </li>
                  </ol>

                  <div
                    className={`p-5 rounded-lg ${
                      theme === 'dark' ? 'bg-[#1E272C]' : 'bg-white'
                    } border ${theme === 'dark' ? 'border-[#455A64]' : 'border-gray-200'} mb-6`}
                  >
                    <h3 className="text-xl font-semibold mb-4">Luật Áp Dụng</h3>
                    <p className={`${secondaryTextColor} mb-4`}>
                      Các Điều Khoản này sẽ được điều chỉnh và giải thích theo luật pháp Việt Nam,
                      không áp dụng các nguyên tắc xung đột pháp luật.
                    </p>
                    <p className={`${secondaryTextColor}`}>
                      Bất kỳ tranh chấp nào phát sinh từ hoặc liên quan đến các Điều Khoản này hoặc
                      việc sử dụng Nền Tảng sẽ thuộc thẩm quyền độc quyền của tòa án có thẩm quyền
                      tại Việt Nam.
                    </p>
                  </div>
                </div>
              </section>

              <section id="mien-tru-trach-nhiem" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-red-500 to-orange-600">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Miễn Trừ Trách Nhiệm</h2>
                </div>

                <div className="ml-16">
                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#37474F]' : 'bg-amber-50'
                    } border-l-4 border-amber-500 mb-6`}
                  >
                    <h4 className="font-semibold mb-2 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                      Lưu ý quan trọng
                    </h4>
                    <p
                      className={`text-sm ${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}`}
                    >
                      NỀN TẢNG ĐƯỢC CUNG CẤP "NGUYÊN TRẠNG" VÀ "NHƯ CÓ SẴN" MÀ KHÔNG CÓ BẤT KỲ BẢO
                      ĐẢM NÀO, DÙ RÕ RÀNG HAY NGỤ Ý.
                    </p>
                  </div>

                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Trong phạm vi tối đa được pháp luật cho phép, chúng tôi từ chối tất cả các bảo
                    đảm, bao gồm nhưng không giới hạn ở:
                  </p>

                  <ul className="list-disc pl-5 space-y-2 mb-6">
                    <li className={secondaryTextColor}>
                      Bảo đảm về tính thương mại, phù hợp cho một mục đích cụ thể, không vi phạm
                      quyền của bên thứ ba.
                    </li>
                    <li className={secondaryTextColor}>
                      Bảo đảm rằng Nền Tảng sẽ không bị gián đoạn, không có lỗi, hoặc không có các
                      thành phần có hại.
                    </li>
                    <li className={secondaryTextColor}>
                      Bảo đảm về tính chính xác, độ tin cậy, tính cập nhật, hoặc đầy đủ của Nền
                      Tảng.
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3">Giới Hạn Trách Nhiệm</h3>
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Trong phạm vi tối đa được pháp luật cho phép, chúng tôi sẽ không chịu trách
                    nhiệm đối với bất kỳ thiệt hại nào, bao gồm nhưng không giới hạn ở thiệt hại
                    trực tiếp, gián tiếp, ngẫu nhiên, đặc biệt, hoặc do hậu quả, phát sinh từ hoặc
                    liên quan đến việc sử dụng hoặc không thể sử dụng Nền Tảng.
                  </p>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#1E272C]' : 'bg-gray-50'
                    } border ${theme === 'dark' ? 'border-[#455A64]' : 'border-gray-200'} mb-4`}
                  >
                    <h4 className="font-semibold mb-2">Rủi Ro Công Nghệ Blockchain</h4>
                    <p className={`text-sm ${secondaryTextColor}`}>
                      Bạn hiểu và chấp nhận rằng công nghệ blockchain có những rủi ro vốn có, bao
                      gồm nhưng không giới hạn ở sự biến động của mạng, lỗi phần mềm, và các cuộc
                      tấn công mạng. Chúng tôi không chịu trách nhiệm về bất kỳ thiệt hại nào phát
                      sinh từ những rủi ro này.
                    </p>
                  </div>
                </div>
              </section>

              <section id="thay-doi-dieu-khoan" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Thay Đổi Điều Khoản</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Chúng tôi có thể cập nhật hoặc sửa đổi các Điều Khoản này vào bất kỳ lúc nào.
                    Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên Nền Tảng.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Thông Báo Thay Đổi</h3>
                      <p className={`${secondaryTextColor}`}>
                        Chúng tôi sẽ cố gắng thông báo cho bạn về những thay đổi quan trọng đối với
                        các Điều Khoản này thông qua email hoặc thông báo trên Nền Tảng. Tuy nhiên,
                        bạn có trách nhiệm kiểm tra các Điều Khoản này định kỳ để biết về những thay
                        đổi.
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <h3 className="font-semibold mb-2">Chấp Nhận Thay Đổi</h3>
                      <p className={`${secondaryTextColor}`}>
                        Việc bạn tiếp tục sử dụng Nền Tảng sau khi các thay đổi được đăng tải đồng
                        nghĩa với việc bạn chấp nhận những thay đổi đó. Nếu bạn không đồng ý với các
                        Điều Khoản đã sửa đổi, bạn phải ngừng sử dụng Nền Tảng.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                    } border-l-4 border-[#0288D1] mb-4`}
                  >
                    <h4 className="font-semibold mb-2">Lịch sử thay đổi</h4>
                    <ul className="space-y-2 text-sm">
                      <li className={theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}>
                        <span className="font-medium">Phiên bản 2.1.0 (15/03/2025):</span> Cập nhật
                        các điều khoản về bảo mật blockchain và quyền sở hữu trí tuệ.
                      </li>
                      <li className={theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}>
                        <span className="font-medium">Phiên bản 2.0.0 (10/01/2025):</span> Cập nhật
                        toàn diện các điều khoản để phản ánh các tính năng mới của Nền Tảng.
                      </li>
                      <li className={theme === 'dark' ? 'text-[#B0BEC5]' : 'text-gray-700'}>
                        <span className="font-medium">Phiên bản 1.0.0 (01/06/2024):</span> Phiên bản
                        ban đầu.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="lien-he" className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Liên Hệ</h2>
                </div>

                <div className="ml-16">
                  <p className={`${secondaryTextColor} mb-4 leading-relaxed`}>
                    Nếu bạn có bất kỳ câu hỏi, thắc mắc hoặc phản hồi nào về các Điều Khoản này hoặc
                    Nền Tảng, vui lòng liên hệ với chúng tôi qua:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      } flex items-start space-x-3`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                        }`}
                      >
                        <svg
                          className="h-5 w-5 text-[#0288D1]"
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
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <a
                          href="mailto:contact@blockchain-election.vn"
                          className={`${highlightColor} hover:underline`}
                        >
                          contact@blockchain-election.vn
                        </a>
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      } flex items-start space-x-3`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                        }`}
                      >
                        <svg
                          className="h-5 w-5 text-[#0288D1]"
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
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Điện Thoại</h3>
                        <a href="tel:+84123456789" className={`${highlightColor} hover:underline`}>
                          +84 123 456 789
                        </a>
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      } flex items-start space-x-3`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                        }`}
                      >
                        <svg
                          className="h-5 w-5 text-[#0288D1]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Địa Chỉ</h3>
                        <p className={secondaryTextColor}>
                          484 Lạch Tray, Kênh Dương, Lê Chân, Hải Phòng, Việt Nam
                        </p>
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        theme === 'dark'
                          ? 'border-[#455A64] bg-[#1E272C]'
                          : 'border-gray-200 bg-white'
                      } flex items-start space-x-3`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          theme === 'dark' ? 'bg-[#37474F]' : 'bg-blue-50'
                        }`}
                      >
                        <svg
                          className="h-5 w-5 text-[#0288D1]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Hỗ Trợ</h3>
                        <Link to="/lien-he" className={`${highlightColor} hover:underline`}>
                          Gửi yêu cầu hỗ trợ
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                    <div className="mb-4 md:mb-0 text-center md:text-left">
                      <h3 className="text-white font-bold text-xl mb-2">Còn Thắc Mắc?</h3>
                      <p className="text-white text-opacity-90">
                        Chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn
                      </p>
                    </div>
                    <Link
                      to="/lien-he"
                      className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-lg"
                    >
                      Liên Hệ Ngay
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center mb-8">
            <p className={secondaryTextColor}>Cập nhật lần cuối: 15/03/2025 | Phiên bản: 2.1.0</p>
            <div className="flex justify-center mt-4 space-x-4">
              <Link to="/" className={`${highlightColor} hover:underline`}>
                Trang Chủ
              </Link>
              <span className={secondaryTextColor}>•</span>
              <Link to="/chinh-sach-bao-mat" className={`${highlightColor} hover:underline`}>
                Chính Sách Bảo Mật
              </Link>
              <span className={secondaryTextColor}>•</span>
              <Link to="/lien-he" className={`${highlightColor} hover:underline`}>
                Liên Hệ
              </Link>
            </div>
          </footer>
        </div>
      </main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg z-50 transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-[#0288D1] hover:bg-[#01579B] text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          aria-label="Lên đầu trang"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default DieuKhoanSuDungPage;
