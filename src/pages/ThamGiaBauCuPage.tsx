'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  FileText,
  Vote,
  User,
  Shield,
  Info,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  Lock,
  Loader2,
  Check,
  CheckCircle,
  Star,
  Sparkles,
  Zap,
  Hexagon,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';

// Components
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { Checkbox } from '../components/ui/Checkbox';
import { Label } from '../components/ui/Label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import ParticleBackground from '../components/backgrounds/ParticleBackground';
import DieuLeLoader from '../components/DieuLeLoader';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';

// Định nghĩa các bước tham gia bầu cử
type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const steps: Step[] = [
  {
    id: 'welcome',
    title: 'Chào mừng',
    description: 'Giới thiệu về cuộc bầu cử',
    icon: <User className="h-5 w-5" />,
  },
  {
    id: 'rules',
    title: 'Điều lệ',
    description: 'Đọc và xác nhận điều lệ',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'verification',
    title: 'Xác thực',
    description: 'Xác thực danh tính',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: 'voting',
    title: 'Bỏ phiếu',
    description: 'Chọn ứng viên',
    icon: <Vote className="h-5 w-5" />,
  },
  {
    id: 'confirmation',
    title: 'Xác nhận',
    description: 'Xác nhận lựa chọn',
    icon: <CheckCircle className="h-5 w-5" />,
  },
];

