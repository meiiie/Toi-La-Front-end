import { useState, useEffect, useCallback, useMemo } from 'react';
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
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import apiClient from '../api/apiClient';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  RefreshCw,
  Award,
  User,
  Activity,
  CheckCircle,
  AlertTriangle,
  Search,
  Calendar,
  ArrowRight,
  X,
  Zap,
  Eye,
  FileText,
  ExternalLink,
  Layers,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Info,
  Loader,
  Check,
  Server,
  Cpu,
  HelpCircle,
} from 'lucide-react';

// UI components
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { Progress } from '../components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alter';
import { Input } from '../components/ui/Input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/Tooltip';
import { ScrollArea } from '../components/ui/ScrollArea';

// Redux
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { RootState } from '../store/store';
import { useToast } from '../test/components/use-toast';

// Các màu dùng cho biểu đồ
const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#6366F1', // indigo-500
  '#EC4899', // pink-500
  '#8B5CF6', // violet-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#06B6D4', // cyan-500
  '#EF4444', // red-500
];

// Gradient colors for elected candidates
const ELECTED_GRADIENTS = [
  ['#3B82F6', '#2563EB'], // blue-500 to blue-600
  ['#10B981', '#059669'], // emerald-500 to emerald-600
  ['#8B5CF6', '#7C3AED'], // violet-500 to violet-600
  ['#EC4899', '#DB2777'], // pink-500 to pink-600
];

const CHART_TYPES = {
  BAR: 'bar',
  PIE: 'pie',
  RADAR: 'radar',
  RADIALBAR: 'radialbar',
};

// ABI tối thiểu cho các contract
const cuocBauCuAbi = [
  'function layKetQuaPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory ungVien, uint256[] memory soPhieu)',
  'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool dangHoatDongNe, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, uint256 soCuTriToiDa, uint256 soUngVienHienTai, uint256 soCuTriHienTai, address[] memory ungVienDacCu, bool taiBauCu, uint256 soLuongXacNhan, uint256 thoiGianHetHanXacNhan)',
  'function layThongTinCoBan(uint256 idCuocBauCu) external view returns (address nguoiSoHuu, bool dangHoatDongDay, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, string memory tenCuocBauCu, uint256 phiHLU)',
  'function laySoPhieuUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien) external view returns (uint256)',
  'function layDanhSachUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory)',
  'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
  'function layDanhSachCuocBauCu(uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
  'function laySoCuocBauCu() external view returns (uint256)',
];

const FALLBACK_RPC_URL = 'https://geth.holihu.online/rpc';
const FALLBACK_WSS_URL = 'wss://geth.holihu.online/ws';

// Thời gian cập nhật dữ liệu tự động (15 giây)
const AUTO_REFRESH_INTERVAL = 15000;

// Fallback contract addresses
const CONTRACT_ADDRESSES = {
  QuanLyCuocBauCu: '0x9d8cB9C2eD2EFedae3F7C660ceDCBBc90BA48dd8',
  QuanLyPhieuBauProxy: '0x9c244B5E1F168510B9b812573b1B667bd1E654c8',
};

