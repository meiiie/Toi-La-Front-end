import axios from 'axios';
import { VoterData, Election } from '../store/types';

const API_URL = 'http://localhost:3001/elections';

export const getVotersByElectionId = async (electionId: string): Promise<VoterData[]> => {
  const response = await axios.get(`${API_URL}/${electionId}`);
  console.log('Voters data:', response.data.voters); // Thêm dòng này để kiểm tra dữ liệu
  return response.data.voters;
};

export const saveVoters = async (electionId: string, voters: VoterData[]): Promise<VoterData[]> => {
  const response = await axios.get(`${API_URL}/${electionId}`);
  const election: Election = response.data;

  // Đảm bảo rằng election.voters luôn là một mảng
  const updatedVoters = [...(election.voters || []), ...voters];
  const updatedElection = { ...election, voters: updatedVoters };

  await axios.put(`${API_URL}/${electionId}`, updatedElection);
  return voters;
};
