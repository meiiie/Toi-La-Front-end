'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
// Thay đổi import toast từ react-hot-toast thay vì useToast
import { toast } from 'react-hot-toast';
// Xóa dòng import useToast
// import { useToast } from "../components/ui/Use-toast"
import HexagonBackground from '../components/ui/hexagon-background';
import BlockchainNodes from '../components/ui/blockchain-nodes';
import {
  ArrowLeft,
  CheckCircle,
  Network,
  Coins,
  Wallet,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Info,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { FaEthereum } from 'react-icons/fa';

// Thêm hàm resetBlockchainSetup để xóa các thiết lập trong localStorage
const resetBlockchainSetup = () => {
  // Xóa các thiết lập liên quan đến mạng
  localStorage.removeItem('poa_network_setup_complete');
  // Xóa các thiết lập liên quan đến token
  localStorage.removeItem('holihu_token_setup_complete');
  // Xóa trạng thái đã bỏ qua thiết lập
  localStorage.removeItem('web3_setup_dismissed');
  // Xóa thời gian hiển thị thông báo
  localStorage.removeItem('web3_last_prompt_time');

  // Xóa trạng thái token đã thêm cho tất cả các tài khoản
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith('hlu_token_added_')) {
      localStorage.removeItem(key);
    }
  });

  toast.success('Đã xóa tất cả thiết lập blockchain');

  // Làm mới trang sau 1 giây
  setTimeout(() => {
    window.location.reload();
  }, 1000);
};

