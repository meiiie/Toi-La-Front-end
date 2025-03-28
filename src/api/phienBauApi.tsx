import axios from 'axios';
import { PhienBauCu } from '../store/types';

const API_URL = 'http://localhost:5000/api/phienbaucu';

export const getCacPhienBauCu = async (): Promise<PhienBauCu[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createPhienBauCu = async (phienBauCu: Omit<PhienBauCu, 'id'>): Promise<PhienBauCu> => {
  const response = await axios.post(API_URL, phienBauCu);
  return response.data;
};

export const getPhienBauCuById = async (id: number): Promise<PhienBauCu> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const updatePhienBauCu = async (
  id: number,
  phienBauCu: Partial<PhienBauCu>,
): Promise<PhienBauCu> => {
  const response = await axios.put(`${API_URL}/${id}`, phienBauCu);
  return response.data;
};

export const deletePhienBauCu = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
