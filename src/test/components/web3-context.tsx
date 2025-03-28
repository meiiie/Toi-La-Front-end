'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useToast } from './use-toast';

interface Web3ContextType {
  account: string;
  isConnected: boolean;
  networkId: number | null;
  networkName: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  account: '',
  isConnected: false,
  networkId: null,
  networkName: '',
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>('');
  const { toast } = useToast();

  // Kiểm tra xem MetaMask có được cài đặt không
  const checkIfWalletIsInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Kết nối với MetaMask
  const connectWallet = async () => {
    if (!checkIfWalletIsInstalled()) {
      toast({
        title: 'MetaMask không được cài đặt',
        description: 'Vui lòng cài đặt MetaMask để sử dụng ứng dụng này',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Yêu cầu quyền truy cập tài khoản
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);

        // Lấy thông tin mạng
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        handleChainChanged(chainId);

        toast({
          title: 'Kết nối thành công',
          description: 'Đã kết nối với ví MetaMask',
        });
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      toast({
        title: 'Lỗi kết nối',
        description: 'Không thể kết nối với MetaMask',
        variant: 'destructive',
      });
    }
  };

  // Ngắt kết nối với MetaMask
  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
    setNetworkId(null);
    setNetworkName('');

    toast({
      title: 'Đã ngắt kết nối',
      description: 'Đã ngắt kết nối với ví MetaMask',
    });
  };

  // Xử lý khi mạng thay đổi
  const handleChainChanged = useCallback((chainId: string) => {
    const networkIdNumber = Number.parseInt(chainId, 16);
    setNetworkId(networkIdNumber);

    // Xác định tên mạng
    let name = 'Unknown Network';

    // Kiểm tra xem có phải là mạng POA Geth không
    if (window.ethereum.networkVersion === '8995') {
      name = 'POA Geth';
    } else {
      switch (networkIdNumber) {
        case 1:
          name = 'Ethereum Mainnet';
          break;
        case 5:
          name = 'Goerli Testnet';
          break;
        case 11155111:
          name = 'Sepolia Testnet';
          break;
        case 137:
          name = 'Polygon Mainnet';
          break;
        case 80001:
          name = 'Mumbai Testnet';
          break;
        default:
          name = `Chain ID: ${networkIdNumber}`;
      }
    }

    setNetworkName(name);
  }, []);

  // Xử lý khi tài khoản thay đổi
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // Người dùng đã ngắt kết nối
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // Người dùng đã chuyển tài khoản
      setAccount(accounts[0]);

      toast({
        title: 'Tài khoản đã thay đổi',
        description: `Đã chuyển sang tài khoản: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
      });
    }
  };

  // Thiết lập các event listener khi component được mount
  useEffect(() => {
    if (checkIfWalletIsInstalled()) {
      // Kiểm tra xem người dùng đã kết nối chưa
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch((err: Error) => console.error(err));

      // Lắng nghe sự kiện thay đổi tài khoản
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Lắng nghe sự kiện thay đổi mạng
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup function
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [checkIfWalletIsInstalled, handleChainChanged]);

  const value = {
    account,
    isConnected,
    networkId,
    networkName,
    connectWallet,
    disconnectWallet,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
