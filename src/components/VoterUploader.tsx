'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Alert, AlertDescription, AlertTitle } from './ui/Alter';
import {
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle,
  Trash2,
  Loader,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';
import * as XLSX from 'xlsx';
import { uploadFileAction, fetchFiles, deleteFileAction } from '../store/slice/uploadFileSlice';
import type { AppDispatch, RootState } from '../store/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from './ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { ScrollArea } from './ui/Scroll-area';
import { Progress } from './ui/Progress';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/AlterDialog';

interface VoterData {
  email: string;
  sdt: string;
  xacMinh: string;
}

interface VoterUploaderProps {
  onUploadSuccess: (voters: VoterData[]) => void;
  phienBauCuid: number;
  taiKhoanid: number;
}

const VoterUploader: React.FC<VoterUploaderProps> = ({
  onUploadSuccess,
  phienBauCuid,
  taiKhoanid,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const uploadedFiles = useSelector((state: RootState) => state.uploadFile.cacFile);

  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<VoterData[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  useEffect(() => {
    dispatch(
      fetchFiles({
        taiKhoanId: taiKhoanid,
        cuocBauCuId: Number(cuocBauCuId),
      }),
    );
  }, [dispatch, taiKhoanid, cuocBauCuId, phienBauCuid]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadStatus('idle');
    setErrorMessage(null);

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      try {
        const data = await readExcelFile(file);
        if (validateData(data)) {
          setFile(file);
          setPreviewData(data);
        } else {
          throw new Error('Định dạng file không hợp lệ. Vui lòng kiểm tra lại hướng dẫn.');
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'File không hợp lệ');
        setShowErrorDialog(true);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const readExcelFile = useCallback((file: File): Promise<VoterData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          });

          const [, ...rows] = jsonData;
          const voterData = rows.map((row: any) => ({
            email: row[0] as string,
            sdt: row[1] as string,
            xacMinh: row[2] as string,
          }));

          resolve(voterData as VoterData[]);
        } catch (error) {
          reject(new Error('Không thể đọc file. Vui lòng kiểm tra định dạng.'));
        }
      };
      reader.onerror = () => reject(new Error('Đã xảy ra lỗi khi đọc file.'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const validateData = useCallback((data: VoterData[]): boolean => {
    if (data.length < 2) return false;
    const headers = data[0];
    if (!headers.email || !headers.sdt || !headers.xacMinh) return false;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row.email || !row.sdt || (row.xacMinh !== 'yes' && row.xacMinh !== 'no')) {
        return false;
      }
    }
    return true;
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const response = await dispatch(
        uploadFileAction({
          file,
          taiKhoanUploadId: taiKhoanid,
          phienBauCuUploadId: phienBauCuid,
          cuocBauCuUploadId: Number(cuocBauCuId),
        }),
      ).unwrap();

      setUploadStatus('success');
      setUploadProgress(100);
      console.log('Upload Response:', response);

      onUploadSuccess(previewData);

      // Refresh the file list after successful upload
      dispatch(
        fetchFiles({
          taiKhoanId: taiKhoanid,
          cuocBauCuId: Number(cuocBauCuId),
          phienBauCuId: phienBauCuid,
        }),
      );
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải lên file');
      setShowErrorDialog(true);
    }
  }, [file, dispatch, previewData, onUploadSuccess, cuocBauCuId, phienBauCuid, taiKhoanid]);

  const handleDeleteFile = useCallback((fileName: string) => {
    setFileToDelete(fileName);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteFile = useCallback(async () => {
    if (fileToDelete) {
      try {
        await dispatch(deleteFileAction(fileToDelete)).unwrap();
        // Refresh the file list after successful deletion
        dispatch(
          fetchFiles({
            taiKhoanId: taiKhoanid,
            cuocBauCuId: Number(cuocBauCuId),
          }),
        );
      } catch (error) {
        setErrorMessage('Không thể xóa file. Vui lòng thử lại.');
        setShowErrorDialog(true);
      }
    }
    setShowDeleteConfirm(false);
    setFileToDelete(null);
  }, [dispatch, fileToDelete, taiKhoanid, cuocBauCuId]);

  const refreshFileList = useCallback(() => {
    dispatch(
      fetchFiles({
        taiKhoanId: taiKhoanid,
        cuocBauCuId: Number(cuocBauCuId),
      }),
    );
  }, [dispatch, taiKhoanid, cuocBauCuId]);

  return (
    <Card className="shadow-lg border-blue-200 dark:border-blue-700">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white dark:from-blue-700 dark:to-blue-900">
        <CardTitle className="text-2xl font-bold text-center">Tải Lên Danh Sách Cử Tri</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Hướng dẫn định dạng file:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
            <li>File Excel (.xlsx) hoặc CSV (.csv)</li>
            <li>3 cột: Email, Số điện thoại, Xác minh</li>
            <li>Cột "Xác minh" chỉ chấp nhận giá trị "yes" hoặc "no" (mặc định là "yes")</li>
          </ul>
        </div>
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
              : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
          } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300`}
        >
          <input {...getInputProps()} />
          <PlusCircle className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500" />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click để tải lên</span> hoặc kéo thả file vào đây
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Chấp nhận file Excel (.xlsx) hoặc CSV (.csv)
          </p>
        </div>

        {file && (
          <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-200 truncate max-w-[200px]">
                {file.name}
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Xóa file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {uploadStatus === 'uploading' && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {uploadStatus === 'success' && (
          <Alert className="mt-4 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            <AlertTitle>Thành công</AlertTitle>
            <AlertDescription>File đã được tải lên thành công.</AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'error' && (
          <Alert className="mt-4 bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700">
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {previewData.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4 w-full">Xem trước dữ liệu</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Xem Trước Dữ Liệu Cử Tri</DialogTitle>
                <DialogDescription>Đây là bản xem trước dữ liệu cử tri.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Xác minh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 5).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.sdt}</TableCell>
                        <TableCell>{row.xacMinh}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Danh sách file đã tải lên:</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index} // Sử dụng chỉ số làm key tạm thời
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded"
              >
                <span className="text-sm text-gray-600 dark:text-gray-200 truncate max-w-[200px]">
                  {file.tenFileDuocTao}
                </span>
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tải xuống</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            file.tenFileDuocTao && handleDeleteFile(file.tenFileDuocTao)
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Xóa file</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={refreshFileList} className="mt-2 w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới danh sách
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpload}
          disabled={!file || uploadStatus === 'uploading'}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
        >
          {uploadStatus === 'uploading' ? (
            <>
              <Loader className="animate-spin w-5 h-5 mr-2" />
              Đang tải lên...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Tải lên
            </>
          )}
        </Button>
      </CardFooter>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lỗi khi tải lên file</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowErrorDialog(false)}>Đóng</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa file</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa file này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFile}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default React.memo(VoterUploader);
