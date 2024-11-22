// src/features/roleSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Role } from './types';

const initialState: Role[] = [];

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    setRoles: (state, action: PayloadAction<Role[]>) => action.payload,
    addRole: (state, action: PayloadAction<Role>) => {
      state.push(action.payload);
    },
    updateRole: (state, action: PayloadAction<Role>) => {
      const index = state.findIndex((role) => role.id === action.payload.id);
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    deleteRole: (state, action: PayloadAction<number>) => {
      return state.filter((role) => role.id !== action.payload);
    },
  },
});

export const { setRoles, addRole, updateRole, deleteRole } = roleSlice.actions;
export default roleSlice.reducer;
