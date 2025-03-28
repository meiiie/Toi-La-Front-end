import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThongBao } from '../types';

interface TrangThaiThongBao {
  cacThongBao: ThongBao[];
}

const trangThaiBanDau: TrangThaiThongBao = {
  cacThongBao: [],
};

const thongBaoSlice = createSlice({
  name: 'cacThongBao',
  initialState: trangThaiBanDau,
  reducers: {
    datCacThongBao: (state, action: PayloadAction<ThongBao[]>) => {
      state.cacThongBao = action.payload;
    },
    themThongBao: (state, action: PayloadAction<ThongBao>) => {
      state.cacThongBao.push(action.payload);
    },
    capNhatThongBao: (state, action: PayloadAction<ThongBao>) => {
      const index = state.cacThongBao.findIndex((thongBao) => thongBao.id === action.payload.id);
      if (index !== -1) {
        state.cacThongBao[index] = action.payload;
      }
    },
    xoaThongBao: (state, action: PayloadAction<number>) => {
      state.cacThongBao = state.cacThongBao.filter((thongBao) => thongBao.id !== action.payload);
    },
  },
});

export const { datCacThongBao, themThongBao, capNhatThongBao, xoaThongBao } = thongBaoSlice.actions;
export default thongBaoSlice.reducer;
