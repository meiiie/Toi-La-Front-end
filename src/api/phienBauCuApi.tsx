import apiClient from './apiClient';
import { PhienBauCu } from '../store/types';

const API_URL = '/api/PhienBauCu';

export const getCacPhienBauCu = async (): Promise<PhienBauCu[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const taoPhienBauCu = async (phienBauCu: PhienBauCu): Promise<PhienBauCu> => {
  console.log(phienBauCu);
  const response = await apiClient.post<PhienBauCu>(API_URL, { ...phienBauCu, id: 0 });
  return response.data;
};

export const capNhatPhienBauCu = async (phienBauCu: PhienBauCu): Promise<PhienBauCu> => {
  const response = await apiClient.put(API_URL, phienBauCu);
  return response.data;
};

export const getPhienBauCuById = async (id: number): Promise<PhienBauCu> => {
  const response = await apiClient.get(`${API_URL}/${id}`);
  console.log(response.data);
  return response.data;
};

export const xoaPhienBauCu = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

export const getPhienBauCuByCuocBauCuId = async (cuocBauCuId: number): Promise<PhienBauCu[]> => {
  const response = await apiClient.get(`${API_URL}/byCuocBauCu/${cuocBauCuId}`);
  return response.data;
};

export const timPhienBauCuByTen = async (tenPhienBauCu: string): Promise<PhienBauCu[]> => {
  const response = await apiClient.get(`${API_URL}/tim/${tenPhienBauCu}`);
  return response.data;
};
