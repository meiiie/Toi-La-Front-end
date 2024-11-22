import React, { useEffect, useState, useMemo } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { FaEnvelope, FaCheckCircle, FaSearch } from 'react-icons/fa';
import HorizontalCandidateList from '../components/HorizontalCandidateList';
import VoterTable from '../components/VoterTable';
import { Election, Candidate, Voter, Role } from '../store/types';
import { getVotersByElectionId } from '../api/voterApi';
import { getRoles } from '../api/roleApi';
import { getCandidatesByElectionId } from '../api/candidateApi';
import axios from 'axios';

interface PhienBauCuPageProps {
  electionId: string;
}

const PhienBauCuPage: React.FC<PhienBauCuPageProps> = ({ electionId }) => {
  const [phienBauCu, setPhienBauCu] = useState<Election | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [voters, setVoters] = useState<Voter[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const url = `/app/elections/${electionId}/elections-tienhanh`;
  useEffect(() => {
    async function fetchData() {
      if (!electionId) {
        console.error('Election ID is undefined');
        setLoading(false);
        return;
      }

      try {
        const electionResponse = await axios.get(`http://localhost:3001/elections/${electionId}`);
        setPhienBauCu(electionResponse.data);

        const votersData = await getVotersByElectionId(electionId);
        setVoters(votersData);

        const rolesData = await getRoles();
        setRoles(rolesData);

        const candidatesData = await getCandidatesByElectionId(electionId);
        setCandidates(candidatesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [electionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'Invalid date'
      : new Intl.DateTimeFormat('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }).format(date);
  };

  const getStatusBadge = (status: string) => {
    let color = '';
    switch (status) {
      case 'active':
        color = 'bg-green-500';
        break;
      case 'closed':
        color = 'bg-red-500';
        break;
      case 'upcoming':
        color = 'bg-yellow-500';
        break;
      default:
        color = 'bg-gray-500';
    }
    return <span className={`badge ${color} text-white px-2 py-1 rounded`}>{status}</span>;
  };

  const isPastDate = (dateString: string) => {
    const date = new Date(dateString);
    return date < new Date();
  };

  const filteredCandidates: Candidate[] = useMemo(() => {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return [{ id: '0', name: 'Không có thứ gì', description: '', pledge: '', imageUrl: '' }];
    }
    return candidates.filter((candidate: Candidate) =>
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [candidates, searchTerm]);

  const filteredVoters = useMemo(() => {
    if (!Array.isArray(voters) || voters.length === 0) {
      return [
        { id: '0', name: 'Không có thứ gì', phone: '', email: '', isRestricted: false, roleId: 0 },
      ];
    }
    return voters.filter((voter) => voter.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [voters, searchTerm]);

  if (phienBauCu) {
    phienBauCu.imageUrl = './tai_xuong.jpg';
  }

  return (
    <div className="container mx-auto p-5 bg-gray-100">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="spinner border-t-4 border-blue-500 rounded-full w-16 h-16 animate-spin"></div>
        </div>
      ) : phienBauCu === undefined ? (
        <h1 className="text-xl text-slate-900">Phiên Bầu Cử Không Tồn Tại!</h1>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">{phienBauCu.name}</h2>
            <div className="card mb-4">
              <h3 className="text-xl font-bold text-blue-700 mb-2">Thông tin chung</h3>
              {phienBauCu.imageUrl && (
                <div className="w-full h-61 mb-4 relative overflow-hidden rounded-lg">
                  <div className="w-full h-full rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105">
                    <img
                      src={phienBauCu.imageUrl}
                      alt={`Ảnh của ${phienBauCu.name}`}
                      className="w-full h-full object-cover rounded-lg border-4 border-gradient-to-r from-[#F88195] to-[#C06C84]"
                    />
                    <div className="absolute inset-0 rounded-lg border-4 border-transparent bg-gradient-to-r from-[#F88195] to-[#C06C84] opacity-15"></div>
                  </div>
                </div>
              )}
              <p className="text-base text-slate-900 mb-2">{phienBauCu.description}</p>
              <p className="text-base text-slate-800 mb-2">
                Ngày tổ chức: {formatDate(phienBauCu.date)}
              </p>
              <p className="text-base text-slate-800 mb-2">Người tổ chức: {phienBauCu.organizer}</p>
              <p className="text-base text-slate-800 mb-2">
                Trạng thái: {getStatusBadge(phienBauCu.status)}
              </p>
            </div>
            <div className="card mb-4">
              <h3 className="text-xl font-bold text-blue-700 mb-2">Timeline</h3>
              <div className="timeline">
                <div
                  className={`timeline-step ${isPastDate(phienBauCu.startDate) ? 'completed' : ''}`}
                >
                  <div className="timeline-circle">
                    {isPastDate(phienBauCu.startDate) && (
                      <FaCheckCircle className="text-green-500" />
                    )}
                  </div>
                  <p className="timeline-label">Ngày bắt đầu: {formatDate(phienBauCu.startDate)}</p>
                </div>
                <div
                  className={`timeline-step ${isPastDate(phienBauCu.endDate) ? 'completed' : ''}`}
                >
                  <div className="timeline-circle">
                    {isPastDate(phienBauCu.endDate) && <FaCheckCircle className="text-green-500" />}
                  </div>
                  <p className="timeline-label">Ngày kết thúc: {formatDate(phienBauCu.endDate)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Tìm kiếm</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm ứng viên hoặc cử tri"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded mb-4 pl-10"
              />
              <FaSearch className="absolute top-3 left-3 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Danh sách ứng viên</h2>
            <HorizontalCandidateList candidates={filteredCandidates} />
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Danh sách cử tri</h2>
            <VoterTable
              voters={filteredVoters}
              roles={roles}
              onAssignRole={function (voter: Voter, roleId: number): void {
                throw new Error('Function not implemented.');
              }}
              isEditPage={false}
            />
          </div>
          <NavLink
            to={url}
            className="cta-button bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full flex items-center justify-center space-x-2 hover:from-purple-600 hover:to-blue-600 transform hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            <FaEnvelope className="text-white" />
            <span>Liên Hệ Với Chúng Tôi</span>
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default PhienBauCuPage;
