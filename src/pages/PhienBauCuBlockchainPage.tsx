'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseUnits, getBytes, SigningKey, Contract, JsonRpcProvider } from 'ethers';
import apiClient from '../api/apiClient';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';
import { fetchImageUrl } from '../store/slice/cuocBauCuImageSlice';
import {
  Loader,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Award,
  Shield,
  Hexagon,
  Users,
  UserPlus,
  Info,
  Hourglass,
  CheckCircle,
  AlertCircleIcon,
  Play,
  ChevronRight,
  Plus,
  Key,
  Wallet,
  Network,
  ExternalLink,
  Link,
  Server,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../test/components/use-toast';
import { TrangThaiBlockchain } from '../store/types';
import ApproveHLU from '../components/blockchain/ApproveHLU';
import TaoPhienBauForm from '../features/TaoPhienBauForm';

// Các trạng thái triển khai phiên bầu cử
enum PhienBauCuDeploymentStatus {
  NOT_STARTED = 0,
  CHECKING_REQUIREMENTS = 1,
  CREATING_SESSION_KEY = 2,
  APPROVING_TOKENS = 3,
  PREPARING_CALLDATA = 4,
  CREATING_USEROP = 5,
  SENDING_USEROP = 6,
  WAITING_CONFIRMATION = 7,
  SUCCESS = 8,
  FAILED = 9,
}

// Định nghĩa UserOperation theo EIP-4337
interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
  userOpHash?: string;
}

interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

interface PhienBauCuData {
  id: number;
  tenPhienBauCu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string;
  trangThai: string;
  cuocBauCuId: number;
}

interface CuocBauCuData {
  id: number;
  tenCuocBauCu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string;
  trangThaiBlockchain: number;
  blockchainAddress: string;
}

interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  chainId: number;
  success?: boolean;
}

interface CuTriData {
  id: number;
  hoTen: string;
  email: string;
  diaChiVi: string;
}

interface UngVienData {
  id: number;
  hoTen: string;
  thongTin: string;
  diaChiVi: string;
}

// Giá trị gas cố định
const FIXED_CALL_GAS_LIMIT = '3000000';
const FIXED_VERIFICATION_GAS_LIMIT = '1000000';
const FIXED_PRE_VERIFICATION_GAS = '200000';

