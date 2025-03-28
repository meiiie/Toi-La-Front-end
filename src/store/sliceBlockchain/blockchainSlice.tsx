import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getHluBalanceDirectly,
  getHluTokenInfoDirectly,
  getAddressDetailsDirectly,
  transferHluToken,
} from '../../api/apiBlockchain/blockchain-api';
import { isValidAddress } from '../../api/apiBlockchain/blockchain-utils';

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  nguonCungBanDau: string;
  nguonCungToiDa: string;
  phanTramPhiToiDa: number;
  phanTramPhiChuyen: number;
  diaChiNhanPhi: string;
  paused: boolean;
}

interface AddressRoles {
  isAdmin: boolean;
  isMinter: boolean;
  isPauser: boolean;
  isFeeManager: boolean;
}

interface AddressDetails {
  address: string;
  hluBalance: string;
  etherBalance: string;
  isMarkedForBurn: boolean;
  discountRate: number;
  roles: AddressRoles;
}

interface TransactionState {
  hash: string | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

interface BlockchainState {
  hluBalance: string | null;
  tokenInfo: TokenInfo | null;
  addressDetails: AddressDetails | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  currentAddress: string | null;
  transaction: TransactionState;
}

const initialState: BlockchainState = {
  hluBalance: null,
  tokenInfo: null,
  addressDetails: null,
  isConnected: false,
  isLoading: false,
  error: null,
  currentAddress: null,
  transaction: {
    hash: null,
    isLoading: false,
    error: null,
    success: false,
  },
};

// Thunk để lấy số dư HLU token
export const fetchHluBalance = createAsyncThunk(
  'blockchain/fetchHluBalance',
  async (address: string, { rejectWithValue }) => {
    try {
      // Kiểm tra địa chỉ có hợp lệ không
      if (!isValidAddress(address)) {
        return rejectWithValue('Địa chỉ ví không hợp lệ');
      }

      const balance = await getHluBalanceDirectly(address);
      return { address, balance };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy số dư HLU');
    }
  },
);

// Thunk để lấy thông tin token
export const fetchTokenInfo = createAsyncThunk(
  'blockchain/fetchTokenInfo',
  async (_, { rejectWithValue }) => {
    try {
      const tokenInfo = await getHluTokenInfoDirectly();
      tokenInfo.decimals = Number(tokenInfo.decimals);
      return tokenInfo;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy thông tin token');
    }
  },
);

// Thunk để lấy thông tin chi tiết về địa chỉ
export const fetchAddressDetails = createAsyncThunk(
  'blockchain/fetchAddressDetails',
  async (address: string, { rejectWithValue }) => {
    try {
      // Kiểm tra địa chỉ có hợp lệ không
      if (!isValidAddress(address)) {
        return rejectWithValue('Địa chỉ ví không hợp lệ');
      }

      const details = await getAddressDetailsDirectly(address);
      return details;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy thông tin địa chỉ');
    }
  },
);

// Thunk để chuyển token
export const transferToken = createAsyncThunk(
  'blockchain/transferToken',
  async (
    { privateKey, toAddress, amount }: { privateKey: string; toAddress: string; amount: string },
    { rejectWithValue },
  ) => {
    try {
      // Kiểm tra địa chỉ đích có hợp lệ không
      if (!isValidAddress(toAddress)) {
        return rejectWithValue('Địa chỉ nhận không hợp lệ');
      }

      // Kiểm tra số lượng hợp lệ
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return rejectWithValue('Số lượng token không hợp lệ');
      }

      const receipt = await transferHluToken(privateKey, toAddress, amount);
      return receipt ? receipt.hash : null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi chuyển token');
    }
  },
);

const blockchainSlice = createSlice({
  name: 'blockchain',
  initialState,
  reducers: {
    setCurrentAddress: (state, action: PayloadAction<string>) => {
      state.currentAddress = action.payload;
    },
    clearBlockchainState: (state) => {
      state.hluBalance = null;
      state.error = null;
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    clearTransactionState: (state) => {
      state.transaction = {
        hash: null,
        isLoading: false,
        error: null,
        success: false,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý fetchHluBalance
      .addCase(fetchHluBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHluBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hluBalance = action.payload.balance;
        state.currentAddress = action.payload.address;
        state.isConnected = true;
      })
      .addCase(fetchHluBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Xử lý fetchTokenInfo
      .addCase(fetchTokenInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTokenInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokenInfo = action.payload as TokenInfo;
        state.isConnected = true;
      })
      .addCase(fetchTokenInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isConnected = false;
      })

      // Xử lý fetchAddressDetails
      .addCase(fetchAddressDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAddressDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addressDetails = action.payload as AddressDetails;
        state.hluBalance = action.payload.hluBalance;
        state.currentAddress = action.payload.address;
        state.isConnected = true;
      })
      .addCase(fetchAddressDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Xử lý transferToken
      .addCase(transferToken.pending, (state) => {
        state.transaction.isLoading = true;
        state.transaction.error = null;
        state.transaction.success = false;
        state.transaction.hash = null;
      })
      .addCase(transferToken.fulfilled, (state, action) => {
        state.transaction.isLoading = false;
        state.transaction.hash = action.payload;
        state.transaction.success = true;
      })
      .addCase(transferToken.rejected, (state, action) => {
        state.transaction.isLoading = false;
        state.transaction.error = action.payload as string;
        state.transaction.success = false;
      });
  },
});

export const {
  setCurrentAddress,
  clearBlockchainState,
  setConnectionStatus,
  clearTransactionState,
} = blockchainSlice.actions;
export default blockchainSlice.reducer;
