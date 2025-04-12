import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import apiClient from '../api/apiClient';

// Các icons cần thiết
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#83a6ed',
  '#8dd1e1',
  '#82ca9d',
];

// ABI tối thiểu cho các contract
const cuocBauCuAbi = [
  'function layKetQuaPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory ungVien, uint256[] memory soPhieu)',
  'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool dangHoatDongNe, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, uint256 soCuTriToiDa, uint256 soUngVienHienTai, uint256 soCuTriHienTai, address[] memory ungVienDacCu, bool taiBauCu, uint256 soLuongXacNhan, uint256 thoiGianHetHanXacNhan)',
  'function layThongTinCoBan(uint256 idCuocBauCu) external view returns (address nguoiSoHuu, bool dangHoatDongDay, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, string memory tenCuocBauCu, uint256 phiHLU)',
  'function laySoPhieuUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien) external view returns (uint256)',
  'function layDanhSachUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory)',
  'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
];

// Define interfaces for type safety
interface VotingResult {
  address: string;
  displayAddress: string;
  votes: number;
  percentage: number;
  isElected: boolean;
}

interface PhienBauCu {
  id: number;
  isActive?: boolean;
  startTime?: Date;
  endTime?: Date;
  candidateCount?: number;
  voterCount?: number;
}
const KetQuaBauCu = () => {
  // Thông tin cố định
  const cuocBauCuId = 1; // Fix cứng ID cuộc bầu cử
  const [contractAddresses, setContractAddresses] = useState({});
  const [contractAddress, setContractAddress] = useState('');
  const [serverId, setServerId] = useState(null);

  // States cho phiên bầu cử
  const [danhSachPhien, setDanhSachPhien] = useState<PhienBauCu[]>([]);
  const [selectedPhien, setSelectedPhien] = useState<number | null>(null);

  // States cho dữ liệu
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingSession, setIsChangingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [electionInfo, setElectionInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [votingResults, setVotingResults] = useState<VotingResult[]>([]);
  const [progress, setProgress] = useState({
    total: 0,
    voted: 0,
    percentage: 0,
  });

  // State cho theo dõi real-time
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Lấy thông tin contract addresses
  useEffect(() => {
    const fetchContractAddresses = async () => {
      try {
        const response = await apiClient.get('/api/Blockchain/contract-addresses');
        if (response.data) {
          setContractAddresses(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy địa chỉ contract:', error);
        setError('Không thể kết nối với hệ thống để lấy thông tin contracts');
      }
    };

    fetchContractAddresses();
  }, []);

  // Lấy thông tin cuộc bầu cử và serverId
  useEffect(() => {
    const fetchElectionInfo = async () => {
      try {
        // Lấy thông tin cuộc bầu cử từ API
        const response = await apiClient.get(`/api/CuocBauCu/${cuocBauCuId}`);
        if (response.data) {
          // Lấy địa chỉ blockchain từ cuộc bầu cử
          setContractAddress(
            response.data.blockchainAddress || '0x83d076026Cb9fea8694e9cBED3D30116C1DE5f74',
          );
          setServerId(response.data.blockchainServerId || 4);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin cuộc bầu cử:', error);

        // Fallback: Nếu API không hoạt động, sử dụng giá trị mặc định
        setContractAddress('0x83d076026Cb9fea8694e9cBED3D30116C1DE5f74');
        setServerId(4);
      }
    };

    fetchElectionInfo();
  }, []);

  // Lấy danh sách phiên bầu cử khi có contractAddress
  useEffect(() => {
    if (!contractAddress) return;

    const fetchPhienBauCu = async () => {
      try {
        setIsLoading(true);

        // Kết nối với blockchain
        const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
        const contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

        // Lấy thông tin cuộc bầu cử
        const electionData = await contract.layThongTinCoBan(cuocBauCuId);

        setElectionInfo({
          name: electionData[4], // tenCuocBauCu
          owner: electionData[0], // nguoiSoHuu
          isActive: electionData[1], // dangHoatDongDay
          startTime: new Date(Number(electionData[2]) * 1000).toLocaleString(), // thoiGianBatDau
          endTime: new Date(Number(electionData[3]) * 1000).toLocaleString(), // thoiGianKetThuc
        });

        // Lấy danh sách phiên bầu cử
        const phienIds = await contract.layDanhSachPhienBauCu(cuocBauCuId, 0, 10);

        if (phienIds && phienIds.length > 0) {
          // Lấy thông tin chi tiết cho từng phiên
          const phienDetails = await Promise.all(
            phienIds.map(async (id) => {
              try {
                const phienData = await contract.layThongTinPhienBauCu(cuocBauCuId, id);
                return {
                  id: Number(id),
                  isActive: phienData[0],
                  startTime: new Date(Number(phienData[1]) * 1000),
                  endTime: new Date(Number(phienData[2]) * 1000),
                  candidateCount: Number(phienData[4]),
                  voterCount: Number(phienData[5]),
                };
              } catch (error) {
                console.warn(`Không thể lấy thông tin chi tiết cho phiên ${id}:`, error);
                return { id: Number(id), error: true };
              }
            }),
          );

          setDanhSachPhien(phienDetails.filter((p) => !p.error));

          // Chọn phiên đầu tiên
          if (phienDetails.length > 0 && !selectedPhien) {
            const validPhien = phienDetails.find((p) => !p.error);
            if (validPhien) {
              setSelectedPhien(validPhien.id);
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách phiên bầu cử:', error);
        setError(`Không thể lấy danh sách phiên bầu cử: ${error.message}`);
        setIsLoading(false);
      }
    };

    fetchPhienBauCu();
  }, [contractAddress]);

  // Lấy kết quả cho phiên bầu cử được chọn
  const fetchSessionResults = useCallback(async () => {
    if (!contractAddress || !selectedPhien) return;

    try {
      setIsChangingSession(true);

      // Kết nối với blockchain
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
      const contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

      // Lấy thông tin phiên bầu cử
      const sessionData = await contract.layThongTinPhienBauCu(cuocBauCuId, selectedPhien);

      setSessionInfo({
        isActive: sessionData[0], // dangHoatDongNe
        startTime: new Date(Number(sessionData[1]) * 1000).toLocaleString(), // thoiGianBatDau
        endTime: new Date(Number(sessionData[2]) * 1000).toLocaleString(), // thoiGianKetThuc
        maxVoters: Number(sessionData[3]), // soCuTriToiDa
        candidateCount: Number(sessionData[4]), // soUngVienHienTai
        voterCount: Number(sessionData[5]), // soCuTriHienTai
        electedCandidates: sessionData[6], // ungVienDacCu
        reElection: sessionData[7], // taiBauCu
      });

      // Cách xử lý khác nhau tùy theo trạng thái phiên
      const isSessionActive = sessionData[0];

      if (isSessionActive) {
        // Phiên đang hoạt động - lấy thông tin ứng viên và số phiếu hiện tại
        const candidates = await contract.layDanhSachUngVien(cuocBauCuId, selectedPhien);

        // Lấy số phiếu từng ứng viên
        const tempResults = [];
        let totalVotes = 0;

        for (const candidate of candidates) {
          try {
            const votes = await contract.laySoPhieuUngVien(cuocBauCuId, selectedPhien, candidate);
            totalVotes += Number(votes);

            tempResults.push({
              address: candidate,
              votes: Number(votes),
              isElected: false, // Chưa có kết quả đắc cử
            });
          } catch (err) {
            console.warn(`Không thể lấy số phiếu cho ứng viên ${candidate}:`, err);
          }
        }

        // Tính phần trăm
        for (const result of tempResults) {
          result.percentage =
            totalVotes > 0 ? Number(((result.votes / totalVotes) * 100).toFixed(2)) : 0;
        }

        // Sắp xếp theo số phiếu giảm dần
        tempResults.sort((a, b) => b.votes - a.votes);

        // Cập nhật kết quả
        setVotingResults(
          tempResults.map((r) => ({
            ...r,
            displayAddress: `${r.address.substring(0, 6)}...${r.address.substring(r.address.length - 4)}`,
          })),
        );

        // Cập nhật tiến trình
        if (Number(sessionData[5]) > 0) {
          const percentage = ((totalVotes / Number(sessionData[5])) * 100).toFixed(2);
          setProgress({
            total: Number(sessionData[5]),
            voted: totalVotes,
            percentage: Number(percentage),
          });
        }
      } else {
        // Phiên đã kết thúc - lấy kết quả chính thức
        try {
          const results = await contract.layKetQuaPhienBauCu(cuocBauCuId, selectedPhien);

          // Tính tổng số phiếu
          const totalVotes = results[1].reduce((sum, votes) => sum + Number(votes), 0);

          // Xử lý kết quả bỏ phiếu cho biểu đồ
          const formattedResults = results[0].map((address, index) => {
            const voteCount = Number(results[1][index]);
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : 0;
            const isElected = sessionData[6].includes(address);

            return {
              address: address,
              displayAddress:
                address.substring(0, 6) + '...' + address.substring(address.length - 4),
              votes: voteCount,
              percentage: Number(percentage),
              isElected: isElected,
            };
          });

          // Sắp xếp theo số phiếu giảm dần
          formattedResults.sort((a, b) => b.votes - a.votes);
          setVotingResults(formattedResults);

          // Cập nhật tiến trình
          if (Number(sessionData[5]) > 0) {
            const percentage = ((totalVotes / Number(sessionData[5])) * 100).toFixed(2);
            setProgress({
              total: Number(sessionData[5]),
              voted: totalVotes,
              percentage: Number(percentage),
            });
          }
        } catch (error) {
          console.error('Lỗi khi lấy kết quả:', error);
          setError('Không thể lấy kết quả bầu cử: ' + error.message);
        }
      }

      setIsChangingSession(false);
    } catch (error) {
      console.error('Lỗi khi lấy kết quả phiên bầu cử:', error);
      setError(`Lỗi khi lấy kết quả: ${error.message}`);
      setIsChangingSession(false);
    }
  }, [contractAddress, selectedPhien]);

  useEffect(() => {
    if (selectedPhien) {
      fetchSessionResults();
    }
  }, [selectedPhien, fetchSessionResults]);

  // Theo dõi real-time
  useEffect(() => {
    if (!isMonitoring || !contractAddress || !selectedPhien) return;

    let provider;
    let contract;
    let interval;

    const setupMonitoring = async () => {
      try {
        // Thiết lập kết nối WebSocket nếu có
        try {
          provider = new ethers.WebSocketProvider('wss://geth.holihu.online/ws');
          console.log('WebSocket kết nối thành công');
        } catch (wsError) {
          // Fallback to HTTP polling
          console.warn('Không thể kết nối WebSocket, sử dụng HTTP polling:', wsError);
          provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
          interval = setInterval(fetchSessionResults, 30000); // Cập nhật mỗi 30 giây
          return;
        }

        contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

        // Chỉ dùng polling thay vì WebSocket listener (để tránh lỗi event)
        console.log('Thiết lập polling cho cập nhật dữ liệu');
        interval = setInterval(fetchSessionResults, 15000); // Cập nhật mỗi 15 giây
      } catch (error) {
        console.error('Lỗi khi thiết lập theo dõi:', error);
        // Fallback nếu có lỗi
        interval = setInterval(fetchSessionResults, 30000);
      }
    };

    setupMonitoring();

    return () => {
      if (interval) clearInterval(interval);
      if (provider) {
        if (provider.destroy) provider.destroy();
        provider.removeAllListeners();
      }
    };
  }, [isMonitoring, contractAddress, selectedPhien, fetchSessionResults, sessionInfo]);

  // Custom tooltip cho biểu đồ
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-bold">{data.displayAddress}</p>
          <p className="text-blue-600">{data.votes} phiếu</p>
          <p className="text-gray-600">{data.percentage}% tổng phiếu</p>
          {data.isElected && (
            <p className="text-green-600 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Trúng cử
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Tính thời gian còn lại
  const calculateTimeRemaining = () => {
    if (!sessionInfo) return null;

    const endTime = new Date(sessionInfo.endTime);
    const now = new Date();

    if (now > endTime) return 'Phiên đã kết thúc';

    const diff = endTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days > 0 ? `${days} ngày ` : ''}${hours} giờ ${minutes} phút`;
  };

  // Xử lý khi thay đổi phiên bầu cử
  const handleSessionChange = (e) => {
    setSelectedPhien(Number(e.target.value));
  };

  // Toggle theo dõi
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  // Hàm làm mới dữ liệu
  const refreshData = () => {
    fetchSessionResults();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4">Đang tải dữ liệu từ blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">Kết Quả Bầu Cử Blockchain</h1>
        {electionInfo && <p className="mt-2 opacity-90">{electionInfo.name}</p>}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chọn phiên bầu cử */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex-grow">
            <label htmlFor="phien-select" className="block text-sm font-medium text-gray-700 mb-1">
              Chọn phiên bầu cử:
            </label>
            <select
              id="phien-select"
              value={selectedPhien || ''}
              onChange={handleSessionChange}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isChangingSession}
            >
              <option value="">-- Chọn phiên bầu cử --</option>
              {danhSachPhien.map((phien) => (
                <option key={phien.id} value={phien.id}>
                  Phiên #{phien.id} - {phien.isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
                  {phien.isActive
                    ? ` (${phien.candidateCount} ứng viên, ${phien.voterCount} cử tri)`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isChangingSession || !selectedPhien}
            >
              {isChangingSession ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang cập nhật...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Làm mới
                </span>
              )}
            </button>

            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isMonitoring
                  ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                  : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
              }`}
              disabled={!selectedPhien}
            >
              {isMonitoring ? (
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Dừng theo dõi
                </span>
              ) : (
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Theo dõi real-time
                </span>
              )}
            </button>
          </div>
        </div>

        {isMonitoring && (
          <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-3 text-green-700 text-sm">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <div>
                <p className="font-medium">Đang theo dõi phiên bầu cử #{selectedPhien}</p>
                <p className="mt-1">
                  Dữ liệu sẽ tự động cập nhật khi có phiếu bầu mới hoặc phiên kết thúc.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPhien && sessionInfo ? (
        <>
          {/* Thông tin phiên bầu cử */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Thông tin phiên bầu cử #{selectedPhien}
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span
                    className={`font-medium ${sessionInfo.isActive ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {sessionInfo.isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Thời gian bắt đầu:</span>
                  <span className="font-medium">{sessionInfo.startTime}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Thời gian kết thúc:</span>
                  <span className="font-medium">{sessionInfo.endTime}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Số cử tri:</span>
                  <span className="font-medium">{sessionInfo.voterCount}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Số ứng viên:</span>
                  <span className="font-medium">{sessionInfo.candidateCount}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Số ứng viên trúng cử:</span>
                  <span className="font-medium">{sessionInfo.electedCandidates?.length || 0}</span>
                </div>

                {sessionInfo.isActive && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-blue-800 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        <strong>Thời gian còn lại:</strong> {calculateTimeRemaining()}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Tiến trình bỏ phiếu</h2>
              <div className="text-right mb-1">
                <span className="font-medium">
                  {progress.voted}/{progress.total} cử tri ({progress.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    progress.percentage >= 80
                      ? 'bg-green-500'
                      : progress.percentage >= 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{sessionInfo.voterCount}</div>
                  <div className="text-sm text-gray-500 mt-1">Tổng số cử tri</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{progress.voted}</div>
                  <div className="text-sm text-gray-500 mt-1">Số phiếu đã bỏ</div>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                {progress.percentage >= 60 ? (
                  <div className="flex items-start bg-green-50 p-3 rounded-lg border border-green-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-green-600 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-green-700">
                      Đủ điều kiện kết thúc sớm (trên 60% tham gia). Ban tổ chức có thể kết thúc
                      phiên bầu cử ngay bây giờ.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-blue-700">
                      Chưa đủ điều kiện kết thúc sớm (cần trên 60% cử tri tham gia). Phiên sẽ kết
                      thúc theo thời gian đã định.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kết quả bỏ phiếu */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {sessionInfo.isActive
                ? 'Kết quả bỏ phiếu hiện tại (đang cập nhật)'
                : 'Kết quả bỏ phiếu cuối cùng'}
            </h2>

            {votingResults.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-3 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>Chưa có dữ liệu kết quả bỏ phiếu.</p>
                {sessionInfo.isActive && (
                  <p className="mt-2 text-sm">
                    Phiên bầu cử đang diễn ra, hãy chờ đến khi có cử tri bỏ phiếu.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Biểu đồ cột */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={votingResults}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      >
                        <XAxis dataKey="displayAddress" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Bar dataKey="votes" name="Số phiếu" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          {votingResults.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isElected ? '#10b981' : '#3b82f6'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Biểu đồ tròn */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={votingResults}
                          dataKey="votes"
                          nameKey="displayAddress"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);

                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#fff"
                                textAnchor={x > cx ? 'start' : 'end'}
                                dominantBaseline="central"
                              >
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                        >
                          {votingResults.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isElected ? '#10b981' : COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bảng chi tiết */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thứ tự
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Địa chỉ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số phiếu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tỷ lệ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {votingResults.map((result, index) => (
                        <tr key={result.address} className={result.isElected ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono">
                            {result.displayAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {result.votes}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{result.percentage}%</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {sessionInfo.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Đang kiểm phiếu
                              </span>
                            ) : result.isElected ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Trúng cử
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Chưa trúng cử
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Thông tin người trúng cử */}
          {!sessionInfo.isActive &&
            sessionInfo.electedCandidates &&
            sessionInfo.electedCandidates.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Danh sách trúng cử</h2>

                <div className="bg-green-50 p-4 rounded-lg mb-6 text-green-800">
                  <div className="flex">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-3 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-semibold">
                        Kết quả bầu cử đã được ghi nhận trên blockchain
                      </h3>
                      <p className="mt-1">
                        Phiên bầu cử #{selectedPhien} đã kết thúc với{' '}
                        {sessionInfo.electedCandidates.length} ứng viên trúng cử.
                        {sessionInfo.electedCandidates.length > 1 &&
                          ' Kết quả có số phiếu ngang nhau.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessionInfo.electedCandidates.map((address, index) => {
                    const candidateInfo = votingResults.find((r) => r.address === address);
                    return (
                      <div
                        key={address}
                        className="bg-green-50 border border-green-100 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center">
                          <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            <span className="text-green-800 font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {address.substring(0, 6)}...{address.substring(address.length - 4)}
                            </h3>
                            {candidateInfo && (
                              <p className="text-sm text-green-700">
                                {candidateInfo.votes} phiếu ({candidateInfo.percentage}%)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </>
      ) : selectedPhien ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <div className="py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-700">
              Không thể tải thông tin phiên bầu cử
            </h3>
            <p className="text-gray-500 mt-2">
              Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
            </p>
            <button
              onClick={refreshData}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700">Vui lòng chọn phiên bầu cử</h3>
            <p className="text-gray-500 mt-2">
              Hãy chọn một phiên bầu cử từ danh sách trên để xem kết quả.
            </p>
          </div>
        </div>
      )}

      {/* Thông tin cố định */}
      <div className="bg-gray-100 p-4 rounded-lg text-sm">
        <h3 className="font-medium mb-2">Thông tin kết nối blockchain</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>
              <strong>RPC:</strong> https://geth.holihu.online/rpc
            </p>
            <p>
              <strong>Địa chỉ Contract:</strong> {contractAddress}
            </p>
            <p>
              <strong>Server ID:</strong> {serverId}
            </p>
          </div>
          <div>
            <p>
              <strong>Cuộc bầu cử ID:</strong> {cuocBauCuId}
            </p>
            <p>
              <strong>Phiên bầu cử ID:</strong> {selectedPhien || 'Chưa chọn'}
            </p>
            <p>
              <strong>Trạng thái theo dõi:</strong>{' '}
              {isMonitoring ? '🟢 Đang theo dõi' : '⚪ Không theo dõi'}
            </p>
          </div>
        </div>
      </div>

      {/* Thông báo real-time */}
      {isMonitoring && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg shadow-lg flex items-center">
          <div className="relative mr-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full absolute top-0 animate-ping"></div>
          </div>
          <div>Đang theo dõi phiên #{selectedPhien}</div>
        </div>
      )}
    </div>
  );
};

export default KetQuaBauCu;
