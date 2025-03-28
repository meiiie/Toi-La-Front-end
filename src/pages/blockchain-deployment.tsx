'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Shield,
  AlertCircle,
  ChevronLeft,
  Calendar,
  Info,
  HelpCircle,
  ExternalLink,
  Zap,
  Lock,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';

// Components
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';

// Import the BlockchainDeployment component
import BlockchainDeployment from '../features/ImprovedDeployment';

// Simplified deployment status step
const DeploymentStatusStep = ({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'error';
}) => {
  // Define status styles object for better performance
  const statusStyles = {
    completed: {
      iconClass: 'text-green-500',
      textClass: 'text-green-500',
      icon: <CheckCircle className="w-6 h-6" />,
    },
    current: {
      iconClass: 'text-blue-500 dark:text-[#4F8BFF]',
      textClass: 'text-blue-600 dark:text-[#4F8BFF]',
      icon: <Clock className="w-6 h-6" />,
    },
    pending: {
      iconClass: 'text-gray-400 dark:text-gray-500',
      textClass: 'text-gray-600 dark:text-gray-400',
      icon: <Clock className="w-6 h-6" />,
    },
    error: {
      iconClass: 'text-red-500',
      textClass: 'text-red-500',
      icon: <AlertCircle className="w-6 h-6" />,
    },
  };

  const { iconClass, textClass, icon } = statusStyles[status];

  return (
    <div className="flex items-start space-x-3 mb-3">
      <div className={`flex-shrink-0 mt-1 ${iconClass}`}>{icon}</div>
      <div>
        <h4 className={`text-lg font-medium ${textClass}`}>{title}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
};

const BlockchainDeploymentPage = () => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isDeploymentAllowed, setIsDeploymentAllowed] = useState(true);
  const [deploymentStatusMessage, setDeploymentStatusMessage] = useState<string | null>(null);

  // Redux store
  const { cuocBauCu, dangTai: dangTaiCuocBauCu } = useSelector(
    (state: RootState) => state.cuocBauCuById,
  );

  // Lấy thông tin tài khoản đăng nhập từ Redux store
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);

  // Fetch election data
  useEffect(() => {
    if (cuocBauCuId) {
      dispatch(fetchCuocBauCuById(Number(cuocBauCuId)));
    }
  }, [dispatch, cuocBauCuId]);

  // Kiểm tra điều kiện triển khai
  useEffect(() => {
    if (cuocBauCu) {
      // Kiểm tra trạng thái blockchain
      if (cuocBauCu.trangThaiBlockchain === 2) {
        setIsDeploymentAllowed(false);
        setDeploymentStatusMessage('Cuộc bầu cử này đã được triển khai lên blockchain.');
      } else if (cuocBauCu.trangThaiBlockchain === 1) {
        setIsDeploymentAllowed(false);
        setDeploymentStatusMessage('Cuộc bầu cử đang trong quá trình triển khai lên blockchain.');
      } else {
        // Kiểm tra ngày kết thúc
        const endDate = new Date(cuocBauCu.ngayKetThuc);
        if (endDate < new Date()) {
          setIsDeploymentAllowed(false);
          setDeploymentStatusMessage('Cuộc bầu cử đã kết thúc, không thể triển khai.');
        } else {
          setIsDeploymentAllowed(true);
          setDeploymentStatusMessage(null);
        }
      }
    }
  }, [cuocBauCu]);

  // Handle back button
  const handleGoBack = () => {
    navigate(`/app/user-elections/elections/${cuocBauCuId}/election-management`);
  };

  // Format date using useMemo to avoid recalculations
  const formatDate = useMemo(
    () => (dateString?: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } catch (error) {
        return dateString;
      }
    },
    [],
  );

  // Memoize alert variant for better performance
  const alertVariant = useMemo(() => {
    if (cuocBauCu?.trangThaiBlockchain === 2) return 'default';
    if (cuocBauCu?.trangThaiBlockchain === 1) return 'default';
    return 'destructive';
  }, [cuocBauCu?.trangThaiBlockchain]);

  // Memoize border class for Alert component
  const alertBorderClass = useMemo(() => {
    if (cuocBauCu?.trangThaiBlockchain === 2) return 'border-l-green-500 dark:border-l-green-800';
    if (cuocBauCu?.trangThaiBlockchain === 1) return 'border-l-blue-500 dark:border-l-blue-800';
    return 'border-l-amber-500 dark:border-l-amber-800';
  }, [cuocBauCu?.trangThaiBlockchain]);

  // Loading state
  if (dangTaiCuocBauCu) {
    return (
      <div className="relative min-h-screen p-4">
        <div className="container mx-auto space-y-6 relative z-10">
          <div className="bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] rounded-2xl p-6 shadow-lg animate-pulse h-40"></div>
          <div className="bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] rounded-2xl p-6 shadow-lg animate-pulse h-64"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (!cuocBauCu && !dangTaiCuocBauCu) {
    return (
      <div className="relative min-h-screen p-4">
        <div className="container mx-auto relative z-10">
          <Alert
            variant="destructive"
            className="border border-red-300 dark:border-red-800 shadow-lg"
          >
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-medium">Lỗi</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              Không thể tải thông tin cuộc bầu cử. Vui lòng thử lại sau.
            </AlertDescription>
            <Button variant="destructive" className="mt-4" onClick={handleGoBack}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Quay lại trang quản lý
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 bg-gray-50 dark:bg-gradient-to-b dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321]">
      <div className="container mx-auto max-w-5xl space-y-6 relative z-10">
        {/* Header Section */}
        <div className="px-0">
          <div className="bg-white/80 dark:bg-gradient-to-r dark:from-[#162A45]/50 dark:to-[#263238]/50 border border-gray-200 dark:border-[#2A3A5A] rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <Button
              variant="outline"
              className="absolute top-4 left-4 bg-white/90 dark:bg-[#263238]/50 border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-[#E1F5FE] hover:bg-gray-100 dark:hover:bg-[#1A2942] rounded-lg"
              onClick={handleGoBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>

            <div className="flex flex-col items-center text-center mt-6">
              <div className="p-3 rounded-full bg-blue-50/70 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mb-4">
                <Shield className="h-12 w-12 text-blue-500 dark:text-[#4F8BFF]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] mb-2">
                Triển Khai Blockchain
              </h1>
              <p className="text-gray-600 dark:text-[#B0BEC5] max-w-2xl">
                Triển khai cuộc bầu cử "{cuocBauCu?.tenCuocBauCu}" lên blockchain để đảm bảo tính
                minh bạch, bất biến và an toàn cho quá trình bầu cử.
              </p>

              <div className="flex flex-wrap gap-4 items-center mt-4 justify-center">
                <div className="text-sm text-gray-600 dark:text-[#B0BEC5] flex items-center px-3 py-1.5 rounded-full bg-gray-100/70 dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A]">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                  {formatDate(cuocBauCu?.ngayBatDau)} - {formatDate(cuocBauCu?.ngayKetThuc)}
                </div>
                <div className="text-sm text-gray-600 dark:text-[#B0BEC5] flex items-center px-3 py-1.5 rounded-full bg-gray-100/70 dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A]">
                  <FileText className="h-4 w-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                  ID: {cuocBauCuId}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Status Message */}
        {deploymentStatusMessage && (
          <Alert
            variant={alertVariant}
            className={`border-l-4 shadow-md bg-white dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A] ${alertBorderClass}`}
          >
            <div className="flex items-start">
              {cuocBauCu?.trangThaiBlockchain === 2 ? (
                <Shield className="h-5 w-5 text-green-500 mr-2" />
              ) : cuocBauCu?.trangThaiBlockchain === 1 ? (
                <Info className="h-5 w-5 text-blue-500 dark:text-[#4F8BFF] mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              )}
              <div>
                <AlertTitle className="mb-1 font-medium text-gray-800 dark:text-[#E1F5FE]">
                  {cuocBauCu?.trangThaiBlockchain === 2
                    ? 'Đã triển khai thành công'
                    : cuocBauCu?.trangThaiBlockchain === 1
                      ? 'Đang triển khai'
                      : 'Lưu ý'}
                </AlertTitle>
                <AlertDescription className="text-gray-600 dark:text-[#B0BEC5]">
                  {deploymentStatusMessage}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Blockchain Info Section */}
        <div className="bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] rounded-2xl p-6 shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
              <Zap className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
            </div>
            <h2 className="text-xl font-medium text-gray-800 dark:text-[#E1F5FE]">
              Thông Tin Blockchain
            </h2>
          </div>

          <div className="space-y-4 text-gray-600 dark:text-[#B0BEC5]">
            <p>Triển khai cuộc bầu cử lên blockchain sẽ giúp:</p>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0">
              <li className="flex items-start p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                <CheckCircle className="h-5 w-5 mr-2 text-blue-500 dark:text-[#4F8BFF] flex-shrink-0 mt-0.5" />
                <span>Đảm bảo tính minh bạch và bất biến của dữ liệu bầu cử</span>
              </li>
              <li className="flex items-start p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                <Lock className="h-5 w-5 mr-2 text-blue-500 dark:text-[#4F8BFF] flex-shrink-0 mt-0.5" />
                <span>Tăng cường bảo mật và chống lại các hình thức gian lận</span>
              </li>
              <li className="flex items-start p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                <FileText className="h-5 w-5 mr-2 text-blue-500 dark:text-[#4F8BFF] flex-shrink-0 mt-0.5" />
                <span>Cho phép kiểm tra và xác minh quá trình bầu cử dễ dàng hơn</span>
              </li>
              <li className="flex items-start p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                <Shield className="h-5 w-5 mr-2 text-blue-500 dark:text-[#4F8BFF] flex-shrink-0 mt-0.5" />
                <span>Nâng cao niềm tin của cử tri vào hệ thống bầu cử</span>
              </li>
            </ul>

            <div className="flex flex-col md:flex-row gap-4 mt-6">
              <div className="flex-1 p-4 bg-blue-50 dark:bg-[#1A2942]/50 rounded-lg border border-blue-100 dark:border-[#2A3A5A]">
                <h3 className="font-medium text-blue-700 dark:text-[#4F8BFF] mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Cần chuẩn bị
                </h3>
                <ul className="text-sm space-y-3 text-gray-600 dark:text-[#B0BEC5]">
                  <li className="flex items-start">
                    <span className="text-blue-500 dark:text-[#4F8BFF] mr-2">•</span>
                    <span>Tài khoản và ví Smart Contract đã kích hoạt</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 dark:text-[#4F8BFF] mr-2">•</span>
                    <span>Đủ token HLU để thanh toán phí triển khai (tối thiểu 5 HLU)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 dark:text-[#4F8BFF] mr-2">•</span>
                    <span>Cho phép ủy quyền token HLU (Factory và Paymaster)</span>
                  </li>
                </ul>
              </div>

              <div className="flex-1 p-4 bg-purple-50 dark:bg-[#1A2942]/50 rounded-lg border border-purple-100 dark:border-[#2A3A5A]">
                <h3 className="font-medium text-purple-700 dark:text-[#6A1B9A] mb-3 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Lưu ý quan trọng
                </h3>
                <ul className="text-sm space-y-3 text-gray-600 dark:text-[#B0BEC5]">
                  <li className="flex items-start">
                    <span className="text-purple-500 dark:text-[#6A1B9A] mr-2">•</span>
                    <span>Sau khi triển khai, dữ liệu cuộc bầu cử không thể thay đổi</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 dark:text-[#6A1B9A] mr-2">•</span>
                    <span>Chỉ được triển khai một lần duy nhất cho mỗi cuộc bầu cử</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 dark:text-[#6A1B9A] mr-2">•</span>
                    <span>Quá trình triển khai có thể mất 1-3 phút để hoàn tất</span>
                  </li>
                </ul>
              </div>
            </div>

            <TooltipProvider>
              <div className="flex flex-wrap mt-4 items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-sm text-blue-600 dark:text-[#4F8BFF] cursor-help">
                      <HelpCircle className="h-4 w-4 mr-1" />
                      <span>Blockchain là gì?</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md p-3 bg-white dark:bg-[#1A2942]/90 border border-gray-200 dark:border-[#2A3A5A] text-gray-800 dark:text-[#E1F5FE]">
                    <p>
                      Blockchain là công nghệ lưu trữ dữ liệu phân tán, cho phép lưu trữ thông tin
                      minh bạch, an toàn và không thể thay đổi sau khi đã ghi nhận.
                    </p>
                  </TooltipContent>
                </Tooltip>

                <a
                  href="https://holihu.online/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-[#4F8BFF] dark:hover:text-[#6A1B9A] transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  <span>Tìm hiểu thêm về blockchain</span>
                </a>
              </div>
            </TooltipProvider>
          </div>
        </div>

        {/* Blockchain Deployment Component */}
        <div className="relative">
          {isDeploymentAllowed ? (
            <BlockchainDeployment />
          ) : (
            <div className="bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] rounded-2xl p-8 shadow-lg text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-[#1A2942]/50 border border-amber-100 dark:border-[#2A3A5A] flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-amber-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-[#E1F5FE] mb-2">
                Không thể triển khai
              </h3>
              <p className="text-gray-600 dark:text-[#B0BEC5] max-w-lg mx-auto">
                {deploymentStatusMessage ||
                  'Cuộc bầu cử này không đủ điều kiện để triển khai lên blockchain.'}
              </p>
              <Button
                variant="outline"
                className="mt-6 px-5 py-2.5 bg-white hover:bg-gray-50 dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-[#E1F5FE]"
                onClick={handleGoBack}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Quay lại quản lý cuộc bầu cử
              </Button>
            </div>
          )}
        </div>

        {/* Deployment Guide Roadmap at the bottom */}
        <div className="bg-gray-50 dark:bg-[#162A45]/30 border border-gray-200 dark:border-[#2A3A5A] rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-medium text-gray-800 dark:text-[#E1F5FE] mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
            Quy Trình Triển Khai
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <DeploymentStatusStep
                title="Kiểm Tra Yêu Cầu"
                description="Xác minh rằng tài khoản và ví của bạn đáp ứng tất cả các điều kiện"
                status={isDeploymentAllowed && userInfo ? 'completed' : 'pending'}
              />

              <DeploymentStatusStep
                title="Lấy Khóa Phiên"
                description="Tạo khóa phiên để ký các giao dịch blockchain an toàn"
                status="pending"
              />

              <DeploymentStatusStep
                title="Chuẩn Bị Dữ Liệu"
                description="Chuẩn bị dữ liệu cuộc bầu cử để ghi lên blockchain"
                status="pending"
              />
            </div>

            <div className="space-y-4">
              <DeploymentStatusStep
                title="Gửi Giao Dịch"
                description="Gửi thông tin cuộc bầu cử lên mạng blockchain"
                status="pending"
              />

              <DeploymentStatusStep
                title="Chờ Xác Nhận"
                description="Đợi mạng blockchain xác nhận và lưu trữ thông tin"
                status="pending"
              />

              <DeploymentStatusStep
                title="Hoàn Tất"
                description="Cuộc bầu cử của bạn đã được ghi nhận trên blockchain"
                status="pending"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainDeploymentPage;