// Trong component BlockchainSetupPage, xóa dòng khai báo useToast
const BlockchainSetupPage: React.FC = () => {
  const {
    isMetaMaskInstalled,
    isNetworkConnected,
    isTokenAdded,
    currentAccount,
    connectWallet,
    checkAndSwitchNetwork,
    addTokenToMetaMask,
    setupEnvironment,
  } = useWeb3();

  const [localIsMetaMaskInstalled, setLocalIsMetaMaskInstalled] = useState(false);
  const [localIsNetworkConnected, setLocalIsNetworkConnected] = useState(false);
  const [localIsTokenAdded, setLocalIsTokenAdded] = useState(false);
  const [localCurrentAccount, setLocalCurrentAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSettingUpNetwork, setIsSettingUpNetwork] = useState(false);
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [isAutoSetup, setIsAutoSetup] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  // Xóa dòng này: const { toast } = useToast()
  const navigate = useNavigate();

  // Thêm hàm addHoLiHuNetwork vào component BlockchainSetupPage
  // Thêm sau các state và trước các hàm xử lý

  const addHoLiHuNetwork = async () => {
    setIsSettingUpNetwork(true);
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        toast.error('MetaMask chưa được cài đặt!');
        return false;
      }

      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0xd2',
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

      toast.success('✅ Mạng HoLiHu Net đã được thêm!');
      return true;
    } catch (error) {
      console.error('❌ Lỗi khi thêm mạng HoLiHu Net:', error);
      toast.error('Không thể thêm mạng HoLiHu Net vào MetaMask.');
      return false;
    } finally {
      setIsSettingUpNetwork(false);
    }
  };

  // Update active step based on connection status
  useEffect(() => {
    if (!isMetaMaskInstalled) {
      setActiveStep(1);
    } else if (!currentAccount) {
      setActiveStep(2);
    } else if (!isNetworkConnected) {
      setActiveStep(3);
    } else if (!isTokenAdded) {
      setActiveStep(4);
    } else {
      setActiveStep(5); // All steps completed
    }
  }, [isMetaMaskInstalled, currentAccount, isNetworkConnected, isTokenAdded]);

  const handleConnectWallet = async () => {
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const account = await connectWallet();
      if (account) {
        toast.success('Đã kết nối với ví MetaMask');
      }
    } catch (error) {
      console.error('Lỗi kết nối ví:', error);
      toast.error('Không thể kết nối với ví MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setIsSettingUpNetwork(true);
    try {
      const success = await checkAndSwitchNetwork();
      if (success) {
        toast.success('Đã kết nối đến mạng POA');
      }
    } catch (error) {
      console.error('Lỗi chuyển mạng:', error);
      // Kiểm tra nếu là lỗi mạng chưa được thêm
      if (
        (error as { code: number }).code === 4902 ||
        (error as { code: number }).code === -32603
      ) {
        toast('Mạng POA chưa được thêm vào MetaMask. Đang thêm mạng...', {
          icon: '🔄',
        });
        try {
          await addHoLiHuNetwork();
        } catch (addError) {
          console.error('Lỗi khi thêm mạng:', addError);
          toast.error('Không thể thêm mạng POA');
        }
      } else {
        toast.error('Không thể chuyển đến mạng POA');
      }
    } finally {
      setIsSettingUpNetwork(false);
    }
  };

  const handleAddToken = async () => {
    setIsAddingToken(true);
    try {
      const success = await addTokenToMetaMask();
      if (success) {
        toast.success('Đã thêm token HLU vào ví MetaMask');
      }
    } catch (error) {
      console.error('Lỗi thêm token:', error);
      toast.error('Không thể thêm token HLU');
    } finally {
      setIsAddingToken(false);
    }
  };

  const handleAutoSetup = async () => {
    setIsAutoSetup(true);
    try {
      const success = await setupEnvironment();
      if (success) {
        toast.success('Đã thiết lập thành công mạng POA và token HLU');
      } else {
        toast.error('Có lỗi xảy ra trong quá trình thiết lập tự động');
      }
    } catch (error) {
      console.error('Lỗi thiết lập tự động:', error);
      toast.error('Có lỗi xảy ra trong quá trình thiết lập tự động');
    } finally {
      setIsAutoSetup(false);
    }
  };

  const handleContinue = () => {
    navigate('/main');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F18] via-[#121A29] to-[#0D1321] text-white relative overflow-hidden">
      {/* Animated blockchain background */}
      <div className="absolute inset-0 overflow-hidden">
        <HexagonBackground density={10} opacity={0.05} />
        <BlockchainNodes nodeCount={10} />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-[100px] opacity-10 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px] opacity-10 animate-float-delayed"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header with back button */}
        <div className="mb-8">
          <Link
            to="/main"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Quay lại trang chính</span>
          </Link>
        </div>

        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0288D1]/30 to-[#6A1B9A]/30 rounded-full blur-lg"></div>
              <div className="relative p-4 rounded-full bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50">
                <Layers className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Thiết Lập Blockchain
          </h1>
          <div className="h-1 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] w-[100px] mx-auto mb-6" />
          <p className="text-blue-200/80 max-w-3xl mx-auto">
            Thiết lập môi trường blockchain để sử dụng đầy đủ tính năng của ứng dụng bầu cử. Quá
            trình này chỉ cần thực hiện một lần.
          </p>
        </div>

        {/* Setup Progress */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  activeStep >= 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1E293B] text-blue-300/50 border border-[#334155]'
                }`}
              >
                <Wallet className="h-5 w-5" />
              </div>
              <div
                className={`h-1 flex-1 mx-2 ${activeStep >= 2 ? 'bg-blue-500' : 'bg-[#1E293B]'}`}
              ></div>
            </div>

            <div className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  activeStep >= 2
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1E293B] text-blue-300/50 border border-[#334155]'
                }`}
              >
                <FaEthereum className="h-5 w-5" />
              </div>
              <div
                className={`h-1 flex-1 mx-2 ${activeStep >= 3 ? 'bg-blue-500' : 'bg-[#1E293B]'}`}
              ></div>
            </div>

            <div className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  activeStep >= 3
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1E293B] text-blue-300/50 border border-[#334155]'
                }`}
              >
                <Network className="h-5 w-5" />
              </div>
              <div
                className={`h-1 flex-1 mx-2 ${activeStep >= 4 ? 'bg-blue-500' : 'bg-[#1E293B]'}`}
              ></div>
            </div>

            <div className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  activeStep >= 4
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1E293B] text-blue-300/50 border border-[#334155]'
                }`}
              >
                <Coins className="h-5 w-5" />
              </div>
              <div
                className={`h-1 flex-1 mx-2 ${activeStep >= 5 ? 'bg-blue-500' : 'bg-[#1E293B]'}`}
              ></div>
            </div>

            <div>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  activeStep >= 5
                    ? 'bg-green-500 text-white'
                    : 'bg-[#1E293B] text-blue-300/50 border border-[#334155]'
                }`}
              >
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="flex justify-between text-xs text-blue-200/70 px-1">
            <div className="text-center w-10">Cài đặt</div>
            <div className="text-center w-10">Kết nối</div>
            <div className="text-center w-10">Mạng</div>
            <div className="text-center w-10">Token</div>
            <div className="text-center w-10">Hoàn tất</div>
          </div>
        </div>

        {/* Auto Setup Button */}

        <div className="max-w-4xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-md rounded-xl border border-blue-500/30 p-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0 md:mr-6">
                <h3 className="text-xl font-semibold text-white mb-2">Thiết lập tự động</h3>
                <p className="text-blue-200/80">
                  Thiết lập tất cả các bước cần thiết chỉ với một cú nhấp chuột
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={resetBlockchainSetup}
                  className="px-6 py-3 rounded-lg flex items-center bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Xóa thiết lập
                </button>
                <button
                  onClick={handleAutoSetup}
                  disabled={isAutoSetup || activeStep >= 5}
                  className={`px-6 py-3 rounded-lg flex items-center ${
                    activeStep >= 5
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-[0_0_15px_rgba(2,136,209,0.5)]'
                  } transition-all duration-300`}
                >
                  {isAutoSetup ? (
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  ) : activeStep >= 5 ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <ArrowRight className="h-5 w-5 mr-2" />
                  )}
                  {isAutoSetup
                    ? 'Đang thiết lập...'
                    : activeStep >= 5
                      ? 'Đã thiết lập xong'
                      : 'Thiết lập tự động'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Setup Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Step 1: Install MetaMask */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`bg-[#1E293B]/30 backdrop-blur-md rounded-xl border ${
              !isMetaMaskInstalled
                ? 'border-blue-500/50 shadow-[0_0_15px_rgba(2,136,209,0.2)]'
                : 'border-[#334155]/50'
            } p-6`}
          >
            <div className="flex items-start mb-4">
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-lg ${
                  isMetaMaskInstalled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                } flex items-center justify-center mr-4`}
              >
                {isMetaMaskInstalled ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="font-bold">1</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Cài đặt MetaMask</h3>
                <p className="text-sm text-blue-200/70 mb-4">
                  MetaMask là ví blockchain phổ biến nhất, cho phép bạn tương tác với các ứng dụng
                  blockchain
                </p>

                <div className="flex items-center mb-4">
                  <div
                    className={`h-2 w-2 rounded-full ${isMetaMaskInstalled ? 'bg-green-400' : 'bg-blue-400'} mr-2`}
                  ></div>
                  <span
                    className={`text-sm ${isMetaMaskInstalled ? 'text-green-400' : 'text-blue-200'}`}
                  >
                    {isMetaMaskInstalled ? 'Đã cài đặt' : 'Chưa cài đặt'}
                  </span>
                </div>

                {!isMetaMaskInstalled && (
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-[#F6851B] hover:bg-[#E2761B] text-white rounded-lg transition-colors duration-200"
                  >
                    <FaEthereum className="mr-2 h-5 w-5" />
                    Cài đặt MetaMask
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {!isMetaMaskInstalled && (
              <div className="mt-4 p-3 bg-[#0D1321]/70 rounded-lg border border-[#334155]/50">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-200/70">
                    Sau khi cài đặt, hãy làm mới trang này để tiếp tục quá trình thiết lập.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Step 2: Connect Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`bg-[#1E293B]/30 backdrop-blur-md rounded-xl border ${
              isMetaMaskInstalled && !currentAccount
                ? 'border-blue-500/50 shadow-[0_0_15px_rgba(2,136,209,0.2)]'
                : 'border-[#334155]/50'
            } p-6`}
          >
            <div className="flex items-start mb-4">
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-lg ${
                  currentAccount
                    ? 'bg-green-500/20 text-green-400'
                    : isMetaMaskInstalled
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-[#334155]/50 text-blue-300/50'
                } flex items-center justify-center mr-4`}
              >
                {currentAccount ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="font-bold">2</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Kết nối ví</h3>
                <p className="text-sm text-blue-200/70 mb-4">
                  Kết nối ví MetaMask của bạn để tương tác với ứng dụng
                </p>

                <div className="flex items-center mb-4">
                  <div
                    className={`h-2 w-2 rounded-full ${currentAccount ? 'bg-green-400' : 'bg-blue-400'} mr-2`}
                  ></div>
                  <span
                    className={`text-sm ${currentAccount ? 'text-green-400' : 'text-blue-200'}`}
                  >
                    {currentAccount
                      ? `Đã kết nối: ${currentAccount.substring(0, 6)}...${currentAccount.substring(
                          currentAccount.length - 4,
                        )}`
                      : 'Chưa kết nối'}
                  </span>
                </div>

                <button
                  onClick={handleConnectWallet}
                  disabled={!isMetaMaskInstalled || isConnecting || !!currentAccount}
                  className={`inline-flex items-center px-4 py-2 ${
                    !isMetaMaskInstalled
                      ? 'bg-[#334155]/50 text-blue-300/50 cursor-not-allowed'
                      : currentAccount
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-[#0288D1] hover:bg-[#0277BD] text-white'
                  } rounded-lg transition-colors duration-200`}
                >
                  {isConnecting ? (
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  ) : currentAccount ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <Wallet className="h-5 w-5 mr-2" />
                  )}
                  {isConnecting ? 'Đang kết nối...' : currentAccount ? 'Đã kết nối' : 'Kết nối ví'}
                </button>
              </div>
            </div>

            {isMetaMaskInstalled && !currentAccount && (
              <div className="mt-4 p-3 bg-[#0D1321]/70 rounded-lg border border-[#334155]/50">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-200/70">
                    Khi nhấn "Kết nối ví", MetaMask sẽ hiển thị một cửa sổ popup yêu cầu bạn xác
                    nhận kết nối.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Step 3: Connect to POA Network */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`bg-[#1E293B]/30 backdrop-blur-md rounded-xl border ${
              currentAccount && !isNetworkConnected
                ? 'border-blue-500/50 shadow-[0_0_15px_rgba(2,136,209,0.2)]'
                : 'border-[#334155]/50'
            } p-6`}
          >
            <div className="flex items-start mb-4">
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-lg ${
                  isNetworkConnected
                    ? 'bg-green-500/20 text-green-400'
                    : currentAccount
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-[#334155]/50 text-blue-300/50'
                } flex items-center justify-center mr-4`}
              >
                {isNetworkConnected ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="font-bold">3</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Kết nối mạng POA</h3>
                <p className="text-sm text-blue-200/70 mb-4">
                  Chuyển sang mạng POA để tương tác với ứng dụng bầu cử blockchain
                </p>

                <div className="flex items-center mb-4">
                  <div
                    className={`h-2 w-2 rounded-full ${isNetworkConnected ? 'bg-green-400' : 'bg-blue-400'} mr-2`}
                  ></div>
                  <span
                    className={`text-sm ${isNetworkConnected ? 'text-green-400' : 'text-blue-200'}`}
                  >
                    {isNetworkConnected ? 'Đã kết nối mạng POA' : 'Chưa kết nối mạng POA'}
                  </span>
                </div>

                <button
                  onClick={handleSwitchNetwork}
                  disabled={!currentAccount || isSettingUpNetwork || isNetworkConnected}
                  className={`inline-flex items-center px-4 py-2 ${
                    !currentAccount
                      ? 'bg-[#334155]/50 text-blue-300/50 cursor-not-allowed'
                      : isNetworkConnected
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-[#0288D1] hover:bg-[#0277BD] text-white'
                  } rounded-lg transition-colors duration-200`}
                >
                  {isSettingUpNetwork ? (
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  ) : isNetworkConnected ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <Network className="h-5 w-5 mr-2" />
                  )}
                  {isSettingUpNetwork
                    ? 'Đang chuyển mạng...'
                    : isNetworkConnected
                      ? 'Đã kết nối mạng'
                      : 'Kết nối mạng POA'}
                </button>
              </div>
            </div>

            {currentAccount && !isNetworkConnected && (
              <div className="mt-4 p-3 bg-[#0D1321]/70 rounded-lg border border-[#334155]/50">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-200/70">
                    <p className="mb-2">Thông tin mạng POA:</p>
                    <ul className="space-y-1 pl-2">
                      <li>Tên mạng: POA Network</li>
                      <li>Chain ID: 0xd2 (decimal: 210)</li>
                      <li>RPC URL: https://geth.holihu.online/rpc</li>
                      <li>Symbol: POA</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Step 4: Add HLU Token */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`bg-[#1E293B]/30 backdrop-blur-md rounded-xl border ${
              isNetworkConnected && !isTokenAdded
                ? 'border-blue-500/50 shadow-[0_0_15px_rgba(2,136,209,0.2)]'
                : 'border-[#334155]/50'
            } p-6`}
          >
            <div className="flex items-start mb-4">
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-lg ${
                  isTokenAdded
                    ? 'bg-green-500/20 text-green-400'
                    : isNetworkConnected
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-[#334155]/50 text-blue-300/50'
                } flex items-center justify-center mr-4`}
              >
                {isTokenAdded ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="font-bold">4</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Thêm token HLU</h3>
                <p className="text-sm text-blue-200/70 mb-4">
                  Thêm token HLU vào ví MetaMask để theo dõi số dư và tương tác với ứng dụng
                </p>

                <div className="flex items-center mb-4">
                  <div
                    className={`h-2 w-2 rounded-full ${isTokenAdded ? 'bg-green-400' : 'bg-blue-400'} mr-2`}
                  ></div>
                  <span className={`text-sm ${isTokenAdded ? 'text-green-400' : 'text-blue-200'}`}>
                    {isTokenAdded ? 'Đã thêm token HLU' : 'Chưa thêm token HLU'}
                  </span>
                </div>

                <button
                  onClick={handleAddToken}
                  disabled={!isNetworkConnected || isAddingToken || isTokenAdded}
                  className={`inline-flex items-center px-4 py-2 ${
                    !isNetworkConnected
                      ? 'bg-[#334155]/50 text-blue-300/50 cursor-not-allowed'
                      : isTokenAdded
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-[#0288D1] hover:bg-[#0277BD] text-white'
                  } rounded-lg transition-colors duration-200`}
                >
                  {isAddingToken ? (
                    <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  ) : isTokenAdded ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <Coins className="h-5 w-5 mr-2" />
                  )}
                  {isAddingToken
                    ? 'Đang thêm token...'
                    : isTokenAdded
                      ? 'Đã thêm token'
                      : 'Thêm token HLU'}
                </button>
              </div>
            </div>

            {isNetworkConnected && !isTokenAdded && (
              <div className="mt-4 p-3 bg-[#0D1321]/70 rounded-lg border border-[#334155]/50">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-200/70">
                    <p className="mb-2">Thông tin token HLU:</p>
                    <ul className="space-y-1 pl-2">
                      <li>Tên token: HoLiHu Token</li>
                      <li>Symbol: HLU</li>
                      <li>Địa chỉ: 0x820F15F12Aa75BAa89A16B20768024C8604Ea16f</li>
                      <li>Decimals: 18</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Step 5: Setup Complete */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`bg-[#1E293B]/30 backdrop-blur-md rounded-xl border ${
              isTokenAdded
                ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                : 'border-[#334155]/50'
            } p-6 lg:col-span-2`}
          >
            <div className="flex items-start mb-4">
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-lg ${
                  isTokenAdded
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-[#334155]/50 text-blue-300/50'
                } flex items-center justify-center mr-4`}
              >
                {isTokenAdded ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="font-bold">5</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Thiết lập hoàn tất</h3>
                <p className="text-sm text-blue-200/70 mb-4">
                  Bạn đã hoàn tất thiết lập môi trường blockchain và sẵn sàng sử dụng ứng dụng
                </p>

                {isTokenAdded ? (
                  <div className="p-4 bg-green-900/20 border border-green-800/30 rounded-lg mb-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-green-300 font-medium mb-1">Thiết lập thành công!</h4>
                        <p className="text-sm text-green-200/70">
                          Bạn đã hoàn tất tất cả các bước thiết lập cần thiết và có thể sử dụng đầy
                          đủ tính năng của ứng dụng.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg mb-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-blue-300 font-medium mb-1">Hoàn tất các bước trên</h4>
                        <p className="text-sm text-blue-200/70">
                          Vui lòng hoàn tất các bước thiết lập trên để có thể sử dụng đầy đủ tính
                          năng của ứng dụng.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleContinue}
                  disabled={!isTokenAdded}
                  className={`inline-flex items-center px-6 py-3 ${
                    !isTokenAdded
                      ? 'bg-[#334155]/50 text-blue-300/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                  } rounded-lg transition-all duration-300`}
                >
                  {isTokenAdded ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Tiếp tục sử dụng ứng dụng
                    </>
                  ) : (
                    <>
                      <HelpCircle className="h-5 w-5 mr-2" />
                      Hoàn tất thiết lập để tiếp tục
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-[#1E293B]/30 backdrop-blur-md rounded-xl border border-[#334155]/50 p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <HelpCircle className="h-5 w-5 text-blue-400 mr-2" />
              Cần trợ giúp?
            </h3>
            <p className="text-blue-200/80 mb-4">
              Nếu bạn gặp khó khăn trong quá trình thiết lập, vui lòng tham khảo các tài liệu sau:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://metamask.io/faqs/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-[#0D1321]/70 rounded-lg border border-[#334155]/50 hover:border-blue-500/30 transition-colors duration-200 flex items-start"
              >
                <FaEthereum className="h-5 w-5 text-[#F6851B] mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium mb-1">Hướng dẫn MetaMask</h4>
                  <p className="text-sm text-blue-200/70">
                    Tìm hiểu cách sử dụng MetaMask và các tính năng cơ bản
                  </p>
                </div>
              </a>

              <a
                href="https://explorer.holihu.online"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-[#0D1321]/70 rounded-lg border border-[#334155]/50 hover:border-blue-500/30 transition-colors duration-200 flex items-start"
              >
                <Network className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-white font-medium mb-1">Blockchain Explorer</h4>
                  <p className="text-sm text-blue-200/70">
                    Khám phá các giao dịch và hợp đồng thông minh trên mạng POA
                  </p>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainSetupPage;
