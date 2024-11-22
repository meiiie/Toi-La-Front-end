import axios from 'axios';
import { Role, VoterData } from '../store/types';

const API_URL = 'http://localhost:3001/roles';

export const getRoles = async (): Promise<Role[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createRole = async (role: Role): Promise<Role> => {
  const response = await axios.post(API_URL, role);
  return response.data;
};

export const updateRole = async (roleId: number, role: Role): Promise<void> => {
  await axios.put(`${API_URL}/${roleId}`, role);
};

export const deleteRole = async (roleId: number): Promise<void> => {
  await axios.delete(`${API_URL}/${roleId}`);
};

export const assignRoleToVoter = async (
  electionId: string,
  voterPhone: string,
  roleId: number,
): Promise<void> => {
  const response = await axios.post(`${API_URL}`, {
    electionId,
    voterPhone,
    roleId,
  });
  return response.data.assign;
};
