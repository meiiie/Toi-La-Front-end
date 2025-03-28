import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import logo from '../logo.svg';
import { Button } from './ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { AlertCircle, Home } from 'lucide-react';

const ThongBaoKhongCoCuocBauCuPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Không Có Phiên Bầu Cử | Nền Tảng Bầu Cử Blockchain</title>
        <meta
          name="description"
          content="Hiện tại không có phiên bầu cử nào được tìm thấy trên nền tảng bầu cử blockchain của chúng tôi."
        />
        <meta name="keywords" content="bầu cử, blockchain, không có phiên, thông báo" />
        <meta property="og:title" content="Không Có Phiên Bầu Cử | Nền Tảng Bầu Cử Blockchain" />
        <meta
          property="og:description"
          content="Hiện tại không có phiên bầu cử nào được tìm thấy trên nền tảng bầu cử blockchain của chúng tôi."
        />
        <meta property="og:image" content={`${window.location.origin}${logo}`} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-32 h-32 rounded-full bg-white shadow-inner flex items-center justify-center mb-4">
              <img src={logo || '/placeholder.svg'} alt="Logo" className="w-24 h-24" />
            </div>
            <CardTitle className="text-3xl font-bold text-blue-800">
              Không Có Phiên Bầu Cử
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-4">
              Hiện tại không có phiên bầu cử nào được tìm thấy trên hệ thống của chúng tôi. Vui lòng
              kiểm tra lại sau hoặc liên hệ với quản trị viên để biết thêm thông tin.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
            >
              <Home className="mr-2 h-5 w-5" />
              Quay về trang chủ
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default ThongBaoKhongCoCuocBauCuPage;
