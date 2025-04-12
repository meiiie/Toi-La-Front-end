'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { CuTri } from '../store/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from './ui/Card';
import {
  PlusCircle,
  Save,
  Search,
  Users,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  HelpCircle,
  Mail,
  Phone,
  Info,
} from 'lucide-react';
import VoterUploader from './VoterUploader';
import PaginationPhu from './PaginationPhu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from './ui/AlterDialog';
import { Alert, AlertDescription, AlertTitle } from './ui/Alter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Badge } from './ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';
import type { RootState } from '../store/store';
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from './ui/Toast';

interface VoterData {
  sdt: string;
  email: string;
  xacMinh: string;
  vaiTroId?: number;
  hasBlockchainWallet?: boolean;
}

interface VoterFormProps {
  onSave: (data: CuTri[]) => Promise<{ success: boolean; message: string }>;
  phienBauCuId: number;
}

interface ToastState {
  open: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
}

const VoterForm: React.FC<VoterFormProps> = ({ onSave, phienBauCuId }) => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const parsedCuocBauCuId = cuocBauCuId ? Number.parseInt(cuocBauCuId, 10) : 0;
  const [voterList, setVoterList] = useState<CuTri[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedVoters, setSelectedVoters] = useState<Set<number>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [nextId, setNextId] = useState(0);
  const [activeTab, setActiveTab] = useState('list');
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    {
      id: number;
      field: string;
      message: string;
    }[]
  >([]);

  const [showDuplicateChecking, setShowDuplicateChecking] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    type: 'info',
    title: '',
    description: '',
  });

  // Thêm state để theo dõi trường đang được chỉnh sửa
  const [editingField, setEditingField] = useState<{ id: number; field: string } | null>(null);

  const nguoiDung = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  const itemsPerPage = 5;
  const emailInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const phoneInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Kiểm tra email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Kiểm tra số điện thoại Việt Nam
  const isValidVietnamPhone = (phone: string) => {
    // Số điện thoại Việt Nam bắt đầu bằng 0, theo sau là 9 chữ số (tổng 10 chữ số)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phone);
  };

  // Hiển thị toast
  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    description: string,
    duration = 5000, // Thời gian hiển thị mặc định, có thể tùy chỉnh
    important = false, // Đánh dấu thông báo quan trọng sẽ hiển thị lâu hơn
  ) => {
    // Thông báo quan trọng hiển thị lâu hơn
    const actualDuration = important ? Math.max(duration, 10000) : duration;

    setToast({
      open: true,
      type,
      title,
      description,
    });

    // Tự đóng toast sau thời gian đã đặt
    const timeoutId = setTimeout(() => {
      setToast((prev: ToastState) => ({ ...prev, open: false }));
    }, actualDuration);

    return timeoutId; // Trả về ID để có thể hủy nếu cần
  };

  // Reset validation errors khi thay đổi danh sách cử tri
  useEffect(() => {
    setValidationErrors([]);
  }, [voterList]);

  // Thêm state để kiểm soát chế độ xem trên mobile
  const [compactView, setCompactView] = useState<boolean>(window.innerWidth < 640);

  // Thêm effect để theo dõi resize của màn hình
  useEffect(() => {
    const handleResize = () => {
      setCompactView(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddVoter = () => {
    if (voterList.length >= 100) {
      showToast('warning', 'Giới hạn đạt tới', 'Bạn chỉ có thể thêm tối đa 100 cử tri một lần.');
      return;
    }
    setVoterList([
      ...voterList,
      {
        id: nextId,
        sdt: '',
        email: '',
        xacMinh: false,
        boPhieu: false,
        soLanGuiOTP: 0,
        cuocBauCuId: Number(parsedCuocBauCuId),
        phienBauCuId: phienBauCuId,
        // Không gửi taiKhoanId, để server tự xác định
        vaiTroId: 0,
        hasBlockchainWallet: false,
      },
    ]);
    setNextId(nextId + 1);
  };

  const handleChange = (index: number, field: keyof CuTri, value: string | boolean | number) => {
    if (index >= 0 && index < voterList.length) {
      const newVoterList = [...voterList];
      newVoterList[index] = { ...newVoterList[index], [field]: value };
      setVoterList(newVoterList);
    }
  };

  // Xử lý khi người dùng hoàn thành việc chỉnh sửa trường
  const handleFieldBlur = (voterId: number, field: string, value: string) => {
    setEditingField(null);

    // Xóa lỗi cũ
    setValidationErrors((prev) =>
      prev.filter((error) => error.id !== voterId || error.field !== field),
    );

    // Kiểm tra và thêm lỗi mới nếu cần
    if (field === 'email' && value) {
      if (!isValidEmail(value)) {
        setValidationErrors((prev) => [
          ...prev,
          { id: voterId, field: 'email', message: 'Email không hợp lệ' },
        ]);
      }
    } else if (field === 'sdt' && value) {
      if (!isValidVietnamPhone(value)) {
        setValidationErrors((prev) => [
          ...prev,
          {
            id: voterId,
            field: 'sdt',
            message: 'Số điện thoại không hợp lệ (cần đúng định dạng VN)',
          },
        ]);
      }
    }
  };

  const handleRemoveVoter = (index: number) => {
    const newVoterList = voterList.filter((_, i) => i !== index);
    setVoterList(newVoterList);

    // Xóa các lỗi liên quan đến cử tri này
    const voterToRemove = voterList[index];
    setValidationErrors((prev) => prev.filter((error) => error.id !== voterToRemove.id));
  };

  const handleSelectVoters = (newSelectedVoters: Set<number>) => {
    setSelectedVoters(newSelectedVoters);
  };

  const handleBulkRemoveVoters = () => {
    if (selectedVoters.size === 0) return;
    setShowDeleteAlert(true);
  };

  const confirmBulkDelete = () => {
    const newVoterList = voterList.filter((voter) => !selectedVoters.has(voter.id));
    setVoterList(newVoterList);

    // Xóa các lỗi liên quan đến các cử tri bị xóa
    setValidationErrors((prev) => prev.filter((error) => !selectedVoters.has(error.id)));

    setSelectedVoters(new Set());
    setShowDeleteAlert(false);
    showToast('success', 'Đã xóa cử tri', `Đã xóa ${selectedVoters.size} cử tri khỏi danh sách.`);
  };

  const validateVoters = () => {
    const errors: { id: number; field: string; message: string }[] = [];

    voterList.forEach((voter) => {
      // Kiểm tra email
      if (!voter.email) {
        errors.push({ id: voter.id, field: 'email', message: 'Email không được để trống' });
      } else if (!isValidEmail(voter.email)) {
        errors.push({ id: voter.id, field: 'email', message: 'Email không hợp lệ' });
      }

      // Kiểm tra số điện thoại (nếu có)
      if (voter.sdt && !isValidVietnamPhone(voter.sdt)) {
        errors.push({
          id: voter.id,
          field: 'sdt',
          message: 'Số điện thoại không hợp lệ (cần đúng định dạng VN)',
        });
      }
    });

    // Kiểm tra email trùng lặp trong danh sách
    const emailCounts: Record<string, { count: number; ids: number[] }> = {};
    voterList.forEach((voter) => {
      if (voter.email) {
        const lowerEmail = voter.email.toLowerCase();
        if (!emailCounts[lowerEmail]) {
          emailCounts[lowerEmail] = { count: 0, ids: [] };
        }
        emailCounts[lowerEmail].count++;
        emailCounts[lowerEmail].ids.push(voter.id);
      }
    });

    Object.entries(emailCounts).forEach(([email, { count, ids }]) => {
      if (count > 1) {
        // Đánh dấu tất cả các trường hợp trùng lặp, trừ trường hợp đầu tiên
        ids.slice(1).forEach((id) => {
          errors.push({ id, field: 'email', message: 'Email bị trùng lặp trong danh sách' });
        });
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateVoters();
    setValidationErrors(errors);

    if (errors.length > 0) {
      // Tạo danh sách lỗi chi tiết hơn
      const errorSummary = errors.reduce((acc, err) => {
        const voterIndex = voterList.findIndex((v) => v.id === err.id) + 1;
        return acc + `\n- Cử tri #${voterIndex}: ${err.message} (${err.field})`;
      }, '');

      setAlertMessage(
        `Vui lòng kiểm tra lại thông tin cử tri. Có ${errors.length} lỗi cần được sửa:${errorSummary}`,
      );
      setShowAlert(true);
      return;
    }

    if (voterList.length === 0) {
      showToast('warning', 'Danh sách trống', 'Chưa có cử tri nào được thêm vào danh sách.');
      return;
    }

    // Kiểm tra trùng lặp email trước khi gửi
    setShowDuplicateChecking(true);

    try {
      setIsSaving(true);

      // Sanitize voter data before saving
      const sanitizedVoters = voterList.map((voter) => ({
        ...voter,
        email: voter.email || '',
        sdt: voter.sdt || '',
        xacMinh: Boolean(voter.xacMinh),
        boPhieu: Boolean(voter.boPhieu),
        soLanGuiOTP: Number(voter.soLanGuiOTP || 0),
        cuocBauCuId: Number(voter.cuocBauCuId || parsedCuocBauCuId),
        phienBauCuId: Number(voter.phienBauCuId || phienBauCuId),
        // Không gửi taiKhoanId, để server tự xác định
        vaiTroId: Number(voter.vaiTroId || 0),
        hasBlockchainWallet: Boolean(voter.hasBlockchainWallet),
      }));

      const result = await onSave(sanitizedVoters);

      if (result.success) {
        setVoterList([]);
        showToast(
          'success',
          'Thêm cử tri thành công',
          result.message || `Đã thêm ${voterList.length} cử tri vào hệ thống.`,
          8000,
          true,
        );
      } else {
        showToast(
          'error',
          'Lỗi khi thêm cử tri',
          result.message || 'Đã xảy ra lỗi khi thêm cử tri. Vui lòng thử lại.',
        );
      }
    } catch (error: unknown) {
      console.error('Lỗi khi lưu danh sách cử tri:', error);
      showToast('error', 'Lỗi hệ thống', 'Đã xảy ra lỗi khi lưu danh sách. Vui lòng thử lại sau.');
    } finally {
      setIsSaving(false);
      setShowDuplicateChecking(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(1);
  };

  const handleUploadSuccess = useCallback(
    (uploadedVoters: VoterData[]) => {
      const newVoters = uploadedVoters.map((voter, index) => ({
        id: nextId + index,
        sdt: voter.sdt || '',
        email: voter.email || '',
        xacMinh:
          typeof voter.xacMinh === 'string' ? voter.xacMinh === 'yes' : Boolean(voter.xacMinh),
        boPhieu: false,
        soLanGuiOTP: 0,
        cuocBauCuId: Number(parsedCuocBauCuId),
        phienBauCuId: phienBauCuId,
        // Không gửi taiKhoanId, để server tự xác định
        vaiTroId: Number(voter.vaiTroId || 0),
        hasBlockchainWallet: Boolean(voter.hasBlockchainWallet),
      }));
      setVoterList((prevList) => [...prevList, ...newVoters]);
      setNextId(nextId + uploadedVoters.length);
      setActiveTab('list');
      showToast(
        'success',
        'Nhập dữ liệu thành công',
        `Đã nhập ${uploadedVoters.length} cử tri từ file.`,
      );
    },
    [nextId, parsedCuocBauCuId, phienBauCuId],
  );

  // Add this new function after handleUploadSuccess
  const handleSaveVoters = async (processedVoters: any[]): Promise<void> => {
    try {
      setIsSaving(true);

      // Sanitize voter data before saving và thêm id cho mỗi cử tri
      const sanitizedVoters: CuTri[] = processedVoters.map((voter, index) => ({
        id: nextId + index, // Thêm id cho mỗi cử tri
        email: voter.email || '',
        sdt: voter.sdt || '',
        xacMinh: Boolean(voter.xacMinh),
        boPhieu: Boolean(voter.boPhieu),
        soLanGuiOTP: Number(voter.soLanGuiOTP || 0),
        cuocBauCuId: Number(voter.cuocBauCuId || parsedCuocBauCuId),
        phienBauCuId: Number(voter.phienBauCuId || phienBauCuId),
        // Không gửi taiKhoanId, để server tự xác định
        vaiTroId: Number(voter.vaiTroId || 0),
        hasBlockchainWallet: Boolean(voter.hasBlockchainWallet),
      }));

      // Cập nhật nextId sau khi đã sử dụng
      setNextId(nextId + sanitizedVoters.length);

      const result = await onSave(sanitizedVoters);

      if (result.success) {
        showToast(
          'success',
          'Thêm cử tri thành công',
          result.message || `Đã thêm ${sanitizedVoters.length} cử tri vào hệ thống.`,
          8000,
          true,
        );
      } else {
        showToast(
          'error',
          'Lỗi khi thêm cử tri',
          result.message || 'Đã xảy ra lỗi khi thêm cử tri. Vui lòng thử lại.',
        );
      }
    } catch (error: unknown) {
      console.error('Lỗi khi lưu danh sách cử tri:', error);
      showToast('error', 'Lỗi hệ thống', 'Đã xảy ra lỗi khi lưu danh sách. Vui lòng thử lại sau.');
    } finally {
      setIsSaving(false);
    }
  };

  const getErrorsForVoter = (voterId: number) => {
    return validationErrors.filter((error) => error.id === voterId);
  };

  const filteredVoters = voterList.filter(
    (voter) =>
      (typeof voter.sdt === 'string' && voter.sdt.includes(searchInput)) ||
      (typeof voter.email === 'string' &&
        voter.email.toLowerCase().includes(searchInput.toLowerCase())),
  );

  const paginatedVoters = filteredVoters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const EmptyStateComponent = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/50 dark:bg-[#162A45]/30 border border-gray-200 dark:border-[#2A3A5A]/50 backdrop-blur-sm rounded-2xl shadow-inner">
      <div className="mb-6 w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1A2942]/50 flex items-center justify-center">
        <Users size={48} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-xl mb-4 text-gray-600 dark:text-gray-300 text-center">
        Chưa có cử tri nào. Hãy thêm cử tri đầu tiên!
      </p>
      <Button
        onClick={handleAddVoter}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white hover:shadow-lg dark:hover:shadow-blue-500/20 transition-all transform hover:translate-y-[-2px]"
      >
        <PlusCircle className="mr-2 inline-block" size={16} />
        Thêm cử tri mới
      </Button>
    </div>
  );

  return (
    <ToastProvider>
      <div className="max-w-4xl mx-auto p-4">
        <Card className="shadow-lg border-blue-200 dark:border-blue-700 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-[#0288D1] dark:to-[#6A1B9A] text-white p-6">
            <CardTitle className="text-3xl font-bold text-center">Đăng Ký Cử Tri</CardTitle>
            <CardDescription className="text-blue-100 dark:text-blue-200 text-center">
              Quản lý danh sách cử tri cho phiên bầu cử
            </CardDescription>
          </CardHeader>

          {/* Hiển thị lỗi validation chung */}
          {validationErrors.length > 0 && (
            <Alert
              variant="destructive"
              className="mx-6 mt-6 bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertTitle>Lỗi xác thực</AlertTitle>
              <AlertDescription>
                Vui lòng kiểm tra lại thông tin cử tri. Có {validationErrors.length} lỗi cần được
                sửa.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 p-1">
                <TabsTrigger
                  value="list"
                  className="flex items-center gap-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                >
                  <Users size={16} />
                  <span>Danh sách cử tri</span>
                  {voterList.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {voterList.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="flex items-center gap-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                >
                  <Upload size={16} />
                  <span>Nhập từ file</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="p-6">
              {voterList.length > 0 ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex-1 relative">
                      <Input
                        type="text"
                        placeholder="Tìm kiếm cử tri..."
                        value={searchInput}
                        onChange={handleSearchChange}
                        className="pl-10 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
                      />
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                        size={18}
                      />
                    </div>

                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddVoter}
                              className="bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
                            >
                              <PlusCircle size={16} className="mr-2" />
                              Thêm
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Thêm một cử tri mới vào danh sách</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleBulkRemoveVoters}
                              disabled={selectedVoters.size === 0}
                              className={`bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A] ${
                                selectedVoters.size === 0
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-700'
                              }`}
                            >
                              <Trash2 size={16} className="mr-2" />
                              Xóa {selectedVoters.size > 0 ? `(${selectedVoters.size})` : ''}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Xóa các cử tri đã chọn</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Hiển thị phiên bản compact cho mobile */}
                  {compactView ? (
                    <div className="space-y-3">
                      {paginatedVoters.map((voter, index) => {
                        const errors = getErrorsForVoter(voter.id);
                        const hasEmailError = errors.some((e) => e.field === 'email');
                        const hasPhoneError = errors.some((e) => e.field === 'sdt');

                        return (
                          <div
                            key={voter.id}
                            className={`border rounded-md ${
                              errors.length > 0
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                                : 'bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="p-3 flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedVoters.has(voter.id)}
                                    onChange={() => {
                                      const newSelectedVoters = new Set(selectedVoters);
                                      if (newSelectedVoters.has(voter.id)) {
                                        newSelectedVoters.delete(voter.id);
                                      } else {
                                        newSelectedVoters.add(voter.id);
                                      }
                                      setSelectedVoters(newSelectedVoters);
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                                  />
                                  <span className="font-medium text-gray-700 dark:text-gray-200">
                                    Cử tri #{index + 1}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveVoter((currentPage - 1) * itemsPerPage + index)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="px-3 pb-3 space-y-3">
                              {/* Email input */}
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                  Email
                                </label>
                                <div className="relative">
                                  <Input
                                    type="email"
                                    value={voter.email || ''}
                                    onChange={(e) =>
                                      handleChange(
                                        (currentPage - 1) * itemsPerPage + index,
                                        'email',
                                        e.target.value,
                                      )
                                    }
                                    onFocus={() =>
                                      setEditingField({ id: voter.id, field: 'email' })
                                    }
                                    onBlur={(e) =>
                                      handleFieldBlur(voter.id, 'email', e.target.value)
                                    }
                                    placeholder="email@example.com"
                                    ref={(el) => (emailInputRefs.current[voter.id] = el)}
                                    className={`pl-8 ${
                                      hasEmailError
                                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                        : ''
                                    }`}
                                  />
                                  <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                                {hasEmailError && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors.find((e) => e.field === 'email')?.message}
                                  </p>
                                )}
                              </div>

                              {/* Phone input */}
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                  Số điện thoại
                                </label>
                                <div className="relative">
                                  <Input
                                    type="tel"
                                    value={voter.sdt || ''}
                                    onChange={(e) =>
                                      handleChange(
                                        (currentPage - 1) * itemsPerPage + index,
                                        'sdt',
                                        e.target.value,
                                      )
                                    }
                                    onFocus={() => setEditingField({ id: voter.id, field: 'sdt' })}
                                    onBlur={(e) => handleFieldBlur(voter.id, 'sdt', e.target.value)}
                                    placeholder="0xxxxxxxxx"
                                    ref={(el) => (phoneInputRefs.current[voter.id] = el)}
                                    className={`pl-8 ${
                                      hasPhoneError
                                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                        : ''
                                    }`}
                                  />
                                  <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                                {hasPhoneError && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {errors.find((e) => e.field === 'sdt')?.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Desktop table view
                    <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase sticky top-0">
                          <tr>
                            <th className="p-3 text-left">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedVoters.size === paginatedVoters.length &&
                                    paginatedVoters.length > 0
                                  }
                                  onChange={() => {
                                    if (selectedVoters.size === paginatedVoters.length) {
                                      setSelectedVoters(new Set());
                                    } else {
                                      const newSelectedVoters = new Set<number>();
                                      paginatedVoters.forEach((voter) =>
                                        newSelectedVoters.add(voter.id),
                                      );
                                      setSelectedVoters(newSelectedVoters);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                            </th>
                            <th className="p-3 text-left">
                              <div className="flex items-center">
                                <Mail size={14} className="mr-1 text-gray-400" />
                                <span>Email</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle size={14} className="ml-1 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>
                                        Email của cử tri, dùng để gửi thông báo xác thực và đăng
                                        nhập
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </th>
                            <th className="p-3 text-left">
                              <div className="flex items-center">
                                <Phone size={14} className="mr-1 text-gray-400" />
                                <span>Số điện thoại</span>
                              </div>
                            </th>
                            <th className="p-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Existing table rows */}
                          {/* ... */}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Hiển thị phân trang nếu cần */}
                  {filteredVoters.length > itemsPerPage && (
                    <div className="mt-4">
                      <PaginationPhu
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredVoters.length / itemsPerPage)}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <EmptyStateComponent />
              )}

              {/* Thông tin về quy trình xác thực */}
              {voterList.length > 0 && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-700/30">
                  <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-2 flex items-center">
                    <Info size={16} className="mr-2" />
                    Thông tin về quy trình xác thực
                  </h3>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    Sau khi thêm cử tri, hệ thống sẽ tự động:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>
                        Nếu email đã liên kết với tài khoản có ví blockchain, cử tri sẽ được xác
                        thực tự động.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>
                        Nếu email đã liên kết với tài khoản nhưng chưa có ví blockchain, hệ thống sẽ
                        gửi email xác thực.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>
                        Nếu email chưa liên kết với tài khoản, hệ thống sẽ gửi email xác thực để cử
                        tri đăng ký.
                      </span>
                    </li>
                  </ul>
                  <p className="mt-2 text-sm italic text-blue-700 dark:text-blue-400">
                    Lưu ý: Chỉ cử tri đã được xác thực mới có thể tham gia bỏ phiếu. Cử tri cần nhấp
                    vào liên kết trong email để hoàn tất xác thực.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="import" className="p-6">
              <VoterUploader
                onUploadSuccess={(voters) => {
                  // Đảm bảo dữ liệu cử tri có giá trị mặc định trước khi xử lý
                  const processedVoters = voters.map((voter) => ({
                    ...voter,
                    // Chuyển đổi xacMinh từ string sang boolean nếu cần
                    xacMinh:
                      typeof voter.xacMinh === 'string'
                        ? voter.xacMinh === 'yes'
                        : Boolean(voter.xacMinh),

                    // Đảm bảo các trường bắt buộc có giá trị mặc định
                    boPhieu: false,
                    phienBauCuId: Number(phienBauCuId),
                    cuocBauCuId: Number(parsedCuocBauCuId),
                    soLanGuiOTP: 0,
                    hasBlockchainWallet: false,
                  }));

                  // Xử lý tiếp với dữ liệu đã làm sạch
                  handleSaveVoters(processedVoters);
                }}
                phienBauCuid={Number(phienBauCuId)}
                taiKhoanid={nguoiDung?.id || 0}
              />
            </TabsContent>
          </Tabs>

          <CardFooter className="flex justify-end bg-gray-50 dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleSubmit}
              className="bg-green-500 hover:bg-green-600 text-white dark:bg-gradient-to-r dark:from-[#2E7D32] dark:to-[#1B5E20] transition-all transform hover:translate-y-[-2px] hover:shadow-md"
              disabled={voterList.length === 0 || isSaving || showDuplicateChecking}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : showDuplicateChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kiểm tra trùng lặp...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu Danh Sách Cử Tri
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Alert for validation */}
        <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
          <AlertDialogContent className="bg-white dark:bg-[#162A45] border dark:border-[#2A3A5A] max-w-md mx-auto w-[calc(100vw-32px)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                Thông báo
              </AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-line max-h-[50vh] overflow-y-auto">
                {alertMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Đã hiểu
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alert for bulk delete */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent className="bg-white dark:bg-[#162A45] border dark:border-[#2A3A5A] max-w-md mx-auto w-[calc(100vw-32px)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <Trash2 className="h-5 w-5 text-red-500 mr-2" />
                Xác nhận xóa
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa {selectedVoters.size} cử tri đã chọn? Hành động này không
                thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkDelete}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toast notifications */}
        <Toast
          open={toast.open}
          onOpenChange={(open: boolean) => setToast((prev: ToastState) => ({ ...prev, open }))}
          variant={
            toast.type === 'error'
              ? 'destructive'
              : toast.type === 'success'
                ? 'success'
                : 'default'
          }
        >
          <div className="flex items-start">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-blue-500 mr-2" />}
            <div>
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastDescription>{toast.description}</ToastDescription>
            </div>
          </div>
        </Toast>
        <ToastViewport />
      </div>
    </ToastProvider>
  );
};

export default React.memo(VoterForm);
