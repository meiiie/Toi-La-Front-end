'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Calendar,
  Filter,
  Trash2,
  BarChart2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  PlusCircle,
  List,
  Grid,
  Zap,
  Shield,
  Sparkles,
} from 'lucide-react';

import type { RootState, AppDispatch } from '../store/store';
import {
  fetchCuocBauCuByTaiKhoanId,
  removeCuocBauCu,
  resetCuocBauCuState, // Import action reset cho cuocBauCuSlice
} from '../store/slice/cuocBauCuSlice';
import { resetCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice'; // Import action reset cho cuocBauCuByIdSlice
import { resetCuocBauCuImageState } from '../store/slice/cuocBauCuImageSlice'; // Import action reset cho cuocBauCuImageSlice
import type { CuocBauCu } from '../store/types';
import { TrangThaiBlockchain } from '../store/types';

import CardQuanLyCuocBauCu from '../features/CardQuanLyCuocBauCu';
import DanhSachCuocBauCu from '../features/DanhSachCuocBauCu';
import PaginationPhu from '../components/pagination-phu';
import SEO from '../components/SEO';

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/AlterDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/Popover';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

const UserElectionsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Lấy thông tin người dùng từ Redux store
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  // Lấy danh sách cuộc bầu cử của người dùng từ Redux store
  const elections = useSelector((state: RootState) => state.cuocBauCu.cacCuocBauCuNguoiDung);
  const isLoading = useSelector((state: RootState) => state.cuocBauCu.dangTai);

  // State cho UI
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [electionToDelete, setElectionToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBlockchain, setFilterBlockchain] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Theme detection
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const itemsPerPage = 6;

  // Kiểm tra theme từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('dark');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }

    // Lắng nghe sự kiện thay đổi theme
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('dark');
      if (currentTheme === 'light' || currentTheme === 'dark') {
        setTheme(currentTheme);
      }
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  // Fetch cuộc bầu cử của người dùng khi component mount hoặc khi user thay đổi
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCuocBauCuByTaiKhoanId(user.id));
      console.log(user.id);
    }

    // Cleanup function khi component unmount
    return () => {
      // Reset tất cả các state khi người dùng rời khỏi trang
      dispatch(resetCuocBauCuState());
      dispatch(resetCuocBauCuById());
      dispatch(resetCuocBauCuImageState());
    };
  }, [user, dispatch]);

  // Xử lý xóa cuộc bầu cử
  const handleDeleteElection = async () => {
    if (electionToDelete !== null) {
      try {
        await dispatch(removeCuocBauCu(electionToDelete));
        setShowDeleteModal(false);
        setElectionToDelete(null);
      } catch (error) {
        console.error('Lỗi khi xóa cuộc bầu cử:', error);
      }
    }
  };

  // Xử lý tạo cuộc bầu cử mới
  const handleCreateElection = () => {
    // Reset các state liên quan trước khi chuyển trang để tránh lỗi dữ liệu cũ
    dispatch(resetCuocBauCuById());
    dispatch(resetCuocBauCuImageState());
    navigate('/app/tao-phien-bau-cu');
  };

  // Xác định trạng thái cuộc bầu cử dựa trên thời gian
  const getElectionStatus = (election: CuocBauCu) => {
    const now = new Date();
    const startDate = new Date(election.ngayBatDau);
    const endDate = new Date(election.ngayKetThuc);

    if (now < startDate) return 'chuaBatDau';
    if (now > endDate) return 'daKetThuc';
    return 'dangDienRa';
  };

  // Lọc danh sách cuộc bầu cử
  const filteredElections = useMemo(() => {
    return elections.filter((election) => {
      // Tìm kiếm theo tên
      const matchesSearch = election.tenCuocBauCu.toLowerCase().includes(searchTerm.toLowerCase());

      // Lọc theo trạng thái thời gian
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        const status = getElectionStatus(election);
        matchesStatus = status === filterStatus;
      }

      // Lọc theo trạng thái blockchain
      let matchesBlockchain = true;
      if (filterBlockchain !== 'all') {
        const blockchainStatus =
          election.trangThaiBlockchain !== undefined
            ? election.trangThaiBlockchain.toString()
            : '0';
        matchesBlockchain = blockchainStatus === filterBlockchain;
      }

      // Lọc theo khoảng thời gian
      const matchesDateRange =
        (!startDate || new Date(election.ngayBatDau) >= new Date(startDate)) &&
        (!endDate || new Date(election.ngayKetThuc) <= new Date(endDate));

      return matchesSearch && matchesStatus && matchesBlockchain && matchesDateRange;
    });
  }, [elections, searchTerm, filterStatus, filterBlockchain, startDate, endDate]);

  // Tính toán tổng số trang
  const totalPages = useMemo(
    () => Math.ceil(filteredElections.length / itemsPerPage),
    [filteredElections.length],
  );

  // Phân trang danh sách cuộc bầu cử
  const paginatedElections = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredElections.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredElections]);

  // Xử lý thay đổi tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Xử lý thay đổi bộ lọc trạng thái
  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  // Xử lý thay đổi bộ lọc blockchain
  const handleBlockchainFilterChange = (value: string) => {
    setFilterBlockchain(value);
    setCurrentPage(1);
  };

  // Xử lý thay đổi ngày bắt đầu
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };

  // Xử lý thay đổi ngày kết thúc
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
  };

  // Xử lý reset bộ lọc
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterBlockchain('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Tính toán số lượng cuộc bầu cử theo trạng thái
  const electionStats = useMemo(() => {
    const stats = {
      total: elections.length,
      upcoming: 0,
      active: 0,
      completed: 0,
      blockchain: {
        notDeployed: 0,
        deploying: 0,
        deployed: 0,
        failed: 0,
      },
    };

    elections.forEach((election) => {
      const status = getElectionStatus(election);
      if (status === 'chuaBatDau') stats.upcoming++;
      else if (status === 'dangDienRa') stats.active++;
      else if (status === 'daKetThuc') stats.completed++;

      // Tính toán số lượng theo trạng thái blockchain
      const blockchainStatus =
        election.trangThaiBlockchain !== undefined
          ? election.trangThaiBlockchain
          : TrangThaiBlockchain.ChuaTrienKhai;

      switch (blockchainStatus) {
        case TrangThaiBlockchain.ChuaTrienKhai:
          stats.blockchain.notDeployed++;
          break;
        case TrangThaiBlockchain.DangTrienKhai:
          stats.blockchain.deploying++;
          break;
        case TrangThaiBlockchain.DaTrienKhai:
          stats.blockchain.deployed++;
          break;
        case TrangThaiBlockchain.TrienKhaiThatBai:
          stats.blockchain.failed++;
          break;
      }
    });

    return stats;
  }, [elections]);

  // Tạo hiệu ứng cho các phần tử khi xuất hiện
  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <SEO
        title="Cuộc Bầu Cử Của Tôi | Nền Tảng Bầu Cử Blockchain"
        description="Trang quản lý các cuộc bầu cử của người dùng."
        keywords="bầu cử, quản lý bầu cử, cuộc bầu cử của tôi, blockchain"
        author="Blockchain Vote"
        image="/images/og-image.jpg"
        url={window.location.href}
      />

      <div className="space-y-6">
        {/* Header with Neo-Futuristic style */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariant}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 to-blue-900/30 p-6 rounded-2xl border border-blue-900/30 shadow-lg"
        >
          <div className="relative">
            {/* Decorative element */}
            <div className="absolute -left-4 top-1/2 w-1 h-12 bg-blue-500 rounded-full transform -translate-y-1/2"></div>

            <h1 className="text-2xl md:text-3xl font-bold text-white ml-1">Cuộc bầu cử của tôi</h1>
            <p className="mt-1 text-blue-300 ml-1">
              Quản lý và theo dõi các cuộc bầu cử bạn đã tạo
            </p>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-[#0288D1] hover:bg-[#0277BD] text-white transition-all duration-300 rounded-xl group relative overflow-hidden shadow-lg shadow-blue-900/20"
                >
                  {/* Hiệu ứng ánh sáng khi hover */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tạo cuộc bầu cử mới
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 border border-blue-900 text-white">
                <p>Tạo một cuộc bầu cử mới</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* Stats Cards with Neo-Futuristic style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng số */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              ...fadeInUpVariant,
              visible: { ...fadeInUpVariant.visible, transition: { delay: 0.1, duration: 0.5 } },
            }}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-900/20 rounded-xl shadow-lg overflow-hidden group hover:shadow-blue-900/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-300">Tổng số</p>
                    <h3 className="text-2xl font-bold mt-1 text-white">
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 bg-gray-700" />
                      ) : (
                        electionStats.total
                      )}
                    </h3>
                  </div>
                  <div className="p-3 rounded-full bg-blue-900/30 group-hover:bg-blue-800/40 transition-colors duration-300">
                    <BarChart2 className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sắp diễn ra */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              ...fadeInUpVariant,
              visible: { ...fadeInUpVariant.visible, transition: { delay: 0.2, duration: 0.5 } },
            }}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-900/20 rounded-xl shadow-lg overflow-hidden group hover:shadow-blue-900/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-300">Sắp diễn ra</p>
                    <h3 className="text-2xl font-bold mt-1 text-white">
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 bg-gray-700" />
                      ) : (
                        electionStats.upcoming
                      )}
                    </h3>
                  </div>
                  <div className="p-3 rounded-full bg-indigo-900/30 group-hover:bg-indigo-800/40 transition-colors duration-300">
                    <Clock className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Đang diễn ra */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              ...fadeInUpVariant,
              visible: { ...fadeInUpVariant.visible, transition: { delay: 0.3, duration: 0.5 } },
            }}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-900/20 rounded-xl shadow-lg overflow-hidden group hover:shadow-blue-900/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-300">Đang diễn ra</p>
                    <h3 className="text-2xl font-bold mt-1 text-white">
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 bg-gray-700" />
                      ) : (
                        electionStats.active
                      )}
                    </h3>
                  </div>
                  <div className="p-3 rounded-full bg-emerald-900/30 group-hover:bg-emerald-800/40 transition-colors duration-300">
                    <Zap className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Đã kết thúc */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              ...fadeInUpVariant,
              visible: { ...fadeInUpVariant.visible, transition: { delay: 0.4, duration: 0.5 } },
            }}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-900/20 rounded-xl shadow-lg overflow-hidden group hover:shadow-blue-900/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-300">Đã kết thúc</p>
                    <h3 className="text-2xl font-bold mt-1 text-white">
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 bg-gray-700" />
                      ) : (
                        electionStats.completed
                      )}
                    </h3>
                  </div>
                  <div className="p-3 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors duration-300">
                    <CheckCircle className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Blockchain Stats Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            ...fadeInUpVariant,
            visible: { ...fadeInUpVariant.visible, transition: { delay: 0.5, duration: 0.5 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Tiêu đề phần Blockchain stats */}
          <div className="lg:col-span-4 flex items-center space-x-2 mt-2 mb-0">
            <Shield className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Trạng thái Blockchain</h2>
          </div>

          {/* Chưa triển khai */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-amber-900/20 rounded-xl shadow-lg overflow-hidden group hover:shadow-amber-900/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-300/80">Chưa triển khai</p>
                  <h3 className="text-2xl font-bold mt-1 text-white">
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 bg-gray-700" />
                    ) : (
                      electionStats.blockchain.notDeployed
                    )}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-amber-900/20 group-hover:bg-amber-800/30 transition-colors duration-300">
                  <Shield className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Đang triển khai */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-indigo-900/20 rounded-xl shadow-lg overflow-hidden group hover:shadow-indigo-900/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-300/80">Đang triển khai</p>
                  <h3 className="text-2xl font-bold mt-1 text-white">
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 bg-gray-700" />
                    ) : (
                      electionStats.blockchain.deploying
                    )}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-indigo-900/20 group-hover:bg-indigo-800/30 transition-colors duration-300">
                  <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Đã triển khai */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-emerald-900/20 rounded-xl shadow-lg overflow-hidden group hover:shadow-emerald-900/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-300/80">Đã triển khai</p>
                  <h3 className="text-2xl font-bold mt-1 text-white">
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 bg-gray-700" />
                    ) : (
                      electionStats.blockchain.deployed
                    )}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-emerald-900/20 group-hover:bg-emerald-800/30 transition-colors duration-300">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Triển khai thất bại */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-red-900/20 rounded-xl shadow-lg overflow-hidden group hover:shadow-red-900/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-300/80">Thất bại</p>
                  <h3 className="text-2xl font-bold mt-1 text-white">
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 bg-gray-700" />
                    ) : (
                      electionStats.blockchain.failed
                    )}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-red-900/20 group-hover:bg-red-800/30 transition-colors duration-300">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filter with Neo-Futuristic style */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            ...fadeInUpVariant,
            visible: { ...fadeInUpVariant.visible, transition: { delay: 0.6, duration: 0.5 } },
          }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-900/20 rounded-xl shadow-lg overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-1 h-8 bg-blue-500 rounded-b-full"></div>
            <div className="absolute top-0 right-0 w-8 h-1 bg-blue-500 rounded-l-full"></div>

            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-white flex items-center">
                <Search className="mr-2 h-5 w-5 text-blue-400" />
                Tìm kiếm và Lọc
              </CardTitle>
              <CardDescription className="text-blue-300">
                Tìm kiếm và lọc các cuộc bầu cử của bạn
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm cuộc bầu cử..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/30 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 rounded-xl group relative overflow-hidden"
                      >
                        {/* Hiệu ứng glow khi hover */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                        <Filter className="h-4 w-4 mr-2 text-blue-400" />
                        Bộ lọc
                        {(filterStatus !== 'all' ||
                          filterBlockchain !== 'all' ||
                          startDate ||
                          endDate) && (
                          <Badge
                            variant="secondary"
                            className="ml-2 bg-blue-900/50 text-blue-300 border border-blue-700"
                          >
                            Đang lọc
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 bg-gray-900 border-gray-700 text-white rounded-xl shadow-xl shadow-blue-900/20">
                      <div className="space-y-4">
                        <h4 className="font-medium text-blue-300 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Lọc theo trạng thái thời gian
                        </h4>
                        <Select value={filterStatus} onValueChange={handleFilterChange}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white rounded-xl">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white rounded-xl">
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="chuaBatDau">Sắp diễn ra</SelectItem>
                            <SelectItem value="dangDienRa">Đang diễn ra</SelectItem>
                            <SelectItem value="daKetThuc">Đã kết thúc</SelectItem>
                          </SelectContent>
                        </Select>

                        <h4 className="font-medium text-blue-300 flex items-center pt-2">
                          <Shield className="h-4 w-4 mr-2" />
                          Lọc theo trạng thái blockchain
                        </h4>
                        <Select
                          value={filterBlockchain}
                          onValueChange={handleBlockchainFilterChange}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white rounded-xl">
                            <SelectValue placeholder="Chọn trạng thái blockchain" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white rounded-xl">
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="0">Chưa triển khai</SelectItem>
                            <SelectItem value="1">Đang triển khai</SelectItem>
                            <SelectItem value="2">Đã triển khai</SelectItem>
                            <SelectItem value="3">Triển khai thất bại</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="space-y-2 pt-2">
                          <h4 className="font-medium text-blue-300 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Lọc theo thời gian
                          </h4>
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-blue-200">Từ ngày:</span>
                            </div>
                            <Input
                              type="date"
                              value={startDate}
                              onChange={handleStartDateChange}
                              className="bg-gray-800 border-gray-700 text-white rounded-xl"
                            />
                          </div>

                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-blue-200">Đến ngày:</span>
                            </div>
                            <Input
                              type="date"
                              value={endDate}
                              onChange={handleEndDateChange}
                              className="bg-gray-800 border-gray-700 text-white rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between pt-3">
                          <Button
                            variant="outline"
                            onClick={handleResetFilters}
                            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl"
                          >
                            Đặt lại
                          </Button>
                          <Button
                            onClick={() => setIsFilterOpen(false)}
                            className="bg-blue-700 hover:bg-blue-600 text-white rounded-xl"
                          >
                            Áp dụng
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="flex rounded-xl overflow-hidden border border-gray-700 divide-x divide-gray-700">
                    <Button
                      variant="ghost"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 rounded-none ${
                        viewMode === 'grid'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setViewMode('list')}
                      className={`px-3 rounded-none ${
                        viewMode === 'list'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            ...fadeInUpVariant,
            visible: { ...fadeInUpVariant.visible, transition: { delay: 0.7, duration: 0.5 } },
          }}
          className="flex justify-between items-center"
        >
          <p className="text-blue-300 flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-400 mr-2" />
            {isLoading ? (
              <Skeleton className="h-6 w-40 bg-gray-800" />
            ) : (
              `Hiển thị ${filteredElections.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - ${Math.min(
                currentPage * itemsPerPage,
                filteredElections.length,
              )} trong số ${filteredElections.length} cuộc bầu cử`
            )}
          </p>
        </motion.div>

        {/* Elections List/Grid with Neo-Futuristic styling */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            ...fadeInUpVariant,
            visible: { ...fadeInUpVariant.visible, transition: { delay: 0.8, duration: 0.5 } },
          }}
        >
          {isLoading ? (
            // Loading skeletons
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <Card
                      key={index}
                      className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-lg"
                    >
                      <div className="h-48 bg-gray-800 rounded-t-xl"></div>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2 bg-gray-800" />
                        <Skeleton className="h-4 w-1/2 bg-gray-800" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full bg-gray-800" />
                        <Skeleton className="h-4 w-full bg-gray-800" />
                        <Skeleton className="h-4 w-2/3 bg-gray-800" />
                      </CardContent>
                      <div className="p-6 pt-0 flex justify-between">
                        <Skeleton className="h-10 w-24 bg-gray-800" />
                        <Skeleton className="h-10 w-24 bg-gray-800" />
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <Card
                      key={index}
                      className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-lg"
                    >
                      <div className="p-4 flex justify-between items-center">
                        <div className="space-y-2 flex-grow">
                          <Skeleton className="h-6 w-1/3 bg-gray-800" />
                          <div className="flex space-x-4">
                            <Skeleton className="h-4 w-24 bg-gray-800" />
                            <Skeleton className="h-4 w-24 bg-gray-800" />
                            <Skeleton className="h-4 w-24 bg-gray-800" />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Skeleton className="h-10 w-24 bg-gray-800" />
                          <Skeleton className="h-10 w-10 bg-gray-800" />
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )
          ) : (
            <>
              {filteredElections.length === 0 ? (
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-lg p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-gray-800 mb-4">
                      <AlertTriangle className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">
                      Không tìm thấy cuộc bầu cử nào
                    </h3>
                    <p className="text-blue-300 mb-6">
                      Không có cuộc bầu cử nào phù hợp với tiêu chí tìm kiếm của bạn
                    </p>
                    <Button
                      onClick={handleResetFilters}
                      className="bg-blue-700 hover:bg-blue-600 text-white rounded-xl"
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                </Card>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {paginatedElections.map((election: CuocBauCu, index) => (
                      <motion.div
                        key={election.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: index * 0.1, duration: 0.3 },
                        }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardQuanLyCuocBauCu
                          election={election}
                          onDelete={() => {
                            setElectionToDelete(election.id);
                            setShowDeleteModal(true);
                          }}
                          theme="dark"
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {paginatedElections.map((election: CuocBauCu, index) => (
                      <motion.div
                        key={election.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          transition: { delay: index * 0.1, duration: 0.3 },
                        }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <DanhSachCuocBauCu
                          election={election}
                          onDelete={() => {
                            setElectionToDelete(election.id);
                            setShowDeleteModal(true);
                          }}
                          theme="dark"
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Pagination with Neo-Futuristic styling */}
        {filteredElections.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              ...fadeInUpVariant,
              visible: { ...fadeInUpVariant.visible, transition: { delay: 0.9, duration: 0.5 } },
            }}
            className="flex justify-center mt-8"
          >
            <PaginationPhu
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              theme="dark"
            />
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogContent className="bg-gray-900 border border-red-900/30 text-white rounded-xl backdrop-blur-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Xác nhận xóa
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Bạn có chắc chắn muốn xóa cuộc bầu cử này không? Hành động này không thể hoàn tác và
                sẽ xóa tất cả dữ liệu liên quan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 rounded-xl">
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteElection}
                className="bg-red-800 hover:bg-red-700 text-white rounded-xl border border-red-900"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Election Dialog */}
        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent className="bg-gray-900 border border-blue-900/30 text-white rounded-xl backdrop-blur-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                Tạo cuộc bầu cử mới
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Bạn sẽ được chuyển đến trang tạo cuộc bầu cử mới. Bạn có muốn tiếp tục không?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 rounded-xl">
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCreateElection}
                className="bg-blue-700 hover:bg-blue-600 text-white rounded-xl border border-blue-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tiếp tục
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default UserElectionsPage;
