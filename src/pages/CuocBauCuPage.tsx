import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { FaEnvelope, FaCheckCircle, FaSearch, FaTrash } from 'react-icons/fa';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchCacCuocBauCu } from '../store/slice/cuocBauCuSlice';
import HorizontalCandidateList from '../components/HorizontalCandidateList';
import VoterTable from '../components/BangCuTri';
import { UngCuVien, CuTri, VaiTro } from '../store/types';
import { fetchCacUngCuVien, removeUngCuVien } from '../store/slice/ungCuVienSlice';
import { fetchCacCuTri, removeCuTri } from '../store/slice/cuTriSlice';

const CuocBauCuPage: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const cuocBauCu = useSelector((state: RootState) =>
    state.cuocBauCu.cacCuocBauCu.find((cuocBauCu) => cuocBauCu.id === Number(electionId)),
  );
  const dangTai = useSelector((state: RootState) => state.cuocBauCu.dangTai);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [voters, setVoters] = useState<CuTri[]>([]);
  const [roles] = useState<VaiTro[]>([]);
  const [candidates, setCandidates] = useState<UngCuVien[]>([]);
  const [selectedVoters, setSelectedVoters] = useState<Set<number>>(new Set());
  const url = `/app/elections/${electionId}/elections-tienhanh`;

  useEffect(() => {
    if (!cuocBauCu) {
      dispatch(fetchCacCuocBauCu());
    }
    dispatch(fetchCacUngCuVien());
    dispatch(fetchCacCuTri());
  }, [dispatch, cuocBauCu]);

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

  const filteredCandidates: UngCuVien[] = useMemo(() => {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return [{ id: 0, hoTen: 'Không có thứ gì', moTa: '', viTriUngCuId: 0, anh: '' }];
    }
    return candidates.filter((candidate: UngCuVien) =>
      candidate.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [candidates, searchTerm]);

  const filteredVoters = useMemo(() => {
    if (!Array.isArray(voters) || voters.length === 0) {
      return [{ id: 0, sdt: '', email: '', xacMinh: false, boPhieu: false, soLanGuiOTP: 0 }];
    }
    return voters.filter((voter) => voter.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [voters, searchTerm]);

  const handleRemoveVoter = (id: number) => {
    dispatch(removeCuTri(id));
    setVoters(voters.filter((voter) => voter.id !== id));
  };

  const handleBulkRemoveVoters = () => {
    selectedVoters.forEach((id) => handleRemoveVoter(id));
    setSelectedVoters(new Set());
  };

  const handleRemoveCandidate = (id: number) => {
    dispatch(removeUngCuVien(id));
    setCandidates(candidates.filter((candidate) => candidate.id !== id));
  };

  const handleSelectVoter = (id: number) => {
    setSelectedVoters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (cuocBauCu) {
    cuocBauCu.anh = './tai_xuong.jpg';
  }

  return (
    <div className="container mx-auto p-5 bg-gray-100">
      <Helmet>
        <title>Chi tiết Cuộc Bầu Cử | Nền Tảng Bầu Cử Blockchain</title>
        <meta
          name="description"
          content="Trang chi tiết cuộc bầu cử, bao gồm thông tin về các ứng viên và cử tri."
        />
        <meta name="keywords" content="cuộc bầu cử, chi tiết, ứng viên, cử tri, blockchain" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="Chi tiết Cuộc Bầu Cử - Bầu Cử Blockchain" />
        <meta
          property="og:description"
          content="Trang chi tiết cuộc bầu cử, bao gồm thông tin về các ứng viên và cử tri."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`http://localhost:3000/elections/${electionId}`} />
        <meta property="og:image" content="http://localhost:3000/logo.png" />
      </Helmet>
      {dangTai ? (
        <div className="flex justify-center items-center h-screen">
          <div className="spinner border-t-4 border-blue-500 rounded-full w-16 h-16 animate-spin"></div>
        </div>
      ) : cuocBauCu === undefined ? (
        <h1 className="text-xl text-slate-900">Phiên Bầu Cử Không Tồn Tại!</h1>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">{cuocBauCu.tenCuocBauCu}</h2>
            <div className="card mb-4">
              <h3 className="text-xl font-bold text-blue-700 mb-2">Thông tin chung</h3>
              {cuocBauCu.anh && (
                <div className="w-full h-61 mb-4 relative overflow-hidden rounded-lg">
                  <div className="w-full h-full rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105">
                    <img
                      src={cuocBauCu.anh}
                      alt={`Ảnh của ${cuocBauCu.tenCuocBauCu}`}
                      className="w-full h-full object-cover rounded-lg border-4 border-gradient-to-r from-[#F88195] to-[#C06C84]"
                    />
                    <div className="absolute inset-0 rounded-lg border-4 border-transparent bg-gradient-to-r from-[#F88195] to-[#C06C84] opacity-15"></div>
                  </div>
                </div>
              )}
              <p className="text-base text-slate-900 mb-2">{cuocBauCu.moTa}</p>
              <p className="text-base text-slate-800 mb-2">
                Ngày tổ chức: {formatDate(cuocBauCu.ngayBatDau.toString())}
              </p>
              <p className="text-base text-slate-800 mb-2">
                Ngày kết thúc: {formatDate(cuocBauCu.ngayKetThuc.toString())}
              </p>
              <p className="text-base text-slate-800 mb-2">
                Trạng thái: {getStatusBadge(cuocBauCu.trangThai)}
              </p>
            </div>
            <div className="card mb-4">
              <h3 className="text-xl font-bold text-blue-700 mb-2">Timeline</h3>
              <div className="timeline">
                <div
                  className={`timeline-step ${
                    isPastDate(cuocBauCu.ngayBatDau.toString()) ? 'completed' : ''
                  }`}
                >
                  <div className="timeline-circle">
                    {isPastDate(cuocBauCu.ngayBatDau.toString()) && (
                      <FaCheckCircle className="text-green-500" />
                    )}
                  </div>
                  <p className="timeline-label">
                    Ngày bắt đầu: {formatDate(cuocBauCu.ngayBatDau.toString())}
                  </p>
                </div>
                <div
                  className={`timeline-step ${
                    isPastDate(cuocBauCu.ngayKetThuc.toString()) ? 'completed' : ''
                  }`}
                >
                  <div className="timeline-circle">
                    {isPastDate(cuocBauCu.ngayKetThuc.toString()) && (
                      <FaCheckCircle className="text-green-500" />
                    )}
                  </div>
                  <p className="timeline-label">
                    Ngày kết thúc: {formatDate(cuocBauCu.ngayKetThuc.toString())}
                  </p>
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
            <HorizontalCandidateList
              candidates={filteredCandidates}
              onRemoveCandidate={handleRemoveCandidate}
            />
          </div>
          <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Danh sách cử tri</h2>
            <div className="flex items-center mb-4">
              <button
                onClick={handleBulkRemoveVoters}
                className="ml-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center"
              >
                <FaTrash className="mr-2" />
                Xóa Hàng Loạt
              </button>
            </div>
            <VoterTable
              voters={filteredVoters}
              roles={roles}
              onAssignRole={function (voter: CuTri, roleId: number): void {
                throw new Error('Function not implemented.');
              }}
              onSaveChanges={(updatedVoters: CuTri[]) => setVoters(updatedVoters)}
              onRemoveVoter={handleRemoveVoter}
              onSelectVoter={handleSelectVoter}
              selectedVoters={selectedVoters}
              isEditPage={true}
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

export default CuocBauCuPage;
