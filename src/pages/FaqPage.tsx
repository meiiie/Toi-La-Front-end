'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

// Định nghĩa kiểu dữ liệu cho FAQ
type FAQItem = {
  question: string;
  answer: string;
};

export default function FAQ() {
  // State để theo dõi accordion đang mở
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Thêm SEO component
  const seoData = {
    title: 'Câu Hỏi Thường Gặp | Blockchain Election Hub',
    description:
      'Giải đáp các thắc mắc về hệ thống bầu cử blockchain, cách thức hoạt động, tính bảo mật và minh bạch của công nghệ blockchain trong bầu cử.',
    keywords:
      'blockchain, bầu cử, FAQ, câu hỏi thường gặp, bảo mật, minh bạch, token, phiếu bầu, MetaMask',
    author: 'Blockchain Election Hub',
    image:
      'https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=1200&auto=format&fit=crop',
    url: 'https://blockchain-election-hub.com/faq',
  };

  // Danh sách câu hỏi và câu trả lời
  const faqItems: FAQItem[] = [
    {
      question: 'Blockchain bầu cử là gì?',
      answer:
        'Đây là một nền tảng sử dụng công nghệ blockchain để tổ chức các cuộc bầu cử trực tuyến, đảm bảo tính bảo mật, minh bạch, và không thể thay đổi kết quả. Mọi phiếu bầu được mã hóa và lưu trữ trên blockchain, không ai có thể can thiệp.',
    },
    {
      question: 'Làm thế nào để tham gia một cuộc bầu cử?',
      answer:
        "Bạn cần đăng nhập bằng tài khoản hoặc ví MetaMask, đồng ý với điều lệ của cuộc bầu cử, chọn phiên bầu cử, và bỏ phiếu. Quy trình được hướng dẫn chi tiết trong trang 'Tham Gia Cuộc Bầu Cử'.",
    },
    {
      question: 'Tôi cần ví MetaMask để tham gia không?',
      answer:
        'Không bắt buộc. Bạn có thể đăng nhập bằng username/password truyền thống hoặc ví MetaMask. Tuy nhiên, MetaMask cho phép bạn kết nối trực tiếp với blockchain để nhận token phiếu bầu.',
    },
    {
      question: 'Phiếu bầu của tôi có được bảo mật không?',
      answer:
        'Có. Phiếu bầu được mã hóa trên blockchain, chỉ bạn và hệ thống biết bạn đã bỏ phiếu cho ai. Không ai, kể cả admin, có thể truy cập thông tin này.',
    },
    {
      question: 'Làm thế nào để kiểm tra tính minh bạch của kết quả?',
      answer:
        'Kết quả được lưu trên blockchain công khai. Bạn có thể kiểm tra giao dịch phiếu bầu qua explorer của mạng POA Geth tại https://geth.holihu.online.',
    },
    {
      question: 'Tôi quên mật khẩu thì phải làm sao?',
      answer:
        "Nhấn 'Forgot Password?' trên trang đăng nhập, nhập email hoặc địa chỉ ví MetaMask để khôi phục tài khoản qua quy trình xác minh.",
    },
    {
      question: 'Admin có thể thay đổi kết quả bầu cử không?',
      answer:
        'Không. Một khi phiếu bầu được ghi lên blockchain, nó không thể bị thay đổi, ngay cả bởi admin. Hệ thống đảm bảo tính bất biến.',
    },
    {
      question: 'Token phiếu bầu là gì?',
      answer:
        'Đây là các token kỹ thuật số được phát cho cử tri để bỏ phiếu. Mỗi token đại diện cho một phiếu và được ghi lại trên blockchain khi bạn sử dụng nó.',
    },
    {
      question: 'Làm sao để trở thành admin của một cuộc bầu cử?',
      answer:
        'Bạn cần được cấp quyền `QUANTRI_CUOCBAUCU` hoặc `BANTOCHUC` bởi hệ thống. Liên hệ đội ngũ hỗ trợ để biết thêm chi tiết.',
    },
    {
      question: 'Hệ thống có hỗ trợ trên mobile không?',
      answer:
        'Có. Trang web được thiết kế responsive, hoạt động mượt mà trên cả desktop và mobile, bao gồm đăng nhập, bỏ phiếu, và xem kết quả.',
    },
  ];

  // Hiệu ứng khi component được mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Xử lý khi click vào câu hỏi
  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
            Câu Hỏi Thường Gặp
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
      <main className="max-w-3xl mx-auto px-4 py-16 relative z-0">
        {/* Title with glow effect */}
        <div
          className={`text-center mb-12 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white relative inline-block">
            Câu Hỏi Thường Gặp
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-[#6A1B9A] to-[#0288D1] opacity-30 -z-10 scale-110"></div>
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={`transition-all duration-500 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div
                className={`rounded-xl transition-all duration-300 ${
                  openIndex === index
                    ? 'bg-[#37474F] shadow-lg border border-[#6A1B9A] shadow-[#6A1B9A]/10'
                    : 'bg-[#263238] border border-[#B0BEC5]/30 hover:border-[#E1F5FE]/50 hover:scale-[1.01]'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center"
                >
                  <span className="text-white font-medium text-lg md:text-xl">{item.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-[#B0BEC5]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#B0BEC5]" />
                  )}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6 text-[#B0BEC5] leading-relaxed">{item.answer}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#263238] py-10 text-center">
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
      canvas.height = window.innerHeight;
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
