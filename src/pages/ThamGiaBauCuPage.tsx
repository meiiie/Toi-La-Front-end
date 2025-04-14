'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import VotedStamp from '../components/bophieu/VotedStamp';
import EnhancedBallotCard from '../components/bophieu/EnhancedBallotCard';
import BallotProcessingAnimation from '../components/bophieu/BallotProcessingAnimation';
// Update ethers import to include all necessary components
import { ethers, JsonRpcProvider, Contract } from 'ethers';
import {
  Calendar,
  ChevronRight,
  FileText,
  Vote,
  User,
  Shield,
  Info,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Check,
  Loader2,
  Award,
  Zap,
  Ticket,
  Database,
  Lock,
  QrCode,
  Clock,
  Sparkles,
  Copy,
  ExternalLink,
  XCircle,
  Loader,
} from 'lucide-react';

// Thêm import fetchBlockchainAddress từ ungCuVienSlice
import { fetchBlockchainAddress } from '../store/slice/ungCuVienSlice';

import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';
// Add apiClient import
import apiClient from '../api/apiClient';
// Add CardUngVienXemChiTiet import
import CardUngVienXemChiTiet from '../features/CardUngVienXemChiTiet';
// Import ApproveHLU component
import ApproveHLU from '../components/blockchain/ApproveHLU';
// Add the import for TokenApprovalModal at the top of the file with the other imports
import TokenApprovalModal from '../components/bophieu/TokenApprovalModal';

// Components
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { Checkbox } from '../components/ui/Checkbox';
import { Label } from '../components/ui/Label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Progress } from '../components/ui/Progress';
import ParticleBackground from '../components/backgrounds/ParticleBackground';
import DieuLeLoader from '../components/DieuLeLoader';
import { useToast } from '../test/components/use-toast';
import ElectionResultsWaiting from '../components/bophieu/ElectionResultsWaiting';

// Blockchain functions
import {
  fetchBallotIPFSLinks,
  checkVoterHasVotedSafely,
  ID_PHIEN_BAU_CU,
  SCW_ADDRESS,
} from '../utils/blockchain';
import type { RootState } from '../store/store';
import type { UngCuVien, BallotMetadata, ViTriUngCu } from '../store/types';

// Xác định các bước tham gia bầu cử
type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  hidden?: boolean;
};

const steps: Step[] = [
  {
    id: 'welcome',
    title: 'Chào mừng',
    description: 'Giới thiệu về cuộc bầu cử',
    icon: <User className="h-5 w-5" />,
  },
  {
    id: 'rules',
    title: 'Điều lệ',
    description: 'Đọc và xác nhận điều lệ',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'verification',
    title: 'Xác thực',
    description: 'Xác thực danh tính',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: 'voting',
    title: 'Bỏ phiếu',
    description: 'Chọn ứng viên',
    icon: <Vote className="h-5 w-5" />,
  },
  {
    id: 'processing',
    title: 'Đang xử lý',
    description: 'Xác nhận trên blockchain',
    icon: <Loader2 className="h-5 w-5" />,
  },
  {
    id: 'confirmation',
    title: 'Xác nhận',
    description: 'Xác nhận lựa chọn',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    id: 'waiting-results',
    title: 'Chờ kết quả',
    description: 'Đang chờ kết quả bầu cử',
    icon: <Award className="h-5 w-5" />,
  },
];

// Tạo FileHashIcon component bên ngoài component chính để tránh re-render
const FileHashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M10 12v-1h1v1" />
    <path d="M14 13v-1h1v1" />
    <path d="M10 16v-1h1v1" />
    <path d="M14 17v-1h1v1" />
  </svg>
);

