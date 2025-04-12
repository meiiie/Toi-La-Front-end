import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CuTri } from '../types';
import {
  getCacCuTri,
  getCuTriById,
  getCuTriByPhienBauCuId,
  getCuTriByCuocBauCuId,
  createCuTri,
  createBulkCuTri,
  updateCuTri,
  updateBulkCuTri,
  deleteCuTri,
  deleteCuTriByPhienBauCuId,
  deleteCuTriByCuocBauCuId,
  deleteMultipleCuTri,
  verifyVoter,
  verifyMultipleVoters,
  checkVoterVerificationStatus,
} from '../../api/cuTriApi';

interface TrangThaiCuTri {
  cacCuTri: CuTri[];
  dangTai: boolean;
  loi: string | null;
  tongSo: number;
  daXacThuc: number;
  chuaXacThuc: number;
  daBoPhieu: number;
  ketQuaThemMoi: {
    tongSo: number;
    daLuu: number;
    daXacThuc: number;
    daGuiEmail: number;
    trungLap: number;
    chiTiet: any[];
  } | null;
}

const trangThaiBanDau: TrangThaiCuTri = {
  cacCuTri: [],
  dangTai: false,
  loi: null,
  tongSo: 0,
  daXacThuc: 0,
  chuaXacThuc: 0,
  daBoPhieu: 0,
  ketQuaThemMoi: null,
};

export const fetchCacCuTri = createAsyncThunk('cacCuTri/fetchCacCuTri', async () => {
  const response = await getCacCuTri();
  return response;
});

export const fetchCuTriById = createAsyncThunk('cacCuTri/fetchCuTriById', async (id: number) => {
  const response = await getCuTriById(id);
  return response;
});

export const fetchCuTriByPhienBauCuId = createAsyncThunk(
  'cacCuTri/fetchCuTriByPhienBauCuId',
  async (phienBauCuId: number) => {
    const response = await getCuTriByPhienBauCuId(phienBauCuId);
    return response;
  },
);

export const fetchCuTriByCuocBauCuId = createAsyncThunk(
  'cacCuTri/fetchCuTriByCuocBauCuId',
  async (cuocBauCuId: number) => {
    const response = await getCuTriByCuocBauCuId(cuocBauCuId);
    return response;
  },
);

export const addCuTri = createAsyncThunk('cacCuTri/addCuTri', async (cuTri: CuTri) => {
  const sanitizedCuTri = {
    ...cuTri,
    taiKhoanId: cuTri.taiKhoanId || 0, // Đảm bảo taiKhoanId không phải null
  };
  const response = await createCuTri(sanitizedCuTri);
  return response;
});