// Component hiển thị trạng thái các bước
const StepStatus: React.FC<{
  currentStatus: PhienBauCuDeploymentStatus;
  stepStatus: PhienBauCuDeploymentStatus;
  title: string;
  description: string;
  isCompleted?: boolean;
}> = ({ currentStatus, stepStatus, title, description, isCompleted }) => {
  let statusIcon;
  let statusClass;

  if (isCompleted) {
    statusIcon = <CheckCircle2 className="w-6 h-6 text-green-500" />;
    statusClass = 'text-green-500';
  } else if (currentStatus === PhienBauCuDeploymentStatus.FAILED) {
    statusIcon = <XCircle className="w-6 h-6 text-red-500" />;
    statusClass = 'text-red-500';
  } else if (currentStatus > stepStatus) {
    statusIcon = <CheckCircle2 className="w-6 h-6 text-green-500" />;
    statusClass = 'text-green-500';
  } else if (currentStatus === stepStatus) {
    statusIcon = <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
    statusClass = 'text-blue-500';
  } else {
    statusIcon = <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />;
    statusClass = 'text-gray-400 dark:text-gray-500';
  }

  return (
    <div className="flex items-start space-x-3 mb-3">
      <div className={`flex-shrink-0 mt-1 ${statusClass}`}>{statusIcon}</div>
      <div>
        <h4 className={`text-lg font-medium ${statusClass}`}>{title}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
};

const PhienBauCuBlockchainPage: React.FC = () => {
  // Get the election ID and session ID from URL params
  const { electionId, sessionId } = useParams<{ electionId: string; sessionId?: string }>();
  const navigate = useNavigate();

  // Toast notifications
  const { toast } = useToast();

  // Redux dispatch
  const dispatch = useDispatch<AppDispatch>();

  // Lấy thông tin từ Redux store
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);
  const electionImage = useSelector((state: RootState) => state.cuocBauCuImage?.imageUrl);

  // State
  const [taiKhoanId, setTaiKhoanId] = useState('');
  const [viId, setViId] = useState('');
  const [scwAddress, setScwAddress] = useState('');
  const [status, setStatus] = useState(PhienBauCuDeploymentStatus.NOT_STARTED);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [cuocBauCuData, setCuocBauCuData] = useState<CuocBauCuData | null>(null);
  const [phienBauCuData, setPhienBauCuData] = useState<PhienBauCuData | null>(null);
  const [cacPhienBauCu, setCacPhienBauCu] = useState<PhienBauCuData[]>([]);
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [txHash, setTxHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
  });
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [frontendHash, setFrontendHash] = useState('');
  const [backendHash, setBackendHash] = useState('');
  const [hashesLinked, setHashesLinked] = useState(false);

  // State cho quản lý cử tri và ứng viên
  const [danhSachCuTri, setDanhSachCuTri] = useState<CuTriData[]>([]);
  const [danhSachUngVien, setDanhSachUngVien] = useState<UngVienData[]>([]);
  const [selectedCuTri, setSelectedCuTri] = useState<string[]>([]);
  const [selectedUngVien, setSelectedUngVien] = useState<string[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isAddingVoters, setIsAddingVoters] = useState(false);
  const [isAddingCandidates, setIsAddingCandidates] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isShowTaoPhienBauForm, setIsShowTaoPhienBauForm] = useState(false);

  // Hàm hiển thị thông báo - memoized function
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    console.log(msg);
  }, []);

  // Hàm hiển thị lỗi - memoized function
  const showError = useCallback(
    (msg: string) => {
      setErrorMessage(msg);
      console.error(msg);

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: msg,
      });
    },
    [toast],
  );

  // Xử lý hiển thị trạng thái tải dữ liệu và lỗi
  const renderLoadingOverlay = () =>
    isLoading && (
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#1A2942] p-4 rounded-lg shadow-lg flex items-center space-x-3">
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-gray-700 dark:text-gray-200">Đang tải dữ liệu...</p>
        </div>
      </div>
    );

  // Lấy địa chỉ các contract - memoized function
  const fetchContractAddresses = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      if (response.data && response.data.success) {
        setContractAddresses(response.data);
        showMessage('Đã lấy thông tin địa chỉ contract');
        return response.data;
      } else {
        throw new Error('Không thể lấy địa chỉ contract');
      }
    } catch (error) {
      showError('Lỗi khi lấy địa chỉ contract: ' + (error as Error).message);
      return null;
    }
  }, [showMessage, showError]);

  // Lấy thông tin cuộc bầu cử - memoized function
  const fetchElectionDetails = useCallback(
    async (id: string) => {
      if (!id) return null;

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/CuocBauCu/details/${id}`);

        if (response.data) {
          setCuocBauCuData(response.data);
          showMessage(`Đã tải thông tin cuộc bầu cử "${response.data.tenCuocBauCu}"`);

          toast({
            title: 'Đã tải thông tin cuộc bầu cử',
            description: `"${response.data.tenCuocBauCu}"`,
          });

          return response.data;
        } else {
          throw new Error('Không tìm thấy thông tin cuộc bầu cử');
        }
      } catch (error) {
        showError('Lỗi khi lấy thông tin cuộc bầu cử: ' + (error as Error).message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage, showError, toast],
  );

  // Lấy danh sách phiên bầu cử của cuộc bầu cử
  const fetchPhienBauCuList = useCallback(
    async (cuocBauCuId: string) => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/PhienBauCu/byCuocBauCu/${cuocBauCuId}`);

        if (response.data) {
          setCacPhienBauCu(response.data);
          showMessage(`Đã tải ${response.data.length} phiên bầu cử`);
          return response.data;
        } else {
          showMessage('Chưa có phiên bầu cử nào cho cuộc bầu cử này');
          setCacPhienBauCu([]);
          return [];
        }
      } catch (error) {
        showError('Lỗi khi lấy danh sách phiên bầu cử: ' + (error as Error).message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage, showError],
  );

  // Lấy thông tin phiên bầu cử
  const fetchPhienBauCuDetails = useCallback(
    async (id: string) => {
      if (!id) return null;

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/PhienBauCu/details/${id}`);

        if (response.data) {
          setPhienBauCuData(response.data);
          showMessage(`Đã tải thông tin phiên bầu cử "${response.data.tenPhienBauCu}"`);
          return response.data;
        } else {
          throw new Error('Không tìm thấy thông tin phiên bầu cử');
        }
      } catch (error) {
        showError('Lỗi khi lấy thông tin phiên bầu cử: ' + (error as Error).message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage, showError],
  );

  // Lấy danh sách cử tri từ API
  const fetchCuTriList = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/CuTri');
      if (response.data) {
        setDanhSachCuTri(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      showError('Lỗi khi lấy danh sách cử tri: ' + (error as Error).message);
      return [];
    }
  }, [showError]);

  // Lấy danh sách ứng viên từ API
  const fetchUngVienList = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/UngVien');
      if (response.data) {
        setDanhSachUngVien(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      showError('Lỗi khi lấy danh sách ứng viên: ' + (error as Error).message);
      return [];
    }
  }, [showError]);

  // Hàm lấy danh sách cử tri từ blockchain
  const fetchCuTriListFromBlockchain = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!cuocBauCuData || !cuocBauCuData.blockchainAddress || !sessionId) {
        showError('Thiếu thông tin cần thiết để lấy danh sách cử tri từ blockchain');
        return [];
      }

      // Kiểm tra xem cuộc bầu cử đã được triển khai hay chưa
      if (cuocBauCuData.trangThaiBlockchain !== TrangThaiBlockchain.DaTrienKhai) {
        showMessage('Cuộc bầu cử chưa được triển khai lên blockchain, sử dụng dữ liệu từ API');
        const apiData = await fetchCuTriList();
        return apiData;
      }

      // Kết nối đến provider
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // Kết nối đến QuanLyCuocBauCu contract với ABI đầy đủ hơn
      const quanLyCuocBauCuAbi = [
        'function layCuTriPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (address[])',
        'function kiemTraCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) view returns (bool)',
        'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256)',
        'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool)',
      ];

      const quanLyCuocBauCuContract = new Contract(
        cuocBauCuData.blockchainAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Kiểm tra xem phiên bầu cử có hoạt động không
      const isSessionActive = await quanLyCuocBauCuContract
        .laPhienHoatDong(1, BigInt(sessionId))
        .catch(() => false);
      if (!isSessionActive) {
        showMessage('Phiên bầu cử không hoạt động trên blockchain, sử dụng dữ liệu từ API');
        const apiData = await fetchCuTriList();
        return apiData;
      }

      showMessage('Đang lấy danh sách cử tri từ blockchain...');

      // Lấy danh sách địa chỉ cử tri
      const cuTriAddresses = await quanLyCuocBauCuContract.layCuTriPhienBauCu(
        1, // ID cuộc bầu cử trong QuanLyCuocBauCu là 1
        BigInt(sessionId),
      );

      showMessage(`Đã tải ${cuTriAddresses.length} cử tri từ blockchain`);

      // Chuyển đổi địa chỉ thành dữ liệu cử tri
      // Trong trường hợp này, chúng ta chỉ có địa chỉ blockchain nên tạo dữ liệu mẫu
      const cuTriList: CuTriData[] = cuTriAddresses.map((address, index) => ({
        id: index + 1,
        hoTen: `Cử tri #${index + 1}`,
        email: `cutri${index + 1}@example.com`,
        diaChiVi: address,
      }));

      // Đồng thời gọi API backend nếu có để bổ sung thông tin
      try {
        const response = await apiClient.get('/api/CuTri');
        if (response.data && Array.isArray(response.data)) {
          // Tạo map để lưu thông tin từ API theo địa chỉ ví
          const cuTriInfoMap = new Map();
          response.data.forEach((cuTri) => {
            if (cuTri.diaChiVi) {
              cuTriInfoMap.set(cuTri.diaChiVi.toLowerCase(), cuTri);
            }
          });

          // Cập nhật thông tin từ API nếu có
          cuTriList.forEach((cuTri) => {
            const apiInfo = cuTriInfoMap.get(cuTri.diaChiVi.toLowerCase());
            if (apiInfo) {
              cuTri.hoTen = apiInfo.hoTen || cuTri.hoTen;
              cuTri.email = apiInfo.email || cuTri.email;
              cuTri.id = apiInfo.id || cuTri.id;
            }
          });
        }
      } catch (apiError) {
        // Nếu API gặp lỗi, vẫn tiếp tục với dữ liệu từ blockchain
        console.warn('Không thể lấy thông tin chi tiết cử tri từ API:', apiError);
      }

      setDanhSachCuTri(cuTriList);
      return cuTriList;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      showError(`Lỗi khi lấy danh sách cử tri từ blockchain: ${errorMessage}`);

      // Fallback: Thử lấy dữ liệu từ API
      showMessage('Đang thử lấy dữ liệu cử tri từ API...');
      try {
        const response = await apiClient.get('/api/CuTri');
        if (response.data) {
          setDanhSachCuTri(response.data);
          return response.data;
        }
      } catch (apiError) {
        console.error('Cả blockchain và API đều không thể lấy dữ liệu cử tri');
      }

      // Trả về mảng rỗng nếu cả hai đều thất bại
      setDanhSachCuTri([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [cuocBauCuData, sessionId, showMessage, showError, fetchCuTriList]);

  // Hàm lấy danh sách ứng viên từ blockchain
  const fetchUngVienListFromBlockchain = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!cuocBauCuData || !cuocBauCuData.blockchainAddress || !sessionId) {
        showError('Thiếu thông tin cần thiết để lấy danh sách ứng viên từ blockchain');
        return [];
      }

      // Kiểm tra xem cuộc bầu cử đã được triển khai hay chưa
      if (cuocBauCuData.trangThaiBlockchain !== TrangThaiBlockchain.DaTrienKhai) {
        showMessage('Cuộc bầu cử chưa được triển khai lên blockchain, sử dụng dữ liệu từ API');
        const apiData = await fetchUngVienList();
        return apiData;
      }

      // Kết nối đến provider
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // Kết nối đến QuanLyCuocBauCu contract với ABI đầy đủ hơn
      const quanLyCuocBauCuAbi = [
        'function layUngVienPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (address[])',
        'function kiemTraUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien) view returns (bool)',
        'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256)',
        'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool)',
      ];

      const quanLyCuocBauCuContract = new Contract(
        cuocBauCuData.blockchainAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Kiểm tra xem phiên bầu cử có hoạt động không
      const isSessionActive = await quanLyCuocBauCuContract
        .laPhienHoatDong(1, BigInt(sessionId))
        .catch(() => false);
      if (!isSessionActive) {
        showMessage('Phiên bầu cử không hoạt động trên blockchain, sử dụng dữ liệu từ API');
        const apiData = await fetchUngVienList();
        return apiData;
      }

      showMessage('Đang lấy danh sách ứng viên từ blockchain...');

      // Lấy danh sách địa chỉ ứng viên
      const ungVienAddresses = await quanLyCuocBauCuContract.layUngVienPhienBauCu(
        1, // ID cuộc bầu cử trong QuanLyCuocBauCu là 1
        BigInt(sessionId),
      );

      showMessage(`Đã tải ${ungVienAddresses.length} ứng viên từ blockchain`);

      // Chuyển đổi địa chỉ thành dữ liệu ứng viên
      // Trong trường hợp này, chúng ta chỉ có địa chỉ blockchain nên tạo dữ liệu mẫu
      const ungVienList: UngVienData[] = ungVienAddresses.map((address, index) => ({
        id: index + 1,
        hoTen: `Ứng viên #${index + 1}`,
        thongTin: `Thông tin ứng viên #${index + 1}`,
        diaChiVi: address,
      }));

      // Đồng thời gọi API backend nếu có để bổ sung thông tin
      try {
        const response = await apiClient.get('/api/UngVien');
        if (response.data && Array.isArray(response.data)) {
          // Tạo map để lưu thông tin từ API theo địa chỉ ví
          const ungVienInfoMap = new Map();
          response.data.forEach((ungVien) => {
            if (ungVien.diaChiVi) {
              ungVienInfoMap.set(ungVien.diaChiVi.toLowerCase(), ungVien);
            }
          });

          // Cập nhật thông tin từ API nếu có
          ungVienList.forEach((ungVien) => {
            const apiInfo = ungVienInfoMap.get(ungVien.diaChiVi.toLowerCase());
            if (apiInfo) {
              ungVien.hoTen = apiInfo.hoTen || ungVien.hoTen;
              ungVien.thongTin = apiInfo.thongTin || ungVien.thongTin;
              ungVien.id = apiInfo.id || ungVien.id;
            }
          });
        }
      } catch (apiError) {
        // Nếu API gặp lỗi, vẫn tiếp tục với dữ liệu từ blockchain
        console.warn('Không thể lấy thông tin chi tiết ứng viên từ API:', apiError);
      }

      setDanhSachUngVien(ungVienList);
      return ungVienList;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      showError(`Lỗi khi lấy danh sách ứng viên từ blockchain: ${errorMessage}`);

      // Fallback: Thử lấy dữ liệu từ API
      showMessage('Đang thử lấy dữ liệu ứng viên từ API...');
      try {
        const response = await apiClient.get('/api/UngVien');
        if (response.data) {
          setDanhSachUngVien(response.data);
          return response.data;
        }
      } catch (apiError) {
        console.error('Cả blockchain và API đều không thể lấy dữ liệu ứng viên');
      }

      // Trả về mảng rỗng nếu cả hai đều thất bại
      setDanhSachUngVien([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [cuocBauCuData, sessionId, showMessage, showError, fetchUngVienList]);

  // Auto-fetch election details when electionId is available
  useEffect(() => {
    if (electionId && !isDataFetched) {
      // Lấy dữ liệu cuộc bầu cử từ API
      fetchElectionDetails(electionId);
      fetchContractAddresses();
      fetchPhienBauCuList(electionId);

      // Lấy dữ liệu cử tri và ứng viên trực tiếp từ blockchain
      fetchCuTriListFromBlockchain();
      fetchUngVienListFromBlockchain();

      dispatch(fetchImageUrl(Number(electionId)));
      setIsDataFetched(true);
    }
  }, [
    electionId,
    isDataFetched,
    fetchElectionDetails,
    fetchContractAddresses,
    fetchPhienBauCuList,
    fetchCuTriListFromBlockchain,
    fetchUngVienListFromBlockchain,
    dispatch,
  ]);

  // Fetch session details if sessionId is provided
  useEffect(() => {
    if (sessionId) {
      fetchPhienBauCuDetails(sessionId);

      // Khi có sessionId, lấy lại danh sách cử tri và ứng viên từ blockchain
      fetchCuTriListFromBlockchain();
      fetchUngVienListFromBlockchain();
    }
  }, [
    sessionId,
    fetchPhienBauCuDetails,
    fetchCuTriListFromBlockchain,
    fetchUngVienListFromBlockchain,
  ]);

  // Cập nhật tài khoản từ userInfo khi component được tải
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());

      if (userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }
    }
  }, [userInfo, dispatch]);

  // Set viId and scwAddress from walletInfo when available
  useEffect(() => {
    if (walletInfo) {
      setViId(walletInfo.viId.toString());
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Thêm kiểm tra kết nối blockchain
  useEffect(() => {
    // Kiểm tra kết nối blockchain
    const checkBlockchainConnection = async () => {
      try {
        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
        const blockNumber = await provider.getBlockNumber();
        showMessage(`Đã kết nối đến blockchain, block hiện tại: ${blockNumber}`);
      } catch (error) {
        showError('Không thể kết nối đến blockchain. Vui lòng kiểm tra kết nối mạng.');
      }
    };

    checkBlockchainConnection();
  }, [showMessage, showError]);

  // Thêm kiểm tra token xác thực
  useEffect(() => {
    // Kiểm tra xem có token xác thực không
    const checkAuthToken = async () => {
      try {
        const response = await apiClient.get('/api/auth/check');
        if (!response.data?.authenticated) {
          showError('Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
        }
      } catch (error) {
        console.warn('Không thể kiểm tra token xác thực:', error);
      }
    };

    checkAuthToken();
  }, [showError]);

  // Hàm liên kết frontend hash và backend hash
  const linkHashes = useCallback(
    async (frontendHash: string, backendHash: string, sender: string) => {
      if (!frontendHash || !backendHash) {
        showError('Cần có cả frontend hash và backend hash để liên kết');
        return false;
      }

      try {
        showMessage(`Đang liên kết hash: Frontend ${frontendHash}, Backend ${backendHash}`);

        const response = await apiClient.post('/api/bundler/link-hashes', {
          frontendHash,
          backendHash,
          sender,
        });

        if (response.data && response.data.success) {
          showMessage('Đã liên kết hash thành công');
          setHashesLinked(true);

          toast({
            title: 'Liên kết hash thành công',
            description: 'Đã liên kết frontend hash và backend hash',
          });

          return true;
        } else {
          throw new Error(response.data?.message || 'Không thể liên kết hash');
        }
      } catch (error) {
        showError('Lỗi khi liên kết hash: ' + (error as Error).message);
        return false;
      }
    },
    [showMessage, showError, toast],
  );

  // Kiểm tra trạng thái của UserOperation với cả hai hash
  const checkUserOpStatus = useCallback(
    async (userOpHash: string, relatedHash?: string) => {
      if (!userOpHash) {
        showError('Hash không hợp lệ khi kiểm tra trạng thái');
        return false;
      }

      try {
        // Kiểm tra với hash chính
        const response = await apiClient.get(`/api/bundler/check-status?userOpHash=${userOpHash}`);

        if (response.data && response.data.status === 'success') {
          setStatus(PhienBauCuDeploymentStatus.SUCCESS);
          setProgress(100);

          showMessage(`Thao tác blockchain đã thành công!`);

          if (response.data.txHash) {
            setTxHash(response.data.txHash);
            showMessage(`Thao tác blockchain đã thành công! TxHash: ${response.data.txHash}`);
          }

          toast({
            title: 'Thành công',
            description: 'Thao tác blockchain đã thành công!',
          });

          return true;
        } else if (response.data && response.data.status === 'failed') {
          // Nếu hash chính thất bại và có hash liên quan, thử kiểm tra hash liên quan
          if (relatedHash && relatedHash !== userOpHash) {
            showMessage(`Kiểm tra với hash liên quan: ${relatedHash}`);
            return await checkUserOpStatus(relatedHash);
          }

          setStatus(PhienBauCuDeploymentStatus.FAILED);
          showError(`Thao tác thất bại: ${response.data.message || 'Lỗi không xác định'}`);
          return false;
        } else if (response.data && response.data.status === 'pending') {
          const txHashDisplay = response.data.txHash || userOpHash;
          setTxHash(txHashDisplay);
          showMessage(`Giao dịch đang chờ xử lý: ${txHashDisplay}`);

          // Hiển thị thông báo toast cho người dùng
          toast({
            title: 'Giao dịch đang chờ xử lý',
            description: `Hash giao dịch: ${txHashDisplay.substring(0, 10)}...${txHashDisplay.substring(txHashDisplay.length - 8)}`,
          });

          // Nếu có hash liên quan và chưa được liên kết, thực hiện liên kết
          if (relatedHash && relatedHash !== userOpHash && !hashesLinked) {
            await linkHashes(frontendHash || userOpHash, backendHash || relatedHash, scwAddress);
          }

          return false;
        } else if (response.data && response.data.status === 'unknown') {
          // Nếu hash chính không tìm thấy và có hash liên quan, thử kiểm tra hash liên quan
          if (relatedHash && relatedHash !== userOpHash) {
            showMessage(`Hash chính không tìm thấy, kiểm tra với hash liên quan: ${relatedHash}`);
            return await checkUserOpStatus(relatedHash);
          }

          showMessage(`Trạng thái giao dịch: không tìm thấy`);
          return false;
        } else {
          showMessage(`Trạng thái giao dịch: ${response.data?.status || 'không xác định'}`);
          return false;
        }
      } catch (error) {
        console.warn('Lỗi khi kiểm tra trạng thái:', error);
        showMessage(`Lỗi khi kiểm tra trạng thái: ${(error as Error).message}`);
        return false;
      }
    },
    [
      showMessage,
      showError,
      toast,
      linkHashes,
      frontendHash,
      backendHash,
      scwAddress,
      hashesLinked,
    ],
  );

  // Hàm để tạo khóa phiên an toàn
  const safeGetSessionKey = useCallback(async () => {
    if (!taiKhoanId || !viId) {
      showError('Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản');
      return null;
    }

    try {
      // Kiểm tra nếu đã có session key và còn hạn thì không tạo mới
      if (sessionKey && sessionKey.expiresAt * 1000 > Date.now()) {
        showMessage('Đã có khóa phiên và còn hạn sử dụng');
        return sessionKey;
      }

      setIsLoading(true);
      setStatus(PhienBauCuDeploymentStatus.CREATING_SESSION_KEY);
      setProgress(20);

      // Ưu tiên tạo khóa phiên mới
      try {
        const createResponse = await apiClient.post('/api/Blockchain/create-session', {
          TaiKhoanID: Number.parseInt(taiKhoanId, 10),
          ViID: Number.parseInt(viId, 10),
        });

        if (createResponse.data && createResponse.data.success) {
          showMessage('Đã tạo session key mới');
        } else {
          showMessage('Không thể tạo session key mới, đang thử lấy session key hiện có...');
        }
      } catch (createError) {
        console.warn('Không thể tạo session key mới, thử lấy session key hiện có:', createError);
      }

      // Gọi API để lấy session key (dù đã tạo mới hay chưa)
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(taiKhoanId, 10),
        ViID: Number.parseInt(viId, 10),
      });

      if (response.data && response.data.success && response.data.sessionKey) {
        // Lưu session key và thông tin liên quan
        const sessionKeyInfo = {
          sessionKey: response.data.sessionKey,
          expiresAt: response.data.expiresAt,
          scwAddress: response.data.scwAddress || scwAddress,
        };

        setSessionKey(sessionKeyInfo);
        setScwAddress(sessionKeyInfo.scwAddress);

        showMessage(
          `Đã lấy session key thành công, hết hạn: ${new Date(sessionKeyInfo.expiresAt * 1000).toLocaleString()}`,
        );

        toast({
          title: 'Đã lấy khóa phiên',
          description: 'Khóa phiên đã được tạo thành công',
        });

        return sessionKeyInfo;
      } else {
        throw new Error(response.data?.message || 'Không thể lấy session key');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      showError(`Lỗi khi lấy khóa phiên: ${errorMsg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [taiKhoanId, viId, scwAddress, sessionKey, showMessage, showError, toast]);

  // Xử lý khi balances được cập nhật từ component ApproveHLU
  const handleBalancesUpdated = useCallback(
    (newBalances: {
      hluBalance: string;
      allowanceForFactory: string;
      allowanceForPaymaster: string;
    }) => {
      setBalances(newBalances);

      // Kiểm tra nếu đã có đủ allowance
      const hasEnoughBalance = Number.parseFloat(newBalances.hluBalance) >= 5.0;
      const hasFactoryAllowance = Number.parseFloat(newBalances.allowanceForFactory) >= 4.0;
      const hasPaymasterAllowance = Number.parseFloat(newBalances.allowanceForPaymaster) >= 1.0;

      if (hasEnoughBalance && hasFactoryAllowance && hasPaymasterAllowance) {
        // Nếu đã có đủ allowance, chuyển sang bước tiếp theo
        setStatus(PhienBauCuDeploymentStatus.PREPARING_CALLDATA);
        setProgress(40);
        showMessage('Đã có đủ quyền truy cập token, có thể tiếp tục');
      } else if (hasEnoughBalance) {
        // Nếu có đủ số dư nhưng chưa đủ allowance
        setStatus(PhienBauCuDeploymentStatus.APPROVING_TOKENS);
        setProgress(30);
      }
    },
    [showMessage],
  );

  // Xử lý khi approve token thành công
  const handleApproveSuccess = useCallback(() => {
    setStatus(PhienBauCuDeploymentStatus.PREPARING_CALLDATA);
    setProgress(40);
    showMessage('Đã phê duyệt token thành công, tiếp tục triển khai');
  }, [showMessage]);

  // Xử lý sự kiện setApproveLoading từ component ApproveHLU
  const handleApproveLoading = useCallback((loading: boolean) => {
    // Chỉ cập nhật nếu giá trị thay đổi để tránh re-render liên tục
    setIsLoading((prevLoading) => {
      if (prevLoading !== loading) {
        return loading;
      }
      return prevLoading;
    });
  }, []);

  // Cập nhật hàm createAndSubmitUserOperation để thêm xử lý lỗi chi tiết hơn và cải thiện cách tạo paymasterAndData
  const createAndSubmitUserOperation = useCallback(
    async (operation: string, params: any) => {
      if (!sessionKey || !contractAddresses) {
        throw new Error('Thiếu thông tin cần thiết để tạo UserOperation');
      }

      try {
        setStatus(PhienBauCuDeploymentStatus.CREATING_USEROP);
        setProgress(50);

        // Lấy nonce từ blockchain
        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

        // ABI tối thiểu cho hàm getNonce
        const entryPointAbi = [
          'function getNonce(address sender) external view returns (uint256)',
          'function nonceNguoiGui(address) view returns (uint256)',
          'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
          'function xuLyCacThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] ops, address payable beneficiary) payable returns ()',
        ];
        const entryPointContract = new Contract(
          contractAddresses.entryPointAddress,
          entryPointAbi,
          provider,
        );

        // Lấy nonce - thử cả hai phương thức
        let nonce;
        try {
          nonce = await entryPointContract.getNonce(scwAddress);
          showMessage(`Đã lấy nonce: ${nonce.toString()}`);
        } catch (nonceError) {
          // Nếu fails với getNonce, thử nonceNguoiGui
          try {
            nonce = await entryPointContract.nonceNguoiGui(scwAddress);
            showMessage(`Đã lấy nonce (phương thức thay thế): ${nonce.toString()}`);
          } catch (nonceError2) {
            throw new Error('Không thể lấy nonce: ' + (nonceError2 as Error).message);
          }
        }

        // Chuẩn bị callData dựa vào thao tác
        let callData;
        switch (operation) {
          case 'taoPhienBauCu':
            callData = await prepareCreateSessionCallData(
              params.cuocBauCuId,
              params.thoiGianKeoDai,
              params.soCuTriToiDa,
            );
            break;
          case 'themCuTri':
            callData = await prepareAddVoterCallData(
              params.cuocBauCuId,
              params.phienBauCuId,
              params.cuTriAddress,
            );
            break;
          case 'themUngVien':
            callData = await prepareAddCandidateCallData(
              params.cuocBauCuId,
              params.phienBauCuId,
              params.ungVienAddress,
            );
            break;
          case 'batDauPhienBauCu':
            callData = await prepareStartSessionCallData(
              params.cuocBauCuId,
              params.phienBauCuId,
              params.thoiGianKeoDai,
            );
            break;
          default:
            throw new Error('Thao tác không được hỗ trợ: ' + operation);
        }

        if (!callData) {
          throw new Error('Không thể tạo callData cho thao tác: ' + operation);
        }

        showMessage(`Đã tạo callData thành công cho thao tác: ${operation}`);

        // Lấy thời gian hiện tại
        const currentBlock = await provider.getBlock('latest');
        if (!currentBlock) {
          throw new Error('Không thể lấy block hiện tại');
        }
        const currentTimestamp = currentBlock.timestamp;

        // Sử dụng địa chỉ paymaster trực tiếp làm paymasterAndData
        const paymasterAndData = contractAddresses.paymasterAddress;

        showMessage('Đã tạo paymasterAndData');

        // Chuẩn bị UserOperation với gas limit cao hơn
        const userOp: UserOperation = {
          sender: scwAddress,
          nonce: nonce.toString(),
          initCode: '0x',
          callData: callData,
          callGasLimit: '3000000', // Tăng từ 500000 lên 3000000
          verificationGasLimit: '1000000', // Tăng từ 500000 lên 1000000
          preVerificationGas: '200000', // Tăng từ 100000 lên 200000
          maxFeePerGas: parseUnits('10', 'gwei').toString(), // Tăng từ 5 lên 10 gwei
          maxPriorityFeePerGas: parseUnits('5', 'gwei').toString(), // Tăng từ 2 lên 5 gwei
          paymasterAndData: paymasterAndData,
          signature: '0x',
        };

        // Ký UserOperation
        const userOpHash = await entryPointContract.layHashThaoTac(userOp);
        const signingKey = new SigningKey(sessionKey.sessionKey);
        const signature = signingKey.sign(getBytes(userOpHash));

        userOp.signature = signature.serialized;
        userOp.userOpHash = userOpHash;

        showMessage('Đã tạo và ký UserOperation thành công');

        toast({
          title: 'Đã tạo UserOperation',
          description: 'UserOperation đã được tạo và ký thành công',
        });

        // Log chi tiết UserOperation để debug
        console.log('UserOperation được gửi:', {
          sender: userOp.sender,
          nonce: userOp.nonce,
          callData: userOp.callData.substring(0, 50) + '...',
          callGasLimit: userOp.callGasLimit,
          verificationGasLimit: userOp.verificationGasLimit,
          preVerificationGas: userOp.preVerificationGas,
          maxFeePerGas: userOp.maxFeePerGas,
          maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
          paymasterAndData:
            typeof userOp.paymasterAndData === 'string' ? userOp.paymasterAndData : 'complex data',
          signature: userOp.signature.substring(0, 30) + '...',
        });

        try {
          setStatus(PhienBauCuDeploymentStatus.SENDING_USEROP);
          setProgress(70);

          // Thử gửi trực tiếp đến EntryPoint nếu có thể
          try {
            showMessage('Đang thử gửi UserOperation trực tiếp đến EntryPoint...');

            // Tạo signer từ provider
            const signer = await provider.getSigner();

            // Kết nối đến EntryPoint với signer
            const entryPointWithSigner = entryPointContract.connect(signer);

            // Gửi UserOperation trực tiếp đến EntryPoint
            const tx = await entryPointWithSigner.xuLyCacThaoTac([userOp], signer.getAddress(), {
              gasLimit: 8000000,
            });

            showMessage(`Đã gửi UserOperation trực tiếp đến EntryPoint. Hash: ${tx.hash}`);
            setTxHash(tx.hash);

            // Đợi giao dịch được xác nhận
            const receipt = await tx.wait();

            if (receipt.status === 1) {
              showMessage('Giao dịch đã được xác nhận thành công!');
              setStatus(PhienBauCuDeploymentStatus.SUCCESS);
              setProgress(100);

              toast({
                title: 'Thành công',
                description: 'Thao tác blockchain đã thành công!',
              });

              // Làm mới dữ liệu
              if (electionId) {
                fetchPhienBauCuList(electionId);
              }

              return tx.hash;
            } else {
              throw new Error('Giao dịch thất bại');
            }
          } catch (directError) {
            showMessage(
              `Không thể gửi trực tiếp đến EntryPoint: ${(directError as Error).message}. Đang thử qua bundler...`,
            );
          }

          // Gửi UserOperation đến bundler
          const response = await apiClient.post('/api/bundler/submit', {
            sender: userOp.sender,
            nonce: userOp.nonce,
            initCode: userOp.initCode,
            callData: userOp.callData,
            callGasLimit: userOp.callGasLimit,
            verificationGasLimit: userOp.verificationGasLimit,
            preVerificationGas: userOp.preVerificationGas,
            maxFeePerGas: userOp.maxFeePerGas,
            maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
            paymasterAndData: userOp.paymasterAndData,
            signature: userOp.signature,
            userOpHash: userOpHash,
          });

          if (!response.data) {
            throw new Error('Không nhận được phản hồi từ bundler');
          }

          // Lưu cả frontend hash và backend hash
          const frontendUserOpHash = response.data.userOpHash || userOpHash;
          const backendUserOpHash = response.data.backendHash || frontendUserOpHash;

          setFrontendHash(frontendUserOpHash);
          setBackendHash(backendUserOpHash);

          // Nếu có cả hai hash và chúng khác nhau, liên kết chúng
          if (frontendUserOpHash && backendUserOpHash && frontendUserOpHash !== backendUserOpHash) {
            showMessage(`Phát hiện hai hash khác nhau, đang liên kết...`);
            await linkHashes(frontendUserOpHash, backendUserOpHash, userOp.sender);
          }

          const txHash = response.data.txHash || frontendUserOpHash;
          setTxHash(txHash);

          showMessage(`Đã gửi UserOperation thành công. Hash: ${txHash}`);

          toast({
            title: 'Đã gửi UserOperation',
            description: 'Giao dịch đã được gửi đến blockchain',
          });

          setStatus(PhienBauCuDeploymentStatus.WAITING_CONFIRMATION);
          setProgress(80);

          // Thiết lập theo dõi giao dịch
          const maxAttempts = 15;
          let attempts = 0;

          const checkInterval = setInterval(async () => {
            attempts++;
            // Kiểm tra với cả hai hash
            const statusCheck = await checkUserOpStatus(frontendUserOpHash, backendUserOpHash);

            if (statusCheck || attempts >= maxAttempts) {
              clearInterval(checkInterval);
              if (!statusCheck && attempts >= maxAttempts) {
                showMessage('Đã đạt tối đa số lần kiểm tra. Giao dịch có thể vẫn đang chờ xử lý.');
              } else {
                // Làm mới dữ liệu sau khi thực hiện thành công
                if (electionId) {
                  fetchPhienBauCuList(electionId);
                }
              }
            }
          }, 5000);

          return txHash;
        } catch (error) {
          const errorMessage = (error as Error).message;

          if (errorMessage.includes('paymaster')) {
            showError('Lỗi liên quan đến paymaster: ' + errorMessage);
          } else if (errorMessage.includes('signature')) {
            showError('Lỗi chữ ký: ' + errorMessage);
          } else if (errorMessage.includes('gas')) {
            showError('Lỗi gas: ' + errorMessage);
          } else {
            showError('Lỗi khi tạo và gửi UserOperation: ' + errorMessage);
          }

          setStatus(PhienBauCuDeploymentStatus.FAILED);
          throw error;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        showError('Lỗi khi tạo và gửi UserOperation: ' + errorMessage);
        setStatus(PhienBauCuDeploymentStatus.FAILED);
        throw error;
      }
    },
    [
      sessionKey,
      contractAddresses,
      checkUserOpStatus,
      showMessage,
      showError,
      toast,
      linkHashes,
      fetchPhienBauCuList,
      electionId,
    ],
  );

  // Cập nhật hàm prepareCreateSessionCallData để cải thiện cách tạo callData
  const prepareCreateSessionCallData = async (
    cuocBauCuId: string | number,
    thoiGianKeoDai: string | number,
    soCuTriToiDa: string | number,
  ) => {
    try {
      if (!cuocBauCuData || !contractAddresses || !scwAddress) {
        throw new Error('Thiếu thông tin cần thiết để tạo phiên bầu cử');
      }

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      const quanLyCuocBauCuAddress = cuocBauCuData.blockchainAddress;

      // ABI đầy đủ hơn cho contract QuanLyCuocBauCu
      const quanLyCuocBauCuAbi = [
        'function taoPhienBauCu(uint256 idCuocBauCu, uint256 thoiGianKeoDai, uint256 soCuTriToiDa) external returns (uint256)',
        'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256)',
        'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 batDau, uint256 ketThuc) view returns (uint256[])',
      ];

      const quanLyCuocBauCuContract = new Contract(
        quanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Kiểm tra xem SCW có phải là chủ sở hữu của cuộc bầu cử không
      try {
        const baseInfo = await quanLyCuocBauCuContract.layThongTinCoBan(1);
        const owner = baseInfo[0];

        if (owner.toLowerCase() !== scwAddress.toLowerCase()) {
          console.warn(`SCW (${scwAddress}) không phải là chủ sở hữu của cuộc bầu cử (${owner})`);
        } else {
          console.log('SCW là chủ sở hữu của cuộc bầu cử');
        }
      } catch (error) {
        console.warn('Không thể kiểm tra chủ sở hữu cuộc bầu cử:', error);
      }

      // Chuẩn bị callData để gọi hàm taoPhienBauCu
      const taoPhienBauCuCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
        'taoPhienBauCu',
        [
          BigInt(cuocBauCuId), // ID cuộc bầu cử
          BigInt(thoiGianKeoDai),
          BigInt(soCuTriToiDa),
        ],
      );

      console.log('Đã tạo callData cho taoPhienBauCu:', taoPhienBauCuCallData);

      // ABI cho contract SCW
      const scwAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
        'function owner() view returns (address)',
        'function sessionKeys(address) view returns (uint256)',
      ];

      const scwContract = new Contract(scwAddress, scwAbi, provider);

      // Kiểm tra owner của SCW
      try {
        const scwOwner = await scwContract.owner();
        console.log('SCW Owner:', scwOwner);
      } catch (error) {
        console.warn('Không thể kiểm tra owner của SCW:', error);
      }

      // Kiểm tra session key
      if (sessionKey) {
        try {
          const expiration = await scwContract.sessionKeys(sessionKey.sessionKey);
          console.log('Session key expiration:', expiration.toString());
        } catch (error) {
          console.warn('Không thể kiểm tra session key:', error);
        }
      }

      // Tạo callData để gọi hàm execute của SCW
      const executeCallData = scwContract.interface.encodeFunctionData('execute', [
        quanLyCuocBauCuAddress,
        0,
        taoPhienBauCuCallData,
      ]);

      console.log('Đã tạo callData cho execute:', executeCallData);

      return executeCallData;
    } catch (error) {
      console.error('Lỗi khi chuẩn bị callData tạo phiên bầu cử:', error);
      throw error;
    }
  };

  // Chuẩn bị callData để thêm cử tri
  const prepareAddVoterCallData = async (
    cuocBauCuId: string | number,
    phienBauCuId: string | number,
    cuTriAddress: string,
  ) => {
    try {
      if (!cuocBauCuData || !contractAddresses || !scwAddress) {
        throw new Error('Thiếu thông tin cần thiết để thêm cử tri');
      }

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      const quanLyCuocBauCuAddress = cuocBauCuData.blockchainAddress;

      // ABI cho contract QuanLyCuocBauCu
      const quanLyCuocBauCuAbi = [
        'function themCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) external',
      ];

      const quanLyCuocBauCuContract = new Contract(
        quanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Chuẩn bị callData để gọi hàm themCuTri
      const themCuTriCallData = quanLyCuocBauCuContract.interface.encodeFunctionData('themCuTri', [
        BigInt(cuocBauCuId), // ID cuộc bầu cử
        BigInt(phienBauCuId),
        cuTriAddress,
      ]);

      // ABI cho contract SCW
      const scwAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const scwContract = new Contract(scwAddress, scwAbi, provider);

      // Tạo callData để gọi hàm execute của SCW
      const executeCallData = scwContract.interface.encodeFunctionData('execute', [
        quanLyCuocBauCuAddress,
        0,
        themCuTriCallData,
      ]);

      return executeCallData;
    } catch (error) {
      console.error('Lỗi khi chuẩn bị callData thêm cử tri:', error);
      throw error;
    }
  };

  // Chuẩn bị callData để thêm ứng viên
  const prepareAddCandidateCallData = async (
    cuocBauCuId: string | number,
    phienBauCuId: string | number,
    ungVienAddress: string,
  ) => {
    try {
      if (!cuocBauCuData || !contractAddresses || !scwAddress) {
        throw new Error('Thiếu thông tin cần thiết để thêm ứng viên');
      }

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      const quanLyCuocBauCuAddress = cuocBauCuData.blockchainAddress;

      // ABI cho contract QuanLyCuocBauCu
      const quanLyCuocBauCuAbi = [
        'function themUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien) external',
      ];

      const quanLyCuocBauCuContract = new Contract(
        quanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Chuẩn bị callData để gọi hàm themUngVien
      const themUngVienCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
        'themUngVien',
        [
          BigInt(cuocBauCuId), // ID cuộc bầu cử
          BigInt(phienBauCuId),
          ungVienAddress,
        ],
      );

      // ABI cho contract SCW
      const scwAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const scwContract = new Contract(scwAddress, scwAbi, provider);

      // Tạo callData để gọi hàm execute của SCW
      const executeCallData = scwContract.interface.encodeFunctionData('execute', [
        quanLyCuocBauCuAddress,
        0,
        themUngVienCallData,
      ]);

      return executeCallData;
    } catch (error) {
      console.error('Lỗi khi chuẩn bị callData thêm ứng viên:', error);
      throw error;
    }
  };

  // Chuẩn bị callData để bắt đầu phiên bầu cử
  const prepareStartSessionCallData = async (
    cuocBauCuId: string | number,
    phienBauCuId: string | number,
    thoiGianKeoDai: string | number,
  ) => {
    try {
      if (!cuocBauCuData || !contractAddresses || !scwAddress) {
        throw new Error('Thiếu thông tin cần thiết để bắt đầu phiên bầu cử');
      }

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      const quanLyCuocBauCuAddress = cuocBauCuData.blockchainAddress;

      // ABI cho contract QuanLyCuocBauCu
      const quanLyCuocBauCuAbi = [
        'function batDauPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu, uint256 thoiGianKeoDai) external',
      ];

      const quanLyCuocBauCuContract = new Contract(
        quanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Chuẩn bị callData để gọi hàm batDauPhienBauCu
      const batDauPhienBauCuCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
        'batDauPhienBauCu',
        [
          BigInt(cuocBauCuId), // ID cuộc bầu cử
          BigInt(phienBauCuId),
          BigInt(thoiGianKeoDai),
        ],
      );

      // ABI cho contract SCW
      const scwAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const scwContract = new Contract(scwAddress, scwAbi, provider);

      // Tạo callData để gọi hàm execute của SCW
      const executeCallData = scwContract.interface.encodeFunctionData('execute', [
        quanLyCuocBauCuAddress,
        0,
        batDauPhienBauCuCallData,
      ]);

      return executeCallData;
    } catch (error) {
      console.error('Lỗi khi chuẩn bị callData bắt đầu phiên bầu cử:', error);
      throw error;
    }
  };

  // Hàm xử lý tạo phiên bầu cử mới
  const handleCreateSession = useCallback(
    async (sessionData: any) => {
      try {
        setIsCreatingSession(true);
        showMessage('Bắt đầu quá trình tạo phiên bầu cử...');

        // Ensure trangThai is set if it's undefined
        const completeSessionData: PhienBauCuData = {
          ...sessionData,
          trangThai: sessionData.trangThai || 'Sắp diễn ra',
        };

        // Gọi API để tạo phiên bầu cử trên backend
        const response = await apiClient.post('/api/PhienBauCu', completeSessionData);

        if (response.data && response.data.id) {
          const phienBauCuId = response.data.id;
          showMessage(
            `Đã tạo phiên bầu cử "${sessionData.tenPhienBauCu}" trên backend với ID: ${phienBauCuId}`,
          );

          toast({
            title: 'Đã tạo phiên bầu cử trên backend',
            description: `Phiên bầu cử "${sessionData.tenPhienBauCu}" đã được tạo, đang triển khai lên blockchain...`,
          });

          // Tính thời gian kéo dài theo giây
          const startDate = new Date(parseVietnameseDateString(sessionData.ngayBatDau));
          const endDate = new Date(parseVietnameseDateString(sessionData.ngayKetThuc));
          const thoiGianKeoDai = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

          // Tạo phiên bầu cử trên blockchain
          if (electionId) {
            showMessage('Đang chuẩn bị triển khai phiên bầu cử lên blockchain...');

            // Lấy session key
            const sessionKeyInfo = await safeGetSessionKey();
            if (!sessionKeyInfo) {
              throw new Error('Không thể lấy khóa phiên để triển khai phiên bầu cử');
            }

            showMessage('Đã lấy khóa phiên, đang chuẩn bị gửi giao dịch...');

            // Tạo và gửi UserOperation - QUAN TRỌNG: Luôn sử dụng ID cuộc bầu cử là 1 trên blockchain
            const txHash = await createAndSubmitUserOperation('taoPhienBauCu', {
              cuocBauCuId: 1, // LUÔN SỬ DỤNG ID 1 cho blockchain, không phải electionId từ URL
              thoiGianKeoDai: thoiGianKeoDai,
              soCuTriToiDa: 20, // Giá trị mặc định
            });

            showMessage(`Đã gửi giao dịch tạo phiên bầu cử lên blockchain. Hash: ${txHash}`);

            // Làm mới danh sách phiên bầu cử
            setTimeout(async () => {
              await fetchPhienBauCuList(electionId);
            }, 5000);
          }

          setIsShowTaoPhienBauForm(false);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
        showError(`Lỗi khi tạo phiên bầu cử: ${errorMsg}`);
      } finally {
        setIsCreatingSession(false);
      }
    },
    [
      electionId,
      safeGetSessionKey,
      createAndSubmitUserOperation,
      fetchPhienBauCuList,
      toast,
      showMessage,
      showError,
    ],
  );

  // Xử lý người dùng phần thêm cử tri
  const handleAddVoters = useCallback(
    async (sessionId: string | number) => {
      try {
        if (!sessionId) {
          showError('Không có thông tin phiên bầu cử');
          return;
        }

        // Kiểm tra danh sách cử tri trống
        if (danhSachCuTri.length === 0) {
          showError('Không có cử tri nào trong danh sách. Vui lòng thêm cử tri trước.');
          return;
        }

        if (selectedCuTri.length === 0) {
          showError('Vui lòng chọn ít nhất một cử tri để thêm');
          return;
        }

        setIsAddingVoters(true);

        // Lấy session key với hàm đã cải thiện
        const sessionKeyInfo = await safeGetSessionKey();
        if (!sessionKeyInfo) {
          showError('Không thể lấy khóa phiên để thực hiện thao tác');
          return;
        }

        // Thêm từng cử tri một
        for (const cuTriAddress of selectedCuTri) {
          if (!cuTriAddress) continue;

          await createAndSubmitUserOperation('themCuTri', {
            cuocBauCuId: 1, // LUÔN SỬ DỤNG ID 1 cho blockchain, không phải electionId từ URL
            phienBauCuId: sessionId,
            cuTriAddress: cuTriAddress,
          });

          await new Promise((resolve) => setTimeout(resolve, 1000)); // Đợi 1 giây giữa các lần gọi
        }

        toast({
          title: 'Đã thêm cử tri',
          description: `Đã thêm ${selectedCuTri.length} cử tri vào phiên bầu cử`,
        });

        // Reset danh sách đã chọn
        setSelectedCuTri([]);

        // Cập nhật lại danh sách cử tri từ blockchain
        setTimeout(() => {
          fetchCuTriListFromBlockchain();
        }, 2000);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
        showError(`Lỗi khi thêm cử tri: ${errorMsg}`);
      } finally {
        setIsAddingVoters(false);
      }
    },
    [
      selectedCuTri,
      electionId,
      safeGetSessionKey,
      createAndSubmitUserOperation,
      toast,
      showError,
      danhSachCuTri.length,
      fetchCuTriListFromBlockchain,
    ],
  );

  // Xử lý phần thêm ứng viên
  const handleAddCandidates = useCallback(
    async (sessionId: string | number) => {
      try {
        if (!sessionId) {
          showError('Không có thông tin phiên bầu cử');
          return;
        }

        // Kiểm tra danh sách ứng viên trống
        if (danhSachUngVien.length === 0) {
          showError('Không có ứng viên nào trong danh sách. Vui lòng thêm ứng viên trước.');
          return;
        }

        if (selectedUngVien.length === 0) {
          showError('Vui lòng chọn ít nhất một ứng viên để thêm');
          return;
        }

        setIsAddingCandidates(true);

        // Lấy session key với hàm đã cải thiện
        const sessionKeyInfo = await safeGetSessionKey();
        if (!sessionKeyInfo) {
          showError('Không thể lấy khóa phiên để thực hiện thao tác');
          return;
        }

        // Thêm từng ứng viên một
        for (const ungVienAddress of selectedUngVien) {
          if (!ungVienAddress) continue;

          await createAndSubmitUserOperation('themUngVien', {
            cuocBauCuId: 1, // LUÔN SỬ DỤNG ID 1 cho blockchain, không phải electionId từ URL
            phienBauCuId: sessionId,
            ungVienAddress: ungVienAddress,
          });

          await new Promise((resolve) => setTimeout(resolve, 1000)); // Đợi 1 giây giữa các lần gọi
        }

        toast({
          title: 'Đã thêm ứng viên',
          description: `Đã thêm ${selectedUngVien.length} ứng viên vào phiên bầu cử`,
        });

        // Reset danh sách đã chọn
        setSelectedUngVien([]);

        // Cập nhật lại danh sách ứng viên từ blockchain
        setTimeout(() => {
          fetchUngVienListFromBlockchain();
        }, 2000);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
        showError(`Lỗi khi thêm ứng viên: ${errorMsg}`);
      } finally {
        setIsAddingCandidates(false);
      }
    },
    [
      selectedUngVien,
      electionId,
      safeGetSessionKey,
      createAndSubmitUserOperation,
      toast,
      showError,
      danhSachUngVien.length,
      fetchUngVienListFromBlockchain,
    ],
  );

  // Hàm xử lý bắt đầu phiên bầu cử
  const handleStartSession = useCallback(
    async (sessionId: string | number) => {
      try {
        if (!sessionId) return;

        setIsStartingSession(true);

        // Lấy thông tin phiên bầu cử
        const phienBauCu = await fetchPhienBauCuDetails(sessionId.toString());

        if (!phienBauCu) throw new Error('Không tìm thấy thông tin phiên bầu cử');

        // Tính thời gian kéo dài theo giây
        const startDate = new Date(parseVietnameseDateString(phienBauCu.ngayBatDau));
        const endDate = new Date(parseVietnameseDateString(phienBauCu.ngayKetThuc));
        const thoiGianKeoDai = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

        // Lấy session key
        await safeGetSessionKey();

        // Tạo và gửi UserOperation
        await createAndSubmitUserOperation('batDauPhienBauCu', {
          cuocBauCuId: 1, // LUÔN SỬ DỤNG ID 1 cho blockchain, không phải electionId từ URL
          phienBauCuId: sessionId,
          thoiGianKeoDai: thoiGianKeoDai,
        });

        toast({
          title: 'Đã bắt đầu phiên bầu cử',
          description: `Phiên bầu cử "${phienBauCu.tenPhienBauCu}" đã được bắt đầu`,
        });

        // Làm mới danh sách phiên bầu cử
        await fetchPhienBauCuList(electionId as string);
      } catch (error) {
        showError('Lỗi khi bắt đầu phiên bầu cử: ' + (error as Error).message);
      } finally {
        setIsStartingSession(false);
      }
    },
    [
      electionId,
      safeGetSessionKey,
      createAndSubmitUserOperation,
      fetchPhienBauCuDetails,
      fetchPhienBauCuList,
      toast,
      showError,
    ],
  );

  // Hàm chuyển định dạng ngày Việt Nam (dd/MM/yyyy HH:mm) sang định dạng JS Date
  const parseVietnameseDateString = (dateString: string): Date => {
    const parts = dateString.split(' ');
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : '00:00';

    const [day, month, year] = datePart.split('/').map((num) => Number.parseInt(num, 10));
    const [hour, minute] = timePart.split(':').map((num) => Number.parseInt(num, 10));

    return new Date(year, month - 1, day, hour, minute);
  };

  // Mở rộng hàm refresh để cập nhật cả dữ liệu từ blockchain
  const refreshData = useCallback(() => {
    if (electionId) {
      // Làm mới dữ liệu từ API
      fetchElectionDetails(electionId);
      fetchContractAddresses();
      fetchPhienBauCuList(electionId);

      // Làm mới dữ liệu từ blockchain
      if (sessionId) {
        fetchCuTriListFromBlockchain();
        fetchUngVienListFromBlockchain();
      }

      if (userInfo && userInfo.id && userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }

      dispatch(fetchImageUrl(Number(electionId)));

      toast({
        title: 'Đang làm mới dữ liệu',
        description: 'Đang tải lại thông tin từ blockchain và API',
      });
    }
  }, [
    electionId,
    sessionId,
    userInfo,
    dispatch,
    fetchElectionDetails,
    fetchContractAddresses,
    fetchPhienBauCuList,
    fetchCuTriListFromBlockchain,
    fetchUngVienListFromBlockchain,
    toast,
  ]);

  // Kiểm tra xem có thể thực hiện các thao tác không
  // Kiểm tra xem đã có đủ token allowance chưa
  const hasRequiredAllowances = useMemo(
    () =>
      Number.parseFloat(balances.allowanceForFactory) >= 4.0 &&
      Number.parseFloat(balances.allowanceForPaymaster) >= 1.0 &&
      Number.parseFloat(balances.hluBalance) >= 5.0,
    [balances],
  );

  const canPerformBlockchainActions = useMemo(
    () => sessionKey && sessionKey.expiresAt * 1000 > Date.now() && hasRequiredAllowances,
    [sessionKey, hasRequiredAllowances],
  );

  // Phần hiển thị danh sách cử tri đã được cải thiện để xử lý các trường hợp null/undefined
  const renderCuTriList = () => (
    <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
      {danhSachCuTri.length > 0 ? (
        danhSachCuTri.map((cuTri) => (
          <div
            key={cuTri.id}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              selectedCuTri.includes(cuTri.diaChiVi || '')
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-[#1A2942]/30 border-gray-200 dark:border-[#2A3A5A]/50 hover:border-blue-200 dark:hover:border-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`voter-${cuTri.id}`}
                  checked={selectedCuTri.includes(cuTri.diaChiVi || '')}
                  onChange={() => {
                    if (cuTri.diaChiVi) {
                      if (selectedCuTri.includes(cuTri.diaChiVi)) {
                        setSelectedCuTri(selectedCuTri.filter((id) => id !== cuTri.diaChiVi));
                      } else {
                        setSelectedCuTri([...selectedCuTri, cuTri.diaChiVi]);
                      }
                    }
                  }}
                  disabled={!cuTri.diaChiVi}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`voter-${cuTri.id}`}
                  className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  {cuTri.hoTen || 'Không có tên'}
                </label>
              </div>
              {cuTri.diaChiVi ? (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {cuTri.diaChiVi.substring(0, 6)}...
                  {cuTri.diaChiVi.substring(cuTri.diaChiVi.length - 4)}
                </span>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Không có địa chỉ ví
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
              {cuTri.email || 'Không có email'}
            </p>
          </div>
        ))
      ) : (
        <div className="py-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1A2942]/20 rounded-xl border border-gray-200 dark:border-[#2A3A5A]/50">
          <User className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
            Chưa có cử tri nào trong danh sách.
          </p>
          <button
            onClick={fetchCuTriListFromBlockchain}
            className="mt-2 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tải lại từ blockchain
          </button>
        </div>
      )}
    </div>
  );

  // Sửa hàm renderUngVienList để sửa lỗi cú pháp JSX
  const renderUngVienList = () => (
    <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
      {danhSachUngVien.length > 0 ? (
        danhSachUngVien.map((ungVien) => (
          <div
            key={ungVien.id}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              selectedUngVien.includes(ungVien.diaChiVi || '')
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-[#1A2942]/30 border-gray-200 dark:border-[#2A3A5A]/50 hover:border-blue-200 dark:hover:border-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`candidate-${ungVien.id}`}
                  checked={selectedUngVien.includes(ungVien.diaChiVi || '')}
                  onChange={() => {
                    if (ungVien.diaChiVi) {
                      if (selectedUngVien.includes(ungVien.diaChiVi)) {
                        setSelectedUngVien(selectedUngVien.filter((id) => id !== ungVien.diaChiVi));
                      } else {
                        setSelectedUngVien([...selectedUngVien, ungVien.diaChiVi]);
                      }
                    }
                  }}
                  disabled={!ungVien.diaChiVi}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`candidate-${ungVien.id}`}
                  className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  {ungVien.hoTen || 'Không có tên'}
                </label>
              </div>
              {ungVien.diaChiVi ? (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {ungVien.diaChiVi.substring(0, 6)}...
                  {ungVien.diaChiVi.substring(ungVien.diaChiVi.length - 4)}
                </span>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Không có địa chỉ ví
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
              {ungVien.thongTin || 'Không có thông tin'}
            </p>
          </div>
        ))
      ) : (
        <div className="py-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1A2942]/20 rounded-xl border border-gray-200 dark:border-[#2A3A5A]/50">
          <Award className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
            Chưa có ứng viên nào trong danh sách.
          </p>
          <button
            onClick={fetchUngVienListFromBlockchain}
            className="mt-2 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tải lại từ blockchain
          </button>
        </div>
      )}
    </div>
  );

  // Thêm hiển thị thông tin blockchain
  const renderBlockchainStatus = () => {
    if (!contractAddresses) {
      return (
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 text-yellow-800 dark:text-yellow-200 mb-4">
          <div className="flex items-start">
            <AlertCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Không có thông tin blockchain</h3>
              <p className="text-sm mt-1">
                Không thể tải thông tin hợp đồng blockchain. Vui lòng thử lại sau.
                <button
                  onClick={fetchContractAddresses}
                  className="ml-2 underline text-blue-600 dark:text-blue-400"
                >
                  Tải lại
                </button>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-200 mb-4">
        <h3 className="font-medium flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Thông tin blockchain
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">EntryPoint:</span>
            <span className="ml-1 font-mono text-xs break-all">
              {contractAddresses.entryPointAddress}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Factory:</span>
            <span className="ml-1 font-mono text-xs break-all">
              {contractAddresses.factoryAddress}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Paymaster:</span>
            <span className="ml-1 font-mono text-xs break-all">
              {contractAddresses.paymasterAddress}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">HLU Token:</span>
            <span className="ml-1 font-mono text-xs break-all">
              {contractAddresses.hluTokenAddress}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Chain ID:</span>
            <span className="ml-1">{contractAddresses.chainId}</span>
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị thông tin phiên bầu cử trên blockchain
  const renderPhienBauCuBlockchainInfo = () => {
    if (!phienBauCuData || !cuocBauCuData) return null;

    return (
      <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 text-purple-800 dark:text-purple-200 mb-4">
        <h3 className="font-medium flex items-center">
          <Hexagon className="w-5 h-5 mr-2" />
          Thông tin phiên bầu cử trên blockchain
        </h3>
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">ID Cuộc bầu cử:</span>
            <span>1</span> {/* Mặc định là 1 trong QuanLyCuocBauCu */}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">ID Phiên bầu cử:</span>
            <span>{sessionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Địa chỉ quản lý:</span>
            <span className="font-mono text-xs">
              {cuocBauCuData.blockchainAddress.substring(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
            <span
              className={
                phienBauCuData.trangThai === 'Đang diễn ra'
                  ? 'text-green-600 dark:text-green-400'
                  : phienBauCuData.trangThai === 'Sắp diễn ra'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
              }
            >
              {phienBauCuData.trangThai}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị danh sách cử tri và ứng viên trong một card riêng
  const renderVotersAndCandidates = () => {
    if (!sessionId) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Danh sách cử tri */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
                <Users className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
              </div>
              <h2 className="text-xl font-medium text-gray-800 dark:text-white">Cử Tri</h2>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => fetchCuTriListFromBlockchain()}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#1A2942]/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1A2942] transition-colors flex items-center"
                title="Làm mới từ blockchain"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleAddVoters(sessionId)}
                disabled={
                  isAddingVoters || selectedCuTri.length === 0 || !canPerformBlockchainActions
                }
                className="px-3 py-1.5 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all duration-300 flex items-center text-sm shadow-sm"
              >
                {isAddingVoters ? (
                  <Loader className="animate-spin mr-1" size={14} />
                ) : (
                  <UserPlus className="mr-1" size={14} />
                )}
                Thêm Cử Tri
              </button>
            </div>
          </div>

          {/* Hiển thị danh sách cử tri */}
          {renderCuTriList()}
        </div>

        {/* Danh sách ứng viên */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
                <Award className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
              </div>
              <h2 className="text-xl font-medium text-gray-800 dark:text-white">Ứng Viên</h2>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => fetchUngVienListFromBlockchain()}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#1A2942]/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1A2942] transition-colors flex items-center"
                title="Làm mới từ blockchain"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleAddCandidates(sessionId)}
                disabled={
                  isAddingCandidates || selectedUngVien.length === 0 || !canPerformBlockchainActions
                }
                className="px-3 py-1.5 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all duration-300 flex items-center text-sm shadow-sm"
              >
                {isAddingCandidates ? (
                  <Loader className="animate-spin mr-1" size={14} />
                ) : (
                  <UserPlus className="mr-1" size={14} />
                )}
                Thêm Ứng Viên
              </button>
            </div>
          </div>

          {/* Hiển thị danh sách ứng viên */}
          {renderUngVienList()}
        </div>
      </div>
    );
  };

  // Phần hiển thị trong component
  return (
    <div className="relative p-8 bg-gradient-to-b from-white to-gray-50 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] rounded-xl shadow-lg overflow-hidden">
      {/* Overlay loading khi đang xử lý */}
      {renderLoadingOverlay()}

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Quản Lý Phiên Bầu Cử Blockchain
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              {cuocBauCuData ? (
                <>
                  Quản lý phiên bầu cử cho cuộc bầu cử{' '}
                  <span className="font-medium">"{cuocBauCuData.tenCuocBauCu}"</span>
                </>
              ) : (
                <>Quản lý và triển khai các phiên bầu cử lên blockchain</>
              )}
            </p>
          </div>

          <button
            onClick={refreshData}
            className="p-3 rounded-full bg-white dark:bg-[#1A2942]/50 hover:bg-gray-100 dark:hover:bg-[#1A2942] transition-colors shadow-md flex items-center gap-2"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5 text-blue-500 dark:text-[#4F8BFF]" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">Làm mới</span>
          </button>
        </div>

        {/* Hiển thị thông tin blockchain */}
        {renderBlockchainStatus()}

        {/* Hiển thị thông tin phiên bầu cử trên blockchain */}
        {renderPhienBauCuBlockchainInfo()}

        {/* Thông tin cuộc bầu cử */}
        {cuocBauCuData && (
          <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Election Image */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A] flex items-center justify-center">
                  {electionImage ? (
                    <img
                      src={electionImage || '/placeholder.svg'}
                      alt={cuocBauCuData.tenCuocBauCu}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <Hexagon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Không có hình ảnh</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Election Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-500 dark:text-[#4F8BFF]" />
                  {cuocBauCuData.tenCuocBauCu}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Thời gian bầu cử
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                      {cuocBauCuData.ngayBatDau} - {cuocBauCuData.ngayKetThuc}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Trạng thái blockchain
                    </p>
                    <p className="font-medium flex items-center">
                      {cuocBauCuData.trangThaiBlockchain === TrangThaiBlockchain.ChuaTrienKhai && (
                        <span className="text-yellow-600 dark:text-yellow-300 flex items-center">
                          <Info className="w-4 h-4 mr-2" />
                          Chưa triển khai
                        </span>
                      )}
                      {cuocBauCuData.trangThaiBlockchain === TrangThaiBlockchain.DangTrienKhai && (
                        <span className="text-blue-600 dark:text-blue-400 flex items-center">
                          <Hourglass className="w-4 h-4 mr-2" />
                          Đang triển khai
                        </span>
                      )}
                      {cuocBauCuData.trangThaiBlockchain === TrangThaiBlockchain.DaTrienKhai && (
                        <span className="text-green-600 dark:text-green-400 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Đã triển khai
                        </span>
                      )}
                      {cuocBauCuData.trangThaiBlockchain ===
                        TrangThaiBlockchain.TrienKhaiThatBai && (
                        <span className="text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircleIcon className="w-4 h-4 mr-2" />
                          Triển khai thất bại
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Mô tả</p>
                  <p className="text-gray-800 dark:text-gray-200">
                    {cuocBauCuData.moTa || 'Không có mô tả'}
                  </p>
                </div>

                {cuocBauCuData.blockchainAddress && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Địa chỉ blockchain
                    </p>
                    <div className="flex items-center">
                      <p className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate">
                        {cuocBauCuData.blockchainAddress}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(cuocBauCuData.blockchainAddress);
                          toast({
                            title: 'Đã sao chép',
                            description: 'Địa chỉ đã được sao chép vào clipboard',
                          });
                        }}
                        className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#1A2942] text-blue-500"
                        title="Sao chép địa chỉ"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Configuration Section */}
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
              <Wallet className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
            </div>
            <h2 className="text-xl font-medium text-gray-800 dark:text-white">
              Cấu Hình Ví Blockchain
            </h2>
          </div>

          <div className="p-4 mb-6 rounded-lg bg-blue-50 dark:bg-[#1A2942]/80 border border-blue-200 dark:border-[#4F8BFF]/30 text-blue-800 dark:text-[#E1F5FE]">
            <p className="flex items-start">
              <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
              <span>
                Để triển khai phiên bầu cử lên blockchain, bạn cần có khóa phiên. Hệ thống sẽ tự
                động lấy thông tin tài khoản và ví của bạn.
                {sessionKey && sessionKey.expiresAt * 1000 > Date.now() ? (
                  <span className="block mt-2 font-medium">
                    Bạn đã có khóa phiên còn hạn sử dụng đến:{' '}
                    {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                  </span>
                ) : (
                  <span className="block mt-2">
                    Nhấn nút "Lấy Khóa Phiên" để tạo hoặc lấy khóa phiên hiện có.
                  </span>
                )}
              </span>
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={safeGetSessionKey}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-600 dark:from-[#0288D1] dark:to-[#6A1B9A] text-white hover:shadow-lg disabled:opacity-50 transition-all duration-300 flex items-center"
            >
              {isLoading && status === PhienBauCuDeploymentStatus.CREATING_SESSION_KEY ? (
                <Loader className="animate-spin mr-2" size={18} />
              ) : (
                <Key className="mr-2" size={18} />
              )}
              {isLoading && status === PhienBauCuDeploymentStatus.CREATING_SESSION_KEY
                ? 'Đang tạo...'
                : sessionKey && sessionKey.expiresAt * 1000 > Date.now()
                  ? 'Làm Mới Khóa Phiên'
                  : 'Lấy Khóa Phiên'}
            </button>
          </div>

          {/* Session Key Info */}
          {sessionKey && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-blue-100 dark:border-[#2A3A5A]/70">
              <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                Thông Tin Khóa Phiên
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                    Địa Chỉ Ví Thông Minh (SCW)
                  </p>
                  <div className="flex items-center">
                    <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
                      {sessionKey.scwAddress}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sessionKey.scwAddress);
                        toast({
                          title: 'Đã sao chép',
                          description: 'Địa chỉ ví đã được sao chép vào clipboard',
                        });
                      }}
                      className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#1A2942] text-gray-500 dark:text-gray-400"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Thời Hạn Sử Dụng</p>
                  <p className="text-gray-800 dark:text-gray-200 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                    {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                    <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                      (Còn {Math.floor((sessionKey.expiresAt - Date.now() / 1000) / 3600)} giờ)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tích hợp component ApproveHLU */}
        {sessionKey && (
          <div className="mb-8">
            <ApproveHLU
              scwAddress={scwAddress}
              sessionKey={sessionKey}
              onSuccess={handleApproveSuccess}
              onBalancesUpdated={handleBalancesUpdated}
              setIsLoading={handleApproveLoading}
              showMessage={showMessage}
              showError={showError}
            />
          </div>
        )}

        {/* Phiên Bầu Cử Section */}
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
                <Server className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
              </div>
              <h2 className="text-xl font-medium text-gray-800 dark:text-white">
                Các Phiên Bầu Cử
              </h2>
            </div>

            <button
              onClick={() => setIsShowTaoPhienBauForm(true)}
              disabled={
                isLoading ||
                !canPerformBlockchainActions ||
                cuocBauCuData?.trangThaiBlockchain !== TrangThaiBlockchain.DaTrienKhai
              }
              className="px-4 py-2.5 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all duration-300 flex items-center shadow-md"
            >
              <Plus className="mr-2" size={18} />
              Tạo Phiên Bầu Cử Mới
            </button>
          </div>

          {cuocBauCuData?.trangThaiBlockchain !== TrangThaiBlockchain.DaTrienKhai && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-50 dark:bg-[#332A1A]/80 border border-yellow-200 dark:border-[#FFB300]/30 text-yellow-800 dark:text-[#FFECB3]">
              <p className="flex items-start">
                <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
                <span>
                  Cuộc bầu cử chưa được triển khai lên blockchain. Vui lòng triển khai cuộc bầu cử
                  trước khi tạo phiên bầu cử.
                </span>
              </p>
            </div>
          )}

          {/* Danh sách phiên bầu cử */}
          {cacPhienBauCu.length > 0 ? (
            <div className="space-y-4">
              {cacPhienBauCu.map((phien) => (
                <div
                  key={phien.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/70 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                        <Hexagon className="w-5 h-5 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                        {phien.tenPhienBauCu}
                      </h3>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                          {phien.ngayBatDau} - {phien.ngayKetThuc}
                        </p>

                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <Info className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                          Trạng thái:
                          <span
                            className={`ml-1 ${
                              phien.trangThai === 'Đang diễn ra'
                                ? 'text-green-600 dark:text-green-400'
                                : phien.trangThai === 'Sắp diễn ra'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : phien.trangThai === 'Đã kết thúc'
                                    ? 'text-gray-600 dark:text-gray-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                            }`}
                          >
                            {phien.trangThai}
                          </span>
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {phien.moTa}
                      </p>
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col gap-2">
                      {phien.trangThai === 'Sắp diễn ra' && (
                        <button
                          onClick={() => handleStartSession(phien.id)}
                          disabled={isStartingSession || !canPerformBlockchainActions}
                          className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:bg-gray-400 transition-all duration-300 flex items-center justify-center shadow-sm"
                        >
                          {isStartingSession ? (
                            <Loader className="animate-spin mr-2" size={16} />
                          ) : (
                            <Play className="mr-2" size={16} />
                          )}
                          Bắt Đầu Phiên
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/election/${electionId}/session/${phien.id}`)}
                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                      >
                        <ChevronRight className="mr-2" size={16} />
                        Chi Tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1A2942]/20 rounded-xl border border-gray-200 dark:border-[#2A3A5A]/50">
              <Server className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                Chưa có phiên bầu cử nào. Hãy tạo phiên bầu cử mới để bắt đầu.
              </p>
            </div>
          )}
        </div>

        {/* Quản lý cử tri và ứng viên */}
        {renderVotersAndCandidates()}

        {/* Status Messages */}
        {message && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-[#1A2942]/80 border border-blue-200 dark:border-[#4F8BFF]/30 text-blue-800 dark:text-[#E1F5FE]">
            <p className="flex items-start">
              <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
              <span>{message}</span>
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-[#421A1A]/80 border border-red-200 dark:border-[#F44336]/30 text-red-800 dark:text-[#FFCDD2]">
            <p className="flex items-start">
              <AlertCircleIcon className="mr-2 flex-shrink-0 mt-1" size={18} />
              <span>{errorMessage}</span>
            </p>
          </div>
        )}

        {/* Transaction Info */}
        {txHash && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-blue-100 dark:border-[#2A3A5A]/70">
            <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white flex items-center">
              <Network className="w-5 h-5 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
              Thông Tin Giao Dịch
            </h3>

            <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50 mb-3">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                Mã Giao Dịch (Transaction Hash)
              </p>
              <div className="flex items-center">
                <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
                  {txHash}
                </p>
                <a
                  href={`https://explorer.holihu.online/transactions/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#1A2942] text-blue-500 dark:text-[#4F8BFF]"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            {/* Hash Linking Information */}
            {frontendHash && backendHash && frontendHash !== backendHash && (
              <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50 mb-3">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Liên Kết Hash</p>
                <div className="flex items-center mb-2">
                  <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center">
                    <Link className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                    Frontend Hash:
                  </p>
                  <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate ml-2">
                    {frontendHash.substring(0, 10)}...
                    {frontendHash.substring(frontendHash.length - 8)}
                  </p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center">
                    <Link className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                    Backend Hash:
                  </p>
                  <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate ml-2">
                    {backendHash.substring(0, 10)}...
                    {backendHash.substring(backendHash.length - 8)}
                  </p>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {hashesLinked ? (
                    <span className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Đã liên kết hash thành công
                    </span>
                  ) : (
                    <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                      <Info className="w-3 h-3 mr-1" />
                      Đang chờ liên kết hash
                    </span>
                  )}
                </div>
              </div>
            )}

            {status === PhienBauCuDeploymentStatus.SUCCESS && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-[#1A442A]/50 border border-green-200 dark:border-[#2A5A3A]/50 flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-700 dark:text-green-400 font-medium">
                    Thao tác blockchain đã được thực hiện thành công!
                  </p>
                  <p className="text-gray-600 dark:text-[#B0BEC5] text-sm mt-1">
                    Bạn có thể tiếp tục quản lý phiên bầu cử.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form tạo phiên bầu cử */}
      {isShowTaoPhienBauForm && (
        <TaoPhienBauForm
          onCreateSession={handleCreateSession}
          cuocBauCuId={Number(electionId)}
          isOpen={isShowTaoPhienBauForm}
          onClose={() => setIsShowTaoPhienBauForm(false)}
        />
      )}
    </div>
  );
};

export default PhienBauCuBlockchainPage;
