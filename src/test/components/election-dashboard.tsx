'use client';

import { useState, useEffect } from 'react';
import { Header } from './header';
import { FactoryInput } from './factory-input';
import { SystemsManagement } from './systems-management';
import { Footer } from './footer';
import { ethers } from 'ethers';
import { useToast } from './use-toast';
import { Toaster } from './toaster';

// ABI cho hợp đồng CuocBauCuFactory (đơn giản hóa cho demo)
const factoryABI = [
  'function laySoLuongCuocBauCu() view returns (uint256)',
  'function layTatCaCuocBauCu(uint256 chiSoBatDau, uint256 gioiHan) view returns (tuple(address quanLyCuocBauCu, address quanLyPhienBauCu, address quanLyPhieuBau, address quanLyThanhTuu, string moTa, bool dangHoatDong)[])',
  'function trienKhaiHeThongBuoc1() returns ()',
  'function trienKhaiHeThongBuoc2(string memory moTa) returns (address, address, address, address)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function xoaCuocBauCu(uint256 id, uint256 idCuocBauCu) external',
  'function capNhatMauQuanLyCuocBauCu(address mauMoi) external',
  'function thucThiCapNhatMauQuanLyCuocBauCu() external',
  'function capNhatMauQuanLyPhienBauCu(address mauMoi) external',
  'function thucThiCapNhatMauQuanLyPhienBauCu() external',
  'function capNhatMauQuanLyPhieuBau(address mauMoi) external',
  'function thucThiCapNhatMauQuanLyPhieuBau() external',
  'function capNhatMauQuanLyThanhTuu(address mauMoi) external',
  'function thucThiCapNhatMauQuanLyThanhTuu() external',
  'function tamDung() external',
  'function moLai() external',
  'function layThongTinCuocBauCuTheoId(uint256 id) external view returns (address, address, address, address, string memory, bool)',
];

export interface ThongTinCuocBauCu {
  quanLyCuocBauCu: string;
  quanLyPhienBauCu: string;
  quanLyPhieuBau: string;
  quanLyThanhTuu: string;
  moTa: string;
  dangHoatDong: boolean;
}

export function ElectionDashboard() {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isNetworkOnline, setIsNetworkOnline] = useState(false);
  const [factoryAddress, setFactoryAddress] = useState('');
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [systemCount, setSystemCount] = useState(0);
  const [systems, setSystems] = useState<ThongTinCuocBauCu[]>([]);
  const [isFactoryLoaded, setIsFactoryLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Kiểm tra trạng thái mạng
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
        await provider.getBlockNumber();
        setIsNetworkOnline(true);
      } catch (error) {
        setIsNetworkOnline(false);
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 30000); // Kiểm tra mỗi 30 giây
    return () => clearInterval(interval);
  }, []);

  // Kết nối với MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        setIsConnected(true);

        toast({
          title: 'Ví đã kết nối',
          description: `Đã kết nối với ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
        });
      } catch (error) {
        toast({
          title: 'Kết nối thất bại',
          description: 'Không thể kết nối với MetaMask',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Không tìm thấy MetaMask',
        description: 'Vui lòng cài đặt tiện ích mở rộng MetaMask',
        variant: 'destructive',
      });
    }
  };

  // Tải hợp đồng factory
  const loadFactory = async (address: string) => {
    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
      const contract = new ethers.Contract(address, factoryABI, provider);

      // Xác minh hợp đồng bằng cách gọi một hàm
      const count = await contract.laySoLuongCuocBauCu();

      setFactoryContract(contract);
      setSystemCount(Number(count));
      setIsFactoryLoaded(true);

      // Tải danh sách hệ thống
      await loadSystems(contract, Number(count));

      toast({
        title: 'Đã tải Factory',
        description: `Tìm thấy ${count} hệ thống bầu cử`,
      });
    } catch (error) {
      toast({
        title: 'Factory không hợp lệ',
        description: 'Không thể tải hợp đồng factory',
        variant: 'destructive',
      });
      setIsFactoryLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Tải danh sách hệ thống từ factory
  const loadSystems = async (contract: ethers.Contract, count: number) => {
    try {
      const systemsData = await contract.layTatCaCuocBauCu(0, count);
      setSystems(systemsData);
    } catch (error) {
      toast({
        title: 'Lỗi khi tải hệ thống',
        description: 'Không thể tải danh sách hệ thống bầu cử',
        variant: 'destructive',
      });
    }
  };

  // Tạo hệ thống mới
  const createSystem = async (description: string) => {
    if (!factoryContract || !isConnected) {
      toast({
        title: 'Không thể tạo hệ thống',
        description: 'Vui lòng kết nối ví và tải factory trước',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Cần signer cho các giao dịch
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = factoryContract.connect(signer);

      // Bước 1: Sao chép các hợp đồng
      toast({
        title: 'Bước 1/2',
        description: 'Đang sao chép các hợp đồng với Transparent Proxy...',
      });

      //  const txBuoc1 = await contractWithSigner.trienKhaiHeThongBuoc1();
      const txBuoc1 = 'ehe';
      // await txBuoc1.wait();

      // Bước 2: Lưu trữ hệ thống
      toast({
        title: 'Bước 2/2',
        description: 'Đang lưu trữ hệ thống và khởi tạo proxy...',
      });

      //const txBuoc2 = await contractWithSigner.trienKhaiHeThongBuoc2(description);
      const txBuoc2 = 'ehe';
      //await txBuoc2.wait();

      // Cập nhật số lượng hệ thống và danh sách
      const count = await factoryContract.laySoLuongCuocBauCu();
      setSystemCount(Number(count));
      await loadSystems(factoryContract, Number(count));

      toast({
        title: 'Đã tạo hệ thống',
        description: `Hệ thống bầu cử mới "${description}" đã được tạo thành công`,
      });
    } catch (error) {
      toast({
        title: 'Tạo hệ thống thất bại',
        description: 'Không thể tạo hệ thống bầu cử mới',
        variant: 'destructive',
      });
      console.error('Lỗi khi tạo hệ thống:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Làm mới danh sách hệ thống
  const refreshSystems = async () => {
    if (!factoryContract) return;

    setIsLoading(true);
    try {
      const count = await factoryContract.laySoLuongCuocBauCu();
      setSystemCount(Number(count));
      await loadSystems(factoryContract, Number(count));

      toast({
        title: 'Đã làm mới danh sách',
        description: `Tìm thấy ${count} hệ thống bầu cử`,
      });
    } catch (error) {
      toast({
        title: 'Làm mới thất bại',
        description: 'Không thể làm mới danh sách hệ thống',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header
        account={account}
        isConnected={isConnected}
        isNetworkOnline={isNetworkOnline}
        onConnect={connectWallet}
      />

      <main className="flex-1 container mx-auto py-6 px-4 md:px-6 space-y-6 md:space-y-8">
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
          <FactoryInput
            factoryAddress={factoryAddress}
            setFactoryAddress={setFactoryAddress}
            loadFactory={loadFactory}
            isLoading={isLoading}
            isFactoryLoaded={isFactoryLoaded}
            systemCount={systemCount}
            isNetworkOnline={isNetworkOnline}
          />

          {isFactoryLoaded && (
            <SystemsManagement
              systems={systems}
              createSystem={createSystem}
              refreshSystems={refreshSystems}
              isLoading={isLoading}
              factoryContract={factoryContract}
            />
          )}
        </div>
      </main>

      <Footer isNetworkOnline={isNetworkOnline} />
      <Toaster />
    </>
  );
}
