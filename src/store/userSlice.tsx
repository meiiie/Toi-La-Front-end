import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notifications, SocialLinks, User } from '../store/types';

interface UserState {
  currentUser: any;
  user: User | null;
  permissions: string[] | undefined;
  loading: boolean;
}

const initialState: UserState = {
  user: null,
  permissions: undefined,
  loading: false,
  currentUser: undefined,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload ?? null;
    },
    updateUserSettings: (
      state,
      action: PayloadAction<{
        name: string;
        avatar: string;
        theme: string;
        email?: string;
        phoneNumber?: string;
        dateOfBirth?: Date | undefined;
        address?: string;
        gender?: string;
        bio?: string;
        socialLinks?: SocialLinks;
        twoFactorEnabled?: boolean;
        notifications?: Notifications;
      }>,
    ) => {
      if (state.user) {
        state.user.name = action.payload.name;
        state.user.avatar = action.payload.avatar;
        state.user.bio = action.payload.bio;
        state.user.socialLinks = action.payload.socialLinks;
        // Lưu theme
        localStorage.setItem('theme', action.payload.theme);
        // Thêm các xử lý khác nếu cần
      }
    },
    authenticateAction: (state) => {
      state.loading = true;
    },
    authenticatedAction: (state, action: PayloadAction<User | undefined>) => {
      state.user = action.payload ?? null;
      state.permissions = action.payload?.roles.flatMap(
        (role: { permissions: string[] }) => role.permissions,
      );
      state.loading = false;
    },
    authorizeAction: (state) => {
      state.loading = true;
    },
    authorizedAction: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
      state.loading = false;
    },
    logoutAction: (state) => {
      state.user = null;
      state.permissions = undefined;
      state.loading = false;
    },
  },
});

export const {
  setUser,
  updateUserSettings,
  authenticateAction,
  authenticatedAction,
  authorizeAction,
  authorizedAction,
  logoutAction,
} = userSlice.actions;

export default userSlice.reducer;
