import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Filter,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  BarChart2,
  Loader,
  Database,
  Menu,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

// Redux imports
import { RootState, AppDispatch } from '../store/store';
import {
  fetchViTriUngCuByPhienBauCuId,
  fetchViTriUngCuStatisticsByPhienBauCuId,
  fetchUngCuViensByViTriUngCuId,
  fetchThongKeChiTietByPhienBauCuId,
  addViTriUngCu,
  editViTriUngCu,
  removeViTriUngCu,
  setSearchTerm,
  setSortBy,
  selectFilteredPositions,
  selectPositionStats,
  kiemTraTrungTenViTri,
  clearErrors,
} from '../store/slice/viTriUngCuSlice';

// Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '../components/ui/Dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Progress } from '../components/ui/Progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import ViTriUngCuForm from '../features/ViTriUngCuForm';

// Tạo một custom hook để detect thiết bị di động
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
};

interface QuanLyViTriUngCuPageProps {
  phienBauCuId: string;
  cuocBauCuId?: string;
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const QuanLyViTriUngCuPage: React.FC<QuanLyViTriUngCuPageProps> = ({
  phienBauCuId,
  cuocBauCuId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useIsMobile();

  // Redux state
  const filteredPositions = useSelector(selectFilteredPositions);
  const positions = useSelector((state: RootState) => state.viTriUngCu.cacViTriUngCu);
  const positionStats = useSelector(selectPositionStats);
  const thongKeChiTiet = useSelector((state: RootState) => state.viTriUngCu.thongKeChiTiet);
  const searchTerm = useSelector((state: RootState) => state.viTriUngCu.filter.searchTerm);
  const sortBy = useSelector((state: RootState) => state.viTriUngCu.filter.sortBy);
  const dangTai = useSelector((state: RootState) => state.viTriUngCu.dangTai);
  const dangTaiThongKe = useSelector((state: RootState) => state.viTriUngCu.dangTaiThongKe);
  const dangTaiThongKeChiTiet = useSelector(
    (state: RootState) => state.viTriUngCu.dangTaiThongKeChiTiet,
  );
  const ungCuViensTheoViTri = useSelector(
    (state: RootState) => state.viTriUngCu.ungCuViensTheoViTri,
  );
  const dangTaiUngVien = useSelector((state: RootState) => state.viTriUngCu.dangTaiUngVien);
  const loi = useSelector((state: RootState) => state.viTriUngCu.loi);
  const loiUngVien = useSelector((state: RootState) => state.viTriUngCu.loiUngVien);
  const loiThongKe = useSelector((state: RootState) => state.viTriUngCu.loiThongKe);
  const loiThongKeChiTiet = useSelector((state: RootState) => state.viTriUngCu.loiThongKeChiTiet);
  const ketQuaKiemTraTrung = useSelector((state: RootState) => state.viTriUngCu.ketQuaKiemTraTrung);

  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('positions');
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [isCandidateDialogOpen, setIsCandidateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(isMobile ? 'cards' : 'table');
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Pagination for mobile view
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isMobile ? 5 : 10;
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);

  // Update paged positions
  const pagedPositions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPositions.slice(start, end);
  }, [filteredPositions, currentPage, itemsPerPage]);

  // Update view mode based on screen size
  useEffect(() => {
    setViewMode(isMobile ? 'cards' : viewMode);
  }, [isMobile]);

  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  // Load data when component mounts
  useEffect(() => {
    if (phienBauCuId) {
      loadData();
    }
  }, [phienBauCuId]);

