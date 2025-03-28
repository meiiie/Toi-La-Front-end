import apiClient from './apiClient';

export const dangXuat = async (): Promise<{ message: string }> => {
  console.log('dangXuat');
  const response = await apiClient.post('/api/tai-khoan/logout');
  console.log('dangXuat response', response);
  return response.data;
};
