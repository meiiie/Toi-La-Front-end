import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  uploadImageCuocBauCu,
  getImageUrlCuocBauCu,
  getMultipleImagesUrlCuocBauCu,
  deleteImageCuocBauCu,
} from '../../api/cuocBauCuImageApi';

// Định nghĩa kiểu thông tin file
export interface FileInfo {
  id: number;
  tenFile: string;
  kichThuoc: string;
  ngayUpload: string;
  noiDungType?: string;
}

// Định nghĩa kiểu trạng thái cho slice
interface CuocBauCuImageState {
  dangTai: boolean;
  uploadSuccess: boolean | null;
  uploadError: string | null;
  imageUrl: string | null;
  fileName: string | null;
  fileInfo: FileInfo | null;
  cuocBauCuId: number | null;
  imagesMap: Record<number, string>; // Map từ cuocBauCuId -> imageUrl
  fileInfoMap: Record<number, FileInfo>; // Map từ cuocBauCuId -> FileInfo
  loadingImages: boolean;
}

// Trạng thái ban đầu
const initialState: CuocBauCuImageState = {
  dangTai: false,
  uploadSuccess: null,
  uploadError: null,
  imageUrl: null,
  fileName: null,
  fileInfo: null,
  cuocBauCuId: null,
  imagesMap: {},
  fileInfoMap: {},
  loadingImages: false,
};

// Thunk để tải ảnh lên
export const uploadImage = createAsyncThunk(
  'cuocBauCuImage/uploadImage',
  async ({ id, imageFile }: { id: number; imageFile: File }) => {
    const response = await uploadImageCuocBauCu(id, imageFile);
    return { id, response };
  },
);

// Thunk để lấy URL ảnh hiện tại
export const fetchImageUrl = createAsyncThunk(
  'cuocBauCuImage/fetchImageUrl',
  async (id: number) => {
    const response = await getImageUrlCuocBauCu(id);
    return { id, response };
  },
);

// Thunk để lấy nhiều ảnh cùng lúc
export const fetchMultipleImages = createAsyncThunk(
  'cuocBauCuImage/fetchMultipleImages',
  async (ids: number[]) => {
    const response = await getMultipleImagesUrlCuocBauCu(ids);
    return response;
  },
);

// Thunk để xóa ảnh
export const deleteImage = createAsyncThunk(
  'cuocBauCuImage/deleteImage',
  async ({ id, fileName }: { id: number; fileName: string }) => {
    const response = await deleteImageCuocBauCu(id, fileName);
    return { id, response };
  },
);

// Tạo slice
const cuocBauCuImageSlice = createSlice({
  name: 'cuocBauCuImage',
  initialState,
  reducers: {
    // Reset trạng thái upload
    resetImageState: (state) => {
      state.dangTai = false;
      state.uploadSuccess = null;
      state.uploadError = null;
    },
    // Thiết lập cuộc bầu cử hiện tại
    setCurrentCuocBauCu: (state, action: PayloadAction<number>) => {
      state.cuocBauCuId = action.payload;
    },
    // Xóa dữ liệu ảnh hiện tại
    clearImageData: (state) => {
      state.imageUrl = null;
      state.fileName = null;
      state.fileInfo = null;
      state.cuocBauCuId = null;
    },
    // Xóa tất cả dữ liệu ảnh
    clearAllImageData: (state) => {
      state.imageUrl = null;
      state.fileName = null;
      state.fileInfo = null;
      state.cuocBauCuId = null;
      state.imagesMap = {};
      state.fileInfoMap = {};
    },
    // Thêm action reset hoàn chỉnh toàn bộ state
    resetCuocBauCuImageState: (state) => {
      // Reset state về trạng thái ban đầu
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý uploadImage
      .addCase(uploadImage.pending, (state) => {
        state.dangTai = true;
        state.uploadSuccess = null;
        state.uploadError = null;
      })
      .addCase(uploadImage.fulfilled, (state, action) => {
        state.dangTai = false;
        const { id, response } = action.payload;

        if (response.success) {
          state.uploadSuccess = true;
          state.imageUrl = response.imageUrl;
          state.fileName = response.fileName;
          state.fileInfo = response.fileInfo || null;
          state.cuocBauCuId = id;

          // Cập nhật imagesMap và fileInfoMap
          state.imagesMap[id] = response.imageUrl;
          if (response.fileInfo) {
            state.fileInfoMap[id] = response.fileInfo;
          }
        } else {
          state.uploadSuccess = false;
          state.uploadError = response.message;
        }
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.dangTai = false;
        state.uploadSuccess = false;
        state.uploadError = action.error.message || 'Có lỗi xảy ra khi tải lên ảnh';
      })

      // Xử lý fetchImageUrl
      .addCase(fetchImageUrl.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchImageUrl.fulfilled, (state, action) => {
        state.dangTai = false;
        const { id, response } = action.payload;

        if (response && response.success) {
          state.imageUrl = response.imageUrl;
          state.fileName = response.fileName;
          state.fileInfo = response.fileInfo || null;
          state.cuocBauCuId = id;

          // Cập nhật imagesMap và fileInfoMap
          state.imagesMap[id] = response.imageUrl;
          if (response.fileInfo) {
            state.fileInfoMap[id] = response.fileInfo;
          }
        }
      })
      .addCase(fetchImageUrl.rejected, (state) => {
        state.dangTai = false;
      })

      // Xử lý fetchMultipleImages
      .addCase(fetchMultipleImages.pending, (state) => {
        state.loadingImages = true;
      })
      .addCase(fetchMultipleImages.fulfilled, (state, action) => {
        state.loadingImages = false;
        const response = action.payload;

        if (response && response.success && response.images.length > 0) {
          // Cập nhật imagesMap và fileInfoMap từ kết quả nhận được
          response.images.forEach((item) => {
            state.imagesMap[item.cuocBauCuId] = item.imageUrl;
            if (item.fileInfo) {
              state.fileInfoMap[item.cuocBauCuId] = item.fileInfo;
            }
          });
        }
      })
      .addCase(fetchMultipleImages.rejected, (state) => {
        state.loadingImages = false;
      })

      // Xử lý deleteImage
      .addCase(deleteImage.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.dangTai = false;
        const { id, response } = action.payload;

        if (response.success) {
          // Xóa ảnh khỏi state
          if (state.cuocBauCuId === id) {
            state.imageUrl = null;
            state.fileName = null;
            state.fileInfo = null;
          }
          // Xóa khỏi maps
          delete state.imagesMap[id];
          delete state.fileInfoMap[id];
        }
      })
      .addCase(deleteImage.rejected, (state) => {
        state.dangTai = false;
      });
  },
});

// Export actions và reducer
export const {
  resetImageState,
  setCurrentCuocBauCu,
  clearImageData,
  clearAllImageData,
  resetCuocBauCuImageState, // Export action mới
} = cuocBauCuImageSlice.actions;
export default cuocBauCuImageSlice.reducer;
