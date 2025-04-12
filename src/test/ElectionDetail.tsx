'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';
import type { RootState, AppDispatch } from '../store/store';
import { ethers, Contract, JsonRpcProvider, formatEther } from 'ethers';
import {
  Search,
  PlusCircle,
  ArrowUpRight,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  RefreshCw,
  Loader,
  User,
  Hexagon,
  Shield,
  BarChart,
  List,
  Grid3X3,
  ChevronRight,
  Command,
  ExternalLink,
  Network,
  Terminal,
  Bug,
  Vote,
} from 'lucide-react';
import { useToast } from '../test/components/use-toast';
import BlockchainInfo from './BlockchainInfo';

// Định nghĩa kiểu dữ liệu
interface ElectionItem {
  id: number;
  tenCuocBauCu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string;
  trangThaiBlockchain: number;
  hinhAnh?: string;
  soLuongPhienBauCu: number;
  nguoiTao: string;
  diaChiBlockchain?: string;
}

interface FilterOptions {
  status: number[]; // Mảng các trạng thái được lọc
  search: string;
  sortBy: 'newest' | 'oldest' | 'alphabetical';
}

const ElectionDashboard: React.FC = () => {
  // State
  const [userElections, setUserElections] = useState<ElectionItem[]>([]);
  const [selectedElection, setSelectedElection] = useState<ElectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: [0, 1, 2, 3], // Mặc định hiển thị tất cả trạng thái
    search: '',
    sortBy: 'newest',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Thông tin blockchain
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [quanLyCuocBauCuContracts, setQuanLyCuocBauCuContracts] = useState<{
    [key: number]: ethers.Contract;
  }>({});

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // Router
  const navigate = useNavigate();
  const { toast } = useToast();

  // ABI tối thiểu cần thiết để truy vấn thông tin cuộc bầu cử từ Factory
  const FACTORY_ABI = [
    'function layServerCuaNguoiDung(address nguoiDung) external view returns (uint256[] memory)',
    'function layThongTinServer(uint128 id) external view returns (address quanLyCuocBauCu, string memory tenCuocBauCu, string memory moTa, uint8 trangThai, uint64 soLuongBaoCao, uint64 soLuongViPhamXacNhan, address nguoiTao)',
    'function soLuongServerTonTai() external view returns (uint128)',
    'function idCuocBauCuTiepTheo() external view returns (uint128)',
    'function danhSachServerTonTai(uint256) external view returns (uint256)',
  ];

  // ABI để truy vấn thông tin chi tiết từ contract QuanLyCuocBauCu
  const QUANLYCUOCBAUCU_ABI = [
    'function layThongTinCoBan(uint256 idCuocBauCu) external view returns (address nguoiSoHuu, bool dangHoatDongDay, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, string memory tenCuocBauCu, uint256 phiHLU)',
    'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool dangHoatDongNe, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, uint256 soCuTriToiDa, uint256 soUngVienHienTai, uint256 soCuTriHienTai, address[] memory ungVienDacCu, bool taiBauCu, uint256 soLuongXacNhan, uint256 thoiGianHetHanXacNhan)',
    'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
    'function layDanhSachUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory)',
    'function layDanhSachUngVienDacCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory)',
    'function laySoPhieuUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien) external view returns (uint256)',
    'function soLuongCuocBauCuTonTai() external view returns (uint256)',
    'function layDanhSachIdTonTai() external view returns (uint256[] memory)',
    'function coPhienBauCuDangHoatDong() external view returns (bool)',
  ];

  // Địa chỉ của CuocBauCuFactory contract - chính xác từ luonghoanchinh.js
  const FACTORY_ADDRESS = '0x0b70c3CD86428B67C72295185CC66342571478e7';

  // Địa chỉ token HLU từ luonghoanchinh.js
  const HLU_TOKEN_ADDRESS = '0x820F15F12Aa75BAa89A16B20768024C8604Ea16f';

  // Khởi tạo provider và contract
  useEffect(() => {
    try {
      // Kết nối với RPC endpoint của blockchain
      const rpcUrl = 'https://geth.holihu.online/rpc';
      console.log('Kết nối tới Blockchain RPC:', rpcUrl);
      const newProvider = new JsonRpcProvider(rpcUrl);
      setProvider(newProvider);

      // Tạo instance của Factory contract
      console.log('Kết nối tới Factory contract:', FACTORY_ADDRESS);
      const newFactoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, newProvider);
      setFactoryContract(newFactoryContract);
    } catch (error) {
      console.error('Lỗi khi kết nối với blockchain:', error);
      setError('Không thể kết nối với blockchain. Vui lòng thử lại sau.');
    }
  }, []);

  // Hàm lấy danh sách cuộc bầu cử của người dùng từ blockchain
  const fetchUserElections = useCallback(async () => {
    if (!walletInfo?.diaChiVi || !factoryContract || !provider) return;

    try {
      setIsLoading(true);
      setError('');

      console.log('Đang lấy danh sách server của địa chỉ:', walletInfo.diaChiVi);

      // Thử kiểm tra các tham số của Factory contract
      try {
        const soLuongServer = await factoryContract.soLuongServerTonTai();
        console.log('Số lượng server tồn tại:', soLuongServer.toString());

        const nextId = await factoryContract.idCuocBauCuTiepTheo();
        console.log('ID cuộc bầu cử tiếp theo:', nextId.toString());
      } catch (error) {
        console.error('Lỗi khi kiểm tra thông tin factory:', error);
      }

      // Lấy danh sách ID server của người dùng từ blockchain
      let serverIds = [];
      try {
        serverIds = await factoryContract.layServerCuaNguoiDung(walletInfo.diaChiVi);
        console.log(
          'Server IDs từ blockchain:',
          serverIds.map((id) => id.toString()),
        );
      } catch (contractError) {
        console.error('Lỗi khi gọi layServerCuaNguoiDung:', contractError);

        // Thử phương pháp thay thế: duyệt qua tất cả server hiện có và kiểm tra
        try {
          console.log('Dùng phương pháp thay thế để tìm server của người dùng');
          const nextId = await factoryContract.idCuocBauCuTiepTheo();
          const alternativeServerIds = [];

          for (let i = 1; i < Number(nextId); i++) {
            try {
              const serverInfo = await factoryContract.layThongTinServer(i);
              // Kiểm tra nếu nguoiTao (phần tử thứ 7) là địa chỉ ví hiện tại
              if (serverInfo[6].toLowerCase() === walletInfo.diaChiVi.toLowerCase()) {
                alternativeServerIds.push(i);
              }
            } catch (e) {
              // Skip if error
            }
          }

          serverIds = alternativeServerIds;
          console.log('Tìm thấy server qua phương pháp thay thế:', alternativeServerIds);
        } catch (altError) {
          console.error('Phương pháp thay thế cũng thất bại:', altError);
        }
      }

      if (serverIds.length === 0) {
        console.log('Không tìm thấy server nào cho ví hiện tại');
        setUserElections([]);
        setIsLoading(false);
        return;
      }

      // Lấy thông tin chi tiết cho mỗi server
      const electionsPromises = serverIds.map(async (id) => {
        try {
          console.log(`Đang lấy thông tin cho server ID: ${id.toString()}`);
          // Gọi hàm layThongTinServer theo contract - trả về một mảng các giá trị
          const serverInfo = await factoryContract.layThongTinServer(id);
          console.log('Thông tin server từ Factory:', serverInfo);

          // Kết nối đến contract QuanLyCuocBauCu cho server này
          const quanLyCuocBauCuAddress = serverInfo[0];
          let quanLyCuocBauCuContract;

          // Kiểm tra xem đã có kết nối đến QuanLyCuocBauCu chưa
          if (!quanLyCuocBauCuContracts[Number(id)]) {
            quanLyCuocBauCuContract = new Contract(
              quanLyCuocBauCuAddress,
              QUANLYCUOCBAUCU_ABI,
              provider,
            );
            setQuanLyCuocBauCuContracts((prev) => ({
              ...prev,
              [Number(id)]: quanLyCuocBauCuContract,
            }));
          } else {
            quanLyCuocBauCuContract = quanLyCuocBauCuContracts[Number(id)];
          }

          // Đặt format ngày tháng phù hợp cho ứng dụng
          const formatDate = (timestamp) => {
            if (!timestamp || timestamp === 0 || timestamp === '0') return '';

            try {
              const date = new Date(Number(timestamp) * 1000);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            } catch (e) {
              console.error('Lỗi khi format ngày tháng:', e);
              return '';
            }
          };

          // Tạo giá trị mặc định từ thời gian hiện tại
          const currentDate = new Date();
          const defaultEndDate = new Date(currentDate);
          defaultEndDate.setDate(defaultEndDate.getDate() + 7); // Mặc định 7 ngày

          const defaultStartDateStr = formatDate(Math.floor(currentDate.getTime() / 1000));
          const defaultEndDateStr = formatDate(Math.floor(defaultEndDate.getTime() / 1000));

          // Lấy thông tin chi tiết từ QuanLyCuocBauCu
          let cuocBauCuDetail = {
            soPhienBauCu: 0,
            ngayBatDau: defaultStartDateStr,
            ngayKetThuc: defaultEndDateStr,
            tenCuocBauCu: serverInfo[1],
            dangHoatDong: false,
          };

          try {
            // Lấy thông tin cơ bản từ QuanLyCuocBauCu
            // Hàm này trả về: (address nguoiSoHuu, bool dangHoatDongDay, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, string memory tenCuocBauCu, uint256 phiHLU)
            const thongTinCoBan = await quanLyCuocBauCuContract.layThongTinCoBan(1); // ID cuộc bầu cử là 1 trong QuanLyCuocBauCu
            console.log('Thông tin cơ bản từ QuanLyCuocBauCu:', thongTinCoBan);

            // Chỉ cập nhật nếu giá trị có ý nghĩa
            if (thongTinCoBan && thongTinCoBan.length >= 6) {
              // Kiểm tra và chỉ sử dụng dữ liệu blockchain nếu hợp lệ
              cuocBauCuDetail.dangHoatDong = thongTinCoBan[1]; // dangHoatDongDay

              // Chỉ cập nhật ngày nếu thời gian bắt đầu > 0
              if (thongTinCoBan[2] && Number(thongTinCoBan[2]) > 0) {
                cuocBauCuDetail.ngayBatDau = formatDate(thongTinCoBan[2]); // thoiGianBatDau
              }

              // Chỉ cập nhật ngày nếu thời gian kết thúc > 0
              if (thongTinCoBan[3] && Number(thongTinCoBan[3]) > 0) {
                cuocBauCuDetail.ngayKetThuc = formatDate(thongTinCoBan[3]); // thoiGianKetThuc
              }

              // Ưu tiên tên từ blockchain nếu có
              if (thongTinCoBan[4] && thongTinCoBan[4].trim() !== '') {
                cuocBauCuDetail.tenCuocBauCu = thongTinCoBan[4]; // tenCuocBauCu
              }
            }

            // Lấy danh sách phiên bầu cử
            try {
              const danhSachPhien = await quanLyCuocBauCuContract.layDanhSachPhienBauCu(1, 0, 10); // Lấy tối đa 10 phiên
              console.log(
                'Danh sách phiên bầu cử:',
                danhSachPhien ? danhSachPhien.map((p) => p.toString()) : [],
              );

              cuocBauCuDetail.soPhienBauCu = danhSachPhien ? danhSachPhien.length : 0;
            } catch (phienError) {
              console.log('Không thể lấy danh sách phiên bầu cử:', phienError);
              // Không làm gì, giữ nguyên giá trị mặc định
            }
          } catch (error) {
            console.error(`Lỗi khi lấy thông tin chi tiết từ QuanLyCuocBauCu cho ID ${id}:`, error);
            // Nếu lỗi, vẫn sử dụng thông tin mặc định từ Factory
          }

          // Xác định trạng thái cuộc bầu cử dựa trên thời gian
          let trangThaiBlockchain = Number(serverInfo[3]);

          // Nếu đã triển khai (trangThaiBlockchain = 2), kiểm tra thêm trạng thái hoạt động
          if (trangThaiBlockchain === 2 && cuocBauCuDetail.dangHoatDong) {
            const now = new Date();
            const startDate = cuocBauCuDetail.ngayBatDau
              ? new Date(cuocBauCuDetail.ngayBatDau.split('/').reverse().join('-'))
              : null;
            const endDate = cuocBauCuDetail.ngayKetThuc
              ? new Date(cuocBauCuDetail.ngayKetThuc.split('/').reverse().join('-'))
              : null;

            // Xác định trạng thái dựa trên thời gian
            if (startDate && endDate) {
              if (now < startDate) {
                // Sắp diễn ra
                trangThaiBlockchain = 4; // Trạng thái "Sắp diễn ra"
              } else if (now > endDate) {
                // Đã kết thúc
                trangThaiBlockchain = 5; // Trạng thái "Đã kết thúc"
              } else {
                // Đang diễn ra
                trangThaiBlockchain = 6; // Trạng thái "Đang diễn ra"
              }
            }
          }

          // Tạo object ElectionItem từ dữ liệu blockchain và SQL
          return {
            id: Number(id),
            // Sử dụng thông tin chi tiết từ QuanLyCuocBauCu nếu có
            tenCuocBauCu: cuocBauCuDetail.tenCuocBauCu || serverInfo[1],
            ngayBatDau: cuocBauCuDetail.ngayBatDau || defaultStartDateStr,
            ngayKetThuc: cuocBauCuDetail.ngayKetThuc || defaultEndDateStr,
            moTa: serverInfo[2],
            trangThaiBlockchain: trangThaiBlockchain,
            nguoiTao: serverInfo[6],
            diaChiBlockchain: serverInfo[0],
            soLuongPhienBauCu: cuocBauCuDetail.soPhienBauCu,
            dangHoatDong: cuocBauCuDetail.dangHoatDong,
          };
        } catch (error) {
          console.error(`Lỗi khi lấy thông tin cho cuộc bầu cử ID ${id}:`, error);
          return null;
        }
      });

      const elections = (await Promise.all(electionsPromises)).filter(Boolean);
      console.log('Danh sách cuộc bầu cử đã lấy từ blockchain:', elections);
      setUserElections(elections);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cuộc bầu cử từ blockchain:', error);
      setError('Không thể lấy danh sách cuộc bầu cử từ blockchain');

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lấy danh sách cuộc bầu cử từ blockchain',
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletInfo, factoryContract, provider, toast]);

  // Lấy thông tin ví khi component được tải
  useEffect(() => {
    if (userInfo && userInfo.id && userInfo.diaChiVi) {
      dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
    }
  }, [userInfo, dispatch]);

  // Lấy danh sách cuộc bầu cử khi component được tải và sau khi factoryContract đã khởi tạo
  useEffect(() => {
    if (factoryContract && walletInfo?.diaChiVi) {
      fetchUserElections();
    }
  }, [fetchUserElections, factoryContract, walletInfo]);

  // Lọc và sắp xếp danh sách cuộc bầu cử
  const filteredElections = userElections
    .filter((election) => {
      // Lọc theo trạng thái
      if (!filterOptions.status.includes(election.trangThaiBlockchain)) {
        return false;
      }

      // Lọc theo tìm kiếm
      if (
        filterOptions.search &&
        !election.tenCuocBauCu.toLowerCase().includes(filterOptions.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sắp xếp theo lựa chọn
      switch (filterOptions.sortBy) {
        case 'newest':
          return new Date(b.ngayBatDau).getTime() - new Date(a.ngayBatDau).getTime();
        case 'oldest':
          return new Date(a.ngayBatDau).getTime() - new Date(b.ngayBatDau).getTime();
        case 'alphabetical':
          return a.tenCuocBauCu.localeCompare(b.tenCuocBauCu);
        default:
          return 0;
      }
    });

  // Xử lý thay đổi tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterOptions((prev) => ({ ...prev, search: e.target.value }));
  };

  // Xử lý thay đổi lọc trạng thái
  const handleStatusFilterChange = (status: number) => {
    setFilterOptions((prev) => {
      const currentStatuses = [...prev.status];

      if (currentStatuses.includes(status)) {
        // Nếu đã có trong danh sách, loại bỏ
        return { ...prev, status: currentStatuses.filter((s) => s !== status) };
      } else {
        // Nếu chưa có, thêm vào
        return { ...prev, status: [...currentStatuses, status] };
      }
    });
  };

  // Xử lý thay đổi sắp xếp
  const handleSortChange = (sortBy: 'newest' | 'oldest' | 'alphabetical') => {
    setFilterOptions((prev) => ({ ...prev, sortBy }));
  };

  // Xử lý khi chọn một cuộc bầu cử
  const handleSelectElection = (election: ElectionItem) => {
    setSelectedElection(election);
  };

  // Đi đến trang triển khai với ID cuộc bầu cử
  const handleDeploy = (id: number) => {
    navigate(`/deploy/${id}`);
  };

  // Đi đến trang quản lý cuộc bầu cử
  const handleManageElection = (id: number) => {
    navigate(`/election/${id}`);
  };

  // Đi đến trang tạo cuộc bầu cử mới
  const handleCreateNewElection = () => {
    navigate('/election/create');
  };

  // Làm mới danh sách
  const handleRefresh = () => {
    if (factoryContract && walletInfo?.diaChiVi) {
      fetchUserElections();
      toast({
        title: 'Đang làm mới',
        description: 'Đang tải lại danh sách cuộc bầu cử từ blockchain',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể kết nối với blockchain hoặc thông tin ví chưa sẵn sàng',
      });
    }
  };

  // Render trạng thái cuộc bầu cử
  const renderStatus = (status: number) => {
    switch (status) {
      case 0:
        return (
          <div className="flex items-center text-yellow-600 dark:text-yellow-400">
            <Clock className="w-4 h-4 mr-1" />
            <span>Chưa triển khai</span>
          </div>
        );
      case 1:
        return (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <Loader className="w-4 h-4 mr-1 animate-spin" />
            <span>Đang triển khai</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>Đã triển khai</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>Triển khai thất bại</span>
          </div>
        );
      case 4:
        return (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <Clock className="w-4 h-4 mr-1" />
            <span>Sắp diễn ra</span>
          </div>
        );
      case 5:
        return (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>Đã kết thúc</span>
          </div>
        );
      case 6:
        return (
          <div className="flex items-center text-emerald-600 dark:text-emerald-400">
            <Vote className="w-4 h-4 mr-1" />
            <span>Đang diễn ra</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>Không xác định</span>
          </div>
        );
    }
  };

  return (
    <div className="relative p-8 bg-gradient-to-b from-white to-gray-50 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] rounded-xl shadow-lg min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
              <Command className="w-8 h-8 mr-2 text-blue-500 dark:text-blue-400" />
              Quản Lý Cuộc Bầu Cử
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              Quản lý và triển khai các cuộc bầu cử của bạn lên blockchain để đảm bảo tính minh bạch
              và bất biến.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateNewElection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg flex items-center shadow-md transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Tạo mới
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title="Làm mới"
            >
              <RefreshCw className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Blockchain Info Panel */}
        <div className="mb-8">
          <BlockchainInfo walletAddress={walletInfo?.diaChiVi} />

          {/* Debug Panel - Hiển thị thông tin kỹ thuật để debug */}
          <div className="mt-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium mb-2 flex items-center">
                <Terminal className="w-4 h-4 mr-2" />
                Thông tin blockchain (dành cho kỹ thuật viên)
              </summary>
              <div className="mt-2 space-y-2 pl-4 text-gray-700 dark:text-gray-300 text-xs">
                <p>
                  <b>Wallet Address:</b> {walletInfo?.diaChiVi || 'Không có'}
                </p>
                <p>
                  <b>Factory Contract:</b> {FACTORY_ADDRESS}
                </p>
                <p>
                  <b>HLU Token:</b> {HLU_TOKEN_ADDRESS}
                </p>
                <p>
                  <b>Factory Connected:</b> {factoryContract ? 'Yes' : 'No'}
                </p>
                <p>
                  <b>Provider Connected:</b> {provider ? 'Yes' : 'No'}
                </p>
                <button
                  onClick={async () => {
                    try {
                      if (!walletInfo?.diaChiVi || !factoryContract) return;

                      console.log('Kiểm tra kết nối contract...');

                      // Kiểm tra hàm lấy số lượng server tồn tại
                      const soLuongServer = await factoryContract.soLuongServerTonTai();
                      console.log('Số lượng server tồn tại:', soLuongServer.toString());

                      // Thử lấy danh sách server của người dùng
                      const servers = await factoryContract.layServerCuaNguoiDung(
                        walletInfo.diaChiVi,
                      );
                      console.log(
                        'Danh sách server của người dùng:',
                        servers.map((s) => s.toString()),
                      );

                      toast({
                        title: 'Kiểm tra thành công',
                        description: `Số server tồn tại: ${soLuongServer}, Server của user: ${servers.length}`,
                      });
                    } catch (error) {
                      console.error('Lỗi khi kiểm tra:', error);
                      toast({
                        variant: 'destructive',
                        title: 'Lỗi kiểm tra',
                        description: String(error),
                      });
                    }
                  }}
                  className="mt-2 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-800 dark:text-blue-300 flex items-center text-xs"
                >
                  <Bug className="w-3 h-3 mr-1" />
                  Kiểm tra kết nối contract
                </button>
              </div>
            </details>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800">
              <details className="text-sm">
                <summary className="cursor-pointer text-red-600 dark:text-red-400 font-medium mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Thông tin xử lý lỗi (dành cho kỹ thuật viên)
                </summary>
                <div className="mt-2 space-y-2 pl-4 text-gray-700 dark:text-gray-300 text-xs">
                  <p>
                    <b>Error Message:</b> {error}
                  </p>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto mt-2 text-xs">
                    {JSON.stringify(
                      {
                        walletAddress: walletInfo?.diaChiVi || 'Không có',
                        factoryContract: Boolean(factoryContract),
                        provider: Boolean(provider),
                        serverCount: userElections.length,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm cuộc bầu cử..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                value={filterOptions.search}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Filter className="w-5 h-5 mr-2" />
                Bộ lọc
              </button>

              <div className="flex border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 ${
                    view === 'grid'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 ${
                    view === 'list'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Options Panel */}
          {isFilterOpen && (
            <div className="mt-4 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Trạng thái
                  </h3>
                  <div className="space-y-2">
                    {[
                      { value: 0, label: 'Đang hoạt động' },
                      { value: 1, label: 'Tạm dừng' },
                      { value: 2, label: 'Đã lưu trữ' },
                      { value: 3, label: 'Lỗi/Vi phạm' },
                    ].map((status) => (
                      <div key={status.value} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`status-${status.value}`}
                          checked={filterOptions.status.includes(status.value)}
                          onChange={() => handleStatusFilterChange(status.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`status-${status.value}`}
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                        >
                          {status.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Sắp xếp theo
                  </h3>
                  <div className="space-y-2">
                    {[
                      { value: 'newest', label: 'Mới nhất trước' },
                      { value: 'oldest', label: 'Cũ nhất trước' },
                      { value: 'alphabetical', label: 'Theo tên (A-Z)' },
                    ].map((sort) => (
                      <div key={sort.value} className="flex items-center">
                        <input
                          type="radio"
                          id={`sort-${sort.value}`}
                          name="sortBy"
                          checked={filterOptions.sortBy === sort.value}
                          onChange={() => handleSortChange(sort.value as any)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor={`sort-${sort.value}`}
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                        >
                          {sort.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {!provider || !factoryContract ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center text-center">
              <Network className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-lg font-medium text-red-600 dark:text-red-400">
                Không thể kết nối với blockchain
              </p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Đang cố gắng kết nối với mạng blockchain. Vui lòng đợi hoặc làm mới trang.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Làm mới trang
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Đang tải dữ liệu từ blockchain...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-lg font-medium text-red-600 dark:text-red-400">{error}</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Vui lòng thử tải lại trang hoặc liên hệ với quản trị viên.
              </p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : filteredElections.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center text-center">
              <Shield className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                Không tìm thấy cuộc bầu cử nào
              </p>
              <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-md">
                {filterOptions.search
                  ? `Không tìm thấy cuộc bầu cử nào phù hợp với từ khóa "${filterOptions.search}"`
                  : 'Bạn chưa có cuộc bầu cử nào. Hãy tạo cuộc bầu cử mới để bắt đầu!'}
              </p>
              <button
                onClick={handleCreateNewElection}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Tạo cuộc bầu cử mới
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Grid view */}
            {view === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredElections.map((election) => (
                  <div
                    key={election.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                  >
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
                      {election.hinhAnh ? (
                        <img
                          src={election.hinhAnh}
                          alt={election.tenCuocBauCu}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Hexagon className="w-14 h-14 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm text-xs font-medium">
                        {renderStatus(election.trangThaiBlockchain)}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {election.tenCuocBauCu}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {election.ngayBatDau} - {election.ngayKetThuc}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <User className="w-4 h-4 mr-2" />
                          <span>{election.nguoiTao || 'Bạn'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <BarChart className="w-4 h-4 mr-2" />
                          <span>{election.soLuongPhienBauCu || 0} phiên bầu cử</span>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        {election.moTa || 'Không có mô tả'}
                      </p>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleManageElection(election.id)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-200 text-sm font-medium"
                        >
                          Quản lý
                        </button>
                        <button
                          onClick={() => handleDeploy(election.id)}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md text-sm font-medium"
                        >
                          Triển khai
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List view */}
            {view === 'list' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Tên cuộc bầu cử
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Thời gian
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Trạng thái
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Số phiên
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredElections.map((election) => (
                        <tr
                          key={election.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                {election.hinhAnh ? (
                                  <img
                                    src={election.hinhAnh}
                                    alt={election.tenCuocBauCu}
                                    className="h-10 w-10 rounded-md object-cover"
                                  />
                                ) : (
                                  <Hexagon className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {election.tenCuocBauCu}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {election.moTa || 'Không có mô tả'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {election.ngayBatDau}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {election.ngayKetThuc}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderStatus(election.trangThaiBlockchain)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {election.soLuongPhienBauCu || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleManageElection(election.id)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Quản lý
                              </button>
                              <button
                                onClick={() => handleDeploy(election.id)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Triển khai
                              </button>
                              {election.diaChiBlockchain && (
                                <a
                                  href={`https://explorer.holihu.online/address/${election.diaChiBlockchain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectionDashboard;
