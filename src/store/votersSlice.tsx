// src/store/voterSlice.tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Voter } from './types';

interface VoterState {
  voters: Voter[];
  loading: boolean;
  error: string | null;
}

const initialState: VoterState = {
  voters: [],
  loading: false,
  error: null,
};

const voterSlice = createSlice({
  name: 'voters',
  initialState,
  reducers: {
    setVoters: (state, action: PayloadAction<Voter[]>) => {
      state.voters = action.payload;
      state.loading = false;
      state.error = null;
    },
    addVoter: (state, action: PayloadAction<Voter>) => {
      state.voters.push(action.payload);
    },
    updateVoter: (state, action: PayloadAction<Voter>) => {
      const index = state.voters.findIndex((voter) => voter.id === action.payload.id);
      if (index !== -1) {
        state.voters[index] = action.payload;
      }
    },
    removeVoter: (state, action: PayloadAction<string>) => {
      state.voters = state.voters.filter((voter) => voter.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setVoters, addVoter, updateVoter, removeVoter, setLoading, setError } =
  voterSlice.actions;

export default voterSlice.reducer;
