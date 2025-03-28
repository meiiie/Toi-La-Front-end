'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Send,
  ArrowLeft,
  Github,
  Twitter,
  Linkedin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useDispatch, useSelector } from 'react-redux';
import { sendContact, resetState } from '../store/slice/lienHeSlice';
import type { RootState, AppDispatch } from '../store/store';
import type { ContactData } from '../store/types';

export default function LienHePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  // Redux state
  const dispatch = useDispatch<AppDispatch>();
  const { loading, success, message, error } = useSelector((state: RootState) => state.lienHe);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm<ContactData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // SEO data
  const seoData = {
    title: 'Liên Hệ | Blockchain Election Hub',
    description:
      'Liên hệ với đội ngũ phát triển hệ thống bầu cử blockchain. Chúng tôi sẵn sàng hỗ trợ và giải đáp mọi thắc mắc của bạn.',
    keywords: 'blockchain, bầu cử, liên hệ, hỗ trợ, phản hồi, công nghệ blockchain',
    author: 'Blockchain Election Hub',
    image:
      'https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=1200&auto=format&fit=crop',
    url: 'https://blockchain-election-hub.com/lien-he',
  };

  // Hiệu ứng khi component được mount
  useEffect(() => {
    setIsLoaded(true);

    // Reset Redux state khi component unmount
    return () => {
      dispatch(resetState());
    };
  }, [dispatch]);

  // Cuộn lên đầu trang khi có thông báo thành công hoặc lỗi
  useEffect(() => {
    if (success || error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [success, error]);

  // Reset form và state sau khi gửi thành công
  useEffect(() => {
    if (success) {
      reset();

      // Sau 5 giây, reset state
      const timer = setTimeout(() => {
        dispatch(resetState());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch, reset]);

  async function onSubmit(contactData: ContactData) {
    // Lưu tên để hiển thị trong thông báo thành công
    setSubmittedName(contactData.ten);

    // Gửi dữ liệu thông qua Redux action
    dispatch(sendContact(contactData));
  }

  return (
    <div className="relative min-h-screen bg-[#0A1416] overflow-hidden">
      <SEO {...seoData} />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#263238] shadow-md px-6 md:px-10 py-5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#0288D1] flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl md:text-2xl tracking-tight">
            Blockchain Holihu
          </h1>
        </div>
        <Link
          to="/"
          className="flex items-center px-4 py-2 bg-[#0288D1] hover:bg-[#01579B] text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="font-medium text-sm">Về Trang Chủ</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16 relative z-1">
        {/* Title with glow effect */}
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white relative inline-block">
            Liên Hệ Với Chúng Tôi
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-[#6A1B9A] to-[#0288D1] opacity-30 -z-10 scale-110"></div>
          </h2>
          <p className="mt-4 text-[#B0BEC5] max-w-2xl mx-auto">
            Hãy để lại thông tin của bạn, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất. Mọi
            thông tin của bạn đều được bảo mật trên blockchain.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 bg-[#1B5E20] bg-opacity-20 border border-[#4CAF50] rounded-xl p-6 text-center transition-all duration-500 opacity-100 translate-y-0">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6 text-[#4CAF50] mr-2" />
              <h3 className="text-[#4CAF50] text-xl font-bold">Gửi Thành Công!</h3>
            </div>
            <p className="text-[#B0BEC5]">
              Cảm ơn <span className="text-white font-medium">{submittedName}</span>,{' '}
              {message || 'chúng tôi đã nhận được thông tin của bạn và sẽ liên hệ lại sớm.'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-[#B71C1C] bg-opacity-20 border border-[#F44336] rounded-xl p-6 text-center transition-all duration-500 opacity-100 translate-y-0">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6 text-[#F44336] mr-2" />
              <h3 className="text-[#F44336] text-xl font-bold">Gửi Không Thành Công</h3>
            </div>
            <p className="text-[#B0BEC5]">{error}</p>
          </div>
        )}

        {/* Contact Form and Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div
            className={`md:col-span-1 transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            <div className="bg-[#263238] rounded-xl p-6 shadow-lg border border-[#455A64] h-full">
              <h3 className="text-white text-xl font-bold mb-6 border-b border-[#455A64] pb-4">
                Thông Tin Liên Hệ
              </h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center mr-4 mt-1">
                    <svg
                      className="w-5 h-5 text-[#0288D1]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Email</h4>
                    <p className="text-[#B0BEC5] mt-1">contact@blockchain-election.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#6A1B9A] bg-opacity-20 flex items-center justify-center mr-4 mt-1">
                    <svg
                      className="w-5 h-5 text-[#6A1B9A]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Điện Thoại</h4>
                    <p className="text-[#B0BEC5] mt-1">+84 123 456 789</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#0097A7] bg-opacity-20 flex items-center justify-center mr-4 mt-1">
                    <svg
                      className="w-5 h-5 text-[#0097A7]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Địa Chỉ</h4>
                    <p className="text-[#B0BEC5] mt-1">
                      Tòa nhà Innovation, 123 Đường Công Nghệ, Quận 1, TP.HCM
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#455A64]">
                <h4 className="text-white font-medium mb-4">Kết Nối Với Chúng Tôi</h4>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-[#0288D1] bg-opacity-20 flex items-center justify-center text-[#0288D1] hover:bg-opacity-40 transition-all duration-300"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-[#6A1B9A] bg-opacity-20 flex items-center justify-center text-[#6A1B9A] hover:bg-opacity-40 transition-all duration-300"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-[#0097A7] bg-opacity-20 flex items-center justify-center text-[#0097A7] hover:bg-opacity-40 transition-all duration-300"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div
            className={`md:col-span-2 transition-all duration-700 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
          >
            <div className="bg-[#263238] rounded-xl p-6 shadow-lg border border-[#455A64]">
              <h3 className="text-white text-xl font-bold mb-6 border-b border-[#455A64] pb-4">
                Gửi Tin Nhắn
              </h3>

              <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tên */}
                  <div className="space-y-2">
                    <label htmlFor="ten" className="text-white font-medium flex items-center">
                      Tên của bạn <span className="text-[#F44336] ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      id="ten"
                      placeholder="Nhập tên của bạn"
                      {...register('ten', { required: 'Bạn phải nhập tên của mình' })}
                      className={`w-full bg-[#37474F] border ${
                        errors.ten ? 'border-[#F44336]' : 'border-[#455A64]'
                      } rounded-lg p-3 text-white placeholder-[#78909C] focus:border-[#0288D1] focus:ring-1 focus:ring-[#0288D1] transition-all duration-300`}
                    />
                    {errors.ten && (
                      <p className="text-[#F44336] text-sm mt-1">{errors.ten.message}</p>
                    )}
                  </div>

                  {/* Tuổi */}
                  <div className="space-y-2">
                    <label htmlFor="tuoi" className="text-white font-medium flex items-center">
                      Tuổi của bạn <span className="text-[#F44336] ml-1">*</span>
                    </label>
                    <input
                      type="number"
                      id="tuoi"
                      placeholder="Nhập tuổi của bạn"
                      {...register('tuoi', {
                        required: 'Bạn phải nhập tuổi của mình',
                        min: {
                          value: 18,
                          message: 'Bạn phải ít nhất 18 tuổi',
                        },
                        max: {
                          value: 120,
                          message: 'Bạn phải nhiều nhất 120 tuổi',
                        },
                      })}
                      className={`w-full bg-[#37474F] border ${
                        errors.tuoi ? 'border-[#F44336]' : 'border-[#455A64]'
                      } rounded-lg p-3 text-white placeholder-[#78909C] focus:border-[#0288D1] focus:ring-1 focus:ring-[#0288D1] transition-all duration-300`}
                    />
                    {errors.tuoi && (
                      <p className="text-[#F44336] text-sm mt-1">{errors.tuoi.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-white font-medium flex items-center">
                    Địa chỉ email <span className="text-[#F44336] ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="example@email.com"
                    {...register('email', {
                      required: 'Bạn phải nhập địa chỉ email của mình',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Giá trị nhập vào không khớp với định dạng email',
                      },
                    })}
                    className={`w-full bg-[#37474F] border ${
                      errors.email ? 'border-[#F44336]' : 'border-[#455A64]'
                    } rounded-lg p-3 text-white placeholder-[#78909C] focus:border-[#0288D1] focus:ring-1 focus:ring-[#0288D1] transition-all duration-300`}
                  />
                  {errors.email && (
                    <p className="text-[#F44336] text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Lý do */}
                <div className="space-y-2">
                  <label htmlFor="lyDo" className="text-white font-medium flex items-center">
                    Lý do liên hệ <span className="text-[#F44336] ml-1">*</span>
                  </label>
                  <select
                    id="lyDo"
                    {...register('lyDo', {
                      required: 'Bạn phải chọn một lý do',
                    })}
                    className={`w-full bg-[#37474F] border ${
                      errors.lyDo ? 'border-[#F44336]' : 'border-[#455A64]'
                    } rounded-lg p-3 text-white focus:border-[#0288D1] focus:ring-1 focus:ring-[#0288D1] transition-all duration-300`}
                  >
                    <option value="" hidden>
                      Chọn lý do liên hệ
                    </option>
                    <option value="Support">Hỗ trợ kỹ thuật</option>
                    <option value="Feedback">Phản hồi và góp ý</option>
                    <option value="Partnership">Hợp tác kinh doanh</option>
                    <option value="Other">Lý do khác</option>
                  </select>
                  {errors.lyDo && (
                    <p className="text-[#F44336] text-sm mt-1">{errors.lyDo.message}</p>
                  )}
                </div>

                {/* Ghi chú */}
                <div className="space-y-2">
                  <label htmlFor="ghiChu" className="text-white font-medium">
                    Nội dung tin nhắn
                  </label>
                  <textarea
                    id="ghiChu"
                    rows={5}
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                    {...register('ghiChu')}
                    className="w-full bg-[#37474F] border border-[#455A64] rounded-lg p-3 text-white placeholder-[#78909C] focus:border-[#0288D1] focus:ring-1 focus:ring-[#0288D1] transition-all duration-300"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex items-center justify-center w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform ${
                      loading
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:shadow-xl hover:scale-[1.02]'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Đang Gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Gửi Tin Nhắn
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#263238] py-10 text-center mt-16 relative z-1">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-white font-bold text-lg mb-4">Blockchain Holihu</h3>
          <div className="flex justify-center space-x-6 mb-6">
            <a
              href="#"
              className="text-[#0288D1] hover:text-[#6A1B9A] transition-all duration-300 transform hover:scale-125"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-[#0288D1] hover:text-[#6A1B9A] transition-all duration-300 transform hover:scale-125"
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href="#"
              className="text-[#0288D1] hover:text-[#6A1B9A] transition-all duration-300 transform hover:scale-125"
            >
              <Linkedin className="w-6 h-6" />
            </a>
          </div>
          <p className="text-[#B0BEC5] text-sm">Powered by Web3 Technology</p>
        </div>
      </footer>
    </div>
  );
}

// Component hiệu ứng Particle
function ParticleBackground() {
  useEffect(() => {
    // Tạo canvas cho particle
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const container = document.querySelector('.particle-container');

    if (!ctx || !container) return;

    container.appendChild(canvas);

    // Thiết lập kích thước canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 1.2; // Tăng chiều cao để đảm bảo phủ toàn bộ trang
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Tạo các particle
    const particlesArray: Particle[] = [];
    const numberOfParticles = Math.min(window.innerWidth / 10, 100);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = Math.random() > 0.5 ? 'rgba(2, 136, 209, 0.2)' : 'rgba(106, 27, 154, 0.2)';
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;

        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Khởi tạo particles
    const init = () => {
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    // Vẽ và cập nhật particles
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }

      // Vẽ các đường nối giữa các particle gần nhau
      connectParticles();

      requestAnimationFrame(animate);
    };

    // Vẽ đường nối giữa các particle gần nhau
    const connectParticles = () => {
      if (!ctx) return;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const opacity = 1 - distance / 100;
            ctx.strokeStyle = `rgba(2, 136, 209, ${opacity * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    init();
    animate();

    // Cleanup khi component unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (canvas && container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return null;
}
