import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  UngCuVien,
  UngCuVienWithImageDTO,
  UploadImageResponse,
  UngCuVienDetailDTO,
  UngVienRegistrationDTO,
  CheckCandidateResponse,
  BlockchainAddressResponse,
} from '../types';
import {
  getCacUngCuVien,
  createUngCuVien,
  getUngCuVienById,
  getUngCuVienDetailById,
  updateUngCuVien,
  deleteUngCuVien,
  getUngCuVienByPhienBauCuId,
  getUngCuVienByCuocBauCuId,
  getUngCuVienByViTriUngCuId,
  createBulkUngCuVien,
  updateBulkUngCuVien,
  deleteUngCuVienByPhienBauCuId,
  deleteUngCuVienByCuocBauCuId,
  deleteMultipleUngCuVien,
  uploadImageForUngCuVien,
  getImageForUngCuVien,
  deleteImageForUngCuVien,
  getImagesForUngCuVien,
  getUngCuVienWithImagesByPhienBauCuId,
  getUngCuVienWithImagesByCuocBauCuId,
  // API mới
  getUngCuVienByCuTriId,
  checkIsCandidate,
  checkAccountIsCandidate,
  getBlockchainAddress,
  registerFromAccount,
  registerWithVoter,
} from '../../api/ungVienApi';

interface TrangThaiUngCuVien {
  cacUngCuVien: UngCuVien[];
  cacUngCuVienCoAnh: UngCuVienWithImageDTO[];
  ungCuVienChiTiet: UngCuVien | null;
  ungCuVienChiTietDTO: UngCuVienDetailDTO | null; // Thêm mới
  anhUngCuVien: UploadImageResponse | null;
  dangTai: boolean;
  dangTaiAnh: boolean;
  loi: string | null;
  imagesMap: Record<number, string>;
  fileInfoMap: Record<number, any>;

  // Thêm trạng thái cho các API mới
  isCandidateStatus: Record<number, boolean>; // Lưu trạng thái ứng viên theo cuTriId
  blockchainAddresses: Record<number, string>; // Lưu địa chỉ blockchain theo ungCuVienId
  dangKyUngVien: {
    dangXuLy: boolean;
    thanhCong: boolean;
    loi: string | null;
  };
}

const trangThaiBanDau: TrangThaiUngCuVien = {
  cacUngCuVien: [],
  cacUngCuVienCoAnh: [],
  ungCuVienChiTiet: null,
  ungCuVienChiTietDTO: null, // Thêm mới
  anhUngCuVien: null,
  dangTai: false,
  dangTaiAnh: false,
  loi: null,
  imagesMap: {},
  fileInfoMap: {},

  // Khởi tạo trạng thái mới
  isCandidateStatus: {},
  blockchainAddresses: {},
  dangKyUngVien: {
    dangXuLy: false,
    thanhCong: false,
    loi: null,
  },
};

// ==================== THUNKS HIỆN CÓ ====================

export const fetchCacUngCuVien = createAsyncThunk('ungCuVien/fetchCacUngCuVien', async () => {
  const response = await getCacUngCuVien();
  return response;
});

export const fetchUngCuVienById = createAsyncThunk(
  'ungCuVien/fetchUngCuVienById',
  async (id: number) => {
    const response = await getUngCuVienById(id);
    return response;
  },
);

// Thêm thunk mới cho lấy chi tiết ứng cử viên
export const fetchUngCuVienDetailById = createAsyncThunk(
  'ungCuVien/fetchUngCuVienDetailById',
  async (id: number) => {
    const response = await getUngCuVienDetailById(id);
    return response;
  },
);

export const fetchUngCuVienByPhienBauCuId = createAsyncThunk(
  'ungCuVien/fetchUngCuVienByPhienBauCuId',
  async (phienBauCuId: number) => {
    const response = await getUngCuVienByPhienBauCuId(phienBauCuId);
    return response;
  },
);

export const fetchUngCuVienByCuocBauCuId = createAsyncThunk(
  'ungCuVien/fetchUngCuVienByCuocBauCuId',
  async (cuocBauCuId: number) => {
    const response = await getUngCuVienByCuocBauCuId(cuocBauCuId);
    return response;
  },
);

