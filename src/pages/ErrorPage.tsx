'use client';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/Button';
import { FaExclamationTriangle, FaHome, FaArrowLeft, FaRedo } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

export default function ErrorPage() {
  const error = useRouteError();
  const { theme } = useTheme();

  // Xác định thông tin lỗi một cách an toàn
  let errorMessage = 'Đã xảy ra lỗi không mong muốn.';
  let errorStatus = '';

  if (isRouteErrorResponse(error)) {
    errorStatus = String(error.status);
    errorMessage = error.statusText || errorMessage;
    if (error.data?.message) {
      errorMessage = error.data.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null && 'statusText' in error) {
    errorMessage = (error as any).statusText || errorMessage;
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        theme === 'dark' ? 'bg-[#0A1416]' : 'bg-[#f5f5f5]'
      } transition-colors duration-300`}
    >
      <Helmet>
        <title>Trang Lỗi | Nền Tảng Bầu Cử Blockchain</title>
        <meta name="description" content="Trang lỗi, có điều gì đó sai sai." />
        <meta name="keywords" content="lỗi, bầu cử, blockchain, trang lỗi" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="Trang Lỗi - Bầu Cử Blockchain" />
        <meta property="og:description" content="Trang lỗi, có điều gì đó sai sai." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="http://localhost:3000/error" />
        <meta property="og:image" content="http://localhost:3000/logo.png" />
      </Helmet>

      <Header />

      <main
        className={`flex-grow flex items-center justify-center transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#0A1416]' : 'bg-[#f5f5f5]'
        }`}
      >
        <div className="text-center p-8 max-w-2xl relative">
          {/* Background Tech Pattern */}
          <div className="absolute inset-0 cyber-grid opacity-10 z-0"></div>

          {/* Error Icon with Glow Effect */}
          <div className="relative mb-8 inline-block z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/30 to-[#6A1B9A]/30 rounded-full blur-lg"></div>
            <div
              className={`relative p-6 rounded-full ${
                theme === 'dark' ? 'bg-[#263238]/50' : 'bg-white/50'
              } backdrop-blur-sm border border-[#0288D1]/30`}
            >
              <FaExclamationTriangle className="h-16 w-16 text-[#0288D1]" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#E1F5FE] to-[#0288D1] z-10 relative">
            Oops! Có điều gì đó sai sai.
            {errorStatus && ` (${errorStatus})`}
          </h1>

          {/* Divider */}
          <div className="h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] w-[100px] mx-auto mb-6 z-10 relative" />

          {/* Error Message */}
          <p
            className={`text-xl mb-8 z-10 relative ${
              theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'
            }`}
          >
            {errorMessage}
          </p>

          <div className="space-y-4 z-10 relative">
            <p className={`${theme === 'dark' ? 'text-[#B0BEC5]' : 'text-[#616161]'}`}>
              Chúng tôi xin lỗi về điều này, bạn vui lòng hãy thử lại:
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Refresh Button */}
              <Button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-[0_0_15px_rgba(2,136,209,0.5)] transition-all duration-300"
              >
                <FaRedo className="mr-2 h-4 w-4" /> Thử lại
              </Button>

              {/* Back Button */}
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className={`flex items-center justify-center border border-[#0288D1] ${
                  theme === 'dark'
                    ? 'text-[#0288D1] hover:bg-[#0288D1]/10'
                    : 'text-[#0288D1] hover:bg-[#E1F5FE]'
                } transition-colors duration-300`}
              >
                <FaArrowLeft className="mr-2 h-4 w-4" /> Quay lại
              </Button>

              {/* Home Button */}
              <Button
                onClick={() => (window.location.href = '/')}
                className={`flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-[#37474F] text-white hover:bg-[#455A64]'
                    : 'bg-[#e0e0e0] text-[#212121] hover:bg-[#bdbdbd]'
                } transition-colors duration-300`}
              >
                <FaHome className="mr-2 h-4 w-4" /> Về Home
              </Button>
            </div>
          </div>

          {/* Support Contact */}
          <p
            className={`mt-8 text-sm z-10 relative ${
              theme === 'dark' ? 'text-[#78909C]' : 'text-[#757575]'
            }`}
          >
            Nếu còn tiếp tục xảy ra lỗi, hãy liên hệ tới đội hỗ trợ của chúng tôi{' '}
            <a
              href="mailto:support@blockchain-election.vn"
              className="text-[#0288D1] hover:text-[#E1F5FE] transition-colors duration-300 hover:underline"
            >
              support@blockchain-election.vn
            </a>
          </p>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#0288D1]/10 to-[#6A1B9A]/10 rounded-tr-full -z-10"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#0288D1]/10 to-[#6A1B9A]/10 rounded-bl-full -z-10"></div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
