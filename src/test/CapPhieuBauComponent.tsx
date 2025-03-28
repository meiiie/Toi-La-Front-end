'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Search, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Checkbox } from '../components/ui/Checkbox';
import { Progress } from '../components/ui/Progress';
import { useToast } from './components/use-toast';
import { Toaster } from '../components/ui/Toaster';
import ConnectWallet from './components/connect-wallet2';
import SessionInfo from './components/session-info';
import VoterTable from './components/voter-table';
import IssuedVotersList from './components/issued-voters-list';

// ABI của smart contract QuanLyPhienBauCu
const quanLyPhienBauCuABI = [
  'function layThoiGianBatDauPhienBauCu(uint256 idPhienBauCu) view returns (uint256)',
  'function layThoiGianKetThucPhienBauCu(uint256 idPhienBauCu) view returns (uint256)',
  'function dangHoatDong(uint256 idPhienBauCu) view returns (bool)',
  'function soCuTriToiDa(uint256 idPhienBauCu) view returns (uint256)',
  'function laCuTri(uint256 idPhienBauCu, address cuTri) view returns (bool)',
  'function daNhanNFT(uint256 idPhienBauCu, address cuTri) view returns (bool)',
  'function capPhieuBauChoCuTri(uint256 idPhienBauCu, address cuTri, string memory tokenURI) returns (uint256)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'event PhieuBauDaCap(uint256 indexed idPhienBauCu, address indexed cuTri, uint256 indexed tokenId)',
];

// Địa chỉ smart contract
const quanLyPhienBauCuAddress = '0x123456789abcdef123456789abcdef123456789'; // Thay bằng địa chỉ thực tế

// Role constants
const QUANTRI_CUOCBAUCU = ethers.keccak256(ethers.toUtf8Bytes('QUANTRI_CUOCBAUCU'));
const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));

