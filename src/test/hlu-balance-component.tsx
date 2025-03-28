import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  fetchHluBalance,
  fetchTokenInfo,
  fetchAddressDetails,
  setCurrentAddress,
} from '../store/sliceBlockchain/blockchainSlice';
import { isValidAddress } from '../api/apiBlockchain/blockchain-utils';

interface HluTokenBalanceProps {
  defaultAddress?: string;
}

const HluTokenBalance: React.FC<HluTokenBalanceProps> = ({ defaultAddress }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { hluBalance, tokenInfo, addressDetails, isLoading, error, currentAddress, isConnected } =
    useSelector((state: RootState) => state.blockchain);

  const [address, setAddress] = useState<string>(defaultAddress || currentAddress || '');
  const [isAddressValid, setIsAddressValid] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Kiểm tra địa chỉ khi component mount hoặc defaultAddress thay đổi
  useEffect(() => {
    if (defaultAddress) {
      setAddress(defaultAddress);
      setIsAddressValid(isValidAddress(defaultAddress));
    } else if (currentAddress) {
      setAddress(currentAddress);
      setIsAddressValid(isValidAddress(currentAddress));
    }
  }, [defaultAddress, currentAddress]);

  // Lấy thông tin token khi component mount
  useEffect(() => {
    if (!tokenInfo) {
      dispatch(fetchTokenInfo());
    }
  }, [dispatch, tokenInfo]);

  // Xác thực địa chỉ khi người dùng nhập
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    setIsAddressValid(isValidAddress(newAddress));
  };

  // Kiểm tra số dư khi nhấn nút
  const handleCheckBalance = () => {
    if (isAddressValid) {
      dispatch(setCurrentAddress(address));
      dispatch(fetchAddressDetails(address));
    }
  };

  // Kết hợp địa chỉ MetaMask (nếu có)
  const handleConnectMetaMask = async () => {
    try {
      // Kiểm tra xem có MetaMask không
      if (typeof window.ethereum !== 'undefined') {
        // Yêu cầu kết nối với MetaMask
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (accounts.length > 0) {
          const metaMaskAddress = accounts[0];
          setAddress(metaMaskAddress);
          setIsAddressValid(true);
          dispatch(setCurrentAddress(metaMaskAddress));
          dispatch(fetchAddressDetails(metaMaskAddress));
        }
      } else {
        alert('Vui lòng cài đặt MetaMask để sử dụng tính năng này');
      }
    } catch (error) {
      console.error('Lỗi khi kết nối MetaMask:', error);
      alert('Không thể kết nối với MetaMask');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0A0F18] via-[#121A29] to-[#0D1321] shadow-[0_0_50px_rgba(79,139,255,0.2)] border border-[#2A3A5A]/30 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_60px_rgba(79,139,255,0.3)]">
      <h2 className="text-2xl font-medium mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]">
        Kiểm tra số dư {tokenInfo?.symbol || 'HLU'} Token
      </h2>

      {/* Trạng thái kết nối */}
      <div className="mb-6 flex items-center p-3 rounded-xl bg-[#162A45]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
        <div
          className={`w-3 h-3 rounded-full mr-2 ${
            isConnected
              ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]'
              : 'bg-gradient-to-r from-red-400 to-red-500 shadow-[0_0_10px_rgba(248,113,113,0.5)]'
          }`}
        ></div>
        <span className="text-[#E1F5FE] text-sm">
          {isConnected ? 'Đã kết nối blockchain' : 'Chưa kết nối blockchain'}
        </span>
      </div>

      {/* Thông tin token */}
      {tokenInfo && (
        <div className="mb-6 p-4 rounded-xl bg-[#162A45]/60 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_4px_20px_rgba(8,145,178,0.1)] transition-all duration-300 hover:shadow-[0_4px_25px_rgba(8,145,178,0.2)]">
          <p className="mb-2 text-sm">
            <span className="font-medium text-[#4F8BFF]">Tên Token:</span>{' '}
            <span className="text-white">{tokenInfo.name}</span>
          </p>
          <p className="mb-2 text-sm">
            <span className="font-medium text-[#4F8BFF]">Ký hiệu:</span>{' '}
            <span className="text-white">{tokenInfo.symbol}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-[#4F8BFF]">Số thập phân:</span>{' '}
            <span className="text-white">{tokenInfo.decimals}</span>
          </p>
        </div>
      )}

      {/* Nhập địa chỉ ví */}
      <div className="mb-6">
        <label className="block mb-2 font-medium text-sm text-[#B0BEC5]">Địa chỉ ví:</label>
        <div className="flex">
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            className={`w-full p-3 bg-[#0D1321]/70 backdrop-blur-sm border rounded-l-lg text-white placeholder-[#B0BEC5]/50 focus:outline-none focus:ring-2 focus:ring-[#4F8BFF] transition-all duration-300 ${
              address && !isAddressValid
                ? 'border-red-500/50'
                : 'border-[#2A3A5A]/50 hover:border-[#4F8BFF]/50'
            }`}
            placeholder="Nhập địa chỉ ví (0x...)"
          />
          <button
            onClick={handleConnectMetaMask}
            className="bg-gradient-to-r from-[#FF9800] to-[#F57C00] text-white px-4 py-3 rounded-r-lg hover:shadow-[0_0_15px_rgba(255,152,0,0.5)] transition-all duration-300 hover:scale-105"
            title="Kết nối với MetaMask"
          >
            <span role="img" aria-label="MetaMask">
              🦊
            </span>
          </button>
        </div>
        {address && !isAddressValid && (
          <p className="text-red-400 text-xs mt-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            Địa chỉ ví không hợp lệ
          </p>
        )}
      </div>

      {/* Nút kiểm tra số dư */}
      <button
        onClick={handleCheckBalance}
        disabled={isLoading || !isAddressValid}
        className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 ${
          isLoading || !isAddressValid
            ? 'bg-[#263238]/60 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:shadow-[0_0_25px_rgba(79,139,255,0.5)] hover:scale-[1.02]'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Đang kiểm tra...
          </div>
        ) : (
          'Kiểm tra số dư'
        )}
      </button>

      {/* Hiển thị lỗi */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-[#4A0F23]/40 border border-red-500/30 backdrop-blur-sm text-red-400 text-sm flex items-start">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* Hiển thị số dư */}
      {hluBalance !== null && !error && (
        <div className="mt-6 p-5 rounded-xl bg-[#162A45]/60 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_0_30px_rgba(79,139,255,0.15)] transition-all duration-300">
          <h3 className="font-medium mb-3 text-[#E1F5FE]">Số dư {tokenInfo?.symbol || 'HLU'}:</h3>
          <p className="text-3xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#4F8BFF] to-[#6A1B9A] mb-2">
            {hluBalance} <span className="text-lg">{tokenInfo?.symbol || 'HLU'}</span>
          </p>
          <p className="text-xs text-[#B0BEC5]/80 truncate mb-3">Địa chỉ: {currentAddress}</p>

          {addressDetails && (
            <>
              <div className="mt-3 flex items-center">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-[#4F8BFF] hover:text-[#6A1B9A] text-xs flex items-center transition-all duration-300"
                >
                  {showDetails ? 'Ẩn chi tiết' : 'Xem thêm chi tiết'}
                  <span
                    className="ml-1 transition-transform duration-300"
                    style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
              </div>

              {showDetails && (
                <div className="mt-4 pt-4 border-t border-[#2A3A5A]/30 space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#4F8BFF] mr-2"></div>
                    <p className="text-sm text-[#E1F5FE]">
                      <span className="font-medium">Số dư ETH:</span>{' '}
                      <span className="text-white">{addressDetails.etherBalance} ETH</span>
                    </p>
                  </div>

                  {addressDetails.discountRate > 0 && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                      <p className="text-sm text-green-400">
                        <span className="font-medium">Giảm phí:</span> {addressDetails.discountRate}
                        %
                      </p>
                    </div>
                  )}

                  {addressDetails.isMarkedForBurn && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
                      <p className="text-sm text-red-400">
                        <span className="font-medium">Cảnh báo:</span> Địa chỉ đã bị đánh dấu để đốt
                        token
                      </p>
                    </div>
                  )}

                  {(addressDetails.roles.isAdmin ||
                    addressDetails.roles.isMinter ||
                    addressDetails.roles.isPauser ||
                    addressDetails.roles.isFeeManager) && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-[#E1F5FE] mb-2">Vai trò:</p>
                      <div className="flex flex-wrap gap-2">
                        {addressDetails.roles.isAdmin && (
                          <span className="px-3 py-1 bg-blue-900/30 border border-blue-500/30 text-blue-400 text-xs rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                            Admin
                          </span>
                        )}
                        {addressDetails.roles.isMinter && (
                          <span className="px-3 py-1 bg-green-900/30 border border-green-500/30 text-green-400 text-xs rounded-full shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                            Minter
                          </span>
                        )}
                        {addressDetails.roles.isPauser && (
                          <span className="px-3 py-1 bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 text-xs rounded-full shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                            Pauser
                          </span>
                        )}
                        {addressDetails.roles.isFeeManager && (
                          <span className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 text-purple-400 text-xs rounded-full shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                            Quản lý phí
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Hiển thị thông tin token */}
      {tokenInfo && (
        <div className="mt-6 p-5 rounded-xl bg-[#162A45]/60 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_0_30px_rgba(79,139,255,0.1)]">
          <h3 className="font-medium mb-4 text-[#E1F5FE] flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-[#4F8BFF]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                clipRule="evenodd"
              />
            </svg>
            Thông tin Token
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
              <p className="text-[#B0BEC5] font-medium mb-1">Phí chuyển</p>
              <p className="text-white">{tokenInfo.phanTramPhiChuyen}%</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
              <p className="text-[#B0BEC5] font-medium mb-1">Tổng cung</p>
              <p className="text-white">{tokenInfo.totalSupply}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
              <p className="text-[#B0BEC5] font-medium mb-1">Trạng thái</p>
              {tokenInfo.paused ? (
                <p className="text-red-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                  Tạm dừng
                </p>
              ) : (
                <p className="text-green-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Hoạt động
                </p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
              <p className="text-[#B0BEC5] font-medium mb-1">Max supply</p>
              <p className="text-white">{tokenInfo.nguonCungToiDa}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HluTokenBalance;
