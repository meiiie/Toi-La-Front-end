'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import {
  Calendar,
  Users,
  ChevronRight,
  Edit,
  UserPlus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  Zap,
  Database,
  Award,
  ArrowRight,
  Info,
  Play,
  Eye,
  ArrowLeft,
  HelpCircle,
  Frame,
  Ticket,
} from 'lucide-react';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import {
  fetchViTriUngCuStatisticsByPhienBauCuId,
  selectPositionStats,
} from '../store/slice/viTriUngCuSlice';

// Components
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Skeleton } from '../components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { useToast } from '../test/components/use-toast';
import apiClient from '../api/apiClient';

// Lazy load content components
const ChinhSuaPhienBauCuPage = React.lazy(() => import('./ChinhSuaPhienBauCuPage'));
const QuanLyViTriUngCu = React.lazy(() => import('./QuanLyViTriUngCuPage'));
const QuanLyUngVien = React.lazy(() => import('./QuanLyUngVienPage'));
const QuanLyCuTri = React.lazy(() => import('./QuanLyCuTriPage'));

// Import BlockchainDeployment component from the correct path
const BlockchainDeployment = React.lazy(
  () => import('../features/blockchain/BlockchainDeployment'),
);

// Import VoterManager component for ballot management
const VoterManager = React.lazy(
  () => import('../components/election-session-manager/VoterManager'),
);

interface QuanLyPhienBauCuProps {
  phienBauCuId: string;
  darkMode?: boolean;
}

