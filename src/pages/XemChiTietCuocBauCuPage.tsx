import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { FaEnvelope, FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import DanhSachUngVien from '../components/DanhSachUngVien';
import VoterTable from '../components/BangCuTri';
import { fetchCacUngCuVien } from '../store/slice/ungCuVienSlice';
import { fetchCacCuTri } from '../store/slice/cuTriSlice';
import ThongTinCuocBauCu from '../Election/ThongTinCuocBauCu';
import CuocBauCuTimeline from '../Election/CuocBauCuTimeline';
import SEO from '../components/SEO';

const XemChiTietCuocBauCuPage: React.FC = () => {
  const { id: electionId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const cuocBauCu = useSelector((state: RootState) => state.cuocBauCuById.cuocBauCu);
  const dangTai = useSelector((state: RootState) => state.cuocBauCuById.dangTai);
  const loi = useSelector((state: RootState) => state.cuocBauCuById.loi);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const voters = useSelector((state: RootState) => state.cuTri.cacCuTri);
  const roles = useSelector((state: RootState) => state.vaiTro.cacVaiTro);
  const candidates = useSelector((state: RootState) => state.ungCuVien.cacUngCuVien);
  const url = `/app/elections/${electionId}/elections-tienhanh`;

  useEffect(() => {
    if (electionId) {
      dispatch(fetchCuocBauCuById(Number(electionId)));
      dispatch(fetchCacUngCuVien(Number(electionId)));
      dispatch(fetchCacCuTri(Number(electionId)));
    }
  }, [dispatch, electionId]);

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

  const filteredCandidates = useMemo(() => {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return [{ id: 0, ho: '', ten: 'Không có thứ gì', moTa: '', viTriUngCuId: 0, anh: '' }];
    }
    return candidates.filter((candidate) =>
      `${candidate.ho} ${candidate.ten}`.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [candidates, searchTerm]);

  const filteredVoters = useMemo(() => {
    if (!Array.isArray(voters) || voters.length === 0) {
      return [{ id: 0, sdt: '', email: '', xacMinh: false, boPhieu: false, soLanGuiOTP: 0 }];
    }
    return voters.filter((voter) => voter.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [voters, searchTerm]);

  if (dangTai) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner border-t-4 border-blue-500 rounded-full w-16 h-16 animate-spin"></div>
      </div>
    );
  }

  if (loi) {
    return <h1 className="text-xl text-slate-900">Có lỗi xảy ra: {loi}</h1>;
  }

  if (!cuocBauCu) {
    return <h1 className="text-xl text-slate-900">Phiên Bầu Cử Không Tồn Tại!</h1>;
  }

  const formattedNgayBatDau = formatDate(cuocBauCu.ngayBatDau.toString());
  const formattedNgayKetThuc = formatDate(cuocBauCu.ngayKetThuc.toString());

  return (
    <div className="container mx-auto p-5 bg-gray-100">
      <SEO
        title={`${cuocBauCu.tenCuocBauCu} | Nền Tảng Bầu Cử Blockchain`}
        description={`Thông tin chi tiết về cuộc bầu cử ${cuocBauCu.tenCuocBauCu}.`}
        keywords="bầu cử, ứng viên, cử tri, chi tiết cuộc bầu cử"
        author="Nền tảng bầu cử"
        url={window.location.href}
      />
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">{cuocBauCu.tenCuocBauCu}</h2>
          <ThongTinCuocBauCu
            cuocBauCu={cuocBauCu}
            formattedNgayBatDau={formattedNgayBatDau}
            formattedNgayKetThuc={formattedNgayKetThuc}
            getStatusBadge={getStatusBadge}
          />
          <CuocBauCuTimeline
            ngayBatDau={cuocBauCu.ngayBatDau.toString()}
            ngayKetThuc={cuocBauCu.ngayKetThuc.toString()}
            formattedNgayBatDau={formattedNgayBatDau}
            formattedNgayKetThuc={formattedNgayKetThuc}
            isPastDate={isPastDate}
          />
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
          <DanhSachUngVien electionId={Number(electionId)} />
        </div>
        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">Danh sách cử tri</h2>
          <div className="flex items-center mb-4"></div>
          <VoterTable
            voters={filteredVoters}
            roles={roles}
            isEditPage={false}
            onAssignRole={() => {}}
            onSaveChanges={() => {}}
            onRemoveVoter={() => {}}
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
    </div>
  );
};

export default XemChiTietCuocBauCuPage;
