'use client';

import type React from 'react';

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaUserShield,
  FaLock,
  FaEye,
  FaChevronDown,
  FaArrowRight,
  FaFingerprint,
  FaShieldAlt,
  FaNetworkWired,
} from 'react-icons/fa';
import {
  HiOutlineSparkles,
  HiOutlineLightningBolt,
  HiOutlineCube,
  HiOutlineChip,
  HiOutlineGlobe,
} from 'react-icons/hi';
import ScrollButton from '../components/ScrollButton';
import SEO from '../components/SEO';
import {
  blockchainBenefits,
  userBenefits,
  introductionCards,
  electionSteps,
  partners,
} from '../data/constants';
import { useTheme } from '../context/ThemeContext';

const ChaoMungPage = () => {
  const partnersSectionRef = useRef<HTMLDivElement>(null);
  const introductionSectionRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';

    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const scrollToIntroduction = () => {
    if (introductionSectionRef.current) {
      introductionSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === 'dark' ? 'bg-[#0A1416]' : 'bg-[#f5f5f5]'
      } text-white overflow-hidden transition-colors duration-300`}
    >
      <SEO
        title="Bầu Cử BlockChain | Tương Lai Của Dân Chủ Số"
        description="Nền tảng bầu cử trực tuyến sử dụng công nghệ blockchain để đảm bảo tính minh bạch và bảo mật tuyệt đối."
        keywords="bầu cử, trực tuyến, blockchain, bảo mật, minh bạch, nền tảng bầu cử, dân chủ số"
        author="Nền Tảng Bầu Cử Blockchain"
        url={window.location.href}
        image="https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=2832&auto=format&fit=crop"
      />

      {/* Particle Background with CSS */}
      <div
        className={`fixed inset-0 z-0 ${
          theme === 'dark' ? 'bg-[#0A1416]' : 'bg-[#f5f5f5]'
        } overflow-hidden transition-colors duration-300`}
      >
        <div className="particles-container">
          {Array.from({ length: 50 }).map((_, index) => (
            <div
              key={index}
              className="particle"
              style={
                {
                  '--x': `${Math.random() * 100}%`,
                  '--y': `${Math.random() * 100}%`,
                  '--size': `${Math.random() * 3 + 1}px`,
                  '--duration': `${Math.random() * 20 + 10}s`,
                  '--delay': `${Math.random() * 5}s`,
                  '--color': Math.random() > 0.5 ? '#0288D1' : '#6A1B9A',
                  '--opacity': Math.random() * 0.3 + 0.1,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="hexagon-grid">
          {Array.from({ length: 20 }).map((_, index) => (
            <div
              key={index}
              className="hexagon"
              style={
                {
                  '--x': `${Math.random() * 100}%`,
                  '--y': `${Math.random() * 100}%`,
                  '--size': `${Math.random() * 50 + 30}px`,
                  '--rotation': `${Math.random() * 360}deg`,
                  '--opacity': Math.random() * 0.1 + 0.05,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>

      <main className="flex-grow relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
          {/* Animated Gradient Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${
              theme === 'dark'
                ? 'from-[#0A1416]/80 via-transparent to-[#0A1416]/80'
                : 'from-[#f5f5f5]/80 via-transparent to-[#f5f5f5]/80'
            } z-0`}
          ></div>

          {/* Hero Content */}
          <div
            className={`container mx-auto text-center relative z-10 px-4 sm:px-6 lg:px-8 transition-opacity duration-1000 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Glowing Orb */}
            <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[#0288D1]/20 to-[#6A1B9A]/20 blur-[100px] z-0 animate-pulse-slow" />

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight hero-title">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E1F5FE] to-[#0288D1]">
                Tương Lai
              </span>{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]">
                Của Dân Chủ Số
              </span>
            </h1>

            <p
              className={`text-xl md:text-2xl ${
                theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'
              } max-w-3xl mx-auto mb-10 hero-description`}
            >
              Nền tảng bầu cử blockchain đầu tiên tại Việt Nam, mang đến sự minh bạch tuyệt đối và
              bảo mật không thể xâm phạm.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 hero-buttons">
              <button
                onClick={scrollToIntroduction}
                className="px-8 py-4 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full text-white font-medium text-lg flex items-center gap-2 shadow-[0_0_15px_rgba(2,136,209,0.5)] hover:shadow-[0_0_25px_rgba(2,136,209,0.7)] transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Khám Phá Ngay <FaArrowRight />
              </button>

              <Link
                to="/elections"
                className="px-8 py-4 bg-transparent border border-[#0288D1] rounded-full text-[#0288D1] font-medium text-lg hover:bg-[#0288D1]/10 transition-colors duration-300 hover:scale-105 active:scale-95"
              >
                Xem Các Cuộc Bầu Cử
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 transform -translate-x-1/2 flex flex-col items-center animate-bounce-slow text-center">
            <span className={theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'}>
              Cuộn xuống
            </span>
            <FaChevronDown className="text-[#0288D1]" />
          </div>
        </section>

        {/* Introduction Section - Redesigned */}
        <section
          ref={introductionSectionRef}
          className={`py-20 ${
            theme === 'dark' ? 'bg-[#263238]' : 'bg-[#e0e0e0]'
          } relative z-10 transition-colors duration-300`}
          id="introduction"
        >
          {/* Background Tech Pattern */}
          <div className="absolute inset-0 cyber-grid opacity-10"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-block mb-4 section-icon relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/30 to-[#6A1B9A]/30 rounded-full blur-lg"></div>
                <div
                  className={`relative p-4 rounded-full ${
                    theme === 'dark' ? 'bg-[#0A1416]/50' : 'bg-white/50'
                  } backdrop-blur-sm border border-[#0288D1]/30`}
                >
                  <HiOutlineSparkles className="text-[#0288D1] text-4xl" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#E1F5FE] to-[#0288D1] section-title">
                Giới Thiệu Về Hệ Thống Bầu Cử
              </h2>
              <div className="h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] w-[100px] mx-auto mb-6 section-divider" />
              <p
                className={`${
                  theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'
                } max-w-3xl mx-auto text-lg section-description`}
              >
                Công nghệ blockchain đang định hình lại cách chúng ta tổ chức và tham gia vào các
                cuộc bầu cử, mang đến sự minh bạch và bảo mật chưa từng có.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {introductionCards.map((card, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-8 shadow-lg transition-all duration-500 border border-[#455A64] hover:border-[#0288D1] card-intro transform hover:-translate-y-2 hover:shadow-[0_20px_25px_-5px_rgba(2,136,209,0.1),_0_10px_10px_-5px_rgba(2,136,209,0.04)] ${
                    theme === 'dark'
                      ? 'bg-[#37474F] hover:bg-gradient-to-br hover:from-[#37474F] hover:to-[#263238]'
                      : 'bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#f0f0f0]'
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="mb-6 relative">
                    <div className="w-20 h-20 mx-auto rounded-full bg-[#0A1416] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0288D1]/20 to-[#6A1B9A]/20 animate-pulse" />
                      <img
                        src={
                          card.imgSrc ||
                          'https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=2832&auto=format&fit=crop&h=80&w=80' ||
                          '/placeholder.svg'
                        }
                        alt={card.title}
                        className="w-16 h-16 object-cover rounded-full z-10"
                      />
                    </div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#0288D1]/20 to-transparent blur-xl opacity-50 -z-10" />
                  </div>
                  <h3
                    className={`text-xl font-bold mb-4 text-center ${
                      theme === 'dark' ? 'text-white' : 'text-[#212121]'
                    }`}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={
                      theme === 'dark' ? 'text-[#B0BEC5] text-center' : 'text-[#616161] text-center'
                    }
                  >
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Election Process Section - Redesigned for Cyber-Tech Minimalism */}
        <section
          className={`py-20 ${
            theme === 'dark' ? 'bg-[#0A1416]' : 'bg-[#f5f5f5]'
          } relative z-10 overflow-hidden transition-colors duration-300`}
        >
          {/* Background Grid Lines */}
          <div className="absolute inset-0 grid-lines opacity-20">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #0288D1 1px, transparent 1px), linear-gradient(to bottom, #0288D1 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            ></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/30 to-[#6A1B9A]/30 rounded-full blur-lg"></div>
                  <div
                    className={`relative p-4 rounded-full ${
                      theme === 'dark' ? 'bg-[#0A1416]/50' : 'bg-white/50'
                    } backdrop-blur-sm border border-[#0288D1]/30`}
                  >
                    <HiOutlineLightningBolt className="text-[#0288D1] text-4xl" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#E1F5FE] to-[#6A1B9A] section-title">
                Quy Trình Bầu Cử
              </h2>
              <div className="h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] w-[100px] mx-auto mb-6 section-divider" />
              <p
                className={`${
                  theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'
                } max-w-3xl mx-auto text-lg section-description`}
              >
                Một quy trình bầu cử minh bạch, an toàn và dễ dàng cho mọi người tham gia.
              </p>
            </div>

            {/* Neo-Futuristic Process Steps */}
            <div className="relative max-w-5xl mx-auto">
              {/* Central Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#0288D1] via-[#6A1B9A] to-[#0288D1] z-10 hidden md:block"></div>

              {electionSteps.map((step, index) => (
                <div
                  key={index}
                  className={`relative mb-16 last:mb-0 process-step ${
                    index % 2 === 0 ? 'process-step-even' : 'process-step-odd'
                  }`}
                  style={{ animationDelay: `${index * 300}ms` }}
                >
                  <div className="flex flex-col md:flex-row items-center">
                    {/* Step Number - Left side for even, right side for odd */}
                    <div
                      className={`md:w-1/2 flex ${
                        index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'
                      } mb-8 md:mb-0 order-1 ${
                        index % 2 === 0 ? 'md:order-1 md:pr-10' : 'md:order-3 md:pl-10'
                      }`}
                    >
                      <div className="relative group">
                        {/* Glowing background */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#0288D1] to-[#6A1B9A] blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-500 scale-110"></div>

                        {/* Step number container */}
                        <div
                          className={`relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 backdrop-blur-sm rounded-xl border border-[#455A64] group-hover:border-[#0288D1] transition-all duration-300 z-20 ${
                            theme === 'dark' ? 'bg-[#0A1416]/80' : 'bg-white/80'
                          }`}
                        >
                          <span className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-[#0288D1] to-[#6A1B9A] group-hover:from-[#E1F5FE] group-hover:to-[#6A1B9A] transition-all duration-300">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center Node */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] blur-md opacity-70"></div>
                        <div
                          className={`relative w-6 h-6 rounded-full border-2 border-[#0288D1] ${
                            theme === 'dark' ? 'bg-[#0A1416]' : 'bg-white'
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Step Content - Right side for even, left side for odd */}
                    <div
                      className={`md:w-1/2 order-2 ${
                        index % 2 === 0 ? 'md:order-3 md:pl-10' : 'md:order-1 md:pr-10'
                      }`}
                    >
                      <div className="relative group">
                        {/* Subtle glow on hover */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#0288D1]/0 to-[#6A1B9A]/0 group-hover:from-[#0288D1]/10 group-hover:to-[#6A1B9A]/10 blur-xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>

                        {/* Content box */}
                        <div
                          className={`relative backdrop-blur-sm p-6 md:p-8 rounded-xl border border-[#455A64] group-hover:border-[#0288D1] transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-[0_10px_40px_-15px_rgba(2,136,209,0.3)] ${
                            theme === 'dark' ? 'bg-[#263238]/80' : 'bg-white/80'
                          }`}
                        >
                          <h3
                            className={`text-xl md:text-2xl font-bold mb-4 flex items-center ${
                              theme === 'dark' ? 'text-white' : 'text-[#212121]'
                            }`}
                          >
                            <span className="w-2 h-8 bg-gradient-to-b from-[#0288D1] to-[#6A1B9A] rounded-full mr-3"></span>
                            Bước {index + 1}
                          </h3>
                          <p
                            className={
                              theme === 'dark'
                                ? 'text-[#B0BEC5] leading-relaxed'
                                : 'text-[#616161] leading-relaxed'
                            }
                          >
                            {step}
                          </p>

                          {/* Tech decoration element */}
                          <div className="absolute bottom-3 right-3 w-12 h-12 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                            <svg
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="#0288D1"
                                strokeWidth="1"
                                strokeDasharray="6 4"
                              />
                              <circle
                                cx="50"
                                cy="50"
                                r="30"
                                stroke="#6A1B9A"
                                strokeWidth="1"
                                strokeDasharray="4 2"
                              />
                              <circle cx="50" cy="50" r="20" stroke="#0288D1" strokeWidth="1" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Blockchain Benefits Section - Redesigned */}
        <section
          className={`py-20 ${
            theme === 'dark' ? 'bg-[#263238]' : 'bg-[#e0e0e0]'
          } relative z-10 transition-colors duration-300`}
        >
          {/* Tech Background Pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-full opacity-5">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern
                    id="circuit-pattern"
                    x="0"
                    y="0"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 0,10 L 10,10 M 10,0 L 10,20"
                      stroke="#0288D1"
                      strokeWidth="0.5"
                      fill="none"
                    />
                    <circle cx="10" cy="10" r="2" fill="#6A1B9A" opacity="0.5" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-pattern)" />
              </svg>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/30 to-[#6A1B9A]/30 rounded-full blur-lg"></div>
                  <div
                    className={`relative p-4 rounded-full ${
                      theme === 'dark' ? 'bg-[#0A1416]/50' : 'bg-white/50'
                    } backdrop-blur-sm border border-[#0288D1]/30`}
                  >
                    <HiOutlineCube className="text-[#0288D1] text-4xl" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#E1F5FE] to-[#0288D1] section-title">
                Tại Sao Chọn Blockchain?
              </h2>
              <div className="h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] w-[100px] mx-auto mb-6 section-divider" />
              <p
                className={`${
                  theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'
                } max-w-3xl mx-auto text-lg section-description`}
              >
                Blockchain mang đến những lợi thế vượt trội cho hệ thống bầu cử hiện đại.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blockchainBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-8 shadow-lg transition-all duration-300 border border-[#455A64] hover:border-[#0288D1] relative overflow-hidden benefit-card transform hover:-translate-y-2 hover:shadow-[0_20px_25px_-5px_rgba(2,136,209,0.1),_0_10px_10px_-5px_rgba(2,136,209,0.04)] ${
                    theme === 'dark' ? 'bg-[#37474F]' : 'bg-white'
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Decorative Tech Elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#0288D1]/10 to-[#6A1B9A]/10 rounded-bl-full -z-10" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 opacity-10">
                    <svg viewBox="0 0 100 100" fill="none">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#0288D1"
                        strokeWidth="1"
                        strokeDasharray="10 5"
                      />
                      <circle cx="50" cy="50" r="25" stroke="#6A1B9A" strokeWidth="1" />
                    </svg>
                  </div>

                  <div className="mb-6 text-[#0288D1] relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#0288D1]/20 to-[#6A1B9A]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {benefit.icon ||
                      (index === 0 ? (
                        <FaFingerprint size={48} />
                      ) : index === 1 ? (
                        <FaShieldAlt size={48} />
                      ) : (
                        <FaNetworkWired size={48} />
                      ))}
                  </div>

                  <h3
                    className={`text-xl font-bold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-[#212121]'
                    }`}
                  >
                    {benefit.title}
                  </h3>
                  <p className={theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'}>
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* User Benefits Section - Redesigned */}
        <section
          className={`py-20 ${
            theme === 'dark' ? 'bg-[#0A1416]' : 'bg-[#f5f5f5]'
          } relative z-10 transition-colors duration-300`}
        >
          {/* Cyber Grid Background */}
          <div className="absolute inset-0 cyber-grid opacity-5"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/30 to-[#6A1B9A]/30 rounded-full blur-lg"></div>
                  <div
                    className={`relative p-4 rounded-full ${
                      theme === 'dark' ? 'bg-[#0A1416]/50' : 'bg-white/50'
                    } backdrop-blur-sm border border-[#0288D1]/30`}
                  >
                    <HiOutlineChip className="text-[#0288D1] text-4xl" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#E1F5FE] to-[#6A1B9A] section-title">
                Lợi Ích Cho Người Dùng
              </h2>
              <div className="h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] w-[100px] mx-auto mb-6 section-divider" />
              <p
                className={`${
                  theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'
                } max-w-3xl mx-auto text-lg section-description`}
              >
                Trải nghiệm bầu cử hiện đại, an toàn và thuận tiện cho mọi người dùng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {userBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-8 shadow-lg transition-all duration-300 border border-[#455A64] hover:border-[#0288D1] relative overflow-hidden benefit-card transform hover:-translate-y-2 hover:shadow-[0_20px_25px_-5px_rgba(2,136,209,0.1),_0_10px_10px_-5px_rgba(2,136,209,0.04)] ${
                    theme === 'dark' ? 'bg-[#37474F]' : 'bg-white'
                  }`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Neo-Futuristic Decorative Elements */}
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#0288D1]/10 to-[#6A1B9A]/10 rounded-tr-full -z-10" />
                  <div className="absolute top-4 right-4 w-12 h-12 opacity-10">
                    <svg viewBox="0 0 100 100" fill="none">
                      <path
                        d="M20,20 L80,20 L80,80 L20,80 Z"
                        stroke="#0288D1"
                        strokeWidth="1"
                        fill="none"
                        strokeDasharray="5 5"
                      />
                      <circle cx="50" cy="50" r="15" stroke="#6A1B9A" strokeWidth="1" />
                    </svg>
                  </div>

                  <div className="mb-6 text-[#6A1B9A] relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#0288D1]/20 to-[#6A1B9A]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {benefit.icon ||
                      (index === 0 ? (
                        <FaUserShield size={48} />
                      ) : index === 1 ? (
                        <FaLock size={48} />
                      ) : (
                        <FaEye size={48} />
                      ))}
                  </div>

                  <h3
                    className={`text-xl font-bold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-[#212121]'
                    }`}
                  >
                    {benefit.title}
                  </h3>
                  <p className={theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'}>
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners Section - Improved Infinite Carousel */}
        <section
          ref={partnersSectionRef}
          className={`py-20 ${
            theme === 'dark' ? 'bg-[#0A1416]' : 'bg-[#f5f5f5]'
          } relative z-10 border-t ${
            theme === 'dark' ? 'border-[#6A1B9A]/30' : 'border-[#bdbdbd]'
          } transition-colors duration-300`}
          id="partners"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/30 to-[#6A1B9A]/30 rounded-full blur-lg"></div>
                  <div
                    className={`relative p-4 rounded-full ${
                      theme === 'dark' ? 'bg-[#0A1416]/50' : 'bg-white/50'
                    } backdrop-blur-sm border border-[#0288D1]/30`}
                  >
                    <HiOutlineGlobe className="text-[#0288D1] text-4xl" />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#E1F5FE] to-[#6A1B9A] section-title">
                Đối Tác Của Chúng Tôi
              </h2>
              <div className="h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] w-[100px] mx-auto mb-6 section-divider" />
              <p
                className={`${
                  theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'
                } max-w-3xl mx-auto text-lg section-description`}
              >
                Hợp tác với những đối tác hàng đầu để mang đến giải pháp bầu cử blockchain tốt nhất.
              </p>
            </div>

            {/* Improved Infinite Carousel */}
            <div className="relative overflow-hidden py-10">
              {/* Gradient Overlays */}
              <div
                className={`absolute left-0 top-0 h-full w-[100px] bg-gradient-to-r ${
                  theme === 'dark' ? 'from-[#0A1416]' : 'from-[#f5f5f5]'
                } to-transparent z-10`}
              ></div>
              <div
                className={`absolute right-0 top-0 h-full w-[100px] bg-gradient-to-l ${
                  theme === 'dark' ? 'from-[#0A1416]' : 'from-[#f5f5f5]'
                } to-transparent z-10`}
              ></div>

              {/* First Carousel - Left to Right */}
              <div className="partners-track-1 flex">
                {/* Double the partners for seamless loop */}
                {[...partners, ...partners].map((partner, index) => (
                  <div
                    key={`track1-${index}`}
                    className={`partner-card flex-shrink-0 mx-4 w-[200px] p-4 rounded-xl shadow-lg border border-[#455A64] hover:border-[#E1F5FE]/50 transition-all duration-300 flex flex-col items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_rgba(106,27,154,0.5)] ${
                      theme === 'dark'
                        ? 'bg-[#37474F] hover:bg-[#6A1B9A]'
                        : 'bg-white hover:bg-[#e1f5fe]'
                    }`}
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#E1F5FE]/20 mb-4">
                      <img
                        src={
                          partner.imgSrc ||
                          'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop&h=80&w=80' ||
                          '/placeholder.svg'
                        }
                        alt={partner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p
                      className={
                        theme === 'dark' ? 'text-white font-medium' : 'text-[#212121] font-medium'
                      }
                    >
                      {partner.name}
                    </p>
                  </div>
                ))}
              </div>

              {/* Second Carousel - Right to Left (opposite direction) */}
              <div className="partners-track-2 flex mt-8">
                {/* Double the partners for seamless loop and reverse */}
                {[...partners, ...partners].reverse().map((partner, index) => (
                  <div
                    key={`track2-${index}`}
                    className={`partner-card flex-shrink-0 mx-4 w-[200px] p-4 rounded-xl shadow-lg border border-[#455A64] hover:border-[#E1F5FE]/50 transition-all duration-300 flex flex-col items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_rgba(106,27,154,0.5)] ${
                      theme === 'dark'
                        ? 'bg-[#37474F] hover:bg-[#6A1B9A]'
                        : 'bg-white hover:bg-[#e1f5fe]'
                    }`}
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#E1F5FE]/20 mb-4">
                      <img
                        src={
                          partner.imgSrc ||
                          'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop&h=80&w=80' ||
                          '/placeholder.svg'
                        }
                        alt={partner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p
                      className={
                        theme === 'dark' ? 'text-white font-medium' : 'text-[#212121] font-medium'
                      }
                    >
                      {partner.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                to="/partners"
                className="inline-flex items-center text-[#0288D1] hover:text-[#E1F5FE] transition-colors duration-300"
              >
                Xem tất cả đối tác <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className={`py-20 ${
            theme === 'dark' ? 'bg-[#263238]' : 'bg-[#e0e0e0]'
          } relative z-10 overflow-hidden transition-colors duration-300`}
        >
          <div className="absolute inset-0 opacity-20 grid-pattern">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0288D1" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div
              className={`p-8 md:p-12 rounded-2xl shadow-2xl border border-[#455A64] max-w-4xl mx-auto text-center relative overflow-hidden cta-card ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-[#0A1416] to-[#263238]'
                  : 'bg-gradient-to-r from-white to-[#e0e0e0]'
              }`}
            >
              {/* Glowing Orbs */}
              <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-[#0288D1]/20 blur-[60px]" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-[#6A1B9A]/20 blur-[60px]" />

              <h2
                className={`text-3xl md:text-4xl font-bold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-[#212121]'
                }`}
              >
                Sẵn Sàng Tham Gia Cuộc Bầu Cử?
              </h2>
              <p
                className={`text-lg mb-8 max-w-2xl mx-auto ${
                  theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'
                }`}
              >
                Đăng ký ngay hôm nay để tham gia vào nền tảng bầu cử blockchain đầu tiên tại Việt
                Nam.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full text-white font-medium text-lg flex items-center gap-2 shadow-[0_0_15px_rgba(2,136,209,0.5)] hover:shadow-[0_0_25px_rgba(2,136,209,0.7)] transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Đăng Ký Ngay <FaArrowRight />
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-transparent border border-[#0288D1] rounded-full text-[#0288D1] font-medium text-lg hover:bg-[#0288D1]/10 transition-colors duration-300 hover:scale-105 active:scale-95"
                >
                  Đăng Nhập
                </Link>
              </div>
              {/* Thêm đường dẫn đến trang thiết lập blockchain */}
              <div className="mt-6">
                <Link
                  to="/blockchain-setup"
                  className="inline-flex items-center px-6 py-3 bg-[#0D1321]/50 border border-[#0288D1]/50 rounded-lg text-[#0288D1] hover:bg-[#0288D1]/10 transition-colors duration-300"
                >
                  <FaNetworkWired className="mr-2" />
                  Thiết Lập Blockchain
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Scroll Button */}
      <ScrollButton partnersSectionRef={partnersSectionRef} />

      {/* Custom CSS for animations and effects */}
      <style>{`
        /* Particle Animation */
        .particles-container {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: var(--size);
          background-color: var(--color);
          border-radius: 50%;
          opacity: var(--opacity);
          animation: float var(--duration) infinite linear;
          animation-delay: var(--delay);
        }

        @keyframes float {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(100px, 100px);
          }
          50% {
            transform: translate(0, 200px);
          }
          75% {
            transform: translate(-100px, 100px);
          }
          100% {
            transform: translate(0, 0);
          }
        }

        /* Hexagon Grid */
        .hexagon-grid {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .hexagon {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: calc(var(--size) * 0.866);
          background: transparent;
          border: 1px solid #0288d1;
          opacity: var(--opacity);
          transform: rotate(var(--rotation));
          clip-path: polygon(0% 50%, 25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%);
        }

        /* Animations */
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }

        /* Partners Carousel Animation */
        .partners-track-1 {
          animation: scrollLeft 30s linear infinite;
          width: max-content;
        }

        .partners-track-2 {
          animation: scrollRight 30s linear infinite;
          width: max-content;
        }

        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scrollRight {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        /* Pause animation on hover */
        .partners-track-1:hover,
        .partners-track-2:hover {
          animation-play-state: paused;
        }

        /* Section Animations */
        .section-title,
        .section-description,
        .section-divider,
        .section-icon,
        .card-intro,
        .process-step,
        .benefit-card,
        .cta-card,
        .hero-title,
        .hero-description,
        .hero-buttons {
          opacity: 0;
          animation: fadeInUp 1s forwards;
        }

        .section-title {
          animation-delay: 0.2s;
        }

        .section-divider {
          animation-delay: 0.4s;
        }

        .section-description {
          animation-delay: 0.6s;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChaoMungPage;
