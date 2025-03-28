import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UploadFileResponse } from '../types';
import { uploadFile, getFiles, deleteFile } from '../../api/uploadFileApi';

interface TrangThaiUploadFile {
  cacFile: UploadFileResponse[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiUploadFile = {
  cacFile: [],
  dangTai: false,
  loi: null,
};

export const fetchFiles = createAsyncThunk(
  'uploadFile/fetchFiles',
  async ({
    taiKhoanId,
    cuocBauCuId,
    phienBauCuId,
  }: {
    taiKhoanId: number;
    cuocBauCuId?: number;
    phienBauCuId?: number;
  }) => {
    const response = await getFiles(taiKhoanId, cuocBauCuId, phienBauCuId);
    return response;
  },
);

export const uploadFileAction = createAsyncThunk(
  'uploadFile/uploadFile',
  async ({
    file,
    taiKhoanUploadId,
    phienBauCuUploadId,
    cuocBauCuUploadId,
  }: {
    file: File;
    taiKhoanUploadId: number;
    phienBauCuUploadId: number;
    cuocBauCuUploadId: number;
  }) => {
    const response = await uploadFile(
      file,
      taiKhoanUploadId,
      phienBauCuUploadId,
      cuocBauCuUploadId,
    );
    return response;
  },
);

export const deleteFileAction = createAsyncThunk(
  'uploadFile/deleteFile',
  async (fileName: string) => {
    await deleteFile(fileName);
    return fileName;
  },
);

const uploadFileSlice = createSlice({
  name: 'uploadFile',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchFiles.fulfilled, (state, action: PayloadAction<UploadFileResponse[]>) => {
        state.cacFile = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(uploadFileAction.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(uploadFileAction.fulfilled, (state, action: PayloadAction<UploadFileResponse[]>) => {
        if (Array.isArray(action.payload)) {
          state.cacFile.push(...action.payload);
        } else {
          state.cacFile.push(action.payload);
        }
        state.dangTai = false;
      })
      .addCase(uploadFileAction.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(deleteFileAction.fulfilled, (state, action: PayloadAction<string>) => {
        state.cacFile = state.cacFile.filter((file) => file.tenFileDuocTao !== action.payload);
      });
  },
});

export default uploadFileSlice.reducer;
