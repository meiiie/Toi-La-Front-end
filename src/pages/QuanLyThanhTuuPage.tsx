'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  Search,
  RefreshCw,
  Copy,
  Award,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  BarChart2,
  Medal,
  Shield,
  Wallet,
  Key,
  Lock,
  Loader,
  Info,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/Dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Toaster } from '../test/components/toaster';
import { useToast } from '../test/components/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { useSelector, useDispatch } from 'react-redux';
import apiClient from '../api/apiClient';

// Redux
import type { RootState, AppDispatch } from '../store/store';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';

// Địa chỉ contract QuanLyThanhTuuToanCuc
const CONTRACT_ADDRESS = '0x93362A6A30570b1446843862c2c4150002557152';

// ABI của QuanLyThanhTuuToanCuc.sol
const ACHIEVEMENT_ABI = [
  'function soLanThamGia(address _diaChi) view returns (uint256)',
  'function layDanhSachThanhTuu(address cuTri) view returns (uint256[])',
  'function layThongTinThanhTuu(uint256 idToken) view returns (uint8 capBac, uint256 idCuocBauCu, uint256 idPhienBauCu, uint256 thoiGian, string tenCuocBauCu, uint256 ngayBatDau, string moTa)',
  'function tokenURI(uint256 tokenId) view returns (string)',
];