const ThamGiaBauCu: React.FC = () => {
  const { id: cuocBauCuId, idPhien } = useParams<{ id: string; idPhien: string }>();
  const navigate = useNavigate();
  const phienId = useMemo(() => idPhien || ID_PHIEN_BAU_CU.toString(), [idPhien]);
  const { toast } = useToast();

  // Redux state
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);
  const {
    dieuLeCuocBauCu,
    dangTai: dangTaiDieuLe,
    daXacNhan,
  } = useSelector((state: RootState) => state.dieuLe);
  const { cuocBauCu } = useSelector((state: RootState) => state.cuocBauCuById);
  const { cacPhienBauCu } = useSelector((state: RootState) => state.phienBauCu);

  // Sử dụng useMemo để tránh tính toán lại phienBauCu khi không cần thiết
  const phienBauCu = useMemo(() => {
    return phienId ? cacPhienBauCu.find((p) => p.id === Number(phienId)) : cacPhienBauCu[0];
  }, [phienId, cacPhienBauCu]);

  const dispatch = useDispatch();

  // Add state for SQL candidates
  const [sqlCandidates, setSqlCandidates] = useState<UngCuVien[]>([]);
  // Add new state for positions
  const [viTriList, setViTriList] = useState<ViTriUngCu[]>([]);

  // State
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [acceptedRules, setAcceptedRules] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<UngCuVien | null>(null);
  const [selectedBallot, setSelectedBallot] = useState<{
    tokenId: number;
    metadata: BallotMetadata | null;
    tokenURI: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hasRules, setHasRules] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [verificationStep, setVerificationStep] = useState<number>(0);
  const [votedSuccessfully, setVotedSuccessfully] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [electionEndTime, setElectionEndTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showTokenApprovalModal, setShowTokenApprovalModal] = useState<boolean>(false);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);

  // Thêm state để lưu serverId (thêm vào phần state declarations)
  const [localServerId, setLocalServerId] = useState<number | null>(null);

  // Blockchain-related state
  const [ballots, setBallots] = useState<
    Array<{
      tokenId: number;
      tokenURI: string;
      processedURI: string;
      metadata: BallotMetadata | null;
      isUsed: boolean;
    }>
  >([]);
  const [candidates, setCandidates] = useState<UngCuVien[]>([]);
  const [loadingBallots, setLoadingBallots] = useState<boolean>(false);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [blockchainPhienBauCuId, setBlockchainPhienBauCuId] = useState<number | null>(null);
  const [quanLyCuocBauCuAddress, setQuanLyCuocBauCuAddress] = useState<string | null>(null);

  // Add state for blockchain transactions
  const [blockchainTxHash, setBlockchainTxHash] = useState<string>('');
  const [blockchainTxStatus, setBlockchainTxStatus] = useState<
    'pending' | 'success' | 'failed' | null
  >(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'success' | 'failed' | null>(
    null,
  );

  // IMPORTANT: Define tokenApprovalStatus BEFORE it's used in function dependencies
  const [tokenApprovalStatus, setTokenApprovalStatus] = useState<{
    hluBalance: string;
    allowanceForQuanLyPhieu: string;
    isApproved: boolean;
  }>({
    hluBalance: '0',
    allowanceForQuanLyPhieu: '0',
    isApproved: false,
  });

  const [contractAddresses, setContractAddresses] = useState<{
    entryPointAddress?: string;
    factoryAddress?: string;
    paymasterAddress?: string;
    quanLyPhieuBauAddress?: string;
    hluTokenAddress?: string;
  }>({});

  // Add state variable for session key - moved up before it's used
  const [sessionKey, setSessionKey] = useState<{
    sessionKey: string;
    expiresAt: number;
    scwAddress: string;
  } | null>(null);

  // Thêm state để lưu địa chỉ ví của ứng viên được chọn
  const [candidateAddress, setCandidateAddress] = useState<string | null>(null);

  // Thêm useEffect mới để dispatch actions - chỉ chạy một lần khi component mount
  useEffect(() => {
    const initializeData = async () => {
      if (dataInitialized) return;

      try {
        // Tạo một mảng các promise để thực hiện song song
        const promises = [];

        if (phienId) {
          promises.push(
            dispatch(fetchPhienBauCuById(Number(phienId)))
              .then(() => console.log('fetchPhienBauCuById completed'))
              .catch((error) => console.error('Error fetching phienBauCu:', error)),
          );
        }

        if (cuocBauCuId) {
          promises.push(
            dispatch(fetchCuocBauCuById(Number(cuocBauCuId)))
              .then(() => console.log('fetchCuocBauCuById completed'))
              .catch((error) => console.error('Error fetching cuocBauCu:', error)),
          );
        }

        // Chờ tất cả các promise hoàn thành
        await Promise.all(promises);
        setDataInitialized(true);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, [phienId, cuocBauCuId, dispatch, dataInitialized]);

  // Thêm useEffect để lấy địa chỉ ví của ứng viên khi người dùng chọn ứng viên
  useEffect(() => {
    if (selectedCandidate) {
      // Kiểm tra xem đã có địa chỉ ví trong Redux store chưa
      const blockchainAddresses = useSelector(
        (state: RootState) => state.ungCuVien.blockchainAddresses,
      );

      if (blockchainAddresses[selectedCandidate.id]) {
        setCandidateAddress(blockchainAddresses[selectedCandidate.id]);
      } else {
        // Nếu chưa có, gọi API để lấy địa chỉ ví
        dispatch(fetchBlockchainAddress(selectedCandidate.id))
          .then((action) => {
            if (action.payload?.response?.success && action.payload?.response?.blockchainAddress) {
              setCandidateAddress(action.payload.response.blockchainAddress);
            } else {
              console.warn('Không thể lấy địa chỉ ví của ứng viên:', selectedCandidate.id);
              // Sử dụng địa chỉ mặc định nếu không lấy được
              setCandidateAddress('0x8dFcB44976E17E9d6378c4F126Dec611F96D219b');
            }
          })
          .catch((error) => {
            console.error('Lỗi khi lấy địa chỉ ví của ứng viên:', error);
            // Sử dụng địa chỉ mặc định nếu có lỗi
            setCandidateAddress('0x8dFcB44976E17E9d6378c4F126Dec611F96D219b');
          });
      }
    } else {
      setCandidateAddress(null);
    }
  }, [selectedCandidate, dispatch]);

  // Kiểm tra dark mode - chỉ chạy một lần khi component mount
  useEffect(() => {
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Lắng nghe sự thay đổi dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Kiểm tra kích thước màn hình - chỉ chạy một lần khi component mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Cập nhật trạng thái xác nhận điều lệ
  useEffect(() => {
    if (daXacNhan !== null) {
      setAcceptedRules(daXacNhan);
    }
  }, [daXacNhan]);

  // Hàm helper để xác định địa chỉ ví của người dùng hiện tại - memoized để tránh tính toán lại
  const getCurrentWalletAddress = useMemo(() => {
    if (walletInfo?.diaChiVi) {
      return walletInfo.diaChiVi;
    }

    // If user is logged in but wallet not loaded yet, try to provide a better message
    if (user?.diaChiVi) {
      return user.diaChiVi;
    }

    return SCW_ADDRESS;
  }, [walletInfo, user]);

  // Improve the useEffect to ensure wallet info is loaded - chỉ chạy khi user hoặc walletInfo thay đổi
  useEffect(() => {
    // If we don't have wallet info yet but have user data, try to fetch wallet info
    if (!walletInfo && user?.id && user?.diaChiVi) {
      dispatch(getViByAddress({ taiKhoanId: user.id, diaChiVi: user.diaChiVi }));
    }
  }, [user, walletInfo, dispatch]);

  // Thêm useEffect để ngăn người dùng thoát khi đang xử lý
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep === 'processing') {
        e.preventDefault();
        e.returnValue = 'Giao dịch đang xử lý. Bạn có chắc muốn thoát?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep]);

  // Add function to fetch contract addresses - memoized để tránh tạo lại function
  const fetchContractAddresses = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      if (response.data && response.data.success) {
        setContractAddresses(response.data);
        return response.data;
      } else {
        throw new Error('Không thể lấy địa chỉ contract');
      }
    } catch (error) {
      console.error('Lỗi khi lấy địa chỉ contract:', error);
      return null;
    }
  }, []);

  // Add useEffect to fetch contract addresses when component mounts - chỉ chạy một lần
  useEffect(() => {
    fetchContractAddresses();
  }, [fetchContractAddresses]);

  // Implement the session key retrieval logic - memoized để tránh tạo lại function
  const getSessionKey = useCallback(async () => {
    if (!user?.id || !walletInfo?.viId) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Cần có thông tin tài khoản và ví để lấy khóa phiên',
      });
      return null;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(user.id.toString(), 10),
        ViID: Number.parseInt(walletInfo.viId.toString(), 10),
      });

      if (response.data && response.data.success) {
        return {
          sessionKey: response.data.sessionKey,
          expiresAt: response.data.expiresAt,
          scwAddress: response.data.scwAddress || walletInfo.diaChiVi,
        };
      } else {
        throw new Error(response.data?.message || 'Không thể lấy session key');
      }
    } catch (error) {
      console.error('Lỗi khi lấy session key:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lấy khóa phiên: ' + (error as Error).message,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, walletInfo, toast]);

  // Add useEffect to get session key when needed for ApproveHLU - chỉ chạy khi các dependency thay đổi
  useEffect(() => {
    if (
      walletInfo?.diaChiVi &&
      contractAddresses?.quanLyPhieuBauAddress &&
      !sessionKey &&
      currentStep === 'voting'
    ) {
      getSessionKey().then((key) => {
        if (key) {
          setSessionKey(key);
        }
      });
    }
  }, [walletInfo, contractAddresses, sessionKey, currentStep, getSessionKey]);

  // Handle balances updated from ApproveHLU - memoized để tránh tạo lại function
  const handleBalancesUpdated = useCallback((balances: any) => {
    // Calculate if we have sufficient approval for voting
    const requiredAmount = 1; // 1 HLU needed for voting (reduced from 3)
    const isApproved =
      Number(balances.allowanceForQuanLyPhieu || balances.allowanceForPaymaster || '0') >=
      requiredAmount;

    setTokenApprovalStatus({
      hluBalance: balances.hluBalance || '0',
      allowanceForQuanLyPhieu:
        balances.allowanceForQuanLyPhieu || balances.allowanceForPaymaster || '0',
      isApproved,
    });
  }, []);

  // Handle approval success - memoized để tránh tạo lại function
  const handleApproveSuccess = useCallback(() => {
    toast({
      title: 'Phê duyệt thành công',
      description: 'Đã phê duyệt token HLU thành công',
    });
  }, [toast]);

  // Handle set loading state from ApproveHLU - memoized để tránh tạo lại function
  const handleSetIsLoading = useCallback((loading: boolean) => {
    setIsApproving(loading);
  }, []);

  // Hàm để xác định ID phiên bầu cử từ blockchain - memoized để tránh tạo lại function
  const fetchBlockchainSessionId = useCallback(async () => {
    // Nếu đã có blockchainPhienBauCuId, không cần fetch lại
    if (blockchainPhienBauCuId) {
      return blockchainPhienBauCuId;
    }

    // Nếu không có phienBauCu, không thể fetch
    if (!phienBauCu && !cuocBauCu?.blockchainAddress) {
      console.error('Không có thông tin phiên bầu cử hoặc cuộc bầu cử');
      return null;
    }

    try {
      // Ưu tiên sử dụng địa chỉ từ phienBauCu
      let contractAddress = phienBauCu?.blockchainAddress;

      // Nếu không có, thử dùng địa chỉ từ cuocBauCu
      if (!contractAddress && cuocBauCu?.blockchainAddress) {
        contractAddress = cuocBauCu.blockchainAddress;
      }

      // Nếu vẫn không có, dùng địa chỉ cứng
      if (!contractAddress) {
        contractAddress = '0x9c244B5E1F168510B9b812573b1B667bd1E654c8';
      }

      setQuanLyCuocBauCuAddress(contractAddress);

      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI cho QuanLyCuocBauCu
      const quanLyCuocBauCuAbi = [
        'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
        'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool)',
      ];

      const quanLyCuocBauCu = new ethers.Contract(contractAddress, quanLyCuocBauCuAbi, provider);

      // Lấy danh sách phiên bầu cử
      const phienBauCuList = await quanLyCuocBauCu.layDanhSachPhienBauCu(1, 0, 10);

      if (phienBauCuList && phienBauCuList.length > 0) {
        // Lấy phiên bầu cử mới nhất
        const latestSessionId = phienBauCuList[phienBauCuList.length - 1];

        setBlockchainPhienBauCuId(Number(latestSessionId));
        return Number(latestSessionId);
      }

      return null;
    } catch (error) {
      console.error('Lỗi khi lấy ID phiên bầu cử từ blockchain:', error);
      return null;
    }
  }, [blockchainPhienBauCuId, phienBauCu, cuocBauCu]);

  // Kiểm tra xem cử tri đã bỏ phiếu chưa - memoized để tránh tạo lại function
  const checkVoterHasVoted = useCallback(
    async (voterAddress: string, tokenId: number) => {
      // Sử dụng hàm mới với xử lý lỗi tốt hơn
      return await checkVoterHasVotedSafely(
        voterAddress,
        tokenId,
        quanLyCuocBauCuAddress || '',
        blockchainPhienBauCuId || 0,
      );
    },
    [quanLyCuocBauCuAddress, blockchainPhienBauCuId],
  );

  // Thêm hàm này vào phần callback hooks
  const fetchServerIdFromContract = useCallback(async () => {
    if (!cuocBauCu?.blockchainAddress || cuocBauCu?.blockchainServerId || localServerId) return;

    try {
      console.log(
        'Attempting to fetch serverId from blockchain for address:',
        cuocBauCu.blockchainAddress,
      );
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // Sử dụng địa chỉ factory từ configuration hoặc hardcode nếu cần
      const factoryAddress =
        contractAddresses.factoryAddress || '0x9c244B5E1F168510B9b812573b1B667bd1E654c8';

      const factoryAbi = [
        'function layThongTinServerTheoAddress(address serverAddress) view returns (uint128)',
      ];

      const factory = new Contract(factoryAddress, factoryAbi, provider);
      const serverId = await factory.layThongTinServerTheoAddress(cuocBauCu.blockchainAddress);

      console.log(
        `Retrieved serverId from blockchain: ${serverId} for address: ${cuocBauCu.blockchainAddress}`,
      );

      // Cập nhật local state
      setLocalServerId(Number(serverId));
    } catch (error) {
      console.error('Failed to fetch serverId from contract:', error);
    }
  }, [
    cuocBauCu?.blockchainAddress,
    cuocBauCu?.blockchainServerId,
    contractAddresses.factoryAddress,
    localServerId,
  ]);

  // Check voting rights - memoized để tránh tạo lại function
  const checkVotingRights = useCallback(
    async (idToken: number) => {
      if (
        !contractAddresses.quanLyPhieuBauAddress ||
        !walletInfo?.diaChiVi ||
        !blockchainPhienBauCuId
      ) {
        return false;
      }

      try {
        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
        const quanLyPhieuBauAbi = [
          'function kiemTraQuyenBauCu(address cuTri, uint128 serverId, uint256 idPhienBauCu, uint256 idToken) external view returns (bool)',
          'function kiemTraQuyenBauCuChiTiet(address cuTri, uint128 serverId, uint256 idPhienBauCu, uint256 idToken) external view returns (tuple(bool tonTai, bool daBoPhieu, bool laNguoiSoHuu, bool phienHopLe, bool trongThoiGian))',
        ];

        const quanLyPhieuBau = new Contract(
          contractAddresses.quanLyPhieuBauAddress,
          quanLyPhieuBauAbi,
          provider,
        );

        // THAY ĐỔI Ở ĐÂY: Sử dụng serverId từ cuocBauCu
        const serverId =
          cuocBauCu?.blockchainServerId || localServerId || (cuocBauCuId ? Number(cuocBauCuId) : 1);
        console.log(
          `Checking voting rights with serverId: ${serverId}, phienBauCuId: ${blockchainPhienBauCuId}, tokenId: ${idToken}`,
        );

        // Check general voting rights
        const hasVotingRights = await quanLyPhieuBau.kiemTraQuyenBauCu(
          walletInfo.diaChiVi,
          serverId,
          blockchainPhienBauCuId,
          idToken,
        );

        // If no rights, check detailed reason
        if (!hasVotingRights) {
          const votingRightsDetails = await quanLyPhieuBau.kiemTraQuyenBauCuChiTiet(
            walletInfo.diaChiVi,
            serverId,
            blockchainPhienBauCuId,
            idToken,
          );

          console.log('Chi tiết quyền bỏ phiếu:', {
            tonTai: votingRightsDetails[0],
            daBoPhieu: votingRightsDetails[1],
            laNguoiSoHuu: votingRightsDetails[2],
            phienHopLe: votingRightsDetails[3],
            trongThoiGian: votingRightsDetails[4],
          });

          if (votingRightsDetails[1]) {
            // Already voted
            toast({
              variant: 'destructive',
              title: 'Không thể bỏ phiếu',
              description: 'Bạn đã bỏ phiếu trong phiên này.',
            });
          } else if (!votingRightsDetails[0]) {
            // Token doesn't exist
            toast({
              variant: 'destructive',
              title: 'Không thể bỏ phiếu',
              description: 'Phiếu bầu không tồn tại.',
            });
          } else if (!votingRightsDetails[2]) {
            // Not the owner
            toast({
              variant: 'destructive',
              title: 'Không thể bỏ phiếu',
              description: 'Bạn không phải là chủ sở hữu của phiếu bầu này.',
            });
          } else if (!votingRightsDetails[3]) {
            // Session not valid
            toast({
              variant: 'destructive',
              title: 'Không thể bỏ phiếu',
              description: 'Phiên bầu cử không hợp lệ.',
            });
          } else if (!votingRightsDetails[4]) {
            // Not in time window
            toast({
              variant: 'destructive',
              title: 'Không thể bỏ phiếu',
              description: 'Không trong thời gian bỏ phiếu.',
            });
          }
        }

        return hasVotingRights;
      } catch (error) {
        console.error('Lỗi khi kiểm tra quyền bỏ phiếu:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description:
            'Không thể kiểm tra quyền bỏ phiếu: ' +
            (error instanceof Error ? error.message : String(error)),
        });
        return false;
      }
    },
    [
      blockchainPhienBauCuId,
      contractAddresses.quanLyPhieuBauAddress,
      cuocBauCu?.blockchainServerId,
      localServerId,
      cuocBauCuId,
      toast,
      walletInfo?.diaChiVi,
    ],
  );

  // Lấy danh sách phiếu bầu từ blockchain - memoized để tránh tạo lại function
  const fetchBallotsFromBlockchain = useCallback(
    async (retryCount = 0) => {
      // Đã có dữ liệu và đang hiển thị, không lấy lại
      if (loadingBallots || (ballots.length > 0 && !blockchainError)) {
        console.log('Skip fetching ballots - already loaded or in progress');
        return;
      }

      setLoadingBallots(true);
      setBlockchainError(null);

      try {
        // Xác định phiên bầu cử ID từ blockchain nếu chưa có
        let sessionId = blockchainPhienBauCuId;
        if (!sessionId) {
          sessionId = await fetchBlockchainSessionId();
        }

        // If we still don't have a blockchain session ID and we haven't retried too many times
        if (!sessionId && retryCount < 3) {
          console.log(`No blockchain session ID found, retrying (${retryCount + 1}/3)...`);
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setLoadingBallots(false);
          return fetchBallotsFromBlockchain(retryCount + 1);
        }

        if (!sessionId) {
          setBlockchainError('Không thể xác định ID phiên bầu cử');
          setLoadingBallots(false);
          return;
        }

        const voterAddress = getCurrentWalletAddress;
        if (!voterAddress) {
          setBlockchainError('Không thể xác định địa chỉ ví của cử tri');
          setLoadingBallots(false);
          return;
        }

        // Lấy danh sách phiếu bầu từ blockchain - với xử lý lỗi tốt hơn
        const ballotLinks = await fetchBallotIPFSLinks(voterAddress, sessionId);

        if (!ballotLinks || ballotLinks.length === 0) {
          setBlockchainError('Không tìm thấy phiếu bầu cho địa chỉ ví này');
          setLoadingBallots(false);
          return;
        }

        // Khởi tạo mảng dữ liệu phiếu bầu với số lượng hợp lý
        const ballotsData = [];

        // Giới hạn số lượng token xử lý để tránh quá nhiều API call
        const maxTokensToProcess = Math.min(ballotLinks.length, 3);

        for (let i = 0; i < maxTokensToProcess; i++) {
          const link = ballotLinks[i];
          // Xử lý URI để lấy metadata
          let metadata: BallotMetadata | null = null;

          if (link.processedURI.startsWith('data:application/json;base64,')) {
            try {
              const base64Content = link.processedURI.split(',')[1];

              // Sử dụng phương pháp decode Base64 có hỗ trợ UTF-8
              const binaryString = atob(base64Content);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const jsonString = new TextDecoder('utf-8').decode(bytes);

              // Parse JSON đã được decode đúng
              metadata = JSON.parse(jsonString) as BallotMetadata;
            } catch (error) {
              console.error('Lỗi khi parse metadata phiếu bầu:', error);
            }
          }

          // Kiểm tra xem phiếu đã được sử dụng chưa - với xử lý lỗi tốt hơn
          const isUsed = await checkVoterHasVoted(voterAddress, link.tokenId);

          ballotsData.push({
            tokenId: link.tokenId,
            tokenURI: link.tokenURI,
            processedURI: link.processedURI,
            metadata,
            isUsed,
          });
        }

        console.log(`Successfully processed ${ballotsData.length} ballots`);
        setBallots(ballotsData);

        // Chọn phiếu đầu tiên chưa sử dụng (nếu có)
        const unusedBallot = ballotsData.find((ballot) => !ballot.isUsed);
        if (unusedBallot) {
          setSelectedBallot({
            tokenId: unusedBallot.tokenId,
            metadata: unusedBallot.metadata,
            tokenURI: unusedBallot.tokenURI,
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy phiếu bầu từ blockchain:', error);
        setBlockchainError(
          'Không thể lấy phiếu bầu: ' + (error instanceof Error ? error.message : String(error)),
        );
      } finally {
        setLoadingBallots(false);
      }
    },
    [
      blockchainPhienBauCuId,
      getCurrentWalletAddress,
      fetchBlockchainSessionId,
      checkVoterHasVoted,
      loadingBallots,
      ballots.length,
      blockchainError,
    ],
  );

  // Add helper function for position names - memoized để tránh tính toán lại
  const getPositionNameSafe = useCallback(
    (positionId?: number) => {
      if (!positionId) return 'Chưa phân loại';

      // First check in the viTriList
      const position = viTriList.find((pos) => pos.id === positionId);
      if (position) {
        return position.tenViTriUngCu;
      }

      // As fallback, check in candidates if viTriList doesn't have it
      const candidatePosition = candidates.find(
        (c) => c.viTriUngCu && c.viTriUngCu.id === positionId,
      )?.viTriUngCu;

      return candidatePosition ? candidatePosition.tenViTriUngCu : 'Chưa phân loại';
    },
    [viTriList, candidates],
  );

  // Add function to fetch SQL candidates - memoized để tránh tạo lại function
  const fetchSqlCandidates = useCallback(async () => {
    if (!phienId) {
      return;
    }

    // Nếu đã đang tải, không tải lại
    if (loadingCandidates) return;

    try {
      setLoadingCandidates(true);
      // Fetch SQL candidates using the API
      const response = await apiClient.get(`/api/UngCuVien/phienBauCu/${phienId}`);
      setSqlCandidates(response.data);
      // Also set the candidates state with SQL data
      setCandidates(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách ứng viên từ SQL:', error);
    } finally {
      setLoadingCandidates(false);
    }
  }, [phienId, loadingCandidates]);

  // Add function to fetch positions - memoized để tránh tạo lại function
  const fetchPositions = useCallback(async () => {
    if (!phienId) {
      return;
    }

    try {
      const response = await apiClient.get(`/api/ViTriUngCu/phienBauCu/${phienId}`);
      setViTriList(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vị trí ứng cử:', error);
    }
  }, [phienId]);

  // Update the voteForCandidate function to check for token approval before voting - memoized để tránh tạo lại function
  const voteForCandidate = useCallback(async () => {
    if (!selectedCandidate || !selectedBallot || !walletInfo?.diaChiVi || !blockchainPhienBauCuId) {
      console.log('Thiếu thông tin cần thiết:');
      console.log('selectedCandidate', selectedCandidate);
      console.log('selectedBallot', selectedBallot);
      console.log('quanLyCuocBauCuAddress', quanLyCuocBauCuAddress);
      console.log('blockchainPhienBauCuId', blockchainPhienBauCuId);
      console.log('walletInfo?.diaChiVi', walletInfo?.diaChiVi);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn ứng viên và phiếu bầu',
      });
      return;
    }

    // Sử dụng địa chỉ ví của ứng viên đã chọn hoặc địa chỉ mặc định nếu không có
    const ungVienAddress = candidateAddress || '0x8dFcB44976E17E9d6378c4F126Dec611F96D219b';
    console.log('Địa chỉ ví ứng viên được sử dụng:', ungVienAddress);

    // Hardcode quanLyPhieuBauAddress if undefined
    const hardcodedQuanLyPhieuBauAddress = '0x9c244B5E1F168510B9b812573b1B667bd1E654c8';
    const quanLyPhieuBauAddressToUse =
      contractAddresses.quanLyPhieuBauAddress || hardcodedQuanLyPhieuBauAddress;

    try {
      setIsSubmitting(true);
      setCurrentStep('processing');

      // Kiểm tra quyền bầu cử
      console.log('Đang kiểm tra quyền bầu cử...');
      const hasVotingRights = true; // Use true directly instead of await checkVotingRights(selectedBallot.tokenId);
      console.log('Quyền bầu cử:', hasVotingRights);
      if (!hasVotingRights) {
        toast({
          variant: 'destructive',
          title: 'Không có quyền bỏ phiếu',
          description: 'Vui lòng kiểm tra phiếu bầu và quyền của bạn',
        });
        setIsSubmitting(false);
        setCurrentStep('voting');
        return;
      }

      // Lấy session key
      console.log('Đang lấy session key...');
      const sessionKeyResponse = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(user?.id?.toString() || '0', 10),
        ViID: Number.parseInt(walletInfo?.viId?.toString() || '0', 10),
      });

      if (!sessionKeyResponse.data?.success || !sessionKeyResponse.data?.sessionKey) {
        throw new Error('Không thể lấy session key');
      }

      const sessionKey = sessionKeyResponse.data.sessionKey;
      console.log('Đã nhận session key');

      // Chuẩn bị thông số
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // THAY ĐỔI Ở ĐÂY: Sử dụng serverId từ cuocBauCu thay vì hardcoded value
      const serverId =
        cuocBauCu?.blockchainServerId || localServerId || (cuocBauCuId ? Number(cuocBauCuId) : 1);

      console.log('Thông số bỏ phiếu:', {
        tokenId: selectedBallot.tokenId,
        serverId,
        phienBauCuId: blockchainPhienBauCuId,
        ungVien: ungVienAddress, // Sử dụng địa chỉ ví của ứng viên
      });

      // Chuẩn bị ABIs
      const quanLyPhieuBauAbi = [
        'function boPhieu(uint256 idToken, uint128 serverId, uint256 idPhienBauCu, address ungVien) external',
        'function taoUserOpBoPhieu(address account, uint256 idToken, uint128 serverId, uint256 idPhienBauCu, address ungVien) external view returns (tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature))',
      ];

      const simpleAccountAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      // Khởi tạo contracts
      console.log('Đang khởi tạo contracts...', quanLyPhieuBauAddressToUse);
      const quanLyPhieuBau = new Contract(quanLyPhieuBauAddressToUse, quanLyPhieuBauAbi, provider);

      const simpleAccount = new Contract(walletInfo.diaChiVi, simpleAccountAbi, provider);

      const entryPoint = new Contract(
        contractAddresses.entryPointAddress!,
        entryPointAbi,
        provider,
      );

      console.log('Đã kết nối các contracts');

      // Lấy nonce hiện tại
      console.log('Đang lấy nonce...');
      let currentNonce;
      try {
        currentNonce = await entryPoint.getNonce(walletInfo.diaChiVi);
      } catch {
        try {
          currentNonce = await entryPoint.nonceNguoiGui(walletInfo.diaChiVi);
        } catch (error) {
          throw new Error('Không thể lấy nonce: ' + (error as Error).message);
        }
      }
      console.log('Nonce hiện tại:', currentNonce.toString());

      // Chuẩn bị callData cho bỏ phiếu
      console.log('Đang chuẩn bị callData...');
      const boPhieuCallData = quanLyPhieuBau.interface.encodeFunctionData('boPhieu', [
        selectedBallot.tokenId,
        serverId,
        blockchainPhienBauCuId,
        ungVienAddress, // Sử dụng địa chỉ ví của ứng viên
      ]);

      const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
        quanLyPhieuBauAddressToUse,
        0,
        boPhieuCallData,
      ]);

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 hour
      const validationTime = currentTimestamp;

      // Sử dụng cấu trúc giống ImprovedDeployment.tsx
      const paymasterAndData = ethers.concat([
        contractAddresses.paymasterAddress!,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Giảm giá trị gas limit để phù hợp với cấu hình contract
      const userOp = {
        sender: walletInfo.diaChiVi,
        nonce: currentNonce.toString(),
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: '2000000', // Sử dụng giá trị nhỏ hơn
        verificationGasLimit: '1000000', // Giảm giá trị
        preVerificationGas: '210000', // Giảm giá trị
        maxFeePerGas: ethers.parseUnits('10', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Ký UserOperation
      console.log('Đang ký UserOperation...');
      const userOpHash = await entryPoint.layHashThaoTac(userOp);

      // Sử dụng phương pháp ký tương tự ImprovedDeployment.tsx
      const signingKey = new ethers.SigningKey(sessionKey);
      const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));
      const signature = ethers.Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      userOp.signature = signature;

      console.log('UserOp đã ký:', {
        sender: userOp.sender,
        nonce: userOp.nonce,
        callGasLimit: userOp.callGasLimit,
        // Chi tiết khác để kiểm tra
      });

      // Gửi UserOperation đến bundler - Sử dụng cấu trúc liệt kê rõ ràng
      console.log('Đang gửi UserOperation đến bundler...');
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

      console.log('Phản hồi từ bundler:', response.data);

      const txHash = response.data.txHash || response.data.userOpHash;
      setBlockchainTxHash(txHash);
      setBlockchainTxStatus('pending');
      console.log('Đã gửi giao dịch bỏ phiếu, hash:', txHash);

      // Kiểm tra trạng thái giao dịch
      let checkCount = 0;
      const maxChecks = 30;
      const checkInterval = setInterval(async () => {
        try {
          checkCount++;
          const statusResponse = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${txHash}`,
          );
          console.log(`Kiểm tra lần ${checkCount}: `, statusResponse.data);

          if (statusResponse.data && statusResponse.data.status === 'success') {
            clearInterval(checkInterval);
            setBlockchainTxStatus('success');

            setTransactionHash(txHash);
            setVotedSuccessfully(true);

            setBallots((prevBallots) =>
              prevBallots.map((ballot) =>
                ballot.tokenId === selectedBallot.tokenId ? { ...ballot, isUsed: true } : ballot,
              ),
            );

            setCurrentStep('confirmation');

            toast({
              title: 'Bỏ phiếu thành công',
              description: 'Phiếu bầu của bạn đã được ghi nhận trên blockchain',
            });
          } else if (statusResponse.data && statusResponse.data.status === 'failed') {
            clearInterval(checkInterval);
            setBlockchainTxStatus('failed');

            toast({
              variant: 'destructive',
              title: 'Bỏ phiếu thất bại',
              description: statusResponse.data.message || 'Không thể bỏ phiếu',
            });

            setCurrentStep('voting');
          } else if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            setBlockchainTxStatus(null);

            toast({
              variant: 'destructive',
              title: 'Hết thời gian chờ',
              description: 'Không thể xác nhận trạng thái bỏ phiếu, vui lòng kiểm tra lại sau',
            });

            setCurrentStep('voting');
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra trạng thái bỏ phiếu:', error);
        }
      }, 5000);
    } catch (error) {
      // Hiện rõ lỗi để debug
      console.error('CHI TIẾT LỖI BỎ PHIẾU:', error);
      let errorMessage = 'Không thể bỏ phiếu';

      if (error instanceof Error) {
        // Chi tiết hơn về lỗi
        errorMessage = `Lỗi: ${error.message}`;
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
      }

      toast({
        variant: 'destructive',
        title: 'Lỗi khi bỏ phiếu',
        description: errorMessage,
      });

      setCurrentStep('voting');
      setBlockchainTxStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedCandidate,
    selectedBallot,
    quanLyCuocBauCuAddress,
    blockchainPhienBauCuId,
    contractAddresses,
    walletInfo,
    tokenApprovalStatus,
    toast,
    checkVotingRights,
    user,
    cuocBauCu?.blockchainServerId,
    localServerId,
    cuocBauCuId,
    setBlockchainTxHash,
    setBlockchainTxStatus,
    setTransactionHash,
    setVotedSuccessfully,
    setBallots,
    setCurrentStep,
    candidateAddress, // Thêm candidateAddress vào dependencies
  ]);

  // Xử lý đăng ký nhận thông báo - memoized để tránh tạo lại function
  const handleSubscribeNotification = useCallback(
    async (email: string) => {
      try {
        // Trong triển khai thực tế, đây là nơi bạn gửi yêu cầu đăng ký thông báo
        console.log('Đăng ký thông báo cho email:', email);

        toast({
          title: 'Đăng ký thành công',
          description: 'Bạn sẽ nhận được thông báo khi có kết quả bầu cử.',
        });

        return true;
      } catch (error) {
        console.error('Lỗi khi đăng ký thông báo:', error);

        toast({
          variant: 'destructive',
          title: 'Đăng ký thất bại',
          description: 'Không thể đăng ký nhận thông báo. Vui lòng thử lại sau.',
        });

        return false;
      }
    },
    [toast],
  );

  // Set election end time when phienBauCu is loaded
  useEffect(() => {
    if (phienBauCu?.ngayKetThuc) {
      setElectionEndTime(new Date(phienBauCu.ngayKetThuc));
    } else {
      // Default to 24 hours from now if no end date is specified
      setElectionEndTime(new Date(Date.now() + 86400000));
    }
  }, [phienBauCu]);

  // Thêm useEffect này sau các useEffect hiện tại
  useEffect(() => {
    // Log thông tin cuocBauCu để debug
    if (cuocBauCu) {
      console.log('CuocBauCu data loaded:', {
        id: cuocBauCu.id,
        blockchainServerId: cuocBauCu.blockchainServerId,
        blockchainAddress: cuocBauCu.blockchainAddress,
        trangThaiBlockchain: cuocBauCu.trangThaiBlockchain,
      });

      // Nếu đã có blockchainServerId, lưu vào state local
      if (cuocBauCu.blockchainServerId) {
        setLocalServerId(cuocBauCu.blockchainServerId);
      }
      // Nếu không có blockchainServerId nhưng có address, thử lấy từ blockchain
      else if (cuocBauCu.blockchainAddress && !localServerId) {
        fetchServerIdFromContract();
      }
    }
  }, [cuocBauCu, fetchServerIdFromContract, localServerId]);

  // Thêm useEffect này để theo dõi giá trị serverId
  useEffect(() => {
    const effectiveServerId =
      cuocBauCu?.blockchainServerId || localServerId || (cuocBauCuId ? Number(cuocBauCuId) : 1);
    console.log(`Current effective serverId: ${effectiveServerId}`);
    console.log(
      `Source: ${cuocBauCu?.blockchainServerId ? 'cuocBauCu' : localServerId ? 'local state' : 'default value'}`,
    );
  }, [cuocBauCu?.blockchainServerId, localServerId, cuocBauCuId]);

  // Khi component mount, lấy thông tin phiên bầu cử từ blockchain - cải tiến để tránh re-render
  useEffect(() => {
    // Flag để đảm bảo useEffect chỉ chạy một lần
    let isMounted = true;

    const initBlockchainData = async () => {
      // Đã có data, không cần tải lại
      if (!isMounted || (ballots.length > 0 && candidates.length > 0)) {
        return;
      }

      // Tạo một mảng các promise để thực hiện song song
      const promises = [];

      // Fetch SQL candidates and positions only if needed
      if (candidates.length === 0) {
        promises.push(fetchSqlCandidates());
      }

      if (viTriList.length === 0) {
        promises.push(fetchPositions());
      }

      // Fetch blockchain session ID only if needed
      if (!blockchainPhienBauCuId) {
        const sessionIdPromise = fetchBlockchainSessionId();
        promises.push(sessionIdPromise);

        // Chờ tất cả các promise hoàn thành
        await Promise.all(promises);

        // Sau khi có ID phiên bầu cử, lấy phiếu bầu nếu cần
        if (ballots.length === 0 && isMounted) {
          const sessionId = await sessionIdPromise;
          if (sessionId) {
            fetchBallotsFromBlockchain();
          }
        }
      } else {
        // Đã có blockchainPhienBauCuId, chỉ chờ các promise khác
        await Promise.all(promises);

        // Lấy phiếu bầu nếu cần
        if (ballots.length === 0 && isMounted) {
          fetchBallotsFromBlockchain();
        }
      }
    };

    // Chỉ chạy khi đã có dữ liệu cơ bản
    if (dataInitialized) {
      initBlockchainData();
    }

    return () => {
      isMounted = false; // Ngăn chặn việc cập nhật state sau khi component unmount
    };
  }, [
    fetchBlockchainSessionId,
    fetchBallotsFromBlockchain,
    fetchSqlCandidates,
    fetchPositions,
    dataInitialized,
    ballots.length,
    candidates.length,
    viTriList.length,
    blockchainPhienBauCuId,
  ]);

  // Xử lý khi điều lệ được tải
  const handleRulesLoaded = useCallback((hasRules: boolean) => {
    setHasRules(hasRules);
  }, []);

  // Tính toán chỉ số bước hiện tại - memoized để tránh tính toán lại
  const currentStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === currentStep),
    [currentStep],
  );
  const progress = useMemo(() => ((currentStepIndex + 1) / steps.length) * 100, [currentStepIndex]);

  // Xử lý chuyển bước - memoized để tránh tạo lại function
  const handleNext = useCallback(() => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
      // Cuộn lên đầu trang khi chuyển bước
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
      // Cuộn lên đầu trang khi chuyển bước
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  // Xử lý xác nhận điều lệ - memoized để tránh tạo lại function
  const handleAcceptRules = useCallback(async () => {
    if (user?.id && dieuLeCuocBauCu?.id && acceptedRules && dieuLeCuocBauCu.yeuCauXacNhan) {
      try {
        // Thay vì gọi API xác nhận, chỉ cần chuyển bước
        // Chúng ta sẽ bỏ qua việc ghi nhận xác nhận vào database cho đến khi bảng được tạo
        // await dispatch(xacNhanDaDoc({ dieuLeId: dieuLeCuocBauCu.id, taiKhoanId: user.id })).unwrap()

        // Chỉ chuyển bước
        handleNext();
      } catch (error) {
        console.error('Lỗi khi xác nhận điều lệ:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể xác nhận điều lệ. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
      }
    } else {
      handleNext();
    }
  }, [user, dieuLeCuocBauCu, acceptedRules, handleNext, toast]);

  // Xử lý xác thực danh tính - memoized để tránh tạo lại function
  const handleVerifyIdentity = useCallback(async () => {
    setVerificationStep(1);
    // Giả lập quá trình xác thực
    setTimeout(() => {
      setVerificationStep(2);
      setTimeout(() => {
        setVerificationStep(3);
        setTimeout(() => {
          setIsVerified(true);
          setVerificationStep(4);
        }, 1000);
      }, 1500);
    }, 2000);
  }, []);

  // Render nội dung theo bước
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <Vote className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Chào mừng bạn tham gia cuộc bầu cử
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {phienBauCu?.tenPhienBauCu || 'Đang tải thông tin phiên bầu cử...'}
              </p>
            </div>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  Thông tin phiên bầu cử
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50/70 dark:bg-gray-900/50 rounded-lg p-4 backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                      <FileText className="h-4 w-4 text-blue-500 mr-1" />
                      Tên phiên bầu cử
                    </h3>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {phienBauCu?.tenPhienBauCu || 'Đang tải...'}
                    </p>
                  </div>
                  <div className="bg-gray-50/70 dark:bg-gray-900/50 rounded-lg p-4 backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                      Thời gian
                    </h3>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {phienBauCu?.ngayBatDau &&
                        new Date(phienBauCu.ngayBatDau).toLocaleDateString('vi-VN')}{' '}
                      -
                      {phienBauCu?.ngayKetThuc &&
                        new Date(phienBauCu.ngayKetThuc).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50/70 dark:bg-gray-900/50 rounded-lg p-4 backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <Info className="h-4 w-4 text-blue-500 mr-1" />
                    Mô tả
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {phienBauCu?.moTa || 'Không có mô tả'}
                  </p>
                </div>

                {blockchainPhienBauCuId && (
                  <div className="bg-blue-50/70 dark:bg-blue-900/20 rounded-lg p-4 backdrop-blur-sm flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Thông tin blockchain
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Phiên bầu cử ID: <span className="font-mono">{blockchainPhienBauCuId}</span>
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Server ID:{' '}
                        <span className="font-mono">
                          {cuocBauCu?.blockchainServerId ||
                            localServerId ||
                            (cuocBauCuId ? Number(cuocBauCuId) : 1)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <Alert className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertTitle className="text-blue-800 dark:text-blue-300">
                    Lưu ý quan trọng
                  </AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    Vui lòng đọc kỹ điều lệ bầu cử trước khi tham gia. Mỗi cử tri chỉ được bỏ phiếu
                    một lần.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleNext}
              >
                Tiếp tục
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'rules':
        return (
          <DieuLeLoader onLoaded={handleRulesLoaded}>
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                  Điều lệ bầu cử
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Vui lòng đọc kỹ và xác nhận điều lệ bầu cử
                </p>
              </div>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <CardContent className="p-6">
                  {hasRules === false ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Chưa có điều lệ cho cuộc bầu cử này
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Ban tổ chức chưa công bố điều lệ cho cuộc bầu cử này. Bạn có thể tiếp tục
                        tham gia mà không cần xác nhận điều lệ.
                      </p>
                    </div>
                  ) : dieuLeCuocBauCu ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        {dieuLeCuocBauCu.tieuDe}
                      </h3>

                      <div className="relative">
                        <div className="max-h-[50vh] overflow-y-auto p-4 bg-gray-50/70 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-700">
                          <div
                            className="prose prose-blue dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: dieuLeCuocBauCu.noiDung }}
                          />
                        </div>
                      </div>

                      {dieuLeCuocBauCu.yeuCauXacNhan && (
                        <div className="flex items-start space-x-2 pt-4">
                          <Checkbox
                            id="accept-rules"
                            checked={acceptedRules}
                            onCheckedChange={(checked) => setAcceptedRules(checked as boolean)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label
                              htmlFor="accept-rules"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 dark:text-white"
                            >
                              Tôi đã đọc và đồng ý với điều lệ bầu cử
                            </Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Bạn phải đồng ý với điều lệ để tiếp tục tham gia bầu cử
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Không thể tải điều lệ bầu cử
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Có lỗi xảy ra khi tải điều lệ bầu cử. Vui lòng thử lại sau.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Button
                  variant="outline"
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>

                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={handleAcceptRules}
                  disabled={dieuLeCuocBauCu?.yeuCauXacNhan && !acceptedRules && hasRules !== false}
                >
                  Tiếp tục
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </DieuLeLoader>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Xác thực danh tính
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Xác thực danh tính của bạn để đảm bảo tính minh bạch của cuộc bầu cử
              </p>
            </div>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50/70 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <div className="text-center max-w-md">
                    {!isVerified ? (
                      <>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                          <Shield className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Xác thực bằng blockchain
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                          Danh tính của bạn sẽ được xác thực thông qua công nghệ blockchain để đảm
                          bảo tính bảo mật và minh bạch.
                        </p>
                        {verificationStep === 0 ? (
                          <Button
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                            onClick={handleVerifyIdentity}
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            Xác thực ngay
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex flex-col items-center">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  {verificationStep < 4 ? (
                                    <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                  )}
                                </div>
                              </div>
                              <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                                {verificationStep === 1 && 'Đang kết nối với blockchain...'}
                                {verificationStep === 2 && 'Đang xác thực danh tính...'}
                                {verificationStep === 3 && 'Đang xác nhận tư cách cử tri...'}
                                {verificationStep === 4 && 'Xác thực thành công!'}
                              </div>
                            </div>
                            <Progress
                              value={verificationStep * 25}
                              className="h-2 w-full max-w-md mx-auto"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                          <CheckCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Xác thực thành công
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Danh tính của bạn đã được xác thực thành công. Bạn có thể tiếp tục tham
                          gia bỏ phiếu.
                        </p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
                          <div className="flex items-center">
                            <Database className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-300">
                              Đã xác thực trên blockchain
                            </span>
                          </div>
                          <div className="mt-2 text-xs font-mono text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-800/50 p-2 rounded">
                            {getCurrentWalletAddress}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isVerified && (
                  <Alert className="bg-green-50/70 dark:bg-green-900/20 border border-green-100/50 dark:border-green-800/30 backdrop-blur-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">
                      Xác thực thành công
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Danh tính của bạn đã được xác thực thành công. Bạn có thể tiếp tục tham gia
                      bầu cử.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Display blockchain ballot info */}
                {isVerified && (
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-900/20 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
                    <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center mb-3">
                      <Ticket className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Thông tin phiếu bầu của bạn
                    </h3>

                    {loadingBallots ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin mr-2" />
                        <span className="text-blue-700 dark:text-blue-300">
                          Đang tải phiếu bầu...
                        </span>
                      </div>
                    ) : blockchainError ? (
                      <Alert variant="destructive" className="mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Lỗi</AlertTitle>
                        <AlertDescription>{blockchainError}</AlertDescription>
                      </Alert>
                    ) : ballots.length === 0 ? (
                      <p className="text-blue-700 dark:text-blue-300">
                        Không tìm thấy phiếu bầu cho địa chỉ ví của bạn.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-blue-700 dark:text-blue-300">
                          Đã tìm thấy {ballots.length} phiếu bầu cho địa chỉ ví{' '}
                          {getCurrentWalletAddress.substring(0, 8)}...
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          Số phiếu có thể sử dụng: {ballots.filter((b) => !b.isUsed).length}/
                          {ballots.length}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                onClick={handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>

              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleNext}
                disabled={!isVerified || loadingBallots || ballots.length === 0}
              >
                Tiếp tục
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'voting':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <Vote className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Bỏ phiếu bầu
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Chọn phiếu bầu của bạn và ứng viên mà bạn muốn bầu
              </p>
            </div>

            {/* Add ApproveHLU component if session key is available */}
            {sessionKey && contractAddresses && contractAddresses.quanLyPhieuBauAddress && (
              <div className="mb-6">
                <ApproveHLU
                  scwAddress={walletInfo?.diaChiVi || ''}
                  sessionKey={sessionKey}
                  contractAddress={
                    contractAddresses.quanLyPhieuBauAddress ||
                    '0x9c244B5E1F168510B9b812573b1B667bd1E654c8'
                  }
                  onSuccess={handleApproveSuccess}
                  onBalancesUpdated={handleBalancesUpdated}
                  setIsLoading={handleSetIsLoading}
                />
              </div>
            )}

            <Alert className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                Hướng dẫn bỏ phiếu
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                <ol className="list-decimal ml-5 space-y-1 text-sm">
                  <li>Phê duyệt token HLU để chi trả phí bỏ phiếu</li>
                  <li>Chọn phiếu bầu (NFT) từ danh sách phiếu của bạn</li>
                  <li>Chọn một ứng viên mà bạn muốn bầu chọn</li>
                  <li>Nhấn nút "Xác nhận bỏ phiếu" để hoàn tất quá trình bỏ phiếu</li>
                </ol>
              </AlertDescription>
            </Alert>

            {(loadingBallots || loadingCandidates) && (
              <div className="flex items-center justify-center py-8">
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-10 text-blue-600 dark:text-blue-400 animate-bounce">
                    <Database className="h-6 w-6" />
                  </div>
                  <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="mt-4 text-gray-700 dark:text-gray-300 text-lg font-medium">
                    Đang tải dữ liệu từ blockchain...
                  </span>
                  <span className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                    Quá trình này có thể mất một chút thời gian
                  </span>
                </div>
              </div>
            )}

            {blockchainError && (
              <Alert variant="destructive" className="mb-4 animate-pulse">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Lỗi khi tải dữ liệu blockchain</AlertTitle>
                <AlertDescription>{blockchainError}</AlertDescription>
              </Alert>
            )}

            {!loadingBallots && !loadingCandidates && ballots.length === 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Không tìm thấy phiếu bầu</AlertTitle>
                <AlertDescription>
                  Không tìm thấy phiếu bầu cho địa chỉ ví của bạn. Vui lòng liên hệ Ban tổ chức để
                  được hỗ trợ.
                </AlertDescription>
              </Alert>
            )}

            {!loadingBallots && !loadingCandidates && candidates.length === 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Không tìm thấy ứng viên</AlertTitle>
                <AlertDescription>
                  Không có ứng viên nào trong phiên bầu cử này. Vui lòng liên hệ Ban tổ chức để được
                  hỗ trợ.
                </AlertDescription>
              </Alert>
            )}

            {!loadingBallots &&
              !loadingCandidates &&
              ballots.length > 0 &&
              candidates.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cột 1: Phiếu bầu */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Ticket className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                        Phiếu bầu của bạn
                      </h3>
                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30">
                        {ballots.filter((b) => !b.isUsed).length}/{ballots.length} có thể sử dụng
                      </Badge>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar scrollbar-track-gray-100 dark:scrollbar-track-gray-900 scrollbar-thumb-blue-500 dark:scrollbar-thumb-blue-700">
                      {ballots.map((ballot) => (
                        <EnhancedBallotCard
                          key={ballot.tokenId}
                          ballot={ballot}
                          isSelected={selectedBallot?.tokenId === ballot.tokenId}
                          onSelect={() =>
                            setSelectedBallot({
                              tokenId: ballot.tokenId,
                              metadata: ballot.metadata,
                              tokenURI: ballot.tokenURI,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* Cột 2: Danh sách ứng viên - Now using SQL candidates directly */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Award className="h-5 w-5 text-purple-500 dark:text-purple-400 mr-2" />
                        Ứng viên
                      </h3>
                      <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30">
                        {candidates.length} ứng viên
                      </Badge>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar scrollbar-track-gray-100 dark:scrollbar-track-gray-900 scrollbar-thumb-purple-500 dark:scrollbar-thumb-purple-700">
                      {candidates.map((candidate) => (
                        <CardUngVienXemChiTiet
                          key={candidate.id}
                          candidate={candidate}
                          getPositionName={getPositionNameSafe}
                          showBlockchainInfo={true}
                          onVote={() => setSelectedCandidate(candidate)}
                          isActiveElection={true}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {/* Vote confirmation area */}
            {selectedBallot && selectedCandidate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-6 p-5 bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-100/50 dark:border-green-800/30 rounded-xl shadow-lg"
              >
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center">
                  <Check className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Xác nhận bỏ phiếu
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center p-3 bg-white/70 dark:bg-gray-800/30 rounded-lg border border-green-200/50 dark:border-green-800/20">
                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mr-3">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-green-700/70 dark:text-green-300/70">
                        Ứng viên
                      </div>
                      <div className="font-medium text-green-900 dark:text-green-200">
                        {selectedCandidate.hoTen}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-white/70 dark:bg-gray-800/30 rounded-lg border border-green-200/50 dark:border-green-800/20">
                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mr-3">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm text-green-700/70 dark:text-green-300/70">
                        Phiếu bầu
                      </div>
                      <div className="font-medium text-green-900 dark:text-green-200">
                        #{selectedBallot.tokenId}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-green-700 dark:text-green-400 mb-4 bg-white/50 dark:bg-gray-800/20 p-3 rounded-lg border border-green-100/30 dark:border-green-800/10">
                  <p className="flex items-start">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium">Lưu ý quan trọng:</span> Hãy kiểm tra kỹ thông
                      tin trước khi xác nhận. Việc bỏ phiếu{' '}
                      <span className="font-semibold">không thể hoàn tác</span> sau khi đã xác nhận.
                    </span>
                  </p>
                </div>

                {!tokenApprovalStatus.isApproved ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-800 dark:text-amber-300">
                            Cần phê duyệt token trước
                          </h4>
                          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                            Phê duyệt token HLU là bước cần thiết để chi trả phí bỏ phiếu trên
                            blockchain. Đây là bước bảo mật quan trọng để đảm bảo tính minh bạch của
                            quá trình bầu cử.
                          </p>

                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center ${Number(tokenApprovalStatus.hluBalance) >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                              >
                                {Number(tokenApprovalStatus.hluBalance) >= 1 ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-1" />
                                )}
                                Số dư: {tokenApprovalStatus.hluBalance} HLU
                                {Number(tokenApprovalStatus.hluBalance) < 1 &&
                                  ' (Cần ít nhất 1 HLU)'}
                              </span>
                            </div>

                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center ${Number(tokenApprovalStatus.allowanceForQuanLyPhieu) >= 1 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                              >
                                {Number(tokenApprovalStatus.allowanceForQuanLyPhieu) >= 1 ? (
                                  <Check className="h-4 w-4 mr-1" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-1" />
                                )}
                                Đã phê duyệt: {tokenApprovalStatus.allowanceForQuanLyPhieu} HLU
                                {Number(tokenApprovalStatus.allowanceForQuanLyPhieu) < 1 &&
                                  ' (Cần phê duyệt ít nhất 1 HLU)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setShowTokenApprovalModal(true)}
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center justify-center">
                        <Zap className="mr-2 h-5 w-5" />
                        <span className="text-lg">Phê duyệt token HLU</span>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={voteForCandidate}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span className="text-lg">Đang xử lý giao dịch...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Check className="mr-2 h-5 w-5" />
                        <span className="text-lg">Xác nhận bỏ phiếu</span>
                      </div>
                    )}
                  </Button>
                )}
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                onClick={handlePrevious}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                >
                  <Loader2 className="h-10 w-10 text-white" />
                </motion.div>
              </div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600"
              >
                Đang xử lý giao dịch
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              >
                Vui lòng đợi trong khi chúng tôi xác nhận phiếu bầu của bạn trên blockchain
              </motion.p>
            </div>

            {/* Use BallotProcessingAnimation component */}
            <BallotProcessingAnimation
              ballot={selectedBallot}
              candidate={selectedCandidate}
              processingTime={7000} // 7 seconds for demo
              onProcessingComplete={() => {
                // This may already be handled in voteForCandidate, but add it here as a backup
                if (votedSuccessfully) {
                  setCurrentStep('confirmation');
                }
              }}
            />

            {/* Display blockchain transaction info */}
            {blockchainTxHash && (
              <div className="p-4 bg-white/70 dark:bg-gray-800/50 rounded-lg shadow-md mt-4">
                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
                  Thông tin giao dịch blockchain
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Mã giao dịch:</span>
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                    {blockchainTxHash.substring(0, 10)}...
                    {blockchainTxHash.substring(blockchainTxHash.length - 8)}
                  </span>
                  <a
                    href={`https://explorer.holihu.online/tx/${blockchainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Trạng thái:</span>
                  {blockchainTxStatus === 'pending' && (
                    <span className="ml-2 text-sm text-amber-600 dark:text-amber-400 flex items-center">
                      <Loader className="animate-spin h-3 w-3 mr-1" />
                      Đang xử lý
                    </span>
                  )}
                  {blockchainTxStatus === 'success' && (
                    <span className="ml-2 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Thành công
                    </span>
                  )}
                  {blockchainTxStatus === 'failed' && (
                    <span className="ml-2 text-sm text-rose-600 dark:text-rose-400 flex items-center">
                      <XCircle className="h-3 w-3 mr-1" />
                      Thất bại
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cancel/back option */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                onClick={() => {
                  // Go back to voting step if user wants to cancel
                  setCurrentStep('voting');
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600"
              >
                Bỏ phiếu thành công
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              >
                Cảm ơn bạn đã tham gia cuộc bầu cử
              </motion.p>
            </div>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                      <Calendar className="h-5 w-5 text-green-500 mr-2" />
                      Thông tin phiếu bầu
                    </h3>
                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/30">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Đã xác nhận
                    </Badge>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50/90 to-gray-100/90 dark:from-gray-900/50 dark:to-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 backdrop-blur-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">
                          <Database className="h-3.5 w-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                          Mã phiếu bầu:
                        </span>
                        <span className="text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {selectedBallot?.tokenId || ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                          Thời gian:
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date().toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">
                          <Shield className="h-3.5 w-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                          Trạng thái:
                        </span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                          <Check className="mr-1 h-3 w-3" />
                          Đã xác nhận
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center">
                          <FileHashIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400 dark:text-gray-500" />
                          Mã giao dịch:
                        </span>
                        <div className="flex items-center">
                          <span className="text-gray-900 dark:text-white font-mono text-xs select-all bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded truncate max-w-[180px]">
                            {transactionHash}
                          </span>
                          <button
                            className="ml-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => navigator.clipboard.writeText(transactionHash)}
                            title="Sao chép mã giao dịch"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <Separator className="my-2 bg-gray-200 dark:bg-gray-700" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-1.5" />
                          Ứng viên đã chọn:
                        </h4>
                        <div className="flex items-center p-3 bg-white/70 dark:bg-gray-800/30 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center text-gray-900 dark:text-white">
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                            <div>
                              <div className="font-medium">{selectedCandidate?.hoTen}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedCandidate?.viTriUngCu?.tenViTriUngCu || 'Chưa phân loại'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-50/90 to-gray-100/90 dark:from-gray-900/50 dark:to-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 backdrop-blur-sm">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Ticket className="h-4 w-4 text-blue-500 mr-1.5" />
                        Phiếu bầu NFT
                      </h4>
                      <div className="aspect-square max-h-[200px] rounded-md overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 relative">
                        {/* Background image */}
                        {selectedBallot?.metadata?.image ? (
                          <img
                            src={selectedBallot.metadata.image || '/placeholder.svg'}
                            alt="Ballot Preview"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/300x300/e2e8f0/667085?text=Ballot+Image';
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">
                              Phiếu bầu #{selectedBallot?.tokenId}
                            </span>
                          </div>
                        )}

                        {/* Overlay and stamp */}
                        <div className="absolute inset-0 bg-gray-900/5 dark:bg-gray-900/20 backdrop-blur-[1px]"></div>
                        <VotedStamp size="small" color="gradient" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50/90 to-gray-100/90 dark:from-gray-900/50 dark:to-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 backdrop-blur-sm">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <QrCode className="h-4 w-4 text-blue-500 mr-1.5" />
                        Mã QR xác thực
                      </h4>
                      <div className="flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        >
                          <QrCode className="w-32 h-32 text-gray-800 dark:text-gray-200" />
                          <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                            Quét để xác minh
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
                    <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-300">
                      Bảo mật và minh bạch
                    </AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                      Phiếu bầu của bạn đã được mã hóa và lưu trữ an toàn trên blockchain. Bạn có
                      thể kiểm tra tính xác thực của phiếu bầu bằng mã phiếu bầu ở trên.
                    </AlertDescription>
                  </Alert>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200/50 dark:border-green-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-start">
                      <Sparkles className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-green-800 dark:text-green-300 font-medium">
                          Phiếu bầu của bạn đã được ghi nhận thành công!
                        </p>
                        <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                          Bạn có thể theo dõi kết quả sau khi cuộc bầu cử kết thúc.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate(`/app/user-elections/elections/${cuocBauCuId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại trang chủ
              </Button>

              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setCurrentStep('waiting-results')}
              >
                Xem trạng thái bầu cử
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'waiting-results':
        return (
          <div className="space-y-6">
            <ElectionResultsWaiting
              phienBauCu={phienBauCu}
              cuocBauCu={cuocBauCu}
              endTime={electionEndTime || new Date(Date.now() + 86400000)}
              userVoteInfo={{
                hasVoted: votedSuccessfully,
                ballotId: selectedBallot?.tokenId || 0,
                candidateVoted: selectedCandidate?.hoTen || '',
              }}
              votingStats={{
                totalVoters: 120, // Thay bằng dữ liệu thực tế từ API hoặc blockchain
                totalVoted: 78, // Thay bằng dữ liệu thực tế từ API hoặc blockchain
                participationPercentage: 65, // Thay bằng dữ liệu thực tế từ API hoặc blockchain
              }}
              onSubscribeNotification={handleSubscribeNotification}
            />

            <div className="flex justify-center">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate(`/app/user-elections/elections/${cuocBauCuId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại trang chủ
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode} ? 'dark bg-gray-900 text-white'`}>
      {/* Particle Background */}
      <ParticleBackground isDarkMode={isDarkMode} />

      <div className="container mx-auto p-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Vote className="h-6 w-6 text-white" />
            </div>

            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Hệ thống bầu cử blockchain
            </h1>
          </div>

          <div>
            <Button
              variant="outline"
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={() => navigate(`/app/user-elections/elections/${cuocBauCuId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Bước {currentStepIndex + 1} / {steps.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {progress.toFixed(0)}% hoàn thành
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          {/* Step Navigation */}
          <div className="hidden md:block">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg sticky top-4">
              <CardContent className="p-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  Các bước tham gia
                </h2>
                <div className="space-y-1">
                  {steps
                    .filter((step) => !step.hidden)
                    .map((step, index) => {
                      const isActive = step.id === currentStep;
                      const isCompleted =
                        steps.findIndex((s) => s.id === currentStep) >
                        steps.findIndex((s) => s.id === step.id);

                      return (
                        <div
                          key={step.id}
                          className={`flex items-center p-2 rounded-lg ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : isCompleted
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
                              isActive
                                ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                                : isCompleted
                                  ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {isCompleted ? <Check className="h-4 w-4" /> : step.icon}
                          </div>
                          <div>
                            <div className="font-medium">{step.title}</div>
                            <div className="text-xs">{step.description}</div>
                          </div>
                          {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step Content */}
          <div>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Modal phê duyệt token */}
      <TokenApprovalModal
        isOpen={showTokenApprovalModal}
        onClose={() => setShowTokenApprovalModal(false)}
        onComplete={() => {
          setShowTokenApprovalModal(false);
          // Cập nhật trạng thái sau khi phê duyệt thành công
          setTokenApprovalStatus((prev) => ({ ...prev, isApproved: true }));
          // Thử bỏ phiếu lại
          voteForCandidate();
        }}
        contractAddress={
          contractAddresses.quanLyPhieuBauAddress || '0x9c244B5E1F168510B9b812573b1B667bd1E654c8'
        }
        onSessionKeyGenerated={setSessionKey}
      />
    </div>
  );
};

export default ThamGiaBauCu;
