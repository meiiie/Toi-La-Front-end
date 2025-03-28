// Viết lại toàn bộ file Web3Context.tsx để tránh lỗi tham chiếu vòng tròn

'use client';

import type React from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
// Thay đổi toast để sử dụng react-hot-toast
import { toast } from 'react-hot-toast';
// import { useToast } from "../components/ui/Use-toast" // Xóa dòng này
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { AlertCircle, ArrowRight, CheckCircle, Network } from 'lucide-react';

// Định nghĩa chainId của mạng HoLiHu
const HOLIHU_CHAIN_ID = '0xd2'; // 210 trong hệ thập lục phân
const HLU_TOKEN_ADDRESS = '0x820F15F12Aa75BAa89A16B20768024C8604Ea16f';

// Các khóa localStorage
const SETUP_KEYS = {
  NETWORK_SETUP_COMPLETE: 'poa_network_setup_complete',
  TOKEN_SETUP_COMPLETE: 'holihu_token_setup_complete',
  SETUP_DISMISSED: 'web3_setup_dismissed',
  LAST_PROMPT_TIME: 'web3_last_prompt_time',
};

interface Web3ContextType {
  currentAccount: string | null;
  chainId: string | null;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  isNetworkConnected: boolean;
  isTokenAdded: boolean;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string | null>;
  addTokenToMetaMask: () => Promise<boolean>;
  addHoLiHuNetwork: () => Promise<boolean>;
  checkAndSwitchNetwork: () => Promise<boolean>;
  checkAndAddToken: () => Promise<boolean>;
  ensureNetworkAndToken: () => Promise<boolean>; // Đảm bảo mạng và token đã được kết nối/thêm
  showSetupModal: () => void; // Hiển thị modal thiết lập
  setupEnvironment: () => Promise<boolean>; // Thiết lập tự động
}

