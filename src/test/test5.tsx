'use client';

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ScrollArea } from '../components/ui/Scroll-area';
import { Search, Info } from 'lucide-react';
import { useToast } from '../components/ui/Use-toast';
import VoterSidebar from './test8';
import CandidateCard from './test6';
import VotingModal from './test9';
import ElectionInfoModal from './test7';

const VoterDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeElection, setActiveElection] = useState<{
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    description: string;
  } | null>({
    id: 1,
    name: 'Bầu cử Hội đồng Nhân dân 2025',
    startDate: '2025-03-01',
    endDate: '2025-03-10',
    description: 'Cuộc bầu cử Hội đồng Nhân dân nhiệm kỳ 2025-2030',
  });
  const [candidates, setCandidates] = useState<
    { id: number; name: string; party: string; age: number; background: string; votes: number }[]
  >([
    { id: 1, name: 'Nguyễn Văn A', party: 'Đảng A', age: 45, background: 'Luật sư', votes: 1500 },
    { id: 2, name: 'Trần Thị B', party: 'Đảng B', age: 50, background: 'Bác sĩ', votes: 1200 },
    { id: 3, name: 'Lê Văn C', party: 'Đảng C', age: 55, background: 'Giáo sư', votes: 1800 },
    { id: 4, name: 'Phạm Thị D', party: 'Đảng A', age: 40, background: 'Doanh nhân', votes: 1000 },
  ]);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    id: number;
    name: string;
    party: string;
    age: number;
    background: string;
    votes: number;
  } | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const filteredCandidates = candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const confirmVote = () => {
    // Hypothetical logic for confirming a vote
    console.log('Vote confirmed for candidate:', selectedCandidate);
    setIsVotingModalOpen(false);
  };

  function handleVote(candidate: {
    id: number;
    name: string;
    party: string;
    age: number;
    background: string;
    votes: number;
  }) {
    setSelectedCandidate(candidate);
    setIsVotingModalOpen(true);
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <VoterSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Hệ Thống Bầu Cử Trực Tuyến
            </h1>
            <Button onClick={() => setIsInfoModalOpen(true)}>
              <Info className="mr-2 h-4 w-4" /> Thông tin bầu cử
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <Card>
                <CardHeader>
                  <CardTitle>{activeElection?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <Search className="text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Tìm kiếm ứng cử viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCandidates.map((candidate) => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          onVote={() => handleVote(candidate)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <VotingModal
        isOpen={isVotingModalOpen}
        onClose={() => setIsVotingModalOpen(false)}
        onConfirm={confirmVote}
        candidate={selectedCandidate}
      />
      <ElectionInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        election={activeElection}
      />
    </div>
  );
};

export default VoterDashboard;
