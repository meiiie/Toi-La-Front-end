'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Vote,
  User,
  Shield,
  Check,
  CheckCircle,
  Star,
  Sparkles,
  Loader2,
  Info,
  AlertTriangle,
  Lock,
  ExternalLink,
  Copy,
  Database,
} from 'lucide-react';

// Components
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Separator } from '../components/ui/Separator';
import NFTBallotPreview from '../components/election-session-manager/NFTBallotPreview';
import { useToast } from './components/use-toast';

// QuanLyPhieuBauToanCuc ABI (simplified for this example)
const QuanLyPhieuBauToanCucABI = [
  'function kiemTraQuyenBauCu(address cuTri, uint128 serverId, uint256 idPhienBauCu, uint256 idToken) external view returns (bool)',
  'function boPhieu(uint256 idToken, uint128 serverId, uint256 idPhienBauCu, address ungVien) external',
  'function daBoPhieu(uint128 serverId, uint256 idPhienBauCu, address cuTri) external view returns (bool)',
  'function tokenDenPhienBauCu(uint256 idToken) external view returns (uint256)',
];

// QuanLyCuocBauCu ABI (simplified for this example)
const QuanLyCuocBauCuABI = [
  'function layDanhSachUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory)',
  'function laySoPhieuUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien) external view returns (uint256)',
];

// Contract addresses
const CONTRACT_ADDRESSES = {
  cuocBauCu: '0x83d076026Cb9fea8694e9cBED3D30116C1DE5f74',
  quanLyPhieuBau: '0xEc113165EedF505CF66D70c67d3216603B450e16',
  quanLyCuocBauCu: '0x9d8cB9C2eD2EFedae3F7C660ceDCBBc90BA48dd8',
  entryPoint: '0x5c1Ec052254B485A97eFeCdE6dEC5A7c3c171656',
  scwAddress: '0x066BAdad3aEcfe447a31B3f3994C28F73a1A314F',
};

// Election and session IDs
const ID_CUOC_BAU_CU = 1;
const ID_PHIEN_BAU_CU = 3;

const BoPhieuPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [phieuBau, setPhieuBau] = useState(null);
  const [danhSachUngVien, setDanhSachUngVien] = useState([]);
  const [selectedUngVien, setSelectedUngVien] = useState(null);
  const [daBoPhieu, setDaBoPhieu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [tokenId, setTokenId] = useState(null);

  // Mock data for development/demo
  const mockPhieuBau = {
    tokenId: Math.floor(Math.random() * 10000),
    name: 'Phiếu bầu cử - Phiên bầu cử 3',
    description: 'Phiếu bầu chính thức cho phiên bầu cử ID 3 thuộc cuộc bầu cử ID 1',
    imageUrl: 'ipfs://Qmcfw6sFAWMpKMcpRHmxewuhjmdvs3sNS5LQHkGVf1kJ98.png',
    attributes: [
      { trait_type: 'Loại phiếu', value: 'Phiếu bầu cử chính thức' },
      { trait_type: 'Đơn vị tổ chức', value: 'HoLiHu Blockchain' },
      { trait_type: 'Khu vực bầu cử', value: 'Trực tuyến' },
      { trait_type: 'Mã phiên bầu cử', value: `PBC-${ID_PHIEN_BAU_CU}` },
      { trait_type: 'Thời gian', value: new Date().toISOString() },
    ],
    background_color: 'f8f9fa',
    ipfsGateways: [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
    ],
  };

  const mockUngVien = [
    {
      id: '1',
      address: '0x1234567890123456789012345678901234567890',
      ten: 'Nguyễn Văn A',
      moTa: 'Ứng viên chức danh Chủ tịch',
      viTriUngCu: { tenViTriUngCu: 'Chủ tịch' },
      anhDaiDien: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      soPhieu: 12,
    },
    {
      id: '2',
      address: '0x2345678901234567890123456789012345678901',
      ten: 'Trần Thị B',
      moTa: 'Ứng viên chức danh Phó Chủ tịch',
      viTriUngCu: { tenViTriUngCu: 'Phó Chủ tịch' },
      anhDaiDien: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      soPhieu: 8,
    },
    {
      id: '3',
      address: '0x3456789012345678901234567890123456789012',
      ten: 'Lê Văn C',
      moTa: 'Ứng viên chức danh Thư ký',
      viTriUngCu: { tenViTriUngCu: 'Thư ký' },
      anhDaiDien: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      soPhieu: 5,
    },
  ];

  // Connect to wallet
  const connectWallet = async () => {
    try {
      setConnectingWallet(true);
      setError('');

      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // In a real app, you would now initialize contracts and fetch data
        // For demo purposes, we'll simulate a delay and use mock data
        await new Promise((resolve) => setTimeout(resolve, 1200));

        setConnected(true);
        setTokenId(mockPhieuBau.tokenId);
        setPhieuBau(mockPhieuBau);
        setDanhSachUngVien(mockUngVien);

        // Check if user has already voted
        const hasVoted = await checkIfUserHasVoted();
        setDaBoPhieu(hasVoted);

        toast({
          title: 'Kết nối thành công',
          description: 'Đã kết nối với ví blockchain của bạn',
        });
      } else {
        setError('Vui lòng cài đặt MetaMask để tương tác với blockchain');
        toast({
          title: 'Lỗi kết nối',
          description: 'Vui lòng cài đặt MetaMask để tương tác với blockchain',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Có lỗi xảy ra khi kết nối ví: ' + err.message);
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể kết nối với ví blockchain',
        variant: 'destructive',
      });
    } finally {
      setConnectingWallet(false);
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        // For demo purposes, check if MetaMask is installed but don't connect yet
        if (typeof window.ethereum !== 'undefined') {
          // In a real app, we would check if the user is already connected
          // and immediately fetch their ballot and candidate data

          // For demo, we'll just set loading to false after a delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          setError(
            'MetaMask không được cài đặt. Vui lòng cài đặt MetaMask để sử dụng ứng dụng này.',
          );
        }
      } catch (err) {
        console.error('Error in initial data load:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu ban đầu');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Check if user has already voted
  const checkIfUserHasVoted = async () => {
    // In a real app, this would call the smart contract
    // For demo, we'll return false by default
    return false;
  };

  // Handle IPFS gateway change
  const handleGatewayChange = () => {
    if (phieuBau && phieuBau.ipfsGateways && phieuBau.ipfsGateways.length > 0) {
      setCurrentGatewayIndex((currentGatewayIndex + 1) % phieuBau.ipfsGateways.length);
    }
  };

  // Handle voting
  const handleBoPhieu = async () => {
    if (!selectedUngVien) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ứng viên để bỏ phiếu',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Find the selected candidate
      const ungVien = danhSachUngVien.find((uv) => uv.id === selectedUngVien);

      if (!ungVien) {
        throw new Error('Không tìm thấy thông tin ứng viên');
      }

      // In a real app, this would call the smart contract method boPhieu()
      // For demo purposes, we'll simulate a blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate a mock transaction hash
      const mockTxHash =
        '0x' +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      setTransactionHash(mockTxHash);
      setDaBoPhieu(true);

      toast({
        title: 'Bỏ phiếu thành công',
        description: `Bạn đã bỏ phiếu cho ${ungVien.ten} thành công!`,
      });
    } catch (err) {
      console.error('Error voting:', err);
      setError(err.message || 'Có lỗi xảy ra khi bỏ phiếu');
      toast({
        title: 'Lỗi',
        description: err.message || 'Có lỗi xảy ra khi bỏ phiếu',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Vote className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Bỏ phiếu bầu cử trên blockchain
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              <Calendar className="mr-1 h-3.5 w-3.5" />
              Cuộc bầu cử ID: {ID_CUOC_BAU_CU} | Phiên ID: {ID_PHIEN_BAU_CU}
            </Badge>
            {!connected ? (
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                onClick={connectWallet}
                disabled={connectingWallet}
              >
                {connectingWallet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang kết nối...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Kết nối ví
                  </>
                )}
              </Button>
            ) : (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Đã kết nối ({CONTRACT_ADDRESSES.scwAddress.substring(0, 6)}...
                {CONTRACT_ADDRESSES.scwAddress.substring(38)})
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Đang tải thông tin bầu cử...</p>
          </div>
        ) : error && !connected ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !connected ? (
          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <Shield className="h-16 w-16 text-blue-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Kết nối ví blockchain
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Để tham gia bỏ phiếu, bạn cần kết nối ví blockchain của mình với ứng dụng. Điều này sẽ
              cho phép bạn truy cập phiếu bầu và bỏ phiếu.
            </p>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full"
              onClick={connectWallet}
              disabled={connectingWallet}
            >
              {connectingWallet ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kết nối...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Kết nối ví blockchain
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phiếu bầu NFT column */}
            <div className="lg:order-1 order-2">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <Database className="h-5 w-5 text-blue-500 mr-2" />
                      Phiếu bầu NFT #{tokenId}
                    </h2>
                    <Badge
                      className={`${daBoPhieu ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'}`}
                    >
                      {daBoPhieu ? (
                        <>
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          Đã bỏ phiếu
                        </>
                      ) : (
                        <>
                          <Info className="mr-1 h-3.5 w-3.5" />
                          Chưa bỏ phiếu
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="relative">
                    {/* Phiếu bầu NFT preview */}
                    <div className={`${daBoPhieu ? 'opacity-60' : ''} transition-all duration-300`}>
                      {phieuBau && (
                        <NFTBallotPreview
                          name={phieuBau.name}
                          description={phieuBau.description}
                          imageUrl={phieuBau.imageUrl}
                          attributes={phieuBau.attributes}
                          backgroundColor={phieuBau.background_color}
                          ipfsGateways={phieuBau.ipfsGateways}
                          currentGatewayIndex={currentGatewayIndex}
                          onGatewayChange={handleGatewayChange}
                        />
                      )}
                    </div>

                    {/* Watermark stamp effect when voted */}
                    {daBoPhieu && (
                      <motion.div
                        initial={{ opacity: 0, rotate: -20, scale: 1.5 }}
                        animate={{ opacity: 1, rotate: -20, scale: 1 }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      >
                        <div className="relative">
                          <svg
                            width="220"
                            height="120"
                            viewBox="0 0 220 120"
                            className="opacity-80"
                          >
                            <defs>
                              <filter id="blur-filter" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                              </filter>
                            </defs>
                            <ellipse
                              cx="110"
                              cy="60"
                              rx="110"
                              ry="60"
                              fill="#4CAF50"
                              fillOpacity="0.2"
                              filter="url(#blur-filter)"
                            />
                          </svg>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-20deg]">
                            <div className="text-green-600 dark:text-green-500 font-bold text-4xl border-8 border-green-600 dark:border-green-500 px-6 py-2 rounded-lg shadow-2xl">
                              ĐÃ BỎ PHIẾU
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {daBoPhieu && (
                <Alert className="bg-green-50/70 dark:bg-green-900/20 border border-green-100/50 dark:border-green-800/30 backdrop-blur-sm mb-4">
                  <div className="flex flex-col space-y-2">
                    <div className="font-medium text-green-800 dark:text-green-300 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Phiếu bầu đã được ghi nhận thành công
                    </div>
                    <Separator className="my-1" />
                    <div className="text-sm text-green-700 dark:text-green-400">
                      <div className="flex justify-between items-center mb-1">
                        <span>Mã giao dịch:</span>
                        <span className="font-mono text-xs select-all">{transactionHash}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Thời gian:</span>
                        <span>{new Date().toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                </Alert>
              )}

              {!daBoPhieu && connected && (
                <Alert className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    Phiếu bầu của bạn sẽ được lưu trữ dưới dạng NFT trên blockchain. Sau khi bỏ
                    phiếu, phiếu bầu NFT sẽ được đánh dấu là đã sử dụng.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Candidates column */}
            <div className="lg:order-2 order-1">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                    <User className="h-5 w-5 text-blue-500 mr-2" />
                    Danh sách ứng viên
                  </h2>

                  {danhSachUngVien.length > 0 ? (
                    <div className="space-y-3">
                      {danhSachUngVien.map((ungVien) => (
                        <div
                          key={ungVien.id}
                          className={`flex items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer
                            ${
                              selectedUngVien === ungVien.id
                                ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/70 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }
                            ${daBoPhieu ? 'opacity-60 cursor-not-allowed' : ''}`}
                          onClick={() => !daBoPhieu && setSelectedUngVien(ungVien.id)}
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 border border-gray-200 dark:border-gray-700">
                            <img
                              src={ungVien.anhDaiDien}
                              alt={ungVien.ten}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {ungVien.ten}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {ungVien.viTriUngCu.tenViTriUngCu}
                            </p>
                          </div>
                          {ungVien.soPhieu > 0 && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 ml-2">
                              {ungVien.soPhieu} phiếu
                            </Badge>
                          )}
                          <div className="ml-3">
                            <div
                              className={`h-5 w-5 rounded-full flex items-center justify-center
                              ${
                                selectedUngVien === ungVien.id
                                  ? 'bg-blue-500 dark:bg-blue-600'
                                  : 'border-2 border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {selectedUngVien === ungVien.id && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Không có ứng viên
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Hiện chưa có ứng viên nào trong phiên bầu cử này.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  onClick={handleBoPhieu}
                  disabled={!selectedUngVien || daBoPhieu || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : daBoPhieu ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Đã bỏ phiếu
                    </>
                  ) : (
                    <>
                      <Vote className="mr-2 h-4 w-4" />
                      Bỏ phiếu
                    </>
                  )}
                </Button>
              </div>

              {/* Instructions */}
              {connected && !daBoPhieu && (
                <Alert className="mt-4 bg-yellow-50/70 dark:bg-yellow-900/20 border border-yellow-100/50 dark:border-yellow-800/30 backdrop-blur-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                    <span className="font-medium">Lưu ý quan trọng:</span> Mỗi cử tri chỉ được bỏ
                    phiếu một lần trong mỗi phiên bầu cử. Sau khi bỏ phiếu, bạn không thể thay đổi
                    lựa chọn của mình.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Powered by HoLiHu Blockchain
              </span>
            </div>
            <div className="flex space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Lock className="h-4 w-4 mr-1 text-green-500" />
                Bảo mật bởi công nghệ Blockchain
              </div>
              <a
                href={`https://example.com/explorer/address/${CONTRACT_ADDRESSES.cuocBauCu}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Xem trên blockchain explorer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoPhieuPage;
