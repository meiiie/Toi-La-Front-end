import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import logo from '../logo.svg';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { ThumbsUp, Home } from 'lucide-react';

const CamOnPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <>
      {/* <Helmet>
        <title>Cảm Ơn | Nền Tảng Bầu Cử Blockchain</title>
        <meta
          name="description"
          content="Cảm ơn bạn đã tham gia vào nền tảng bầu cử blockchain của chúng tôi. Chúng tôi hy vọng sẽ gặp lại bạn sớm."
        />
        <meta name="keywords" content="cảm ơn, bầu cử, blockchain, tham gia" />
        <meta property="og:title" content="Cảm Ơn | Nền Tảng Bầu Cử Blockchain" />
        <meta
          property="og:description"
          content="Cảm ơn bạn đã tham gia vào nền tảng bầu cử blockchain của chúng tôi."
        />
        <meta property="og:image" content={`${window.location.origin}${logo}`} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet> */}
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-32 h-32 rounded-full bg-white shadow-inner flex items-center justify-center mb-4">
              <img src={logo || '/placeholder.svg'} alt="Logo" className="w-24 h-24" />
            </div>
            <CardTitle className="text-3xl font-bold text-blue-800">Cảm Ơn Bạn Đã Đến!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              Chúng tôi đánh giá cao sự tham gia của bạn trong quá trình bầu cử. Sự đóng góp của bạn
              giúp xây dựng một tương lai dân chủ hơn.
            </p>
            <ThumbsUp className="w-16 h-16 text-blue-500 mx-auto mb-4" />
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

export default CamOnPage;
