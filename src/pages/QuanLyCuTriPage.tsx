'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
  Info,
  Grid,
  List,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  QrCode,
  Trash2,
  AlertTriangle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Shield,
  Database,
  Wallet,
  Download,
  FileText,
  ChevronDown,
  Copy,
  Clock,
} from 'lucide-react';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import {
  fetchCuTriByPhienBauCuId,
  addBulkCuTri,
  removeCuTri,
  removeMultipleCuTri,
  clearCuTriState,
} from '../store/slice/cuTriSlice';
import { fetchCacVaiTro, clearVaiTroState } from '../store/slice/vaiTroSlice';
import { taoPhieuMoi } from '../store/slice/phieuMoiPhienBauCuSlice';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import type { CuTri } from '../store/types';

// Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Checkbox } from '../components/ui/Checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/Dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Progress } from '../components/ui/Progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/Dropdown-Menu';

// Custom components
import VoterForm from '../components/FormCuTri';
import EnhancedQRCode from '../components/EnhancedQRCode';
import CuTriVerificationStatus from '../components/CuTriVerificationStatus';
import { Skeleton } from '../components/ui/Skeleton';

// Các kiểu dữ liệu
interface QuanLyCuTriPageProps {
  phienBauCuId: string;
  darkMode?: boolean;
}

