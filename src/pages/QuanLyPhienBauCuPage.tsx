'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  BarChart2,
  ChevronRight,
  Edit,
  UserPlus,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  Zap,
  FileText,
  HelpCircle,
  Loader,
  RefreshCw,
  Cpu,
  Database,
} from 'lucide-react';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';

// Components
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { Progress } from '../components/ui/Progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/Dropdown-Menu';

// Lazy load content components
//const TienHanhPhienBauCu = React.lazy(() => import('./TienHanhPhienBauCuPage'));
const ElectionRoleForm = React.lazy(() => import('./QuanLyVaiTroCuocBauCuPage'));
const QuanLyUngVien = React.lazy(() => import('./QuanLyUngVienPage'));
const QuanLyCuTri = React.lazy(() => import('./QuanLyCuTriPage'));
const EditElectionPage = React.lazy(() => import('./ChinhSuaCuocBauCuPage'));

const EnhancedQuanLyPhienBauCuPage: React.FC = () => {
  const { idPhien: phienBauCuId } = useParams<{ idPhien: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // State
  // Thay đổi activeTab mặc định từ 'details' sang 'edit'
  const [activeTab, setActiveTab] = useState('edit');
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Redux store
  const phienBauCu = useSelector(
    (state: RootState) =>
      state.phienBauCu.cacPhienBauCu.find((p) => p.id === Number(phienBauCuId)) ||
      state.phienBauCu.cacPhienBauCu[0],
  );
  const { cuocBauCu } = useSelector((state: RootState) => state.cuocBauCuById);

  // Fetch phien bau cu data
  const fetchPhienBauCuData = useCallback(async () => {
    if (phienBauCuId) {
      await dispatch(fetchPhienBauCuById(Number(phienBauCuId)));
      setLoading(false);
    }
  }, [dispatch, phienBauCuId]);

  // Initial data fetch
  useEffect(() => {
    fetchPhienBauCuData();
  }, [fetchPhienBauCuData]);

  // Fetch cuoc bau cu data when phien bau cu is loaded
  useEffect(() => {
    if (phienBauCu && phienBauCu.cuocBauCuId) {
      dispatch(fetchCuocBauCuById(phienBauCu.cuocBauCuId));
    }
  }, [dispatch, phienBauCu]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Navigate back
  const handleGoBack = () => {
    if (cuocBauCu) {
      navigate(`/app/user-elections/elections/${cuocBauCu.id}/election-management`);
    } else {
      navigate(-1);
    }
  };

  // Navigate to blockchain management
  const handleGoToBlockchain = () => {
    if (cuocBauCu && phienBauCuId) {
      navigate(`/election/${cuocBauCu.id}/session/${phienBauCuId}`);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
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
  const getTimeInfo = () => {
    if (!phienBauCu) return null;

    const now = new Date();
    const startDate = new Date(phienBauCu.ngayBatDau);
    const endDate = new Date(phienBauCu.ngayKetThuc);

    const timeRemaining = {
      days: 0,
      hours: 0,
      minutes: 0,
      isActive: false,
      isUpcoming: false,
      isCompleted: false,
      percentComplete: 0,
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
    } else if (now > endDate) {
      // Completed
      timeRemaining.isCompleted = true;
      timeRemaining.percentComplete = 100;
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
    }

    return timeRemaining;
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Render content based on selected tab
  const renderContent = () => {
    switch (activeTab) {
      // case 'details':
      //   return <TienHanhPhienBauCu />;
      case 'edit':
        return <EditElectionPage />;
      case 'candidates':
        return <QuanLyUngVien phienBauCuId={phienBauCuId!} />;
      case 'voters':
        return <QuanLyCuTri phienBauCuId={phienBauCuId!} darkMode={true} />;
      case 'roles':
        return <ElectionRoleForm phienBauCuId={phienBauCuId!} />;
      default:
        // Đảm bảo trả về một phần tử JSX đơn giản thay vì null
        return (
          <div className="p-6">
            <h2 className="text-xl font-medium text-white mb-4">Thông tin chung</h2>
            <p className="text-gray-300">Vui lòng chọn một tab để xem chi tiết.</p>
          </div>
        );
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-b from-[#0A0F18] via-[#121A29] to-[#0D1321] min-h-screen text-white">
        <div className="bg-[#162A45] border border-[#2A3A5A] p-6 rounded-xl shadow-lg">
          <Skeleton className="h-10 w-3/4 bg-gray-800 mb-4" />
          <Skeleton className="h-6 w-1/2 bg-gray-800 mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-32 w-full bg-gray-800 rounded-xl" />
            <Skeleton className="h-32 w-full bg-gray-800 rounded-xl" />
            <Skeleton className="h-32 w-full bg-gray-800 rounded-xl" />
          </div>

          <Skeleton className="h-64 w-full bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state if no phien bau cu data
  if (!phienBauCu && !loading) {
    return (
      <div className="p-6 bg-gradient-to-b from-[#0A0F18] via-[#121A29] to-[#0D1321] min-h-screen text-white">
        <Card className="bg-gradient-to-br from-[#162A45]/80 to-[#1A2942]/50 backdrop-blur-sm border border-red-900/30 rounded-xl shadow-lg shadow-blue-900/5 overflow-hidden">
          <CardContent className="p-6 flex items-center space-x-4">
            <AlertTriangle className="h-8 w-8 text-red-400 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-medium text-white mb-1">Không tìm thấy phiên bầu cử</h2>
              <p className="text-gray-400">
                Không thể tải thông tin phiên bầu cử. Vui lòng thử lại sau.
              </p>
              <Button
                className="mt-4 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-lg transition-all duration-300 rounded-lg"
                onClick={handleGoBack}
              >
                <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Time info for the current phien bau cu
  const timeInfo = getTimeInfo();

  return (
    <div className="bg-gradient-to-b from-[#0A0F18] via-[#121A29] to-[#0D1321] min-h-screen text-white">
      {/* Back Button Row */}
      <div className="p-6 flex justify-between items-center">
        <Button
          variant="outline"
          className="bg-[#1A2942]/50 border-[#2A3A5A] text-white hover:bg-[#243656] rounded-lg flex items-center gap-2"
          onClick={handleGoBack}
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Trở về cuộc bầu cử
        </Button>

        <div className="flex space-x-2">
          {/* Blockchain Management Button */}
          <Button
            variant="outline"
            className="bg-gradient-to-r from-[#0288D1]/20 to-[#6A1B9A]/20 border-[#2A3A5A] text-white hover:bg-gradient-to-r hover:from-[#0288D1]/30 hover:to-[#6A1B9A]/30 rounded-lg flex items-center gap-2"
            onClick={handleGoToBlockchain}
          >
            <Database className="h-4 w-4" />
            <span>Quản lý Blockchain</span>
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-[#1A2942]/50 border-[#2A3A5A] text-white hover:bg-[#243656] rounded-lg"
                  onClick={() => fetchPhienBauCuData()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 border-blue-900 text-white">
                <p>Làm mới dữ liệu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-[#1A2942]/50 border-[#2A3A5A] text-white hover:bg-[#243656] rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="ml-2">Tùy chọn</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1A2942] border border-[#2A3A5A] text-white">
              <DropdownMenuLabel>Quản lý phiên bầu cử</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2A3A5A]" />
              <DropdownMenuItem
                className="flex items-center cursor-pointer hover:bg-[#243656]"
                onClick={() => setActiveTab('edit')}
              >
                <Edit className="mr-2 h-4 w-4" />
                <span>Chỉnh sửa thông tin</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center cursor-pointer hover:bg-[#243656]"
                onClick={() => setActiveTab('voters')}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Quản lý cử tri</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2A3A5A]" />
              <DropdownMenuItem
                className="flex items-center cursor-pointer hover:bg-[#243656]"
                onClick={handleGoToBlockchain}
              >
                <Cpu className="mr-2 h-4 w-4" />
                <span>Quản lý Blockchain</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2A3A5A]" />
              <DropdownMenuItem
                className="flex items-center cursor-pointer hover:bg-[#243656]"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Trợ giúp</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Header Section */}
      <motion.div initial="initial" animate="animate" variants={fadeInUp} className="px-6 py-4">
        <div className="bg-gradient-to-r from-[#162A45] to-[#1A2942] backdrop-blur-sm border border-[#2A3A5A] rounded-2xl p-6 shadow-lg shadow-blue-900/10 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-1 h-16 bg-gradient-to-b from-[#0288D1] to-[#6A1B9A] rounded-r-full"></div>
          <div className="absolute top-0 right-0 w-16 h-1 bg-gradient-to-l from-[#0288D1] to-[#6A1B9A] rounded-b-full"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {phienBauCu?.tenPhienBauCu}
              </h1>

              <div className="flex flex-wrap gap-2 items-center">
                <Badge
                  className={
                    phienBauCu?.trangThai === 'Đang diễn ra'
                      ? 'bg-green-900/30 text-green-400'
                      : phienBauCu?.trangThai === 'Sắp diễn ra'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-gray-800 text-gray-400'
                  }
                >
                  {phienBauCu?.trangThai === 'Đang diễn ra' && <Zap className="mr-1 h-3 w-3" />}
                  {phienBauCu?.trangThai === 'Sắp diễn ra' && <Clock className="mr-1 h-3 w-3" />}
                  {phienBauCu?.trangThai === 'Đã kết thúc' && (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  )}
                  {phienBauCu?.trangThai}
                </Badge>

                {cuocBauCu && (
                  <div className="text-sm text-gray-400 flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-blue-400" />
                    Thuộc cuộc bầu cử: {cuocBauCu.tenCuocBauCu}
                  </div>
                )}

                <div className="text-sm text-gray-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-blue-400" />
                  {formatDate(phienBauCu?.ngayBatDau || '')} -{' '}
                  {formatDate(phienBauCu?.ngayKetThuc || '')}
                </div>
              </div>
            </div>

            {/* Blockchain Management Button */}
            <Button
              className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-lg transition-all duration-300 rounded-lg flex items-center gap-2"
              onClick={handleGoToBlockchain}
            >
              <Database className="h-4 w-4" />
              Quản lý Blockchain
            </Button>
          </div>

          {/* Description */}
          <div className="mt-6">
            <p className="text-gray-300">{phienBauCu?.moTa}</p>
          </div>

          {/* Time progress */}
          {timeInfo?.isActive && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Đang diễn ra</span>
                <span>{timeInfo.percentComplete}% hoàn thành</span>
              </div>
              <Progress
                value={timeInfo.percentComplete}
                className="h-2 bg-[#1A2942] bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]"
              />
              <div className="mt-1 text-sm text-gray-400 text-right">
                Còn lại: {timeInfo.days} ngày, {timeInfo.hours} giờ, {timeInfo.minutes} phút
              </div>
            </div>
          )}

          {timeInfo?.isUpcoming && (
            <div className="mt-4 text-sm text-gray-400 flex items-center">
              <Clock className="h-4 w-4 mr-1 text-blue-400" />
              Sắp diễn ra trong: {timeInfo.days} ngày, {timeInfo.hours} giờ, {timeInfo.minutes} phút
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={{
          ...fadeInUp,
          animate: { ...fadeInUp.animate, transition: { delay: 0.1, duration: 0.5 } },
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4"
      >
        {/* Voters Stats */}
        <Card className="bg-gradient-to-br from-[#162A45]/80 to-[#1A2942]/50 backdrop-blur-sm border border-[#2A3A5A] rounded-xl shadow-lg shadow-blue-900/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-md text-blue-400 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Cử Tri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-white">157</span>
              <span className="text-sm text-gray-400 ml-2 mb-1">cử tri</span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Tỷ lệ tham gia</span>
                <span className="text-white">78%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Cử tri đã bỏ phiếu</span>
                <span className="text-white">122</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Stats */}
        <Card className="bg-gradient-to-br from-[#162A45]/80 to-[#1A2942]/50 backdrop-blur-sm border border-[#2A3A5A] rounded-xl shadow-lg shadow-blue-900/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-md text-indigo-400 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Ứng Viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-white">12</span>
              <span className="text-sm text-gray-400 ml-2 mb-1">ứng viên</span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Tỷ lệ ứng viên/vị trí</span>
                <span className="text-white">2.4</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Phiếu bầu trung bình/ứng viên</span>
                <span className="text-white">28</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Votes Stats */}
        <Card className="bg-gradient-to-br from-[#162A45]/80 to-[#1A2942]/50 backdrop-blur-sm border border-[#2A3A5A] rounded-xl shadow-lg shadow-blue-900/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-md text-green-400 flex items-center">
              <BarChart2 className="mr-2 h-5 w-5" />
              Phiếu Bầu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-white">342</span>
              <span className="text-sm text-gray-400 ml-2 mb-1">phiếu bầu</span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Phiếu bầu hôm nay</span>
                <span className="text-white">+48</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Phiếu bầu hợp lệ</span>
                <span className="text-white">338 (98.8%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Section */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={{
          ...fadeInUp,
          animate: { ...fadeInUp.animate, transition: { delay: 0.2, duration: 0.5 } },
        }}
        className="px-6 py-4"
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-5 gap-2 bg-[#1A2942]/70 p-1 rounded-xl">
            <TabsTrigger
              value="details"
              className="rounded-lg data-[state=active]:bg-gradient-to-r from-[#0288D1]/70 to-[#6A1B9A]/70 data-[state=active]:shadow-md"
            >
              <FileText className="h-4 w-4 mr-2" />
              Chi tiết
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="rounded-lg data-[state=active]:bg-gradient-to-r from-[#0288D1]/70 to-[#6A1B9A]/70 data-[state=active]:shadow-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </TabsTrigger>
            <TabsTrigger
              value="candidates"
              className="rounded-lg data-[state=active]:bg-gradient-to-r from-[#0288D1]/70 to-[#6A1B9A]/70 data-[state=active]:shadow-md"
            >
              <Users className="h-4 w-4 mr-2" />
              Ứng viên
            </TabsTrigger>
            <TabsTrigger
              value="voters"
              className="rounded-lg data-[state=active]:bg-gradient-to-r from-[#0288D1]/70 to-[#6A1B9A]/70 data-[state=active]:shadow-md"
            >
              <Users className="h-4 w-4 mr-2" />
              Cử tri
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="rounded-lg data-[state=active]:bg-gradient-to-r from-[#0288D1]/70 to-[#6A1B9A]/70 data-[state=active]:shadow-md"
            >
              <Shield className="h-4 w-4 mr-2" />
              Vai trò
            </TabsTrigger>
          </TabsList>

          <Card className="mt-6 bg-gradient-to-br from-[#162A45]/80 to-[#1A2942]/50 backdrop-blur-sm border border-[#2A3A5A] rounded-xl shadow-lg shadow-blue-900/5 overflow-hidden">
            <TabsContent value={activeTab} className="p-0 m-0">
              <CardContent className="p-0">
                <Suspense
                  fallback={
                    <div className="p-6 flex justify-center">
                      <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                    </div>
                  }
                >
                  {renderContent()}
                </Suspense>
              </CardContent>
            </TabsContent>
          </Card>
        </Tabs>
      </motion.div>

      {/* Help overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#162A45]/95 to-[#1A2942]/95 backdrop-blur-sm border border-[#2A3A5A] rounded-xl p-6 shadow-xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <HelpCircle className="mr-2 h-6 w-6 text-blue-400" />
                Trợ giúp - Quản lý phiên bầu cử
              </h2>

              <div className="space-y-4">
                <div className="p-3 border border-[#2A3A5A] rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-2">Các tab quản lý</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <FileText className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Chi tiết</strong>: Xem thông tin chi tiết và
                        theo dõi tiến trình bầu cử
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Edit className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Chỉnh sửa</strong>: Thay đổi thông tin của
                        phiên bầu cử
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Users className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Ứng viên</strong>: Quản lý danh sách ứng viên
                        tham gia
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Users className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Cử tri</strong>: Quản lý danh sách cử tri và
                        kiểm soát quyền bỏ phiếu
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Vai trò</strong>: Phân quyền và quản lý vai
                        trò trong phiên bầu cử
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Database className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Quản lý Blockchain</strong>: Triển khai và
                        quản lý phiên bầu cử trên blockchain
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border border-[#2A3A5A] rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-2">Trạng thái phiên bầu cử</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-400" />
                        <span>
                          <strong className="text-white">Sắp diễn ra</strong>: Chưa đến thời gian
                          bắt đầu
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-green-400" />
                        <span>
                          <strong className="text-white">Đang diễn ra</strong>: Cử tri có thể bỏ
                          phiếu
                        </span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          <strong className="text-white">Đã kết thúc</strong>: Đã hết thời gian bỏ
                          phiếu
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 border border-[#2A3A5A] rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-2">Thông số quan trọng</h3>
                    <ul className="space-y-1 text-gray-300">
                      <li className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-400" />
                        <span>Số lượng cử tri và tỷ lệ tham gia</span>
                      </li>
                      <li className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-indigo-400" />
                        <span>Số lượng ứng viên và tỷ lệ ứng viên/vị trí</span>
                      </li>
                      <li className="flex items-center">
                        <BarChart2 className="h-4 w-4 mr-2 text-green-400" />
                        <span>Số phiếu bầu và tỷ lệ phiếu hợp lệ</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Button
                  className="w-full mt-2 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-lg transition-all duration-300 rounded-lg"
                  onClick={() => setShowHelp(false)}
                >
                  Đã hiểu
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedQuanLyPhienBauCuPage;
