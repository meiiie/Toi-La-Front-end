import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import CandidateForm from '../components/FormUngVien';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  fetchCacUngCuVien,
  addUngCuVien,
  editUngCuVien,
  removeUngCuVien,
} from '../store/slice/ungCuVienSlice';
import { UngCuVien } from '../store/types';
import { ClipLoader } from 'react-spinners';
import { Search, Plus, X, Edit, Trash2 } from 'lucide-react';
import PaginationPhu from '../components/PaginationPhu';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface CandidateManagementProps {
  phienBauCuId: string;
}

const QuanLyUngVienPage: React.FC<CandidateManagementProps> = ({ phienBauCuId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const candidates = useSelector((state: RootState) => state.ungCuVien.cacUngCuVien);
  const loading = useSelector((state: RootState) => state.ungCuVien.dangTai);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [candidatesPerPage] = useState<number>(6);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingCandidate, setEditingCandidate] = useState<UngCuVien | null>(null);
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLDivElement>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<UngCuVien | null>(null);

  useEffect(() => {
    dispatch(fetchCacUngCuVien());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowForm(false);
        setEditingCandidate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSaveCandidate = async (candidate: UngCuVien) => {
    try {
      if (editingCandidate) {
        await dispatch(editUngCuVien({ id: candidate.id, ungCuVien: candidate })).unwrap();
      } else {
        await dispatch(addUngCuVien(candidate)).unwrap();
      }
      setShowForm(false);
      setEditingCandidate(null);
    } catch (error) {
      console.error('Không thể lưu ứng viên:', error);
    }
  };

  const handleEditCandidate = (candidate: UngCuVien) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    try {
      await dispatch(removeUngCuVien(candidateId)).unwrap();
      setCandidateToDelete(null);
    } catch (error) {
      console.error('Không thể xóa ứng viên:', error);
    }
  };

  const handleToggleExpand = (candidateId: string) => {
    setExpandedCandidates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const filteredCandidates = candidates?.filter((candidate) =>
    candidate.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()),
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
        <title>Quản lý ứng viên | Nền Tảng Bầu Cử Blockchain</title>
        <meta name="description" content="Quản lý và thêm ứng viên cho phiên bầu cử." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="keywords" content="quản lý ứng viên, bầu cử, thêm ứng viên" />
      </Helmet>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Quản lý ứng viên</h1>
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
                onClick={() => {
                  setShowForm(false);
                  setEditingCandidate(null);
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Đóng"
              >
                <X size={24} />
              </button>
              <CandidateForm
                onSave={handleSaveCandidate}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCandidate(null);
                }}
                initialData={editingCandidate}
              />
            </div>
          </div>
        )}
        {currentCandidates?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCandidates?.map((candidate) => {
              const isDescriptionLong = candidate.moTa.length > 100;
              return (
                <div
                  key={candidate.id}
                  className="bg-white dark:bg-gray-700 shadow-lg dark:shadow-dark-lg rounded-lg p-6 transition-transform duration-300 ease-in-out transform hover:scale-105"
                >
                  <img
                    src={candidate.anh}
                    alt={`Hình ảnh của ${candidate.hoTen}`}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    loading="lazy"
                  />
                  <h3 className="text-xl font-bold text-blue-600 dark:text-gray-300 mb-2">
                    {candidate.hoTen}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {expandedCandidates.has(candidate.id.toString()) || !isDescriptionLong
                      ? candidate.moTa
                      : `${candidate.moTa.substring(0, 100)}...`}
                  </p>
                  {isDescriptionLong && (
                    <button
                      onClick={() => handleToggleExpand(candidate.id.toString())}
                      className="mt-2 text-blue-500 hover:text-blue-700"
                    >
                      {expandedCandidates.has(candidate.id.toString()) ? 'Ẩn bớt' : 'Xem thêm'}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditCandidate(candidate)}
                    className="mt-4 flex items-center bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition-colors"
                  >
                    <Edit className="mr-2" />
                    Chỉnh sửa
                  </button>
                  <AlertDialog.Root>
                    <AlertDialog.Trigger asChild>
                      <button
                        className="mt-4 flex items-center bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
                        onClick={() => setCandidateToDelete(candidate)}
                      >
                        <Trash2 className="mr-2" />
                        Xóa
                      </button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Portal>
                      <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
                      <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <AlertDialog.Title className="text-lg font-bold">
                          Xác nhận xóa
                        </AlertDialog.Title>
                        <AlertDialog.Description className="mt-2">
                          Bạn có chắc chắn muốn xóa ứng viên này không? Hành động này không thể hoàn
                          tác.
                        </AlertDialog.Description>
                        <div className="mt-4 flex justify-end space-x-2">
                          <AlertDialog.Cancel asChild>
                            <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-full">
                              Hủy
                            </button>
                          </AlertDialog.Cancel>
                          <AlertDialog.Action asChild>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full"
                              onClick={() => handleDeleteCandidate(candidate.id)}
                            >
                              Xóa
                            </button>
                          </AlertDialog.Action>
                        </div>
                      </AlertDialog.Content>
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </div>
              );
            })}
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
        <PaginationPhu
          currentPage={currentPage}
          totalPages={Math.ceil(filteredCandidates.length / candidatesPerPage)}
          onPageChange={paginate}
        />
      </main>
    </div>
  );
};

export default QuanLyUngVienPage;