const ThamGiaBauCu: React.FC = () => {
  const { id: cuocBauCuId, phienId } = useParams<{ id: string; phienId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const rulesContentRef = useRef<HTMLDivElement>(null);

  // State
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [acceptedRules, setAcceptedRules] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hasRules, setHasRules] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Redux state
  const { cuocBauCu, dangTai: dangTaiCuocBauCu } = useSelector(
    (state: RootState) => state.cuocBauCuById,
  );
  const {
    dieuLeCuocBauCu,
    dangTai: dangTaiDieuLe,
    daXacNhan,
  } = useSelector((state: RootState) => state.dieuLe);
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  // Kiểm tra dark mode
  useEffect(() => {
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Lắng nghe sự thay đổi dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Fetch dữ liệu cuộc bầu cử
  useEffect(() => {
    if (cuocBauCuId) {
      dispatch(fetchCuocBauCuById(Number(cuocBauCuId)));
    }
  }, [dispatch, cuocBauCuId]);

  // Cập nhật trạng thái xác nhận điều lệ
  useEffect(() => {
    if (daXacNhan !== null) {
      setAcceptedRules(daXacNhan);
    }
  }, [daXacNhan]);

  // Xử lý khi điều lệ được tải
  const handleRulesLoaded = (hasRules: boolean) => {
    setHasRules(hasRules);
  };

  // Mảng ứng viên mẫu
  const mockCandidates = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      position: 'Chủ tịch',
      bio: 'Kinh nghiệm 5 năm trong lĩnh vực quản lý',
    },
    {
      id: '2',
      name: 'Trần Thị B',
      position: 'Phó Chủ tịch',
      bio: 'Chuyên gia về tài chính và kế toán',
    },
    { id: '3', name: 'Lê Văn C', position: 'Ủy viên', bio: 'Có nhiều đóng góp cho cộng đồng' },
    { id: '4', name: 'Phạm Thị D', position: 'Ủy viên', bio: 'Chuyên gia về công nghệ thông tin' },
    {
      id: '5',
      name: 'Hoàng Văn E',
      position: 'Ủy viên',
      bio: 'Có kinh nghiệm trong lĩnh vực giáo dục',
    },
  ];

  // Tính toán chỉ số bước hiện tại
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Xử lý chuyển bước
  const handleNext = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
      // Cuộn lên đầu trang khi chuyển bước
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
      // Cuộn lên đầu trang khi chuyển bước
      window.scrollTo(0, 0);
    }
  };

  // Xử lý chọn ứng viên
  const handleSelectCandidate = (candidateId: string) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId));
    } else {
      // Giả sử chỉ được chọn tối đa 3 ứng viên
      if (selectedCandidates.length < 3) {
        setSelectedCandidates([...selectedCandidates, candidateId]);
      }
    }
  };

  // Xử lý xác nhận điều lệ
  const handleAcceptRules = async () => {
    if (user?.id && dieuLeCuocBauCu?.id && acceptedRules && dieuLeCuocBauCu.yeuCauXacNhan) {
      try {
        // Thay vì gọi API xác nhận, chỉ cần chuyển bước
        // Chúng ta sẽ bỏ qua việc ghi nhận xác nhận vào database cho đến khi bảng được tạo
        // await dispatch(xacNhanDaDoc({ dieuLeId: dieuLeCuocBauCu.id, taiKhoanId: user.id })).unwrap()

        // Chỉ chuyển bước
        handleNext();
      } catch (error) {
        console.error('Lỗi khi xác nhận điều lệ:', error);
      }
    } else {
      handleNext();
    }
  };

  // Xử lý gửi phiếu bầu
  const handleSubmitVote = async () => {
    setIsSubmitting(true);

    // Giả lập gửi phiếu bầu
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Chuyển đến bước xác nhận
    setCurrentStep('confirmation');
    setIsSubmitting(false);
  };

  // Render nội dung theo bước
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Chào mừng bạn tham gia cuộc bầu cử
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {cuocBauCu?.tenCuocBauCu || 'Đang tải thông tin cuộc bầu cử...'}
              </p>
            </div>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                  <Hexagon className="h-5 w-5 text-blue-500 mr-2" />
                  Thông tin cuộc bầu cử
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dangTaiCuocBauCu ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : cuocBauCu ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/70 dark:bg-gray-900/50 rounded-lg p-4 backdrop-blur-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                          <FileText className="h-4 w-4 text-blue-500 mr-1" />
                          Tên cuộc bầu cử
                        </h3>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {cuocBauCu.tenCuocBauCu}
                        </p>
                      </div>
                      <div className="bg-gray-50/70 dark:bg-gray-900/50 rounded-lg p-4 backdrop-blur-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                          <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                          Thời gian
                        </h3>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {new Date(cuocBauCu.ngayBatDau).toLocaleDateString('vi-VN')} -
                          {new Date(cuocBauCu.ngayKetThuc).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50/70 dark:bg-gray-900/50 rounded-lg p-4 backdrop-blur-sm">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                        <Info className="h-4 w-4 text-blue-500 mr-1" />
                        Mô tả
                      </h3>
                      <p className="text-gray-900 dark:text-white">{cuocBauCu.moTa}</p>
                    </div>

                    <Alert className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">
                        Lưu ý quan trọng
                      </AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-400">
                        Vui lòng đọc kỹ điều lệ bầu cử trước khi tham gia. Mỗi cử tri chỉ được bỏ
                        phiếu một lần.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                      Không thể tải thông tin cuộc bầu cử. Vui lòng thử lại sau.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleNext}
                disabled={dangTaiCuocBauCu || !cuocBauCu}
              >
                Tiếp tục
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'rules':
        return (
          <DieuLeLoader onLoaded={handleRulesLoaded}>
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                  Điều lệ bầu cử
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Vui lòng đọc kỹ và xác nhận điều lệ bầu cử
                </p>
              </div>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <CardContent className="p-6">
                  {hasRules === false ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Chưa có điều lệ cho cuộc bầu cử này
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Ban tổ chức chưa công bố điều lệ cho cuộc bầu cử này. Bạn có thể tiếp tục
                        tham gia mà không cần xác nhận điều lệ.
                      </p>
                    </div>
                  ) : dieuLeCuocBauCu ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Hexagon className="h-5 w-5 text-blue-500 mr-2" />
                        {dieuLeCuocBauCu.tieuDe}
                      </h3>

                      <div className="relative">
                        <div
                          ref={rulesContentRef}
                          className="max-h-[50vh] overflow-y-auto p-4 bg-gray-50/70 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700"
                        >
                          <div
                            className="prose prose-blue dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: dieuLeCuocBauCu.noiDung }}
                          />
                        </div>
                      </div>

                      {dieuLeCuocBauCu.yeuCauXacNhan && (
                        <div className="flex items-start space-x-2 pt-4">
                          <Checkbox
                            id="accept-rules"
                            checked={acceptedRules}
                            onCheckedChange={(checked) => setAcceptedRules(checked as boolean)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              htmlFor="accept-rules"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 dark:text-white"
                            >
                              Tôi đã đọc và đồng ý với điều lệ bầu cử
                            </Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Bạn phải đồng ý với điều lệ để tiếp tục tham gia bầu cử
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Không thể tải điều lệ bầu cử
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Có lỗi xảy ra khi tải điều lệ bầu cử. Vui lòng thử lại sau.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button
                  variant="outline"
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>

                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={handleAcceptRules}
                  disabled={dieuLeCuocBauCu?.yeuCauXacNhan && !acceptedRules && hasRules !== false}
                >
                  Tiếp tục
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </DieuLeLoader>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Xác thực danh tính
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Xác thực danh tính của bạn để đảm bảo tính minh bạch của cuộc bầu cử
              </p>
            </div>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50/70 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <div className="text-center max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                      <Hexagon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Xác thực bằng blockchain
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Danh tính của bạn sẽ được xác thực thông qua công nghệ blockchain để đảm bảo
                      tính bảo mật và minh bạch.
                    </p>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                      onClick={() => setIsVerified(true)}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Xác thực ngay
                    </Button>
                  </div>
                </div>

                {isVerified && (
                  <Alert className="bg-green-50/70 dark:bg-green-900/20 border border-green-100/50 dark:border-green-800/30 backdrop-blur-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">
                      Xác thực thành công
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Danh tính của bạn đã được xác thực thành công. Bạn có thể tiếp tục tham gia
                      bầu cử.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                onClick={handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>

              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleNext}
                disabled={!isVerified}
              >
                Tiếp tục
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'voting':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <Vote className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Bỏ phiếu bầu
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Chọn tối đa 3 ứng viên mà bạn muốn bầu
              </p>
            </div>

            <Alert className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                Hướng dẫn bỏ phiếu
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                Chọn tối đa 3 ứng viên bằng cách nhấp vào ô bên cạnh tên ứng viên. Bạn có thể xem
                thông tin chi tiết về ứng viên bằng cách nhấp vào nút "Xem chi tiết".
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-4">
              {mockCandidates.map((candidate) => (
                <Card
                  key={candidate.id}
                  className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border ${
                    selectedCandidates.includes(candidate.id)
                      ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
                      : 'border-gray-200/50 dark:border-gray-700/50'
                  } rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Checkbox
                            id={`candidate-${candidate.id}`}
                            checked={selectedCandidates.includes(candidate.id)}
                            onCheckedChange={() => handleSelectCandidate(candidate.id)}
                            disabled={
                              selectedCandidates.length >= 3 &&
                              !selectedCandidates.includes(candidate.id)
                            }
                            className="h-5 w-5 border-2 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                          {selectedCandidates.includes(candidate.id) && (
                            <div className="absolute -top-1 -right-1 -bottom-1 -left-1 rounded-md border border-blue-500 animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {candidate.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {candidate.position}
                          </p>
                        </div>
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                            <p>Xem chi tiết</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="mt-2 pl-8">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{candidate.bio}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                onClick={handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>

              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleSubmitVote}
                disabled={selectedCandidates.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Gửi phiếu bầu
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">
                Bỏ phiếu thành công
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Cảm ơn bạn đã tham gia cuộc bầu cử
              </p>
            </div>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <Hexagon className="h-5 w-5 text-green-500 mr-2" />
                    Thông tin phiếu bầu
                  </h3>

                  <div className="bg-gray-50/70 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 backdrop-blur-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Mã phiếu bầu:</span>
                        <span className="text-gray-900 dark:text-white font-mono">
                          BLK-{Math.random().toString(36).substring(2, 10).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Thời gian:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date().toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Trạng thái:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                          <Check className="mr-1 h-3 w-3" />
                          Đã xác nhận
                        </Badge>
                      </div>
                      <Separator className="my-2 bg-gray-200 dark:bg-gray-700" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ứng viên đã chọn:
                        </h4>
                        <ul className="space-y-1">
                          {selectedCandidates.map((id) => {
                            const candidate = mockCandidates.find((c) => c.id === id);
                            return (
                              <li
                                key={id}
                                className="flex items-center text-gray-900 dark:text-white"
                              >
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                {candidate?.name} - {candidate?.position}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
                    <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-300">
                      Bảo mật và minh bạch
                    </AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                      Phiếu bầu của bạn đã được mã hóa và lưu trữ an toàn trên blockchain. Bạn có
                      thể kiểm tra tính xác thực của phiếu bầu bằng mã phiếu bầu ở trên.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate(`/app/user-elections/elections/${cuocBauCuId}`)}
              >
                <Star className="mr-2 h-4 w-4" />
                Quay lại trang chủ
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      {/* Particle Background */}
      <ParticleBackground isDarkMode={isDarkMode} />

      <div className="container mx-auto p-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Vote className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Hệ thống bầu cử blockchain
            </h1>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                <p>Trợ giúp</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Bước {currentStepIndex + 1} / {steps.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {progress.toFixed(0)}% hoàn thành
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          {/* Step Navigation */}
          <div className="hidden md:block">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg sticky top-4">
              <CardContent className="p-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Hexagon className="h-5 w-5 text-blue-500 mr-2" />
                  Các bước tham gia
                </h2>
                <div className="space-y-1">
                  {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = index < currentStepIndex;

                    return (
                      <div
                        key={step.id}
                        className={`flex items-center p-2 rounded-lg ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : isCompleted
                              ? 'text-gray-700 dark:text-gray-300'
                              : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                              : isCompleted
                                ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle className="h-4 w-4" /> : step.icon}
                        </div>
                        <div>
                          <div className="font-medium">{step.title}</div>
                          <div className="text-xs">{step.description}</div>
                        </div>
                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step Content */}
          <div>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThamGiaBauCu;