// Tạo context với giá trị mặc định
const Web3Context = createContext<Web3ContextType>({
  currentAccount: null,
  chainId: null,
  isConnecting: false,
  isMetaMaskInstalled: false,
  isNetworkConnected: false,
  isTokenAdded: false,
  connectWallet: async () => null,
  disconnectWallet: () => {},
  signMessage: async () => null,
  addTokenToMetaMask: async () => false,
  addHoLiHuNetwork: async () => false,
  checkAndSwitchNetwork: async () => false,
  checkAndAddToken: async () => false,
  ensureNetworkAndToken: async () => false,
  showSetupModal: () => {},
  setupEnvironment: async () => false,
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(false);
  const [isNetworkConnected, setIsNetworkConnected] = useState<boolean>(false);
  const [isTokenAdded, setIsTokenAdded] = useState<boolean>(false);
  const [showSetupDialog, setShowSetupDialog] = useState<boolean>(false);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);

  const dispatch: AppDispatch = useDispatch();
  const { taiKhoan } = useSelector((state: RootState) => state.dangNhapTaiKhoan);
  // Xóa dòng này: const { toast } = useToast()

  // Memoize ethereum instance để tránh re-render không cần thiết
  const ethereum = useMemo(() => {
    return typeof window !== 'undefined' ? (window as any).ethereum : undefined;
  }, []);

  // Kiểm tra xem MetaMask có được cài đặt không
  const checkMetaMaskInstalled = useCallback(() => {
    if (ethereum && ethereum.isMetaMask) {
      setIsMetaMaskInstalled(true);
      return true;
    }
    setIsMetaMaskInstalled(false);
    return false;
  }, [ethereum]);

  // Kiểm tra xem người dùng có đang kết nối với mạng HoLiHu không
  const checkNetworkConnection = useCallback(async (): Promise<boolean> => {
    if (!ethereum) return false;

    try {
      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      // Chuẩn hóa cả hai giá trị về chữ thường để so sánh chính xác
      const isConnected = currentChainId.toLowerCase() === HOLIHU_CHAIN_ID.toLowerCase();
      setIsNetworkConnected(isConnected);
      setChainId(currentChainId);

      // Cập nhật trạng thái thiết lập mạng
      if (isConnected) {
        localStorage.setItem(SETUP_KEYS.NETWORK_SETUP_COMPLETE, 'true');
      }

      return isConnected;
    } catch (error) {
      console.error('Lỗi khi kiểm tra kết nối mạng:', error);
      setIsNetworkConnected(false);
      return false;
    }
  }, [ethereum]);

  // Thêm hàm để kiểm tra token đã được thêm vào MetaMask chưa
  const checkTokenExists = useCallback(async (): Promise<boolean> => {
    if (!ethereum || !currentAccount) return false;

    try {
      // Kiểm tra trong localStorage
      const tokenKey = `hlu_token_added_${currentAccount.toLowerCase()}`;
      const tokenAdded = localStorage.getItem(tokenKey) === 'true';

      // Nếu đã có trong localStorage, cập nhật state
      if (tokenAdded) {
        setIsTokenAdded(true);
        localStorage.setItem(SETUP_KEYS.TOKEN_SETUP_COMPLETE, 'true');
        return true;
      }

      // Nếu không có trong localStorage, thử kiểm tra bằng cách gọi API của MetaMask
      // Lưu ý: Đây không phải là cách chính thức để kiểm tra token, nhưng có thể cải thiện UX
      try {
        // Kiểm tra nếu đang ở mạng POA
        const isPoaNetwork = await checkNetworkConnection();
        if (isPoaNetwork) {
          // Thử gọi hàm balanceOf của token
          await ethereum.request({
            method: 'eth_call',
            params: [
              {
                to: HLU_TOKEN_ADDRESS,
                data: `0x70a08231000000000000000000000000${currentAccount.slice(2)}`, // balanceOf(address)
              },
              'latest',
            ],
          });

          // Nếu không có lỗi, có thể token đã được thêm
          // Nhưng để chắc chắn, chúng ta vẫn để người dùng thêm token thủ công
          setIsTokenAdded(false);
          return false;
        }
      } catch (error) {
        // Nếu có lỗi, token có thể chưa được thêm
        setIsTokenAdded(false);
        return false;
      }

      setIsTokenAdded(false);
      return false;
    } catch (error) {
      console.error('Lỗi khi kiểm tra token:', error);
      setIsTokenAdded(false);
      return false;
    }
  }, [ethereum, currentAccount, checkNetworkConnection]);

  // Hàm thêm token HLU vào MetaMask
  const addTokenToMetaMask = useCallback(async (): Promise<boolean> => {
    if (!ethereum || !currentAccount) {
      toast.error('MetaMask chưa được cài đặt hoặc chưa kết nối!');
      return false;
    }

    try {
      const tokenAddress = HLU_TOKEN_ADDRESS;
      const tokenSymbol = 'HLU'; // Ký hiệu token
      const tokenDecimals = 18; // Số thập phân
      const tokenImage =
        'https://gateway.pinata.cloud/ipfs/bafkreif6omfzsnwhnw72mp3ronvze523g6wlw2jfw4hsnb2mz7djn4lbku'; // Sử dụng IPFS CID

      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });

      if (wasAdded) {
        toast.success('✅ Token HoLiHu (HLU) đã được thêm vào MetaMask!');
        setIsTokenAdded(true);

        // Lưu trạng thái đã thêm token vào localStorage
        if (currentAccount) {
          localStorage.setItem(`hlu_token_added_${currentAccount.toLowerCase()}`, 'true');
          localStorage.setItem(SETUP_KEYS.TOKEN_SETUP_COMPLETE, 'true');
        }

        return true;
      } else {
        toast.error('❌ Người dùng từ chối thêm token.');
        return false;
      }
    } catch (error) {
      console.error('❌ Lỗi khi thêm token vào MetaMask:', error);
      toast.error('Không thể thêm token vào MetaMask.');
      return false;
    }
  }, [ethereum, currentAccount]);

  // Hàm thêm mạng HoLiHu Net vào MetaMask
  const addHoLiHuNetwork = useCallback(async (): Promise<boolean> => {
    if (!ethereum) {
      toast.error('MetaMask chưa được cài đặt!');
      return false;
    }

    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: HOLIHU_CHAIN_ID,
            chainName: 'HoLiHu Net',
            nativeCurrency: {
              name: 'HoLiHu Gas',
              symbol: 'POA',
              decimals: 18,
            },
            rpcUrls: ['https://geth.holihu.online/rpc'],
            blockExplorerUrls: ['https://explorer.holihu.online'],
            iconUrls: [
              'https://gateway.pinata.cloud/ipfs/bafkreif6omfzsnwhnw72mp3ronvze523g6wlw2jfw4hsnb2mz7djn4lbku',
            ],
          },
        ],
      });

      // Kiểm tra lại kết nối sau khi thêm mạng
      const isConnected = await checkNetworkConnection();
      if (isConnected) {
        toast.success('✅ Mạng HoLiHu Net đã được thêm và kết nối!');
        localStorage.setItem(SETUP_KEYS.NETWORK_SETUP_COMPLETE, 'true');
        return true;
      } else {
        toast('⚠️ Mạng HoLiHu Net đã được thêm nhưng chưa kết nối');
        return false;
      }
    } catch (error) {
      console.error('❌ Lỗi khi thêm mạng HoLiHu Net:', error);
      toast.error('Không thể thêm mạng HoLiHu Net vào MetaMask.');
      return false;
    }
  }, [ethereum, checkNetworkConnection]);

  // Đảm bảo người dùng đã kết nối đến mạng HoLiHu
  const checkAndSwitchNetwork = useCallback(async (): Promise<boolean> => {
    if (!ethereum) {
      toast.error('MetaMask chưa được cài đặt!');
      return false;
    }

    try {
      const isConnected = await checkNetworkConnection();
      if (isConnected) return true;

      // Hiển thị cửa sổ MetaMask để chuyển mạng
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HOLIHU_CHAIN_ID }],
      });

      // Kiểm tra lại kết nối sau khi chuyển mạng
      const isNowConnected = await checkNetworkConnection();
      if (isNowConnected) {
        toast.success('✅ Đã kết nối đến mạng HoLiHu Net!');
        return true;
      } else {
        // Nếu không thể chuyển mạng, thử thêm mạng
        return await addHoLiHuNetwork();
      }
    } catch (error: any) {
      // Mã lỗi 4902 nghĩa là mạng chưa được thêm
      if (error.code === 4902 || error.code === -32603) {
        toast('Mạng HoLiHu Net chưa được thêm vào MetaMask. Đang thêm mạng...', {
          icon: '🔄',
        });
        return await addHoLiHuNetwork();
      }
      console.error('Lỗi khi chuyển mạng:', error);
      toast.error('Không thể chuyển đến mạng HoLiHu. Vui lòng thử lại.');
      return false;
    }
  }, [ethereum, checkNetworkConnection, addHoLiHuNetwork]);

  // Thêm hàm để kiểm tra và thêm token nếu cần
  const checkAndAddToken = useCallback(async (): Promise<boolean> => {
    if (!ethereum || !currentAccount) {
      toast.error('MetaMask chưa được kết nối!');
      return false;
    }

    try {
      // Kiểm tra xem token đã được thêm chưa
      const tokenExists = await checkTokenExists();
      if (tokenExists) return true;

      // Nếu chưa, hiển thị cửa sổ để thêm token
      return await addTokenToMetaMask();
    } catch (error) {
      console.error('Lỗi khi kiểm tra/thêm token:', error);
      toast.error('Không thể kiểm tra hoặc thêm token HLU');
      return false;
    }
  }, [ethereum, currentAccount, checkTokenExists, addTokenToMetaMask]);

  // Kiểm tra xem thiết lập đã hoàn tất chưa
  const isSetupComplete = useCallback((): boolean => {
    const networkComplete = localStorage.getItem(SETUP_KEYS.NETWORK_SETUP_COMPLETE) === 'true';
    const tokenComplete = localStorage.getItem(SETUP_KEYS.TOKEN_SETUP_COMPLETE) === 'true';
    return networkComplete && tokenComplete;
  }, []);

  // Kiểm tra xem thiết lập đã bị bỏ qua chưa
  const hasSetupBeenDismissed = useCallback((): boolean => {
    return localStorage.getItem(SETUP_KEYS.SETUP_DISMISSED) === 'true';
  }, []);

  // Đánh dấu thiết lập đã bị bỏ qua
  const markSetupDismissed = useCallback((): void => {
    localStorage.setItem(SETUP_KEYS.SETUP_DISMISSED, 'true');
  }, []);

  // Kiểm tra xem thông báo đã hiển thị gần đây chưa
  const hasPromptBeenShownRecently = useCallback((): boolean => {
    const lastPromptTime = localStorage.getItem(SETUP_KEYS.LAST_PROMPT_TIME);
    if (!lastPromptTime) return false;

    const now = Date.now();
    const diff = now - Number.parseInt(lastPromptTime, 10);
    const oneDay = 24 * 60 * 60 * 1000;
    return diff < oneDay;
  }, []);

  // Đánh dấu thời gian hiển thị thông báo
  const markPromptTime = useCallback((): void => {
    localStorage.setItem(SETUP_KEYS.LAST_PROMPT_TIME, Date.now().toString());
  }, []);

  // Hiển thị modal thiết lập
  const showSetupModal = useCallback(() => {
    setShowSetupDialog(true);
  }, []);

  // Kiểm tra nếu cần hiển thị modal thiết lập
  const checkIfSetupModalNeeded = useCallback(() => {
    const setupComplete = isSetupComplete();
    const setupDismissed = hasSetupBeenDismissed();
    const promptedRecently = hasPromptBeenShownRecently();

    if (!setupComplete && !setupDismissed && !promptedRecently) {
      markPromptTime();
      setTimeout(() => {
        setShowSetupDialog(true);
      }, 1000);
    }
  }, [isSetupComplete, hasSetupBeenDismissed, hasPromptBeenShownRecently, markPromptTime]);

  // Kết nối ví - định nghĩa sau các hàm tiện ích nhưng trước các hàm sử dụng nó
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!ethereum) {
      toast.error('MetaMask chưa được cài đặt. Vui lòng cài đặt MetaMask để tiếp tục.');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    setIsConnecting(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);

        // Kiểm tra nếu cần hiển thị modal thiết lập
        checkIfSetupModalNeeded();

        return accounts[0];
      }
      return null;
    } catch (error: any) {
      console.error('Lỗi khi kết nối với MetaMask:', error);
      if (error.code === 4001) {
        // Người dùng từ chối kết nối
        toast.error('Bạn đã từ chối kết nối với MetaMask');
      } else {
        toast.error(error.message || 'Không thể kết nối với MetaMask');
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [ethereum, checkIfSetupModalNeeded]);

  // Đảm bảo cả mạng và token đều đã kết nối/thêm vào
  const ensureNetworkAndToken = useCallback(async (): Promise<boolean> => {
    if (!ethereum) {
      toast.error('MetaMask chưa được cài đặt!');
      return false;
    }

    // Đảm bảo có tài khoản được kết nối
    if (!currentAccount) {
      const account = await connectWallet();
      if (!account) return false;
    }

    // Đảm bảo đã kết nối đến mạng HoLiHu
    const networkConnected = await checkAndSwitchNetwork();
    if (!networkConnected) return false;

    // Đảm bảo token HLU đã được thêm
    const tokenAdded = await checkAndAddToken();
    return tokenAdded;
  }, [ethereum, currentAccount, connectWallet, checkAndSwitchNetwork, checkAndAddToken]);

  // Thiết lập tự động toàn bộ môi trường
  const setupEnvironment = useCallback(async (): Promise<boolean> => {
    setIsSettingUp(true);

    try {
      if (!ethereum) {
        toast.error('MetaMask chưa được cài đặt!');
        return false;
      }

      // Đảm bảo có tài khoản được kết nối
      if (!currentAccount) {
        const account = await connectWallet();
        if (!account) return false;
      }

      // Đảm bảo đã kết nối đến mạng HoLiHu
      const networkConnected = await checkAndSwitchNetwork();
      if (!networkConnected) return false;

      // Đảm bảo token HLU đã được thêm
      const tokenAdded = await checkAndAddToken();

      if (networkConnected && tokenAdded) {
        toast.success('✅ Thiết lập hoàn tất! Đã kết nối mạng và thêm token HLU.');
      }

      return networkConnected && tokenAdded;
    } catch (error) {
      console.error('Lỗi khi thiết lập tự động:', error);
      toast.error('Có lỗi xảy ra khi thiết lập tự động. Vui lòng thử lại.');
      return false;
    } finally {
      setIsSettingUp(false);
    }
  }, [ethereum, currentAccount, connectWallet, checkAndSwitchNetwork, checkAndAddToken]);

  const disconnectWallet = useCallback((): void => {
    setCurrentAccount(null);
    setChainId(null);
    setIsNetworkConnected(false);
    setIsTokenAdded(false);
    toast.success('Đã ngắt kết nối với MetaMask');
  }, []);

  // Thêm hàm handleAccountsChanged để xử lý khi tài khoản MetaMask thay đổi
  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length === 0) {
        // Người dùng đã đăng xuất khỏi MetaMask
        setCurrentAccount(null);
        setIsNetworkConnected(false);
        setIsTokenAdded(false);
        toast('Đã ngắt kết nối với MetaMask');
      } else {
        // Kiểm tra nếu tài khoản đã đăng nhập có liên kết với MetaMask
        if (taiKhoan?.diaChiVi) {
          // So sánh địa chỉ ví mới với địa chỉ ví đã liên kết
          if (accounts[0].toLowerCase() !== taiKhoan.diaChiVi.toLowerCase()) {
            setCurrentAccount(null);
            setIsNetworkConnected(false);
            setIsTokenAdded(false);
            toast.error('Ví MetaMask đã thay đổi, không khớp với ví liên kết!');
          } else {
            setCurrentAccount(accounts[0]);
            checkNetworkConnection();
            checkTokenExists();
          }
        } else {
          setCurrentAccount(accounts[0]);
          checkNetworkConnection();
          checkTokenExists();
        }
      }
    },
    [taiKhoan, checkNetworkConnection, checkTokenExists],
  );

  // Thêm hàm handleChainChanged để xử lý khi mạng blockchain thay đổi
  const handleChainChanged = useCallback((chainId: string) => {
    setChainId(chainId);
    const isHoLiHuNetwork = chainId.toLowerCase() === HOLIHU_CHAIN_ID.toLowerCase();
    setIsNetworkConnected(isHoLiHuNetwork);

    if (isHoLiHuNetwork) {
      localStorage.setItem(SETUP_KEYS.NETWORK_SETUP_COMPLETE, 'true');
    }

    toast(`Mạng blockchain đã thay đổi${isHoLiHuNetwork ? ' đến HoLiHu Net' : ''}`);
  }, []);

  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!currentAccount || !ethereum) return null;

      try {
        const signature = await ethereum.request({
          method: 'personal_sign',
          params: [message, currentAccount],
        });
        return signature;
      } catch (error: any) {
        console.error('Lỗi khi ký tin nhắn:', error);
        if (error.code === 4001) {
          toast.error('Bạn đã từ chối ký thông điệp');
        } else {
          toast.error('Không thể ký thông điệp với MetaMask');
        }
        return null;
      }
    },
    [ethereum, currentAccount],
  );

  // Đảm bảo việc tham chiếu hàm không thay đổi

  // UseEffect cho việc kiểm tra MetaMask và trạng thái ban đầu
  useEffect(() => {
    checkMetaMaskInstalled();

    // Kiểm tra mạng và token khi component mount
    const checkInitialState = async () => {
      if (ethereum && ethereum.selectedAddress) {
        setCurrentAccount(ethereum.selectedAddress);
        await checkNetworkConnection();
        await checkTokenExists();

        // Kiểm tra nếu cần hiển thị modal thiết lập
        checkIfSetupModalNeeded();
      }
    };

    if (typeof window !== 'undefined') {
      checkInitialState();
    }
  }, [
    ethereum,
    checkMetaMaskInstalled,
    checkNetworkConnection,
    checkTokenExists,
    checkIfSetupModalNeeded,
  ]);

  // UseEffect riêng biệt cho việc theo dõi sự kiện
  useEffect(() => {
    if (!ethereum) return;

    // Lắng nghe sự kiện, không tự động kết nối
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [ethereum, handleAccountsChanged, handleChainChanged]);

  // Sử dụng useMemo để tránh tạo lại object context value ở mỗi render
  const value = useMemo(
    () => ({
      currentAccount,
      chainId,
      isConnecting,
      isMetaMaskInstalled,
      isNetworkConnected,
      isTokenAdded,
      connectWallet,
      disconnectWallet,
      signMessage,
      addTokenToMetaMask,
      addHoLiHuNetwork,
      checkAndSwitchNetwork,
      checkAndAddToken,
      ensureNetworkAndToken,
      showSetupModal,
      setupEnvironment,
    }),
    [
      currentAccount,
      chainId,
      isConnecting,
      isMetaMaskInstalled,
      isNetworkConnected,
      isTokenAdded,
      connectWallet,
      disconnectWallet,
      signMessage,
      addTokenToMetaMask,
      addHoLiHuNetwork,
      checkAndSwitchNetwork,
      checkAndAddToken,
      ensureNetworkAndToken,
      showSetupModal,
      setupEnvironment,
    ],
  );

  return (
    <Web3Context.Provider value={value}>
      {children}

      {/* Modal thiết lập blockchain */}
      <Dialog
        open={showSetupDialog}
        onOpenChange={(open) => {
          if (!open && !isSettingUp) {
            setShowSetupDialog(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px] bg-[#1E293B] border border-[#334155] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Thiết lập Blockchain</DialogTitle>
            <DialogDescription className="text-blue-200/80">
              Để sử dụng đầy đủ tính năng của ứng dụng, bạn cần thiết lập kết nối với mạng
              blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
                  <Network className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Trạng thái thiết lập</h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 flex-shrink-0">
                        {isMetaMaskInstalled ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <span className="text-sm text-blue-200">
                        {isMetaMaskInstalled ? 'MetaMask đã cài đặt' : 'Cài đặt MetaMask'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 flex-shrink-0">
                        {currentAccount ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <span className="text-sm text-blue-200">
                        {currentAccount ? 'Đã kết nối ví' : 'Kết nối ví'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 flex-shrink-0">
                        {isNetworkConnected ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <span className="text-sm text-blue-200">
                        {isNetworkConnected ? 'Đã kết nối mạng HoLiHu' : 'Kết nối mạng HoLiHu'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 flex-shrink-0">
                        {isTokenAdded ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <span className="text-sm text-blue-200">
                        {isTokenAdded ? 'Đã thêm token HLU' : 'Thêm token HLU'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                markSetupDismissed();
                setShowSetupDialog(false);
              }}
              className="sm:order-1 bg-[#334155] hover:bg-[#475569] text-white border-[#475569]"
            >
              Để sau
            </Button>
            <Button
              onClick={() => {
                setShowSetupDialog(false);
                // Sử dụng window.location để chuyển hướng đến trang thiết lập
                window.location.href = '/blockchain-setup';
              }}
              className="sm:order-2 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-[0_0_15px_rgba(2,136,209,0.5)]"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Đến trang thiết lập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Web3Context.Provider>
  );
};
