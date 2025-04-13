'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Vote,
  CheckCircle,
  Eye,
  AlertTriangle,
  Shield,
  Zap,
  Info,
  ChevronRight,
  BarChart2,
  Award,
  Database,
  FileText,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

// Redux imports
import { AppDispatch, RootState } from '../store/store';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import { fetchCacPhienBauCuByCuocBauCuId } from '../store/slice/phienBauCuSlice';
import { fetchImageUrl } from '../store/slice/cuocBauCuImageSlice';
import { fetchDieuLeByCuocBauCuId } from '../store/slice/dieuLeSlice';
import { TrangThaiBlockchain } from '../store/types';

// Components
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Separator } from '../components/ui/Separator';
import { Skeleton } from '../components/ui/Skeleton';
import ParticleBackground from '../components/backgrounds/ParticleBackground';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';

// Định nghĩa component chính
const XemChiTietCuocBauCuPage: React.FC = () => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showSessionSelectModal, setShowSessionSelectModal] = useState<boolean>(false);

  // Redux state
  const { cuocBauCu, dangTai: dangTaiCuocBauCu } = useSelector(
    (state: RootState) => state.cuocBauCuById,
  );
  const { cacPhienBauCu, dangTai: dangTaiPhienBauCu } = useSelector(
    (state: RootState) => state.phienBauCu,
  );
  const { imageUrl, fileInfo } = useSelector((state: RootState) => state.cuocBauCuImage);
  const { dieuLeCuocBauCu, dangTai: dangTaiDieuLe } = useSelector(
    (state: RootState) => state.dieuLe,
  );
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  // Kiểm tra dark mode
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
  }, []);

  // Fetch data khi component mount
  useEffect(() => {
    if (cuocBauCuId) {
      dispatch(fetchCuocBauCuById(Number(cuocBauCuId)));
      dispatch(fetchCacPhienBauCuByCuocBauCuId(Number(cuocBauCuId)));
      dispatch(fetchImageUrl(Number(cuocBauCuId)));
      dispatch(fetchDieuLeByCuocBauCuId(Number(cuocBauCuId)));
    }
  }, [dispatch, cuocBauCuId]);

  // Parse Vietnamese date format (dd/mm/yyyy hh:mm) - this is already correctly defined
  const parseVietnameseDate = useCallback((dateStr: string) => {
    if (!dateStr) return new Date();

    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    return new Date(+year, +month - 1, +day, +hour, +minute);
  }, []);

  // Tính thời gian còn lại và trạng thái cuộc bầu cử
  const getElectionStatus = useCallback(() => {
    if (!cuocBauCu)
      return {
        status: 'Không xác định',
        color: 'gray',
        icon: <AlertTriangle className="h-4 w-4" />,
      };

    const now = new Date();
    const startDate = parseVietnameseDate(cuocBauCu.ngayBatDau);
    const endDate = parseVietnameseDate(cuocBauCu.ngayKetThuc);

    if (now < startDate) {
      return { status: 'Sắp diễn ra', color: 'blue', icon: <Clock className="h-4 w-4" /> };
    }
    if (now > endDate) {
      return { status: 'Đã kết thúc', color: 'gray', icon: <CheckCircle className="h-4 w-4" /> };
    }
    return { status: 'Đang diễn ra', color: 'green', icon: <Zap className="h-4 w-4" /> };
  }, [cuocBauCu, parseVietnameseDate]);

  // Lấy trạng thái blockchain
  const getBlockchainStatus = useCallback(() => {
    if (!cuocBauCu || cuocBauCu.trangThaiBlockchain === undefined) {
      return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
    }

    switch (cuocBauCu.trangThaiBlockchain) {
      case TrangThaiBlockchain.ChuaTrienKhai:
        return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
      case TrangThaiBlockchain.DangTrienKhai:
        return {
          status: 'Đang triển khai',
          color: 'blue',
          icon: <Clock className="h-4 w-4 animate-spin" />,
        };
      case TrangThaiBlockchain.DaTrienKhai:
        return {
          status: 'Đã triển khai',
          color: 'green',
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case TrangThaiBlockchain.TrienKhaiThatBai:
        return {
          status: 'Triển khai thất bại',
          color: 'red',
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
    }
  }, [cuocBauCu]);

  // Tính progress của cuộc bầu cử
  const calculateProgress = useCallback(() => {
    if (!cuocBauCu) return 0;

    const now = new Date();
    const startDate = parseVietnameseDate(cuocBauCu.ngayBatDau);
    const endDate = parseVietnameseDate(cuocBauCu.ngayKetThuc);

    if (now < startDate) return 0;
    if (now > endDate) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    return Math.min(100, Math.round((elapsed / totalDuration) * 100));
  }, [cuocBauCu, parseVietnameseDate]);

  // Tính thời gian còn lại
  const getTimeRemaining = useCallback(() => {
    if (!cuocBauCu) return { days: 0, hours: 0, minutes: 0 };

    const now = new Date();
    const endDate = parseVietnameseDate(cuocBauCu.ngayKetThuc);

    if (now > endDate) return { days: 0, hours: 0, minutes: 0 };

    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  }, [cuocBauCu, parseVietnameseDate]);

  // Lấy các giá trị đã tính toán
  const electionStatus = getElectionStatus();
  const blockchainStatus = getBlockchainStatus();
  const progress = calculateProgress();
  const timeRemaining = getTimeRemaining();

  // Xử lý khi nhấn nút "Xem chi tiết phiên bầu cử"
  const handleViewSessions = () => {
    if (!user) {
      // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
      navigate('/login');
      return;
    }

    // Nếu có một phiên duy nhất, chuyển trực tiếp đến trang chi tiết phiên
    if (cacPhienBauCu.length === 1) {
      navigate(`/app/elections/${cuocBauCuId}/session/${cacPhienBauCu[0].id}`);
      return;
    }

    // Nếu có nhiều phiên, hiển thị modal để chọn phiên
    setShowSessionSelectModal(true);
  };

  // Handler khi chọn phiên để xem chi tiết
  const handleSessionSelect = (phienBauCuId: number) => {
    setShowSessionSelectModal(false);
    // Điều hướng đến trang chi tiết phiên bầu cử
    navigate(`/app/elections/${cuocBauCuId}/session/${phienBauCuId}`);
  };

  // Render các phiên hiện có
  const renderSessions = () => {
    if (dangTaiPhienBauCu) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 bg-gray-200 dark:bg-gray-800/50 rounded-xl" />
          ))}
        </div>
      );
    }

    if (cacPhienBauCu.length === 0) {
      return (
        <Alert className="bg-yellow-50/70 dark:bg-yellow-900/20 border border-yellow-100/50 dark:border-yellow-800/30 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-300">
            Không tìm thấy phiên bầu cử
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            Cuộc bầu cử này chưa có phiên bầu cử nào hoặc chưa được công bố.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cacPhienBauCu.map((session) => (
          <Card
            key={session.id}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px]"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                {session.tenPhienBauCu}
              </CardTitle>
              <CardDescription>
                {new Date(session.ngayBatDau).toLocaleDateString('vi-VN')} -{' '}
                {new Date(session.ngayKetThuc).toLocaleDateString('vi-VN')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                {session.moTa || 'Không có mô tả'}
              </p>

              <Badge
                className={
                  session.trangThai === 'Đang diễn ra'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : session.trangThai === 'Sắp diễn ra'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }
              >
                {session.trangThai || 'Không xác định'}
              </Badge>

              {session.trangThai === 'Đang diễn ra' && session.tienTrinhPhienBau !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${session.tienTrinhPhienBau}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round(session.tienTrinhPhienBau)}% hoàn thành
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/app/elections/${cuocBauCuId}/session/${session.id}`);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Chi tiết
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  // Modal chọn phiên bầu cử để xem chi tiết
  const renderSessionSelectionModal = () => {
    if (!showSessionSelectModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Chọn phiên bầu cử để xem chi tiết
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Cuộc bầu cử này có nhiều phiên bầu cử. Vui lòng chọn một phiên để xem chi tiết.
            </p>

            <div className="space-y-3 mt-4">
              {cacPhienBauCu.map((session) => (
                <Card
                  key={session.id}
                  className="border hover:border-blue-500 dark:hover:border-blue-400"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {session.tenPhienBauCu}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(session.ngayBatDau).toLocaleDateString('vi-VN')} -{' '}
                          {new Date(session.ngayKetThuc).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <Badge
                        className={
                          session.trangThai === 'Đang diễn ra'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : session.trangThai === 'Sắp diễn ra'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }
                      >
                        {session.trangThai || 'Không xác định'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleSessionSelect(session.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setShowSessionSelectModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  if (dangTaiCuocBauCu) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <Skeleton className="h-8 w-1/3 bg-gray-200 dark:bg-gray-800/50 mb-2" />
          <Skeleton className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800/50 mb-6" />

          <Skeleton className="h-64 w-full bg-gray-200 dark:bg-gray-800/50 rounded-xl mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-800/50 rounded-xl" />
            <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-800/50 rounded-xl" />
            <Skeleton className="h-32 w-full bg-gray-200 dark:bg-gray-800/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (!cuocBauCu && !dangTaiCuocBauCu) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>
              Không thể tải thông tin cuộc bầu cử. Vui lòng thử lại sau.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Format date for display - let's keep original format
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    return dateString; // Return the original Vietnamese format string
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321]">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <ParticleBackground isDarkMode={isDarkMode} />
      </div>

      <div className="container mx-auto max-w-6xl p-4 md:p-8 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>Trang chủ</span>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span>Cuộc bầu cử</span>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-gray-900 dark:text-white font-medium">
            {cuocBauCu?.tenCuocBauCu}
          </span>
        </div>

        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={cuocBauCu?.tenCuocBauCu}
                className="w-full h-full object-cover brightness-[0.3]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-900 to-purple-900"></div>
            )}
          </div>

          <div className="relative p-6 md:p-8 text-white">
            <div className="max-w-3xl">
              <h1 className="text-2xl md:text-4xl font-bold mb-2 text-shadow-md">
                {cuocBauCu?.tenCuocBauCu}
              </h1>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  className={
                    electionStatus.color === 'green'
                      ? 'bg-green-500/80 text-white hover:bg-green-600/80'
                      : electionStatus.color === 'blue'
                        ? 'bg-blue-500/80 text-white hover:bg-blue-600/80'
                        : 'bg-gray-500/80 text-white hover:bg-gray-600/80'
                  }
                >
                  {electionStatus.icon}
                  <span className="ml-1">{electionStatus.status}</span>
                </Badge>

                <Badge
                  className={
                    blockchainStatus.color === 'green'
                      ? 'bg-green-500/80 text-white hover:bg-green-600/80'
                      : blockchainStatus.color === 'blue'
                        ? 'bg-blue-500/80 text-white hover:bg-blue-600/80'
                        : blockchainStatus.color === 'yellow'
                          ? 'bg-yellow-500/80 text-white hover:bg-yellow-600/80'
                          : 'bg-red-500/80 text-white hover:bg-red-600/80'
                  }
                >
                  {blockchainStatus.icon}
                  <span className="ml-1">{blockchainStatus.status}</span>
                </Badge>

                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(cuocBauCu?.ngayBatDau)} - {formatDate(cuocBauCu?.ngayKetThuc)}
                </Badge>
              </div>

              <p className="text-white/90 text-base md:text-lg max-w-3xl mb-6">{cuocBauCu?.moTa}</p>

              {electionStatus.status === 'Đang diễn ra' && (
                <div className="mb-4 max-w-md">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Tiến độ</span>
                    <span>{progress}% hoàn thành</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-white/20" />
                  {timeRemaining.days > 0 ||
                  timeRemaining.hours > 0 ||
                  timeRemaining.minutes > 0 ? (
                    <p className="text-xs mt-1 text-white/80 text-right">
                      Còn lại: {timeRemaining.days} ngày, {timeRemaining.hours} giờ,{' '}
                      {timeRemaining.minutes} phút
                    </p>
                  ) : null}
                </div>
              )}

              {electionStatus.status !== 'Đã kết thúc' && (
                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:translate-y-[-2px]"
                  onClick={handleViewSessions}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem các phiên bầu cử
                </Button>
              )}
            </div>

            {cuocBauCu?.blockchainAddress && (
              <div className="absolute bottom-4 right-4 flex items-center text-xs bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
                <Database className="h-3 w-3 mr-1 text-blue-300" />
                <span className="text-white/90 font-mono">
                  {cuocBauCu.blockchainAddress.substring(0, 6)}...
                  {cuocBauCu.blockchainAddress.substring(cuocBauCu.blockchainAddress.length - 4)}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://explorer.holihu.online/address/${cuocBauCu.blockchainAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-300 hover:text-blue-200"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs">Xem trên Holihu Explorer</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 gap-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Tổng quan</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Phiên bầu cử</span>
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Điều lệ</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                {/* Stats section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Phiên bầu cử</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {cacPhienBauCu.length}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Cử tri</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">180</p>
                        </div>
                        <Users className="h-8 w-8 text-green-500 dark:text-green-400 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Ứng viên</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">15</p>
                        </div>
                        <Award className="h-8 w-8 text-purple-500 dark:text-purple-400 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ tham gia</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">78%</p>
                        </div>
                        <BarChart2 className="h-8 w-8 text-amber-500 dark:text-amber-400 opacity-80" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Information Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                          <Info className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Thông tin chi tiết
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Mô tả
                            </h3>
                            <p className="text-gray-900 dark:text-white mt-1">
                              {cuocBauCu?.moTa || 'Không có mô tả'}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Thời gian bắt đầu
                              </h3>
                              <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                                {new Date(cuocBauCu?.ngayBatDau).toLocaleDateString('vi-VN')}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Thời gian kết thúc
                              </h3>
                              <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                                {new Date(cuocBauCu?.ngayKetThuc).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>

                          <Separator className="bg-gray-200 dark:bg-gray-700" />

                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Trạng thái
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge
                                className={
                                  electionStatus.color === 'green'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                                    : electionStatus.color === 'blue'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-200 dark:border-gray-700/30'
                                }
                              >
                                {electionStatus.icon}
                                <span className="ml-1">{electionStatus.status}</span>
                              </Badge>

                              <Badge
                                className={
                                  blockchainStatus.color === 'green'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                                    : blockchainStatus.color === 'blue'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30'
                                      : blockchainStatus.color === 'yellow'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30'
                                }
                              >
                                {blockchainStatus.icon}
                                <span className="ml-1">{blockchainStatus.status}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Sessions */}
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                            <Calendar className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Phiên bầu cử gần đây
                          </CardTitle>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 dark:text-blue-400"
                            onClick={() => setActiveTab('sessions')}
                          >
                            Xem tất cả
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {dangTaiPhienBauCu ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <Skeleton
                                key={i}
                                className="h-12 bg-gray-200 dark:bg-gray-800/50 rounded-lg"
                              />
                            ))}
                          </div>
                        ) : cacPhienBauCu.length > 0 ? (
                          <div className="space-y-2">
                            {cacPhienBauCu.slice(0, 3).map((session) => (
                              <div
                                key={session.id}
                                className="flex flex-col p-3 bg-gray-50/70 dark:bg-gray-900/50 rounded-lg space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                      {session.tenPhienBauCu}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(session.ngayBatDau).toLocaleDateString('vi-VN')}
                                    </p>
                                  </div>
                                  <Badge
                                    className={
                                      session.trangThai === 'Đang diễn ra'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : session.trangThai === 'Sắp diễn ra'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                    }
                                  >
                                    {session.trangThai || 'Không xác định'}
                                  </Badge>
                                </div>
                                <div>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 h-auto text-blue-600 dark:text-blue-400 text-xs"
                                    onClick={() =>
                                      navigate(
                                        `/app/elections/${cuocBauCuId}/session/${session.id}`,
                                      )
                                    }
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Xem chi tiết
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            Chưa có phiên bầu cử nào
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Quick Info */}
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                          <Info className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Thông tin nhanh
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {electionStatus.status === 'Đang diễn ra' && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Tiến độ cuộc bầu cử
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={progress} className="h-2 flex-1" />
                                <span className="text-xs font-medium">{progress}%</span>
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Số phiên bầu cử
                            </p>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {cacPhienBauCu.length}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Blockchain</p>
                            <div className="flex items-center mt-1">
                              <Database className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                              <Badge
                                className={
                                  blockchainStatus.color === 'green'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                                    : blockchainStatus.color === 'blue'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30'
                                      : blockchainStatus.color === 'yellow'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30'
                                }
                              >
                                {blockchainStatus.status}
                              </Badge>
                            </div>
                          </div>

                          {electionStatus.status !== 'Đã kết thúc' && (
                            <div className="pt-2">
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                                onClick={() => setActiveTab('sessions')}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Xem phiên bầu cử
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rules Preview */}
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Điều lệ bầu cử
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dangTaiDieuLe ? (
                          <Skeleton className="h-24 bg-gray-200 dark:bg-gray-800/50 rounded-lg" />
                        ) : dieuLeCuocBauCu ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {dieuLeCuocBauCu.tieuDe}
                              </h3>
                              <Badge
                                className={
                                  dieuLeCuocBauCu.daCongBo
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }
                              >
                                {dieuLeCuocBauCu.daCongBo ? 'Đã công bố' : 'Bản nháp'}
                              </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mt-1">
                              {dieuLeCuocBauCu.noiDung.replace(/<[^>]*>/g, '').substring(0, 120)}...
                            </p>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-blue-600 dark:text-blue-400"
                              onClick={() => setActiveTab('rules')}
                            >
                              Xem chi tiết
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <FileText className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              Chưa có điều lệ bầu cử
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sessions">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Các phiên bầu cử
                    </CardTitle>
                    <CardDescription>
                      Danh sách các phiên bầu cử trong cuộc bầu cử {cuocBauCu?.tenCuocBauCu}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>{renderSessions()}</CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Điều lệ bầu cử
                        </CardTitle>
                        <CardDescription>
                          Quy định và điều lệ của cuộc bầu cử {cuocBauCu?.tenCuocBauCu}
                        </CardDescription>
                      </div>

                      {dieuLeCuocBauCu && (
                        <Badge
                          className={
                            dieuLeCuocBauCu.daCongBo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }
                        >
                          {dieuLeCuocBauCu.daCongBo ? 'Đã công bố' : 'Bản nháp'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dangTaiDieuLe ? (
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-1/3 bg-gray-200 dark:bg-gray-800/50 rounded" />
                        <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800/50 rounded" />
                        <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800/50 rounded" />
                        <Skeleton className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800/50 rounded" />
                      </div>
                    ) : dieuLeCuocBauCu ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50/70 dark:bg-gray-900/50 p-4 rounded-lg">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {dieuLeCuocBauCu.tieuDe}
                          </h2>
                          <div className="prose prose-blue dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: dieuLeCuocBauCu.noiDung }} />
                          </div>
                        </div>

                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            Cập nhật lần cuối:{' '}
                            {new Date(dieuLeCuocBauCu.thoiGianCapNhat).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="mx-2">•</span>
                          <span>Phiên bản: v{dieuLeCuocBauCu.phienBan}.0</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Chưa có điều lệ bầu cử
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Ban tổ chức chưa công bố điều lệ cho cuộc bầu cử này.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Modal chọn phiên bầu cử để xem chi tiết */}
      {renderSessionSelectionModal()}
    </div>
  );
};

export default XemChiTietCuocBauCuPage;