  // Show alert if there are errors
  useEffect(() => {
    if (loi) {
      setAlertMessage({
        type: 'error',
        title: 'Lỗi',
        message: loi,
      });

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setAlertMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [loi]);

  // Function to load all data
  const loadData = useCallback(async () => {
    if (phienBauCuId) {
      setIsRefreshing(true);
      try {
        await Promise.all([
          dispatch(fetchViTriUngCuByPhienBauCuId(parseInt(phienBauCuId))).unwrap(),
          dispatch(fetchViTriUngCuStatisticsByPhienBauCuId(parseInt(phienBauCuId))).unwrap(),
          dispatch(fetchThongKeChiTietByPhienBauCuId(parseInt(phienBauCuId))).unwrap(),
        ]);

        // Reset to first page after loading data
        setCurrentPage(1);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu vị trí ứng cử:', error);
        setAlertMessage({
          type: 'error',
          title: 'Lỗi tải dữ liệu',
          message: 'Không thể tải dữ liệu vị trí ứng cử. Vui lòng thử lại sau.',
        });
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [dispatch, phienBauCuId]);

  // Handler for search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearchTerm(e.target.value));
      // Reset to first page when search changes
      setCurrentPage(1);
    },
    [dispatch],
  );

  // Handler for sort change
  const handleSortChange = useCallback(
    (value: string) => {
      dispatch(setSortBy(value));
    },
    [dispatch],
  );

  // Handlers for pagination
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  // Handler for editing position
  const handleEditPosition = useCallback((position: any) => {
    setEditingPosition(position);
    setIsFormOpen(true);
    setFormError(null);
  }, []);

  // Handler for delete confirmation
  const handleDeleteClick = useCallback((position: any) => {
    setSelectedPosition(position);
    setIsDeleteDialogOpen(true);
  }, []);

  // Handler for delete position
  const handleDeletePosition = useCallback(async () => {
    if (!selectedPosition) return;

    try {
      await dispatch(removeViTriUngCu(selectedPosition.id)).unwrap();

      setAlertMessage({
        type: 'success',
        title: 'Xóa thành công',
        message: `Đã xóa vị trí "${selectedPosition.tenViTriUngCu}" khỏi danh sách.`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedPosition(null);

      // Auto-dismiss alert after 3 seconds
      setTimeout(() => setAlertMessage(null), 3000);

      // Refresh statistics data
      dispatch(fetchViTriUngCuStatisticsByPhienBauCuId(parseInt(phienBauCuId)));
      dispatch(fetchThongKeChiTietByPhienBauCuId(parseInt(phienBauCuId)));
    } catch (error: any) {
      console.error('Không thể xóa vị trí ứng cử:', error);
      setAlertMessage({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể xóa vị trí ứng cử. Vui lòng thử lại sau.',
      });
    }
  }, [dispatch, phienBauCuId, selectedPosition]);

  // Handler for view candidates
  const handleViewCandidates = useCallback(
    async (positionId: number) => {
      try {
        setSelectedPositionId(positionId);
        await dispatch(fetchUngCuViensByViTriUngCuId(positionId)).unwrap();
        setIsCandidateDialogOpen(true);
      } catch (error: any) {
        console.error('Lỗi khi tải danh sách ứng viên:', error);
        setAlertMessage({
          type: 'error',
          title: 'Lỗi tải dữ liệu',
          message: error.message || 'Không thể tải danh sách ứng viên. Vui lòng thử lại sau.',
        });
      }
    },
    [dispatch],
  );

  // Handler for saving position
  const handleSavePosition = async (positionData: any) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (positionData.id) {
        // Update existing position
        await dispatch(
          editViTriUngCu({
            id: positionData.id,
            viTriUngCu: positionData,
          }),
        ).unwrap();

        setAlertMessage({
          type: 'success',
          title: 'Cập nhật thành công',
          message: `Đã cập nhật thông tin vị trí ${positionData.tenViTriUngCu}.`,
        });
      } else {
        // Add new position
        const newPositionData = {
          ...positionData,
          phienBauCuId: parseInt(phienBauCuId),
        };

        await dispatch(addViTriUngCu(newPositionData)).unwrap();

        setAlertMessage({
          type: 'success',
          title: 'Thêm thành công',
          message: `Đã thêm vị trí ${positionData.tenViTriUngCu} vào danh sách.`,
        });
      }

      // Close form and reset states
      setIsFormOpen(false);
      setEditingPosition(null);

      // Refresh statistics
      dispatch(fetchViTriUngCuStatisticsByPhienBauCuId(parseInt(phienBauCuId)));
      dispatch(fetchThongKeChiTietByPhienBauCuId(parseInt(phienBauCuId)));

      // Auto-dismiss alert after 3 seconds
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error: any) {
      console.error('Lỗi khi lưu vị trí ứng cử:', error);
      setFormError(
        error.message ||
          'Không thể lưu thông tin vị trí ứng cử. Vui lòng kiểm tra lại dữ liệu và thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to check duplicate name
  const checkDuplicateName = useCallback(
    async (name: string, excludeId?: number) => {
      try {
        const result = await dispatch(
          kiemTraTrungTenViTri({
            name,
            phienBauCuId: parseInt(phienBauCuId),
            excludeId,
          }),
        ).unwrap();
        return result.isDuplicate;
      } catch (error: any) {
        console.error('Lỗi khi kiểm tra trùng tên:', error);
        setAlertMessage({
          type: 'error',
          title: 'Lỗi',
          message: error.message || 'Không thể kiểm tra trùng tên vị trí. Vui lòng thử lại sau.',
        });
        return false;
      }
    },
    [dispatch, phienBauCuId],
  );

  // Get candidate count for a position
  const getCandidateCount = useCallback(
    (positionId: number) => {
      if (thongKeChiTiet && thongKeChiTiet.statistics) {
        const stat = thongKeChiTiet.statistics.find((s) => s.id === positionId);
        return stat?.soUngCuVien || 0;
      }
      return 0;
    },
    [thongKeChiTiet],
  );

  // Get percentage for a position
  const getPercentage = useCallback(
    (positionId: number) => {
      if (thongKeChiTiet && thongKeChiTiet.statistics) {
        const stat = thongKeChiTiet.statistics.find((s) => s.id === positionId);
        return stat?.tyLePercentage || 0;
      }
      return 0;
    },
    [thongKeChiTiet],
  );

  // Get color based on percentage
  const getPercentageColorClass = useCallback((percentage: number) => {
    if (percentage < 30) return 'bg-green-500 dark:bg-green-500';
    if (percentage < 70) return 'bg-yellow-500 dark:bg-yellow-500';
    return 'bg-red-500 dark:bg-red-500';
  }, []);

  // Get status for a position
  const getStatus = useCallback(
    (positionId: number) => {
      if (thongKeChiTiet && thongKeChiTiet.statistics) {
        const stat = thongKeChiTiet.statistics.find((s) => s.id === positionId);
        return stat?.trangThai || 'Thấp';
      }
      return 'Thấp';
    },
    [thongKeChiTiet],
  );

  // Handler for add position button
  const handleAddPositionClick = useCallback(() => {
    setEditingPosition(null);
    setIsFormOpen(true);
    setFormError(null);
    setIsFilterMenuOpen(false);
  }, []);

  // Render position table
  const renderPositionTable = useMemo(
    () => (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
              <TableRow>
                <TableHead>Tên vị trí</TableHead>
                <TableHead>Số phiếu tối đa</TableHead>
                <TableHead>Số ứng viên</TableHead>
                <TableHead>Tỷ lệ</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedPositions.map((position) => {
                const candidateCount = getCandidateCount(position.id);
                const percentage = getPercentage(position.id);

                return (
                  <TableRow
                    key={position.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/70"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-amber-500 dark:text-amber-400 mr-2" />
                        {position.tenViTriUngCu}
                      </div>
                      {position.moTa && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {position.moTa}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                        {position.soPhieuToiDa} phiếu
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        {candidateCount} ứng viên
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2">
                          <div
                            className={`h-2.5 rounded-full ${getPercentageColorClass(percentage)}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span>{percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => handleViewCandidates(position.id)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Xem ứng viên</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          onClick={() => handleEditPosition(position)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteClick(position)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredPositions.length)}
              </span>{' '}
              / <span className="font-medium">{filteredPositions.length}</span> vị trí
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    ),
    [
      pagedPositions,
      getCandidateCount,
      getPercentage,
      getPercentageColorClass,
      handleViewCandidates,
      handleEditPosition,
      handleDeleteClick,
      currentPage,
      totalPages,
      itemsPerPage,
      filteredPositions.length,
      goToPreviousPage,
      goToNextPage,
    ],
  );

  // Render position cards
  const renderPositionCards = useMemo(
    () => (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagedPositions.map((position) => {
            const candidateCount = getCandidateCount(position.id);
            const percentage = getPercentage(position.id);
            const status = getStatus(position.id);

            return (
              <motion.div key={position.id} initial="initial" animate="animate" variants={fadeInUp}>
                <Card className="h-full bg-white dark:bg-gradient-to-br dark:from-[#162A45]/80 dark:to-[#1A2942]/50 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] hover:shadow-md dark:hover:shadow-blue-900/10 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                        <Award className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                        {position.tenViTriUngCu}
                      </CardTitle>

                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          onClick={() => handleEditPosition(position)}
                        >
                          <Edit size={16} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteClick(position)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    {position.moTa && (
                      <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {position.moTa.length > 80
                          ? `${position.moTa.substring(0, 80)}...`
                          : position.moTa}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4 mt-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Số phiếu tối đa:</span>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30"
                        >
                          {position.soPhieuToiDa}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Số ứng viên:</span>
                        <Badge
                          variant="outline"
                          className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/30"
                        >
                          {candidateCount}
                        </Badge>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-gray-500 dark:text-gray-400">Tỷ lệ sử dụng:</span>
                          <span
                            className={`font-medium ${
                              percentage < 30
                                ? 'text-green-600 dark:text-green-400'
                                : percentage < 70
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getPercentageColorClass(percentage)} transition-all duration-500 ease-in-out`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>

                        <div className="mt-1 text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Trạng thái: </span>
                          <span
                            className={
                              status === 'Thấp'
                                ? 'text-green-600 dark:text-green-400'
                                : status === 'Trung bình'
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                            }
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 h-auto p-0"
                          onClick={() => handleViewCandidates(position.id)}
                        >
                          {dangTaiUngVien && selectedPositionId === position.id ? (
                            <div className="flex items-center">
                              <Loader size={12} className="animate-spin mr-1" />
                              <span>Đang tải...</span>
                            </div>
                          ) : (
                            <span>Xem ứng viên</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isMobile ? (
                <span>
                  Trang {currentPage}/{totalPages}
                </span>
              ) : (
                <>
                  Hiển thị{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredPositions.length)}
                  </span>{' '}
                  / <span className="font-medium">{filteredPositions.length}</span> vị trí
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    ),
    [
      pagedPositions,
      getCandidateCount,
      getPercentage,
      getStatus,
      getPercentageColorClass,
      handleEditPosition,
      handleDeleteClick,
      handleViewCandidates,
      dangTaiUngVien,
      selectedPositionId,
      isMobile,
      currentPage,
      totalPages,
      itemsPerPage,
      filteredPositions.length,
      goToPreviousPage,
      goToNextPage,
    ],
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
      <Award className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        Chưa có vị trí ứng cử
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Bắt đầu bằng cách thêm vị trí ứng cử đầu tiên cho phiên bầu cử này.
      </p>
      <div className="mt-6">
        <Button
          className="bg-amber-600 hover:bg-amber-700 dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white"
          onClick={handleAddPositionClick}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm vị trí ứng cử
        </Button>
      </div>
    </div>
  );

  // Render mobile search and filter controls
  const renderMobileControls = () => (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="text"
          placeholder="Tìm kiếm vị trí ứng cử..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
          size={18}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className="flex-1"
        >
          <Filter size={16} className="mr-2" />
          Lọc và sắp xếp
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
        >
          {viewMode === 'table' ? 'Xem dạng thẻ' : 'Xem dạng bảng'}
        </Button>
      </div>

      {isFilterMenuOpen && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Sắp xếp theo:</div>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full bg-white dark:bg-[#1A2942]/50">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Tên A-Z</SelectItem>
                  <SelectItem value="name-desc">Tên Z-A</SelectItem>
                  <SelectItem value="votes-asc">Số phiếu tăng dần</SelectItem>
                  <SelectItem value="votes-desc">Số phiếu giảm dần</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 mr-2"
                onClick={loadData}
                disabled={isRefreshing || dangTai}
              >
                <RefreshCw
                  size={16}
                  className={`mr-2 ${isRefreshing || dangTai ? 'animate-spin' : ''}`}
                />
                Làm mới
              </Button>

              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white"
                size="sm"
                onClick={handleAddPositionClick}
                disabled={dangTai}
              >
                <Plus size={16} className="mr-2" />
                Thêm vị trí
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Alert messages */}
      {alertMessage && (
        <Alert
          className={`${
            alertMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300'
              : alertMessage.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300'
          }`}
        >
          {alertMessage.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {alertMessage.type === 'error' && <XCircle className="h-4 w-4" />}
          {alertMessage.type === 'info' && <Info className="h-4 w-4" />}
          <AlertTitle>{alertMessage.title}</AlertTitle>
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}

      {/* Error messages */}
      {(loiThongKe || loiThongKeChiTiet || loiUngVien) && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{loiThongKe || loiThongKeChiTiet || loiUngVien}</AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card className="bg-white dark:bg-[#162A45]/90 border border-gray-200 dark:border-[#2A3A5A]">
        <CardHeader className={isMobile ? 'px-4 py-3' : undefined}>
          <CardTitle className="text-xl font-bold flex items-center">
            <Award className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
            Quản lý Vị Trí Ứng Cử
          </CardTitle>
          <CardDescription>Thiết lập các vị trí cần bầu chọn trong phiên bầu cử</CardDescription>
        </CardHeader>

        <CardContent className={isMobile ? 'px-4 py-2' : undefined}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="positions">
                <Award className="mr-2 h-4 w-4" />
                <span>Danh sách vị trí</span>
              </TabsTrigger>
              <TabsTrigger value="statistics">
                <BarChart2 className="mr-2 h-4 w-4" />
                <span>Thống kê</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="positions" className="space-y-4">
              {/* Search & Actions Bar - Desktop version */}
              {!isMobile && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      placeholder="Tìm kiếm vị trí ứng cử..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                      size={18}
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-[180px] bg-white dark:bg-[#1A2942]/50">
                        <SelectValue placeholder="Sắp xếp theo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Tên A-Z</SelectItem>
                        <SelectItem value="name-desc">Tên Z-A</SelectItem>
                        <SelectItem value="votes-asc">Số phiếu tăng dần</SelectItem>
                        <SelectItem value="votes-desc">Số phiếu giảm dần</SelectItem>
                      </SelectContent>
                    </Select>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white dark:bg-[#1A2942]/50"
                            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                          >
                            <Filter size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {viewMode === 'table' ? 'Chuyển sang dạng thẻ' : 'Chuyển sang dạng bảng'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white dark:bg-[#1A2942]/50"
                            onClick={loadData}
                            disabled={isRefreshing || dangTai}
                          >
                            <RefreshCw
                              size={18}
                              className={isRefreshing || dangTai ? 'animate-spin' : ''}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Làm mới dữ liệu</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button
                      className="bg-amber-600 hover:bg-amber-700 dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white gap-1.5"
                      onClick={handleAddPositionClick}
                      disabled={dangTai}
                    >
                      <Plus size={18} />
                      <span>Thêm vị trí</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Mobile controls */}
              {isMobile && renderMobileControls()}

              {/* Position List */}
              {dangTai && !positions.length ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center">
                    <Loader
                      size={40}
                      className="animate-spin text-blue-500 dark:text-blue-400 mb-4"
                    />
                    <p className="text-gray-500 dark:text-gray-400">
                      Đang tải danh sách vị trí ứng cử...
                    </p>
                  </div>
                </div>
              ) : filteredPositions.length > 0 ? (
                viewMode === 'table' && !isMobile ? (
                  renderPositionTable
                ) : (
                  renderPositionCards
                )
              ) : (
                renderEmptyState()
              )}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              {dangTaiThongKe || dangTaiThongKeChiTiet ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center">
                    <Loader
                      size={40}
                      className="animate-spin text-blue-500 dark:text-blue-400 mb-4"
                    />
                    <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu thống kê...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Statistics summary */}
                  <div
                    className={`grid grid-cols-1 ${isMobile ? '' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-4`}
                  >
                    <Card className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                      <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                              Tổng số vị trí
                            </p>
                            <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                              {positionStats.totalPositions}
                            </p>
                          </div>
                          <Award className="h-10 w-10 text-amber-500 dark:text-amber-400 opacity-70" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                      <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              Tổng số phiếu tối đa
                            </p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                              {positionStats.totalMaxVotes}
                            </p>
                          </div>
                          <Database className="h-10 w-10 text-blue-500 dark:text-blue-400 opacity-70" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30">
                      <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-700 dark:text-purple-400">
                              Tổng số ứng viên
                            </p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                              {positionStats.totalCandidates}
                            </p>
                          </div>
                          <Users className="h-10 w-10 text-purple-500 dark:text-purple-400 opacity-70" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30">
                      <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-700 dark:text-green-400">Tỷ lệ điền</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                              {positionStats.overallPercentage}%
                            </p>
                          </div>
                          <BarChart2 className="h-10 w-10 text-green-500 dark:text-green-400 opacity-70" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Statistics details */}
                  <Card>
                    <CardHeader className={isMobile ? 'px-4 py-3' : undefined}>
                      <CardTitle className="text-lg">Chi tiết theo vị trí</CardTitle>
                    </CardHeader>
                    <CardContent className={isMobile ? 'px-2 py-2' : undefined}>
                      {thongKeChiTiet &&
                      thongKeChiTiet.statistics &&
                      thongKeChiTiet.statistics.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                                <TableRow>
                                  <TableHead>Tên vị trí</TableHead>
                                  <TableHead className="text-right">Số phiếu tối đa</TableHead>
                                  <TableHead className="text-right">Số ứng viên</TableHead>
                                  <TableHead className="text-right">Tỷ lệ sử dụng</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {thongKeChiTiet.statistics.map((statistic) => {
                                  let statusColor = 'text-green-500 dark:text-green-400';
                                  if (statistic.tyLePercentage > 90)
                                    statusColor = 'text-red-500 dark:text-red-400';
                                  else if (statistic.tyLePercentage > 70)
                                    statusColor = 'text-yellow-500 dark:text-yellow-400';

                                  return (
                                    <TableRow
                                      key={statistic.id}
                                      className="hover:bg-gray-50 dark:hover:bg-gray-800/70"
                                    >
                                      <TableCell className="font-medium">
                                        <div className="truncate max-w-[150px] sm:max-w-none">
                                          {statistic.tenViTriUngCu}
                                        </div>
                                        {!isMobile && statistic.moTa && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[200px]">
                                            {statistic.moTa}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {statistic.soPhieuToiDa}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {statistic.soUngCuVien}
                                      </TableCell>
                                      <TableCell
                                        className={`text-right font-medium ${statusColor}`}
                                      >
                                        {statistic.tyLePercentage}%
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                          <BarChart2 className="h-12 w-12 mx-auto text-gray-400" />
                          <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Chưa có dữ liệu thống kê. Hãy thêm vị trí ứng cử để xem thống kê.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Information Card - Only show on desktop */}
      {!isMobile && (
        <Card className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-700 dark:text-amber-400 flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Thông tin về vị trí ứng cử
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-amber-800 dark:text-amber-300">
              <p>
                <strong>1. Tên vị trí:</strong> Tên của vị trí cần bầu chọn trong phiên bầu cử.
              </p>
              <p>
                <strong>2. Số phiếu tối đa:</strong> Số lượng ứng viên tối đa mà mỗi cử tri có thể
                bầu cho vị trí này.
              </p>
              <p>
                <strong>3. Mô tả:</strong> Thông tin chi tiết về vị trí và trách nhiệm tương ứng.
              </p>
              <p>
                <strong>4. Ứng viên:</strong> Số lượng ứng viên đang ứng cử cho vị trí này.
              </p>
              <p className="text-sm italic mt-2">
                Vị trí ứng cử cần được thiết lập trước khi thêm ứng viên vào phiên bầu cử.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog - Shared between mobile and desktop */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          className={`max-w-md bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942] ${isMobile ? 'w-[95vw] p-4' : ''}`}
        >
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? 'Cập nhật vị trí ứng cử' : 'Thêm vị trí ứng cử mới'}
            </DialogTitle>
            <DialogDescription>
              {editingPosition
                ? 'Cập nhật thông tin vị trí ứng cử trong phiên bầu cử'
                : 'Thêm vị trí ứng cử mới cho phiên bầu cử này'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <ViTriUngCuForm
            onSave={handleSavePosition}
            onCancel={() => setIsFormOpen(false)}
            initialData={editingPosition}
            phienBauCuId={phienBauCuId}
            cuocBauCuId={cuocBauCuId}
            isSubmitting={isSubmitting}
            checkDuplicateName={checkDuplicateName}
            isMobile={isMobile}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog cho xem ứng viên */}
      <Dialog open={isCandidateDialogOpen} onOpenChange={setIsCandidateDialogOpen}>
        <DialogContent
          className={`${isMobile ? 'w-[95vw] p-4' : 'max-w-4xl'} bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942] overflow-hidden`}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-amber-600 dark:text-amber-400" />
              {positions.find((p) => p.id === selectedPositionId)?.tenViTriUngCu
                ? `Danh sách ứng viên - ${positions.find((p) => p.id === selectedPositionId)?.tenViTriUngCu}`
                : 'Danh sách ứng viên'}
            </DialogTitle>
            <DialogDescription>
              {ungCuViensTheoViTri.length > 0
                ? `Hiển thị ${ungCuViensTheoViTri.length} ứng viên thuộc vị trí này`
                : 'Danh sách ứng viên thuộc vị trí này'}
            </DialogDescription>
          </DialogHeader>

          {dangTaiUngVien ? (
            <div className="flex items-center justify-center py-8">
              <Loader size={40} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 ml-3">
                Đang tải danh sách ứng viên...
              </p>
            </div>
          ) : ungCuViensTheoViTri.length > 0 ? (
            <div className={`overflow-y-auto ${isMobile ? 'max-h-[50vh]' : 'max-h-[60vh]'}`}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-[#1A2942]/80 sticky top-0">
                    <TableRow>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Thông tin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ungCuViensTheoViTri.map((candidate) => (
                      <TableRow
                        key={candidate.id}
                        className="hover:bg-gray-50 dark:hover:bg-[#1A2942]/30"
                      >
                        <TableCell className="font-medium">
                          {candidate.hoTen || 'Chưa có tên'}
                        </TableCell>
                        <TableCell>
                          {candidate.moTa
                            ? isMobile
                              ? candidate.moTa.length > 80
                                ? `${candidate.moTa.substring(0, 80)}...`
                                : candidate.moTa
                              : candidate.moTa.length > 150
                                ? `${candidate.moTa.substring(0, 150)}...`
                                : candidate.moTa
                            : 'Chưa có thông tin mô tả'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-6 w-16 h-16 rounded-full bg-gray-100 dark:bg-[#1A2942]/50 flex items-center justify-center mx-auto">
                <Users size={28} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Chưa có ứng viên nào thuộc vị trí này.
              </p>
              <Button
                variant="outline"
                className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
                onClick={() => setIsCandidateDialogOpen(false)}
              >
                Đóng
              </Button>
            </div>
          )}

          {ungCuViensTheoViTri.length > 0 && (
            <DialogFooter>
              <Button
                variant="outline"
                className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
                onClick={() => setIsCandidateDialogOpen(false)}
              >
                Đóng
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent
          className={`${isMobile ? 'w-[95vw] p-4' : 'max-w-md'} bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942]`}
        >
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa vị trí <strong>{selectedPosition?.tenViTriUngCu}</strong>?
              {getCandidateCount(selectedPosition?.id) > 0 && (
                <p className="mt-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="inline-block mr-1 h-4 w-4" />
                  Cảnh báo: Hiện có {getCandidateCount(selectedPosition?.id)} ứng viên thuộc vị trí
                  này. Xóa vị trí có thể gây ảnh hưởng đến dữ liệu ứng viên.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={isMobile ? 'flex-col space-y-2' : undefined}>
            <Button
              variant="outline"
              className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeletePosition}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuanLyViTriUngCuPage;
