// src/store/electionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Election } from './types';

interface ElectionState {
  elections: Election[];
  userElections: Election[];
}

const initialState: ElectionState = {
  elections: [],
  userElections: [],
};

const electionSlice = createSlice({
  name: 'elections',
  initialState,
  reducers: {
    setElections: (state, action: PayloadAction<Election[]>) => {
      state.elections = action.payload;
    },
    setUserElections: (state, action: PayloadAction<Election[]>) => {
      state.userElections = action.payload;
    },
    addElection: (state, action: PayloadAction<Election>) => {
      state.elections.push(action.payload);
      state.userElections.push(action.payload);
    },
    updateElection: (state, action: PayloadAction<Election>) => {
      const index = state.elections.findIndex((election) => election.id === action.payload.id);
      if (index !== -1) {
        state.elections[index] = action.payload;
      }
      const userIndex = state.userElections.findIndex(
        (election) => election.id === action.payload.id,
      );
      if (userIndex !== -1) {
        state.userElections[userIndex] = action.payload;
      }
    },
    deleteElection: (state, action: PayloadAction<string>) => {
      state.elections = state.elections.filter((election) => election.id !== action.payload);
      state.userElections = state.userElections.filter(
        (election) => election.id !== action.payload,
      );
    },
  },
});

export const { setElections, setUserElections, addElection, updateElection, deleteElection } =
  electionSlice.actions;

export default electionSlice.reducer;