// Kết quả bầu cử Component
const TrangKetQua = () => {
  const { id: cuocBauCuIdParam, idPhien: phienBauCuIdParam } = useParams<{
    id?: string;
    idPhien?: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Redux state
  const { cuocBauCu } = useSelector((state: RootState) => state.cuocBauCuById);
  const { cacPhienBauCu } = useSelector((state: RootState) => state.phienBauCu);

  // Các thông tin cơ bản
  const [contractAddresses, setContractAddresses] = useState(CONTRACT_ADDRESSES);
  const [cuocBauCuList, setCuocBauCuList] = useState<Array<{ id: number; ten: string }>>([]);
  const [cuocBauCuId, setCuocBauCuId] = useState(Number(cuocBauCuIdParam) || 1);
  const [danhSachPhien, setDanhSachPhien] = useState<
    Array<{
      id: number;
      isActive: boolean;
      startTime: Date;
      endTime: Date;
      candidateCount: number;
      voterCount: number;
    }>
  >([]);
  const [selectedPhien, setSelectedPhien] = useState<number | null>(
    phienBauCuIdParam ? Number(phienBauCuIdParam) : null,
  );

  // States cho dữ liệu
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<
    'initial' | 'elections' | 'sessions' | 'results'
  >('initial');
  const [isChangingSession, setIsChangingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [electionInfo, setElectionInfo] = useState<{
    name: string;
    owner: string;
    isActive: boolean;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    isActive: boolean;
    startTime: string;
    endTime: string;
    maxVoters: number;
    candidateCount: number;
    voterCount: number;
    electedCandidates: string[];
    reElection: boolean;
  } | null>(null);
  const [votingResults, setVotingResults] = useState<
    Array<{
      address: string;
      displayAddress: string;
      votes: number;
      percentage: number;
      isElected: boolean;
    }>
  >([]);
  const [progress, setProgress] = useState({
    total: 0,
    voted: 0,
    percentage: 0,
  });

  // State cho theo dõi real-time
  const [isMonitoring, setIsMonitoring] = useState(false);

  // UI States
  const [activeChartType, setActiveChartType] = useState<string>(CHART_TYPES.BAR);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determines if data is loaded successfully
  const hasData = useMemo(() => {
    return electionInfo && sessionInfo && votingResults.length > 0;
  }, [electionInfo, sessionInfo, votingResults]);

  // Check if the current mode is dark
  useEffect(() => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Lấy địa chỉ contract
  useEffect(() => {
    const fetchContractAddresses = async () => {
      try {
        const response = await apiClient.get('/api/Blockchain/contract-addresses');
        if (response.data) {
          setContractAddresses({
            ...CONTRACT_ADDRESSES,
            ...response.data,
            QuanLyCuocBauCu: response.data.QuanLyCuocBauCu || CONTRACT_ADDRESSES.QuanLyCuocBauCu,
            QuanLyPhieuBauProxy:
              response.data.QuanLyPhieuBauProxy || CONTRACT_ADDRESSES.QuanLyPhieuBauProxy,
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy địa chỉ contract:', error);
      }
    };

    fetchContractAddresses();
  }, []);

  // Lấy danh sách các cuộc bầu cử - Ưu tiên từ blockchain
  useEffect(() => {
    const fetchElectionList = async () => {
      try {
        setLoadingStage('elections');
        const provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);

        // Ưu tiên sử dụng Factory contract để lấy danh sách cuộc bầu cử
        let electionIds: number[] = [];
        let factoryUsed = false;

        try {
          // Thử sử dụng Factory contract
          const factoryContract = new ethers.Contract(
            contractAddresses.CuocBauCuFactory || '0x93e3b7720CAf68Fb4E4E0A9ca0152f61529D9900',
            [
              'function danhSachServer(uint256) view returns (address)',
              'function layTongSoServer() view returns (uint256)',
              'function layDanhSachServerID(uint256, uint256) view returns (uint256[] memory)',
            ],
            provider,
          );

          // Lấy tổng số server (cuộc bầu cử) từ Factory
          const totalServers = await factoryContract.layTongSoServer();

          if (Number(totalServers) > 0) {
            // Lấy danh sách ID từ Factory
            const serverIds = await factoryContract.layDanhSachServerID(
              0,
              Math.min(Number(totalServers), 20),
            );

            if (serverIds && serverIds.length > 0) {
              electionIds = serverIds.map((id) => Number(id));
              factoryUsed = true;
              console.log(`Đã lấy ${electionIds.length} ID cuộc bầu cử từ Factory Contract`);
            }
          }
        } catch (factoryError) {
          console.warn('Không thể lấy danh sách cuộc bầu cử từ Factory:', factoryError);
        }

        // Nếu không lấy được từ Factory, thử từ QuanLyCuocBauCu contract
        if (!factoryUsed) {
          try {
            const contract = new ethers.Contract(
              contractAddresses.QuanLyCuocBauCu,
              cuocBauCuAbi,
              provider,
            );

            // Lấy tổng số cuộc bầu cử
            const totalElections = await contract.laySoCuocBauCu();

            if (Number(totalElections) > 0) {
              // Lấy danh sách ID cuộc bầu cử
              const ids = await contract.layDanhSachCuocBauCu(
                0,
                Math.min(Number(totalElections), 20),
              );
              electionIds = ids.map((id) => Number(id));
              console.log(
                `Đã lấy ${electionIds.length} ID cuộc bầu cử từ QuanLyCuocBauCu Contract`,
              );
            }
          } catch (contractError) {
            console.error('Không thể lấy danh sách cuộc bầu cử từ QuanLyCuocBauCu:', contractError);
            electionIds = []; // Reset nếu có lỗi
          }
        }

        // Nếu vẫn không có ID nào, tạo một danh sách mặc định
        if (electionIds.length === 0) {
          console.warn(
            'Không thể lấy danh sách cuộc bầu cử từ blockchain, đang tạo danh sách mặc định',
          );
          electionIds = [1, 2, 3, 4]; // Các ID mặc định để thử
        }

        // Lấy thông tin chi tiết cho mỗi cuộc bầu cử
        const electionDataPromises = electionIds.map(async (id: number) => {
          try {
            // Lấy địa chỉ contract cho cuộc bầu cử này
            let contractAddress = contractAddresses.QuanLyCuocBauCu;

            if (factoryUsed) {
              try {
                const factoryContract = new ethers.Contract(
                  contractAddresses.CuocBauCuFactory ||
                    '0x93e3b7720CAf68Fb4E4E0A9ca0152f61529D9900',
                  ['function danhSachServer(uint256) view returns (address)'],
                  provider,
                );

                const serverAddress = await factoryContract.danhSachServer(id);

                if (serverAddress && serverAddress !== ethers.ZeroAddress) {
                  contractAddress = serverAddress;
                }
              } catch (addressError) {
                console.warn(`Không thể lấy địa chỉ cho server ID ${id}:`, addressError);
              }
            }

            const contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

            // Lấy thông tin cơ bản
            const basicInfo = await contract.layThongTinCoBan(id);

            return {
              id: Number(id),
              ten: basicInfo[4] || `Cuộc bầu cử #${id}`,
              isActive: basicInfo[1],
              startTime: new Date(Number(basicInfo[2]) * 1000),
              endTime: new Date(Number(basicInfo[3]) * 1000),
              blockchainAddress:
                contractAddress !== contractAddresses.QuanLyCuocBauCu ? contractAddress : undefined,
            };
          } catch (err) {
            console.warn(`Không thể lấy thông tin cho cuộc bầu cử ${id}:`, err);
            return {
              id: Number(id),
              ten: `Cuộc bầu cử #${id}`,
              isActive: false,
              startTime: new Date(),
              endTime: new Date(),
            };
          }
        });

        const electionsData = await Promise.all(electionDataPromises);
        // Lọc bỏ các cuộc bầu cử không hợp lệ
        const validElections = electionsData.filter(
          (election) => election.ten !== `Cuộc bầu cử #${election.id}` || election.isActive,
        );

        setCuocBauCuList(validElections.length > 0 ? validElections : electionsData);

        // Nếu không có ID cuộc bầu cử được chọn, chọn ID cuộc bầu cử đầu tiên
        if (!cuocBauCuIdParam && electionsData.length > 0) {
          setCuocBauCuId(electionsData[0].id);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách cuộc bầu cử từ blockchain:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi kết nối blockchain',
          description: 'Không thể kết nối đến blockchain để lấy danh sách cuộc bầu cử.',
        });
      }
    };

    if (contractAddresses.QuanLyCuocBauCu || contractAddresses.CuocBauCuFactory) {
      fetchElectionList();
    }
  }, [
    contractAddresses.QuanLyCuocBauCu,
    contractAddresses.CuocBauCuFactory,
    cuocBauCuIdParam,
    toast,
  ]);

  // Lấy thông tin cuộc bầu cử và phiên bầu cử từ Redux
  useEffect(() => {
    if (cuocBauCuId) {
      // Kiểm tra xem API endpoint có tồn tại không trước khi gọi
      try {
        apiClient
          .get(`/api/CuocBauCu/${cuocBauCuId}`)
          .then((response) => {
            if (response.data) {
              console.log('Lấy dữ liệu cuộc bầu cử từ API thành công:', response.data);
              // Xử lý dữ liệu nếu cần
            }
          })
          .catch((error) => {
            console.warn('API không tồn tại hoặc có lỗi, bỏ qua lấy dữ liệu từ SQL:', error);
            // Không dispatch để tránh lỗi 404
          });
      } catch (error) {
        console.warn('Lỗi khi kiểm tra API:', error);
      }
    }
  }, [cuocBauCuId]);

  // Lấy danh sách phiên bầu cử khi có cuocBauCuId
  useEffect(() => {
    if (!cuocBauCuId) return;

    const fetchPhienBauCu = async () => {
      try {
        setIsLoading(true);
        setLoadingStage('sessions');

        // Lấy thông tin từ blockchain - ưu tiên sử dụng blockchain thay vì SQL
        const provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);

        // Trước tiên, thử lấy thông tin cuộc bầu cử trực tiếp từ blockchain
        // Nếu có lỗi, sẽ sử dụng thông tin từ Redux (SQL) như một backup
        let contractAddress = contractAddresses.QuanLyCuocBauCu;
        let blockchainContractAddress = '';

        try {
          // Với Factory contract, chúng ta có thể lấy địa chỉ hợp đồng dựa trên ID
          const factoryContract = new ethers.Contract(
            contractAddresses.CuocBauCuFactory || '0x93e3b7720CAf68Fb4E4E0A9ca0152f61529D9900',
            ['function danhSachServer(uint256) view returns (address)'],
            provider,
          );

          // Thử lấy địa chỉ từ factory
          blockchainContractAddress = await factoryContract.danhSachServer(cuocBauCuId);

          if (blockchainContractAddress && blockchainContractAddress !== ethers.ZeroAddress) {
            contractAddress = blockchainContractAddress;
            console.log(`Đã lấy địa chỉ hợp đồng từ blockchain: ${contractAddress}`);
          }
        } catch (factoryError) {
          console.warn('Không thể lấy địa chỉ hợp đồng từ Factory:', factoryError);
          // Thử sử dụng địa chỉ từ Redux nếu có
          if (cuocBauCu?.blockchainAddress) {
            contractAddress = cuocBauCu.blockchainAddress;
            console.log(`Sử dụng địa chỉ từ SQL/Redux: ${contractAddress}`);
          }
        }

        {
          /* Bây giờ sử dụng địa chỉ contract đã xác định để lấy dữ liệu */
        }
        try {
          console.log(`Kết nối đến contract tại địa chỉ: ${contractAddress}`);
          const contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

          // Lấy thông tin cuộc bầu cử từ blockchain
          const electionData = await contract.layThongTinCoBan(cuocBauCuId);

          setElectionInfo({
            name: electionData[4],
            owner: electionData[0],
            isActive: electionData[1],
            startTime: new Date(Number(electionData[2]) * 1000).toLocaleString('vi-VN'),
            endTime: new Date(Number(electionData[3]) * 1000).toLocaleString('vi-VN'),
          });

          // Lấy danh sách phiên bầu cử từ blockchain
          const phienIds = await contract.layDanhSachPhienBauCu(cuocBauCuId, 0, 20);

          if (phienIds && phienIds.length > 0) {
            // Lấy thông tin chi tiết cho từng phiên
            const phienDetails = await Promise.all(
              phienIds.map(async (id: any) => {
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

            // Chọn phiên đầu tiên hoặc phiên được chỉ định
            if (!selectedPhien) {
              if (phienBauCuIdParam) {
                setSelectedPhien(Number(phienBauCuIdParam));
              } else if (phienDetails.length > 0) {
                const validPhien = phienDetails.find((p) => !p.error);
                if (validPhien) {
                  setSelectedPhien(validPhien.id);
                }
              }
            }
          }
        } catch (contractError) {
          console.error('Lỗi khi gọi contract:', contractError);
          throw contractError; // Ném lỗi để xử lý ở catch bên ngoài
        }

        // Cập nhật dữ liệu SQL nếu cần để đồng bộ
        if (
          !cuocBauCu ||
          (blockchainContractAddress && blockchainContractAddress !== cuocBauCu.blockchainAddress)
        ) {
          // Cập nhật thông tin SQL nhưng không phụ thuộc vào nó cho dữ liệu hiển thị
          dispatch(fetchCuocBauCuById(cuocBauCuId));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách phiên bầu cử từ blockchain:', error);
        setError(
          `Không thể lấy danh sách phiên bầu cử: ${error instanceof Error ? error.message : String(error)}`,
        );

        // Thử sử dụng dữ liệu từ SQL/Redux như phương án dự phòng
        try {
          if (!cuocBauCu) {
            await dispatch(fetchCuocBauCuById(cuocBauCuId));
          }

          if (cuocBauCu && cacPhienBauCu.length > 0) {
            toast({
              variant: 'default',
              title: 'Chuyển sang dữ liệu dự phòng',
              description: 'Đang sử dụng dữ liệu từ cơ sở dữ liệu do không thể kết nối blockchain.',
            });

            // Sử dụng dữ liệu từ SQL/Redux
            setDanhSachPhien(
              cacPhienBauCu.map((p) => ({
                id: p.id,
                isActive: p.trangThai === 1,
                startTime: new Date(p.ngayBatDau),
                endTime: new Date(p.ngayKetThuc),
                candidateCount: 0, // SQL không có thông tin này
                voterCount: 0, // SQL không có thông tin này
              })),
            );

            if (!selectedPhien && phienBauCuIdParam) {
              setSelectedPhien(Number(phienBauCuIdParam));
            } else if (!selectedPhien && cacPhienBauCu.length > 0) {
              setSelectedPhien(cacPhienBauCu[0].id);
            }
          }
        } catch (sqlError) {
          console.error('Không thể sử dụng dữ liệu dự phòng từ SQL:', sqlError);
        }

        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Lỗi kết nối blockchain',
          description: 'Không thể kết nối đến blockchain để lấy danh sách phiên bầu cử.',
        });
      }
    };

    fetchPhienBauCu();
  }, [
    cuocBauCuId,
    cuocBauCu,
    dispatch,
    contractAddresses.QuanLyCuocBauCu,
    contractAddresses.CuocBauCuFactory,
    phienBauCuIdParam,
    selectedPhien,
    toast,
    cacPhienBauCu,
  ]);

  // Lấy kết quả cho phiên bầu cử được chọn
  const fetchSessionResults = useCallback(async () => {
    if (!cuocBauCuId || !selectedPhien) return;

    try {
      setIsChangingSession(true);
      setLoadingStage('results');

      // Kết nối với blockchain
      const provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);

      // Xác định địa chỉ hợp đồng từ blockchain trước
      let contractAddress = contractAddresses.QuanLyCuocBauCu;

      try {
        // Với Factory contract, chúng ta có thể lấy địa chỉ hợp đồng dựa trên ID
        const factoryContract = new ethers.Contract(
          contractAddresses.CuocBauCuFactory || '0x93e3b7720CAf68Fb4E4E0A9ca0152f61529D9900',
          ['function danhSachServer(uint256) view returns (address)'],
          provider,
        );

        // Lấy địa chỉ từ factory contract
        const blockchainAddress = await factoryContract.danhSachServer(cuocBauCuId);

        if (blockchainAddress && blockchainAddress !== ethers.ZeroAddress) {
          contractAddress = blockchainAddress;
          console.log(`Sử dụng địa chỉ từ blockchain factory: ${contractAddress}`);
        }
      } catch (factoryError) {
        console.warn('Không thể lấy địa chỉ từ Factory contract:', factoryError);
        // Thử dùng địa chỉ từ Redux nếu có
        if (cuocBauCu?.blockchainAddress) {
          contractAddress = cuocBauCu.blockchainAddress;
          console.log(`Sử dụng địa chỉ từ SQL/Redux: ${contractAddress}`);
        }
      }

      console.log(`Kết nối đến contract tại địa chỉ: ${contractAddress} để lấy kết quả`);
      const contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

      // Lấy thông tin phiên bầu cử
      const sessionData = await contract.layThongTinPhienBauCu(cuocBauCuId, selectedPhien);

      setSessionInfo({
        isActive: sessionData[0],
        startTime: new Date(Number(sessionData[1]) * 1000).toLocaleString('vi-VN'),
        endTime: new Date(Number(sessionData[2]) * 1000).toLocaleString('vi-VN'),
        maxVoters: Number(sessionData[3]),
        candidateCount: Number(sessionData[4]),
        voterCount: Number(sessionData[5]),
        electedCandidates: sessionData[6],
        reElection: sessionData[7],
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
          const totalVotes = results[1].reduce((sum: number, votes: any) => sum + Number(votes), 0);

          // Xử lý kết quả bỏ phiếu cho biểu đồ
          const formattedResults = results[0].map((address: string, index: number) => {
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
          setError(
            'Không thể lấy kết quả bầu cử: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      }

      setIsChangingSession(false);
    } catch (error) {
      console.error('Lỗi khi lấy kết quả phiên bầu cử:', error);
      setError(`Lỗi khi lấy kết quả: ${error instanceof Error ? error.message : String(error)}`);
      setIsChangingSession(false);
      toast({
        variant: 'destructive',
        title: 'Lỗi kết nối',
        description: 'Không thể kết nối đến blockchain để lấy kết quả bầu cử.',
      });
    }
  }, [
    cuocBauCuId,
    selectedPhien,
    cuocBauCu,
    contractAddresses.QuanLyCuocBauCu,
    contractAddresses.CuocBauCuFactory,
    toast,
  ]);

  useEffect(() => {
    if (selectedPhien) {
      fetchSessionResults();
    }
  }, [selectedPhien, fetchSessionResults]);

  // Theo dõi real-time
  useEffect(() => {
    if (!isMonitoring || !cuocBauCuId || !selectedPhien) return;

    let provider;
    let interval;

    const setupMonitoring = () => {
      try {
        // Fallback to HTTP polling
        provider = new ethers.JsonRpcProvider(FALLBACK_RPC_URL);
        interval = setInterval(fetchSessionResults, AUTO_REFRESH_INTERVAL);

        toast({
          title: 'Đang theo dõi',
          description: `Kết quả sẽ được cập nhật mỗi ${AUTO_REFRESH_INTERVAL / 1000} giây`,
        });
      } catch (error) {
        console.error('Lỗi khi thiết lập theo dõi:', error);
      }
    };

    setupMonitoring();

    return () => {
      if (interval) clearInterval(interval);
      if (provider && typeof provider.destroy === 'function') {
        provider.destroy();
      }
    };
  }, [isMonitoring, cuocBauCuId, selectedPhien, fetchSessionResults, toast]);

  // Xử lý khi thay đổi cuộc bầu cử
  const handleElectionChange = (value: string) => {
    if (isMonitoring) setIsMonitoring(false);
    const newId = Number(value);
    setCuocBauCuId(newId);
    setSelectedPhien(null);
    navigate(`/ket-qua/${newId}`);
  };

  // Xử lý khi thay đổi phiên bầu cử
  const handleSessionChange = (value: string) => {
    if (isMonitoring) setIsMonitoring(false);
    setSelectedPhien(Number(value));
    navigate(`/ket-qua/${cuocBauCuId}/${value}`);
  };

  // Hàm làm mới dữ liệu
  const refreshData = () => {
    toast({
      title: 'Đang cập nhật',
      description: 'Đang tải dữ liệu bầu cử mới nhất từ blockchain',
    });
    fetchSessionResults();
  };

  // Toggle theo dõi
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (isMonitoring) {
      toast({
        title: 'Đã dừng theo dõi',
        description: 'Đã dừng cập nhật dữ liệu tự động',
      });
    }
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

  // Custom tooltip cho biểu đồ
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 border rounded-lg shadow-lg dark:shadow-gray-900 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">{data.displayAddress}</p>
          <p className="text-blue-600 dark:text-blue-400">{data.votes} phiếu</p>
          <p className="text-gray-600 dark:text-gray-400">{data.percentage}% tổng phiếu</p>
          {data.isElected && (
            <p className="text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Trúng cử
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom legend formatter cho biểu đồ
  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {payload.map((entry: any, index: number) => (
          <div
            key={`item-${index}`}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800"
          >
            <div
              style={{
                backgroundColor: entry.color,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
              }}
            />
            <span className="text-gray-800 dark:text-gray-200">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Render biểu đồ cột
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={votingResults} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
        <XAxis
          dataKey="displayAddress"
          angle={-45}
          textAnchor="end"
          height={70}
          tick={{ fill: isDarkMode ? '#9ca3af' : '#4b5563' }}
        />
        <YAxis tick={{ fill: isDarkMode ? '#9ca3af' : '#4b5563' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="votes" name="Số phiếu" radius={[8, 8, 0, 0]}>
          {votingResults.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.isElected
                  ? CHART_COLORS[index % CHART_COLORS.length]
                  : `${CHART_COLORS[index % CHART_COLORS.length]}90`
              }
              stroke={entry.isElected ? CHART_COLORS[index % CHART_COLORS.length] : 'none'}
              strokeWidth={2}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // Render biểu đồ tròn
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={votingResults}
          dataKey="votes"
          nameKey="displayAddress"
          cx="50%"
          cy="50%"
          outerRadius={130}
          innerRadius={60}
          paddingAngle={2}
          labelLine={false}
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, displayAddress }) => {
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 1.1;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return percent > 0.05 ? (
              <text
                x={x}
                y={y}
                fill={isDarkMode ? '#d1d5db' : '#4b5563'}
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
              >
                {displayAddress} ({(percent * 100).toFixed(0)}%)
              </text>
            ) : null;
          }}
        >
          {votingResults.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.isElected
                  ? CHART_COLORS[index % CHART_COLORS.length]
                  : `${CHART_COLORS[index % CHART_COLORS.length]}90`
              }
              stroke={isDarkMode ? '#1f2937' : '#f3f4f6'}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );

  // Render biểu đồ radar
  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart cx="50%" cy="50%" outerRadius={150} data={votingResults}>
        <PolarGrid stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
        <PolarAngleAxis
          dataKey="displayAddress"
          tick={{ fill: isDarkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 'auto']}
          tick={{ fill: isDarkMode ? '#9ca3af' : '#4b5563' }}
        />
        <Radar
          name="Số phiếu"
          dataKey="votes"
          stroke="#3B82F6"
          fill="#3B82F680"
          fillOpacity={0.6}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );

  // Render biểu đồ radial bar
  const renderRadialBarChart = () => (
    <ResponsiveContainer width="100%" height={350}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius={30}
        outerRadius={150}
        barSize={20}
        data={votingResults.map((item, index) => ({
          ...item,
          fill: CHART_COLORS[index % CHART_COLORS.length],
        }))}
      >
        <RadialBar
          minAngle={15}
          label={{
            position: 'insideStart',
            fill: '#fff',
            fontSize: 12,
          }}
          background={{ fill: isDarkMode ? '#374151' : '#e5e7eb' }}
          clockWise
          dataKey="votes"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={10}
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: 12 }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );

  const renderActiveChart = () => {
    // Nếu không có dữ liệu, hiển thị thông báo
    if (!votingResults || votingResults.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Không có dữ liệu kết quả để hiển thị</p>
          </div>
        </div>
      );
    }

    // Hiển thị biểu đồ tương ứng với loại được chọn
    switch (activeChartType) {
      case CHART_TYPES.PIE:
        return renderPieChart();
      case CHART_TYPES.RADAR:
        return renderRadarChart();
      case CHART_TYPES.RADIALBAR:
        return renderRadialBarChart();
      case CHART_TYPES.BAR:
      default:
        return renderBarChart();
    }
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-52" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // UI cho trạng thái loading
  if (isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="flex flex-col space-y-3 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
            Đang tải dữ liệu bầu cử blockchain
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {loadingStage === 'initial' && 'Đang khởi tạo kết nối blockchain...'}
            {loadingStage === 'elections' && 'Đang tải danh sách cuộc bầu cử...'}
            {loadingStage === 'sessions' && 'Đang tải danh sách phiên bầu cử...'}
            {loadingStage === 'results' && 'Đang tải kết quả bầu cử...'}
          </p>
        </div>

        <Card className="mb-6 border-2 border-dashed border-blue-200 dark:border-blue-900">
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Đang tải dữ liệu từ blockchain
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Đang kết nối đến các hợp đồng thông minh để lấy dữ liệu cuộc bầu cử. Quá trình này
                có thể mất vài giây.
              </p>
            </div>
          </CardContent>
        </Card>

        {renderLoadingSkeleton()}
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] opacity-20"></div>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h1 className="text-3xl font-extrabold mb-2 flex items-center">
            <BarChart2 className="w-8 h-8 mr-3" />
            Kết Quả Bầu Cử Blockchain
          </h1>
          {electionInfo && <p className="text-xl opacity-90 font-medium">{electionInfo.name}</p>}

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Select value={cuocBauCuId.toString()} onValueChange={handleElectionChange}>
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Chọn cuộc bầu cử" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {cuocBauCuList.map((cuoc) => (
                      <SelectItem key={cuoc.id} value={cuoc.id.toString()}>
                        <div className="flex items-center">
                          <span>{cuoc.ten}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select
                value={selectedPhien ? selectedPhien.toString() : ''}
                onValueChange={handleSessionChange}
                disabled={danhSachPhien.length === 0}
              >
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Chọn phiên bầu cử" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {danhSachPhien.map((phien) => (
                      <SelectItem key={phien.id} value={phien.id.toString()}>
                        <div className="flex items-center">
                          <span>
                            Phiên #{phien.id} -{' '}
                            {phien.isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Session badges */}
          {sessionInfo && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge
                className="bg-white/20 hover:bg-white/30 text-white border-none"
                variant="outline"
              >
                <Calendar className="w-3.5 h-3.5 mr-1" />
                {new Date(sessionInfo.startTime).toLocaleDateString('vi-VN')} -{' '}
                {new Date(sessionInfo.endTime).toLocaleDateString('vi-VN')}
              </Badge>

              <Badge
                className={`
                  ${sessionInfo.isActive ? 'bg-green-500/80' : 'bg-red-500/80'} 
                  hover:bg-opacity-100 text-white border-none
                `}
                variant="outline"
              >
                <span
                  className={`w-2 h-2 rounded-full ${sessionInfo.isActive ? 'bg-green-300' : 'bg-red-300'} mr-1.5 animate-pulse`}
                ></span>
                {sessionInfo.isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
              </Badge>

              <Badge
                className="bg-white/20 hover:bg-white/30 text-white border-none"
                variant="outline"
              >
                <User className="w-3.5 h-3.5 mr-1" />
                {sessionInfo.voterCount} cử tri
              </Badge>

              <Badge
                className="bg-white/20 hover:bg-white/30 text-white border-none"
                variant="outline"
              >
                <Award className="w-3.5 h-3.5 mr-1" />
                {sessionInfo.candidateCount} ứng viên
              </Badge>
            </div>
          )}
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute right-1/4 -top-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Lỗi kết nối blockchain</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button
                size="sm"
                onClick={() => {
                  setError(null);
                  refreshData();
                }}
                className="mr-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Control buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshData}
            disabled={isChangingSession || !selectedPhien}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isChangingSession ? (
              <span className="flex items-center">
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Đang cập nhật...
              </span>
            ) : (
              <span className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" />
                Làm mới
              </span>
            )}
          </Button>

          <Button
            onClick={toggleMonitoring}
            className={`${
              isMonitoring
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            disabled={!selectedPhien}
            size="sm"
          >
            {isMonitoring ? (
              <span className="flex items-center">
                <X className="mr-2 h-4 w-4" />
                Dừng theo dõi
              </span>
            ) : (
              <span className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                Theo dõi real-time
              </span>
            )}
          </Button>
        </div>

        {isMonitoring && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-ping"></span>
              Cập nhật mỗi {AUTO_REFRESH_INTERVAL / 1000}s
            </span>
          </Badge>
        )}

        {/* Search field */}
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Tìm theo địa chỉ ví..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 w-full md:w-64 bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Election information card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              Thông tin phiên bầu cử
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {sessionInfo ? (
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Trạng thái:</span>
                  <span
                    className={`font-medium ${sessionInfo.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {sessionInfo.isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Thời gian bắt đầu:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {sessionInfo.startTime}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Thời gian kết thúc:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {sessionInfo.endTime}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Số cử tri:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {sessionInfo.voterCount}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Số ứng viên:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {sessionInfo.candidateCount}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Số ứng viên trúng cử:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {sessionInfo.electedCandidates?.length || 0}
                  </span>
                </div>

                {sessionInfo.isActive && (
                  <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <p className="text-blue-800 dark:text-blue-300 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-500" />
                      <span>
                        <strong>Thời gian còn lại:</strong> {calculateTimeRemaining()}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Database className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                <p>Chưa có thông tin phiên bầu cử.</p>
                <p className="mt-2 text-sm">
                  Vui lòng chọn một phiên bầu cử để xem thông tin chi tiết.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voting progress card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
              <Activity className="h-5 w-5 text-blue-500 mr-2" />
              Tiến trình bỏ phiếu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {sessionInfo ? (
              <div className="space-y-4">
                <div className="text-right mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {progress.voted}/{progress.total} cử tri ({progress.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-4 rounded-full ${
                      progress.percentage >= 80
                        ? 'bg-green-500'
                        : progress.percentage >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                    }`}
                  ></motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {sessionInfo?.voterCount || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tổng số cử tri
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {progress.voted}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Số phiếu đã bỏ
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {progress.percentage >= 60 ? (
                    <div className="flex items-start bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-green-700 dark:text-green-400">
                        Đủ điều kiện kết thúc sớm (trên 60% tham gia). Ban tổ chức có thể kết thúc
                        phiên bầu cử ngay bây giờ.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                      <Info className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-blue-700 dark:text-blue-400">
                        Chưa đủ điều kiện kết thúc sớm (cần trên 60% cử tri tham gia). Phiên sẽ kết
                        thúc theo thời gian đã định.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                <p>Chưa có thông tin tiến trình bỏ phiếu.</p>
                <p className="mt-2 text-sm">
                  Vui lòng chọn một phiên bầu cử để xem thông tin chi tiết.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Voting results section */}
      <div className="space-y-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                <Award className="h-5 w-5 text-blue-500 mr-2" />
                {sessionInfo?.isActive
                  ? 'Kết quả bỏ phiếu hiện tại (đang cập nhật)'
                  : 'Kết quả bỏ phiếu cuối cùng'}
              </CardTitle>

              {/* Chart type selector */}
              <div className="flex items-center space-x-2">
                <Tabs
                  defaultValue={CHART_TYPES.BAR}
                  value={activeChartType}
                  onValueChange={setActiveChartType}
                >
                  <TabsList>
                    <TabsTrigger
                      value={CHART_TYPES.BAR}
                      className={
                        activeChartType === CHART_TYPES.BAR
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                          : ''
                      }
                    >
                      <BarChart2 className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Cột</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value={CHART_TYPES.PIE}
                      className={
                        activeChartType === CHART_TYPES.PIE
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                          : ''
                      }
                    >
                      <PieChartIcon className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Tròn</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value={CHART_TYPES.RADAR}
                      className={
                        activeChartType === CHART_TYPES.RADAR
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                          : ''
                      }
                    >
                      <Cpu className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Radar</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value={CHART_TYPES.RADIALBAR}
                      className={
                        activeChartType === CHART_TYPES.RADIALBAR
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                          : ''
                      }
                    >
                      <Server className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Radial</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Chọn kiểu biểu đồ để hiển thị kết quả bầu cử theo cách khác nhau</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {votingResults.length === 0 ? (
              <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <Award className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                <p>Chưa có dữ liệu kết quả bỏ phiếu.</p>
                {sessionInfo?.isActive && (
                  <p className="mt-2 text-sm">
                    Phiên bầu cử đang diễn ra, hãy chờ đến khi có cử tri bỏ phiếu.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Biểu đồ kết quả */}
                <div className="rounded-lg overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeChartType}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="pt-4"
                    >
                      {renderActiveChart()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bảng chi tiết */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Thứ tự
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Địa chỉ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Số phiếu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tỷ lệ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {votingResults
                        .filter(
                          (result) =>
                            searchQuery.trim() === '' ||
                            result.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            result.displayAddress.toLowerCase().includes(searchQuery.toLowerCase()),
                        )
                        .map((result, index) => (
                          <motion.tr
                            key={result.address}
                            className={result.isElected ? 'bg-green-50 dark:bg-green-900/10' : ''}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900 dark:text-gray-100">
                              <div className="flex items-center space-x-1">
                                <span>{result.displayAddress}</span>
                                <a
                                  href={`https://explorer.holihu.online/address/${result.address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-sm text-gray-900 dark:text-gray-100">
                              {result.votes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${result.percentage}%` }}
                                  ></div>
                                </div>
                                <span>{result.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {sessionInfo?.isActive ? (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30">
                                  <Loader className="mr-1 h-3 w-3 animate-spin" />
                                  Đang kiểm phiếu
                                </Badge>
                              ) : result.isElected ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Trúng cử
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50">
                                  Chưa trúng cử
                                </Badge>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thông tin người trúng cử */}
        {sessionInfo &&
          !sessionInfo.isActive &&
          sessionInfo.electedCandidates &&
          sessionInfo.electedCandidates.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                  <Award className="h-5 w-5 text-green-500 mr-2" />
                  Danh sách trúng cử
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6 text-green-800 dark:text-green-300 border border-green-100 dark:border-green-800/30">
                  <div className="flex">
                    <CheckCircle className="h-6 w-6 mr-3 text-green-600 dark:text-green-400" />
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
                      <motion.div
                        key={address}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-100 dark:border-green-800/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <div className="bg-green-100 dark:bg-green-800/50 rounded-full w-10 h-10 flex items-center justify-center mr-3 shadow-inner">
                            <span className="text-green-800 dark:text-green-300 font-bold">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {address.substring(0, 8)}...{address.substring(address.length - 6)}
                            </h3>
                            {candidateInfo && (
                              <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                                <span className="mr-1">{candidateInfo.votes} phiếu</span>
                                <span>({candidateInfo.percentage}%)</span>
                              </div>
                            )}
                            <a
                              href={`https://explorer.holihu.online/address/${address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-xs flex items-center mt-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Xem trên blockchain
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Thông tin kết nối blockchain */}
      <Card className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 mt-6">
        <CardContent className="p-4 text-sm">
          <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
            Thông tin kết nối blockchain
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>RPC:</strong> {FALLBACK_RPC_URL}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Địa chỉ Contract:</strong> {contractAddresses.QuanLyCuocBauCu}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Cuộc bầu cử ID:</strong> {cuocBauCuId}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Phiên bầu cử ID:</strong> {selectedPhien || 'Chưa chọn'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Trạng thái theo dõi:</strong>{' '}
                {isMonitoring ? (
                  <span className="inline-flex items-center text-green-600 dark:text-green-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-ping"></span>
                    Đang theo dõi
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full mr-1"></span>
                    Không theo dõi
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông báo real-time */}
      {isMonitoring && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900/80 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg shadow-lg flex items-center"
        >
          <div className="relative mr-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full absolute top-0 animate-ping"></div>
          </div>
          <div>Đang theo dõi phiên #{selectedPhien}</div>
        </motion.div>
      )}
    </div>
  );
};

export default TrangKetQua;