const QuanLyPhienBauCuPage: React.FC<QuanLyPhienBauCuProps> = ({
  phienBauCuId: propPhienBauCuId,
  darkMode = true,
}) => {
  const { idPhien = propPhienBauCuId } = useParams<{ idPhien: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  // Lấy thông tin ví từ Redux store
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);
  const [scwAddress, setScwAddress] = useState<string>('');

  // Parse Vietnamese date format (dd/mm/yyyy hh:mm)
  const parseVietnameseDate = (dateStr: string) => {
    if (!dateStr) return new Date();

    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    return new Date(+year, +month - 1, +day, +hour, +minute);
  };

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showGuide, setShowGuide] = useState(false);
  const [sessionKey, setSessionKey] = useState<any>(null);
  const [blockchainSessionId, setBlockchainSessionId] = useState<number | null>(null);

  // Redux store
  const phienBauCu = useSelector(
    (state: RootState) =>
      state.phienBauCu.cacPhienBauCu.find((p) => p.id === Number(idPhien)) ||
      state.phienBauCu.cacPhienBauCu[0],
  );
  const { cuocBauCu } = useSelector((state: RootState) => state.cuocBauCuById);
  const { thongKeCacViTri, dangTaiThongKe } = useSelector((state: RootState) => state.viTriUngCu);
  const positionStats = useSelector((state: RootState) => selectPositionStats(state));

  // Debug log - Thêm thông tin về địa chỉ blockchain
  useEffect(() => {
    console.log('[DEBUG] QuanLyPhienBauCuPage - Mounting with phien/cuoc bau cu:', {
      phienBauCuId: idPhien,
      phienBauCuAddress: phienBauCu?.blockchainAddress,
      cuocBauCuAddress: cuocBauCu?.blockchainAddress,
    });
  }, [idPhien, phienBauCu, cuocBauCu]);

  // Thêm useEffect để cập nhật scwAddress khi walletInfo thay đổi
  useEffect(() => {
    if (walletInfo && walletInfo.diaChiVi) {
      console.log('[DEBUG] Setting SCW address from walletInfo:', walletInfo.diaChiVi);
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Fetch phien bau cu data
  const fetchPhienBauCuData = useCallback(async () => {
    if (idPhien) {
      setLoading(true);
      try {
        console.log('[DEBUG] Fetching phien bau cu data for ID:', idPhien);
        await dispatch(fetchPhienBauCuById(Number(idPhien)));

        // Lấy phienBauCu từ kết quả của dispatch thay vì từ state
        const fetchedPhienBauCu = await dispatch(fetchPhienBauCuById(Number(idPhien))).unwrap();

        // Sau khi lấy thông tin phiên, thử xem có ID phiên trên blockchain không
        if (fetchedPhienBauCu?.blockchainAddress) {
          try {
            const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

            // Thay đổi 2: Sửa cách lấy phiên bầu cử mới nhất theo contract thực tế
            const quanLyCuocBauCuAbi = [
              'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
            ];

            const quanLyCuocBauCu = new ethers.Contract(
              fetchedPhienBauCu.blockchainAddress,
              quanLyCuocBauCuAbi,
              provider,
            );

            // Thay vì gọi layPhienBauCuMoiNhat, sử dụng layDanhSachPhienBauCu và lấy phần tử cuối cùng
            try {
              const phienBauCuList = await quanLyCuocBauCu.layDanhSachPhienBauCu(1, 0, 10);
              if (phienBauCuList && phienBauCuList.length > 0) {
                const latestId = phienBauCuList[phienBauCuList.length - 1];
                console.log('[DEBUG] Found blockchain session ID:', Number(latestId));
                setBlockchainSessionId(Number(latestId));
              }
            } catch (listError) {
              console.warn('[DEBUG] Error fetching phien bau cu list:', listError);
            }
          } catch (error) {
            console.warn('[DEBUG] Error connecting to blockchain:', error);
          }
        }
      } catch (error) {
        console.error('[DEBUG] Error fetching phien bau cu data:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải thông tin phiên bầu cử. Vui lòng thử lại sau.',
        });
      } finally {
        setLoading(false);
      }
    }
  }, [dispatch, idPhien, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchPhienBauCuData();
  }, [fetchPhienBauCuData]);

  // Fetch cuoc bau cu data when phien bau cu is loaded
  useEffect(() => {
    if (phienBauCu && phienBauCu.cuocBauCuId) {
      console.log('[DEBUG] Fetching cuoc bau cu data for ID:', phienBauCu.cuocBauCuId);
      dispatch(fetchCuocBauCuById(phienBauCu.cuocBauCuId));
    }
  }, [dispatch, phienBauCu]);

  // Fetch vi tri ung cu statistics
  useEffect(() => {
    if (idPhien) {
      dispatch(fetchViTriUngCuStatisticsByPhienBauCuId(Number(idPhien)));
    }
  }, [dispatch, idPhien]);

  // Navigate back
  const handleGoBack = useCallback(() => {
    if (cuocBauCu) {
      navigate(`/app/user-elections/elections/${cuocBauCu.id}/election-management`);
    } else {
      navigate(-1);
    }
  }, [cuocBauCu, navigate]);

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Calculate time info
  interface TimeInfo {
    days: number;
    hours: number;
    minutes: number;
    isActive: boolean;
    isUpcoming: boolean;
    isCompleted: boolean;
    percentComplete: number;
    remainingTime: number;
  }

  const getTimeInfo = () => {
    if (!phienBauCu) return null;

    const now = new Date();
    const startDate = parseVietnameseDate(phienBauCu.ngayBatDau);
    const endDate = parseVietnameseDate(phienBauCu.ngayKetThuc);

    const timeRemaining: TimeInfo = {
      days: 0,
      hours: 0,
      minutes: 0,
      isActive: false,
      isUpcoming: false,
      isCompleted: false,
      percentComplete: 0,
      remainingTime: 0,
    };

    if (now < startDate) {
      // Upcoming
      const diff = startDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeRemaining.days = days;
      timeRemaining.hours = hours;
      timeRemaining.minutes = minutes;
      timeRemaining.isUpcoming = true;
      timeRemaining.remainingTime = diff;
    } else if (now > endDate) {
      // Completed
      timeRemaining.isCompleted = true;
      timeRemaining.percentComplete = 100;
      timeRemaining.remainingTime = 0;
    } else {
      // Active
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const percentComplete = Math.min(100, Math.round((elapsed / totalDuration) * 100));

      const diff = endDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeRemaining.days = days;
      timeRemaining.hours = hours;
      timeRemaining.minutes = minutes;
      timeRemaining.isActive = true;
      timeRemaining.percentComplete = percentComplete;
      timeRemaining.remainingTime = diff;
    }

    return timeRemaining;
  };

  // Get user info from Redux store at component level
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  // Lấy khóa phiên
  const getSessionKey = useCallback(async () => {
    try {
      // Validate if user info and wallet info are available
      if (!userInfo?.id || !walletInfo?.viId) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể lấy thông tin tài khoản hoặc ví',
        });
        return null;
      }

      // Call API to get session key
      console.log('[DEBUG] Getting session key for user:', userInfo.id, 'wallet:', walletInfo.viId);
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: userInfo.id,
        ViID: walletInfo.viId,
      });

      if (response.data && response.data.success && response.data.sessionKey) {
        // Save session key and related info
        const sessionKeyInfo = {
          sessionKey: response.data.sessionKey,
          expiresAt: response.data.expiresAt,
          scwAddress: response.data.scwAddress || scwAddress,
        };

        setSessionKey(sessionKeyInfo);
        toast({
          title: 'Đã lấy khóa phiên',
          description: 'Khóa phiên đã được tạo thành công',
        });

        return sessionKeyInfo;
      } else {
        throw new Error(response.data?.message || 'Không thể lấy session key');
      }
    } catch (error) {
      console.error('[DEBUG] Lỗi khi lấy khóa phiên:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Lỗi khi lấy khóa phiên: ' + (error as Error).message,
      });
      return null;
    }
  }, [walletInfo, scwAddress, toast]);

  // Điều hướng đến trang chỉnh sửa
  const navigateToEditPage = useCallback(() => {
    if (cuocBauCu && idPhien) {
      navigate(`/app/user-elections/elections/${cuocBauCu.id}/session/${idPhien}/edit`);
    }
  }, [cuocBauCu, idPhien, navigate]);

  // Điều hướng đến các tab nội dung
  const navigateToTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Điều hướng đến trang blockchain
  const navigateToBlockchain = useCallback(() => {
    if (cuocBauCu && idPhien) {
      navigate(`/app/user-elections/elections/${cuocBauCu.id}/session/${idPhien}/deploy`);
    }
  }, [cuocBauCu, idPhien, navigate]);

  // Get status badge color based on election status
  const getStatusBadgeClass = () => {
    if (!phienBauCu) return '';

    switch (phienBauCu.trangThai) {
      case 'Đang diễn ra':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Sắp diễn ra':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Đã kết thúc':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Get status icon based on election status
  const getStatusIcon = () => {
    if (!phienBauCu) return null;

    switch (phienBauCu.trangThai) {
      case 'Đang diễn ra':
        return <Zap className="h-4 w-4 mr-1" />;
      case 'Sắp diễn ra':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'Đã kết thúc':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Loading placeholder
  const LoadingContent = () => (
    <div className="flex items-center justify-center py-12">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="h-12 w-12 border-4 border-t-blue-600 border-blue-200 dark:border-t-blue-400 dark:border-blue-900/30 rounded-full mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        />
        <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
      </motion.div>
    </div>
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
        <div className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] rounded-xl shadow-md p-4 md:p-6">
          <Skeleton className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800/50 mb-4" />
          <Skeleton className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800/50 mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-800/50 rounded-xl" />
            <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-800/50 rounded-xl" />
            <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-800/50 rounded-xl" />
          </div>

          <Skeleton className="h-64 w-full bg-gray-200 dark:bg-gray-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state if no phien bau cu data
  if (!phienBauCu && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
        <Card className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-red-900/30 rounded-xl shadow-md overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4">
            <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Không tìm thấy phiên bầu cử
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Không thể tải thông tin phiên bầu cử. Vui lòng thử lại sau.
              </p>
              <Button
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 text-white hover:shadow-md"
                onClick={handleGoBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get time info for the current phien bau cu
  const timeInfo = getTimeInfo();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Frame className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate max-w-[250px] sm:max-w-none">
              {phienBauCu?.tenPhienBauCu}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge className={getStatusBadgeClass()}>
                {getStatusIcon()}
                {phienBauCu?.trangThai}
              </Badge>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                <span className="hidden xs:inline">{phienBauCu?.ngayBatDau} - </span>
                <span>{phienBauCu?.ngayKetThuc}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-white"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Quay lại</span>
          </Button>
          <Button
            variant="outline"
            className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-white"
            onClick={() => setShowGuide(true)}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </Button>
        </div>
      </header>

      {/* Time progress indicator */}
      {timeInfo?.isActive && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Đang diễn ra</span>
            <span>{timeInfo.percentComplete}% hoàn thành</span>
          </div>
          <Progress value={timeInfo.percentComplete} className="h-2" />
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-right">
            Còn lại: {timeInfo.days} ngày, {timeInfo.hours} giờ, {timeInfo.minutes} phút
          </div>
        </div>
      )}

      {timeInfo?.isUpcoming && (
        <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg p-3 mb-6">
          <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Phiên bầu cử sắp diễn ra</p>
            <p className="text-sm">
              Còn {timeInfo.days} ngày, {timeInfo.hours} giờ, {timeInfo.minutes} phút
            </p>
          </div>
        </div>
      )}

      {timeInfo?.isCompleted && (
        <div className="flex items-center bg-gray-50 dark:bg-gray-800/40 text-gray-800 dark:text-gray-300 rounded-lg p-3 mb-6">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Phiên bầu cử đã kết thúc</p>
            <p className="text-sm">Xem kết quả để biết thêm chi tiết</p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden md:inline">Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden md:inline">Vị trí ứng cử</span>
          </TabsTrigger>
          <TabsTrigger value="voters" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Cử tri</span>
          </TabsTrigger>
          <TabsTrigger value="candidates" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden md:inline">Ứng viên</span>
          </TabsTrigger>
          <TabsTrigger value="ballot-management" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="hidden md:inline">Phiếu Bầu</span>
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden md:inline">Blockchain</span>
          </TabsTrigger>
        </TabsList>

        <div className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] rounded-xl shadow-md p-4 md:p-6">
          <TabsContent value="overview">
            <ElectionOverview
              phienBauCu={phienBauCu}
              timeInfo={timeInfo}
              navigateToTab={navigateToTab}
              navigateToEditPage={navigateToEditPage}
              navigateToBlockchain={navigateToBlockchain}
              positionStats={positionStats}
              thongKeCacViTri={thongKeCacViTri}
              dangTaiThongKe={dangTaiThongKe}
            />
          </TabsContent>

          <TabsContent value="positions">
            <React.Suspense fallback={<LoadingContent />}>
              <QuanLyViTriUngCu phienBauCuId={idPhien || ''} />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="voters">
            <React.Suspense fallback={<LoadingContent />}>
              <QuanLyCuTri phienBauCuId={idPhien || ''} darkMode={darkMode} />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="candidates">
            <React.Suspense fallback={<LoadingContent />}>
              <QuanLyUngVien phienBauCuId={idPhien || ''} darkMode={darkMode} />
            </React.Suspense>
          </TabsContent>

          {/* Tab Phiếu Bầu - VoterManager */}
          <TabsContent value="ballot-management">
            <React.Suspense fallback={<LoadingContent />}>
              <VoterManager
                selectedSession={phienBauCu}
                sessionStatus={{
                  isActive: timeInfo?.isActive || false,
                  startTime: Date.now(),
                  endTime: Date.now() + (timeInfo?.remainingTime || 0),
                }}
                electionStatus={{
                  isOwner: true, // Giả sử người dùng hiện tại là chủ sở hữu
                  isActive: timeInfo?.isActive || false,
                  hasBanToChucRole: true, // Giả sử người dùng có vai trò tổ chức
                }}
                sessionKey={sessionKey}
                setSessionKey={setSessionKey}
                scwAddress={scwAddress || ''}
                votersList={[]}
                isLoadingVoters={false}
                refreshData={fetchPhienBauCuData}
                getSessionKey={getSessionKey}
                // Cung cấp địa chỉ blockchain - ưu tiên từ phiên, rồi đến cuộc bầu cử
                quanLyCuocBauCuAddress={
                  phienBauCu?.blockchainAddress || cuocBauCu?.blockchainAddress
                }
                blockchainSessionId={blockchainSessionId}
              />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="blockchain">
            <React.Suspense fallback={<LoadingContent />}>
              <BlockchainDeployment
                phienBauCu={phienBauCu}
                onNavigateToBlockchain={navigateToBlockchain}
              />
            </React.Suspense>
          </TabsContent>
        </div>
      </Tabs>

      {/* Help Guide Dialog */}
      {showGuide && (
        <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <HelpCircle className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Hướng dẫn quản lý phiên bầu cử
              </DialogTitle>
              <DialogDescription>
                Tìm hiểu các bước cần thực hiện để thiết lập phiên bầu cử blockchain
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <h3 className="text-lg font-medium">Các bước thiết lập phiên bầu cử</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Thiết lập thông tin cơ bản</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nhập tên, mô tả, và thời gian diễn ra phiên bầu cử
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Tạo các vị trí ứng cử</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thiết lập các vị trí cần bầu chọn trong phiên bầu cử
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Quản lý cử tri</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thêm và xác thực cử tri để tham gia bỏ phiếu
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Đăng ký ứng viên</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Chọn cử tri đã xác thực để đăng ký làm ứng viên
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium">Quản lý phiếu bầu</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cấu hình và cấp phiếu bầu cho cử tri đã xác thực
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    6
                  </div>
                  <div>
                    <h4 className="font-medium">Triển khai blockchain</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Triển khai phiên bầu cử lên blockchain để đảm bảo tính minh bạch và bảo mật
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-2">Lưu ý quan trọng</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>
                    Sau khi triển khai lên blockchain, dữ liệu phiên bầu cử không thể thay đổi
                  </li>
                  <li>Mỗi ứng viên phải là một cử tri đã xác thực trong hệ thống</li>
                  <li>Quá trình triển khai lên blockchain sẽ phát sinh chi phí gas</li>
                  <li>Phiếu bầu cần được cấu hình trước khi cấp cho cử tri</li>
                  <li>Cử tri cần được xác thực trước khi có thể nhận phiếu bầu</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 text-white"
                onClick={() => setShowGuide(false)}
              >
                Đã hiểu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Election Overview Component (giữ nguyên code)
interface ElectionOverviewProps {
  phienBauCu: any;
  timeInfo: any;
  navigateToTab: (tab: string) => void;
  navigateToEditPage: () => void;
  navigateToBlockchain: () => void;
  positionStats: {
    totalPositions: number;
    totalCandidates: number;
    totalMaxVotes: number;
    overallPercentage: number;
  };
  thongKeCacViTri: any[];
  dangTaiThongKe: boolean;
}

const ElectionOverview: React.FC<ElectionOverviewProps> = ({
  phienBauCu,
  timeInfo,
  navigateToTab,
  navigateToEditPage,
  navigateToBlockchain,
  positionStats,
  thongKeCacViTri,
  dangTaiThongKe,
}) => {
  if (!phienBauCu) return null;

  return (
    <div className="space-y-6">
      {/* Grid content của ElectionOverview giữ nguyên */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Session info card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Thông tin phiên
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tên phiên bầu cử
              </h3>
              <p className="text-base font-medium text-gray-900 dark:text-white break-words">
                {phienBauCu.tenPhienBauCu}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mô tả</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                {phienBauCu.moTa || 'Chưa có mô tả'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian</h3>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white break-words">
                    {phienBauCu.ngayBatDau} - {phienBauCu.ngayKetThuc}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 text-white"
              onClick={navigateToEditPage}
            >
              <Edit className="mr-1.5 h-4 w-4" />
              Chỉnh sửa thông tin
            </Button>
          </CardContent>
        </Card>

        {/* Getting started guidance */}
        <Card className="col-span-1 md:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-700 dark:text-purple-400 flex items-center">
              <Play className="mr-2 h-5 w-5" />
              Hướng dẫn nhanh
            </CardTitle>
            <CardDescription>
              Các bước cần thực hiện để hoàn tất thiết lập phiên bầu cử
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Thiết lập thông tin cơ bản
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nhập tên, mô tả, và thời gian diễn ra phiên bầu cử
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-xs bg-white hover:bg-gray-100 dark:bg-[#1A2942]/50 dark:hover:bg-[#243656] border-gray-200 dark:border-[#2A3A5A] text-gray-800 dark:text-white"
                      onClick={navigateToEditPage}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Bước 1
                    </Button>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Tạo các vị trí ứng cử
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thiết lập các vị trí cần bầu chọn trong phiên bầu cử
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-xs bg-white hover:bg-gray-100 dark:bg-[#1A2942]/50 dark:hover:bg-[#243656] border-gray-200 dark:border-[#2A3A5A] text-gray-800 dark:text-white"
                      onClick={() => navigateToTab('positions')}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Bước 2
                    </Button>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Thêm ứng viên</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thêm thông tin các ứng viên tham gia ứng cử
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-xs bg-white hover:bg-gray-100 dark:bg-[#1A2942]/50 dark:hover:bg-[#243656] border-gray-200 dark:border-[#2A3A5A] text-gray-800 dark:text-white"
                      onClick={() => navigateToTab('candidates')}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Bước 3
                    </Button>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Quản lý cử tri</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thêm cử tri và phân quyền tham gia bỏ phiếu
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-xs bg-white hover:bg-gray-100 dark:bg-[#1A2942]/50 dark:hover:bg-[#243656] border-gray-200 dark:border-[#2A3A5A] text-gray-800 dark:text-white"
                      onClick={() => navigateToTab('voters')}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Bước 4
                    </Button>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Quản lý phiếu bầu</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cấu hình và cấp phiếu bầu cho cử tri
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-xs bg-white hover:bg-gray-100 dark:bg-[#1A2942]/50 dark:hover:bg-[#243656] border-gray-200 dark:border-[#2A3A5A] text-gray-800 dark:text-white"
                      onClick={() => navigateToTab('ballot-management')}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Bước 5
                    </Button>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-6 h-6 flex-shrink-0 mt-0.5 mr-3">
                    6
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Triển khai blockchain
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Triển khai phiên bầu cử lên blockchain để tăng tính bảo mật
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 text-xs bg-white hover:bg-gray-100 dark:bg-[#1A2942]/50 dark:hover:bg-[#243656] border-gray-200 dark:border-[#2A3A5A] text-gray-800 dark:text-white"
                      onClick={() => navigateToTab('blockchain')}
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Bước 6
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phần còn lại của ElectionOverview component giữ nguyên */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ...cards... */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* ...cards... */}</div>

      {/* ...rest of the component... */}
    </div>
  );
};

export default QuanLyPhienBauCuPage;