// Interface cho cử tri từ SQL backend
interface Voter {
  address: string;
  name: string;
  id: string;
  isSelected?: boolean;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const [sessionId, setSessionId] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [selectedVoters, setSelectedVoters] = useState<Set<string>>(new Set());
  const [tokenURITemplate, setTokenURITemplate] = useState<string>('ipfs://vote{id}.json');
  const [issuanceStatus, setIssuanceStatus] = useState<'idle' | 'issuing' | 'issued' | 'error'>(
    'idle',
  );
  const [issuanceProgress, setIssuanceProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [issuedVoters, setIssuedVoters] = useState<
    Array<{ address: string; tokenId: string; status: string }>
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Kết nối MetaMask và khởi tạo contract
  useEffect(() => {
    const initializeProvider = async () => {
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
          setNetworkStatus('connected');

          const accounts = await web3Provider.listAccounts();
          if (accounts.length > 0) {
            const userSigner = await web3Provider.getSigner();
            setSigner(userSigner);
            setAccount(accounts[0].address);

            const contractInstance = new ethers.Contract(
              quanLyPhienBauCuAddress,
              quanLyPhienBauCuABI,
              userSigner,
            );
            setContract(contractInstance);

            // Kiểm tra quyền admin
            const hasAdminRole = await contractInstance.hasRole(
              QUANTRI_CUOCBAUCU,
              accounts[0].address,
            );
            const hasOrganizerRole = await contractInstance.hasRole(BANTOCHUC, accounts[0].address);
            setIsAdmin(hasAdminRole || hasOrganizerRole);
          }
        } catch (error) {
          console.error('Lỗi kết nối:', error);
          setNetworkStatus('disconnected');
        }
      }
    };

    initializeProvider();
  }, []);

  // Kết nối WebSocket để lắng nghe sự kiện PhieuBauDaCap
  useEffect(() => {
    if (!sessionId || !contract) return;

    let wsProvider: ethers.WebSocketProvider | null = null;
    let wsContract: ethers.Contract | null = null;

    const setupWebSocket = async () => {
      try {
        wsProvider = new ethers.WebSocketProvider('wss://geth.holihu.online/ws');
        wsContract = new ethers.Contract(quanLyPhienBauCuAddress, quanLyPhienBauCuABI, wsProvider);

        const filter = wsContract.filters.PhieuBauDaCap(Number.parseInt(sessionId), null, null);

        wsContract.on(filter, (idPhienBauCu, cuTri, tokenId) => {
          setIssuedVoters((prev) => {
            const exists = prev.some(
              (voter) => voter.address.toLowerCase() === cuTri.toLowerCase(),
            );
            if (!exists) {
              return [
                ...prev,
                {
                  address: cuTri,
                  tokenId: tokenId.toString(),
                  status: 'issued',
                },
              ];
            }
            return prev;
          });

          toast({
            title: 'Phiếu bầu đã cấp',
            description: `Đã cấp phiếu bầu cho cử tri ${cuTri.substring(0, 6)}...${cuTri.substring(38)}`,
          });
        });
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    setupWebSocket();

    return () => {
      if (wsContract) {
        wsContract.removeAllListeners();
      }
      if (wsProvider) {
        wsProvider.destroy();
      }
    };
  }, [sessionId, contract, toast]);

  // Tải thông tin phiên bầu cử và danh sách cử tri từ SQL backend
  const loadSession = async () => {
    if (!contract || !sessionId) return;

    setIsLoading(true);
    try {
      const id = Number.parseInt(sessionId);
      const isActive = await contract.dangHoatDong(id);
      const startTime = await contract.layThoiGianBatDauPhienBauCu(id);
      const endTime = await contract.layThoiGianKetThucPhienBauCu(id);
      const maxVoters = await contract.soCuTriToiDa(id);

      setSessionInfo({
        id,
        name: `Phiên bầu cử #${id}`,
        isActive,
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(endTime) * 1000),
        maxVoters: Number(maxVoters),
        currentVoters: 0,
      });

      // Lấy danh sách cử tri từ SQL backend
      const response = await fetch(`/api/voters?sessionId=${id}`);
      if (!response.ok) throw new Error('Failed to fetch voters');
      const voterData = await response.json();
      setVoters(voterData);

      toast({
        title: 'Đã tải phiên bầu cử',
        description: `Phiên bầu cử #${id} ${isActive ? 'đang hoạt động' : 'không hoạt động'}`,
      });
    } catch (error) {
      console.error('Lỗi tải phiên bầu cử:', error);
      toast({
        title: 'Lỗi tải phiên bầu cử',
        description: 'Không thể tải thông tin phiên bầu cử. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cấp phiếu bầu hàng loạt cho các cử tri đã chọn
  const issueVotingTickets = async () => {
    if (!contract || !sessionId || selectedVoters.size === 0) return;

    setIssuanceStatus('issuing');
    setIssuanceProgress({ current: 0, total: selectedVoters.size });

    try {
      const id = Number.parseInt(sessionId);
      let successCount = 0;
      let failCount = 0;

      for (const voterAddress of selectedVoters) {
        try {
          const tokenURI = tokenURITemplate.replace('{id}', (successCount + 1).toString());
          const tx = await contract.capPhieuBauChoCuTri(id, voterAddress, tokenURI);
          await tx.wait();
          successCount++;
        } catch (error) {
          console.error(`Lỗi cấp phiếu cho ${voterAddress}:`, error);
          failCount++;
        }

        setIssuanceProgress((prev) => ({ ...prev, current: successCount + failCount }));
      }

      setIssuanceStatus('issued');
      setSelectedVoters(new Set());

      toast({
        title: 'Hoàn tất cấp phiếu bầu',
        description: `Đã cấp thành công ${successCount} phiếu, thất bại ${failCount} phiếu`,
      });
    } catch (error) {
      console.error('Lỗi cấp phiếu bầu:', error);
      setIssuanceStatus('error');

      toast({
        title: 'Lỗi cấp phiếu bầu',
        description: 'Đã xảy ra lỗi trong quá trình cấp phiếu bầu.',
        variant: 'destructive',
      });
    }
  };

  // Xử lý chọn/bỏ chọn tất cả cử tri
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVoterAddresses = new Set(voters.map((voter) => voter.address));
      setSelectedVoters(allVoterAddresses);
    } else {
      setSelectedVoters(new Set());
    }
  };

  // Xử lý chọn/bỏ chọn một cử tri
  const handleSelectVoter = (voterAddress: string, checked: boolean) => {
    const newSelected = new Set(selectedVoters);
    if (checked) {
      newSelected.add(voterAddress);
    } else {
      newSelected.delete(voterAddress);
    }
    setSelectedVoters(newSelected);
  };

  // Lọc danh sách cử tri theo từ khóa tìm kiếm
  const filteredVoters = voters.filter(
    (voter) =>
      voter.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">Admin Cấp Phiếu Bầu Hàng Loạt</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${networkStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm text-gray-600">POA Geth</span>
            </div>

            <ConnectWallet
              account={account}
              isAdmin={isAdmin}
              onConnect={async () => {
                try {
                  if (window.ethereum) {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Lỗi kết nối ví:', error);
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Session Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Chọn Phiên Bầu Cử</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="w-full space-y-2">
                      <Label htmlFor="sessionId">ID Phiên Bầu Cử</Label>
                      <Input
                        id="sessionId"
                        placeholder="Nhập ID phiên bầu cử"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={loadSession} disabled={!sessionId || isLoading}>
                        {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Tải Phiên
                      </Button>
                    </div>
                  </div>

                  {sessionInfo && <SessionInfo session={sessionInfo} />}
                </div>
              </CardContent>
            </Card>

            {/* Voter Selection & Issuance */}
            <Card>
              <CardHeader>
                <CardTitle>Chọn và Cấp Phiếu Bầu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                      <Input
                        placeholder="Tìm kiếm cử tri..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedVoters.size === voters.length}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                    <Label htmlFor="selectAll">Chọn Tất Cả</Label>
                  </div>

                  <VoterTable
                    voters={filteredVoters}
                    selectedVoters={selectedVoters}
                    onSelectVoter={handleSelectVoter}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="tokenURI">Token URI Template</Label>
                    <Input
                      id="tokenURI"
                      placeholder="Nhập token URI template (ví dụ: ipfs://vote{id}.json)"
                      value={tokenURITemplate}
                      onChange={(e) => setTokenURITemplate(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={issueVotingTickets}
                    disabled={
                      !sessionInfo || selectedVoters.size === 0 || issuanceStatus === 'issuing'
                    }
                  >
                    {issuanceStatus === 'issuing' ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Đang Cấp Phiếu...
                      </>
                    ) : (
                      `Cấp Phiếu Cho ${selectedVoters.size} Cử Tri`
                    )}
                  </Button>

                  {issuanceStatus === 'issuing' && (
                    <div className="space-y-2">
                      <Progress value={(issuanceProgress.current / issuanceProgress.total) * 100} />
                      <p className="text-sm text-center text-gray-500">
                        {issuanceProgress.current} / {issuanceProgress.total} phiếu đã cấp
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm">
                    {issuanceStatus === 'idle' && (
                      <>
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Chọn cử tri để cấp phiếu</span>
                      </>
                    )}
                    {issuanceStatus === 'issuing' && (
                      <>
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-500">Đang cấp phiếu...</span>
                      </>
                    )}
                    {issuanceStatus === 'issued' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-500">Đã cấp phiếu thành công</span>
                      </>
                    )}
                    {issuanceStatus === 'error' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-500">Lỗi cấp phiếu</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div>
            {/* Issued Voters */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Danh Sách Cử Tri Đã Cấp Phiếu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                      <Input
                        placeholder="Tìm kiếm địa chỉ cử tri"
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={() => loadSession()}>
                      <RefreshCw className="w-4 h-4" />
                      <span className="sr-only">Làm mới</span>
                    </Button>
                  </div>

                  <IssuedVotersList voters={issuedVoters} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 mt-8 text-sm text-center text-gray-600 border-t border-gray-200">
        <div className="container px-4 mx-auto">
          <p>
            Network: POA Geth | RPC: https://geth.holihu.online/rpc | WebSocket:
            wss://geth.holihu.online/ws
          </p>
          <p className="mt-1">
            <a href="#" className="text-blue-600 hover:underline">
              Hướng Dẫn Admin
            </a>
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