export const fetchUngCuVienByViTriUngCuId = createAsyncThunk(
  'ungCuVien/fetchUngCuVienByViTriUngCuId',
  async (viTriUngCuId: number) => {
    const response = await getUngCuVienByViTriUngCuId(viTriUngCuId);
    return response;
  },
);

export const addUngCuVien = createAsyncThunk(
  'ungCuVien/addUngCuVien',
  async (ungCuVien: UngCuVien) => {
    const response = await createUngCuVien(ungCuVien);
    return response;
  },
);

export const addBulkUngCuVien = createAsyncThunk(
  'ungCuVien/addBulkUngCuVien',
  async (ungCuViens: Omit<UngCuVien, 'id'>[]) => {
    const response = await createBulkUngCuVien(ungCuViens);
    return response;
  },
);

export const editUngCuVien = createAsyncThunk(
  'ungCuVien/editUngCuVien',
  async ({ id, ungCuVien }: { id: number; ungCuVien: UngCuVien }) => {
    const response = await updateUngCuVien(id, ungCuVien);
    return response;
  },
);

export const editBulkUngCuVien = createAsyncThunk(
  'ungCuVien/editBulkUngCuVien',
  async (ungCuViens: UngCuVien[]) => {
    const response = await updateBulkUngCuVien(ungCuViens);
    return response;
  },
);

export const removeUngCuVien = createAsyncThunk('ungCuVien/removeUngCuVien', async (id: number) => {
  await deleteUngCuVien(id);
  return id;
});

export const removeUngCuVienByPhienBauCuId = createAsyncThunk(
  'ungCuVien/removeUngCuVienByPhienBauCuId',
  async (phienBauCuId: number) => {
    await deleteUngCuVienByPhienBauCuId(phienBauCuId);
    return phienBauCuId;
  },
);

export const removeUngCuVienByCuocBauCuId = createAsyncThunk(
  'ungCuVien/removeUngCuVienByCuocBauCuId',
  async (cuocBauCuId: number) => {
    await deleteUngCuVienByCuocBauCuId(cuocBauCuId);
    return cuocBauCuId;
  },
);

export const removeMultipleUngCuVien = createAsyncThunk(
  'ungCuVien/removeMultipleUngCuVien',
  async (ids: number[]) => {
    await deleteMultipleUngCuVien(ids);
    return ids;
  },
);

// ========== Các thunk cho xử lý ảnh ==========

export const uploadImageUngCuVien = createAsyncThunk(
  'ungCuVien/uploadImageUngCuVien',
  async ({ id, imageFile }: { id: number; imageFile: File }) => {
    const response = await uploadImageForUngCuVien(id, imageFile);
    return { id, response };
  },
);

export const fetchImageUngCuVien = createAsyncThunk(
  'ungCuVien/fetchImageUngCuVien',
  async (id: number) => {
    const response = await getImageForUngCuVien(id);
    return { id, response };
  },
);

export const removeImageUngCuVien = createAsyncThunk(
  'ungCuVien/removeImageUngCuVien',
  async ({ id, fileName }: { id: number; fileName: string }) => {
    await deleteImageForUngCuVien(id, fileName);
    return { id, fileName };
  },
);

export const fetchMultipleImagesUngCuVien = createAsyncThunk(
  'ungCuVien/fetchMultipleImagesUngCuVien',
  async (ids: number[]) => {
    const response = await getImagesForUngCuVien(ids);
    return response;
  },
);

export const fetchUngCuVienWithImagesByPhienBauCu = createAsyncThunk(
  'ungCuVien/fetchUngCuVienWithImagesByPhienBauCu',
  async (phienBauCuId: number) => {
    const response = await getUngCuVienWithImagesByPhienBauCuId(phienBauCuId);
    return response;
  },
);

export const fetchUngCuVienWithImagesByCuocBauCu = createAsyncThunk(
  'ungCuVien/fetchUngCuVienWithImagesByCuocBauCu',
  async (cuocBauCuId: number) => {
    const response = await getUngCuVienWithImagesByCuocBauCuId(cuocBauCuId);
    return response;
  },
);

