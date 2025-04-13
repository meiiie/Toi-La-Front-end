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
  '#845EC2', // Tím đậm
  '#5CBDB9', // Xanh ngọc
  '#D65DB1', // Hồng đậm
  '#2C73D2', // Xanh dương
  '#FF9671', // Cam đào
  '#0089BA', // Xanh biển
  '#008F7A', // Xanh lá đậm
  '#C34A36', // Đỏ gạch
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

const KetQuaBauCu = () => {
  // Thông tin cố định
  const cuocBauCuId = 1; // Fix cứng ID cuộc bầu cử
  const [contractAddresses, setContractAddresses] = useState({});
  const [contractAddress, setContractAddress] = useState('');
  const [serverId, setServerId] = useState(null);

  // States cho phiên bầu cử
  const [danhSachPhien, setDanhSachPhien] = useState([]);
  const [selectedPhien, setSelectedPhien] = useState(null);

  // States cho dữ liệu
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingSession, setIsChangingSession] = useState(false);
  const [error, setError] = useState(null);
  const [electionInfo, setElectionInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [votingResults, setVotingResults] = useState([]);
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
        <div className="backdrop-blur-md bg-white/80 p-4 border border-gray-200 rounded-lg shadow-xl">
          <p className="font-bold text-gray-800">{data.displayAddress}</p>
          <p className="text-indigo-600 font-semibold">{data.votes} phiếu</p>
          <p className="text-gray-600">{data.percentage}% tổng phiếu</p>
          {data.isElected && (
            <p className="text-emerald-600 flex items-center mt-1 font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center p-8 backdrop-blur-lg bg-white/10 rounded-xl shadow-2xl">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-indigo-500"></div>
          <p className="mt-6 text-white text-lg font-medium">Đang tải dữ liệu từ blockchain...</p>
          <p className="mt-2 text-indigo-300 text-sm">
            Quá trình này có thể mất một chút thời gian
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header kết quả */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-indigo-900/80 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200">
              Kết Quả Bầu Cử Blockchain
            </h1>
            {electionInfo && (
              <p className="text-xl opacity-90 text-indigo-200">{electionInfo.name}</p>
            )}
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            {/* Pattern SVG */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/40 backdrop-blur-md border-l-4 border-red-500 text-red-100 p-6 mb-8 rounded-lg shadow-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-lg">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chọn phiên bầu cử */}
        <div className="backdrop-blur-lg bg-white/5 rounded-xl shadow-2xl p-6 mb-8 border border-white/10 transition-all duration-300 hover:bg-white/10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-grow">
              <label
                htmlFor="phien-select"
                className="block text-sm font-medium text-indigo-300 mb-2"
              >
                Chọn phiên bầu cử:
              </label>
              <select
                id="phien-select"
                value={selectedPhien || ''}
                onChange={handleSessionChange}
                className="block w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
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

            <div className="flex gap-3">
              <button
                onClick={refreshData}
                className="px-5 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-900/50"
                disabled={isChangingSession || !selectedPhien}
              >
                {isChangingSession ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                      className="h-5 w-5 mr-2"
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
                className={`px-5 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 shadow-lg flex items-center ${
                  isMonitoring
                    ? 'bg-rose-700 text-white hover:bg-rose-600 focus:ring-rose-500 shadow-rose-900/50'
                    : 'bg-emerald-700 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-emerald-900/50'
                }`}
                disabled={!selectedPhien}
              >
                {isMonitoring ? (
                  <>
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Dừng theo dõi
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </button>
            </div>
          </div>

          {isMonitoring && (
            <div className="mt-4 bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4 text-emerald-300 text-sm animate-pulse">
              <div className="flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-3"
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
                  <p className="mt-1 text-emerald-400/80">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="backdrop-blur-lg bg-white/5 rounded-xl shadow-2xl p-6 border border-white/10 transition-all duration-300 hover:bg-white/10">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-indigo-400"
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
                  Thông tin phiên #{selectedPhien}
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400">Trạng thái:</span>
                    <span
                      className={`font-medium ${sessionInfo.isActive ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {sessionInfo.isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400">Thời gian bắt đầu:</span>
                    <span className="font-medium text-indigo-200">{sessionInfo.startTime}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400">Thời gian kết thúc:</span>
                    <span className="font-medium text-indigo-200">{sessionInfo.endTime}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400">Số cử tri:</span>
                    <span className="font-medium text-indigo-200">{sessionInfo.voterCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400">Số ứng viên:</span>
                    <span className="font-medium text-indigo-200">
                      {sessionInfo.candidateCount}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400">Số ứng viên trúng cử:</span>
                    <span className="font-medium text-indigo-200">
                      {sessionInfo.electedCandidates?.length || 0}
                    </span>
                  </div>

                  {sessionInfo.isActive && (
                    <div className="bg-indigo-900/40 rounded-lg border border-indigo-700/50 p-4 mt-2">
                      <p className="text-indigo-200 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-indigo-400"
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
                          <strong className="font-semibold">Thời gian còn lại:</strong>{' '}
                          <span className="ml-1 text-indigo-100">{calculateTimeRemaining()}</span>
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="backdrop-blur-lg bg-white/5 rounded-xl shadow-2xl p-6 border border-white/10 transition-all duration-300 hover:bg-white/10">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Tiến trình bỏ phiếu
                </h2>
                <div className="text-right mb-2">
                  <span className="font-medium text-lg">
                    <span className="text-indigo-300">{progress.voted}</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-indigo-300">{progress.total}</span>
                    <span className="text-gray-400"> cử tri </span>
                    <span className="text-indigo-400">({progress.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-5 mb-6 overflow-hidden">
                  <div
                    className={`h-5 rounded-full transition-all duration-500 ${
                      progress.percentage >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : progress.percentage >= 50
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  >
                    {progress.percentage > 10 && (
                      <div className="h-full flex items-center justify-end pr-2">
                        <span className="text-xs font-semibold">{progress.percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-indigo-800/50 to-indigo-900/50 p-5 rounded-lg text-center shadow-lg">
                    <div className="text-3xl font-bold text-indigo-300">
                      {sessionInfo.voterCount}
                    </div>
                    <div className="text-sm text-indigo-400 mt-1">Tổng số cử tri</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-800/50 to-emerald-900/50 p-5 rounded-lg text-center shadow-lg">
                    <div className="text-3xl font-bold text-emerald-300">{progress.voted}</div>
                    <div className="text-sm text-emerald-400 mt-1">Số phiếu đã bỏ</div>
                  </div>
                </div>

                <div className="mt-6 text-sm">
                  {progress.percentage >= 60 ? (
                    <div className="flex items-start bg-emerald-900/30 p-4 rounded-lg border border-emerald-700/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-emerald-400 flex-shrink-0"
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
                      <span className="text-emerald-300">
                        Đủ điều kiện kết thúc sớm (trên 60% tham gia). Ban tổ chức có thể kết thúc
                        phiên bầu cử ngay bây giờ.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start bg-indigo-900/30 p-4 rounded-lg border border-indigo-700/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-indigo-400 flex-shrink-0"
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
                      <span className="text-indigo-300">
                        Chưa đủ điều kiện kết thúc sớm (cần trên 60% cử tri tham gia). Phiên sẽ kết
                        thúc theo thời gian đã định.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kết quả bỏ phiếu */}
            <div className="backdrop-blur-lg bg-white/5 rounded-xl shadow-2xl p-6 mb-8 border border-white/10 transition-all duration-300 hover:bg-white/10">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                {sessionInfo.isActive ? 'Kết quả bỏ phiếu hiện tại' : 'Kết quả bỏ phiếu cuối cùng'}
                {sessionInfo.isActive && (
                  <span className="ml-2 inline-block animate-pulse px-2 py-1 bg-indigo-800/50 text-xs rounded-md text-indigo-300">
                    Đang cập nhật
                  </span>
                )}
              </h2>

              {votingResults.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto mb-4 text-gray-600 opacity-50"
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
                  <p className="text-xl">Chưa có dữ liệu kết quả bỏ phiếu.</p>
                  {sessionInfo.isActive && (
                    <p className="mt-2 text-indigo-400">
                      Phiên bầu cử đang diễn ra, hãy chờ đến khi có cử tri bỏ phiếu.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Biểu đồ cột với hiệu ứng glass */}
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-4 rounded-lg shadow-lg h-96">
                      <h3 className="text-center text-lg font-medium mb-3 text-indigo-300">
                        Số phiếu theo ứng viên
                      </h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                          data={votingResults}
                          margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                        >
                          <XAxis
                            dataKey="displayAddress"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tick={{ fill: '#a5b4fc' }}
                            stroke="#4f46e5"
                          />
                          <YAxis tick={{ fill: '#a5b4fc' }} stroke="#4f46e5" />
                          <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                          <Bar
                            dataKey="votes"
                            name="Số phiếu"
                            fill={(data) => (data.isElected ? '#10b981' : '#6366f1')}
                            radius={[6, 6, 0, 0]}
                          >
                            {votingResults.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isElected ? '#10b981' : COLORS[index % COLORS.length]}
                                style={{
                                  filter: 'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.3))',
                                }}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Biểu đồ tròn với hiệu ứng glass */}
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-4 rounded-lg shadow-lg h-96">
                      <h3 className="text-center text-lg font-medium mb-3 text-indigo-300">
                        Phân phối phiếu bầu
                      </h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={votingResults}
                            dataKey="votes"
                            nameKey="displayAddress"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={60}
                            labelLine={false}
                            label={({
                              cx,
                              cy,
                              midAngle,
                              innerRadius,
                              outerRadius,
                              percent,
                              index,
                            }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);

                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill="#fff"
                                  fontSize={11}
                                  fontWeight="bold"
                                  textAnchor={x > cx ? 'start' : 'end'}
                                  dominantBaseline="central"
                                >
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                            style={{ filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.4))' }}
                          >
                            {votingResults.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isElected ? '#10b981' : COLORS[index % COLORS.length]}
                                style={{
                                  opacity: 0.95,
                                  strokeWidth: entry.isElected ? 2 : 1,
                                  stroke: entry.isElected ? '#fff' : '#333',
                                }}
                              />
                            ))}
                          </Pie>
                          <Legend
                            formatter={(value, entry, index) => (
                              <span style={{ color: '#a5b4fc' }}>
                                {votingResults[index]?.displayAddress}
                              </span>
                            )}
                          />
                          <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bảng chi tiết với thiết kế mới */}
                  <div className="overflow-hidden rounded-xl shadow-2xl border border-indigo-900/50">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-indigo-900/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                              Thứ tự
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                              Địa chỉ
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                              Số phiếu
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                              Tỷ lệ
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {votingResults.map((result, index) => (
                            <tr
                              key={result.address}
                              className={`${result.isElected ? 'bg-emerald-900/30' : 'odd:bg-gray-800/30 even:bg-gray-800/10'} hover:bg-indigo-900/30 transition-colors duration-150`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center justify-center rounded-full h-7 w-7 text-sm 
                                  ${
                                    result.isElected
                                      ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-600/50'
                                      : 'bg-gray-800/70 text-gray-300 border border-gray-700'
                                  }`}
                                >
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-mono text-indigo-300">
                                {result.displayAddress}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-xl font-semibold text-white">
                                  {result.votes}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-700 rounded-full h-2 mr-3">
                                    <div
                                      className={`h-2 rounded-full ${result.isElected ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                      style={{ width: `${result.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-indigo-200">{result.percentage}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {sessionInfo.isActive ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-800/50 text-amber-300 border border-amber-700/50">
                                    <svg className="w-3 h-3 mr-1 animate-spin" viewBox="0 0 24 24">
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    Đang kiểm phiếu
                                  </span>
                                ) : result.isElected ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-800/50 text-emerald-300 border border-emerald-700/50">
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
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800/50 text-gray-300 border border-gray-700/50">
                                    Chưa trúng cử
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Thông tin người trúng cử */}
            {!sessionInfo.isActive &&
              sessionInfo.electedCandidates &&
              sessionInfo.electedCandidates.length > 0 && (
                <div className="backdrop-blur-lg bg-white/5 rounded-xl shadow-2xl p-6 mb-8 border border-white/10 transition-all duration-300 hover:bg-white/10">
                  <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-emerald-400"
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
                    Danh sách trúng cử
                  </h2>

                  <div className="bg-emerald-900/30 backdrop-blur-md p-5 rounded-lg mb-8 text-emerald-100 border border-emerald-700/50">
                    <div className="flex">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mr-4 text-emerald-400"
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
                        <h3 className="font-bold text-lg text-emerald-200">
                          Kết quả bầu cử đã được ghi nhận trên blockchain
                        </h3>
                        <p className="mt-2 leading-relaxed text-emerald-300">
                          Phiên bầu cử #{selectedPhien} đã kết thúc với{' '}
                          <span className="font-semibold text-white">
                            {sessionInfo.electedCandidates.length}
                          </span>{' '}
                          ứng viên trúng cử.
                          {sessionInfo.electedCandidates.length > 1 &&
                            ' Kết quả có số phiếu ngang nhau.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sessionInfo.electedCandidates.map((address, index) => {
                      const candidateInfo = votingResults.find((r) => r.address === address);
                      return (
                        <div
                          key={address}
                          className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-md border border-emerald-700/50 rounded-lg p-5 shadow-lg transition-all duration-300 hover:bg-emerald-900/40 hover:shadow-emerald-900/40 group"
                        >
                          <div className="flex items-center">
                            <div className="bg-emerald-800/70 rounded-full w-12 h-12 flex items-center justify-center mr-4 border border-emerald-600/50 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <span className="text-emerald-300 font-bold text-lg">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-emerald-200">
                                {address.substring(0, 6)}...{address.substring(address.length - 4)}
                              </h3>
                              {candidateInfo && (
                                <p className="text-sm text-emerald-400 mt-1">
                                  {candidateInfo.votes} phiếu ({candidateInfo.percentage}%)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 bg-emerald-900/30 h-1.5 rounded-full">
                            <div
                              className="h-1.5 bg-emerald-500 rounded-full"
                              style={{ width: `${candidateInfo?.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </>
        ) : selectedPhien ? (
          <div className="backdrop-blur-lg bg-white/5 rounded-xl shadow-2xl p-8 mb-8 text-center border border-white/10">
            <div className="py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 mx-auto text-gray-600 mb-6 opacity-50"
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
              <h3 className="text-xl font-medium text-indigo-200 mb-3">
                Không thể tải thông tin phiên bầu cử
              </h3>
              <p className="text-gray-400 mb-8">
                Có lỗi xảy ra khi tải dữ liệu từ blockchain. Vui lòng thử lại sau.
              </p>
              <button
                onClick={refreshData}
                className="px-6 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-900/50"
              >
                <span className="flex items-center justify-center">
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Thử lại
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="backdrop-blur-lg bg-white/5 rounded-xl shadow-2xl p-8 mb-8 text-center border border-white/10">
            <div className="py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 mx-auto text-gray-600 mb-6 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              <h3 className="text-xl font-medium text-indigo-200 mb-3">
                Vui lòng chọn phiên bầu cử
              </h3>
              <p className="text-gray-400">
                Hãy chọn một phiên bầu cử từ danh sách trên để xem kết quả.
              </p>
            </div>
          </div>
        )}

        {/* Thông tin kết nối blockchain */}
        <div className="backdrop-blur-lg bg-white/5 rounded-xl shadow-2xl p-6 mb-8 border border-white/10 transition-all duration-300 hover:bg-white/10">
          <h3 className="font-medium mb-4 text-lg text-indigo-300 flex items-center">
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
            Thông tin kết nối blockchain
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="flex items-center">
                <span className="text-gray-400 w-32">RPC:</span>
                <span className="text-indigo-300 font-mono text-sm">
                  https://geth.holihu.online/rpc
                </span>
              </p>
              <p className="flex items-center">
                <span className="text-gray-400 w-32">Địa chỉ Contract:</span>
                <span className="text-indigo-300 font-mono text-sm truncate">
                  {contractAddress}
                </span>
              </p>
              <p className="flex items-center">
                <span className="text-gray-400 w-32">Server ID:</span>
                <span className="text-indigo-300">{serverId}</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center">
                <span className="text-gray-400 w-32">Cuộc bầu cử ID:</span>
                <span className="text-indigo-300">{cuocBauCuId}</span>
              </p>
              <p className="flex items-center">
                <span className="text-gray-400 w-32">Phiên bầu cử ID:</span>
                <span className="text-indigo-300">{selectedPhien || 'Chưa chọn'}</span>
              </p>
              <p className="flex items-center">
                <span className="text-gray-400 w-32">Trạng thái:</span>
                <span
                  className={`${isMonitoring ? 'text-emerald-400' : 'text-gray-400'} flex items-center`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${isMonitoring ? 'bg-emerald-400' : 'bg-gray-400'}`}
                  ></span>
                  {isMonitoring ? 'Đang theo dõi' : 'Không theo dõi'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo real-time */}
      {isMonitoring && (
        <div className="fixed bottom-6 right-6 backdrop-blur-md bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-lg shadow-2xl flex items-center transition-all duration-300 animate-pulse">
          <div className="relative mr-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full absolute top-0 animate-ping"></div>
          </div>
          <div>
            <p className="font-medium">Đang theo dõi phiên #{selectedPhien}</p>
            <p className="text-xs text-emerald-400/80 mt-1">Cập nhật tự động mỗi 15 giây</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KetQuaBauCu;
