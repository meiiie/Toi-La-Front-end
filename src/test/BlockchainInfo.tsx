'use client';

import React, { useState, useEffect } from 'react';
import { ethers, formatEther, Contract, JsonRpcProvider } from 'ethers';
import {
  Network,
  Loader,
  AlertCircle,
  CheckCircle,
  Info,
  Database,
  ExternalLink,
  RefreshCw,
  Hexagon,
  Copy,
  Shield,
} from 'lucide-react';
import { useToast } from '../test/components/use-toast';

interface BlockchainInfoProps {
  walletAddress?: string;
}

const BlockchainInfo: React.FC<BlockchainInfoProps> = ({ walletAddress }) => {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [networkInfo, setNetworkInfo] = useState<{
    chainId: number;
    name: string;
    blockNumber: number;
    connected: boolean;
  } | null>(null);
  const [walletBalance, setWalletBalance] = useState<{
    eth: string;
    hlu: string;
  } | null>(null);
  const [systemInfo, setSystemInfo] = useState<{
    totalElections: number;
    activeElections: number;
    hasActiveSession: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { toast } = useToast();

  // HLU Token address - Cập nhật từ luonghoanchinh.js
  const HLU_TOKEN_ADDRESS = '0x820F15F12Aa75BAa89A16B20768024C8604Ea16f';

  // ABI của QuanLyCuocBauCu để hiển thị thông tin hệ thống
  const QUANLYCUOCBAUCU_ABI = [
    'function layThongTinCoBan(uint256 idCuocBauCu) external view returns (address nguoiSoHuu, bool dangHoatDongDay, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, string memory tenCuocBauCu, uint256 phiHLU)',
    'function soLuongCuocBauCuTonTai() external view returns (uint256)',
    'function coPhienBauCuDangHoatDong() external view returns (bool)',
  ];

  // HLU Token ABI tối thiểu
  const HLU_TOKEN_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
  ];

  // Khởi tạo provider
  useEffect(() => {
    try {
      const rpcUrl = 'https://geth.holihu.online/rpc';
      console.log('BlockchainInfo: Kết nối tới RPC:', rpcUrl);
      const newProvider = new JsonRpcProvider(rpcUrl);
      setProvider(newProvider);
    } catch (error) {
      console.error('Lỗi khi kết nối với blockchain:', error);
      setError('Không thể kết nối với blockchain');
      setIsLoading(false);
    }
  }, []);

  // Lấy thông tin mạng
  useEffect(() => {
    if (!provider) return;

    const fetchNetworkInfo = async () => {
      try {
        const [network, blockNumber] = await Promise.all([
          provider.getNetwork(),
          provider.getBlockNumber(),
        ]);

        setNetworkInfo({
          chainId: Number(network.chainId),
          name: network.chainId === 210 ? 'HoLiHu Blockchain' : `Chain ID ${network.chainId}`,
          blockNumber,
          connected: true,
        });
      } catch (error) {
        console.error('Lỗi khi lấy thông tin mạng:', error);
        setError('Không thể lấy thông tin mạng blockchain');
        setNetworkInfo({
          chainId: 0,
          name: 'Không xác định',
          blockNumber: 0,
          connected: false,
        });
      }
    };

    fetchNetworkInfo();

    // Thiết lập polling để cập nhật số block
    const intervalId = setInterval(() => {
      provider
        .getBlockNumber()
        .then((blockNumber) => {
          setNetworkInfo((prev) => (prev ? { ...prev, blockNumber } : null));
        })
        .catch((error) => {
          console.error('Lỗi khi cập nhật số block:', error);
        });
    }, 15000); // 15 giây

    return () => clearInterval(intervalId);
  }, [provider]);

  // Lấy số dư ví nếu có địa chỉ ví và thông tin hệ thống
  useEffect(() => {
    if (!provider || !networkInfo?.connected) {
      setIsLoading(false);
      return;
    }

    const fetchWalletBalance = async () => {
      setIsLoading(true);
      try {
        if (walletAddress) {
          // Lấy số dư ETH
          const ethBalance = await provider.getBalance(walletAddress);

          // Lấy số dư HLU token
          const hluToken = new Contract(HLU_TOKEN_ADDRESS, HLU_TOKEN_ABI, provider);
          const hluBalance = await hluToken.balanceOf(walletAddress);

          setWalletBalance({
            eth: formatEther(ethBalance),
            hlu: formatEther(hluBalance),
          });
        }

        // Kết nối tới QuanLyCuocBauCu để lấy thông tin hệ thống
        try {
          // Địa chỉ QuanLyCuocBauCu lấy từ Factory hoặc dùng trực tiếp
          // Địa chỉ này chỉ là ví dụ, cần thay bằng địa chỉ thật từ Factory
          const sampleAddress = '0xb10E07D4a7e61648BcB25032C0260C23699bD8ed';
          const quanLyCuocBauCuContract = new Contract(
            sampleAddress,
            QUANLYCUOCBAUCU_ABI,
            provider,
          );

          // Lấy thông tin cuộc bầu cử tồn tại
          const totalElections = await quanLyCuocBauCuContract.soLuongCuocBauCuTonTai();

          // Kiểm tra có phiên đang hoạt động không
          const hasActiveSession = await quanLyCuocBauCuContract.coPhienBauCuDangHoatDong();

          // Lấy thông tin cơ bản của cuộc bầu cử id=1
          const basicInfo = await quanLyCuocBauCuContract.layThongTinCoBan(1);

          // Cập nhật thông tin hệ thống
          setSystemInfo({
            totalElections: Number(totalElections),
            activeElections: basicInfo[1] ? 1 : 0, // dangHoatDongDay
            hasActiveSession,
          });
        } catch (error) {
          console.error('Lỗi khi lấy thông tin hệ thống:', error);
          // Không hiển thị lỗi khi không lấy được thông tin hệ thống
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin:', error);
        setError('Không thể lấy thông tin');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletBalance();
  }, [provider, walletAddress, networkInfo?.connected]);

  // Làm mới thông tin
  const handleRefresh = async () => {
    if (!provider) return;

    setIsLoading(true);
    setError('');

    try {
      // Cập nhật thông tin mạng
      const [network, blockNumber] = await Promise.all([
        provider.getNetwork(),
        provider.getBlockNumber(),
      ]);

      setNetworkInfo({
        chainId: Number(network.chainId),
        name: network.chainId === 210 ? 'HoLiHu Blockchain' : `Chain ID ${network.chainId}`,
        blockNumber,
        connected: true,
      });

      // Cập nhật số dư ví nếu có
      if (walletAddress) {
        const ethBalance = await provider.getBalance(walletAddress);

        const hluToken = new Contract(HLU_TOKEN_ADDRESS, HLU_TOKEN_ABI, provider);
        const hluBalance = await hluToken.balanceOf(walletAddress);

        setWalletBalance({
          eth: formatEther(ethBalance),
          hlu: formatEther(hluBalance),
        });
      }

      // Cập nhật thông tin hệ thống
      try {
        // Địa chỉ QuanLyCuocBauCu lấy từ Factory hoặc dùng trực tiếp
        const sampleAddress = '0xb10E07D4a7e61648BcB25032C0260C23699bD8ed';
        const quanLyCuocBauCuContract = new Contract(sampleAddress, QUANLYCUOCBAUCU_ABI, provider);

        // Lấy thông tin cuộc bầu cử tồn tại
        const totalElections = await quanLyCuocBauCuContract.soLuongCuocBauCuTonTai();

        // Kiểm tra có phiên đang hoạt động không
        const hasActiveSession = await quanLyCuocBauCuContract.coPhienBauCuDangHoatDong();

        // Lấy thông tin cơ bản của cuộc bầu cử id=1
        const basicInfo = await quanLyCuocBauCuContract.layThongTinCoBan(1);

        // Cập nhật thông tin hệ thống
        setSystemInfo({
          totalElections: Number(totalElections),
          activeElections: basicInfo[1] ? 1 : 0, // dangHoatDongDay
          hasActiveSession,
        });
      } catch (error) {
        console.error('Lỗi khi cập nhật thông tin hệ thống:', error);
      }

      toast({
        title: 'Đã cập nhật',
        description: 'Thông tin blockchain đã được làm mới',
      });
    } catch (error) {
      console.error('Lỗi khi làm mới thông tin:', error);
      setError('Không thể làm mới thông tin blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  // Sao chép địa chỉ vào clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: 'Thông tin đã được sao chép vào clipboard',
    });
  };

  // Rút gọn địa chỉ
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Network className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Thông tin Blockchain
          </h2>
        </div>
        <div className="flex justify-center items-center p-8">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="ml-3 text-gray-600 dark:text-gray-300">Đang kết nối...</p>
        </div>
      </div>
    );
  }

  if (error || !networkInfo?.connected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Network className="w-5 h-5 text-red-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Thông tin Blockchain
          </h2>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <p className="text-red-800 dark:text-red-300 font-medium">
                Không thể kết nối đến blockchain
              </p>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                {error || 'Vui lòng kiểm tra kết nối mạng và thử lại'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Thử lại kết nối
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Network className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Thông tin Blockchain
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mạng blockchain</div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Shield className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
            <span>{networkInfo.name}</span>
            {networkInfo.chainId === 210 && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chain ID</div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Hexagon className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
            <span>{networkInfo.chainId}</span>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 mb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Block hiện tại</div>
        <div className="flex items-center text-gray-700 dark:text-gray-300">
          <Database className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
          <span>{networkInfo.blockNumber.toLocaleString()}</span>
          <a
            href={`https://explorer.holihu.online/blocks/${networkInfo.blockNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Thông tin hệ thống bầu cử */}
      {systemInfo && (
        <div className="mt-4 mb-5">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Thông tin hệ thống bầu cử
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Tổng số cuộc bầu cử
              </div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">
                {systemInfo.totalElections}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Cuộc bầu cử đang hoạt động
              </div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">
                {systemInfo.activeElections}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Trạng thái phiên bầu cử
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                {systemInfo.hasActiveSession ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Đang diễn ra</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    <span>Không hoạt động</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {walletAddress && walletBalance && (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Thông tin ví
          </h3>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 mb-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Địa chỉ ví</div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <span className="font-mono">{shortenAddress(walletAddress)}</span>
              <button
                onClick={() => copyToClipboard(walletAddress)}
                className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Sao chép địa chỉ"
              >
                <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </button>
              <a
                href={`https://explorer.holihu.online/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">ETH Balance</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">
                {Number(walletBalance.eth).toFixed(6)} ETH
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">HLU Balance</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">
                {Number(walletBalance.hlu).toFixed(2)} HLU
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start">
          <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Tất cả giao dịch tạo và quản lý cuộc bầu cử được ghi lại trên HoLiHu Blockchain đảm bảo
            tính minh bạch, bất biến và có thể kiểm chứng.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockchainInfo;
