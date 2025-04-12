import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { checkElectionAccess, checkSessionAccess } from '../../api/cuocBauCuAccessApi';
import { RootState } from '../store';

// Định nghĩa interface cho state của slice
interface CuocBauCuAccessState {
  isChecking: boolean;
  accessResults: Record<string, boolean>; // Lưu trữ kết quả theo khóa "electionId" hoặc "electionId-sessionId"
  error: string | null;
  lastChecked: Record<string, number>; // Lưu trữ thời gian kiểm tra cuối cùng (timestamp)
}

// Trạng thái ban đầu
const initialState: CuocBauCuAccessState = {
  isChecking: false,
  accessResults: {},
  error: null,
  lastChecked: {},
};

// Thời gian cache hợp lệ (5 phút = 300000ms)
const CACHE_VALIDITY_TIME = 300000;

// Tạo key để lưu trong accessResults
const createKey = (electionId: number, sessionId?: number): string => {
  return sessionId ? `${electionId}-${sessionId}` : `${electionId}`;
};

// Thunk để kiểm tra quyền truy cập cuộc bầu cử
export const checkElectionAccessThunk = createAsyncThunk(
  'cuocBauCuAccess/checkElectionAccess',
  async (electionId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const key = `${electionId}`;

      // Kiểm tra cache
      const lastCheckedTime = state.cuocBauCuAccess.lastChecked[key] || 0;
      const currentTime = Date.now();

      if (
        lastCheckedTime &&
        currentTime - lastCheckedTime < CACHE_VALIDITY_TIME &&
        key in state.cuocBauCuAccess.accessResults
      ) {
        // Nếu có cache và còn hiệu lực, sử dụng kết quả từ cache
        console.log(`[Cache hit] Using cached result for election ${electionId}`);
        return {
          electionId,
          hasAccess: state.cuocBauCuAccess.accessResults[key],
          fromCache: true,
        };
      }

      // Nếu không có cache hoặc cache hết hạn, gọi API
      console.log(`[API call] Checking access for election ${electionId}`);
      const result = await checkElectionAccess(electionId);

      return {
        electionId,
        hasAccess: result.hasAccess,
        fromCache: false,
      };
    } catch (error) {
      console.error('Lỗi khi kiểm tra quyền truy cập cuộc bầu cử:', error);
      return rejectWithValue('Không thể kiểm tra quyền truy cập. Vui lòng thử lại sau.');
    }
  },
);

// Thunk để kiểm tra quyền truy cập phiên bầu cử
export const checkSessionAccessThunk = createAsyncThunk(
  'cuocBauCuAccess/checkSessionAccess',
  async (
    { electionId, sessionId }: { electionId: number; sessionId: number },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as RootState;
      const key = `${electionId}-${sessionId}`;

      // Kiểm tra cache
      const lastCheckedTime = state.cuocBauCuAccess.lastChecked[key] || 0;
      const currentTime = Date.now();

      if (
        lastCheckedTime &&
        currentTime - lastCheckedTime < CACHE_VALIDITY_TIME &&
        key in state.cuocBauCuAccess.accessResults
      ) {
        // Nếu có cache và còn hiệu lực, sử dụng kết quả từ cache
        console.log(
          `[Cache hit] Using cached result for session ${sessionId} of election ${electionId}`,
        );
        return {
          electionId,
          sessionId,
          hasAccess: state.cuocBauCuAccess.accessResults[key],
          fromCache: true,
        };
      }

      // Nếu không có cache hoặc cache hết hạn, gọi API
      console.log(`[API call] Checking access for session ${sessionId} of election ${electionId}`);
      const result = await checkSessionAccess(electionId, sessionId);

      return {
        electionId,
        sessionId,
        hasAccess: result.hasAccess,
        fromCache: false,
      };
    } catch (error) {
      console.error('Lỗi khi kiểm tra quyền truy cập phiên bầu cử:', error);
      return rejectWithValue('Không thể kiểm tra quyền truy cập. Vui lòng thử lại sau.');
    }
  },
);

// Tạo slice
const cuocBauCuAccessSlice = createSlice({
  name: 'cuocBauCuAccess',
  initialState,
  reducers: {
    // Reset trạng thái của slice
    resetAccessState: () => initialState,

    // Clear cache cho một cuộc bầu cử hoặc phiên bầu cử cụ thể
    clearAccessCache: (
      state,
      action: PayloadAction<{ electionId: number; sessionId?: number }>,
    ) => {
      const { electionId, sessionId } = action.payload;
      const key = createKey(electionId, sessionId);
      delete state.accessResults[key];
      delete state.lastChecked[key];
    },

    // Clear toàn bộ cache
    clearAllAccessCache: (state) => {
      state.accessResults = {};
      state.lastChecked = {};
    },

    // Thủ công set quyền truy cập (có thể hữu ích trong một số trường hợp)
    setAccess: (
      state,
      action: PayloadAction<{ electionId: number; sessionId?: number; hasAccess: boolean }>,
    ) => {
      const { electionId, sessionId, hasAccess } = action.payload;
      const key = createKey(electionId, sessionId);
      state.accessResults[key] = hasAccess;
      state.lastChecked[key] = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý checkElectionAccessThunk
      .addCase(checkElectionAccessThunk.pending, (state) => {
        state.isChecking = true;
        state.error = null;
      })
      .addCase(checkElectionAccessThunk.fulfilled, (state, action) => {
        state.isChecking = false;
        const { electionId, hasAccess, fromCache } = action.payload;
        const key = `${electionId}`;

        // Chỉ cập nhật timestamp nếu không phải từ cache
        if (!fromCache) {
          state.accessResults[key] = hasAccess;
          state.lastChecked[key] = Date.now();
        }
      })
      .addCase(checkElectionAccessThunk.rejected, (state, action) => {
        state.isChecking = false;
        state.error = action.payload as string;
      })

      // Xử lý checkSessionAccessThunk
      .addCase(checkSessionAccessThunk.pending, (state) => {
        state.isChecking = true;
        state.error = null;
      })
      .addCase(checkSessionAccessThunk.fulfilled, (state, action) => {
        state.isChecking = false;
        const { electionId, sessionId, hasAccess, fromCache } = action.payload;
        const key = `${electionId}-${sessionId}`;

        // Chỉ cập nhật timestamp nếu không phải từ cache
        if (!fromCache) {
          state.accessResults[key] = hasAccess;
          state.lastChecked[key] = Date.now();
        }
      })
      .addCase(checkSessionAccessThunk.rejected, (state, action) => {
        state.isChecking = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { resetAccessState, clearAccessCache, clearAllAccessCache, setAccess } =
  cuocBauCuAccessSlice.actions;

// Export reducer
export default cuocBauCuAccessSlice.reducer;
