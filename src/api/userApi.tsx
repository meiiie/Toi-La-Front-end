import axios from 'axios';
import { User } from '../store/types';

const API_URL = 'http://localhost:3001/users'; // Cập nhật URL API của bạn

export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const searchUsers = async (params: {
  id?: number;
  name?: string;
  avatar?: string;
}): Promise<User[]> => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

export const createUser = async (newUser: Omit<User, 'id'>): Promise<User> => {
  const response = await axios.post(API_URL, newUser);
  return response.data;
};

export const updateUser = async (userId: number, user: User): Promise<void> => {
  try {
    await axios.put(`${API_URL}/${userId}`, user);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