// ==================== THUNKS MỚI THÊM ====================

// Thunk để lấy ứng cử viên theo CuTriId
export const fetchUngCuVienByCuTriId = createAsyncThunk(
  'ungCuVien/fetchUngCuVienByCuTriId',
  async (cuTriId: number) => {
    const response = await getUngCuVienByCuTriId(cuTriId);
    return { cuTriId, response };
  },
);

// Thunk để kiểm tra cử tri đã đăng ký làm ứng viên chưa
export const checkIsCandidateStatus = createAsyncThunk(
  'ungCuVien/checkIsCandidateStatus',
  async (cuTriId: number) => {
    const response = await checkIsCandidate(cuTriId);
    return { cuTriId, isCandidate: response.isCandidate };
  },
);

// Thunk để kiểm tra tài khoản đã đăng ký làm ứng viên trong phiên bầu cử chưa
export const checkAccountIsCandidateStatus = createAsyncThunk(
  'ungCuVien/checkAccountIsCandidateStatus',
  async ({ taiKhoanId, phienBauCuId }: { taiKhoanId: number; phienBauCuId: number }) => {
    const response = await checkAccountIsCandidate(taiKhoanId, phienBauCuId);
    return { taiKhoanId, phienBauCuId, isCandidate: response.isCandidate };
  },
);

// Thunk để lấy địa chỉ ví blockchain của ứng viên
export const fetchBlockchainAddress = createAsyncThunk(
  'ungCuVien/fetchBlockchainAddress',
  async (id: number) => {
    const response = await getBlockchainAddress(id);
    return { id, response };
  },
);

// Thunk để đăng ký ứng viên từ tài khoản
export const registerCandidateFromAccount = createAsyncThunk(
  'ungCuVien/registerCandidateFromAccount',
  async (ungCuVienDTO: UngCuVien) => {
    const response = await registerFromAccount(ungCuVienDTO);
    return response;
  },
);

// Thunk để đăng ký ứng viên và tự động tạo cử tri nếu chưa có
export const registerCandidateWithVoter = createAsyncThunk(
  'ungCuVien/registerCandidateWithVoter',
  async (registrationDTO: UngVienRegistrationDTO) => {
    const response = await registerWithVoter(registrationDTO);
    return response;
  },
);

