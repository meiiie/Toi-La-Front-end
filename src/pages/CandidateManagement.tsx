import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import CandidateForm from '../components/CandidateForm';
import { getCandidatesByElectionId, saveCandidates } from '../api/candidateApi';
import { Candidate, Election } from '../store/types';
import { ClipLoader } from 'react-spinners';
import { ChevronLeft, Search, Plus, X } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/Pagination';

interface CandidateManagementProps {
  electionId: string;
}

const CandidateManagement: React.FC<CandidateManagementProps> = ({ electionId }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [candidatesPerPage] = useState<number>(6);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [election, setElection] = useState<Election | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const fetchedCandidates = await getCandidatesByElectionId(electionId);
        setCandidates(fetchedCandidates);
        // Giả sử có một hàm getElectionById để lấy thông tin cuộc bầu cử
        // const fetchedElection = await getElectionById(electionId);
        // setElection(fetchedElection);
      } catch (error) {
        console.error('Không thể tải danh sách ứng viên:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [electionId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSaveCandidate = async (candidate: Candidate) => {
    try {
      const updatedCandidates = await saveCandidates(electionId, [...candidates, candidate]);
      setCandidates(updatedCandidates);
      setShowForm(false);
    } catch (error) {
      console.error('Không thể lưu ứng viên:', error);
    }
  };

  const filteredCandidates = candidates?.filter((candidate) =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const indexOfLastCandidate = currentPage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = filteredCandidates?.slice(indexOfFirstCandidate, indexOfLastCandidate);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color={'#123abc'} loading={loading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      <Helmet>
        <title>Quản lý ứng viên - Bầu cử</title>
        <meta name="description" content="Quản lý và thêm ứng viên cho phiên bầu cử." />
      </Helmet>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">{election?.name || 'Quản lý ứng viên'}</h1>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <div className="mb-6 flex justify-between items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm ứng viên..."
              className="pl-10 pr-4 py-2 rounded-full bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-2" />
            Thêm ứng viên mới
          </button>
        </div>
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              ref={formRef}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md relative"
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Đóng"
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-bold mb-4">Thêm ứng viên mới</h2>
              <CandidateForm onSave={handleSaveCandidate} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        )}
        {currentCandidates?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCandidates?.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white dark:bg-gray-700 shadow-lg dark:shadow-dark-lg rounded-lg p-6 transition-transform duration-300 ease-in-out transform hover:scale-105"
              >
                <img
                  src={candidate.imageUrl}
                  alt={`Hình ảnh của ${candidate.name}`}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-bold text-blue-600 dark:text-gray-300 mb-2">
                  {candidate.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{candidate.description}</p>
                <p className="text-gray-600 dark:text-gray-400">{candidate.pledge}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            <p className="text-xl mb-4">Chưa có ứng viên nào. Hãy thêm ứng viên đầu tiên ngay!</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
            >
              Thêm ứng viên mới
            </button>
          </div>
        )}
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => paginate(currentPage - 1)}
                isActive={currentPage === 1}
              />
            </PaginationItem>
            {Array.from({ length: Math.ceil(filteredCandidates?.length / candidatesPerPage) }).map(
              (_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => paginate(index + 1)}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => paginate(currentPage + 1)}
                isActive={currentPage === Math.ceil(filteredCandidates?.length / candidatesPerPage)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </main>
    </div>
  );
};

export default CandidateManagement;
