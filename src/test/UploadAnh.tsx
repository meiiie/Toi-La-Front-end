'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { fetchImageUrl, uploadImage, deleteImage } from '../store/slice/cuocBauCuImageSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Upload,
  Loader2,
  ImageIcon,
  FileText,
  Calendar,
  Info,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../test/components/use-toast';
import { useParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
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

const UploadAnh: React.FC = () => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  // State từ Redux
  const {
    dangTai: dangTaiAnh,
    uploadSuccess,
    uploadError,
    imageUrl,
    fileName,
    fileInfo,
  } = useSelector((state: RootState) => state.cuocBauCuImage);

  // Local state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Lấy ảnh hiện tại khi component mount
  useEffect(() => {
    if (cuocBauCuId) {
      dispatch(fetchImageUrl(Number(cuocBauCuId)));
    }

    // Cleanup khi unmount
    return () => {
      // Xóa preview URL khi component unmount
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [dispatch, cuocBauCuId]);

  // Hiển thị thông báo sau khi upload
  useEffect(() => {
    if (uploadSuccess === true) {
      toast({
        title: 'Tải ảnh thành công',
        description: 'Ảnh đã được cập nhật cho cuộc bầu cử',
      });

      // Xóa file đã chọn và preview
      setFile(null);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setIsUploading(false);
    } else if (uploadSuccess === false) {
      toast({
        title: 'Tải ảnh thất bại',
        description: uploadError || 'Có lỗi xảy ra khi tải ảnh',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  }, [uploadSuccess, uploadError, toast, previewUrl]);

  // Xử lý chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Kiểm tra xem có phải là ảnh không
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: 'Loại file không hỗ trợ',
          description: 'Vui lòng chọn file ảnh (JPEG, PNG, GIF, ...)',
          variant: 'destructive',
        });
        return;
      }

      // Kiểm tra kích thước (giới hạn 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'File quá lớn',
          description: 'Vui lòng chọn file ảnh có kích thước nhỏ hơn 5MB',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);

      // Tạo URL preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  // Xử lý upload ảnh
  const handleUpload = async () => {
    if (!cuocBauCuId) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy ID cuộc bầu cử',
        variant: 'destructive',
      });
      return;
    }

    if (!file) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn file ảnh',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    dispatch(uploadImage({ id: Number(cuocBauCuId), imageFile: file }));
  };

  // Xử lý xóa ảnh
  const handleDelete = async () => {
    if (!cuocBauCuId || !fileName) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa ảnh',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await dispatch(deleteImage({ id: Number(cuocBauCuId), fileName })).unwrap();
      toast({
        title: 'Xóa ảnh thành công',
        description: 'Ảnh đã được xóa khỏi cuộc bầu cử',
      });
      setShowDeleteConfirm(false);
    } catch (error) {
      toast({
        title: 'Xóa ảnh thất bại',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa ảnh',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Xử lý hủy chọn file
  const handleCancelSelection = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload ảnh */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Ảnh đại diện cuộc bầu cử
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tải lên ảnh đại diện cho cuộc bầu cử của bạn
            </p>
          </div>
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
            <Info className="h-4 w-4 mr-1" />
            <span>Kích thước tối đa: 5MB</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50">
            {previewUrl || imageUrl ? (
              <div className="w-full">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-white dark:bg-gray-700 mb-4">
                  <img
                    src={previewUrl || imageUrl || '/placeholder.svg'}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/png;base64,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';
                    }}
                  />

                  {/* Overlay actions for existing image */}
                  {imageUrl && !previewUrl && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white text-gray-800 hover:bg-gray-100"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Thay thế
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {file ? (
                      <span>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    ) : fileInfo ? (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{fileName || fileInfo.tenFile}</span>
                      </div>
                    ) : (
                      <span>Ảnh đại diện</span>
                    )}
                  </div>
                  {fileInfo && !previewUrl && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{fileInfo.ngayUpload}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kéo thả hoặc nhấp để tải lên
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Hỗ trợ JPG, PNG, GIF (tối đa 5MB)
                </p>
                <Button
                  variant="outline"
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Chọn file
                </Button>
              </div>
            )}
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={dangTaiAnh}
            />
          </div>

          <div className="md:w-64 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Lưu ý
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc pl-4">
                <li>Ảnh sẽ được hiển thị ở trang chi tiết cuộc bầu cử</li>
                <li>Nên sử dụng ảnh có tỷ lệ 16:9 để hiển thị tốt nhất</li>
                <li>Ảnh sẽ được lưu trữ an toàn trên Azure Blob Storage</li>
                <li>Tải ảnh mới sẽ ghi đè lên ảnh cũ</li>
              </ul>
            </div>

            {previewUrl && file ? (
              <>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Tải lên
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={handleCancelSelection}
                >
                  Hủy
                </Button>
              </>
            ) : imageUrl ? (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thay thế ảnh
                </Button>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa ảnh
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg opacity-50 cursor-not-allowed"
                disabled={true}
              >
                <Upload className="mr-2 h-4 w-4" />
                Tải lên
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Thông báo lỗi */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi khi tải ảnh</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa ảnh</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Bạn có chắc chắn muốn xóa ảnh này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
              disabled={isDeleting}
            >
              {isDeleting ? (
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
    </div>
  );
};

export default UploadAnh;
