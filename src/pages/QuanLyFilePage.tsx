'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFiles, deleteFileAction } from '../store/slice/uploadFileSlice';
import { fetchCuocBauCuByTaiKhoanId } from '../store/slice/cuocBauCuSlice';
import { fetchCacPhienBauCuByCuocBauCuId } from '../store/slice/phienBauCuSlice';
import type { AppDispatch, RootState } from '../store/store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import PaginationPhu from '../components/PaginationPhu';
import { Trash2, Download, Search, SortAsc, SortDesc, ChevronRight } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from '../components/ui/Toast';
import SEO from '../components/SEO';
import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';

const QuanLyFile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const files = useSelector((state: RootState) => state.uploadFile.cacFile);
  const taiKhoan = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  const cuocBauCus = useSelector((state: RootState) => state.cuocBauCu.cacCuocBauCuNguoiDung);
  const phienBauCus = useSelector((state: RootState) => state.phienBauCu.cacPhienBauCu);

  const [selectedCuocBauCu, setSelectedCuocBauCu] = useState<string>('');
  const [selectedPhienBauCu, setSelectedPhienBauCu] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'tenFileDuocTao' | 'ngayTao'>('ngayTao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type: 'success' | 'error' | 'foreground';
  } | null>(null);

  useEffect(() => {
    if (taiKhoan?.id) {
      dispatch(fetchCuocBauCuByTaiKhoanId(taiKhoan.id));
    }
  }, [dispatch, taiKhoan?.id]);

  useEffect(() => {
    if (selectedCuocBauCu) {
      dispatch(fetchCacPhienBauCuByCuocBauCuId(Number(selectedCuocBauCu)));
    }
  }, [dispatch, selectedCuocBauCu]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback(
    (column: 'tenFileDuocTao' | 'ngayTao') => {
      if (column === sortColumn) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    },
    [sortColumn, sortDirection],
  );

  const handleDeleteFile = useCallback((fileName: string) => {
    setFileToDelete(fileName);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteFile = useCallback(async () => {
    if (fileToDelete && taiKhoan?.id) {
      try {
        await dispatch(deleteFileAction(fileToDelete)).unwrap();
        dispatch(fetchFiles({ taiKhoanId: taiKhoan.id }));
        setToastMessage({
          title: 'Xóa file thành công',
          description: `File ${fileToDelete} đã được xóa.`,
          type: 'success',
        });
      } catch (error) {
        setToastMessage({
          title: 'Lỗi khi xóa file',
          description: 'Không thể xóa file. Vui lòng thử lại.',
          type: 'error',
        });
      }
    }
    setShowDeleteConfirm(false);
    setFileToDelete(null);
  }, [dispatch, fileToDelete, taiKhoan?.id]);

  const handleFetchFiles = useCallback(() => {
    if (taiKhoan?.id) {
      dispatch(
        fetchFiles({
          taiKhoanId: taiKhoan.id,
          cuocBauCuId: selectedCuocBauCu ? Number(selectedCuocBauCu) : undefined,
          phienBauCuId: selectedPhienBauCu ? Number(selectedPhienBauCu) : undefined,
        }),
      ).then((action) => {
        if (fetchFiles.fulfilled.match(action)) {
        }
      });
    }
  }, [dispatch, taiKhoan?.id, selectedCuocBauCu, selectedPhienBauCu]);

  useEffect(() => {
    handleFetchFiles();
  }, [handleFetchFiles]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch =
        !searchTerm ||
        (file.tenFileDuocTao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesCuocBauCu = !selectedCuocBauCu || selectedCuocBauCu === '0' || true;
      const matchesPhienBauCu = !selectedPhienBauCu || selectedPhienBauCu === '0' || true;

      return matchesSearch && matchesCuocBauCu && matchesPhienBauCu;
    });
  }, [files, searchTerm, selectedCuocBauCu, selectedPhienBauCu]);

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      if (sortColumn === 'tenFileDuocTao') {
        return sortDirection === 'asc'
          ? (a.tenFileDuocTao ?? '').localeCompare(b.tenFileDuocTao ?? '')
          : (b.tenFileDuocTao ?? '').localeCompare(a.tenFileDuocTao ?? '');
      } else {
        return sortDirection === 'asc'
          ? new Date(a.ngayHienThi ?? 0).getTime() - new Date(b.ngayHienThi ?? 0).getTime()
          : new Date(b.ngayHienThi ?? 0).getTime() - new Date(a.ngayHienThi ?? 0).getTime();
      }
    });
  }, [filteredFiles, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedFiles.length / itemsPerPage);
  const paginatedFiles = sortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <ToastProvider>
      <SEO
        title="Quản lý file | Nền Tảng Bầu Cử Blockchain"
        description="Quản lý và tải lên các file liên quan đến cuộc bầu cử và phiên bầu cử."
        keywords="quản lý file, bầu cử, tải lên file"
        author="Nền Tảng Bầu Cử Blockchain"
        url="https://example.com/quan-ly-file"
      />
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quản Lý File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-4">
            <div className="flex items-center space-x-2">
              <Select
                value={selectedCuocBauCu}
                onValueChange={(value) => {
                  setSelectedCuocBauCu(value);
                  setSelectedPhienBauCu('');
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Chọn Cuộc Bầu Cử" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Hiển thị tất cả</SelectItem>
                  {cuocBauCus.map((cuocBauCu) => (
                    <SelectItem key={cuocBauCu.id} value={cuocBauCu.id.toString()}>
                      {cuocBauCu.tenCuocBauCu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCuocBauCu && (
                <>
                  <ChevronRight className="w-5 h-5" />
                  <Select value={selectedPhienBauCu} onValueChange={setSelectedPhienBauCu}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Chọn Phiên Bầu Cử" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Hiển thị tất cả</SelectItem>
                      {phienBauCus.map((phienBauCu) => (
                        <SelectItem key={phienBauCu.id} value={phienBauCu.id.toString()}>
                          {phienBauCu.tenPhienBauCu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Tìm kiếm file..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="max-w-sm"
                />
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Số mục trên trang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 mục trên trang</SelectItem>
                  <SelectItem value="10">10 mục trên trang</SelectItem>
                  <SelectItem value="20">20 mục trên trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-[30%] cursor-pointer"
                  onClick={() => handleSort('tenFileDuocTao')}
                >
                  Tên File
                  {sortColumn === 'tenFileDuocTao' &&
                    (sortDirection === 'asc' ? (
                      <SortAsc className="inline ml-2 w-4 h-4" />
                    ) : (
                      <SortDesc className="inline ml-2 w-4 h-4" />
                    ))}
                </TableHead>
                <TableHead className="w-[20%]">Kích thước file</TableHead>
                <TableHead className="w-[20%]">Loại file</TableHead>
                <TableHead className="w-[15%] cursor-pointer" onClick={() => handleSort('ngayTao')}>
                  Ngày Tạo
                  {sortColumn === 'ngayTao' &&
                    (sortDirection === 'asc' ? (
                      <SortAsc className="inline ml-2 w-4 h-4" />
                    ) : (
                      <SortDesc className="inline ml-2 w-4 h-4" />
                    ))}
                </TableHead>
                <TableHead className="w-[15%]">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFiles.length > 0 ? (
                paginatedFiles.map((file) => (
                  <TableRow key={file.tenFileDuocTao}>
                    <TableCell className="font-medium">{file.tenFileDuocTao}</TableCell>
                    <TableCell>{file.kichThuocHienThi}</TableCell>
                    <TableCell>{file.noiDungType}</TableCell>
                    <TableCell>
                      {file.ngayHienThi &&
                      !isNaN(parse(file.ngayHienThi, 'dd/MM/yyyy HH:mm', new Date()).getTime())
                        ? format(
                            parse(file.ngayHienThi, 'dd/MM/yyyy HH:mm', new Date()),
                            'dd/MM/yyyy HH:mm',
                            {
                              locale: vi,
                            },
                          )
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.fileUrl, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Tải xuống
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            file.tenFileDuocTao && handleDeleteFile(file.tenFileDuocTao)
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Không có file nào được tìm thấy.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-center">
            <PaginationPhu
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa file</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa file "{fileToDelete}" không? Hành động này không thể
                  hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteFile}>Xóa</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <ToastViewport />
      {toastMessage && (
        <Toast
          variant={
            toastMessage.type === 'success'
              ? 'default'
              : toastMessage.type === 'error'
                ? 'destructive'
                : undefined
          }
        >
          <ToastTitle>{toastMessage.title}</ToastTitle>
          <ToastDescription>{toastMessage.description}</ToastDescription>
        </Toast>
      )}
    </ToastProvider>
  );
};

export default QuanLyFile;
