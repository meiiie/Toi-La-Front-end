import { configureStore } from '@reduxjs/toolkit';
import electionReducer from '../store/electionSlice';
import userReducer from '../store/userSlice';
import roleReducer from '../store/roleSlice';
import voterReducer from './votersSlice';

export const store = configureStore({
  reducer: {
    voters: voterReducer,
    elections: electionReducer,
    users: userReducer,
    roles: roleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
