'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Alert, AlertDescription } from '../../components/ui/Alter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useToast } from '../../test/components/use-toast';
import { Progress } from '../../components/ui/Progress';
import {
  Image,
  UploadCloud,
  Link as LinkIcon,
  FileImage,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Trash,
  Box,
  Info,
  Copy,
  ExternalLink,
  Code,
  Sparkles,
  ShieldAlert,
  Eye,
  Database,
  Lock,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import {
  uploadToIPFS,
  validateImageUrl,
  resetUploadState,
} from '../../store/slice/uploadFileBallotSlice';
import Model3DViewer from './Model3DView';

interface BallotImageUploaderProps {
  initialImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  onImagePreview?: (previewUrl: string) => void;
}

const BallotImageUploader: React.FC<BallotImageUploaderProps> = ({
  initialImageUrl = '',
  onImageChange,
  onImagePreview,
}) => {
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, data, progress } = useSelector(
    (state: RootState) => state.uploadFileBallot,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine initial tab and content type based on URL
  const getInitialState = useCallback(() => {
    if (!initialImageUrl) return { tab: 'upload', is3D: false };

    // Check if it's a 3D model by file extension
    const is3DModel =
      initialImageUrl.endsWith('.glb') ||
      initialImageUrl.endsWith('.gltf') ||
      initialImageUrl.toLowerCase().includes('.glb') ||
      initialImageUrl.toLowerCase().includes('.gltf');

    return {
      tab: is3DModel ? '3d' : 'url',
      is3D: is3DModel,
    };
  }, [initialImageUrl]);

  const initialState = getInitialState();
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | '3d'>(
    initialState.tab as 'upload' | 'url' | '3d',
  );
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  const [previewUrl, setPreviewUrl] = useState<string>(initialImageUrl || '');
  const [is3DModel, setIs3DModel] = useState<boolean>(initialState.is3D);
  const [isValidUrl, setIsValidUrl] = useState<boolean>(!!initialImageUrl);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(!!initialImageUrl);
  // New state to control tab locking
  const [lockedTab, setLockedTab] = useState<'image' | '3d' | null>(
    initialState.is3D ? '3d' : initialImageUrl ? 'image' : null,
  );

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetUploadState());
    };
  }, [dispatch]);

  // Update state when API returns results
  useEffect(() => {
    if (data && data.success) {
      let newImageUrl = '';
      let newPreviewUrl = '';
      let isModel = false;

      if (data.ipfsHash) {
        // Handle IPFS response processing
        newImageUrl = `ipfs://${data.ipfsHash}`;

        // Determine if it's a 3D model based on fileInfo or active tab
        isModel = data.fileInfo?.noiDungType?.includes('model') || activeTab === '3d';

        // For 3D models, preserve file extension in the URL if possible
        if (isModel) {
          // If original filename available and has extension, attach it to IPFS path
          const originalExt = data.fileInfo?.tenFile?.match(/\.(glb|gltf)$/i)?.[0];
          if (originalExt) {
            // Append file extension to IPFS URL to help with content type detection
            newImageUrl = `ipfs://${data.ipfsHash}${originalExt}`;
          } else {
            // Default extension if none detected
            newImageUrl = `ipfs://${data.ipfsHash}.glb`;
          }
          newPreviewUrl = processIPFSUrl(newImageUrl);
        } else {
          // Regular image handling
          newPreviewUrl = `https://ipfs.io/ipfs/${data.ipfsHash}`;
        }
      } else if (data.imageUrl) {
        // Result from validate URL
        newImageUrl = data.imageUrl;

        if (data.imageUrl.startsWith('ipfs://')) {
          newPreviewUrl = processIPFSUrl(data.imageUrl);
        } else {
          newPreviewUrl = data.imageUrl;
        }

        isModel =
          data.imageUrl.endsWith('.glb') ||
          data.imageUrl.endsWith('.gltf') ||
          data.imageUrl.toLowerCase().includes('.glb') ||
          data.imageUrl.toLowerCase().includes('.gltf');
      }

      setImageUrl(newImageUrl);
      setPreviewUrl(newPreviewUrl);
      setIs3DModel(isModel);
      setIsValidUrl(true);
      setShowPreview(true);
      // Lock the appropriate tab based on content type
      setLockedTab(isModel ? '3d' : 'image');

      onImageChange(newImageUrl);
      if (onImagePreview) onImagePreview(newPreviewUrl);

      // Show success toast
      if (newImageUrl) {
        toast({
          title: 'Thành công',
          description: isModel
            ? 'Mô hình 3D đã được cập nhật thành công'
            : 'Hình ảnh đã được cập nhật thành công',
          variant: 'default',
        });
      }
    }
  }, [data, onImageChange, onImagePreview, activeTab, toast]);

  // Process IPFS URL to create a viewable gateway URL
  const processIPFSUrl = useCallback((url: string): string => {
    if (!url.startsWith('ipfs://')) return url;

    const hash = url.replace('ipfs://', '');
    const hashParts = hash.split('.');
    const cid = hashParts[0]; // Extract CID, ignoring file extension if present

    return `https://ipfs.io/ipfs/${cid}${hashParts.length > 1 ? '.' + hashParts.slice(1).join('.') : ''}`;
  }, []);

  // Validate URL when value changes
  useEffect(() => {
    if (activeTab === 'url' && imageUrl) {
      const timer = setTimeout(() => {
        validateImageUrlHandler(imageUrl);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [imageUrl, activeTab]);

  // Validate image URL
  const validateImageUrlHandler = useCallback(
    async (url: string): Promise<boolean> => {
      if (!url) {
        setIsValidUrl(false);
        setShowPreview(false);
        return false;
      }

      setIsValidating(true);

      // Check if it's a 3D model by extension
      const is3D =
        url.endsWith('.glb') ||
        url.endsWith('.gltf') ||
        url.toLowerCase().includes('.glb') ||
        url.toLowerCase().includes('.gltf');

      if (is3D) {
        setIsValidUrl(true);
        setIsValidating(false);
        setPreviewUrl(url);
        setIs3DModel(true);
        setShowPreview(true);
        setLockedTab('3d');
        return true;
      }

      // Check IPFS URL
      if (url.startsWith('ipfs://')) {
        setIsValidUrl(true);
        setIsValidating(false);
        setPreviewUrl(processIPFSUrl(url));

        // Check if IPFS URL contains model extension
        setIs3DModel(url.toLowerCase().includes('.glb') || url.toLowerCase().includes('.gltf'));

        setShowPreview(true);
        setLockedTab(is3DModel ? '3d' : 'image');
        return true;
      }

      try {
        await dispatch(validateImageUrl(url)).unwrap();
        setIsValidating(false);
        setShowPreview(true);
        return true;
      } catch (error) {
        setIsValidUrl(false);
        setIsValidating(false);
        setShowPreview(false);
        return false;
      }
    },
    [dispatch, is3DModel, processIPFSUrl],
  );

  // Handle tab change with locking logic
  const handleTabChange = (value: string) => {
    // If there's a locked tab, prevent switching away from that type
    if (lockedTab === 'image' && value === '3d') {
      toast({
        variant: 'destructive',
        title: 'Không thể chuyển tab',
        description: 'Vui lòng xóa hình ảnh hiện tại trước khi chuyển sang mô hình 3D',
      });
      return;
    }

    if (lockedTab === '3d' && value !== '3d') {
      toast({
        variant: 'destructive',
        title: 'Không thể chuyển tab',
        description: 'Vui lòng xóa mô hình 3D hiện tại trước khi chuyển sang hình ảnh',
      });
      return;
    }

    setActiveTab(value as 'upload' | 'url' | '3d');
  };

  // Handle file selection button click
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await handleUploadFile(files[0]);
    }
  };

  // Handle drag and drop
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      await handleUploadFile(files[0]);
    }
  };

  // Upload file to IPFS
  // Upload file to IPFS
  const handleUploadFile = async (file: File) => {
    // Xác định loại file
    const isImageFile = file.type.startsWith('image/');
    const is3DModelFile = file.name.endsWith('.glb') || file.name.endsWith('.gltf');

    // Kiểm tra xung đột với tab đã khóa
    if (lockedTab === 'image' && is3DModelFile) {
      toast({
        variant: 'destructive',
        title: 'Không thể tải lên',
        description: 'Vui lòng xóa hình ảnh hiện tại trước khi tải lên mô hình 3D',
      });
      return;
    }

    if (lockedTab === '3d' && isImageFile) {
      toast({
        variant: 'destructive',
        title: 'Không thể tải lên',
        description: 'Vui lòng xóa mô hình 3D hiện tại trước khi tải lên hình ảnh',
      });
      return;
    }

    if (!isImageFile && !is3DModelFile) {
      toast({
        variant: 'destructive',
        title: 'Lỗi định dạng file',
        description: 'Vui lòng chọn file hình ảnh (jpg, png, gif, svg) hoặc mô hình 3D (glb, gltf)',
      });
      return;
    }

    // Kiểm tra kích thước file
    const maxSize = is3DModelFile ? 30 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: `Kích thước file quá lớn (tối đa ${is3DModelFile ? '30MB' : '10MB'})`,
      });
      return;
    }

    try {
      // Hiển thị thông báo đang tải
      toast({
        title: 'Đang xử lý',
        description: 'Đang tải file lên IPFS, vui lòng đợi trong giây lát...',
      });

      console.log('File upload process started:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: is3DModelFile ? '3d-model' : 'image',
      });

      // GỬI FILE LÊN IPFS - KHỐI CODE QUAN TRỌNG
      try {
        // Sử dụng try-catch riêng để xử lý lỗi dispatch
        const result = await dispatch(
          uploadToIPFS({
            file,
            fileType: is3DModelFile ? '3d-model' : 'image',
          }),
        ).unwrap();

        console.log('Upload completed successfully:', result);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (dispatchError: any) {
        console.error('Dispatch error:', dispatchError);
        throw new Error(dispatchError?.message || 'Lỗi trong quá trình xử lý upload');
      }
    } catch (error: any) {
      console.error('File upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi upload',
        description: error?.message || 'Không thể upload file',
      });
    }
  };

  // Handle URL change
  const handleUrlChange = (value: string) => {
    setImageUrl(value);
    // Check if it's a 3D model
    if (
      value.endsWith('.glb') ||
      value.endsWith('.gltf') ||
      value.toLowerCase().includes('.glb') ||
      value.toLowerCase().includes('.gltf')
    ) {
      setIs3DModel(true);
    } else {
      setIs3DModel(false);
    }
  };

  // Handle URL confirmation
  const handleConfirmUrl = async () => {
    // Check if URL would conflict with locked tab
    const is3DUrl =
      imageUrl.endsWith('.glb') ||
      imageUrl.endsWith('.gltf') ||
      imageUrl.toLowerCase().includes('.glb') ||
      imageUrl.toLowerCase().includes('.gltf');

    if (lockedTab === 'image' && is3DUrl) {
      toast({
        variant: 'destructive',
        title: 'Không thể sử dụng URL này',
        description: 'Vui lòng xóa hình ảnh hiện tại trước khi sử dụng URL mô hình 3D',
      });
      return;
    }

    if (lockedTab === '3d' && !is3DUrl) {
      toast({
        variant: 'destructive',
        title: 'Không thể sử dụng URL này',
        description: 'Vui lòng xóa mô hình 3D hiện tại trước khi sử dụng URL hình ảnh',
      });
      return;
    }

    if (await validateImageUrlHandler(imageUrl)) {
      onImageChange(imageUrl);
      if (onImagePreview) onImagePreview(previewUrl);

      toast({
        title: 'Cập nhật thành công',
        description: `URL ${is3DModel ? 'mô hình 3D' : 'hình ảnh'} đã được cập nhật`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'URL không hợp lệ',
        description: 'Vui lòng kiểm tra lại URL',
      });
    }
  };

  // Use default 3D model
  const handleUseDefault3DModel = () => {
    // Check if this would conflict with locked tab
    if (lockedTab === 'image') {
      toast({
        variant: 'destructive',
        title: 'Không thể sử dụng mô hình 3D',
        description: 'Vui lòng xóa hình ảnh hiện tại trước khi sử dụng mô hình 3D',
      });
      return;
    }

    const defaultModelUrl = '/models/coin4.glb';
    setImageUrl(defaultModelUrl);
    setPreviewUrl(defaultModelUrl);
    setIsValidUrl(true);
    setIs3DModel(true);
    setShowPreview(true);
    setLockedTab('3d');
    onImageChange(defaultModelUrl);
    if (onImagePreview) onImagePreview(defaultModelUrl);

    toast({
      title: 'Đã chọn mô hình 3D mặc định',
      description: 'Phiếu bầu sẽ sử dụng mô hình 3D mặc định',
    });
  };

  // Clear image/model
  const handleClearImage = () => {
    setImageUrl('');
    setPreviewUrl('');
    setIsValidUrl(false);
    setIs3DModel(false);
    setShowPreview(false);
    setLockedTab(null); // Unlock tabs
    onImageChange('');
    if (onImagePreview) onImagePreview('');

    toast({
      title: 'Đã xóa',
      description: 'Đã xóa hình ảnh/mô hình 3D',
    });
  };

  // Copy URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(imageUrl).then(() => {
      toast({
        title: 'Đã sao chép',
        description: 'URL đã được sao chép vào clipboard',
      });
    });
  };

  return (
    <Card className="border-t-2 border-blue-500 dark:border-blue-600 shadow-sm backdrop-blur-sm bg-white/70 dark:bg-gray-900/70">
      <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
            {is3DModel ? (
              <Box className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Image className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <CardTitle className="text-sm md:text-base text-gray-800 dark:text-gray-100">
            {is3DModel ? 'Mô hình 3D phiếu bầu' : 'Hình ảnh phiếu bầu'}
            {is3DModel && (
              <span className="ml-1 md:ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                <Sparkles className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                3D
              </span>
            )}
          </CardTitle>
        </div>
        <CardDescription className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Tải lên hoặc nhập URL cho phiếu bầu NFT của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="p-3 md:p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 mb-3 md:mb-4 bg-gray-100 dark:bg-gray-800/60 text-xs md:text-sm">
            <TabsTrigger
              value="upload"
              className="flex items-center gap-1 md:gap-2 py-1.5 md:py-2 px-1 md:px-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
              disabled={false} // Always available for new uploads
            >
              <UploadCloud className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Tải lên</span>
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="flex items-center gap-1 md:gap-2 py-1.5 md:py-2 px-1 md:px-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
              disabled={false} // Always available for URL input
            >
              <LinkIcon className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Nhập URL</span>
            </TabsTrigger>
            <TabsTrigger
              value="3d"
              className="flex items-center gap-1 md:gap-2 py-1.5 md:py-2 px-1 md:px-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 relative"
              disabled={lockedTab === 'image'} // Disabled if image is locked
            >
              <Box className="h-3 w-3 md:h-4 md:w-4" />
              <span className="truncate">Mô hình 3D</span>
              {lockedTab === 'image' && (
                <Lock className="h-2 w-2 md:h-3 md:w-3 absolute -top-1 -right-1 text-gray-500" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Upload */}
          <TabsContent value="upload">
            <div
              className={`relative border-2 border-dashed rounded-lg p-3 md:p-6 transition-all ${
                dragOver
                  ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              // Add touch event for mobile to improve drop area interaction
              onTouchStart={() => setDragOver(true)}
              onTouchEnd={() => setDragOver(false)}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={
                  lockedTab === '3d'
                    ? '.glb,.gltf'
                    : lockedTab === 'image'
                      ? 'image/*'
                      : 'image/*,.glb,.gltf'
                }
              />

              <div className="flex flex-col items-center justify-center gap-2 md:gap-3">
                <div className="p-2 md:p-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                  <UploadCloud className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200">
                    Kéo và thả file vào đây
                  </h3>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                    {lockedTab === '3d'
                      ? 'Hỗ trợ mô hình 3D (GLB, GLTF)'
                      : lockedTab === 'image'
                        ? 'Hỗ trợ hình ảnh (JPG, PNG, GIF)'
                        : 'Hỗ trợ hình ảnh và mô hình 3D'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectFile}
                  disabled={isLoading}
                  className="mt-1 md:mt-2 py-1 h-8 md:h-9 border-blue-200 dark:border-blue-800/60 bg-white dark:bg-gray-800"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 animate-spin" />
                      <span className="text-xs md:text-sm">Đang tải... {progress}%</span>
                    </>
                  ) : (
                    <>
                      <FileImage className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="text-xs md:text-sm">Chọn file</span>
                    </>
                  )}
                </Button>
              </div>

              {isLoading && (
                <div className="mt-3 md:mt-4">
                  <Progress
                    value={progress}
                    className="h-1.5 md:h-2 bg-gray-200 dark:bg-gray-700"
                  />
                  <p className="text-[10px] md:text-xs text-center mt-1 text-gray-500">
                    Đang tải lên IPFS... {progress}%
                  </p>
                </div>
              )}
            </div>

            <Alert className="mt-3 md:mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 py-2 px-3 md:p-4">
              <Info className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-[10px] md:text-xs">
                File được tải lên sẽ được lưu trữ trên IPFS để đảm bảo tính phân tán và bền vững cho
                phiếu bầu NFT của bạn.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Tab URL */}
          <TabsContent value="url">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Nhập URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    placeholder={
                      lockedTab === '3d'
                        ? 'https://... hoặc ipfs://... (đuôi .glb, .gltf)'
                        : lockedTab === 'image'
                          ? 'https://... hoặc ipfs://... (hình ảnh)'
                          : 'https://... hoặc ipfs://...'
                    }
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={`flex-1 ${
                      imageUrl
                        ? isValidUrl
                          ? 'border-green-300 focus:border-green-500 dark:border-green-700'
                          : 'border-red-300 focus:border-red-500 dark:border-red-700'
                        : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConfirmUrl}
                    disabled={isValidating || !imageUrl}
                    className="shrink-0 bg-white dark:bg-gray-800"
                    title="Xác nhận URL"
                  >
                    {isValidating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearImage}
                    disabled={!imageUrl}
                    className="shrink-0 bg-white dark:bg-gray-800"
                    title="Xóa URL"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lockedTab === '3d'
                    ? 'Nhập URL đến mô hình 3D (đuôi .glb, .gltf) hoặc URL IPFS (ipfs://...)'
                    : lockedTab === 'image'
                      ? 'Nhập URL đến hình ảnh hoặc URL IPFS (ipfs://...)'
                      : 'Nhập URL đến hình ảnh hoặc mô hình 3D hoặc URL IPFS (ipfs://...)'}
                </p>

                {imageUrl && !isValidUrl && !isValidating && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      URL không hợp lệ hoặc không thể tải nội dung từ URL này.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex flex-col gap-2 text-sm mt-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Code className="h-4 w-4" />
                  <span className="font-medium">Ví dụ URL hợp lệ:</span>
                </div>
                <div className="grid gap-2 text-xs ml-6">
                  {lockedTab !== '3d' && (
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <ExternalLink className="h-3 w-3" />
                      <code>https://example.com/image.jpg</code>
                    </div>
                  )}
                  {lockedTab !== 'image' && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <ExternalLink className="h-3 w-3" />
                      <code>https://example.com/model.glb</code>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                    <ExternalLink className="h-3 w-3" />
                    <code>
                      ipfs://
                      {lockedTab === '3d'
                        ? 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco.glb'
                        : lockedTab === 'image'
                          ? 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
                          : 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3D Model */}
          <TabsContent value="3d">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modelUrl">URL mô hình 3D (.glb, .gltf)</Label>
                <div className="flex gap-2">
                  <Input
                    id="modelUrl"
                    placeholder="https://... hoặc /models/coin4.glb"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseDefault3DModel}
                    title="Sử dụng mô hình mặc định"
                    className="shrink-0 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800/60"
                  >
                    <Box className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nhập URL tới mô hình 3D hoặc sử dụng mô hình mặc định
                </p>
              </div>

              <Alert className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800/50">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <AlertDescription>
                  Mô hình 3D sẽ giúp phiếu bầu NFT của bạn trở nên sinh động và độc đáo hơn. Định
                  dạng hỗ trợ: GLB, GLTF.
                </AlertDescription>
              </Alert>

              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border-blue-200 dark:border-blue-800/60"
                  onClick={handleSelectFile}
                >
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Tải lên mô hình 3D
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {showPreview && isValidUrl && (
          <div className="mt-4 md:mt-6 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/30 backdrop-blur-sm">
            <div className="flex items-center justify-between p-2 md:p-3 border-b bg-gray-100 dark:bg-gray-800">
              <h3 className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                <Eye className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />
                <span>{is3DModel ? 'Mô hình 3D' : 'Hình ảnh'} - Xem trước</span>
              </h3>
              <div className="flex gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 md:h-8 px-1.5 md:px-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  onClick={handleCopyUrl}
                  title="Sao chép URL"
                >
                  <Copy className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 md:h-8 px-1.5 md:px-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  onClick={handleClearImage}
                  title="Xóa hình ảnh"
                >
                  <Trash className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-500" />
                </Button>
              </div>
            </div>

            <div className="p-3 md:p-4">
              {is3DModel ? (
                <Model3DViewer
                  modelUrl={previewUrl}
                  height="300px"
                  autoRotate={true}
                  className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="aspect-square max-h-[300px] rounded-md overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {previewUrl.startsWith('https://ipfs.io/ipfs/') ||
                  previewUrl.startsWith('ipfs://') ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previewUrl}
                        alt="Ballot Preview"
                        className="max-h-full max-w-full object-contain mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/300x300/e2e8f0/667085?text=IPFS+Image';
                        }}
                      />
                      <div className="absolute bottom-2 right-2 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded text-xs text-blue-700 dark:text-blue-300 font-medium">
                        <Database className="h-3 w-3 inline mr-1" />
                        IPFS
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Ballot Preview"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/300x300/e2e8f0/667085?text=Image+Error';
                      }}
                    />
                  )}
                </div>
              )}

              <div className="mt-3 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  {imageUrl}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <Alert variant="destructive" className="mt-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Lỗi: {error}. Vui lòng thử lại hoặc liên hệ quản trị viên.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-3 md:pt-4 p-3 md:p-4 bg-gray-50/50 dark:bg-gray-900/30">
        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
          {is3DModel ? 'Mô hình 3D' : 'Hình ảnh'} sẽ được hiển thị trên phiếu bầu NFT
        </p>
        <Button
          variant="default"
          size="sm"
          onClick={isValidUrl ? handleCopyUrl : handleSelectFile}
          className="h-7 md:h-8 text-xs md:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          {isValidUrl ? (
            <>
              <Copy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Sao chép URL
            </>
          ) : (
            <>
              <UploadCloud className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Tải lên mới
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BallotImageUploader;
