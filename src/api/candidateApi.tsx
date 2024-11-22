// src/api/candidateApi.ts
import axios from 'axios';
import { Candidate, Election } from '../store/types';

const API_URL = 'http://localhost:3001/elections';

export const getCandidatesByElectionId = async (electionId: string): Promise<Candidate[]> => {
  const response = await axios.get(`${API_URL}/${electionId}`);
  return response.data.candidates;
};

export const saveCandidates = async (
  electionId: string,
  candidates: Candidate[],
): Promise<Candidate[]> => {
  const response = await axios.get(`${API_URL}/${electionId}`);
  const election: Election = response.data;

  // Đảm bảo rằng election.candidates luôn là một mảng và chỉ chứa các đối tượng Candidate
  const updatedCandidates: Candidate[] = [
    ...(((election.candidates as unknown[]) || []).filter(
      (c): c is Candidate => c !== null && typeof c === 'object' && 'id' in c,
    ) as Candidate[]),
    ...candidates,
  ];
  const updatedElection = { ...election, candidates: updatedCandidates };

  await axios.put(`${API_URL}/${electionId}`, updatedElection);
  return updatedCandidates;
};
