'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  ChevronRight,
  Clock,
  CheckCircle,
  Vote,
  AlertTriangle,
  Shield,
  Award,
  User,
  BarChart2,
  ArrowLeft,
  ExternalLink,
  Info,
  Database,
  Eye,
  Wallet,
  Search,
  Filter,
  ChevronDown,
  Zap,
  Layout,
  Grid,
  List,
  Loader2,
  Lock,
} from 'lucide-react';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import { fetchViTriUngCuByPhienBauCuId } from '../store/slice/viTriUngCuSlice';
import {
  fetchUngCuVienByPhienBauCuId,
  fetchImageUngCuVien,
  fetchBlockchainAddress,
} from '../store/slice/ungCuVienSlice';
import { fetchCuTriByPhienBauCuId } from '../store/slice/cuTriSlice';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import CardUngVienXemChiTiet from '../features/CardUngVienXemChiTiet';
import { Skeleton } from '../components/ui/Skeleton';
import { Input } from '../components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/Dropdown-Menu';
import { Separator } from '../components/ui/Separator';
import { useToast } from '../test/components/use-toast';

// Định nghĩa interface cho hàm kiểm tra quyền cử tri
interface CheckVoterEligibilityResult {
  isEligible: boolean;
  message: string;
}

interface XemChiTietPhienBauCuProps {
  phienBauCuId?: string;
}