export const addBulkCuTri = createAsyncThunk(
  'cacCuTri/addBulkCuTri',
  async (cuTris: Omit<CuTri, 'id'>[], { rejectWithValue }) => {
    try {
      // Đảm bảo không có cử tri nào có taiKhoanId là null
      const sanitizedCuTris = cuTris.map((cuTri) => ({
        ...cuTri,
        taiKhoanId: cuTri.taiKhoanId || 0, // Chuyển null thành 0
      }));

      const response = await createBulkCuTri(sanitizedCuTris);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const editCuTri = createAsyncThunk(
  'cacCuTri/editCuTri',
  async ({ id, cuTri }: { id: number; cuTri: CuTri }) => {
    const sanitizedCuTri = {
      ...cuTri,
      taiKhoanId: cuTri.taiKhoanId || 0, // Đảm bảo taiKhoanId không phải null
    };
    const response = await updateCuTri(id, sanitizedCuTri);
    return response;
  },
);

export const editBulkCuTri = createAsyncThunk('cacCuTri/editBulkCuTri', async (cuTris: CuTri[]) => {
  // Đảm bảo không có cử tri nào có taiKhoanId là null
  const sanitizedCuTris = cuTris.map((cuTri) => ({
    ...cuTri,
    taiKhoanId: cuTri.taiKhoanId || 0, // Chuyển null thành 0
  }));
  const response = await updateBulkCuTri(sanitizedCuTris);
  return response;
});

export const removeCuTri = createAsyncThunk('cacCuTri/removeCuTri', async (id: number) => {
  await deleteCuTri(id);
  return id;
});

export const removeCuTriByPhienBauCuId = createAsyncThunk(
  'cacCuTri/removeCuTriByPhienBauCuId',
  async (phienBauCuId: number) => {
    await deleteCuTriByPhienBauCuId(phienBauCuId);
    return phienBauCuId;
  },
);

export const removeCuTriByCuocBauCuId = createAsyncThunk(
  'cacCuTri/removeCuTriByCuocBauCuId',
  async (cuocBauCuId: number) => {
    await deleteCuTriByCuocBauCuId(cuocBauCuId);
    return cuocBauCuId;
  },
);

export const removeMultipleCuTri = createAsyncThunk(
  'cacCuTri/removeMultipleCuTri',
  async (ids: number[]) => {
    await deleteMultipleCuTri(ids);
    return ids;
  },
);

// Thunk xác thực cử tri
export const verifyCuTri = createAsyncThunk(
  'cacCuTri/verifyCuTri',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await verifyVoter(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Thunk xác thực hàng loạt cử tri
export const verifyMultipleCuTri = createAsyncThunk(
  'cacCuTri/verifyMultipleCuTri',
  async (ids: number[], { rejectWithValue }) => {
    try {
      const response = await verifyMultipleVoters(ids);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Thunk kiểm tra trạng thái xác thực cử tri
export const checkCuTriVerificationStatus = createAsyncThunk(
  'cacCuTri/checkCuTriVerificationStatus',
  async ({ email, phienBauCuId }: { email: string; phienBauCuId: number }, { rejectWithValue }) => {
    try {
      const response = await checkVoterVerificationStatus(email, phienBauCuId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Hàm helper cập nhật các số liệu thống kê
const updateStats = (state: TrangThaiCuTri) => {
  state.tongSo = state.cacCuTri.length;
  state.daXacThuc = state.cacCuTri.filter((ct) => ct.xacMinh).length;
  state.chuaXacThuc = state.cacCuTri.filter((ct) => !ct.xacMinh).length;
  state.daBoPhieu = state.cacCuTri.filter((ct) => ct.boPhieu).length;
};

const cuTriSlice = createSlice({
  name: 'cacCuTri',
  initialState: trangThaiBanDau,
  reducers: {
    clearCuTriState: (state) => {
      state.cacCuTri = [];
      state.ketQuaThemMoi = null;
      updateStats(state);
    },
    resetKetQuaThemMoi: (state) => {
      state.ketQuaThemMoi = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacCuTri.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacCuTri.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        state.cacCuTri = action.payload;
        state.dangTai = false;
        updateStats(state);
      })
      .addCase(fetchCacCuTri.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(fetchCuTriById.fulfilled, (state, action: PayloadAction<CuTri>) => {
        const index = state.cacCuTri.findIndex((cuTri) => cuTri.id === action.payload.id);
        if (index !== -1) {
          state.cacCuTri[index] = action.payload;
        } else {
          state.cacCuTri.push(action.payload);
        }
        updateStats(state);
      })
      .addCase(fetchCuTriByPhienBauCuId.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        state.cacCuTri = action.payload;
        updateStats(state);
      })
      .addCase(fetchCuTriByCuocBauCuId.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        state.cacCuTri = action.payload;
        updateStats(state);
      })
      .addCase(addCuTri.fulfilled, (state, action: PayloadAction<CuTri>) => {
        state.cacCuTri.push(action.payload);
        updateStats(state);
      })
      .addCase(addBulkCuTri.pending, (state) => {
        state.dangTai = true;
        state.ketQuaThemMoi = null;
      })
      .addCase(addBulkCuTri.fulfilled, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        // Lưu kết quả chi tiết
        state.ketQuaThemMoi = action.payload;

        // Cập nhật danh sách nếu có chi tiết
        if (action.payload?.chiTiet) {
          const newVoters = action.payload.chiTiet
            .filter((item: any) => item.trangThai !== 'trung_lap' && item.id)
            .map((item: any) => ({
              id: item.id,
              email: item.email,
              sdt: item.sdt,
              xacMinh: item.xacThuc || false,
              boPhieu: false,
              soLanGuiOtp: item.trangThai === 'pending' ? 1 : 0,
              phienBauCuId: item.phienBauCuId,
              cuocBauCuId:
                state.cacCuTri.find((ct) => ct.phienBauCuId === item.phienBauCuId)?.cuocBauCuId ||
                0,
              taiKhoanId: item.taiKhoanId || 0,
              trangThai: item.trangThai,
              tenVaiTro: item.tenVaiTro,
              hasBlockchainWallet: item.hasBlockchainWallet || false,
              vaiTroId: item.vaiTroId || 0,
            }));

          state.cacCuTri = [...state.cacCuTri, ...newVoters];
        }

        updateStats(state);
      })
      .addCase(addBulkCuTri.rejected, (state, action) => {
        state.dangTai = false;
        state.loi = action.error.message || 'Có lỗi xảy ra khi thêm cử tri hàng loạt';
      })
      .addCase(editCuTri.fulfilled, (state, action: PayloadAction<CuTri>) => {
        const index = state.cacCuTri.findIndex((cuTri) => cuTri.id === action.payload.id);
        if (index !== -1) {
          state.cacCuTri[index] = action.payload;
        }
        updateStats(state);
      })
      .addCase(editBulkCuTri.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        action.payload.forEach((updatedCuTri) => {
          const index = state.cacCuTri.findIndex((cuTri) => cuTri.id === updatedCuTri.id);
          if (index !== -1) {
            state.cacCuTri[index] = updatedCuTri;
          }
        });
        updateStats(state);
      })
      .addCase(removeCuTri.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacCuTri = state.cacCuTri.filter((cuTri) => cuTri.id !== action.payload);
        updateStats(state);
      })
      .addCase(removeCuTriByPhienBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacCuTri = state.cacCuTri.filter((cuTri) => cuTri.phienBauCuId !== action.payload);
        updateStats(state);
      })
      .addCase(removeCuTriByCuocBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacCuTri = state.cacCuTri.filter((cuTri) => cuTri.cuocBauCuId !== action.payload);
        updateStats(state);
      })
      .addCase(removeMultipleCuTri.fulfilled, (state, action: PayloadAction<number[]>) => {
        state.cacCuTri = state.cacCuTri.filter((cuTri) => !action.payload.includes(cuTri.id));
        updateStats(state);
      })
      .addCase(verifyCuTri.fulfilled, (state, action: PayloadAction<any>) => {
        // Cập nhật thông tin cử tri sau khi xác thực
        if (action.payload && action.payload.cuTriId) {
          const index = state.cacCuTri.findIndex((cuTri) => cuTri.id === action.payload.cuTriId);
          if (index !== -1) {
            state.cacCuTri[index] = {
              ...state.cacCuTri[index],
              xacMinh: true,
              soLanGuiOTP: action.payload.soLanGuiOtp || state.cacCuTri[index].soLanGuiOTP,
              trangThai: 'verified',
            };
          }
        }
        updateStats(state);
      })
      .addCase(verifyMultipleCuTri.fulfilled, (state, action: PayloadAction<any[]>) => {
        // Cập nhật thông tin nhiều cử tri sau khi xác thực hàng loạt
        action.payload.forEach((result) => {
          if (result.cuTriId && result.thanhCong) {
            const index = state.cacCuTri.findIndex((cuTri) => cuTri.id === result.cuTriId);
            if (index !== -1) {
              state.cacCuTri[index] = {
                ...state.cacCuTri[index],
                xacMinh: true,
                soLanGuiOTP: result.soLanGuiOtp || state.cacCuTri[index].soLanGuiOTP,
                trangThai: 'verified',
              };
            }
          }
        });
        updateStats(state);
      })
      .addCase(checkCuTriVerificationStatus.fulfilled, (state, action: PayloadAction<any>) => {
        // API trả về cấu trúc khác với cuTri
        if (action.payload && action.payload.success) {
          const cuTriData = {
            id: action.payload.id,
            email: action.payload.email,
            sdt: action.payload.sdt,
            xacMinh: action.payload.xacMinh,
            boPhieu: action.payload.boPhieu,
            soLanGuiOTP: action.payload.soLanGuiOtp,
            phienBauCuId: action.payload.phienBauCuId,
            taiKhoanId: action.payload.taiKhoanId,
            hasBlockchainWallet: action.payload.hasBlockchainWallet,
            blockchainAddress: action.payload.blockchainAddress, // Thêm trường này
            trangThai: action.payload.status,
          };

          const index = state.cacCuTri.findIndex((ct) => ct.id === cuTriData.id);
          if (index !== -1) {
            state.cacCuTri[index] = {
              ...state.cacCuTri[index],
              ...cuTriData,
            };
          } else {
            state.cacCuTri.push(cuTriData);
          }
          updateStats(state);
        }
      });
  },
});

export default cuTriSlice.reducer;
export const { clearCuTriState, resetKetQuaThemMoi } = cuTriSlice.actions;
