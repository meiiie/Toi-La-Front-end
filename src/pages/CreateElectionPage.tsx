// src/pages/CreateElectionPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewElectionData, Election } from '../store/types';
import { createElection } from '../api/electionApi';
import ElectionForm from '../features/ElectionForm';

const CreateElectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = async (newElectionData: NewElectionData): Promise<Election> => {
    const createdElection = await createElection(newElectionData);
    navigate(`/app/user-elections/elections/${createdElection.id}/election-management`);
    return createdElection;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
          Tạo Cuộc Bầu Cử Mới
        </h1>
        <ElectionForm onSave={handleSave} />
      </div>
    </div>
  );
};

export default CreateElectionPage;
