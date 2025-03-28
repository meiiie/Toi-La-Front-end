'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Search, RefreshCw, Copy, Award, CheckCircle, XCircle } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Toaster } from '../test/components/toaster';
import { useToast } from '../test/components/use-toast';

// ABI của QuanLyThanhTuu.sol
const ACHIEVEMENT_ABI = [
  'function layDanhSachThanhTuu(address cuTri) view returns (uint256[])',
  'function layThongTinThanhTuu(uint256 idToken) view returns (uint8 capBac, uint256 idPhienBauCu, uint256 thoiGian)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function soLanThamGia(address _diaChi) view returns (uint256)',
];

// Địa chỉ hợp đồng QuanLyThanhTuu
const CONTRACT_ADDRESS = '0x123456789abcdef123456789abcdef123456789a'; // Thay bằng địa chỉ thực tế

// Cấu hình mạng POA Geth
const NETWORK_CONFIG = {
  name: 'POA Geth',
  rpcUrl: 'https://geth.holihu.online/rpc',
  chainId: 210, // Thay bằng chainId thực tế
  nativeCurrency: {
    name: 'POA Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Loại thành tựu
const ACHIEVEMENT_TIERS = {
  0: { name: 'Bronze', color: '#8D6E63' },
  1: { name: 'Silver', color: '#B0BEC5' },
  2: { name: 'Gold', color: '#FFB300' },
  3: { name: 'Diamond', color: '#26C6DA' },
};

// Placeholder images cho các loại thành tựu
const TIER_IMAGES = {
  0: '/placeholder.svg?height=200&width=200',
  1: '/placeholder.svg?height=200&width=200',
  2: '/placeholder.svg?height=200&width=200',
  3: '/placeholder.svg?height=200&width=200',
};

interface Achievement {
  id: number;
  tier: number;
  tierName: string;
  tierColor: string;
  electionId: number;
  timestamp: number;
  owned: boolean;
  imageUrl: string;
}

// Updated for ethers v6
declare global {
  interface Window {
    ethereum: any;
  }
}

export default function QuanLyThanhTuuPage() {
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
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
  const { toast } = useToast();

  // Kết nối ví MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setAccount(address);
        setIsConnected(true);

        // Khởi tạo provider và contract - Updated for ethers v6
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const achievementContract = new ethers.Contract(CONTRACT_ADDRESS, ACHIEVEMENT_ABI, signer);
        setProvider(provider);
        setContract(achievementContract);

        // Tải dữ liệu người dùng
        try {
          await loadUserData(address, achievementContract);
        } catch (dataError) {
          console.error('Lỗi khi tải dữ liệu người dùng:', dataError);
          // Still show success for connection, but note the data loading issue
          toast({
            title: 'Kết nối thành công, nhưng có lỗi dữ liệu',
            description: `Đã kết nối với ${address.substring(0, 6)}...${address.substring(38)}`,
            variant: 'default',
          });
          return;
        }

        toast({
          title: 'Kết nối thành công',
          description: `Đã kết nối với ${address.substring(0, 6)}...${address.substring(38)}`,
          variant: 'success',
        });
      } catch (error) {
        console.error('Lỗi kết nối:', error);
        toast({
          title: 'Kết nối thất bại',
          description: 'Không thể kết nối với MetaMask',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: 'Không tìm thấy MetaMask',
        description: 'Vui lòng cài đặt tiện ích mở rộng MetaMask',
        variant: 'destructive',
      });
    }
  };

  // Tải dữ liệu người dùng từ hợp đồng
  const loadUserData = async (address: string, contractInstance: ethers.Contract) => {
    try {
      setIsLoading(true);

      // Lấy số lần tham gia - Add better error handling and logging
      try {
        const participations = await contractInstance.soLanThamGia(address);
        setParticipationCount(Number(participations)); // Updated for ethers v6
      } catch (participationError) {
        console.error('Lỗi khi gọi soLanThamGia:', participationError);
        // Set default value if we can't get the participation count
        setParticipationCount(0);

        // Show error toast but continue loading other data
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
      toast({
        variant: 'destructive',
        title: 'Lỗi tải dữ liệu',
        description: String(error).substring(0, 100), // Show part of the error message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tải danh sách thành tựu
  const loadAchievements = async (address: string, contractInstance: ethers.Contract) => {
    try {
      const userTokenIds = await contractInstance.layDanhSachThanhTuu(address);
      // Updated for ethers v6 - convert BigInt to number
      const userTokenIdsArray = userTokenIds.map((id: bigint) => Number(id));

      const allAchievements: Achievement[] = [];

      for (let tier = 0; tier <= 3; tier++) {
        const achievement: Achievement = {
          id: -1,
          tier: tier,
          tierName: ACHIEVEMENT_TIERS[tier as keyof typeof ACHIEVEMENT_TIERS].name,
          tierColor: ACHIEVEMENT_TIERS[tier as keyof typeof ACHIEVEMENT_TIERS].color,
          electionId: 0,
          timestamp: 0,
          owned: false,
          imageUrl: TIER_IMAGES[tier as keyof typeof TIER_IMAGES],
        };
        allAchievements.push(achievement);
      }

      if (userTokenIdsArray.length > 0) {
        for (const tokenId of userTokenIdsArray) {
          try {
            const tokenInfo = await contractInstance.layThongTinThanhTuu(tokenId);
            // Updated for ethers v6
            const tier = Number(tokenInfo.capBac);
            const electionId = Number(tokenInfo.idPhienBauCu);
            const timestamp = Number(tokenInfo.thoiGian);

            const achievementIndex = allAchievements.findIndex((a) => a.tier === tier);
            if (achievementIndex !== -1) {
              allAchievements[achievementIndex] = {
                ...allAchievements[achievementIndex],
                id: tokenId,
                electionId: electionId,
                timestamp: timestamp,
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
        timestamp: 0,
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
        filtered = filtered.filter((achievement) =>
          achievement.tierName.toLowerCase().includes(term),
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
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#ECEFF1] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-6 w-6 text-[#0288D1]" />
            <h1 className="text-xl font-bold text-[#37474F]">Bộ Sưu Tập Thành Tựu</h1>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1.5 rounded-md border border-[#CFD8DC] text-[#37474F] text-sm flex items-center">
                  <span>{formatAddress(account)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 text-[#0288D1] hover:text-[#01579B]"
                    onClick={() => copyToClipboard(account)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Sao chép địa chỉ</span>
                  </Button>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <div className="h-3 w-3 rounded-full bg-[#4CAF50]"></div>
                  <span className="text-[#37474F]">{NETWORK_CONFIG.name}</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isLoading}
                className="bg-[#0288D1] hover:bg-[#01579B] text-white font-medium rounded-lg"
              >
                {isLoading ? 'Đang kết nối...' : 'Kết nối ví'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {isConnected ? (
            <>
              {/* User Info Section */}
              <Card className="bg-white border border-[#ECEFF1] rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#37474F]">
                    Thông tin người dùng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-[#37474F] font-medium w-48">Địa chỉ ví:</span>
                    <div className="flex items-center">
                      <span className="text-[#37474F]">{formatAddress(account)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-[#0288D1] hover:text-[#01579B]"
                        onClick={() => copyToClipboard(account)}
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Sao chép địa chỉ</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[#37474F] font-medium w-48">Số lần tham gia bầu cử:</span>
                    <span className="text-[#37474F]">{participationCount}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[#37474F] font-medium w-48">Tổng số thành tựu:</span>
                    <span className="text-[#37474F]">
                      {achievements.filter((a) => a.owned).length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements Gallery */}
              <Card className="bg-white border border-[#ECEFF1] rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[#37474F]">
                    Bộ sưu tập thành tựu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search and Filter */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative w-full md:w-auto md:flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm thành tựu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 border-[#CFD8DC] rounded-lg"
                      />
                    </div>

                    <Select value={filterTier} onValueChange={setFilterTier}>
                      <SelectTrigger className="w-full md:w-[180px] border-[#CFD8DC] rounded-lg">
                        <SelectValue placeholder="Lọc theo cấp bậc" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả cấp bậc</SelectItem>
                        <SelectItem value="bronze">Đồng</SelectItem>
                        <SelectItem value="silver">Bạc</SelectItem>
                        <SelectItem value="gold">Vàng</SelectItem>
                        <SelectItem value="diamond">Kim Cương</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={refreshData}
                      disabled={isLoading}
                      className="h-10 w-10 rounded-lg border-[#CFD8DC]"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Làm mới</span>
                    </Button>
                  </div>

                  {/* Achievements Grid */}
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1]"></div>
                    </div>
                  ) : filteredAchievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAchievements.map((achievement) => (
                        <div
                          key={`achievement-${achievement.tier}`}
                          className="border border-[#ECEFF1] rounded-lg p-4 flex flex-col items-center hover:shadow-md transition-shadow"
                        >
                          <div className="w-full flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              {achievement.owned ? (
                                <CheckCircle className="h-5 w-5 text-[#4CAF50]" />
                              ) : (
                                <XCircle className="h-5 w-5 text-[#CFD8DC]" />
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
                            className="w-48 h-48 mb-4 flex items-center justify-center rounded-lg overflow-hidden"
                            style={{ borderColor: achievement.tierColor, borderWidth: '2px' }}
                          >
                            <img
                              src={achievement.imageUrl || '/placeholder.svg'}
                              alt={`${achievement.tierName} Badge`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="w-full text-center mb-4">
                            <p className="text-sm text-[#37474F]">
                              ID: {achievement.owned ? achievement.id : '-'}
                            </p>
                          </div>

                          {achievement.owned ? (
                            <Button
                              onClick={() => viewAchievementDetails(achievement)}
                              className="w-full bg-[#0288D1] hover:bg-[#01579B] text-white"
                            >
                              Xem chi tiết
                            </Button>
                          ) : (
                            <Button
                              disabled
                              className="w-full bg-[#CFD8DC] text-[#90A4AE] cursor-not-allowed"
                            >
                              Chưa mở khóa
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[#37474F]">
                      Không tìm thấy thành tựu nào
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-[#0288D1] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#37474F] mb-2">
                Kết nối ví để xem thành tựu
              </h2>
              <p className="text-[#607D8B] mb-6 max-w-md mx-auto">
                Kết nối ví MetaMask của bạn để xem các thành tựu bạn đã nhận được khi tham gia bầu
                cử.
              </p>
              <Button
                onClick={connectWallet}
                disabled={isLoading}
                className="bg-[#0288D1] hover:bg-[#01579B] text-white font-medium rounded-lg"
              >
                {isLoading ? 'Đang kết nối...' : 'Kết nối ví'}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#ECEFF1] py-4 px-6 text-center text-sm text-[#37474F]">
        <div className="max-w-7xl mx-auto">
          <p>
            Mạng: {NETWORK_CONFIG.name} | RPC: {NETWORK_CONFIG.rpcUrl} | Xem thành tựu bầu cử của
            bạn
          </p>
          <div className="mt-2">
            <button
              onClick={() => alert('Hỗ trợ')}
              className="text-[#0288D1] hover:text-[#01579B] underline bg-transparent border-none cursor-pointer"
            >
              Hỗ trợ
            </button>
          </div>
        </div>
      </footer>

      {/* Achievement Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-lg">Chi tiết thành tựu</DialogTitle>
          </DialogHeader>

          {selectedAchievement && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div
                  className="w-64 h-64 flex items-center justify-center rounded-lg overflow-hidden"
                  style={{ borderColor: selectedAchievement.tierColor, borderWidth: '2px' }}
                >
                  <img
                    src={selectedAchievement.imageUrl || '/placeholder.svg'}
                    alt={`${selectedAchievement.tierName} Badge`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Cấp bậc:</span>
                  <span style={{ color: selectedAchievement.tierColor }} className="font-semibold">
                    {selectedAchievement.tierName}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">ID Token:</span>
                  <span>{selectedAchievement.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Phiên bầu cử:</span>
                  <span>{selectedAchievement.electionId}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Thời gian nhận:</span>
                  <span>{formatTimestamp(selectedAchievement.timestamp)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">Chủ sở hữu:</span>
                  <div className="flex items-center">
                    <span>{formatAddress(account)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1 text-[#0288D1] hover:text-[#01579B]"
                      onClick={() => copyToClipboard(account)}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Sao chép địa chỉ</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
              className="w-full sm:w-auto"
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