// Component chính
const QuanLyCuTriPage: React.FC<QuanLyCuTriPageProps> = ({ phienBauCuId, darkMode = true }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: cuocBauCuId } = useParams<{ id: string }>();

  // Redux state
  const cuTris = useSelector((state: RootState) => state.cuTri.cacCuTri);
  const roles = useSelector((state: RootState) => state.vaiTro.cacVaiTro);
  const loading = useSelector((state: RootState) => state.cuTri.dangTai);
  const error = useSelector((state: RootState) => state.cuTri.loi);
  const nguoiDung = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  const statisticsSummary = useSelector((state: RootState) => state.cuTri);
  const xacThucState = useSelector((state: RootState) => state.maOTP);
  const ketQuaThemMoi = useSelector((state: RootState) => state.cuTri.ketQuaThemMoi);

  // Local state
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedVoters, setSelectedVoters] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [electionName, setElectionName] = useState<string>('Phiên bầu cử');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cuTriToDelete, setCuTriToDelete] = useState<number | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [isShowDetailsOpen, setIsShowDetailsOpen] = useState<boolean>(false);
  const [selectedVoterDetails, setSelectedVoterDetails] = useState<CuTri | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const itemsPerPage = 10;

  // Phân loại cử tri theo trạng thái xác thực
  const daXacThuc = useMemo(() => cuTris.filter((ct) => ct.xacMinh), [cuTris]);
  const chuaXacThuc = useMemo(() => cuTris.filter((ct) => !ct.xacMinh), [cuTris]);

  // Tính phần trăm đã xác thực
  const phanTramXacThuc = useMemo(() => {
    return cuTris.length > 0 ? Math.round((daXacThuc.length / cuTris.length) * 100) : 0;
  }, [cuTris.length, daXacThuc.length]);

  // Fetch data when component mounts
  useEffect(() => {
    if (phienBauCuId) {
      loadData();
    }
  }, [phienBauCuId]);

  // Display result message when ketQuaThemMoi changes
  useEffect(() => {
    if (ketQuaThemMoi) {
      setAlertMessage({
        type: 'success',
        title: 'Thêm cử tri thành công',
        message: `Đã thêm ${ketQuaThemMoi.daLuu} cử tri mới. ${
          ketQuaThemMoi.daXacThuc > 0
            ? `${ketQuaThemMoi.daXacThuc} cử tri đã được xác thực tự động. `
            : ''
        }${ketQuaThemMoi.daGuiEmail > 0 ? `Đã gửi ${ketQuaThemMoi.daGuiEmail} email xác thực. ` : ''}${
          ketQuaThemMoi.trungLap > 0
            ? `${ketQuaThemMoi.trungLap} cử tri bị trùng lặp đã được bỏ qua.`
            : ''
        }`,
      });

      // Auto-dismiss after 8 seconds for important messages
      setTimeout(() => setAlertMessage(null), 8000);
    }
  }, [ketQuaThemMoi]);

  // Load voter data
  const loadData = useCallback(async () => {
    if (phienBauCuId) {
      setIsRefreshing(true);
      dispatch(clearCuTriState());
      dispatch(clearVaiTroState());
      try {
        await Promise.all([
          dispatch(fetchCuTriByPhienBauCuId(Number(phienBauCuId))).unwrap(),
          dispatch(fetchCacVaiTro()).unwrap(),
        ]);
        const election = await dispatch(fetchPhienBauCuById(Number(phienBauCuId))).unwrap();
        setElectionName(election.tenPhienBauCu);

        setAlertMessage({
          type: 'success',
          title: 'Tải dữ liệu thành công',
          message: 'Đã tải danh sách cử tri và vai trò.',
        });

        // Auto-dismiss alert after 3 seconds
        setTimeout(() => setAlertMessage(null), 3000);
      } catch (error) {
        console.error('Không thể tải dữ liệu:', error);
        setAlertMessage({
          type: 'error',
          title: 'Lỗi tải dữ liệu',
          message: 'Không thể tải danh sách cử tri. Vui lòng thử lại sau.',
        });
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [dispatch, phienBauCuId]);

  // Handle save voters
  const handleSaveVoters = async (
    newVoters: CuTri[],
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setIsSaving(true);

      // Xác thực dữ liệu đầu vào
      if (!newVoters.length) {
        return {
          success: false,
          message: 'Không có cử tri nào để thêm vào hệ thống.',
        };
      }

      // Đảm bảo mỗi cử tri đều có phienBauCuId và taiKhoanId
      for (const voter of newVoters) {
        voter.phienBauCuId = Number(phienBauCuId);
        voter.taiKhoanId = voter.taiKhoanId || 0; // Đảm bảo không có null
      }

      // Thêm cử tri vào hệ thống
      const result = await dispatch(addBulkCuTri(newVoters)).unwrap();

      // Refresh data
      await loadData();

      // Tạo thông báo thành công chi tiết
      return {
        success: true,
        message: `Đã thêm ${result.daLuu} cử tri mới. ${
          result.daXacThuc > 0 ? `${result.daXacThuc} cử tri đã được xác thực tự động. ` : ''
        }${result.daGuiEmail > 0 ? `Đã gửi ${result.daGuiEmail} email xác thực. ` : ''}${
          result.trungLap > 0 ? `${result.trungLap} cử tri bị trùng lặp đã được bỏ qua.` : ''
        }`,
      };
    } catch (error: any) {
      console.error('Không thể lưu cử tri:', error);
      return {
        success: false,
        message: error.message || 'Không thể thêm cử tri mới. Vui lòng thử lại sau.',
      };
    } finally {
      setIsSaving(false);
    }
  };

  // Handle remove voter
  const handleRemoveVoter = async (id: number) => {
    setCuTriToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  // Confirm delete voter
  const confirmDeleteVoter = async () => {
    if (cuTriToDelete === null) return;

    try {
      await dispatch(removeCuTri(cuTriToDelete)).unwrap();
      setAlertMessage({
        type: 'success',
        title: 'Xóa thành công',
        message: 'Đã xóa cử tri khỏi danh sách.',
      });

      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Không thể xóa cử tri:', error);
      setAlertMessage({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể xóa cử tri. Vui lòng thử lại sau.',
      });
    }

    setIsConfirmDeleteOpen(false);
    setCuTriToDelete(null);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // Handle bulk remove voters
  const handleBulkRemoveVoters = async () => {
    if (selectedVoters.size === 0) return;
    setIsDeleteDialogOpen(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    try {
      const idsToRemove = Array.from(selectedVoters);
      await dispatch(removeMultipleCuTri(idsToRemove)).unwrap();

      setAlertMessage({
        type: 'success',
        title: 'Xóa hàng loạt thành công',
        message: `Đã xóa ${idsToRemove.length} cử tri khỏi danh sách.`,
      });

      // Reset selection and refresh data
      setSelectedVoters(new Set());
      await loadData();
    } catch (error) {
      console.error('Không thể xóa cử tri hàng loạt:', error);
      setAlertMessage({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể xóa cử tri hàng loạt. Vui lòng thử lại sau.',
      });
    }

    setIsDeleteDialogOpen(false);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // Handle generate invite QR code
  const handleGenerateInvite = async () => {
    try {
      const result = await dispatch(
        taoPhieuMoi({
          nguoiTaoId: nguoiDung?.id ?? 0,
          phienBauCuId: Number.parseInt(phienBauCuId),
          cuocBauCuId: Number.parseInt(cuocBauCuId ?? '0'),
        }),
      ).unwrap();

      const inviteUrl = result.inviteUrl ?? '';
      const url = new URL(inviteUrl);
      const token = url.searchParams.get('token');

      setInviteLink(token ?? '');
      setAlertMessage({
        type: 'success',
        title: 'Tạo mã mời thành công',
        message: 'Đã tạo mã QR mời cử tri thành công.',
      });

      // Auto-dismiss alert after 3 seconds
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Không thể tạo mã mời:', error);
      setAlertMessage({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tạo mã mời. Vui lòng thử lại sau.',
      });
    }
  };

  // Xem chi tiết cử tri
  const handleViewVoterDetails = (voter: CuTri) => {
    setSelectedVoterDetails(voter);
    setIsShowDetailsOpen(true);
  };

  // Lọc và sắp xếp cử tri
  const filteredVoters = useMemo(() => {
    return cuTris.filter((voter) => {
      const matchesSearch = searchTerm
        ? (voter.email && voter.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (voter.sdt && voter.sdt.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      const matchesRole = selectedRole === 'all' || voter.vaiTroId?.toString() === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [cuTris, searchTerm, selectedRole]);

  // Phân trang
  const paginatedVoters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVoters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVoters, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);

  // Checkbox selection
  const handleSelectAll = () => {
    if (selectedVoters.size === paginatedVoters.length) {
      setSelectedVoters(new Set());
    } else {
      const newSelectedVoters = new Set<number>();
      paginatedVoters.forEach((voter) => newSelectedVoters.add(voter.id));
      setSelectedVoters(newSelectedVoters);
    }
  };

  const handleSelectVoter = (id: number) => {
    const newSelectedVoters = new Set(selectedVoters);
    if (newSelectedVoters.has(id)) {
      newSelectedVoters.delete(id);
    } else {
      newSelectedVoters.add(id);
    }
    setSelectedVoters(newSelectedVoters);
  };

  // Xuất dữ liệu
  const handleExportData = () => {
    try {
      // Lọc cử tri theo bộ lọc hiện tại
      const dataToExport = filteredVoters.map((voter) => ({
        email: voter.email || '',
        sdt: voter.sdt || '',
        xacMinh: voter.xacMinh ? 'Đã xác thực' : 'Chưa xác thực',
        boPhieu: voter.boPhieu ? 'Đã bỏ phiếu' : 'Chưa bỏ phiếu',
        soLanGuiOTP: (voter.soLanGuiOTP ?? 0) || 0,
        hasBlockchainWallet: voter.hasBlockchainWallet ? 'Có' : 'Không',
        vaiTro: voter.tenVaiTro || 'Cử Tri',
      }));

      if (exportFormat === 'csv') {
        // Chuyển đổi sang CSV
        const headers = [
          'Email',
          'Số điện thoại',
          'Xác thực',
          'Bỏ phiếu',
          'Số lần gửi OTP',
          'Có ví blockchain',
          'Vai trò',
        ];
        const csvRows = [
          headers.join(','),
          ...dataToExport.map((row) =>
            [
              row.email,
              row.sdt,
              row.xacMinh,
              row.boPhieu,
              row.soLanGuiOTP,
              row.hasBlockchainWallet,
              row.vaiTro,
            ].join(','),
          ),
        ];
        const csvString = csvRows.join('\n');

        // Tạo blob và download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `danh-sach-cu-tri-${new Date().toISOString().split('T')[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Xuất Excel
        const XLSX = require('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách cử tri');
        XLSX.writeFile(workbook, `danh-sach-cu-tri-${new Date().toISOString().split('T')[0]}.xlsx`);
      }

      setIsExportDialogOpen(false);

      setAlertMessage({
        type: 'success',
        title: 'Xuất dữ liệu thành công',
        message: `Đã xuất ${dataToExport.length} cử tri ra file ${exportFormat.toUpperCase()}.`,
      });

      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu:', error);
      setAlertMessage({
        type: 'error',
        title: 'Lỗi xuất dữ liệu',
        message: 'Không thể xuất dữ liệu. Vui lòng thử lại sau.',
      });
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  // Get role name by ID
  const getRoleName = (roleId?: number) => {
    if (!roleId) return 'Cử Tri';
    const role = roles.find((r) => r.id === roleId);
    return role ? role.tenVaiTro : 'Cử Tri';
  };

  return (
    <div className="space-y-6">
      {/* Display alert message */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Alert
              variant={alertMessage.type === 'error' ? 'destructive' : 'default'}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section with tabs */}
      <Card className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            Quản Lý Cử Tri
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Quản lý danh sách cử tri và quyền bỏ phiếu cho phiên bầu cử "{electionName}"
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Thẻ trạng thái xác thực */}
          <CuTriVerificationStatus
            cuTris={cuTris}
            phienBauCuId={Number(phienBauCuId)}
            cuocBauCuId={Number(cuocBauCuId || 0)}
            onRefresh={loadData}
            isLoading={isRefreshing}
          />

          {/* Tabs chính */}
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger
                  value="overview"
                  className={
                    activeTab === 'overview'
                      ? 'bg-blue-600 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white'
                      : ''
                  }
                >
                  <Database className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Tổng Quan</span>
                  <span className="sm:hidden">Tổng Quan</span>
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className={
                    activeTab === 'list'
                      ? 'bg-blue-600 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white'
                      : ''
                  }
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Danh Sách Cử Tri</span>
                  <span className="sm:hidden">Danh Sách</span>
                </TabsTrigger>
                <TabsTrigger
                  value="invite"
                  className={
                    activeTab === 'invite'
                      ? 'bg-blue-600 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white'
                      : ''
                  }
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Mời Cử Tri</span>
                  <span className="sm:hidden">Mời</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab tổng quan */}
              <TabsContent value="overview" className="space-y-4">
                {loading ? (
                  // Skeleton loaders
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg h-32">
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-10 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Thống kê
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-white dark:bg-[#1A2942]/50 border-blue-100 dark:border-blue-800/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700 dark:text-blue-400">Tổng cử tri</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                            {statisticsSummary.tongSo}
                          </p>
                        </div>
                        <Users className="h-10 w-10 text-blue-500 dark:text-blue-400 opacity-70" />
                      </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-[#1A2942]/50 border-green-100 dark:border-green-800/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-400">Đã xác thực</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                            {statisticsSummary.daXacThuc}
                            <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-500">
                              ({phanTramXacThuc}%)
                            </span>
                          </p>
                        </div>
                        <Shield className="h-10 w-10 text-green-500 dark:text-green-400 opacity-70" />
                      </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-[#1A2942]/50 border-yellow-100 dark:border-yellow-800/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Chưa xác thực
                          </p>
                          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                            {statisticsSummary.chuaXacThuc}
                            <span className="ml-2 text-sm font-normal text-yellow-600 dark:text-yellow-500">
                              ({100 - phanTramXacThuc}%)
                            </span>
                          </p>
                        </div>
                        <AlertTriangle className="h-10 w-10 text-yellow-500 dark:text-yellow-400 opacity-70" />
                      </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-[#1A2942]/50 border-purple-100 dark:border-purple-800/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-700 dark:text-purple-400">
                            Đã bỏ phiếu
                          </p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                            {statisticsSummary.daBoPhieu}
                          </p>
                        </div>
                        <CheckCircle className="h-10 w-10 text-purple-500 dark:text-purple-400 opacity-70" />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Thêm mới cử tri / Phân tích nhanh */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Thêm cử tri */}
                  <Card className="lg:col-span-2 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium flex items-center">
                        <UserPlus className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Thêm cử tri mới
                      </CardTitle>
                      <CardDescription>
                        Thêm cử tri mới vào phiên bầu cử hoặc tải lên danh sách
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                          <DialogTrigger asChild>
                            <Button
                              className="w-full h-24 bg-white dark:bg-[#1A2942]/50 border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400"
                              variant="outline"
                            >
                              <div className="flex flex-col items-center">
                                <UserPlus size={24} className="mb-2" />
                                <span>Thêm cử tri thủ công</span>
                              </div>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942]">
                            <DialogHeader>
                              <DialogTitle>Thêm cử tri mới</DialogTitle>
                              <DialogDescription>
                                Nhập thông tin để thêm cử tri mới vào hệ thống
                              </DialogDescription>
                            </DialogHeader>
                            <VoterForm
                              onSave={handleSaveVoters}
                              phienBauCuId={Number(phienBauCuId)}
                            />
                          </DialogContent>
                        </Dialog>

                        <Button
                          className="w-full h-24 bg-white dark:bg-[#1A2942]/50 border-2 border-dashed border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 text-green-600 dark:text-green-400"
                          variant="outline"
                          onClick={() => setActiveTab('invite')}
                        >
                          <div className="flex flex-col items-center">
                            <QrCode size={24} className="mb-2" />
                            <span>Tạo mã QR mời cử tri</span>
                          </div>
                        </Button>
                      </div>

                      <div className="mt-4">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white"
                          onClick={() => setActiveTab('list')}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Xem danh sách cử tri ({cuTris.length})
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Thống kê nhanh */}
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium flex items-center">
                        <Info className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Thông tin nhanh
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Tiến trình xác thực
                          </p>
                          <div className="flex items-center mt-1 gap-2">
                            <Progress value={phanTramXacThuc} className="h-2 flex-1" />
                            <span className="text-sm font-medium">{phanTramXacThuc}%</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ bỏ phiếu</p>
                          <div className="flex items-center mt-1 gap-2">
                            <Progress
                              value={
                                statisticsSummary.tongSo > 0
                                  ? (statisticsSummary.daBoPhieu / statisticsSummary.tongSo) * 100
                                  : 0
                              }
                              className="h-2 flex-1"
                            />
                            <span className="text-sm font-medium">
                              {statisticsSummary.tongSo > 0
                                ? Math.round(
                                    (statisticsSummary.daBoPhieu / statisticsSummary.tongSo) * 100,
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExportDialogOpen(true)}
                            className="w-full mt-2"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Xuất danh sách cử tri
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Thông tin hướng dẫn */}
                <Card className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Thông tin xác thực cử tri
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-blue-800 dark:text-blue-300">
                      <p>
                        <strong>1. Kiểm tra trùng lặp:</strong> Hệ thống kiểm tra email và số điện
                        thoại để đảm bảo không có cử tri trùng lặp.
                      </p>
                      <p>
                        <strong>2. Gửi email xác thực:</strong> Hệ thống gửi email xác thực đến cử
                        tri với liên kết để xác nhận tham gia phiên bầu cử.
                      </p>
                      <p>
                        <strong>3. Tìm ví blockchain:</strong> Khi cử tri xác thực, hệ thống tìm
                        kiếm địa chỉ ví blockchain dựa trên thông tin cử tri.
                      </p>
                      <p>
                        <strong>4. Kết quả xác thực:</strong> Cử tri được xác thực chỉ khi đã nhấp
                        vào liên kết xác thực và có địa chỉ ví blockchain liên kết.
                      </p>
                      <p className="text-sm italic mt-2">
                        Chỉ cử tri đã được xác thực mới có thể tham gia bỏ phiếu và được chọn làm
                        ứng viên trong phiên bầu cử.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab danh sách cử tri */}
              <TabsContent value="list" className="space-y-4">
                {/* Search and filter section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      placeholder="Tìm kiếm cử tri..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
                    />
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                      size={18}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]">
                        <SelectValue placeholder="Lọc theo vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả vai trò</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.tenVaiTro}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1 bg-gray-100 dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A] rounded-md p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-1 ${viewMode === 'grid' ? 'bg-white dark:bg-[#243656] shadow-sm' : ''}`}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-1 ${viewMode === 'list' ? 'bg-white dark:bg-[#243656] shadow-sm' : ''}`}
                        onClick={() => setViewMode('list')}
                      >
                        <List size={18} />
                      </Button>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
                            onClick={loadData}
                            disabled={isRefreshing}
                          >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Làm mới dữ liệu</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white gap-1.5">
                          <Plus size={18} />
                          <span className="hidden sm:inline">Thêm cử tri</span>
                          <span className="sm:hidden">Thêm</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942]">
                        <DialogHeader>
                          <DialogTitle>Thêm cử tri mới</DialogTitle>
                          <DialogDescription>
                            Nhập thông tin để thêm cử tri mới vào hệ thống
                          </DialogDescription>
                        </DialogHeader>
                        <VoterForm onSave={handleSaveVoters} phienBauCuId={Number(phienBauCuId)} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Bulk actions */}
                {selectedVoters.size > 0 && (
                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-center">
                      <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-blue-800 dark:text-blue-300">
                        Đã chọn {selectedVoters.size} cử tri
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                        onClick={() => setSelectedVoters(new Set())}
                      >
                        Bỏ chọn
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleBulkRemoveVoters}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Xóa đã chọn
                      </Button>
                    </div>
                  </div>
                )}

                {/* Up list */}
                {filteredVoters.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {viewMode === 'list' ? (
                      <div className="bg-white dark:bg-[#162A45]/80 rounded-lg border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader className="bg-gray-50 dark:bg-[#1A2942] sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="w-10">
                                  <Checkbox
                                    checked={
                                      selectedVoters.size === paginatedVoters.length &&
                                      paginatedVoters.length > 0
                                    }
                                    onCheckedChange={handleSelectAll}
                                    className="border-gray-300 dark:border-gray-600"
                                  />
                                </TableHead>
                                <TableHead className="min-w-[140px]">Email</TableHead>
                                <TableHead className="min-w-[120px]">Số điện thoại</TableHead>
                                <TableHead className="hidden md:table-cell">Vai trò</TableHead>
                                <TableHead className="hidden md:table-cell">Trạng thái</TableHead>
                                <TableHead className="hidden md:table-cell">Bỏ phiếu</TableHead>
                                <TableHead className="text-right w-16">Thao tác</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedVoters.map((voter) => (
                                <TableRow
                                  key={voter.id}
                                  className="hover:bg-gray-50 dark:hover:bg-[#1A2942]/50"
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedVoters.has(voter.id)}
                                      onCheckedChange={() => handleSelectVoter(voter.id)}
                                      className="border-gray-300 dark:border-gray-600"
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center">
                                      <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                      <span className="truncate max-w-[120px] sm:max-w-none">
                                        {voter.email || 'Chưa có email'}
                                      </span>
                                    </div>
                                    <div className="md:hidden mt-1 space-y-1">
                                      <div className="text-xs text-gray-500">
                                        Vai trò:{' '}
                                        <Badge
                                          variant="outline"
                                          className="ml-1 text-xs py-0 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300"
                                        >
                                          {getRoleName(voter.vaiTroId)}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Trạng thái:{' '}
                                        {voter.xacMinh ? (
                                          <Badge
                                            variant="default"
                                            className="ml-1 text-xs py-0 bg-green-100 text-green-800"
                                          >
                                            Đã xác thực
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="ml-1 text-xs py-0 bg-gray-100 text-gray-800"
                                          >
                                            Chưa xác thực
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Bỏ phiếu:{' '}
                                        <Badge
                                          variant={voter.boPhieu ? 'default' : 'secondary'}
                                          className="ml-1 text-xs py-0"
                                        >
                                          {voter.boPhieu ? 'Đã bỏ phiếu' : 'Chưa bỏ phiếu'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                      {voter.sdt || 'Chưa có SĐT'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Badge
                                      variant="outline"
                                      className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/30"
                                    >
                                      {getRoleName(voter.vaiTroId)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    {voter.xacMinh ? (
                                      <Badge
                                        variant="default"
                                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Đã xác thực
                                      </Badge>
                                    ) : (voter.soLanGuiOTP ?? 0) > 0 ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        Chờ xác thực{' '}
                                        {(voter.soLanGuiOTP ?? 0) > 1
                                          ? `(${voter.soLanGuiOTP} lần)`
                                          : ''}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                      >
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Chưa gửi
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Badge
                                      variant={voter.boPhieu ? 'default' : 'secondary'}
                                      className={
                                        voter.boPhieu
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                      }
                                    >
                                      {voter.boPhieu ? 'Đã bỏ phiếu' : 'Chưa bỏ phiếu'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <span className="sr-only">Mở menu</span>
                                            <ChevronDown className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>

                                          <DropdownMenuItem
                                            onClick={() => handleViewVoterDetails(voter)}
                                          >
                                            <Info className="h-4 w-4 mr-2" />
                                            Xem chi tiết
                                          </DropdownMenuItem>

                                          <DropdownMenuSeparator />

                                          <DropdownMenuItem
                                            onClick={() => handleRemoveVoter(voter.id)}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Xóa cử tri
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                            Hiển thị {paginatedVoters.length} trong số {filteredVoters.length} cử
                            tri
                          </div>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Trước</span>
                            </Button>
                            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                              const pageNumber =
                                currentPage > 2 && totalPages > 3
                                  ? currentPage -
                                    1 +
                                    i +
                                    (currentPage + 1 > totalPages
                                      ? totalPages - currentPage - 1
                                      : 0)
                                  : i + 1;

                              if (pageNumber <= totalPages) {
                                return (
                                  <Button
                                    key={pageNumber}
                                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNumber)}
                                    className={`hidden sm:inline-flex ${
                                      currentPage === pageNumber
                                        ? 'bg-blue-600 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white'
                                        : 'bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]'
                                    }`}
                                  >
                                    {pageNumber}
                                  </Button>
                                );
                              }
                              return null;
                            })}
                            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 mx-1 sm:mx-2">
                              {currentPage}/{totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
                            >
                              <span className="hidden sm:inline mr-1">Tiếp</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedVoters.map((voter) => (
                          <Card
                            key={voter.id}
                            className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] overflow-hidden"
                          >
                            <CardHeader className="pb-2 flex flex-row items-start justify-between">
                              <div className="max-w-[calc(100%-40px)]">
                                <CardTitle className="text-base font-medium flex items-center">
                                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
                                  <span className="truncate">{voter.email || 'Chưa có email'}</span>
                                </CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                  <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">{voter.sdt || 'Chưa có SĐT'}</span>
                                </CardDescription>
                              </div>
                              <Checkbox
                                checked={selectedVoters.has(voter.id)}
                                onCheckedChange={() => handleSelectVoter(voter.id)}
                                className="border-gray-300 dark:border-gray-600"
                              />
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Vai trò
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="mt-1 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/30"
                                  >
                                    {getRoleName(voter.vaiTroId)}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Trạng thái
                                  </p>
                                  {voter.xacMinh ? (
                                    <Badge
                                      variant="default"
                                      className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Đã xác thực
                                    </Badge>
                                  ) : (voter.soLanGuiOTP ?? 0) > 0 ? (
                                    <Badge
                                      variant="outline"
                                      className="mt-1 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      Chờ xác thực{' '}
                                      {(voter.soLanGuiOTP ?? 0) > 1
                                        ? `(${voter.soLanGuiOTP} lần)`
                                        : ''}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="mt-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                    >
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Chưa gửi
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Bỏ phiếu</p>
                                <Badge
                                  variant={voter.boPhieu ? 'default' : 'outline'}
                                  className={`mt-1 ${voter.boPhieu ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}
                                >
                                  {voter.boPhieu ? 'Đã bỏ phiếu' : 'Chưa bỏ phiếu'}
                                </Badge>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex justify-between">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => handleViewVoterDetails(voter)}
                              >
                                <Info className="h-4 w-4 mr-1" />
                                Chi tiết
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleRemoveVoter(voter.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Xóa
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Mobile pagination */}
                    {viewMode === 'grid' && (
                      <div className="flex justify-center mt-4 gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Trước</span>
                        </Button>
                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 mx-1 sm:mx-2">
                          {currentPage}/{totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
                        >
                          <span className="hidden sm:inline mr-1">Tiếp</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <EmptyStateComponent onAddNew={() => setIsFormOpen(true)} />
                )}
              </TabsContent>

              {/* Tab mời cử tri */}
              <TabsContent value="invite" className="space-y-4">
                <Card className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center">
                      <QrCode className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Mời cử tri tham gia
                    </CardTitle>
                    <CardDescription>Tạo mã QR để mời cử tri tham gia phiên bầu cử</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <Button
                      onClick={handleGenerateInvite}
                      className="mb-6 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Tạo Mã Mời Mới
                    </Button>

                    {inviteLink ? (
                      <div className="flex justify-center">
                        <EnhancedQRCode result={inviteLink} electionName={electionName} />
                      </div>
                    ) : (
                      <div className="text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                        <QrCode className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Nhấn nút "Tạo Mã Mời Mới" để tạo mã QR mời cử tri
                        </p>
                      </div>
                    )}
                  </CardContent>

                  {/* Thông tin thêm về cách mời */}
                  <CardFooter className="flex flex-col items-start border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-md font-medium mb-2">Hướng dẫn mời cử tri</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>Gửi mã QR cho cử tri qua email, tin nhắn hoặc các ứng dụng nhắn tin</li>
                      <li>Cử tri quét mã QR để truy cập trang đăng ký và tham gia phiên bầu cử</li>
                      <li>Mã QR có thể được in ra và dán ở những nơi dễ tiếp cận</li>
                      <li>Mỗi mã QR tạo ra sẽ có thời hạn 24 giờ từ lúc tạo</li>
                    </ul>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Dialog xác nhận xóa một cử tri */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa cử tri này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmDeleteVoter} className="w-full sm:w-auto">
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xóa nhiều cử tri */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa hàng loạt</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedVoters.size} cử tri đã chọn? Hành động này không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete} className="w-full sm:w-auto">
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xem chi tiết cử tri */}
      <Dialog open={isShowDetailsOpen} onOpenChange={setIsShowDetailsOpen}>
        <DialogContent className="w-[calc(100vw-32px)] sm:max-w-lg md:max-w-2xl bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942]">
          <DialogHeader>
            <DialogTitle>Chi tiết cử tri</DialogTitle>
          </DialogHeader>

          {selectedVoterDetails && (
            <div className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
                  <p className="font-medium">{selectedVoterDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trạng thái</p>
                  <Badge
                    variant={selectedVoterDetails.xacMinh ? 'default' : 'outline'}
                    className={
                      selectedVoterDetails.xacMinh
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : (selectedVoterDetails.soLanGuiOTP ?? 0) > 0
                          ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }
                  >
                    {selectedVoterDetails.xacMinh ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã xác thực
                      </>
                    ) : (selectedVoterDetails.soLanGuiOTP ?? 0) > 0 ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Chờ xác thực{' '}
                        {(selectedVoterDetails.soLanGuiOTP ?? 0) > 1
                          ? `(${selectedVoterDetails.soLanGuiOTP} lần)`
                          : ''}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Chưa gửi
                      </>
                    )}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <div className="flex items-center">
                    <p className="font-medium truncate max-w-[150px]">
                      {selectedVoterDetails.email || '—'}
                    </p>
                    {selectedVoterDetails.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-1"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedVoterDetails.email || '');
                          setAlertMessage({
                            type: 'success',
                            title: 'Đã sao chép',
                            message: 'Đã sao chép email vào clipboard',
                          });
                          setTimeout(() => setAlertMessage(null), 2000);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</p>
                  <div className="flex items-center">
                    <p className="font-medium">{selectedVoterDetails.sdt || '—'}</p>
                    {selectedVoterDetails.sdt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-1"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedVoterDetails.sdt || '');
                          setAlertMessage({
                            type: 'success',
                            title: 'Đã sao chép',
                            message: 'Đã sao chép số điện thoại vào clipboard',
                          });
                          setTimeout(() => setAlertMessage(null), 2000);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bỏ phiếu</p>
                  <Badge
                    variant={selectedVoterDetails.boPhieu ? 'default' : 'outline'}
                    className={
                      selectedVoterDetails.boPhieu
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }
                  >
                    {selectedVoterDetails.boPhieu ? 'Đã bỏ phiếu' : 'Chưa bỏ phiếu'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Vai trò</p>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/30"
                  >
                    {getRoleName(selectedVoterDetails.vaiTroId)}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tài khoản ID</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedVoterDetails.taiKhoanId
                        ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }
                  >
                    {selectedVoterDetails.taiKhoanId
                      ? `#${selectedVoterDetails.taiKhoanId}`
                      : 'Chưa có tài khoản'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ví blockchain</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedVoterDetails.hasBlockchainWallet
                        ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }
                  >
                    <Wallet className="h-3 w-3 mr-1" />
                    {selectedVoterDetails.hasBlockchainWallet ? 'Đã liên kết' : 'Chưa liên kết'}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsShowDetailsOpen(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog xuất dữ liệu */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942]">
          <DialogHeader>
            <DialogTitle>Xuất danh sách cử tri</DialogTitle>
            <DialogDescription>Chọn định dạng file để xuất danh sách cử tri</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="csv-format"
                checked={exportFormat === 'csv'}
                onCheckedChange={() => setExportFormat('csv')}
              />
              <label
                htmlFor="csv-format"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Xuất file CSV
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="excel-format"
                checked={exportFormat === 'excel'}
                onCheckedChange={() => setExportFormat('excel')}
              />
              <label
                htmlFor="excel-format"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <FileText className="h-4 w-4 mr-2 text-green-600" />
                Xuất file Excel
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Xuất dữ liệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Empty state component
const EmptyStateComponent: React.FC<{ onAddNew: () => void }> = ({ onAddNew }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/50 dark:bg-[#162A45]/30 border border-gray-200 dark:border-[#2A3A5A]/50 backdrop-blur-sm rounded-2xl shadow-inner">
      <div className="mb-6 w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1A2942]/50 flex items-center justify-center">
        <Users size={48} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-xl mb-4 text-gray-600 dark:text-gray-300 text-center">
        Chưa có cử tri nào. Hãy thêm cử tri đầu tiên!
      </p>
      <Button
        onClick={onAddNew}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white hover:shadow-lg dark:hover:shadow-blue-500/20 transition-all transform hover:translate-y-[-2px]"
      >
        <Plus className="mr-2 inline-block" size={16} />
        Thêm cử tri mới
      </Button>
    </div>
  );
};

export default QuanLyCuTriPage;
