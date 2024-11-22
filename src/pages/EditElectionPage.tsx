// src/pages/EditElectionPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Election, NewElectionData } from '../store/types';
import { getElectionById, updateElection } from '../api/electionApi';
import ElectionForm from '../features/ElectionForm';

const EditElectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [election, setElection] = useState<Election | null>(null);

  useEffect(() => {
    const fetchElection = async () => {
      const fetchedElection = await getElectionById(id!);
      setElection(fetchedElection);
    };

    fetchElection();
  }, [id]);

  const handleSave = async (updatedElectionData: NewElectionData): Promise<Election> => {
    if (!election) {
      throw new Error('Election not found');
    }

    // Chỉ cập nhật các trường cần thiết và giữ nguyên thông tin về ứng viên và cử tri
    const updatedElection = {
      ...election,
      ...updatedElectionData,
    };

    const savedElection = await updateElection(id!, updatedElection);
    navigate('/app/user-elections');
    return savedElection;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
          Chỉnh sửa Cuộc Bầu Cử
        </h1>
        {election && <ElectionForm onSave={handleSave} initialData={election} />}
      </div>
    </div>
  );
};

export default EditElectionPage;
