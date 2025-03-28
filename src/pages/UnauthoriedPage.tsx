import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import SEO from '../components/SEO';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <>
      <SEO
        title="Chưa Xác Thực | Nền Tàng Bầu Cử Blockchain"
        description="Rất tiếc, bạn không có quyền truy cập vào trang này. Vui lòng kiểm tra lại quyền hạn của bạn hoặc liên hệ với quản trị viên."
        keywords="403, không có quyền truy cập, lỗi truy cập, bảo mật"
        author="BauCuBlockchain"
        url={window.location.href}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-blue-800 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center mx-auto"
            >
              <AlertTriangle className="w-10 h-10 text-yellow-900" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Không Có Quyền Truy Cập !
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg mb-6 text-gray-700 dark:text-gray-300"
            >
              Rất tiếc, bạn không có quyền truy cập vào trang này. Vui lòng kiểm tra lại quyền hạn
              của bạn hoặc liên hệ với quản trị viên.
            </motion.p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button onClick={handleGoBack} variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleGoHome}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default UnauthorizedPage;
