'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
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
  Image,
  Book,
  PlusCircle,
  Search,
  ArrowUpRight,
  AlertCircle,
  Database,
} from 'lucide-react';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import { fetchCacPhienBauCuByCuocBauCuId, addPhienBauCu } from '../store/slice/phienBauCuSlice';
import { resetImageState, fetchImageUrl } from '../store/slice/cuocBauCuImageSlice';
import { fetchDieuLeByCuocBauCuId } from '../store/slice/dieuLeSlice';

// Components
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/Dropdown-Menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/AlterDialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import CardPhienBauCu from '../features/CardPhienBauCu';
import TaoPhienBauForm from '../features/TaoPhienBauForm';
import UploadAnh from '../test/UploadAnh';
import DieuLePage from './DieuLePage';
import type { PhienBauCu } from '../store/types';

// Blockchain components
import BlockchainIntegrationPanel from '../components/blockchain/BlockchainIntegrationPanel';
import BlockchainSyncButton from '../components/blockchain/BlockchainSyncButton';

const QuanLyCuocBauCuPage: React.FC = () => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showBlockchainTab, setShowBlockchainTab] = useState(false);

  // Redux store
  const { cuocBauCu, dangTai: dangTaiCuocBauCu } = useSelector(
    (state: RootState) => state.cuocBauCuById,
  );
  const {
    cacPhienBauCu,
    dangTai: dangTaiPhienBauCu,
    loi,
  } = useSelector((state: RootState) => state.phienBauCu);
  const { imageUrl, fileInfo } = useSelector((state: RootState) => state.cuocBauCuImage);
  const { dieuLeCuocBauCu } = useSelector((state: RootState) => state.dieuLe);

  // Parse Vietnamese date format (dd/mm/yyyy hh:mm)
  const parseVietnameseDate = (dateStr: string) => {
    if (!dateStr) return new Date();

    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    return new Date(+year, +month - 1, +day, +hour, +minute);
  };

  // Fetch election data
  useEffect(() => {
    if (cuocBauCuId) {
      dispatch(fetchCuocBauCuById(Number(cuocBauCuId)));
      dispatch(fetchCacPhienBauCuByCuocBauCuId(Number(cuocBauCuId)));
      dispatch(fetchImageUrl(Number(cuocBauCuId)));
      dispatch(fetchDieuLeByCuocBauCuId(Number(cuocBauCuId)));
    }

    // Cleanup function
    return () => {
      dispatch(resetImageState());
    };
  }, [dispatch, cuocBauCuId]);

  // Filter sessions based on search term
  const filteredSessions = useMemo(() => {
    return cacPhienBauCu.filter(
      (session) =>
        session.tenPhienBauCu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.trangThai?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [cacPhienBauCu, searchTerm]);

  // Handle search change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle create session
  const handleCreateSession = useCallback(
    async (newSession: PhienBauCu) => {
      await dispatch(addPhienBauCu(newSession));
      setIsCreateModalOpen(false);
      setSuccessMessage('Tạo phiên bầu cử thành công!');
    },
    [dispatch],
  );

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Navigate to blockchain deployment page
  const handleBlockchainDeployment = () => {
    if (cuocBauCuId) {
      navigate(`/app/user-elections/elections/${cuocBauCuId}/blockchain-deployment`);
    }
  };

  // Calculate election progress
  const calculateProgress = () => {
    if (!cuocBauCu) return 0;

    const now = new Date();
    const startDate = parseVietnameseDate(cuocBauCu.ngayBatDau);
    const endDate = parseVietnameseDate(cuocBauCu.ngayKetThuc);

    if (now < startDate) return 0;
    if (now > endDate) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    return Math.min(100, Math.round((elapsed / totalDuration) * 100));
  };

  // Get election status
  const getElectionStatus = () => {
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
  };

  // Get blockchain status
  const getBlockchainStatus = () => {
    if (!cuocBauCu || cuocBauCu.trangThaiBlockchain === undefined) {
      return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
    }

    switch (cuocBauCu.trangThaiBlockchain) {
      case 0:
        return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
      case 1:
        return {
          status: 'Đang triển khai',
          color: 'blue',
          icon: <Loader className="h-4 w-4 animate-spin" />,
        };
      case 2:
        return {
          status: 'Đã triển khai',
          color: 'green',
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case 3:
        return {
          status: 'Triển khai thất bại',
          color: 'red',
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!cuocBauCu) return { days: 0, hours: 0, minutes: 0 };

    const now = new Date();
    const endDate = parseVietnameseDate(cuocBauCu.ngayKetThuc);

    if (now > endDate) return { days: 0, hours: 0, minutes: 0 };

    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const electionStatus = getElectionStatus();
  const blockchainStatus = getBlockchainStatus();
  const timeRemaining = getTimeRemaining();
  const progress = calculateProgress();

  // Memoized TaoPhienBauForm
  const memoizedTaoPhienBauForm = useMemo(() => {
    return (
      <TaoPhienBauForm
        onCreateSession={handleCreateSession}
        cuocBauCuId={Number(cuocBauCuId)}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    );
  }, [handleCreateSession, cuocBauCuId, isCreateModalOpen]);

  // Loading state
  if (dangTaiCuocBauCu) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-md animate-pulse h-40"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-pulse h-32"></div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-pulse h-32"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-pulse h-64"></div>
      </div>
    );
  }

  // Error state
  if (!cuocBauCu && !dangTaiCuocBauCu) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            Không thể tải thông tin cuộc bầu cử. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'media':
        return <UploadAnh />;
      case 'rules':
        return (
          <div className="w-full h-full">
            <DieuLePage />
          </div>
        );
      case 'blockchain':
        return (
          <div className="space-y-6">
            <BlockchainIntegrationPanel cuocBauCuId={Number(cuocBauCuId)} cuocBauCu={cuocBauCu} />
          </div>
        );
      case 'sessions':
        return (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="relative w-full sm:w-auto flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  placeholder="Tìm kiếm phiên bầu cử..."
                  className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white w-full"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tạo Phiên Mới
                </Button>
                <BlockchainSyncButton
                  cuocBauCuId={Number(cuocBauCuId)}
                  variant="outline"
                  size="default"
                  className="flex-1 sm:flex-none"
                  onSyncComplete={() => {
                    if (cuocBauCuId) {
                      dispatch(fetchCuocBauCuById(Number(cuocBauCuId)));
                    }
                  }}
                />
              </div>
            </div>

            {dangTaiPhienBauCu ? (
              <div className="flex justify-center items-center h-64">
                <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">Đang tải...</span>
              </div>
            ) : loi && !loi.includes('Ten Phien Bau Cu Duoc Phep Dung') ? (
              loi.includes('Khong co phien bau cu nao') ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Không có phiên bầu cử</AlertTitle>
                  <AlertDescription>
                    Hiện tại chưa có phiên bầu cử nào cho cuộc bầu cử này. Hãy tạo phiên bầu cử mới
                    bằng cách nhấn nút "Tạo Phiên Mới".
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Lỗi</AlertTitle>
                  <AlertDescription>{loi}</AlertDescription>
                </Alert>
              )
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <CardPhienBauCu key={session.id} session={session} />
                ))}

                {filteredSessions.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex justify-center mb-4">
                      <Calendar className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Không tìm thấy phiên bầu cử
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchTerm
                        ? 'Không có phiên bầu cử nào phù hợp với tìm kiếm của bạn'
                        : 'Chưa có phiên bầu cử nào được tạo cho cuộc bầu cử này'}
                    </p>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tạo Phiên Mới
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        );
      default: // overview
        return (
          <>
            {/* Thẻ thông tin blockchain */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-3">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                      Blockchain Integration
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {blockchainStatus.status === 'Đã triển khai'
                        ? 'Cuộc bầu cử đã được triển khai thành công lên blockchain'
                        : 'Triển khai cuộc bầu cử lên blockchain để đảm bảo tính minh bạch và bất biến'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    onClick={handleBlockchainDeployment}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Triển Khai Blockchain
                  </Button>
                  {cuocBauCu?.trangThaiBlockchain === 2 && (
                    <BlockchainSyncButton
                      cuocBauCuId={Number(cuocBauCuId)}
                      variant="outline"
                      size="default"
                      className="flex-1 md:flex-none"
                      onSyncComplete={() => {
                        if (cuocBauCuId) {
                          dispatch(fetchCuocBauCuById(Number(cuocBauCuId)));
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Activity */}
            <div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-4">
                Hoạt động gần đây
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="w-0.5 h-full bg-blue-500/30"></div>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium">
                      Phiên bầu cử "Vòng 1" đã bắt đầu
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">12/01/2025 - 08:00</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="w-0.5 h-full bg-blue-500/30"></div>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium">
                      3 ứng cử viên mới đã được thêm vào
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">10/01/2025 - 14:30</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="w-0.5 h-full bg-blue-500/30"></div>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium">
                      Đã triển khai thành công lên blockchain
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">08/01/2025 - 10:15</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium">Đã tạo cuộc bầu cử</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">05/01/2025 - 09:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-4">
                Thao tác nhanh
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg h-auto py-3"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Tạo Phiên Mới</div>
                    <div className="text-xs opacity-90">Thêm phiên bầu cử mới</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg h-auto py-3"
                  onClick={() => {
                    if (cuocBauCuId) {
                      navigate(`/app/user-elections/elections/${cuocBauCuId}/rules`);
                    }
                  }}
                >
                  <Book className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Quản Lý Điều Lệ</div>
                    <div className="text-xs opacity-90">Cập nhật quy định</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg h-auto py-3"
                  onClick={handleBlockchainDeployment}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Triển Khai Blockchain</div>
                    <div className="text-xs opacity-90">Đảm bảo tính minh bạch</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg h-auto py-3"
                >
                  <BarChart2 className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Xem Kết Quả</div>
                    <div className="text-xs opacity-90">Thống kê và biểu đồ</div>
                  </div>
                </Button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Section */}
      <motion.div initial="initial" animate="animate" variants={fadeInUp} className="px-0">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-1 h-16 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"></div>
          <div className="absolute top-0 right-0 w-16 h-1 bg-gradient-to-l from-blue-500 to-purple-600 rounded-b-full"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Trang chủ</span>
                <ChevronRight className="h-4 w-4" />
                <span>Cuộc Bầu Cử</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-700 dark:text-gray-200">{cuocBauCu?.tenCuocBauCu}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                {cuocBauCu?.tenCuocBauCu}
              </h1>

              <div className="flex flex-wrap gap-2 items-center">
                <Badge
                  className={
                    electionStatus.color === 'green'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : electionStatus.color === 'blue'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
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

                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" />
                  {cuocBauCu?.ngayBatDau} - {cuocBauCu?.ngayKetThuc}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 self-end md:self-auto">
              <Button
                variant="outline"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                onClick={() => navigate(`/app/user-elections/elections/${cuocBauCuId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                  <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem
                    className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={handleBlockchainDeployment}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Triển khai Blockchain</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setActiveTab('blockchain')}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    <span>Đồng bộ Blockchain</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Quản lý quyền</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem
                    className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowHelp(!showHelp)}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Trợ giúp</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <p className="text-gray-600 dark:text-gray-300">{cuocBauCu?.moTa}</p>
          </div>

          {/* Time progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
              <span>{electionStatus.status}</span>
              <span>{progress}% hoàn thành</span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
            {electionStatus.status !== 'Đã kết thúc' && (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-right">
                Còn lại: {timeRemaining.days} ngày, {timeRemaining.hours} giờ,{' '}
                {timeRemaining.minutes} phút
              </div>
            )}
          </div>
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
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Voters Stats */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-md text-blue-600 dark:text-blue-400 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Cử Tri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">157</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 mb-1">cử tri</span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tỷ lệ tham gia</span>
                <span className="text-gray-800 dark:text-white">78%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Cử tri đã bỏ phiếu</span>
                <span className="text-gray-800 dark:text-white">122</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Stats */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-md text-indigo-600 dark:text-indigo-400 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Ứng Viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">12</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 mb-1">ứng viên</span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tỷ lệ ứng viên/vị trí</span>
                <span className="text-gray-800 dark:text-white">2.4</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Phiếu bầu trung bình/ứng viên
                </span>
                <span className="text-gray-800 dark:text-white">28</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Votes Stats */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-md text-green-600 dark:text-green-400 flex items-center">
              <BarChart2 className="mr-2 h-5 w-5" />
              Phiếu Bầu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">342</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 mb-1">phiếu bầu</span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Phiếu bầu hôm nay</span>
                <span className="text-gray-800 dark:text-white">+48</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Phiếu bầu hợp lệ</span>
                <span className="text-gray-800 dark:text-white">338 (98.8%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content with Tabs */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={{
          ...fadeInUp,
          animate: { ...fadeInUp.animate, transition: { delay: 0.2, duration: 0.5 } },
        }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6"
      >
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger
                value="overview"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Phiên bầu cử
              </TabsTrigger>
              <TabsTrigger
                value="blockchain"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Blockchain
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
              >
                <Image className="h-4 w-4 mr-2" />
                Ảnh & Media
              </TabsTrigger>
            </TabsList>

            <Card className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
              <CardContent className="p-6 space-y-6">{renderTabContent()}</CardContent>
            </Card>
          </Tabs>
        </div>

        {/* Context Panel */}
        <div className="hidden lg:block">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-md text-blue-600 dark:text-blue-400">
                Thông Tin Chung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Blockchain Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Thông tin Blockchain
                </h3>
                <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {blockchainStatus.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p className="flex justify-between">
                      <span>Mạng:</span>
                      <span className="text-gray-700 dark:text-gray-300">HoliHu Chain</span>
                    </p>
                    {cuocBauCu?.blockchainAddress && (
                      <p className="flex justify-between">
                        <span>Địa chỉ:</span>
                        <span className="text-gray-700 dark:text-gray-300 font-mono">
                          {cuocBauCu.blockchainAddress.substring(0, 6)}...
                          {cuocBauCu.blockchainAddress.substring(
                            cuocBauCu.blockchainAddress.length - 4,
                          )}
                        </span>
                      </p>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <BlockchainSyncButton
                        cuocBauCuId={Number(cuocBauCuId)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onSyncComplete={() => {
                          if (cuocBauCuId) {
                            dispatch(fetchCuocBauCuById(Number(cuocBauCuId)));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Preview */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ảnh đại diện
                </h3>
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  {imageUrl ? (
                    <div className="aspect-video bg-gray-50 dark:bg-gray-700 relative">
                      <img
                        src={imageUrl || '/placeholder.svg'}
                        alt="Ảnh đại diện cuộc bầu cử"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/png;base64,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';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    {imageUrl ? (
                      <>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {fileInfo?.tenFile || 'Ảnh đại diện'}
                        </p>
                        <div className="flex justify-between mt-1">
                          <span>{fileInfo?.kichThuoc || ''}</span>
                          <span>{fileInfo?.ngayUpload || ''}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>Chưa có ảnh đại diện</p>
                        <Button
                          variant="link"
                          className="text-blue-600 dark:text-blue-400 p-0 h-auto text-xs"
                          onClick={() => handleTabChange('media')}
                        >
                          Tải ảnh lên
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Điều lệ Status */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Điều lệ bầu cử
                </h3>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  {dieuLeCuocBauCu ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          {dieuLeCuocBauCu.tieuDe}
                        </span>
                        {dieuLeCuocBauCu.daCongBo ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30 text-xs">
                            Đã công bố
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30 text-xs">
                            Bản nháp
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p className="flex justify-between">
                          <span>Phiên bản:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            v{dieuLeCuocBauCu.phienBan}.0
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span>Cập nhật:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {formatDate(dieuLeCuocBauCu.thoiGianCapNhat)}
                          </span>
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          variant="link"
                          className="text-blue-600 dark:text-blue-400 p-0 h-auto text-xs flex items-center"
                          onClick={() => handleTabChange('rules')}
                        >
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          Xem điều lệ
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          Chưa có điều lệ
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Cuộc bầu cử này chưa có điều lệ. Hãy tạo điều lệ để đảm bảo tính minh bạch.
                      </p>
                      <Button
                        variant="link"
                        className="text-blue-600 dark:text-blue-400 p-0 h-auto text-xs flex items-center"
                        onClick={() => handleTabChange('rules')}
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Tạo điều lệ
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Thống kê nhanh
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phiên bầu cử</p>
                    <p className="text-lg font-medium text-gray-800 dark:text-white">
                      {cacPhienBauCu.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tỷ lệ tham gia</p>
                    <p className="text-lg font-medium text-gray-800 dark:text-white">78%</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Xem Thống Kê Chi Tiết
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Help Dialog */}
      <AlertDialog open={showHelp} onOpenChange={setShowHelp}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-xl max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center">
              <HelpCircle className="mr-2 h-5 w-5 text-blue-500" />
              Hướng dẫn quản lý cuộc bầu cử
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Trang quản lý cuộc bầu cử cung cấp các công cụ để quản lý toàn diện cuộc bầu cử của
              bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-medium text-lg mb-2 text-gray-800 dark:text-white">
                Các tab chức năng
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <FileText className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">Tổng quan</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Xem thông tin tổng quan và hoạt động gần đây của cuộc bầu cử
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">Phiên bầu cử</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quản lý các phiên bầu cử trong cuộc bầu cử này
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Database className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">Blockchain</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Triển khai và đồng bộ dữ liệu với blockchain
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Image className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">Ảnh & Media</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Quản lý ảnh đại diện và tài liệu đính kèm
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Book className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">Điều lệ</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Soạn thảo và quản lý điều lệ cuộc bầu cử
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-medium text-lg mb-2 text-gray-800 dark:text-white">
                Các thao tác chính
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <PlusCircle className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">
                      Tạo phiên bầu cử
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tạo phiên bầu cử mới trong cuộc bầu cử này
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Shield className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">
                      Triển khai Blockchain
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Triển khai cuộc bầu cử lên blockchain để đảm bảo tính minh bạch và bảo mật
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Database className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">
                      Đồng bộ Blockchain
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Đồng bộ dữ liệu giữa SQL và blockchain để đảm bảo tính nhất quán
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Edit className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">
                      Chỉnh sửa thông tin
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cập nhật thông tin cuộc bầu cử
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <AlertDialogFooter>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg"
              onClick={() => setShowHelp(false)}
            >
              Đã hiểu
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Session Modal */}
      {memoizedTaoPhienBauForm}

      {/* Success Message Dialog */}
      {successMessage && (
        <AlertDialog open={!!successMessage} onOpenChange={() => setSuccessMessage(null)}>
          <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Thông báo</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                {successMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setSuccessMessage(null)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg"
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default QuanLyCuocBauCuPage;
