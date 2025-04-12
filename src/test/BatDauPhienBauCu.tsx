'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
  parseUnits,
  keccak256,
  getBytes,
  recoverAddress,
  SigningKey,
  Contract,
  JsonRpcProvider,
  Signature,
} from 'ethers';
import { Play, Clock, Info, Loader, Check, AlertCircle, Calendar } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useToast } from '../test/components/use-toast';

interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  quanLyCuocBauCuAddress?: string;
  chainId: number;
}

interface PhienBauCuInfo {
  id: string;
  dangHoatDong: boolean;
  thoiGianBatDau: number;
  thoiGianKetThuc: number;
  soCuTriToiDa: number;
  soUngVienHienTai: number;
  soCuTriHienTai: number;
}

const BatDauPhienBauCu: React.FC<{
  idCuocBauCu: string;
  idPhienBauCu: string;
}> = ({ idCuocBauCu, idPhienBauCu }) => {
  // State variables
  const [thoiGianKeoDai, setThoiGianKeoDai] = useState(3); // Mặc định 3 ngày
  const [isLoading, setIsLoading] = useState(false);
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [phienBauCuInfo, setPhienBauCuInfo] = useState<PhienBauCuInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hooks
  const { toast } = useToast();
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // Fetch contract addresses, session key, and phien bau cu info
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contract addresses
        const contractResponse = await apiClient.get('/api/Blockchain/contract-addresses');
        if (contractResponse.data && contractResponse.data.success) {
          setContractAddresses(contractResponse.data);
        } else {
          throw new Error('Không thể lấy địa chỉ contract');
        }

        // Fetch session key
        if (userInfo && userInfo.id) {
          const sessionResponse = await apiClient.post('/api/Blockchain/get-session-key', {
            TaiKhoanID: userInfo.id,
            ViID: walletInfo?.viId,
          });

          if (
            sessionResponse.data &&
            sessionResponse.data.success &&
            sessionResponse.data.sessionKey
          ) {
            setSessionKey({
              sessionKey: sessionResponse.data.sessionKey,
              expiresAt: sessionResponse.data.expiresAt,
              scwAddress: sessionResponse.data.scwAddress || walletInfo?.diaChiVi,
            });
          } else {
            throw new Error('Không thể lấy session key');
          }
        }

        // Fetch phien bau cu info
        const phienResponse = await apiClient.get(
          `/api/CuocBauCu/phienbaucu/${idCuocBauCu}/${idPhienBauCu}`,
        );
        if (phienResponse.data) {
          setPhienBauCuInfo(phienResponse.data);

          // Nếu phiên đã bắt đầu, hiển thị thông báo
          if (phienResponse.data.dangHoatDong) {
            setSuccess('Phiên bầu cử đã được bắt đầu.');
          }
        } else {
          throw new Error('Không thể lấy thông tin phiên bầu cử');
        }
      } catch (error) {
        setError(`Lỗi khi lấy dữ liệu: ${(error as Error).message}`);
      }
    };

    fetchData();
  }, [idCuocBauCu, idPhienBauCu, userInfo, walletInfo]);

  // Tạo UserOperation và ký với session key
  const createAndSignUserOperation = useCallback(async () => {
    if (!sessionKey || !contractAddresses) {
      setError('Thiếu thông tin session key hoặc địa chỉ contract');
      return null;
    }

    try {
      // Chuẩn bị dữ liệu cho UserOperation
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABIs cần thiết
      const entryPointAbi = [
        'function getNonce(address sender) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      const quanLyCuocBauCuAbi = [
        'function batDauPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu, uint256 thoiGianKeoDai)',
      ];

      const entryPointContract = new Contract(
        contractAddresses.entryPointAddress,
        entryPointAbi,
        provider,
      );

      // Lấy nonce hiện tại
      const nonce = await entryPointContract.getNonce(sessionKey.scwAddress);

      // Tạo calldata cho hàm batDauPhienBauCu
      const quanLyCuocBauCuAddress = contractAddresses.quanLyCuocBauCuAddress || '';
      const quanLyCuocBauCuContract = new Contract(
        quanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Convert thoiGianKeoDai từ ngày sang giây
      const thoiGianKeoDaiSeconds = thoiGianKeoDai * 24 * 60 * 60;

      const batDauPhienCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
        'batDauPhienBauCu',
        [idCuocBauCu, idPhienBauCu, thoiGianKeoDaiSeconds.toString()],
      );

      // Create calldata for SCW execute function
      // ABIs for SimpleAccount (SCW)
      const simpleAccountAbi = [
        'function execute(address dest, uint256 value, bytes calldata func) external',
      ];

      const simpleAccountContract = new Contract(sessionKey.scwAddress, simpleAccountAbi, provider);

      const executeCallData = simpleAccountContract.interface.encodeFunctionData('execute', [
        quanLyCuocBauCuAddress,
        0,
        batDauPhienCallData,
      ]);

      // Create UserOperation
      const userOp = {
        sender: sessionKey.scwAddress,
        nonce: nonce.toString(),
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: '500000',
        verificationGasLimit: '500000',
        preVerificationGas: '100000',
        maxFeePerGas: parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
        paymasterAndData: contractAddresses.paymasterAddress,
        signature: '0x',
      };

      // Calculate UserOpHash
      const userOpHash = await entryPointContract.layHashThaoTac(userOp);

      // Sign the UserOperation with session key
      const signingKey = new SigningKey(sessionKey.sessionKey);
      const signatureObj = signingKey.sign(getBytes(userOpHash));

      // Create formatted signature
      const signature = Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      // Add signature to UserOperation
      userOp.signature = signature;

      return {
        userOp,
        userOpHash,
      };
    } catch (error) {
      console.error('Lỗi khi tạo UserOperation:', error);
      setError(`Lỗi khi tạo UserOperation: ${(error as Error).message}`);
      return null;
    }
  }, [sessionKey, contractAddresses, idCuocBauCu, idPhienBauCu, thoiGianKeoDai]);

  // Send UserOperation to bundler
  const startPhienBauCu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Kiểm tra xem phiên đã bắt đầu chưa
      if (phienBauCuInfo?.dangHoatDong) {
        throw new Error('Phiên bầu cử này đã được bắt đầu.');
      }

      // Tạo và ký UserOperation
      const result = await createAndSignUserOperation();
      if (!result) {
        throw new Error('Không thể tạo UserOperation');
      }

      const { userOp, userOpHash } = result;

      // Gửi UserOperation đến bundler
      const response = await apiClient.post('/api/bundler/submit', {
        ...userOp,
        userOpHash,
      });

      if (!response.data) {
        throw new Error('Không nhận được phản hồi từ bundler');
      }

      const txHash = response.data.txHash || response.data.userOpHash;

      setSuccess(`Đã gửi yêu cầu bắt đầu phiên bầu cử. Hash giao dịch: ${txHash}`);

      toast({
        title: 'Đã gửi yêu cầu',
        description: 'Yêu cầu bắt đầu phiên bầu cử đã được gửi đến blockchain',
      });

      // Polling để kiểm tra trạng thái giao dịch
      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${userOpHash}`,
          );

          if (statusResponse.data && statusResponse.data.status === 'success') {
            clearInterval(checkInterval);

            setSuccess(`Phiên bầu cử đã được bắt đầu thành công!`);

            toast({
              title: 'Bắt đầu phiên thành công',
              description: 'Phiên bầu cử đã được bắt đầu thành công',
            });

            // Cập nhật thông tin phiên bầu cử
            try {
              const phienResponse = await apiClient.get(
                `/api/CuocBauCu/phienbaucu/${idCuocBauCu}/${idPhienBauCu}`,
              );
              if (phienResponse.data) {
                setPhienBauCuInfo(phienResponse.data);
              }
            } catch (error) {
              console.error('Lỗi khi cập nhật thông tin phiên bầu cử:', error);
            }

            setIsLoading(false);
          } else if (statusResponse.data && statusResponse.data.status === 'failed') {
            clearInterval(checkInterval);
            setError('Bắt đầu phiên bầu cử thất bại');
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra trạng thái:', error);
        }
      }, 5000);

      // Timeout sau 2 phút
      setTimeout(() => {
        clearInterval(checkInterval);
        if (isLoading) {
          setIsLoading(false);
          setSuccess('Yêu cầu đã được gửi. Vui lòng kiểm tra lại sau.');
        }
      }, 120000);
    } catch (error) {
      setError(`Lỗi: ${(error as Error).message}`);
      setIsLoading(false);

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: (error as Error).message,
      });
    }
  }, [phienBauCuInfo, createAndSignUserOperation, idCuocBauCu, idPhienBauCu, isLoading, toast]);

  // Chuỗi format ngày giờ
  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return 'Chưa xác định';
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full mr-3">
          <Play className="h-6 w-6 text-green-600 dark:text-green-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Bắt Đầu Phiên Bầu Cử
        </h2>
      </div>

      {phienBauCuInfo && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Thông tin phiên bầu cử
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 mr-2">ID Phiên:</span>
              <span className="font-medium">{phienBauCuInfo.id}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 mr-2">Trạng thái:</span>
              <span
                className={`font-medium ${phienBauCuInfo.dangHoatDong ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}
              >
                {phienBauCuInfo.dangHoatDong ? 'Đang hoạt động' : 'Chưa bắt đầu'}
              </span>
            </div>
            {phienBauCuInfo.dangHoatDong && (
              <>
                <div className="flex items-center">
                  <span className="text-gray-600 dark:text-gray-400 mr-2">Bắt đầu:</span>
                  <span className="font-medium">
                    {formatDateTime(phienBauCuInfo.thoiGianBatDau)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 dark:text-gray-400 mr-2">Kết thúc:</span>
                  <span className="font-medium">
                    {formatDateTime(phienBauCuInfo.thoiGianKetThuc)}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 mr-2">Số cử tri tối đa:</span>
              <span className="font-medium">{phienBauCuInfo.soCuTriToiDa}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 mr-2">Cử tri hiện tại:</span>
              <span className="font-medium">{phienBauCuInfo.soCuTriHienTai}</span>
            </div>
          </div>
        </div>
      )}

      {!phienBauCuInfo?.dangHoatDong && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="thoiGianKeoDai"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Thời gian kéo dài (ngày)
            </label>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <input
                id="thoiGianKeoDai"
                type="number"
                min="1"
                max="30"
                value={thoiGianKeoDai}
                onChange={(e) => setThoiGianKeoDai(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Thời gian tối thiểu: 1 ngày, tối đa: 30 ngày
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 flex items-start">
              <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          <button
            onClick={startPhienBauCu}
            disabled={isLoading || !sessionKey || phienBauCuInfo?.dangHoatDong}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors duration-200 flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Bắt đầu phiên bầu cử
              </>
            )}
          </button>
        </div>
      )}

      {phienBauCuInfo?.dangHoatDong && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-1 mr-2" />
            <div>
              <p className="text-green-700 dark:text-green-300 font-medium">
                Phiên bầu cử đã được bắt đầu
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">Bắt đầu: </span>
                  <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">
                    {formatDateTime(phienBauCuInfo.thoiGianBatDau)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">Kết thúc: </span>
                  <span className="ml-1 font-medium text-gray-800 dark:text-gray-200">
                    {formatDateTime(phienBauCuInfo.thoiGianKetThuc)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatDauPhienBauCu;