// Cấu hình mạng blockchain
const NETWORK_CONFIG = {
  name: 'POA Geth',
  rpcUrl: 'https://geth.holihu.online/rpc',
  chainId: 210,
  nativeCurrency: {
    name: 'POA Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Session key info interface
interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

// Loại thành tựu
const ACHIEVEMENT_TIERS = {
  0: { name: 'Đồng', color: '#CD7F32', bgColor: 'from-amber-700/30 to-amber-800/30' },
  1: { name: 'Bạc', color: '#C0C0C0', bgColor: 'from-slate-400/30 to-slate-500/30' },
  2: { name: 'Vàng', color: '#FFD700', bgColor: 'from-yellow-400/30 to-yellow-500/30' },
  3: { name: 'Kim Cương', color: '#B9F2FF', bgColor: 'from-cyan-400/30 to-blue-500/30' },
};

// Placeholder images cho các loại thành tựu
const TIER_IMAGES = {
  0: '/api/placeholder/200/200',
  1: '/api/placeholder/200/200',
  2: '/api/placeholder/200/200',
  3: '/api/placeholder/200/200',
};

interface Achievement {
  id: number;
  tier: number;
  tierName: string;
  tierColor: string;
  electionId: number;
  sessionId: number;
  timestamp: number;
  electionName: string;
  startDate: number;
  description: string;
  owned: boolean;
  imageUrl: string;
}

// Component Theme Toggle
const ThemeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className="fixed top-6 right-6 z-50 p-2 rounded-full shadow-lg transition-all duration-300 dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200"
      aria-label="Chuyển đổi giao diện tối/sáng"
    >
      {darkMode ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-indigo-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};

// Loading Spinner Component
const LoadingSpinner = ({ message = 'Đang tải dữ liệu từ blockchain...' }) => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
    <div className="text-center p-8 backdrop-blur-lg bg-white/90 dark:bg-black/20 rounded-xl shadow-2xl">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-indigo-500"></div>
      <p className="mt-6 text-gray-800 dark:text-white text-lg font-medium">{message}</p>
      <p className="mt-2 text-indigo-600 dark:text-indigo-300 text-sm">
        Quá trình này có thể mất một chút thời gian
      </p>
    </div>
  </div>
);

// Error Alert Component
const ErrorAlert = ({ message }) => (
  <div className="bg-red-50 dark:bg-red-900/40 backdrop-blur-md border-l-4 border-red-500 text-red-800 dark:text-red-100 p-6 mb-8 rounded-lg shadow-xl">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg
          className="h-6 w-6 text-red-500 dark:text-red-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-lg">{message}</p>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyStatePrompt = ({ message, icon, actionButton = null }) => (
  <div className="backdrop-blur-lg bg-white/90 dark:bg-white/5 rounded-xl shadow-2xl p-8 mb-8 text-center border border-gray-200 dark:border-white/10">
    <div className="py-16">
      {icon}
      <h3 className="text-xl font-medium text-gray-800 dark:text-indigo-200 mb-3">{message}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{actionButton?.description}</p>
      {actionButton?.button}
    </div>
  </div>
);

// Main Component
export default function QuanLyThanhTuuPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participationCount, setParticipationCount] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [taiKhoanId, setTaiKhoanId] = useState<string>('');
  const [viId, setViId] = useState<string>('');
  const [scwAddress, setScwAddress] = useState<string>('');
  const { toast } = useToast();

  // Redux state
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // State cho dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode
        ? JSON.parse(savedMode)
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Lưu dark mode vào localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));

      // Áp dụng class dark vào document
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  // Update account info from userInfo
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());

      if (userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }
    }
  }, [userInfo, dispatch]);

  // Update viId and scwAddress from walletInfo
  useEffect(() => {
    if (walletInfo) {
      setViId(walletInfo.viId.toString());
      setScwAddress(walletInfo.diaChiVi);

      if (walletInfo.diaChiVi && !isConnected) {
        setAccount(walletInfo.diaChiVi);
        setIsConnected(true);

        // Khởi tạo provider trực tiếp với JsonRpcProvider
        const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
        setProvider(provider);

        // Tạo contract instance
        const achievementContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ACHIEVEMENT_ABI,
          provider,
        );
        setContract(achievementContract);

        // Tải dữ liệu người dùng
        loadUserData(walletInfo.diaChiVi, achievementContract);
      }
    }
  }, [walletInfo]);

  // Get session key
  const getSessionKey = async () => {
    if (!taiKhoanId || !viId) {
      setError('Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản');
      return null;
    }

    // Check if session key exists and is still valid
    if (sessionKey && sessionKey.expiresAt * 1000 > Date.now()) {
      toast({
        title: 'Khóa phiên hiện tại',
        description: `Khóa phiên còn hạn đến: ${new Date(sessionKey.expiresAt * 1000).toLocaleString()}`,
      });

      return sessionKey;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Call API to get session key
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(taiKhoanId, 10),
        ViID: Number.parseInt(viId, 10),
      });

      if (response.data && response.data.success && response.data.sessionKey) {
        // Save session key and related info
        const sessionKeyInfo = {
          sessionKey: response.data.sessionKey,
          expiresAt: response.data.expiresAt,
          scwAddress: response.data.scwAddress || scwAddress,
        };

        setSessionKey(sessionKeyInfo);
        setScwAddress(sessionKeyInfo.scwAddress);

        toast({
          title: 'Đã lấy khóa phiên',
          description: 'Khóa phiên đã được tạo thành công',
        });

        return sessionKeyInfo;
      } else {
        throw new Error(response.data?.message || 'Không thể lấy session key');
      }
    } catch (error) {
      setError(`Lỗi khi lấy session key: ${error.message}`);

      // If can't get, try creating a new one
      try {
        const createResponse = await apiClient.post('/api/Blockchain/create-session', {
          TaiKhoanID: Number.parseInt(taiKhoanId, 10),
          ViID: Number.parseInt(viId, 10),
        });

        if (createResponse.data && createResponse.data.success) {
          toast({
            title: 'Đã tạo khóa phiên mới',
            description: 'Khóa phiên mới đã được tạo thành công',
          });

          // Call get-session-key API again to get the new key
          return await getSessionKey();
        }
      } catch (createError) {
        setError(`Không thể tạo session key mới: ${createError.message}`);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Kết nối ví SCW
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Kiểm tra xem có thông tin walletInfo không
      if (!walletInfo || !walletInfo.diaChiVi) {
        setError('Không tìm thấy thông tin ví Smart Contract Wallet. Vui lòng đăng nhập lại.');
        toast({
          title: 'Lỗi kết nối ví',
          description: 'Không tìm thấy thông tin ví. Vui lòng đăng nhập lại.',
          variant: 'destructive',
        });
        return;
      }

      // Sử dụng thông tin ví từ Redux state
      const address = walletInfo.diaChiVi;
      setAccount(address);
      setIsConnected(true);

      // Khởi tạo provider trực tiếp với JsonRpcProvider thay vì BrowserProvider
      const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      const achievementContract = new ethers.Contract(CONTRACT_ADDRESS, ACHIEVEMENT_ABI, provider);
      setProvider(provider);
      setContract(achievementContract);

      // Lấy session key (không bắt buộc cho việc xem thành tựu)
      await getSessionKey();

      // Tải dữ liệu người dùng
      try {
        await loadUserData(address, achievementContract);
      } catch (dataError) {
        console.error('Lỗi khi tải dữ liệu người dùng:', dataError);
        toast({
          title: 'Kết nối thành công, nhưng có lỗi dữ liệu',
          description: `Đã kết nối với ${address.substring(0, 6)}...${address.substring(38)}`,
          variant: 'default',
        });
        return;
      }

      toast({
        title: 'Kết nối thành công',
        description: `Đã kết nối với ví Smart Contract: ${address.substring(0, 6)}...${address.substring(38)}`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      setError('Không thể kết nối với ví Smart Contract. Vui lòng thử lại sau.');
      toast({
        title: 'Kết nối thất bại',
        description: 'Không thể kết nối với ví Smart Contract',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tải dữ liệu người dùng từ hợp đồng
  const loadUserData = async (address: string, contractInstance: ethers.Contract) => {
    try {
      setIsLoading(true);
      setError(null);

      // Lấy số lần tham gia
      try {
        const participations = await contractInstance.soLanThamGia(address);
        setParticipationCount(Number(participations));
      } catch (participationError) {
        console.error('Lỗi khi gọi soLanThamGia:', participationError);
        setParticipationCount(0);
        toast({
          variant: 'destructive',
          title: 'Lỗi tải dữ liệu tham gia',
          description: 'Không thể tải số lần tham gia. Vui lòng thử lại sau.',
        });
      }

      // Lấy danh sách thành tựu
      await loadAchievements(address, contractInstance);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      setError(`Lỗi tải dữ liệu: ${error.message}`);
      toast({
        variant: 'destructive',
        title: 'Lỗi tải dữ liệu',
        description: String(error).substring(0, 100),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tải danh sách thành tựu
  const loadAchievements = async (address: string, contractInstance: ethers.Contract) => {
    try {
      const userTokenIds = await contractInstance.layDanhSachThanhTuu(address);
      // Convert BigInt to number
      const userTokenIdsArray = userTokenIds.map((id: bigint) => Number(id));

      const allAchievements: Achievement[] = [];

      // Tạo thành tựu mẫu cho mỗi cấp bậc
      for (let tier = 0; tier <= 3; tier++) {
        const achievement: Achievement = {
          id: -1,
          tier: tier,
          tierName: ACHIEVEMENT_TIERS[tier as keyof typeof ACHIEVEMENT_TIERS].name,
          tierColor: ACHIEVEMENT_TIERS[tier as keyof typeof ACHIEVEMENT_TIERS].color,
          electionId: 0,
          sessionId: 0,
          timestamp: 0,
          electionName: '',
          startDate: 0,
          description: '',
          owned: false,
          imageUrl: TIER_IMAGES[tier as keyof typeof TIER_IMAGES],
        };
        allAchievements.push(achievement);
      }

      if (userTokenIdsArray.length > 0) {
        for (const tokenId of userTokenIdsArray) {
          try {
            // Sử dụng hàm mới từ contract để lấy thông tin chi tiết
            const tokenInfo = await contractInstance.layThongTinThanhTuu(tokenId);
            const tier = Number(tokenInfo.capBac);
            const electionId = Number(tokenInfo.idCuocBauCu);
            const sessionId = Number(tokenInfo.idPhienBauCu);
            const timestamp = Number(tokenInfo.thoiGian);
            const electionName = tokenInfo.tenCuocBauCu;
            const startDate = Number(tokenInfo.ngayBatDau);
            const description = tokenInfo.moTa;

            const achievementIndex = allAchievements.findIndex((a) => a.tier === tier);
            if (achievementIndex !== -1) {
              allAchievements[achievementIndex] = {
                ...allAchievements[achievementIndex],
                id: tokenId,
                electionId: electionId,
                sessionId: sessionId,
                timestamp: timestamp,
                electionName: electionName,
                startDate: startDate,
                description: description,
                owned: true,
              };

              try {
                const uri = await contractInstance.tokenURI(tokenId);
                if (uri && (uri.startsWith('ipfs://') || uri.startsWith('http'))) {
                  let imageUrl = uri;
                  if (uri.startsWith('ipfs://')) {
                    imageUrl = `https://ipfs.io/ipfs/${uri.substring(7)}`;
                  }
                  allAchievements[achievementIndex].imageUrl = imageUrl;
                }
              } catch (uriError) {
                console.warn('Không thể lấy tokenURI:', uriError);
              }
            }
          } catch (tokenError) {
            console.error(`Lỗi lấy thông tin token ${tokenId}:`, tokenError);
          }
        }
      } else {
        console.log('Người dùng chưa có thành tựu nào');
      }

      setAchievements(allAchievements);
      setFilteredAchievements(allAchievements);

      toast({
        title: 'Tải thành công',
        description:
          userTokenIdsArray.length > 0
            ? `Đã tải ${userTokenIdsArray.length} thành tựu`
            : 'Bạn chưa có thành tựu nào. Hãy tham gia bầu cử để nhận thành tựu!',
        variant: 'success',
      });
    } catch (error) {
      console.error('Lỗi tải thành tựu:', error);
      setError('Không thể tải danh sách thành tựu');
      toast({
        variant: 'destructive',
        title: 'Lỗi tải thành tựu',
        description: 'Không thể tải danh sách thành tựu',
      });

      const emptyAchievements = Array.from({ length: 4 }).map((_, tier) => ({
        id: -1,
        tier: tier,
        tierName: ACHIEVEMENT_TIERS[tier as keyof typeof ACHIEVEMENT_TIERS].name,
        tierColor: ACHIEVEMENT_TIERS[tier as keyof typeof ACHIEVEMENT_TIERS].color,
        electionId: 0,
        sessionId: 0,
        timestamp: 0,
        electionName: '',
        startDate: 0,
        description: '',
        owned: false,
        imageUrl: TIER_IMAGES[tier as keyof typeof TIER_IMAGES],
      }));

      setAchievements(emptyAchievements);
      setFilteredAchievements(emptyAchievements);
    }
  };

  // Làm mới dữ liệu
  const refreshData = async () => {
    if (isConnected && contract && account) {
      await loadUserData(account, contract);
    }
  };

  // Xử lý tìm kiếm và lọc
  useEffect(() => {
    if (achievements.length > 0) {
      let filtered = [...achievements];

      // Lọc theo từ khóa tìm kiếm
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (achievement) =>
            achievement.tierName.toLowerCase().includes(term) ||
            (achievement.electionName && achievement.electionName.toLowerCase().includes(term)),
        );
      }

      // Lọc theo cấp bậc
      if (filterTier !== 'all') {
        const tierIndex = Object.values(ACHIEVEMENT_TIERS).findIndex(
          (t) => t.name.toLowerCase() === filterTier.toLowerCase(),
        );
        if (tierIndex !== -1) {
          filtered = filtered.filter((achievement) => achievement.tier === tierIndex);
        }
      }

      setFilteredAchievements(filtered);
    }
  }, [searchTerm, filterTier, achievements]);

  // Xem chi tiết thành tựu
  const viewAchievementDetails = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDetailsModal(true);
  };

  // Sao chép địa chỉ
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: 'Đã sao chép vào clipboard',
      variant: 'success',
    });
  };

  // Định dạng địa chỉ ví
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Định dạng thời gian
  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Memoized function để hiển thị thông tin session key
  const renderSessionKeyInfo = useCallback(() => {
    if (!sessionKey) return null;

    return (
      <Card className="mb-6 border-t-4 border-indigo-500 dark:border-indigo-600 bg-gradient-to-br from-white to-indigo-50 dark:from-[#162A45]/90 dark:to-[#1E1A29]/70">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50">
              <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
              Thông Tin Khóa Phiên
            </CardTitle>
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Khóa phiên được sử dụng để ký các giao dịch blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                  Địa chỉ SCW:
                </p>
                <div className="flex items-center mt-1">
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300 truncate max-w-[12rem] sm:max-w-xs">
                    {sessionKey.scwAddress}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={() => copyToClipboard(sessionKey.scwAddress)}
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Sao chép địa chỉ</span>
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                  Hết hạn sau:
                </p>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [sessionKey, copyToClipboard]);

  // Trạng thái tải trang
  if (isLoading && !isConnected) {
    return (
      <>
        <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
          : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 text-gray-800'
      } transition-colors duration-500`}
    >
      <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header */}
      <header
        className={`sticky top-0 z-10 ${
          darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-100'
        } backdrop-blur-md border-b py-4 px-6`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className={`h-6 w-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Bộ Sưu Tập Thành Tựu
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div
                  className={`px-3 py-1.5 rounded-md ${
                    darkMode
                      ? 'border-gray-700 bg-gray-800 text-gray-200'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  } border text-sm flex items-center`}
                >
                  <Wallet className="h-4 w-4 mr-1.5 text-indigo-500" />
                  <span>{formatAddress(account)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-5 w-5 ml-1 ${
                      darkMode
                        ? 'text-indigo-300 hover:text-indigo-200'
                        : 'text-indigo-600 hover:text-indigo-800'
                    }`}
                    onClick={() => copyToClipboard(account)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Sao chép địa chỉ</span>
                  </Button>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {NETWORK_CONFIG.name}
                  </span>
                </div>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isLoading}
                className={`${
                  darkMode
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                } font-medium rounded-lg shadow-md shadow-indigo-500/20 flex items-center`}
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Đang kết nối...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Kết nối ví SCW
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        {error && <ErrorAlert message={error} />}

        {isConnected ? (
          <>
            {/* Session Key info if available */}
            {sessionKey && renderSessionKeyInfo()}

            {/* User Info Section */}
            <Card
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } border rounded-xl shadow-sm backdrop-blur-lg transition-all duration-300 hover:bg-white/10 mb-8`}
            >
              <CardHeader>
                <CardTitle
                  className={`text-lg font-semibold flex items-center ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}
                >
                  <User className="h-5 w-5 mr-2" />
                  Thông tin người dùng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
                  <div
                    className={`flex items-center p-4 rounded-lg ${
                      darkMode
                        ? 'bg-indigo-900/30 border-indigo-800/50'
                        : 'bg-indigo-50 border-indigo-100'
                    } border flex-1`}
                  >
                    <div className="mr-4">
                      <div
                        className={`p-3 rounded-full ${
                          darkMode
                            ? 'bg-indigo-800 text-indigo-200'
                            : 'bg-indigo-100 text-indigo-600'
                        }`}
                      >
                        <Wallet className="h-6 w-6" />
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                        Địa chỉ SCW
                      </p>
                      <div className="flex items-center mt-1">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {formatAddress(account)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ml-1 ${
                            darkMode
                              ? 'text-indigo-300 hover:text-indigo-200'
                              : 'text-indigo-600 hover:text-indigo-800'
                          }`}
                          onClick={() => copyToClipboard(account)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Sao chép địa chỉ</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center p-4 rounded-lg ${
                      darkMode
                        ? 'bg-emerald-900/30 border-emerald-800/50'
                        : 'bg-emerald-50 border-emerald-100'
                    } border flex-1`}
                  >
                    <div className="mr-4">
                      <div
                        className={`p-3 rounded-full ${
                          darkMode
                            ? 'bg-emerald-800 text-emerald-200'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        <BarChart2 className="h-6 w-6" />
                      </div>
                    </div>
                    <div>
                      <p
                        className={`text-sm ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`}
                      >
                        Số lần tham gia bầu cử
                      </p>
                      <p
                        className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}
                      >
                        {participationCount}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center p-4 rounded-lg ${
                      darkMode
                        ? 'bg-amber-900/30 border-amber-800/50'
                        : 'bg-amber-50 border-amber-100'
                    } border flex-1`}
                  >
                    <div className="mr-4">
                      <div
                        className={`p-3 rounded-full ${
                          darkMode ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        <Medal className="h-6 w-6" />
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                        Tổng số thành tựu
                      </p>
                      <p
                        className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}
                      >
                        {achievements.filter((a) => a.owned).length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!sessionKey && (
              <div className="mb-6">
                <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    Bạn chưa lấy khóa phiên. Khóa phiên sẽ giúp bạn tương tác đầy đủ với các chức
                    năng blockchain.
                  </AlertDescription>
                </Alert>
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={getSessionKey}
                    disabled={isLoading}
                    className={`${
                      darkMode
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white`}
                  >
                    {isLoading ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Đang lấy khóa phiên...' : 'Lấy Khóa Phiên'}
                  </Button>
                </div>
              </div>
            )}

            {/* Achievements Gallery */}
            <Card
              className={`${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
              } border rounded-xl shadow-sm backdrop-blur-lg transition-all duration-300 hover:bg-white/10`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-lg font-semibold flex items-center ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}
                >
                  <Award className="h-5 w-5 mr-2" />
                  Bộ sưu tập thành tựu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative w-full md:w-auto md:flex-1 max-w-sm">
                    <Search
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <Input
                      placeholder="Tìm kiếm thành tựu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-9 ${
                        darkMode
                          ? 'bg-gray-800/70 border-gray-700 text-white placeholder:text-gray-500'
                          : 'bg-white border-gray-200 text-gray-800'
                      } rounded-lg`}
                    />
                  </div>

                  <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger
                      className={`w-full md:w-[180px] ${
                        darkMode
                          ? 'bg-gray-800/70 border-gray-700 text-white'
                          : 'bg-white border-gray-200 text-gray-800'
                      } rounded-lg`}
                    >
                      <SelectValue placeholder="Lọc theo cấp bậc" />
                    </SelectTrigger>
                    <SelectContent
                      className={
                        darkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-200'
                      }
                    >
                      <SelectItem value="all">Tất cả cấp bậc</SelectItem>
                      <SelectItem value="đồng">Đồng</SelectItem>
                      <SelectItem value="bạc">Bạc</SelectItem>
                      <SelectItem value="vàng">Vàng</SelectItem>
                      <SelectItem value="kim cương">Kim Cương</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={refreshData}
                    disabled={isLoading}
                    className={`h-10 w-10 rounded-lg ${
                      darkMode
                        ? 'border-gray-700 bg-gray-800/70 text-white hover:bg-gray-700 hover:text-white'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Làm mới</span>
                  </Button>
                </div>

                {/* Achievements Grid */}
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div
                      className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-indigo-400' : 'border-indigo-600'}`}
                    ></div>
                  </div>
                ) : filteredAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAchievements.map((achievement) => {
                      const bgColor = ACHIEVEMENT_TIERS[achievement.tier]?.bgColor || '';
                      return (
                        <div
                          key={`achievement-${achievement.tier}`}
                          className={`border rounded-lg overflow-hidden ${
                            darkMode
                              ? 'border-gray-700 bg-gradient-to-br ' + bgColor
                              : 'border-gray-200 bg-gradient-to-br ' + bgColor
                          } transition-all duration-300 hover:shadow-lg`}
                        >
                          <div className="p-4">
                            <div className="w-full flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                {achievement.owned ? (
                                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-400" />
                                )}
                                <span
                                  className="ml-2 text-sm font-medium"
                                  style={{ color: achievement.tierColor }}
                                >
                                  {achievement.owned ? 'Đã sở hữu' : 'Chưa sở hữu'}
                                </span>
                              </div>
                              <span
                                className="text-sm font-medium"
                                style={{ color: achievement.tierColor }}
                              >
                                {achievement.tierName}
                              </span>
                            </div>

                            <div
                              className={`w-full h-48 mb-4 flex items-center justify-center rounded-lg overflow-hidden ${
                                darkMode ? 'bg-gray-800/50' : 'bg-white/80'
                              }`}
                              style={{ borderColor: achievement.tierColor, borderWidth: '2px' }}
                            >
                              <img
                                src={achievement.imageUrl || '/api/placeholder/200/200'}
                                alt={`${achievement.tierName} Badge`}
                                className="w-32 h-32 object-contain"
                              />
                            </div>

                            {achievement.owned && achievement.electionName && (
                              <div
                                className={`text-center mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                              >
                                <p className="text-sm truncate" title={achievement.electionName}>
                                  {achievement.electionName}
                                </p>
                              </div>
                            )}

                            <div
                              className={`w-full text-center mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                              <p className="text-sm">
                                ID: {achievement.owned ? achievement.id : '-'}
                              </p>
                            </div>

                            {achievement.owned ? (
                              <Button
                                onClick={() => viewAchievementDetails(achievement)}
                                className={`w-full ${
                                  darkMode
                                    ? 'bg-indigo-600 hover:bg-indigo-700'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                } text-white`}
                              >
                                Xem chi tiết
                              </Button>
                            ) : (
                              <Button
                                disabled
                                className="w-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              >
                                Chưa mở khóa
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Không tìm thấy thành tựu nào
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-20">
            <div
              className={`backdrop-blur-lg ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white/90 border-gray-200'
              } rounded-xl shadow-2xl p-8 mb-8 border max-w-xl mx-auto`}
            >
              <Award
                className={`h-16 w-16 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mx-auto mb-4`}
              />
              <h2
                className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}
              >
                Kết nối ví để xem thành tựu
              </h2>
              <p
                className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 max-w-md mx-auto`}
              >
                Kết nối ví Smart Contract Wallet của bạn để xem các thành tựu bạn đã nhận được khi
                tham gia bầu cử blockchain.
              </p>
              {sessionKey ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-6 text-left">
                  <h3 className="font-medium text-indigo-700 dark:text-indigo-300 flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Thông tin khóa phiên
                  </h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                    Khóa phiên còn hạn đến: {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                  </p>
                </div>
              ) : null}
              <Button
                onClick={connectWallet}
                disabled={isLoading}
                className={`${
                  darkMode
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white font-medium rounded-lg px-6 py-2 shadow-md shadow-indigo-500/20 flex items-center justify-center mx-auto`}
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Đang kết nối...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Kết nối ví SCW
                  </>
                )}
              </Button>

              {error && (
                <Alert className="mt-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`${
          darkMode
            ? 'bg-gray-900/80 border-gray-800 text-gray-400'
            : 'bg-white/80 border-gray-200 text-gray-600'
        } backdrop-blur-md border-t py-4 px-6 text-center text-sm`}
      >
        <div className="max-w-7xl mx-auto">
          <p>
            Mạng: {NETWORK_CONFIG.name} | RPC: {NETWORK_CONFIG.rpcUrl} | Xem thành tựu bầu cử của
            bạn
          </p>
          <div className="mt-2 flex items-center justify-center space-x-4">
            <button
              onClick={() =>
                toast({
                  title: 'Hỗ trợ',
                  description: 'Chức năng hỗ trợ đang được phát triển',
                  variant: 'default',
                })
              }
              className={`${
                darkMode
                  ? 'text-indigo-400 hover:text-indigo-300'
                  : 'text-indigo-600 hover:text-indigo-800'
              } underline bg-transparent border-none cursor-pointer`}
            >
              Hỗ trợ
            </button>

            {sessionKey && (
              <button
                onClick={() =>
                  toast({
                    title: 'Thông tin khóa phiên',
                    description: `Khóa phiên còn hạn đến: ${new Date(sessionKey.expiresAt * 1000).toLocaleString()}`,
                    variant: 'default',
                  })
                }
                className={`${
                  darkMode
                    ? 'text-cyan-400 hover:text-cyan-300'
                    : 'text-cyan-600 hover:text-cyan-800'
                } underline bg-transparent border-none cursor-pointer flex items-center`}
              >
                <Key className="h-3 w-3 mr-1" />
                Thông tin khóa phiên
              </button>
            )}

            {isConnected && (
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                SCW: {formatAddress(account)}
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Achievement Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent
          className={`sm:max-w-md ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <DialogHeader>
            <DialogTitle
              className={`text-center font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}
            >
              Chi tiết thành tựu
            </DialogTitle>
          </DialogHeader>

          {selectedAchievement && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div
                  className={`w-48 h-48 flex items-center justify-center rounded-lg overflow-hidden ${
                    darkMode ? 'bg-gray-800/50' : 'bg-gray-100'
                  }`}
                  style={{ borderColor: selectedAchievement.tierColor, borderWidth: '2px' }}
                >
                  <img
                    src={selectedAchievement.imageUrl || '/api/placeholder/200/200'}
                    alt={`${selectedAchievement.tierName} Badge`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                <div
                  className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'
                  } border`}
                >
                  <h3
                    className={`text-lg font-medium mb-3 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}
                  >
                    {selectedAchievement.electionName || 'Thành tựu bầu cử'}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">Cấp bậc:</span>
                      <span
                        style={{ color: selectedAchievement.tierColor }}
                        className="font-semibold"
                      >
                        {selectedAchievement.tierName}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">ID Token:</span>
                      <span>{selectedAchievement.id}</span>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">Server ID:</span>
                      <span>{selectedAchievement.electionId}</span>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">Phiên bầu cử:</span>
                      <span>{selectedAchievement.sessionId}</span>
                    </div>

                    <div className="flex items-start">
                      <Clock className="h-4 w-4 mr-2 mt-1" />
                      <span className="font-medium mr-2">Thời gian nhận:</span>
                      <span>{formatTimestamp(selectedAchievement.timestamp)}</span>
                    </div>

                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">Chủ sở hữu:</span>
                      <div className="flex items-center">
                        <span>{formatAddress(account)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ml-1 ${
                            darkMode
                              ? 'text-indigo-400 hover:text-indigo-300'
                              : 'text-indigo-600 hover:text-indigo-800'
                          }`}
                          onClick={() => copyToClipboard(account)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Sao chép địa chỉ</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAchievement.description && (
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'
                    } border`}
                  >
                    <h4 className="font-medium mb-2">Mô tả:</h4>
                    <p className="text-sm">{selectedAchievement.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
              className={`w-full sm:w-auto ${
                darkMode
                  ? 'border-gray-700 hover:bg-gray-800 text-white'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-800'
              }`}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
