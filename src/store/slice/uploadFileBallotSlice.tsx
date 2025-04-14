// uploadFileBallotSlice.ts - Phiên bản đã cập nhật
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import FileService from '../../api/uploadFileBallotApi';

// Updated response type to match what the component is expecting
interface UploadFileResponse {
  success: boolean;
  message?: string;
  ipfsHash?: string;
  cid?: string; // Added for IpfsController.cs response compatibility
  url?: string; // Added for IpfsController.cs response compatibility
  imageUrl?: string;
  fileInfo?: {
    noiDungType?: string;
    tenFile?: string;
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

// Thunk để upload file lên IPFS qua Pinata
export const uploadToIPFS = createAsyncThunk(
  'uploadFile/uploadToIPFS',
  async (
    { file, fileType }: { file: File; fileType: 'image' | '3d-model' },
    { rejectWithValue, dispatch },
  ) => {
    try {
      dispatch(setProgress(0));
      console.log('Starting IPFS upload process:', { fileName: file.name, fileType });

      // Sử dụng service để upload
      const response = await FileService.uploadToIPFS(file, fileType);

      console.log('IPFS upload completed:', response);

      // Xử lý kết quả
      if (response && response.success) {
        // QUAN TRỌNG: Chuyển đổi từ cid sang ipfsHash để tương thích với component
        const ipfsHash = response.cid;
        let ipfsUrl = `ipfs://${ipfsHash}`;

        // Thêm extension cho model 3D nếu cần
        if (fileType === '3d-model') {
          const fileExtension = file.name.match(/\.(glb|gltf)$/i)?.[0] || '.glb';
          if (!ipfsHash.toLowerCase().endsWith(fileExtension)) {
            ipfsUrl = `ipfs://${ipfsHash}${fileExtension}`;
          }
        }

        return {
          success: true,
          message: response.message || 'Upload successful',
          ipfsHash: ipfsHash, // Ánh xạ cid sang ipfsHash
          imageUrl: ipfsUrl,
          fileInfo: {
            noiDungType: fileType === '3d-model' ? 'model/gltf-binary' : 'image',
            tenFile: file.name,
          },
        };
      }

      // Xử lý lỗi nếu không thành công
      throw new Error(response?.message || 'Upload failed with unknown error');
    } catch (error: any) {
      console.error('Error in uploadToIPFS thunk:', error);
      return rejectWithValue(error.message || 'Lỗi khi upload file');
    }
  },
);

// Thunk để xác thực URL từ IPFS hoặc URL bên ngoài
export const validateImageUrl = createAsyncThunk(
  'uploadFile/validateImageUrl',
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

        return {
          success: true,
          message: is3DModel ? 'URL mô hình 3D IPFS hợp lệ' : 'IPFS URL hình ảnh hợp lệ',
          imageUrl: url,
          ipfsHash: url.replace('ipfs://', ''),
          fileInfo: {
            noiDungType: is3DModel ? 'model/gltf-binary' : 'image',
            tenFile: is3DModel ? 'model.glb' : 'image.jpg',
          },
        };
      }

      // Kiểm tra URL bên ngoài cho model 3D
      if (url.endsWith('.glb') || url.endsWith('.gltf')) {
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
        return rejectWithValue('URL không hợp lệ');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'URL không hợp lệ');
    }
  },
);

const uploadFileBallotSlice = createSlice({
  name: 'uploadFileBallot',
  initialState,
  reducers: {
    setProgress: (state, action) => {
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