const ungCuVienSlice = createSlice({
  name: 'ungCuVien',
  initialState: trangThaiBanDau,
  reducers: {
    datCacUngCuVien: (state, action: PayloadAction<UngCuVien[]>) => {
      state.cacUngCuVien = action.payload;
    },
    themUngCuVien: (state, action: PayloadAction<UngCuVien>) => {
      state.cacUngCuVien.push(action.payload);
    },
    capNhatUngCuVien: (state, action: PayloadAction<UngCuVien>) => {
      const index = state.cacUngCuVien.findIndex((ungCuVien) => ungCuVien.id === action.payload.id);
      if (index !== -1) {
        state.cacUngCuVien[index] = action.payload;
      }
    },
    xoaUngCuVien: (state, action: PayloadAction<number>) => {
      state.cacUngCuVien = state.cacUngCuVien.filter(
        (ungCuVien) => ungCuVien.id !== action.payload,
      );
    },
    datLaiAnhUngCuVien: (state) => {
      state.anhUngCuVien = null;
    },
    xoaAnhUngCuVienTuMap: (state, action: PayloadAction<number>) => {
      delete state.imagesMap[action.payload];
      delete state.fileInfoMap[action.payload];
    },
    xoaTatCaAnhUngCuVien: (state) => {
      state.imagesMap = {};
      state.fileInfoMap = {};
    },
    // Thêm action để reset trạng thái đăng ký
    resetDangKyUngVien: (state) => {
      state.dangKyUngVien = {
        dangXuLy: false,
        thanhCong: false,
        loi: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== Xử lý các thunk hiện có =====
      .addCase(fetchCacUngCuVien.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien[]>) => {
        state.cacUngCuVien = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacUngCuVien.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(fetchUngCuVienById.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchUngCuVienById.fulfilled, (state, action: PayloadAction<UngCuVien>) => {
        state.ungCuVienChiTiet = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchUngCuVienById.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      // Thêm case xử lý cho chi tiết ứng cử viên
      .addCase(fetchUngCuVienDetailById.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchUngCuVienDetailById.fulfilled,
        (state, action: PayloadAction<UngCuVienDetailDTO>) => {
          state.ungCuVienChiTietDTO = action.payload;
          state.dangTai = false;

          // Cập nhật blockchainAddresses nếu có địa chỉ
          if (action.payload.diaChiVi) {
            state.blockchainAddresses[action.payload.id] = action.payload.diaChiVi;
          }
        },
      )
      .addCase(fetchUngCuVienDetailById.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi khi lấy chi tiết ứng cử viên';
        state.dangTai = false;
      })
      .addCase(
        fetchUngCuVienByPhienBauCuId.fulfilled,
        (state, action: PayloadAction<UngCuVien[]>) => {
          state.cacUngCuVien = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(
        fetchUngCuVienByCuocBauCuId.fulfilled,
        (state, action: PayloadAction<UngCuVien[]>) => {
          state.cacUngCuVien = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchUngCuVienByViTriUngCuId.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchUngCuVienByViTriUngCuId.fulfilled,
        (state, action: PayloadAction<UngCuVien[]>) => {
          state.cacUngCuVien = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchUngCuVienByViTriUngCuId.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi khi lấy ứng viên theo vị trí';
        state.dangTai = false;
      })

      // ===== Thêm xử lý các API mới =====

      // Xử lý fetchUngCuVienByCuTriId
      .addCase(fetchUngCuVienByCuTriId.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchUngCuVienByCuTriId.fulfilled, (state, action) => {
        const { cuTriId, response } = action.payload;
        if (response) {
          // Thêm hoặc cập nhật ứng viên vào danh sách
          const index = state.cacUngCuVien.findIndex((uv) => uv.id === response.id);
          if (index !== -1) {
            state.cacUngCuVien[index] = response;
          } else {
            state.cacUngCuVien.push(response);
          }

          // Cập nhật trạng thái ứng viên
          state.isCandidateStatus[cuTriId] = true;
        } else {
          // Nếu không tìm thấy ứng viên
          state.isCandidateStatus[cuTriId] = false;
        }
        state.dangTai = false;
      })
      .addCase(fetchUngCuVienByCuTriId.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi khi lấy ứng viên theo cử tri';
        state.dangTai = false;
      })

      // Xử lý checkIsCandidateStatus
      .addCase(checkIsCandidateStatus.fulfilled, (state, action) => {
        const { cuTriId, isCandidate } = action.payload;
        state.isCandidateStatus[cuTriId] = isCandidate;
      })

      // Xử lý fetchBlockchainAddress
      .addCase(fetchBlockchainAddress.fulfilled, (state, action) => {
        const { id, response } = action.payload;
        if (response.success && response.blockchainAddress) {
          state.blockchainAddresses[id] = response.blockchainAddress;
        }
      })

      // Xử lý registerCandidateFromAccount
      .addCase(registerCandidateFromAccount.pending, (state) => {
        state.dangKyUngVien.dangXuLy = true;
        state.dangKyUngVien.thanhCong = false;
        state.dangKyUngVien.loi = null;
      })
      .addCase(
        registerCandidateFromAccount.fulfilled,
        (state, action: PayloadAction<UngCuVien>) => {
          state.dangKyUngVien.dangXuLy = false;
          state.dangKyUngVien.thanhCong = true;

          // Thêm ứng viên mới vào danh sách
          state.cacUngCuVien.push(action.payload);

          // Cập nhật trạng thái ứng viên nếu có cuTriId
          if (action.payload.cuTriId) {
            state.isCandidateStatus[action.payload.cuTriId] = true;
          }
        },
      )
      .addCase(registerCandidateFromAccount.rejected, (state, action) => {
        state.dangKyUngVien.dangXuLy = false;
        state.dangKyUngVien.thanhCong = false;
        state.dangKyUngVien.loi = action.error.message || 'Có lỗi khi đăng ký ứng viên';
      })

      // Xử lý registerCandidateWithVoter
      .addCase(registerCandidateWithVoter.pending, (state) => {
        state.dangKyUngVien.dangXuLy = true;
        state.dangKyUngVien.thanhCong = false;
        state.dangKyUngVien.loi = null;
      })
      .addCase(registerCandidateWithVoter.fulfilled, (state, action: PayloadAction<UngCuVien>) => {
        state.dangKyUngVien.dangXuLy = false;
        state.dangKyUngVien.thanhCong = true;

        // Thêm ứng viên mới vào danh sách
        state.cacUngCuVien.push(action.payload);

        // Cập nhật trạng thái ứng viên nếu có cuTriId
        if (action.payload.cuTriId) {
          state.isCandidateStatus[action.payload.cuTriId] = true;
        }
      })
      .addCase(registerCandidateWithVoter.rejected, (state, action) => {
        state.dangKyUngVien.dangXuLy = false;
        state.dangKyUngVien.thanhCong = false;
        state.dangKyUngVien.loi = action.error.message || 'Có lỗi khi đăng ký ứng viên kèm cử tri';
      })

      .addCase(addUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien>) => {
        state.cacUngCuVien.push(action.payload);
        // Cập nhật trạng thái ứng viên nếu có cuTriId
        if (action.payload.cuTriId) {
          state.isCandidateStatus[action.payload.cuTriId] = true;
        }
      })
      .addCase(addBulkUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien[]>) => {
        state.cacUngCuVien = state.cacUngCuVien.concat(action.payload);
        // Cập nhật trạng thái ứng viên cho các ứng viên mới
        action.payload.forEach((ungCuVien) => {
          if (ungCuVien.cuTriId) {
            state.isCandidateStatus[ungCuVien.cuTriId] = true;
          }
        });
      })
      .addCase(editUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien>) => {
        const index = state.cacUngCuVien.findIndex(
          (ungCuVien) => ungCuVien.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacUngCuVien[index] = action.payload;
        }
      })
      .addCase(editBulkUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien[]>) => {
        action.payload.forEach((updatedUngCuVien) => {
          const index = state.cacUngCuVien.findIndex(
            (ungCuVien) => ungCuVien.id === updatedUngCuVien.id,
          );
          if (index !== -1) {
            state.cacUngCuVien[index] = updatedUngCuVien;
          }
        });
      })
      .addCase(removeUngCuVien.fulfilled, (state, action: PayloadAction<number>) => {
        // Tìm ứng viên trước khi xóa để lấy cuTriId
        const ungCuVien = state.cacUngCuVien.find((u) => u.id === action.payload);

        // Xóa ứng viên khỏi danh sách
        state.cacUngCuVien = state.cacUngCuVien.filter(
          (ungCuVien) => ungCuVien.id !== action.payload,
        );

        // Xóa ảnh khỏi map
        delete state.imagesMap[action.payload];
        delete state.fileInfoMap[action.payload];

        // Xóa địa chỉ blockchain
        delete state.blockchainAddresses[action.payload];

        // Cập nhật trạng thái ứng viên nếu có cuTriId
        if (ungCuVien && ungCuVien.cuTriId) {
          state.isCandidateStatus[ungCuVien.cuTriId] = false;
        }
      })
      .addCase(removeUngCuVienByPhienBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        // Lưu lại các ID ứng cử viên và cuTriId sẽ bị xóa
        const toBeDeletedItems = state.cacUngCuVien
          .filter((ungCuVien) => ungCuVien.phienBauCuId === action.payload)
          .map((ungCuVien) => ({
            id: ungCuVien.id,
            cuTriId: ungCuVien.cuTriId,
          }));

        // Xóa ứng viên khỏi danh sách
        state.cacUngCuVien = state.cacUngCuVien.filter(
          (ungCuVien) => ungCuVien.phienBauCuId !== action.payload,
        );

        // Xóa ảnh và địa chỉ blockchain khỏi map
        toBeDeletedItems.forEach((item) => {
          delete state.imagesMap[item.id];
          delete state.fileInfoMap[item.id];
          delete state.blockchainAddresses[item.id];

          // Cập nhật trạng thái ứng viên
          if (item.cuTriId) {
            state.isCandidateStatus[item.cuTriId] = false;
          }
        });
      })
      .addCase(removeUngCuVienByCuocBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        // Lưu lại các ID ứng cử viên và cuTriId sẽ bị xóa
        const toBeDeletedItems = state.cacUngCuVien
          .filter((ungCuVien) => ungCuVien.cuocBauCuId === action.payload)
          .map((ungCuVien) => ({
            id: ungCuVien.id,
            cuTriId: ungCuVien.cuTriId,
          }));

        // Xóa ứng viên khỏi danh sách
        state.cacUngCuVien = state.cacUngCuVien.filter(
          (ungCuVien) => ungCuVien.cuocBauCuId !== action.payload,
        );

        // Xóa ảnh và địa chỉ blockchain khỏi map
        toBeDeletedItems.forEach((item) => {
          delete state.imagesMap[item.id];
          delete state.fileInfoMap[item.id];
          delete state.blockchainAddresses[item.id];

          // Cập nhật trạng thái ứng viên
          if (item.cuTriId) {
            state.isCandidateStatus[item.cuTriId] = false;
          }
        });
      })
      .addCase(removeMultipleUngCuVien.fulfilled, (state, action: PayloadAction<number[]>) => {
        // Lưu lại các cuTriId của ứng viên sẽ bị xóa
        const cuTriIds = state.cacUngCuVien
          .filter((ungCuVien) => action.payload.includes(ungCuVien.id))
          .map((ungCuVien) => ungCuVien.cuTriId)
          .filter((id): id is number => id !== undefined);

        // Xóa ứng viên khỏi danh sách
        state.cacUngCuVien = state.cacUngCuVien.filter(
          (ungCuVien) => !action.payload.includes(ungCuVien.id),
        );

        // Xóa ảnh và địa chỉ blockchain khỏi map
        action.payload.forEach((id) => {
          delete state.imagesMap[id];
          delete state.fileInfoMap[id];
          delete state.blockchainAddresses[id];
        });

        // Cập nhật trạng thái ứng viên
        cuTriIds.forEach((cuTriId) => {
          state.isCandidateStatus[cuTriId] = false;
        });
      })
      // Xử lý các action upload ảnh
      .addCase(uploadImageUngCuVien.pending, (state) => {
        state.dangTaiAnh = true;
      })
      .addCase(uploadImageUngCuVien.fulfilled, (state, action) => {
        const { id, response } = action.payload;
        state.anhUngCuVien = response;
        state.dangTaiAnh = false;

        // Cập nhật ảnh trong imagesMap
        if (response.success) {
          state.imagesMap[id] = response.imageUrl;
          if (response.fileInfo) {
            state.fileInfoMap[id] = response.fileInfo;
          }
        }

        // Cập nhật thông tin ảnh trong ứng cử viên
        const index = state.cacUngCuVien.findIndex((u) => u.id === id);
        if (index !== -1) {
          state.cacUngCuVien[index].anh = response.fileName;
        }

        // Cập nhật chi tiết nếu đang xem chi tiết
        if (state.ungCuVienChiTiet && state.ungCuVienChiTiet.id === id) {
          state.ungCuVienChiTiet.anh = response.fileName;
        }

        // Cập nhật chi tiết DTO nếu đang xem chi tiết
        if (state.ungCuVienChiTietDTO && state.ungCuVienChiTietDTO.id === id) {
          state.ungCuVienChiTietDTO.anh = response.fileName;
          state.ungCuVienChiTietDTO.anhUrl = response.imageUrl;
        }
      })
      .addCase(uploadImageUngCuVien.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi khi tải lên ảnh';
        state.dangTaiAnh = false;
      })
      .addCase(fetchImageUngCuVien.pending, (state) => {
        state.dangTaiAnh = true;
      })
      .addCase(fetchImageUngCuVien.fulfilled, (state, action) => {
        const { id, response } = action.payload;

        // Lưu thông tin ảnh mới nhất
        state.anhUngCuVien = response;
        state.dangTaiAnh = false;

        // Cập nhật imagesMap nếu có ảnh
        if (response && response.success) {
          state.imagesMap[id] = response.imageUrl;
          if (response.fileInfo) {
            state.fileInfoMap[id] = response.fileInfo;
          }

          // Cập nhật chi tiết DTO nếu đang xem chi tiết
          if (state.ungCuVienChiTietDTO && state.ungCuVienChiTietDTO.id === id) {
            state.ungCuVienChiTietDTO.anhUrl = response.imageUrl;
          }
        }
      })
      .addCase(fetchImageUngCuVien.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi khi lấy ảnh';
        state.dangTaiAnh = false;
      })
      .addCase(removeImageUngCuVien.fulfilled, (state, action) => {
        const { id, fileName } = action.payload;

        // Xóa ảnh khỏi imagesMap
        delete state.imagesMap[id];
        delete state.fileInfoMap[id];

        // Xóa thông tin ảnh trong ứng cử viên
        const index = state.cacUngCuVien.findIndex((u) => u.id === id);
        if (index !== -1) {
          state.cacUngCuVien[index].anh = '';
        }

        // Cập nhật chi tiết nếu đang xem chi tiết
        if (state.ungCuVienChiTiet && state.ungCuVienChiTiet.id === id) {
          state.ungCuVienChiTiet.anh = '';
        }

        // Cập nhật chi tiết DTO nếu đang xem chi tiết
        if (state.ungCuVienChiTietDTO && state.ungCuVienChiTietDTO.id === id) {
          state.ungCuVienChiTietDTO.anh = '';
          state.ungCuVienChiTietDTO.anhUrl = '';
        }

        // Xóa ảnh hiện tại nếu đang xem
        if (state.anhUngCuVien && state.anhUngCuVien.fileName === fileName) {
          state.anhUngCuVien = null;
        }
      })
      .addCase(fetchMultipleImagesUngCuVien.fulfilled, (state, action) => {
        if (action.payload && action.payload.success && action.payload.images) {
          // Cập nhật imagesMap từ nhiều ảnh
          action.payload.images.forEach((image) => {
            if (image.fileInfo?.id) {
              state.imagesMap[image.fileInfo.id] = image.imageUrl;
              state.fileInfoMap[image.fileInfo.id] = image.fileInfo;
            }
          });
        }
      })
      .addCase(fetchUngCuVienWithImagesByPhienBauCu.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.candidates) {
          state.cacUngCuVienCoAnh = action.payload.candidates as UngCuVienWithImageDTO[];

          // Cập nhật imagesMap từ danh sách ứng cử viên có ảnh
          action.payload.candidates.forEach((candidate: any) => {
            if (candidate.anhUrl) {
              state.imagesMap[candidate.id] = candidate.anhUrl;
              if (candidate.fileInfo) {
                state.fileInfoMap[candidate.id] = candidate.fileInfo;
              }
            }
          });
        }
      })
      .addCase(fetchUngCuVienWithImagesByCuocBauCu.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.candidates) {
          state.cacUngCuVienCoAnh = action.payload.candidates as UngCuVienWithImageDTO[];

          // Cập nhật imagesMap từ danh sách ứng cử viên có ảnh
          action.payload.candidates.forEach((candidate: any) => {
            if (candidate.anhUrl) {
              state.imagesMap[candidate.id] = candidate.anhUrl;
              if (candidate.fileInfo) {
                state.fileInfoMap[candidate.id] = candidate.fileInfo;
              }
            }
          });
        }
      });
  },
});

export const {
  datCacUngCuVien,
  themUngCuVien,
  capNhatUngCuVien,
  xoaUngCuVien,
  datLaiAnhUngCuVien,
  xoaAnhUngCuVienTuMap,
  xoaTatCaAnhUngCuVien,
  resetDangKyUngVien,
} = ungCuVienSlice.actions;
export default ungCuVienSlice.reducer;
