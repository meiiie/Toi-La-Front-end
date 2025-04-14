// uploadFileBallotSlice.ts - Phiên bản đã cập nhật và hoàn thiện
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import FileService from '../../api/uploadFileBallotApi';

// Định nghĩa interface thống nhất cho response từ API
interface UploadFileResponse {
  success: boolean;
  message?: string;
  ipfsHash?: string;
  cid?: string; // Cho IpfsController.cs compatibility
  url?: string; // Cho IpfsController.cs compatibility
  imageUrl?: string;
  fileInfo?: {
    noiDungType?: string;
    tenFile?: string;
    kichThuoc?: string;
    ngayUpload?: string;
    id?: number;
    [key: string]: any;
  };
}

interface UploadFileBallotState {
  isLoading: boolean;
  error: string | null;
  data: UploadFileResponse | null;
  progress: number;
}

const initialState: UploadFileBallotState = {
  isLoading: false,
  error: null,
  data: null,
  progress: 0,
};

// Hàm tiện ích nhận dạng loại file 3D
const is3DModelFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.glb') || fileName.endsWith('.gltf');
};

// Hàm tiện ích lấy đuôi file hoặc thêm đuôi file cho model 3D
const getProperExtension = (file: File, fileType: 'image' | '3d-model'): string => {
  if (fileType !== '3d-model') return '';

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.glb')) return '.glb';
  if (fileName.endsWith('.gltf')) return '.gltf';

  // Default extension for 3D models if none is detected
  return '.glb';
};

// Thunk để upload file lên IPFS - ĐÃ SỬA namespace
export const uploadToIPFS = createAsyncThunk<
  UploadFileResponse,
  { file: File; fileType: 'image' | '3d-model' },
  { rejectValue: string }
>(
  'uploadFileBallot/uploadToIPFS', // Sửa lại namespace cho đúng
  async ({ file, fileType }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setProgress(0));

      // Kiểm tra và điều chỉnh fileType dựa trên file thực tế
      const actualFileType = is3DModelFile(file) ? '3d-model' : 'image';
      const finalFileType = fileType || actualFileType;

      // Lấy extension thích hợp cho file type
      const fileExtension = getProperExtension(file, finalFileType);

      // Cập nhật tiến trình upload bằng cách giả lập
      const progressInterval = setInterval(() => {
        const randomProgress = Math.floor(Math.random() * 30) + 10;
        dispatch(setProgress(Math.min(95, randomProgress)));
      }, 500);

      // Sử dụng service để upload
      const response = await FileService.uploadToIPFS(file, finalFileType);

      // Xóa interval khi đã upload xong
      clearInterval(progressInterval);
      dispatch(setProgress(100));

      // Đảm bảo phản hồi API được xử lý đúng
      if (response && response.success) {
        // Chuẩn hóa response để phù hợp với interface UploadFileResponse
        let ipfsHash = response.cid;
        let ipfsUrl = `ipfs://${ipfsHash}`;

        // Đảm bảo model 3D có đuôi file phù hợp
        if (finalFileType === '3d-model' && fileExtension && !ipfsHash.endsWith(fileExtension)) {
          ipfsHash = `${ipfsHash}${fileExtension}`;
          ipfsUrl = `ipfs://${ipfsHash}`;
        }

        // Tạo đối tượng phản hồi chuẩn hóa
        return {
          success: true,
          message: response.message || 'Upload successful',
          ipfsHash: ipfsHash,
          cid: ipfsHash, // Đồng bộ cả 2 trường
          url: response.url,
          imageUrl: ipfsUrl,
          fileInfo: {
            noiDungType: finalFileType === '3d-model' ? 'model/gltf-binary' : 'image',
            tenFile: file.name,
            kichThuoc: `${(file.size / 1024).toFixed(2)} KB`,
            ngayUpload: new Date().toISOString(),
            ...(response.fileInfo || {}),
          },
        };
      }

      return response;
    } catch (error: any) {
      console.error('Error uploading file to IPFS:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Lỗi khi upload file lên IPFS',
      );
    }
  },
);

// Thunk để xác thực URL - ĐÃ SỬA namespace
export const validateImageUrl = createAsyncThunk<
  UploadFileResponse,
  string,
  { rejectValue: string }
>(
  'uploadFileBallot/validateImageUrl', // Sửa lại namespace cho đúng
  async (url: string, { rejectWithValue }) => {
    try {
      // Kiểm tra URL IPFS và nhận dạng kiểu nội dung
      if (url.startsWith('ipfs://')) {
        // Kiểm tra xem có phải là model 3D không
        const is3DModel =
          url.toLowerCase().endsWith('.glb') ||
          url.toLowerCase().endsWith('.gltf') ||
          url.toLowerCase().includes('.glb') ||
          url.toLowerCase().includes('.gltf');

        const ipfsHash = url.replace('ipfs://', '');
        return {
          success: true,
          message: is3DModel ? 'URL mô hình 3D IPFS hợp lệ' : 'IPFS URL hình ảnh hợp lệ',
          imageUrl: url,
          ipfsHash: ipfsHash,
          cid: ipfsHash,
          fileInfo: {
            noiDungType: is3DModel ? 'model/gltf-binary' : 'image',
            tenFile: is3DModel
              ? url.split('/').pop() || 'model.glb'
              : url.split('/').pop() || 'image.jpg',
          },
        };
      }

      // Kiểm tra URL bên ngoài cho model 3D
      if (
        url.endsWith('.glb') ||
        url.endsWith('.gltf') ||
        url.toLowerCase().includes('.glb') ||
        url.toLowerCase().includes('.gltf')
      ) {
        return {
          success: true,
          message: 'URL mô hình 3D hợp lệ',
          imageUrl: url,
          fileInfo: {
            noiDungType: 'model/gltf-binary',
            tenFile: url.split('/').pop() || 'model.glb',
          },
        };
      }

      // Thực hiện kiểm tra URL thông qua service
      try {
        const result = await FileService.validateUrl(url);
        return {
          success: true,
          message: 'URL hợp lệ',
          imageUrl: url,
          fileInfo: {
            noiDungType: 'image',
            tenFile: url.split('/').pop() || 'image.jpg',
          },
        };
      } catch (error) {
        // Kiểm tra URL bên ngoài - trả về thành công nếu URL có vẻ hợp lệ
        const urlPattern = /^(https?:\/\/)([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;
        const isValidUrl = urlPattern.test(url);

        if (isValidUrl) {
          return {
            success: true,
            message: 'URL hợp lệ',
            imageUrl: url,
            fileInfo: {
              noiDungType: 'image',
              tenFile: url.split('/').pop() || 'image.jpg',
            },
          };
        } else {
          return rejectWithValue('URL không hợp lệ hoặc không thể truy cập được');
        }
      }
    } catch (error: any) {
      console.error('Error validating URL:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'URL không hợp lệ');
    }
  },
);

const uploadFileBallotSlice = createSlice({
  name: 'uploadFileBallot',
  initialState,
  reducers: {
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    resetUploadState: (state) => {
      state.isLoading = false;
      state.error = null;
      state.data = null;
      state.progress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // uploadToIPFS
      .addCase(uploadToIPFS.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadToIPFS.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
        state.progress = 100;
      })
      .addCase(uploadToIPFS.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.progress = 0;
      })
      // validateImageUrl
      .addCase(validateImageUrl.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(validateImageUrl.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(validateImageUrl.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProgress, resetUploadState } = uploadFileBallotSlice.actions;
export default uploadFileBallotSlice.reducer;
