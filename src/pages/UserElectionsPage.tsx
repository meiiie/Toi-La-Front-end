// src/pages/UserElectionsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { getUserElections, deleteElection } from '../api/electionApi';
import { setUserElections } from '../store/electionSlice';
import { Election } from '../store/types';
import { NavLink } from 'react-router-dom';
import ElectionCard from '../features/ElectionCard';
import NotificationModal from '../components/NotificationModal';
import PaginationPhu from '../components/PaginationPhu';
import { Helmet } from 'react-helmet';
import { Tooltip } from 'react-tooltip';

const UserElectionsPage: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.users.user);
  const elections = useSelector((state: RootState) => state.elections.userElections);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [electionToDelete, setElectionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const itemsPerPage = 6;

  useEffect(() => {
    if (user) {
      const fetchUserElections = async () => {
        setLoading(true);
        const data = await getUserElections(user.id);
        dispatch(setUserElections(data));
        setLoading(false);
      };

      fetchUserElections();
    }
  }, [user, dispatch]);

  const handleDeleteElection = async () => {
    if (electionToDelete) {
      await deleteElection(electionToDelete);
      dispatch(setUserElections(elections.filter((election) => election.id !== electionToDelete)));
      setShowDeleteModal(false);
      setElectionToDelete(null);
    }
  };

  const filteredElections = elections.filter((election) =>
    election.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredElections.length / itemsPerPage),
    [filteredElections.length, itemsPerPage],
  );

  const paginatedElections = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredElections.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredElections, itemsPerPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 dark:bg-gray-900 dark:text-white">
      <Helmet>
        <title>Quản lý cuộc bầu cử của tôi</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Quản lý và theo dõi các cuộc bầu cử của bạn một cách dễ dàng và nhanh chóng."
        />
        <meta
          name="keywords"
          content="quản lý cuộc bầu cử, bầu cử, theo dõi bầu cử, quản lý bầu cử"
        />
      </Helmet>
      <nav className="breadcrumb mb-4 text-gray-600 dark:text-gray-300">
        <NavLink to="/app">Trang chủ</NavLink> / <span>Cuộc bầu cử của tôi</span>
      </nav>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700 dark:text-gray-200">
        Cuộc bầu cử của tôi
      </h1>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Tìm kiếm cuộc bầu cử..."
          className="w-full p-2 bg-gray-200 rounded dark:bg-gray-700 dark:text-white"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded mt-1 z-10 dark:bg-gray-800 dark:border-gray-700">
            {filteredElections.map((election) => (
              <div
                key={election.id}
                className="p-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-600"
                onClick={() => setSearchTerm(election.name)}
              >
                {election.name}
              </div>
            ))}
          </div>
        )}
      </div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
        Danh sách các cuộc bầu cử của bạn
      </h2>
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
        </div>
      ) : filteredElections.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center">
            {paginatedElections.map((election: Election) => (
              <div
                key={election.id}
                className="p-6 bg-blue-50 rounded-lg shadow-lg leading-relaxed hover:scale-105 transition-transform dark:bg-gray-800"
              >
                <ElectionCard
                  id={election.id}
                  name={election.name}
                  description={election.description}
                  startDate={election.startDate}
                  organizer={election.organizer}
                  voters={election.voters}
                  candidates={election.candidates}
                  status={election.status}
                  endDate={election.endDate}
                  date={election.date}
                />
                <div className="flex justify-end space-x-4 mt-4">
                  <NavLink
                    to={`/app/user-elections/elections/${election.id}/election-management`}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-300"
                    data-tip="Quản lý cuộc bầu cử này"
                  >
                    Quản Lý
                  </NavLink>
                  <button
                    onClick={() => {
                      setElectionToDelete(election.id);
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-400 transition-all duration-300"
                    data-tip="Xóa cuộc bầu cử này"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
          <PaginationPhu
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <Tooltip />
        </>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Bạn chưa tạo cuộc bầu cử nào.
        </p>
      )}
      {showDeleteModal && (
        <NotificationModal
          title="Xác nhận xóa"
          message="Bạn có chắc chắn muốn xóa cuộc bầu cử này không?"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteElection}
          confirmLabel="Xóa"
        />
      )}
    </div>
  );
};

export default UserElectionsPage;
