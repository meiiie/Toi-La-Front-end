// src/api/electionApi.ts
import axios from 'axios';
import { Election, NewElectionData } from '../store/types';

const API_URL = 'http://localhost:3001/elections';

export const getElections = async (): Promise<Election[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createElection = async (newElection: Omit<Election, 'id'>): Promise<Election> => {
  const response = await axios.post(API_URL, newElection);
  return response.data;
};

export const getUserElections = async (userId: number): Promise<Election[]> => {
  const response = await axios.get(`${API_URL}?userId=${userId}`);
  return response.data;
};

export const getElectionById = async (id: string): Promise<Election> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const updateElection = async (
  id: string,
  updatedElection: NewElectionData,
): Promise<Election> => {
  const response = await axios.put(`${API_URL}/${id}`, updatedElection);
  return response.data;
};

export const deleteElection = async (electionId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${electionId}`);
};

export const getUpcomingElections = async (): Promise<Election[]> => {
  const response = await axios.get(API_URL);
  const elections: Election[] = response.data;
  const currentDate = new Date();
  return elections.filter((election) => new Date(election.startDate) > currentDate);
};
