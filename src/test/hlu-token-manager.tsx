import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  fetchTokenInfo,
  fetchAddressDetails,
  transferToken,
  clearTransactionState,
} from '../store/sliceBlockchain/blockchainSlice';
import { isValidAddress } from '../api/apiBlockchain/blockchain-utils';

const HluTokenManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tokenInfo, addressDetails, isLoading, error, currentAddress, transaction } = useSelector(
    (state: RootState) => state.blockchain,
  );

  const [activeTab, setActiveTab] = useState<'info' | 'transfer' | 'roles'>('info');
  const [walletAddress, setWalletAddress] = useState<string>(currentAddress || '');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [transferToAddress, setTransferToAddress] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [isAddressValid, setIsAddressValid] = useState<boolean>(false);
  const [isToAddressValid, setIsToAddressValid] = useState<boolean>(false);
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);

  // Lấy thông tin token khi component mount
  useEffect(() => {
    if (!tokenInfo) {
      dispatch(fetchTokenInfo());
    }
  }, [dispatch, tokenInfo]);

  // Cập nhật state khi currentAddress thay đổi
  useEffect(() => {
    if (currentAddress) {
      setWalletAddress(currentAddress);
      setIsAddressValid(isValidAddress(currentAddress));
    }
  }, [currentAddress]);

  // Xác thực địa chỉ khi người dùng nhập
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setWalletAddress(newAddress);
    setIsAddressValid(isValidAddress(newAddress));
  };

  // Xác thực địa chỉ nhận khi người dùng nhập
  const handleToAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setTransferToAddress(newAddress);
    setIsToAddressValid(isValidAddress(newAddress));
  };

  // Kiểm tra thông tin địa chỉ
  const handleCheckAddress = () => {
    if (isAddressValid) {
      dispatch(fetchAddressDetails(walletAddress));
    }
  };

  // Chuyển token
  const handleTransfer = () => {
    if (isToAddressValid && transferAmount && privateKey) {
      dispatch(
        transferToken({
          privateKey,
          toAddress: transferToAddress,
          amount: transferAmount,
        }),
      );
    }
  };

  // Format địa chỉ rút gọn
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  // Reset trạng thái giao dịch
  const resetTransaction = () => {
    dispatch(clearTransactionState());
  };

  return (
    <div className="p-8 rounded-2xl bg-gradient-to-br from-[#0A0F18] via-[#121A29] to-[#0D1321] shadow-[0_0_50px_rgba(79,139,255,0.2)] border border-[#2A3A5A]/30 backdrop-blur-sm max-w-5xl mx-auto transition-all duration-300">
      <h2 className="text-3xl font-medium mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]">
        HoLiHu Token Manager
      </h2>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#2A3A5A]/40 mb-8">
        <button
          className={`py-3 px-6 transition-all duration-300 relative ${
            activeTab === 'info' ? 'text-white font-medium' : 'text-[#B0BEC5] hover:text-[#E1F5FE]'
          }`}
          onClick={() => setActiveTab('info')}
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
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
          </div>
          {activeTab === 'info' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full"></div>
          )}
        </button>
        <button
          className={`py-3 px-6 transition-all duration-300 relative ${
            activeTab === 'transfer'
              ? 'text-white font-medium'
              : 'text-[#B0BEC5] hover:text-[#E1F5FE]'
          }`}
          onClick={() => setActiveTab('transfer')}
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
            Chuyển Token
          </div>
          {activeTab === 'transfer' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full"></div>
          )}
        </button>
        <button
          className={`py-3 px-6 transition-all duration-300 relative ${
            activeTab === 'roles' ? 'text-white font-medium' : 'text-[#B0BEC5] hover:text-[#E1F5FE]'
          }`}
          onClick={() => setActiveTab('roles')}
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Quyền & Cài đặt
          </div>
          {activeTab === 'roles' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] rounded-full"></div>
          )}
        </button>
      </div>

      {/* Nội dung tab */}
      <div className="mb-6">
        {activeTab === 'info' && (
          <div className="animate-fadeIn">
            <h3 className="text-xl font-medium mb-6 text-[#E1F5FE] flex items-center">
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

            {tokenInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-[#162A45]/60 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_4px_25px_rgba(8,145,178,0.15)] transition-all duration-300">
                  <h4 className="font-medium mb-4 text-[#4F8BFF] text-lg">Thông tin cơ bản</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0288D1] to-[#4F8BFF] mr-3"></div>
                      <p className="text-sm">
                        <span className="text-[#B0BEC5]">Tên:</span>{' '}
                        <span className="text-white ml-1">{tokenInfo.name}</span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0288D1] to-[#4F8BFF] mr-3"></div>
                      <p className="text-sm">
                        <span className="text-[#B0BEC5]">Ký hiệu:</span>{' '}
                        <span className="text-white ml-1">{tokenInfo.symbol}</span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0288D1] to-[#4F8BFF] mr-3"></div>
                      <p className="text-sm">
                        <span className="text-[#B0BEC5]">Decimals:</span>{' '}
                        <span className="text-white ml-1">{tokenInfo.decimals}</span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0288D1] to-[#4F8BFF] mr-3"></div>
                      <p className="text-sm">
                        <span className="text-[#B0BEC5]">Tổng cung hiện tại:</span>{' '}
                        <span className="text-white ml-1">
                          {tokenInfo.totalSupply} {tokenInfo.symbol}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#0288D1] to-[#4F8BFF] mr-3"></div>
                      <p className="text-sm">
                        <span className="text-[#B0BEC5]">Tổng cung tối đa:</span>{' '}
                        <span className="text-white ml-1">
                          {tokenInfo.nguonCungToiDa} {tokenInfo.symbol}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-[#162A45]/60 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_4px_25px_rgba(8,145,178,0.15)] transition-all duration-300">
                  <h4 className="font-medium mb-4 text-[#4F8BFF] text-lg">
                    Thông tin phí & Trạng thái
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#6A1B9A] to-[#9C27B0] mr-3"></div>
                      <p className="text-sm">
                        <span className="text-[#B0BEC5]">Phí chuyển hiện tại:</span>{' '}
                        <span className="text-white ml-1">{tokenInfo.phanTramPhiChuyen}%</span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#6A1B9A] to-[#9C27B0] mr-3"></div>
                      <p className="text-sm">
                        <span className="text-[#B0BEC5]">Phí chuyển tối đa:</span>{' '}
                        <span className="text-white ml-1">{tokenInfo.phanTramPhiToiDa}%</span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#6A1B9A] to-[#9C27B0] mr-3"></div>
                      <p className="text-sm">
                        <span className="text-[#B0BEC5]">Địa chỉ nhận phí:</span>{' '}
                        <span className="text-white ml-1 font-mono text-xs bg-[#0D1321] py-1 px-2 rounded">
                          {formatAddress(tokenInfo.diaChiNhanPhi)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#6A1B9A] to-[#9C27B0] mr-3"></div>
                      <p className="text-sm flex items-center">
                        <span className="text-[#B0BEC5]">Trạng thái giao dịch:</span>{' '}
                        {tokenInfo.paused ? (
                          <span className="ml-1 text-red-400 font-medium flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse"></span>
                            Đã tạm dừng
                          </span>
                        ) : (
                          <span className="ml-1 text-green-400 font-medium flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                            Đang hoạt động
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 rounded-xl bg-[#162A45]/30 backdrop-blur-sm border border-[#2A3A5A]/20">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <svg
                      className="animate-spin h-10 w-10 text-[#4F8BFF] mb-4"
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
                    <p className="text-[#E1F5FE]">Đang tải thông tin token...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-[#4F8BFF]/50 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-[#B0BEC5] mb-4">Không có thông tin token.</p>
                    <button
                      onClick={() => dispatch(fetchTokenInfo())}
                      className="px-4 py-2 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white rounded-lg hover:shadow-[0_0_20px_rgba(79,139,255,0.4)] transition-all duration-300 text-sm"
                    >
                      Tải lại
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Kiểm tra địa chỉ */}
            <div className="mt-8 p-6 rounded-xl bg-[#162A45]/40 backdrop-blur-sm border border-[#2A3A5A]/30">
              <h4 className="font-medium mb-4 text-[#E1F5FE] flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-[#4F8BFF]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Kiểm tra địa chỉ
              </h4>
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={handleAddressChange}
                  placeholder="Nhập địa chỉ ví (0x...)"
                  className={`flex-grow p-3 bg-[#0D1321]/70 backdrop-blur-sm border rounded-lg text-white placeholder-[#B0BEC5]/50 focus:outline-none focus:ring-2 focus:ring-[#4F8BFF] transition-all duration-300 ${
                    walletAddress && !isAddressValid
                      ? 'border-red-500/50'
                      : 'border-[#2A3A5A]/50 hover:border-[#4F8BFF]/50'
                  }`}
                />
                <button
                  onClick={handleCheckAddress}
                  disabled={!isAddressValid || isLoading}
                  className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 ${
                    !isAddressValid || isLoading
                      ? 'bg-[#263238]/60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:shadow-[0_0_15px_rgba(79,139,255,0.4)] hover:scale-[1.02]'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    'Kiểm tra'
                  )}
                </button>
              </div>

              {walletAddress && !isAddressValid && (
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

            {/* Hiển thị thông tin địa chỉ nếu có */}
            {addressDetails && (
              <div className="mt-8 p-6 rounded-xl bg-[#162A45]/60 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_0_30px_rgba(79,139,255,0.15)]">
                <h4 className="font-medium mb-5 text-[#E1F5FE] flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-[#4F8BFF]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Thông tin địa chỉ{' '}
                  <span className="ml-2 px-3 py-1 bg-[#0D1321] rounded-full text-xs font-mono text-[#4F8BFF]">
                    {formatAddress(addressDetails.address)}
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0288D1] to-[#4F8BFF] flex items-center justify-center shadow-[0_0_10px_rgba(79,139,255,0.3)] mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[#B0BEC5]">Số dư HLU</p>
                        <p className="text-white font-medium">{addressDetails.hluBalance} HLU</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#F57C00] flex items-center justify-center shadow-[0_0_10px_rgba(255,152,0,0.3)] mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[#B0BEC5]">Số dư ETH</p>
                        <p className="text-white font-medium">{addressDetails.etherBalance} ETH</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          addressDetails.isMarkedForBurn
                            ? 'bg-gradient-to-r from-[#F44336] to-[#D32F2F] shadow-[0_0_10px_rgba(244,67,54,0.3)]'
                            : 'bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] shadow-[0_0_10px_rgba(76,175,80,0.3)]'
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[#B0BEC5]">Đánh dấu để đốt</p>
                        {addressDetails.isMarkedForBurn ? (
                          <p className="text-red-400 font-medium flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>{' '}
                            Có
                          </p>
                        ) : (
                          <p className="text-green-400 font-medium flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>{' '}
                            Không
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#9C27B0] to-[#6A1B9A] flex items-center justify-center shadow-[0_0_10px_rgba(156,39,176,0.3)] mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[#B0BEC5]">Giảm phí</p>
                        <p
                          className={`font-medium ${
                            addressDetails.discountRate > 0 ? 'text-green-400' : 'text-white'
                          }`}
                        >
                          {addressDetails.discountRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-3 text-[#E1F5FE]">Vai trò:</p>
                    {!addressDetails.roles.isAdmin &&
                    !addressDetails.roles.isMinter &&
                    !addressDetails.roles.isPauser &&
                    !addressDetails.roles.isFeeManager ? (
                      <div className="p-4 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20 text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-[#B0BEC5]/50 mx-auto mb-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-[#B0BEC5]">Không có vai trò đặc biệt</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {addressDetails.roles.isAdmin && (
                          <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30 backdrop-blur-sm flex items-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#1976D2] to-[#2196F3] flex items-center justify-center shadow-[0_0_10px_rgba(33,150,243,0.3)] mr-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-blue-400 font-medium">Admin</p>
                              <p className="text-xs text-blue-300/70">Quyền quản trị hệ thống</p>
                            </div>
                          </div>
                        )}
                        {addressDetails.roles.isMinter && (
                          <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30 backdrop-blur-sm flex items-center shadow-[0_0_15px_rgba(74,222,128,0.1)]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#388E3C] to-[#4CAF50] flex items-center justify-center shadow-[0_0_10px_rgba(76,175,80,0.3)] mr-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-green-400 font-medium">Minter</p>
                              <p className="text-xs text-green-300/70">Quyền tạo token mới</p>
                            </div>
                          </div>
                        )}
                        {addressDetails.roles.isPauser && (
                          <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30 backdrop-blur-sm flex items-center shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FFA000] to-[#FFC107] flex items-center justify-center shadow-[0_0_10px_rgba(255,193,7,0.3)] mr-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-yellow-400 font-medium">Pauser</p>
                              <p className="text-xs text-yellow-300/70">Quyền tạm dừng giao dịch</p>
                            </div>
                          </div>
                        )}
                        {addressDetails.roles.isFeeManager && (
                          <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/30 backdrop-blur-sm flex items-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7B1FA2] to-[#9C27B0] flex items-center justify-center shadow-[0_0_10px_rgba(156,39,176,0.3)] mr-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-purple-400 font-medium">Quản lý phí</p>
                              <p className="text-xs text-purple-300/70">
                                Quyền thiết lập phí giao dịch
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="animate-fadeIn">
            <h3 className="text-xl font-medium mb-6 text-[#E1F5FE] flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-[#4F8BFF]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
              </svg>
              Chuyển Token
            </h3>

            {/* Form chuyển token */}
            <div className="p-6 rounded-xl bg-[#162A45]/60 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_0_30px_rgba(79,139,255,0.1)]">
              <div className="mb-5">
                <label className="block mb-2 font-medium text-sm text-[#E1F5FE]">
                  Private Key (Khóa bí mật):
                </label>
                <div className="relative">
                  <input
                    type={showPrivateKey ? 'text' : 'password'}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Nhập private key của địa chỉ gửi"
                    className="w-full p-3 bg-[#0D1321]/70 backdrop-blur-sm border border-[#2A3A5A]/50 rounded-lg text-white placeholder-[#B0BEC5]/50 focus:outline-none focus:ring-2 focus:ring-[#4F8BFF] transition-all duration-300"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-[#B0BEC5] hover:text-[#E1F5FE] transition-colors duration-300"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                          clipRule="evenodd"
                        />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-red-400 mt-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cảnh báo: Không bao giờ chia sẻ private key với người khác!
                </p>
              </div>

              <div className="mb-5">
                <label className="block mb-2 font-medium text-sm text-[#E1F5FE]">
                  Địa chỉ nhận:
                </label>
                <input
                  type="text"
                  value={transferToAddress}
                  onChange={handleToAddressChange}
                  placeholder="Địa chỉ nhận token (0x...)"
                  className={`w-full p-3 bg-[#0D1321]/70 backdrop-blur-sm border rounded-lg text-white placeholder-[#B0BEC5]/50 focus:outline-none focus:ring-2 focus:ring-[#4F8BFF] transition-all duration-300 ${
                    transferToAddress && !isToAddressValid
                      ? 'border-red-500/50'
                      : 'border-[#2A3A5A]/50 hover:border-[#4F8BFF]/50'
                  }`}
                />
                {transferToAddress && !isToAddressValid && (
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
                    Địa chỉ nhận không hợp lệ
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label className="block mb-2 font-medium text-sm text-[#E1F5FE]">
                  Số lượng HLU:
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Số lượng HLU cần chuyển"
                  className="w-full p-3 bg-[#0D1321]/70 backdrop-blur-sm border border-[#2A3A5A]/50 rounded-lg text-white placeholder-[#B0BEC5]/50 focus:outline-none focus:ring-2 focus:ring-[#4F8BFF] transition-all duration-300"
                  min="0"
                  step="0.000001"
                />
              </div>

              {tokenInfo && (
                <div className="mb-6 p-4 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#FFD54F]/20 shadow-[0_0_15px_rgba(255,213,79,0.1)]">
                  <div className="flex items-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-[#FFD54F]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h4 className="text-[#FFD54F] font-medium">Chi tiết giao dịch</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm flex justify-between">
                      <span className="text-[#B0BEC5]">Phí giao dịch:</span>
                      <span className="text-white">
                        {tokenInfo.phanTramPhiChuyen}% (
                        {(
                          (parseFloat(transferAmount || '0') * tokenInfo.phanTramPhiChuyen) /
                          100
                        ).toFixed(6)}{' '}
                        HLU)
                      </span>
                    </p>
                    <p className="text-sm flex justify-between">
                      <span className="text-[#B0BEC5]">Số lượng nhận được:</span>
                      <span className="text-white">
                        {(
                          parseFloat(transferAmount || '0') *
                          (1 - tokenInfo.phanTramPhiChuyen / 100)
                        ).toFixed(6)}{' '}
                        HLU
                      </span>
                    </p>
                    <div className="border-t border-[#2A3A5A]/30 my-2 pt-2">
                      <p className="text-sm flex justify-between font-medium">
                        <span className="text-[#B0BEC5]">Tổng số gửi:</span>
                        <span className="text-white">{transferAmount || '0'} HLU</span>
                      </p>
                    </div>
                    {(addressDetails?.discountRate ?? 0) > 0 && (
                      <p className="text-sm text-green-400 flex items-center mt-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Giảm phí: {addressDetails ? addressDetails.discountRate : 0}%
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleTransfer}
                disabled={
                  !isToAddressValid || !transferAmount || !privateKey || transaction.isLoading
                }
                className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 ${
                  !isToAddressValid || !transferAmount || !privateKey || transaction.isLoading
                    ? 'bg-[#263238]/60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:shadow-[0_0_25px_rgba(79,139,255,0.5)] hover:scale-[1.02]'
                }`}
              >
                {transaction.isLoading ? (
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
                    Đang xử lý...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                    </svg>
                    Chuyển Token
                  </div>
                )}
              </button>
            </div>

            {/* Kết quả giao dịch */}
            {(transaction.hash || transaction.error) && (
              <div
                className={`mt-6 p-6 rounded-xl backdrop-blur-sm shadow-lg transition-all duration-500 animate-fadeIn ${
                  transaction.hash
                    ? 'bg-[#0F2D1F]/60 border border-green-500/30 shadow-[0_0_30px_rgba(74,222,128,0.15)]'
                    : 'bg-[#4A0F23]/60 border border-red-500/30 shadow-[0_0_30px_rgba(248,113,113,0.15)]'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-lg flex items-center">
                    {transaction.hash ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 mr-2 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-400">Giao dịch thành công</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 mr-2 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-red-400">Giao dịch thất bại</span>
                      </>
                    )}
                  </h4>
                  <button
                    onClick={resetTransaction}
                    className="text-[#B0BEC5] hover:text-[#E1F5FE] transition-colors duration-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {transaction.hash && (
                  <div className="mt-4 space-y-4">
                    <div className="p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
                      <p className="text-xs text-[#B0BEC5] mb-1">Hash giao dịch:</p>
                      <p className="break-all text-sm text-white font-mono">{transaction.hash}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#B0BEC5] mb-1">Xem chi tiết:</p>
                        <a
                          href={`https://etherscan.io/tx/${transaction.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4F8BFF] hover:text-[#6A1B9A] transition-colors duration-300 text-sm flex items-center"
                        >
                          Xem trên Etherscan
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        </a>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] flex items-center justify-center shadow-[0_0_20px_rgba(79,139,255,0.4)]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {transaction.error && (
                  <div className="mt-4 p-4 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-red-500/20">
                    <p className="text-sm text-red-400 break-words">{transaction.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="animate-fadeIn">
            <h3 className="text-xl font-medium mb-6 text-[#E1F5FE] flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-[#4F8BFF]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Quyền & Cài đặt
            </h3>

            {addressDetails && addressDetails.roles.isAdmin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phần quản lý minting */}
                {addressDetails.roles.isMinter && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-[#162A45]/60 to-[#1F3B60]/40 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_4px_25px_rgba(8,145,178,0.15)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(74,222,128,0.2)]">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#388E3C] to-[#4CAF50] flex items-center justify-center shadow-[0_0_15px_rgba(76,175,80,0.4)] mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h4 className="font-medium text-lg text-green-400">Quản lý Mint Token</h4>
                    </div>
                    <p className="mb-6 text-sm text-[#E1F5FE]/80">
                      Bạn có quyền mint token mới vào hệ thống.
                    </p>
                    {/* Form mint token sẽ được thêm vào đây */}
                    <div className="p-4 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20 text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-[#B0BEC5]/30 mx-auto mb-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-[#B0BEC5] text-sm">
                        Tính năng mint token sẽ có trong bản cập nhật tiếp theo.
                      </p>
                    </div>
                  </div>
                )}

                {/* Phần quản lý phí */}
                {addressDetails.roles.isFeeManager && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-[#162A45]/60 to-[#1F3B60]/40 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_4px_25px_rgba(8,145,178,0.15)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(168,85,247,0.2)]">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#7B1FA2] to-[#9C27B0] flex items-center justify-center shadow-[0_0_15px_rgba(156,39,176,0.4)] mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h4 className="font-medium text-lg text-purple-400">Quản lý Phí</h4>
                    </div>
                    <p className="mb-6 text-sm text-[#E1F5FE]/80">
                      Bạn có quyền cài đặt phí giao dịch và quản lý giảm phí cho các địa chỉ.
                    </p>
                    {/* Form quản lý phí sẽ được thêm vào đây */}
                    <div className="p-4 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20 text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-[#B0BEC5]/30 mx-auto mb-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-[#B0BEC5] text-sm">
                        Tính năng quản lý phí sẽ có trong bản cập nhật tiếp theo.
                      </p>
                    </div>
                  </div>
                )}

                {/* Phần tạm dừng giao dịch */}
                {addressDetails.roles.isPauser && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-[#162A45]/60 to-[#1F3B60]/40 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_4px_25px_rgba(8,145,178,0.15)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(250,204,21,0.2)]">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FFA000] to-[#FFC107] flex items-center justify-center shadow-[0_0_15px_rgba(255,193,7,0.4)] mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h4 className="font-medium text-lg text-yellow-400">Tạm dừng Giao dịch</h4>
                    </div>
                    <p className="mb-6 text-sm text-[#E1F5FE]/80">
                      Bạn có quyền tạm dừng và bật lại các giao dịch token trong trường hợp khẩn
                      cấp.
                    </p>
                    <div className="flex items-center justify-between p-3 mb-5 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20">
                      <span className="font-medium text-sm text-[#E1F5FE]">
                        Trạng thái hiện tại:
                      </span>
                      {tokenInfo?.paused ? (
                        <span className="text-red-400 font-medium flex items-center text-sm">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                          Đã tạm dừng
                        </span>
                      ) : (
                        <span className="text-green-400 font-medium flex items-center text-sm">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                          Đang hoạt động
                        </span>
                      )}
                    </div>
                    {/* Nút tạm dừng/bật lại sẽ được thêm vào đây */}
                    <div className="p-4 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20 text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-[#B0BEC5]/30 mx-auto mb-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-[#B0BEC5] text-sm">
                        Tính năng tạm dừng giao dịch sẽ có trong bản cập nhật tiếp theo.
                      </p>
                    </div>
                  </div>
                )}

                {/* Phần quản lý đốt token */}
                {addressDetails.roles.isAdmin && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-[#162A45]/60 to-[#1F3B60]/40 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_4px_25px_rgba(8,145,178,0.15)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(248,113,113,0.2)]">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#F44336] to-[#D32F2F] flex items-center justify-center shadow-[0_0_15px_rgba(244,67,54,0.4)] mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h4 className="font-medium text-lg text-red-400">Quản lý Đốt Token</h4>
                    </div>
                    <p className="mb-6 text-sm text-[#E1F5FE]/80">
                      Với tư cách là admin, bạn có thể đánh dấu địa chỉ để đốt token trong trường
                      hợp vi phạm hoặc cần thiết.
                    </p>
                    {/* Form đánh dấu địa chỉ sẽ được thêm vào đây */}
                    <div className="p-4 rounded-lg bg-[#0D1321]/50 backdrop-blur-sm border border-[#2A3A5A]/20 text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-[#B0BEC5]/30 mx-auto mb-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-[#B0BEC5] text-sm">
                        Tính năng quản lý đốt token sẽ có trong bản cập nhật tiếp theo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-gradient-to-br from-[#162A45]/60 to-[#1F3B60]/40 backdrop-blur-sm border border-[#2A3A5A]/30 shadow-[0_4px_25px_rgba(8,145,178,0.15)] flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#FFD54F]/30 to-[#FFB300]/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,213,79,0.2)] mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-[#FFD54F]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-center text-[#E1F5FE] text-lg font-medium mb-2">
                  Bạn không có quyền quản trị đối với HoLiHu Token
                </p>
                <p className="text-center text-[#B0BEC5] mb-6">
                  {addressDetails
                    ? 'Để sử dụng các tính năng quản trị, bạn cần có các vai trò như Admin, Minter, Pauser hoặc Quản lý phí.'
                    : 'Vui lòng kiểm tra địa chỉ ví để xem quyền của bạn.'}
                </p>
                {!addressDetails && (
                  <button
                    onClick={() => setActiveTab('info')}
                    className="px-6 py-3 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white rounded-lg hover:shadow-[0_0_20px_rgba(79,139,255,0.4)] transition-all duration-300 text-sm"
                  >
                    Kiểm tra địa chỉ
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hiển thị lỗi */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-[#4A0F23]/40 border border-red-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(248,113,113,0.1)] text-red-400 text-sm flex items-start">
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
    </div>
  );
};

export default HluTokenManager;
