'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Clock,
  Users,
  Mail,
  Filter,
  Loader2,
  CheckSquare,
  XCircle,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';
import { guiXacThucCuTri, xacThucHangLoatCuTri } from '../store/slice/maOTPSlice';
import { editCuTri } from '../store/slice/cuTriSlice';
import type { CuTri } from '../store/types';
import type { RootState, AppDispatch } from '../store/store';
import PaginationPhu from '../components/PaginationPhu';

interface CuTriVerificationStatusProps {
  cuTris: CuTri[];
  phienBauCuId: number;
  cuocBauCuId: number;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

const CuTriVerificationStatus: React.FC<CuTriVerificationStatusProps> = ({
  cuTris,
  phienBauCuId,
  cuocBauCuId,
  onRefresh,
  isLoading = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const xacThucState = useSelector((state: RootState) => state.maOTP);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVoters, setSelectedVoters] = useState<Set<number>>(new Set());
  const [isVerifyingVoter, setIsVerifyingVoter] = useState<number | null>(null);
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Phân loại cử tri theo trạng thái xác thực
  const daXacThuc = cuTris.filter((ct) => ct.xacMinh);
  const chuaXacThuc = cuTris.filter((ct) => !ct.xacMinh);
  const dangChoXacThuc = chuaXacThuc.filter((ct) => ct.soLanGuiOTP && ct.soLanGuiOTP > 0);
  const chuaGuiXacThuc = chuaXacThuc.filter((ct) => !ct.soLanGuiOTP || ct.soLanGuiOTP === 0);

  // Tính phần trăm đã xác thực
  const phanTramXacThuc =
    cuTris.length > 0 ? Math.round((daXacThuc.length / cuTris.length) * 100) : 0;

  // Lọc cử tri theo tìm kiếm và trạng thái
  const filteredVoters = cuTris.filter((voter) => {
    const matchesSearch =
      searchTerm === '' ||
      (voter.email && voter.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (voter.sdt && voter.sdt.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesStatus = true;
    if (selectedStatus === 'verified') {
      matchesStatus = voter.xacMinh === true;
    } else if (selectedStatus === 'pending') {
      matchesStatus =
        voter.xacMinh === false && typeof voter.soLanGuiOTP === 'number' && voter.soLanGuiOTP > 0;
    } else if (selectedStatus === 'not_sent') {
      matchesStatus = voter.xacMinh === false && (!voter.soLanGuiOTP || voter.soLanGuiOTP === 0);
    }

    return matchesSearch && matchesStatus;
  });

  // Tính toán tổng số trang dựa trên danh sách đã lọc
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredVoters.length / itemsPerPage)));
    if (
      currentPage > Math.ceil(filteredVoters.length / itemsPerPage) &&
      filteredVoters.length > 0
    ) {
      setCurrentPage(1);
    }
  }, [filteredVoters, itemsPerPage, currentPage]);

  // Lấy danh sách cử tri cho trang hiện tại
  const paginatedVoters = filteredVoters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Xử lý chọn tất cả
  const handleSelectAll = () => {
    if (selectedVoters.size === paginatedVoters.length) {
      setSelectedVoters(new Set());
    } else {
      const newSelectedVoters = new Set<number>();
      paginatedVoters.forEach((voter) => newSelectedVoters.add(voter.id));
      setSelectedVoters(newSelectedVoters);
    }
  };

  // Xử lý chọn một cử tri
  const handleSelectVoter = (id: number) => {
    const newSelectedVoters = new Set(selectedVoters);
    if (newSelectedVoters.has(id)) {
      newSelectedVoters.delete(id);
    } else {
      newSelectedVoters.add(id);
    }
    setSelectedVoters(newSelectedVoters);
  };

  // Gửi xác thực cho một cử tri
  const handleVerifyVoter = async (voterId: number) => {
    setIsVerifyingVoter(voterId);

    try {
      const voterToVerify = cuTris.find((voter) => voter.id === voterId);
      if (!voterToVerify || !voterToVerify.email) {
        throw new Error('Không tìm thấy thông tin cử tri hoặc cử tri không có email');
      }

      const result = await dispatch(
        guiXacThucCuTri({
          email: voterToVerify.email,
          phienBauCuId: phienBauCuId,
          cuocBauCuId: cuocBauCuId,
        }),
      ).unwrap();

      if (result.success) {
        // Lấy thông tin cử tri đã cập nhật từ kết quả API
        const updatedVoter = result.cuTri;

        // Cập nhật danh sách cử tri nếu cần
        if (updatedVoter) {
          dispatch(
            editCuTri({
              id: voterId,
              cuTri: updatedVoter,
            }),
          );
        }

        setMessage({
          type: 'success',
          text: `Đã gửi email xác thực đến ${voterToVerify.email}`,
        });
      } else {
        throw new Error(result.message || 'Không thể gửi email xác thực');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể gửi email xác thực',
      });
    } finally {
      setIsVerifyingVoter(null);

      // Refresh data để cập nhật trạng thái
      setTimeout(async () => {
        await onRefresh();
      }, 1000);

      // Hiển thị thông báo lâu hơn (10 giây)
      setTimeout(() => setMessage(null), 10000);
    }
  };

  // Gửi xác thực hàng loạt
  const handleBulkVerify = async () => {
    const votersToVerify =
      selectedVoters.size > 0
        ? chuaXacThuc.filter((voter) => selectedVoters.has(voter.id))
        : chuaXacThuc;

    const unverifiedVoters = votersToVerify.filter((voter) => !voter.xacMinh && voter.email);

    if (unverifiedVoters.length === 0) {
      setMessage({
        type: 'info',
        text: 'Không có cử tri nào cần xác thực hoặc tất cả cử tri đều không có email.',
      });
      return;
    }

    setIsBulkVerifying(true);
    setMessage({
      type: 'info',
      text: `Đang gửi email xác thực cho ${unverifiedVoters.length} cử tri...`,
    });

    try {
      // Lấy danh sách ID cử tri
      const voterIds = unverifiedVoters.map((voter) => voter.id);

      // Gọi API để gửi xác thực hàng loạt
      const result = await dispatch(xacThucHangLoatCuTri(voterIds)).unwrap();

      // Phân tích kết quả
      const successCount = result.filter((item: any) => item.thanhCong).length;
      const errorCount = result.length - successCount;

      setMessage({
        type: 'success',
        text: `Đã gửi ${successCount}/${voterIds.length} email xác thực thành công${errorCount > 0 ? `, ${errorCount} thất bại` : ''}.`,
      });

      // Refresh data
      await onRefresh();

      // Reset selection
      setSelectedVoters(new Set());
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể gửi email xác thực hàng loạt',
      });
    } finally {
      setIsBulkVerifying(false);
      setTimeout(() => setMessage(null), 10000);
    }
  };

  return (
    <Card className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
          Trạng thái xác thực cử tri
        </CardTitle>
        <CardDescription>Theo dõi và quản lý trạng thái xác thực của cử tri</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {/* Hiển thị thông báo */}
        {message && (
          <div
            className={`p-4 border-b ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300'
                : message.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300'
            }`}
          >
            <div className="flex items-start">
              {message.type === 'success' && <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
              {message.type === 'error' && <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
              {message.type === 'info' && <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />}
              <p>{message.text}</p>
            </div>
          </div>
        )}

        {/* Thống kê */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-[#1A2942]/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tổng cử tri</p>
                <p className="text-2xl font-bold">{cuTris.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A2942]/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Đã xác thực</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {daXacThuc.length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A2942]/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chờ xác thực</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {dangChoXacThuc.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A2942]/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chưa gửi</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {chuaGuiXacThuc.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Tiến trình xác thực */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Tiến trình xác thực</p>
            <p className="text-sm font-medium">{phanTramXacThuc}%</p>
          </div>
          <Progress value={phanTramXacThuc} className="h-2" />
        </div>

        {/* Tìm kiếm và lọc */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Tìm kiếm cử tri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
            />
            <Mail
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={18}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]">
                <Filter className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="verified">Đã xác thực</SelectItem>
                <SelectItem value="pending">Chờ xác thực</SelectItem>
                <SelectItem value="not_sent">Chưa gửi</SelectItem>
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
                    onClick={onRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Làm mới dữ liệu</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={handleBulkVerify}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white"
              disabled={isBulkVerifying || chuaXacThuc.length === 0}
            >
              {isBulkVerifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              <span className="hidden sm:inline">Gửi xác thực hàng loạt</span>
              <span className="sm:hidden">Gửi hàng loạt</span>
            </Button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedVoters.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-100 dark:border-blue-800/30">
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
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleBulkVerify}
                disabled={isBulkVerifying}
              >
                {isBulkVerifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Gửi xác thực
              </Button>
            </div>
          </div>
        )}

        {/* Danh sách cử tri */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-[#1A2942]">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedVoters.size === paginatedVoters.length && paginatedVoters.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    className="border-gray-300 dark:border-gray-600"
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ví blockchain</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVoters.length > 0 ? (
                paginatedVoters.map((voter) => (
                  <TableRow key={voter.id} className="hover:bg-gray-50 dark:hover:bg-[#1A2942]/50">
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
                    </TableCell>
                    <TableCell>{voter.sdt || 'Chưa có SĐT'}</TableCell>
                    <TableCell>
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
                          {(voter.soLanGuiOTP ?? 0) > 1 ? `(${voter.soLanGuiOTP} lần)` : ''}
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
                    <TableCell>
                      <Badge
                        variant={voter.hasBlockchainWallet ? 'default' : 'outline'}
                        className={
                          voter.hasBlockchainWallet
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }
                      >
                        {voter.hasBlockchainWallet ? 'Đã liên kết' : 'Chưa liên kết'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!voter.xacMinh && voter.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerifyVoter(voter.id)}
                          disabled={isVerifyingVoter === voter.id}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          {isVerifyingVoter === voter.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Gửi xác thực
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    Không tìm thấy cử tri nào phù hợp với bộ lọc
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Phân trang */}
        {filteredVoters.length > itemsPerPage && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <PaginationPhu
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CuTriVerificationStatus;
