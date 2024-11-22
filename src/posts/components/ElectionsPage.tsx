// src/pages/ElectionsPage.tsx
import React, { useState } from 'react';
import { useLoaderData, Await } from 'react-router-dom';
import { Suspense } from 'react';
import { Election, NewElectionData } from '../types';
import { saveElection } from '../saveElection';
import { assertIsElections } from '../getElections';
import { NewElectionForm } from '../NewElectionForm';
import ElectionControls from '../ElectionControls';

export function ElectionsPage() {
  const data = useLoaderData();
  console.log('Loaded data:', data); // Kiểm tra dữ liệu có vào component không
  assertIsData(data);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [voters, setVoters] = useState<string[]>([]);

  async function handleSave(newElectionData: NewElectionData) {
    const election: Omit<Election, 'id'> = {
      ...newElectionData,
      candidates: candidates.map(Number), // Chuyển đổi từ string[] sang number[]
      voters: voters.map(Number), // Chuyển đổi từ string[] sang number[]
      organizer: 'Default Organizer', // Thêm thuộc tính organizer
      date: new Date().toISOString(), // Thêm thuộc tính date
    };
    console.log('Submitted election details:', election);
    await saveElection(election);
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-100 to-blue-200 p-6">
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 pr-8 relative">
          <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            <i className="fas fa-vote-yea mr-2"></i>
            <i className="fas fa-ballot mr-2"></i>
            Tạo Cuộc Bầu Cử Của Bạn
          </h1>
          <NewElectionForm onSave={handleSave} />
        </div>
        <div className="col-span-1 pl-4 relative">
          <Suspense fallback={<div className="spinner">Đang tải dữ liệu bầu cử...</div>}>
            <Await resolve={data.elections}>
              {(elections) => {
                assertIsElections(elections);
                return <ElectionControls elections={elections} />;
              }}
            </Await>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

type Data = {
  elections: Election[];
};

export function assertIsData(data: unknown): asserts data is Data {
  if (typeof data !== 'object' || data === null) {
    console.warn('Data is not an object or is null');
    return;
  }
  if (!('elections' in data) || !Array.isArray(data.elections) || data.elections.length === 0) {
    console.warn('Dữ liệu bầu cử không có hoặc không hợp lệ');
    console.log(data);
    return;
  }
}