const XemChiTietPhienBauCu: React.FC<XemChiTietPhienBauCuProps> = ({
  phienBauCuId: propPhienBauCuId,
}) => {
  const { idPhien = propPhienBauCuId } = useParams<{ idPhien: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

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
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Redux store
  const phienBauCu = useSelector(
    (state: RootState) =>
      state.phienBauCu.cacPhienBauCu.find((p) => p.id === Number(idPhien)) ||
      state.phienBauCu.cacPhienBauCu[0],
  );
  const { cuocBauCu } = useSelector((state: RootState) => state.cuocBauCuById);
  const viTriUngCuList = useSelector((state: RootState) => state.viTriUngCu.cacViTriUngCu);
  const ungCuVienList = useSelector((state: RootState) => state.ungCuVien.cacUngCuVien);
  const cuTriList = useSelector((state: RootState) => state.cuTri.cacCuTri);
  const imagesMap = useSelector((state: RootState) => state.ungCuVien.imagesMap);
  const blockchainAddresses = useSelector(
    (state: RootState) => state.ungCuVien.blockchainAddresses,
  );
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  // Fetch phien bau cu data
  const fetchPhienBauCuData = useCallback(async () => {
    if (idPhien) {
      setLoading(true);
      try {
        await dispatch(fetchPhienBauCuById(Number(idPhien)));

        // After getting phien details, fetch related cuocBauCu
        const fetchedPhienBauCu = await dispatch(fetchPhienBauCuById(Number(idPhien))).unwrap();
        if (fetchedPhienBauCu?.cuocBauCuId) {
          await dispatch(fetchCuocBauCuById(fetchedPhienBauCu.cuocBauCuId));
        }

        // Fetch related data
        await Promise.all([
          dispatch(fetchViTriUngCuByPhienBauCuId(Number(idPhien))),
          dispatch(fetchUngCuVienByPhienBauCuId(Number(idPhien))),
          dispatch(fetchCuTriByPhienBauCuId(Number(idPhien))),
        ]);
      } catch (error) {
        console.error('[DEBUG] Error fetching phien bau cu data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [dispatch, idPhien]);

  // Initial data fetch
  useEffect(() => {
    fetchPhienBauCuData();
  }, [fetchPhienBauCuData]);

  // Navigate back
  const handleGoBack = useCallback(() => {
    if (cuocBauCu) {
      navigate(`/app/elections/${cuocBauCu.id}`);
    } else {
      navigate(-1);
    }
  }, [cuocBauCu, navigate]);

  // Kiểm tra người dùng có phải cử tri hợp lệ cho phiên bầu cử này không
  const checkVoterEligibility = useCallback(
    async (userId: number, phienBauCuId: number): Promise<CheckVoterEligibilityResult> => {
      try {
        // Kiểm tra user có trong danh sách cử tri không
        const voter = cuTriList.find((v) => v.taiKhoanId === userId);

        // Nếu không có trong danh sách cử tri
        if (!voter) {
          return {
            isEligible: false,
            message: 'Bạn không có trong danh sách cử tri của phiên bầu cử này.',
          };
        }

        // Kiểm tra xem cử tri đã xác minh chưa
        if (!voter.xacMinh) {
          return {
            isEligible: false,
            message: 'Bạn chưa được xác minh là cử tri hợp lệ. Vui lòng liên hệ ban tổ chức.',
          };
        }

        // Kiểm tra xem cử tri đã bỏ phiếu chưa
        if (voter.boPhieu) {
          return {
            isEligible: false,
            message: 'Bạn đã bỏ phiếu trong phiên bầu cử này.',
          };
        }

        // Kiểm tra phiên bầu cử đang diễn ra
        if (phienBauCu?.trangThai !== 'Đang diễn ra') {
          return {
            isEligible: false,
            message:
              phienBauCu?.trangThai === 'Sắp diễn ra'
                ? 'Phiên bầu cử chưa bắt đầu.'
                : 'Phiên bầu cử đã kết thúc.',
          };
        }

        // Mọi điều kiện đều thỏa mãn
        return { isEligible: true, message: 'Bạn có thể tham gia bỏ phiếu.' };
      } catch (error) {
        console.error('Lỗi khi kiểm tra tư cách cử tri:', error);
        return {
          isEligible: false,
          message: 'Có lỗi xảy ra khi kiểm tra tư cách cử tri. Vui lòng thử lại sau.',
        };
      }
    },
    [cuTriList, phienBauCu],
  );

  // Navigate to voting
  const handleParticipate = useCallback(async () => {
    navigate(`/app/elections/${cuocBauCu.id}/session/${idPhien}/participate`);
    console.log('Navigate to voting page', idPhien, cuocBauCu?.id);

    // if (!user) {
    //   // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
    //   toast({
    //     title: 'Yêu cầu đăng nhập',
    //     description: 'Vui lòng đăng nhập để tham gia bỏ phiếu.',
    //     variant: 'default',
    //   });

    //   navigate('/login', {
    //     state: {
    //       returnUrl: `/app/elections/${cuocBauCu?.id}/session/${idPhien}`,
    //     },
    //   });
    //   return;
    // }

    // // Kiểm tra phiên bầu cử có đang diễn ra không
    // if (phienBauCu?.trangThai !== 'Đang diễn ra') {
    //   toast({
    //     title: 'Không thể tham gia',
    //     description:
    //       phienBauCu?.trangThai === 'Sắp diễn ra'
    //         ? 'Phiên bầu cử chưa bắt đầu.'
    //         : 'Phiên bầu cử đã kết thúc.',
    //     variant: 'destructive',
    //   });
    //   return;
    // }

    // setIsCheckingEligibility(true);

    // try {
    //   // Kiểm tra người dùng có phải cử tri hợp lệ
    //   const eligibilityResult = await checkVoterEligibility(user.id, Number(idPhien));

    //   if (!eligibilityResult.isEligible) {
    //     toast({
    //       title: 'Không thể tham gia bỏ phiếu',
    //       description: eligibilityResult.message,
    //       variant: 'destructive',
    //     });
    //     setIsCheckingEligibility(false);
    //     return;
    //   }

    //   // Người dùng đủ điều kiện, điều hướng đến trang bỏ phiếu
    //   if (cuocBauCu && idPhien) {
    //     navigate(`/app/elections/${cuocBauCu.id}/session/${idPhien}/participate`);
    //   } else {
    //     toast({
    //       title: 'Lỗi điều hướng',
    //       description: 'Không thể xác định cuộc bầu cử hoặc phiên bầu cử.',
    //       variant: 'destructive',
    //     });
    //   }
    // } catch (error) {
    //   console.error('Lỗi khi kiểm tra tư cách cử tri:', error);
    //   toast({
    //     title: 'Đã xảy ra lỗi',
    //     description: 'Không thể kiểm tra tư cách cử tri. Vui lòng thử lại sau.',
    //     variant: 'destructive',
    //   });
    // } finally {
    //   setIsCheckingEligibility(false);
    // }
  }, [cuocBauCu, idPhien, navigate, user, phienBauCu, checkVoterEligibility, toast]);

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'Không xác định';

      // Simply return the original Vietnamese date format string
      return dateString;
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Fetch images for candidates
  useEffect(() => {
    ungCuVienList.forEach((candidate) => {
      if (candidate.anh && !imagesMap[candidate.id]) {
        dispatch(fetchImageUngCuVien(candidate.id));
      }

      // Fetch blockchain addresses if not already available
      if (!blockchainAddresses[candidate.id]) {
        dispatch(fetchBlockchainAddress(candidate.id));
      }
    });
  }, [dispatch, ungCuVienList, imagesMap, blockchainAddresses]);

  // Calculate time info
  const getTimeInfo = () => {
    if (!phienBauCu) return null;

    const now = new Date();
    const startDate = parseVietnameseDate(phienBauCu.ngayBatDau);
    const endDate = parseVietnameseDate(phienBauCu.ngayKetThuc);

    const timeRemaining = {
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

  // Group candidates by position
  const candidatesByPosition = React.useMemo(() => {
    const groups: Record<string, typeof ungCuVienList> = { all: [] };

    viTriUngCuList.forEach((position) => {
      groups[position.id.toString()] = [];
    });

    ungCuVienList.forEach((candidate) => {
      if (candidate.viTriUngCuId) {
        const positionId = candidate.viTriUngCuId.toString();
        if (groups[positionId]) {
          groups[positionId].push(candidate);
        } else {
          groups.all.push(candidate);
        }
      } else {
        groups.all.push(candidate);
      }
      // Also add to 'all' group
      groups.all.push(candidate);
    });

    return groups;
  }, [ungCuVienList, viTriUngCuList]);

  // Filter candidates based on search and position
  const filteredCandidates = React.useMemo(() => {
    let filtered =
      selectedPosition === 'all'
        ? [...ungCuVienList]
        : ungCuVienList.filter((c) => c.viTriUngCuId?.toString() === selectedPosition);

    if (searchTerm) {
      filtered = filtered.filter((c) => c.hoTen.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return filtered;
  }, [ungCuVienList, selectedPosition, searchTerm]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const verifiedVoters = cuTriList.filter((voter) => voter.xacMinh).length;
    const totalVoters = cuTriList.length;
    const participationRate =
      totalVoters > 0 ? Math.round((verifiedVoters / totalVoters) * 100) : 0;

    const votedCount = cuTriList.filter((voter) => voter.boPhieu).length;
    const votedRate = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

    const candidatesWithBlockchain = ungCuVienList.filter(
      (candidate) => candidate.hasBlockchainWallet || candidate.blockchainAddress,
    ).length;
    const blockchainRate =
      ungCuVienList.length > 0
        ? Math.round((candidatesWithBlockchain / ungCuVienList.length) * 100)
        : 0;

    return {
      totalVoters,
      verifiedVoters,
      participationRate,
      votedCount,
      votedRate,
      totalCandidates: ungCuVienList.length,
      candidatesWithBlockchain,
      blockchainRate,
      totalPositions: viTriUngCuList.length,
    };
  }, [cuTriList, ungCuVienList, viTriUngCuList]);

  const timeInfo = getTimeInfo();

  // Get position name by ID
  const getPositionName = (positionId?: number) => {
    if (!positionId) return 'Chưa phân loại';
    const position = viTriUngCuList.find((pos) => pos.id === positionId);
    return position ? position.tenViTriUngCu : 'Chưa phân loại';
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
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
      </div>
    );
  }

  // Error state if no phien bau cu data
  if (!phienBauCu && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span
            className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => navigate('/app')}
          >
            Trang chủ
          </span>
          <ChevronRight className="h-4 w-4" />
          <span
            className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={handleGoBack}
          >
            {cuocBauCu?.tenCuocBauCu || 'Cuộc bầu cử'}
          </span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-700 dark:text-gray-200 font-medium">
            Chi tiết phiên bầu cử
          </span>
        </div>

        {/* Header with background */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-xl overflow-hidden shadow-xl mb-6">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div className="relative p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-shadow">
                  {phienBauCu?.tenPhienBauCu}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-transparent">
                    {getStatusIcon()}
                    {phienBauCu?.trangThai}
                  </Badge>

                  <span className="inline-flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1.5 opacity-80" />
                    <span>
                      {formatDate(phienBauCu?.ngayBatDau)} - {formatDate(phienBauCu?.ngayKetThuc)}
                    </span>
                  </span>
                </div>

                <p className="text-white/80 max-w-2xl">
                  {phienBauCu?.moTa || 'Không có thông tin mô tả chi tiết cho phiên bầu cử này.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                  onClick={handleGoBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>

                {timeInfo?.isActive && (
                  <Button
                    className="bg-white text-blue-700 hover:bg-gray-100 w-full sm:w-auto shadow-lg"
                    onClick={handleParticipate}
                    disabled={isCheckingEligibility}
                  >
                    {isCheckingEligibility ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <Vote className="mr-2 h-4 w-4" />
                        Tham gia bỏ phiếu
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Time progress indicator */}
            {timeInfo?.isActive && (
              <div className="mt-6 max-w-xl">
                <div className="flex justify-between text-xs mb-1">
                  <span>Tiến độ</span>
                  <span>{timeInfo.percentComplete}% hoàn thành</span>
                </div>
                <Progress value={timeInfo.percentComplete} className="h-2 bg-white/20" />
                <div className="mt-1 text-xs text-right opacity-80">
                  Còn lại: {timeInfo.days} ngày, {timeInfo.hours} giờ, {timeInfo.minutes} phút
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status indicators */}
        {timeInfo?.isUpcoming && (
          <Alert className="mb-6 bg-blue-50/90 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 backdrop-blur-sm">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">
              Phiên bầu cử sắp diễn ra
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              Phiên bầu cử sẽ bắt đầu sau {timeInfo.days} ngày, {timeInfo.hours} giờ,{' '}
              {timeInfo.minutes} phút. Hãy sẵn sàng tham gia!
            </AlertDescription>
          </Alert>
        )}

        {timeInfo?.isCompleted && (
          <Alert className="mb-6 bg-gray-50/90 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
            <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <AlertTitle className="text-gray-800 dark:text-gray-300">
              Phiên bầu cử đã kết thúc
            </AlertTitle>
            <AlertDescription className="text-gray-700 dark:text-gray-400">
              Phiên bầu cử này đã hoàn tất. Xem kết quả để biết thêm chi tiết.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-200 dark:border-gray-700/30 p-1 rounded-xl">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <Layout className="mr-2 h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <Award className="mr-2 h-4 w-4" />
              Vị trí ứng cử
            </TabsTrigger>
            <TabsTrigger
              value="candidates"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <User className="mr-2 h-4 w-4" />
              Ứng viên
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left column */}
              <div className="md:col-span-8 space-y-6">
                {/* Session description card */}
                <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                      <Info className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Thông tin phiên bầu cử
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 text-base">
                      {phienBauCu?.moTa || 'Không có mô tả cho phiên bầu cử này.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Thời gian
                        </h3>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-gray-900 dark:text-white break-words">
                            {formatDate(phienBauCu?.ngayBatDau)} -{' '}
                            {formatDate(phienBauCu?.ngayKetThuc)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Trạng thái
                        </h3>
                        <div className="flex items-center mt-1">
                          {getStatusIcon()}
                          <span
                            className={`font-medium ${
                              phienBauCu?.trangThai === 'Đang diễn ra'
                                ? 'text-green-600 dark:text-green-400'
                                : phienBauCu?.trangThai === 'Sắp diễn ra'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {phienBauCu?.trangThai || 'Không xác định'}
                          </span>
                        </div>
                      </div>

                      {phienBauCu?.blockchainAddress && (
                        <div className="sm:col-span-2">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Địa chỉ blockchain
                          </h3>
                          <div className="flex items-center mt-1">
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-gray-800 dark:text-gray-300 mr-2 flex-grow truncate">
                              {phienBauCu.blockchainAddress}
                            </code>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7"
                                    onClick={() =>
                                      window.open(
                                        `https://explorer.holihu.online/address/${phienBauCu.blockchainAddress}`,
                                        '_blank',
                                      )
                                    }
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Xem
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Xem trên HoLiHu Explorer</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  {timeInfo?.isActive && (
                    <CardFooter className="bg-blue-50 dark:bg-blue-900/10 pt-4 pb-4 border-t border-blue-100 dark:border-blue-800/20">
                      <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <p className="text-blue-800 dark:text-blue-300 text-sm">
                          Phiên bầu cử đang diễn ra. Hãy tham gia bỏ phiếu ngay bây giờ!
                        </p>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 text-white"
                          onClick={handleParticipate}
                          disabled={isCheckingEligibility}
                        >
                          {isCheckingEligibility ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang kiểm tra...
                            </>
                          ) : (
                            <>
                              <Vote className="mr-2 h-4 w-4" />
                              Tham gia bỏ phiếu
                            </>
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>

                {/* Statistics cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vị trí ứng cử</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.totalPositions}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ứng viên</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {stats.totalCandidates}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cử tri</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {stats.totalVoters}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Featured Candidates */}
                <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <User className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Ứng viên tiêu biểu
                      </CardTitle>
                      <Button
                        variant="ghost"
                        className="text-blue-600 dark:text-blue-400 p-0 h-auto"
                        onClick={() => setActiveTab('candidates')}
                      >
                        Xem tất cả
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {ungCuVienList.slice(0, 3).map((candidate) => (
                        <motion.div
                          key={candidate.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-lg bg-gray-50 dark:bg-gray-800/50 overflow-hidden border border-gray-200 dark:border-gray-700"
                        >
                          <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 relative">
                            {imagesMap[candidate.id] ? (
                              <img
                                src={imagesMap[candidate.id]}
                                alt={`Ảnh của ${candidate.hoTen}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <User className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                              {candidate.hoTen}
                            </h3>
                            <Badge
                              variant="outline"
                              className="mt-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300"
                            >
                              {getPositionName(candidate.viTriUngCuId)}
                            </Badge>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {candidate.moTa || 'Không có thông tin mô tả'}
                            </p>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 p-0 h-auto text-blue-600 dark:text-blue-400"
                              onClick={() => setActiveTab('candidates')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Chi tiết
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>

                  {/* CTA để tham gia bỏ phiếu */}
                  {timeInfo?.isActive && (
                    <CardFooter className="bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-900/10 dark:to-purple-900/10 border-t border-blue-100/50 dark:border-blue-800/30 p-4">
                      <div className="w-full text-center">
                        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
                          Sẵn sàng tham gia bỏ phiếu?
                        </h3>
                        <p className="text-blue-700 dark:text-blue-400 mb-4">
                          Hãy tham gia bỏ phiếu cho ứng viên bạn ủng hộ. Mỗi lá phiếu đều quan
                          trọng!
                        </p>
                        <Button
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={handleParticipate}
                          disabled={isCheckingEligibility}
                        >
                          {isCheckingEligibility ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang kiểm tra...
                            </>
                          ) : (
                            <>
                              <Vote className="mr-2 h-4 w-4" />
                              Tham gia bỏ phiếu
                            </>
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>

              {/* Right sidebar */}
              <div className="md:col-span-4 space-y-6">
                {/* Action Card */}
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 text-white overflow-hidden border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      {timeInfo?.isActive ? (
                        <>
                          <Vote className="h-16 w-16 mb-4 opacity-90" />
                          <h3 className="text-xl font-bold mb-2">Bỏ phiếu của bạn</h3>
                          <p className="opacity-90 mb-4">
                            Tham gia phiên bầu cử để lựa chọn ứng viên bạn ủng hộ!
                          </p>
                          <Button
                            className="w-full bg-white text-blue-700 hover:bg-gray-100"
                            onClick={handleParticipate}
                            disabled={isCheckingEligibility}
                          >
                            {isCheckingEligibility ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang kiểm tra...
                              </>
                            ) : (
                              <>
                                <Vote className="mr-2 h-4 w-4" />
                                Tham gia ngay
                              </>
                            )}
                          </Button>
                        </>
                      ) : timeInfo?.isUpcoming ? (
                        <>
                          <Clock className="h-16 w-16 mb-4 opacity-90" />
                          <h3 className="text-xl font-bold mb-2">Phiên bầu cử sắp diễn ra</h3>
                          <p className="opacity-90 mb-4">
                            Chuẩn bị sẵn sàng cho phiên bầu cử sắp diễn ra!
                          </p>
                          <Badge className="text-lg py-1.5 bg-white/20">
                            <Clock className="mr-2 h-4 w-4" />
                            Còn {timeInfo.days} ngày, {timeInfo.hours} giờ
                          </Badge>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-16 w-16 mb-4 opacity-90" />
                          <h3 className="text-xl font-bold mb-2">Phiên bầu cử đã kết thúc</h3>
                          <p className="opacity-90 mb-4">
                            Phiên bầu cử đã kết thúc. Cảm ơn đã tham gia!
                          </p>
                          <Button
                            className="w-full bg-white text-blue-700 hover:bg-gray-100"
                            onClick={() =>
                              navigate(
                                `/app/user-elections/elections/${cuocBauCu?.id}/session/${idPhien}/results`,
                              )
                            }
                          >
                            <BarChart2 className="mr-2 h-4 w-4" />
                            Xem kết quả
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Participation Statistics */}
                <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                      Thống kê tham gia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Cử tri đã xác thực
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                          {stats.verifiedVoters}/{stats.totalVoters} ({stats.participationRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${stats.participationRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Đã bỏ phiếu
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                          {stats.votedCount}/{stats.totalVoters} ({stats.votedRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: `${stats.votedRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Ứng viên có ví blockchain
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                          {stats.candidatesWithBlockchain}/{stats.totalCandidates} (
                          {stats.blockchainRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full"
                          style={{ width: `${stats.blockchainRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Positions List */}
                <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <Award className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                        Vị trí ứng cử
                      </CardTitle>
                      <Button
                        variant="ghost"
                        className="text-blue-600 dark:text-blue-400 p-0 h-auto"
                        onClick={() => setActiveTab('positions')}
                      >
                        Xem tất cả
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {viTriUngCuList.slice(0, 3).map((position) => {
                        const candidateCount =
                          candidatesByPosition[position.id.toString()]?.length || 0;
                        return (
                          <div
                            key={position.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50"
                          >
                            <div className="flex items-center">
                              <Award className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {position.tenViTriUngCu}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            >
                              {candidateCount} ứng viên
                            </Badge>
                          </div>
                        );
                      })}

                      {viTriUngCuList.length === 0 && (
                        <div className="text-center py-6">
                          <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Chưa có vị trí ứng cử nào
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Voter Eligibility Card - Chỉ hiển thị khi phiên đang diễn ra */}
                {timeInfo?.isActive && (
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-100/50 dark:border-blue-800/30 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <Lock className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Tư cách cử tri
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        Để tham gia bỏ phiếu trong phiên bầu cử này, bạn cần:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        <li>Có trong danh sách cử tri</li>
                        <li>Đã được xác minh là cử tri hợp lệ</li>
                        <li>Chưa bỏ phiếu trong phiên bầu cử này</li>
                      </ul>
                      <div className="pt-2">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 text-white"
                          onClick={handleParticipate}
                          disabled={isCheckingEligibility}
                        >
                          {isCheckingEligibility ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang kiểm tra tư cách cử tri...
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Kiểm tra và tham gia
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="positions"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Award className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                  Các vị trí ứng cử
                </CardTitle>
                <CardDescription>
                  Danh sách các vị trí cần bầu chọn trong phiên bầu cử này
                </CardDescription>
              </CardHeader>
              <CardContent>
                {viTriUngCuList.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-medium">Tên vị trí</TableHead>
                          <TableHead className="font-medium">Mô tả</TableHead>
                          <TableHead className="font-medium text-right">Số phiếu tối đa</TableHead>
                          <TableHead className="font-medium text-right">Số ứng viên</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viTriUngCuList.map((position) => {
                          const candidateCount =
                            candidatesByPosition[position.id.toString()]?.length || 0;
                          return (
                            <TableRow
                              key={position.id}
                              className="group hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <Award className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                                  {position.tenViTriUngCu}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-md truncate">
                                  {position.moTa || 'Không có mô tả'}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30"
                                >
                                  {position.soPhieuToiDa} phiếu
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className={`
                                    ${
                                      candidateCount === 0
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/30'
                                        : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/30'
                                    }
                                  `}
                                >
                                  {candidateCount} ứng viên
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Chưa có vị trí ứng cử
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Phiên bầu cử này chưa có vị trí ứng cử nào được thiết lập.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Position cards */}
            {viTriUngCuList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {viTriUngCuList.map((position) => {
                  const candidateCount = candidatesByPosition[position.id.toString()]?.length || 0;
                  const usage =
                    position.soPhieuToiDa > 0
                      ? Math.round((candidateCount / position.soPhieuToiDa) * 100)
                      : 0;

                  // Determine color based on usage percentage
                  let progressColor = 'bg-green-500';
                  if (usage > 80) progressColor = 'bg-red-500';
                  else if (usage > 50) progressColor = 'bg-yellow-500';

                  return (
                    <Card
                      key={position.id}
                      className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="font-bold flex items-center">
                          <Award className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                          {position.tenViTriUngCu}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {position.moTa || 'Không có mô tả'}
                        </p>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Số phiếu tối đa:
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                            >
                              {position.soPhieuToiDa}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Số ứng viên:
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300"
                            >
                              {candidateCount}
                            </Badge>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500 dark:text-gray-400">
                                Mức độ sử dụng:
                              </span>
                              <span
                                className={`
                                ${
                                  usage > 80
                                    ? 'text-red-600 dark:text-red-400'
                                    : usage > 50
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-green-600 dark:text-green-400'
                                }
                              `}
                              >
                                {usage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`${progressColor} h-2 rounded-full`}
                                style={{ width: `${usage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto text-blue-600 dark:text-blue-400"
                          onClick={() => {
                            setActiveTab('candidates');
                            setSelectedPosition(position.id.toString());
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem ứng viên
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="candidates"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <Card className="bg-white/90 dark:bg-[#162A45]/90 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] overflow-hidden mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <User className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Danh sách ứng viên
                </CardTitle>
                <CardDescription>Ứng viên tham gia trong phiên bầu cử này</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="relative flex-grow max-w-md">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                      size={18}
                    />
                    <Input
                      type="text"
                      placeholder="Tìm kiếm ứng viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-[#1A2942]/80"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-white dark:bg-[#1A2942]/80 border-gray-200 dark:border-[#2A3A5A]"
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Vị trí
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-[#1A2942] border-gray-200 dark:border-[#2A3A5A]">
                      <DropdownMenuItem
                        className={`${selectedPosition === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                        onClick={() => setSelectedPosition('all')}
                      >
                        Tất cả vị trí
                      </DropdownMenuItem>
                      <Separator className="my-1 bg-gray-200 dark:bg-gray-700" />
                      {viTriUngCuList.map((position) => (
                        <DropdownMenuItem
                          key={position.id}
                          className={`${selectedPosition === position.id.toString() ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                          onClick={() => setSelectedPosition(position.id.toString())}
                        >
                          <Award className="mr-2 h-4 w-4" />
                          {position.tenViTriUngCu}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A] rounded-md p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 ${viewMode === 'grid' ? 'bg-white dark:bg-[#243656] shadow-sm' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 ${viewMode === 'list' ? 'bg-white dark:bg-[#243656] shadow-sm' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {filteredCandidates.length > 0 ? (
                  <AnimatePresence>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCandidates.map((candidate) => (
                          <motion.div
                            key={candidate.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CardUngVienXemChiTiet
                              candidate={candidate}
                              getPositionName={getPositionName}
                              showBlockchainInfo={true}
                            />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-[#1A2942]">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Ứng viên
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Vị trí ứng cử
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Mô tả
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Ví Blockchain
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-800">
                            {filteredCandidates.map((candidate) => (
                              <tr
                                key={candidate.id}
                                className="hover:bg-gray-50 dark:hover:bg-[#1A2942]/50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                      {imagesMap[candidate.id] ? (
                                        <img
                                          src={imagesMap[candidate.id]}
                                          alt={`Ảnh của ${candidate.hoTen}`}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                          <User size={16} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {candidate.hoTen}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        ID: {candidate.id}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge
                                    variant="outline"
                                    className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/30"
                                  >
                                    {getPositionName(candidate.viTriUngCuId)}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-900 dark:text-gray-300 line-clamp-2">
                                    {candidate.moTa || 'Chưa có mô tả'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {blockchainAddresses[candidate.id] ? (
                                    <div className="flex items-center">
                                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono truncate max-w-[120px]">
                                        {blockchainAddresses[candidate.id]}
                                      </code>
                                      <a
                                        href={`https://explorer.holihu.online/address/${blockchainAddresses[candidate.id]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 text-blue-500"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                                      <Wallet size={12} className="mr-1" />
                                      Chưa có thông tin
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-16 w-16 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      Không tìm thấy ứng viên
                    </h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      {searchTerm
                        ? 'Không tìm thấy ứng viên phù hợp với từ khóa đã nhập'
                        : 'Phiên bầu cử này chưa có ứng viên nào được đăng ký'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hiển thị ứng viên theo vị trí */}
            {!searchTerm && selectedPosition === 'all' && viTriUngCuList.length > 0 && (
              <div className="space-y-8">
                {viTriUngCuList.map((position) => {
                  const candidates = candidatesByPosition[position.id.toString()] || [];
                  if (candidates.length === 0) return null;

                  return (
                    <div key={position.id} className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          <Award className="inline-block mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                          {position.tenViTriUngCu}
                        </h2>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          {candidates.length} ứng viên
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {candidates.map((candidate) => (
                          <motion.div
                            key={candidate.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CardUngVienXemChiTiet
                              candidate={candidate}
                              getPositionName={getPositionName}
                              showBlockchainInfo={true}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Call to Action - only show if election is active */}
            {timeInfo?.isActive && (
              <Alert className="bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-900/10 dark:to-purple-900/10 border-blue-200 dark:border-blue-800/50 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-800 dark:text-blue-300 text-lg font-bold">
                  Tham gia bỏ phiếu
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                  <p className="mb-4">
                    Phiên bầu cử đang diễn ra. Hãy tham gia bỏ phiếu cho ứng viên bạn ủng hộ. Mỗi lá
                    phiếu của bạn đều quan trọng trong việc xây dựng tương lai chung!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <Button
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleParticipate}
                      disabled={isCheckingEligibility}
                    >
                      {isCheckingEligibility ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang kiểm tra...
                        </>
                      ) : (
                        <>
                          <Vote className="mr-2 h-4 w-4" />
                          Tham gia bỏ phiếu
                        </>
                      )}
                    </Button>

                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      Còn lại: {timeInfo.days} ngày, {timeInfo.hours} giờ, {timeInfo.minutes} phút
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default XemChiTietPhienBauCu;
