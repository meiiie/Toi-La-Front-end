import apiClient from './apiClient';

interface ResetPasswordPayload {
  newPassword: string;
}

export const resetPassword = async (id: string, newPassword: string): Promise<void> => {
  const payload: ResetPasswordPayload = { newPassword };
  await apiClient.put(`/api/tai-khoan/reset-password/${id}`, payload);
};
