import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sendContactEmail } from '../../api/lienHeApi';
import { ContactData } from '../../store/types';

interface ContactState {
  loading: boolean;
  success: boolean;
  message: string | null;
  error: string | null;
}

const initialState: ContactState = {
  loading: false,
  success: false,
  message: null,
  error: null,
};

export const sendContact = createAsyncThunk(
  'lienHe/sendContact',
  async (contactData: ContactData, { rejectWithValue }) => {
    try {
      const response = await sendContactEmail(contactData);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response.message;
    } catch (error) {
      return rejectWithValue('An unexpected error occurred.');
    }
  },
);

const lienHeSlice = createSlice({
  name: 'lienHe',
  initialState,
  reducers: {
    resetState: (state) => {
      state.loading = false;
      state.success = false;
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendContact.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.message = null;
        state.error = null;
      })
      .addCase(sendContact.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload as string;
        state.error = null;
      })
      .addCase(sendContact.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.message = null;
        state.error = action.payload as string;
      });
  },
});

export const { resetState } = lienHeSlice.actions;

export default lienHeSlice.reducer;
