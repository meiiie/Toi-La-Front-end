import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Contract,
  Interface,
  JsonRpcProvider,
  Wallet,
  AbiCoder,
  keccak256,
  getBytes,
  parseEther,
  parseUnits,
  formatEther,
  recoverAddress,
  SigningKey,
  TransactionReceipt,
} from 'ethers';
import apiClient from '../api/apiClient';

interface UserOperationHandlerProps {
  electionId: string;
  scwAddress: string;
  taiKhoanId: string;
  viId: string;
  onSuccess: (txHash: string) => void;
  onError: (error: Error) => void;
  onStatusChange: (status: string) => void;
  rpcUrl?: string;
}

const UserOperationHandler: React.FC<UserOperationHandlerProps> = ({
  electionId,
  scwAddress,
  taiKhoanId,
  viId,
  onSuccess,
  onError,
  onStatusChange,
  rpcUrl = 'https://geth.holihu.online/rpc',
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('idle');
  const [sessionKeyAttempts, setSessionKeyAttempts] = useState<number>(0);
  const [syncAttempts, setSyncAttempts] = useState<number>(0);
  const [verificationAttempts, setVerificationAttempts] = useState<number>(0);
  const [contractAddresses, setContractAddresses] = useState<any>(null);
  const [provider, setProvider] = useState<JsonRpcProvider | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [sessionKeyAddress, setSessionKeyAddress] = useState<string | null>(null);

  // Sử dụng useRef để lưu session key trong memory mà không trigger re-render
  const sessionKeyRef = useRef<string | null>(null);

  // Timeout ref để quản lý xóa session key
  const sessionKeyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lưu trữ transaction hash đã xác minh
  const verifiedTxHashRef = useRef<string | null>(null);

  // Hàm cập nhật trạng thái
  const updateStatus = useCallback(
    (newStatus: string) => {
      setStatus(newStatus);
      onStatusChange(newStatus);
    },
    [onStatusChange],
  );

  // Khởi tạo provider khi component mount
  useEffect(() => {
    try {
      const newProvider = new JsonRpcProvider(rpcUrl);
      setProvider(newProvider);
      console.log('Khởi tạo ethers provider thành công');
    } catch (error) {
      console.error('Lỗi khi khởi tạo ethers provider:', error);
    }

    // Khởi tạo bảo vệ session key
    initializeSessionKeyProtection();

    return () => {
      // Cleanup khi component unmount
      if (sessionKeyTimeoutRef.current) {
        clearTimeout(sessionKeyTimeoutRef.current);
      }
    };
  }, [rpcUrl]);

  // Hàm bảo vệ session key
  const initializeSessionKeyProtection = () => {
    const resetSessionKeyTimeout = () => {
      if (sessionKeyTimeoutRef.current) {
        clearTimeout(sessionKeyTimeoutRef.current);
      }

      // Xóa session key sau 30 phút không hoạt động
      sessionKeyTimeoutRef.current = setTimeout(
        () => {
          // Xóa tất cả session key trong storage
          Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith('sessionKey_')) {
              sessionStorage.removeItem(key);
            }
          });
          sessionKeyRef.current = null;
          console.log('Đã xóa session key do không hoạt động');
        },
        30 * 60 * 1000,
      ); // 30 phút
    };

    // Reset timer khi có hoạt động
    window.addEventListener('mousemove', resetSessionKeyTimeout);
    window.addEventListener('keydown', resetSessionKeyTimeout);
    window.addEventListener('click', resetSessionKeyTimeout);

    // Khởi tạo timer
    resetSessionKeyTimeout();

    // Xóa session key khi đóng tab/cửa sổ
    window.addEventListener('beforeunload', () => {
      // Chỉ xóa session key nếu người dùng chọn "Lưu phiên đăng nhập: Không"
      const shouldPersist = localStorage.getItem('persistSession') === 'true';
      if (!shouldPersist) {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('sessionKey_')) {
            sessionStorage.removeItem(key);
          }
        });
        sessionKeyRef.current = null;
      }
    });
  };

  // Lấy địa chỉ contract khi component mount
  useEffect(() => {
    const fetchContractAddresses = async () => {
      try {
        const response = await apiClient.get('/api/Blockchain/contract-addresses');
        if (response.data && response.data.success) {
          setContractAddresses({
            entryPointAddress: response.data.entryPointAddress,
            factoryAddress: response.data.factoryAddress,
            hluTokenAddress: response.data.hluTokenAddress,
            paymasterAddress: response.data.paymasterAddress,
            chainId: 210, // HoLiHu Private Network
          });
          console.log('Lấy địa chỉ contract thành công:', response.data);
        } else {
          console.error('Không thể lấy địa chỉ contract:', response.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy địa chỉ contract:', error);
      }
    };

    fetchContractAddresses();
  }, []);

  // Lấy session key từ API hoặc cache
  const getSessionKey = useCallback(async (): Promise<string> => {
    try {
      // Nếu đã có trong memory, sử dụng luôn
      if (sessionKeyRef.current) {
        console.log('Sử dụng session key từ memory');
        return sessionKeyRef.current;
      }

      // Kiểm tra cache trong sessionStorage
      const cacheKey = `sessionKey_${taiKhoanId}_${viId}`;
      const cachedSession = sessionStorage.getItem(cacheKey);

      if (cachedSession) {
        try {
          const sessionData = JSON.parse(cachedSession);
          const now = Math.floor(Date.now() / 1000);

          // Nếu session key vẫn còn hạn (còn ít nhất 10 phút)
          if (
            sessionData.expiresAt &&
            sessionData.expiresAt > now + 600 &&
            sessionData.sessionKey
          ) {
            console.log('Sử dụng session key từ cache');
            sessionKeyRef.current = sessionData.sessionKey;

            // Tạo wallet để lấy địa chỉ
            const wallet = new Wallet(sessionData.sessionKey);
            setSessionKeyAddress(wallet.address);

            return sessionData.sessionKey;
          } else {
            console.log('Session key trong cache đã hết hạn hoặc sắp hết hạn');
            sessionStorage.removeItem(cacheKey);
          }
        } catch (error) {
          console.warn('Lỗi khi parse session key từ cache:', error);
          sessionStorage.removeItem(cacheKey);
        }
      }

      setSessionKeyAttempts((prev) => prev + 1);
      updateStatus('getting_session_key');

      // Gọi API lấy session key
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: parseInt(taiKhoanId, 10),
        ViID: parseInt(viId, 10),
      });
      console.log('Lấy session key từ API:', response.data);

      if (!response.data.success || !response.data.sessionKey) {
        throw new Error(
          'Không thể lấy session key: ' + (response.data.Message || 'Lỗi không xác định'),
        );
      }

      const key = response.data.sessionKey;
      console.log('Session key lấy từ API:', key);

      const expiresAt = response.data.expiresAt || Math.floor(Date.now() / 1000) + 24 * 60 * 60; // Mặc định 24h

      // Lưu vào cache và memory
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          sessionKey: key,
          expiresAt: expiresAt,
          scwAddress: response.data.scwAddress || scwAddress,
        }),
      );

      sessionKeyRef.current = key;

      // Tạo wallet để lấy địa chỉ
      const wallet = new Wallet(key);
      setSessionKeyAddress(wallet.address);
      console.log('Session key address:', wallet.address);

      return key;
    } catch (error: any) {
      console.error('Lỗi khi lấy session key:', error);
      throw new Error(`Không thể lấy session key: ${error.message}`);
    }
  }, [taiKhoanId, viId, scwAddress, updateStatus]);

  // Cải tiến: Phương thức getUserOperationHash chi tiết hơn với logging
  const getUserOperationHash = useCallback(
    async (userOp: any, entryPointAddress: string, chainId: number): Promise<string> => {
      console.log('=== Bắt đầu tính UserOpHash ===');
      console.log('EntryPoint:', entryPointAddress);
      console.log('ChainId:', chainId);

      // Loại bỏ signature trong khi tính hash
      const userOpForHash = { ...userOp };
      delete userOpForHash.signature;

      // Log chi tiết các trường để debug
      console.log('UserOperation fields:');
      console.log('- sender:', userOp.sender);
      console.log('- nonce:', userOp.nonce.toString());
      console.log('- initCode:', userOp.initCode || '0x');
      console.log('- callData:', userOp.callData.substring(0, 50) + '...');
      console.log('- callGasLimit:', userOp.callGasLimit.toString());
      console.log('- verificationGasLimit:', userOp.verificationGasLimit.toString());
      console.log('- preVerificationGas:', userOp.preVerificationGas.toString());
      console.log('- maxFeePerGas:', userOp.maxFeePerGas.toString());
      console.log('- maxPriorityFeePerGas:', userOp.maxPriorityFeePerGas.toString());
      console.log('- paymasterAndData:', userOp.paymasterAndData || '0x');

      // Tính toán keccak256 của các trường
      const abiCoder = AbiCoder.defaultAbiCoder();

      // Đảm bảo xử lý strings rỗng đúng cách
      const initCodeHash = keccak256(
        userOp.initCode && userOp.initCode !== '0x' ? userOp.initCode : '0x',
      );
      const callDataHash = keccak256(userOp.callData);
      const paymasterAndDataHash = keccak256(
        userOp.paymasterAndData && userOp.paymasterAndData !== '0x'
          ? userOp.paymasterAndData
          : '0x',
      );

      // Log các hash trung gian
      console.log('Hash trung gian:');
      console.log('- initCodeHash:', initCodeHash);
      console.log('- callDataHash:', callDataHash);
      console.log('- paymasterAndDataHash:', paymasterAndDataHash);

      // Encode theo chuẩn ABI
      const packedUserOp = abiCoder.encode(
        [
          'address', // sender
          'uint256', // nonce
          'bytes32', // initCode hash
          'bytes32', // callData hash
          'uint256', // callGasLimit
          'uint256', // verificationGasLimit
          'uint256', // preVerificationGas
          'uint256', // maxFeePerGas
          'uint256', // maxPriorityFeePerGas
          'bytes32', // paymasterAndData hash
        ],
        [
          userOp.sender,
          userOp.nonce,
          initCodeHash,
          callDataHash,
          userOp.callGasLimit,
          userOp.verificationGasLimit,
          userOp.preVerificationGas,
          userOp.maxFeePerGas,
          userOp.maxPriorityFeePerGas,
          paymasterAndDataHash,
        ],
      );

      // Tính hash giai đoạn 1
      const userOpHash = keccak256(packedUserOp);
      console.log('UserOpHash giai đoạn 1:', userOpHash);

      // Encode với entryPoint và chainId
      const encodedData = abiCoder.encode(
        ['bytes32', 'address', 'uint256'],
        [userOpHash, entryPointAddress, chainId],
      );

      // Tính hash cuối cùng
      const finalHash = keccak256(encodedData);
      console.log('UserOpHash cuối cùng:', finalHash);
      console.log('Kiểm tra độ dài hash:', finalHash.length);

      // Đảm bảo hash đúng chuẩn
      if (finalHash.length !== 66) {
        console.warn('⚠️ CẢNH BÁO: Hash không đủ 66 ký tự!');
      }

      console.log('=== Kết thúc tính UserOpHash ===');
      return finalHash;
    },
    [],
  );

  // Phương thức ký UserOperation, sử dụng signDigest thay vì signMessage
  const signUserOp = useCallback(
    async (userOp: any, userOpHash: string, sessionKey: string): Promise<string> => {
      try {
        console.log('=== Bắt đầu ký UserOperation ===');
        const wallet = new Wallet(sessionKey);
        console.log('Session key address:', wallet.address);

        // Convert hash string thành bytes
        const messageHashBytes = getBytes(userOpHash);
        console.log('UserOpHash để ký:', userOpHash);
        console.log('Hash dạng bytes length:', messageHashBytes.length);

        // Ký hash trực tiếp không qua tiền tố "Ethereum Signed Message"
        console.log('Ký digest với session key...');

        // Sử dụng SigningKey và signDigest để ký trực tiếp hash
        const signingKey = new SigningKey(sessionKey);
        const signature = signingKey.sign(messageHashBytes).serialized;
        console.log('Chữ ký đã tạo:', signature);

        // Xác minh chữ ký
        const recoveredAddress = recoverAddress(messageHashBytes, signature);
        console.log('Địa chỉ phục hồi từ chữ ký:', recoveredAddress);
        console.log(
          'Khớp với session key?',
          recoveredAddress.toLowerCase() === wallet.address.toLowerCase(),
        );

        if (recoveredAddress.toLowerCase() !== wallet.address.toLowerCase()) {
          console.error('LỖI NGHIÊM TRỌNG: Chữ ký không khớp với session key!');
          throw new Error('Chữ ký không khớp với session key! Vui lòng thử lại.');
        }

        console.log('=== Kết thúc ký UserOperation ===');
        return signature;
      } catch (error) {
        console.error('Lỗi khi ký UserOperation:', error);
        throw error;
      }
    },
    [],
  );

  // Cải tiến: Kiểm tra giao dịch trực tiếp trên blockchain
  const verifyTransactionOnChain = useCallback(
    async (
      txHash: string,
      maxAttempts = 10,
    ): Promise<{
      success: boolean;
      receipt?: TransactionReceipt;
      blocksConfirmed?: number;
    }> => {
      if (!provider) {
        console.warn('Provider không khả dụng, không thể xác minh giao dịch');
        return { success: false };
      }

      try {
        setVerificationAttempts((prev) => prev + 1);
        console.log(
          `Đang xác minh giao dịch ${txHash} trên blockchain... (lần ${verificationAttempts + 1}/${maxAttempts})`,
        );

        // Kiểm tra trực tiếp qua RPC
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            // Bước 1: Lấy receipt
            const receipt = await provider.getTransactionReceipt(txHash);

            if (receipt) {
              // Lấy số block xác nhận
              const currentBlock = await provider.getBlockNumber();
              const blocksConfirmed = receipt.blockNumber ? currentBlock - receipt.blockNumber : 0;

              console.log(
                `Đã tìm thấy giao dịch! Block: ${receipt.blockNumber}, Số block xác nhận: ${blocksConfirmed}`,
              );
              console.log(
                `Trạng thái giao dịch: ${receipt.status === 1 ? 'Thành công ✅' : 'Thất bại ❌'}`,
              );

              // Kiểm tra trạng thái giao dịch
              const success = receipt.status === 1;

              if (success) {
                console.log('Giao dịch ĐÃ THÀNH CÔNG và đã được xác nhận trên blockchain!');
                verifiedTxHashRef.current = txHash; // Lưu lại hash đã xác minh
                return { success: true, receipt, blocksConfirmed };
              } else {
                console.warn('Giao dịch đã được đưa vào blockchain nhưng BỊ REVERT!');
                return { success: false, receipt, blocksConfirmed };
              }
            }

            console.log(
              `Chưa tìm thấy giao dịch, đợi thêm... (lần thử ${attempt + 1}/${maxAttempts})`,
            );

            // Chờ thời gian tăng dần
            const waitTime = Math.min(15000, 5000 + attempt * 2000); // 5s, 7s, 9s,...
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          } catch (error) {
            console.warn(`Lỗi khi kiểm tra receipt lần ${attempt + 1}:`, error);
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }

        // Nếu đã hết số lần thử, thực hiện kiểm tra bổ sung
        try {
          // Bước 2: Kiểm tra trong mempool
          console.log('Kiểm tra giao dịch trong mempool...');
          const pendingTx = await provider.getTransaction(txHash);

          if (pendingTx) {
            console.log('Giao dịch được tìm thấy trong mempool, đang chờ xác nhận...');
            return { success: false, blocksConfirmed: 0 };
          }
        } catch (error) {
          console.warn('Lỗi khi kiểm tra mempool:', error);
        }

        // Bước 3: Truy vấn các giao dịch gần đây
        try {
          console.log('Kiểm tra các block gần đây...');
          const latestBlock = await provider.getBlockNumber();

          // Quét 5 block gần nhất
          for (let i = 0; i < 5; i++) {
            if (latestBlock - i <= 0) break;

            const block = await provider.getBlock(latestBlock - i, true);
            if (block && block.transactions) {
              const foundTx = block.transactions.find(
                (tx) =>
                  typeof tx !== 'string' &&
                  (tx as { hash: string }).hash.toLowerCase() === txHash.toLowerCase(),
              );

              if (foundTx) {
                console.log(`Tìm thấy giao dịch trong block ${block.number}!`);
                // Lấy receipt một lần nữa
                const receipt = await provider.getTransactionReceipt(txHash);
                if (receipt) {
                  const success = receipt.status === 1;
                  return {
                    success,
                    receipt,
                    blocksConfirmed: latestBlock - receipt.blockNumber,
                  };
                }
              }
            }
          }
        } catch (error) {
          console.warn('Lỗi khi quét các block gần đây:', error);
        }

        console.warn(
          `Không tìm thấy giao dịch ${txHash} trên blockchain sau ${maxAttempts} lần thử`,
        );
        return { success: false };
      } catch (error) {
        console.error('Lỗi khi xác minh giao dịch trên blockchain:', error);
        return { success: false };
      }
    },
    [provider, verificationAttempts],
  );

  // Cải tiến: Kiểm tra trạng thái UserOperation với xác minh kép
  const checkUserOpStatus = useCallback(
    async (
      userOpHash: string,
      maxAttempts = 10,
    ): Promise<{
      success: boolean;
      txHash?: string;
      verified: boolean;
      blockNumber?: number;
    }> => {
      let bundlerSuccess = false;
      let txHash = userOpHash;
      let verifiedOnChain = false;
      let blockNumber: number | undefined;

      // Kiểm tra trạng thái từ bundler API
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          console.log(
            `Kiểm tra trạng thái UserOp lần ${attempt + 1}/${maxAttempts}: ${userOpHash}`,
          );
          const response = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${userOpHash}`,
          );

          if (response.data && response.data.status === 'success') {
            console.log('UserOperation đã được xử lý thành công:', response.data);
            bundlerSuccess = true;

            // Lấy txHash nếu có
            if (response.data.txHash || response.data.transactionHash) {
              txHash = response.data.txHash || response.data.transactionHash;
              blockNumber = response.data.blockNumber;
            }

            // Thử xác minh giao dịch trên blockchain (kiểm tra độc lập với API của bundler)
            try {
              if (provider) {
                console.log(`Xác minh giao dịch ${txHash} trên blockchain...`);
                const verification = await verifyTransactionOnChain(txHash, 2); // Thử 2 lần mỗi vòng lặp

                if (verification.success) {
                  console.log('Đã xác minh giao dịch thành công trên blockchain!');
                  verifiedOnChain = true;
                  if (verification.receipt?.blockNumber) {
                    blockNumber = verification.receipt.blockNumber;
                  }
                  break; // Thoát vòng lặp nếu đã xác minh trên blockchain
                } else {
                  console.log('Giao dịch chưa được xác nhận trên blockchain, tiếp tục đợi...');
                }
              }
            } catch (verifyError) {
              console.warn('Lỗi khi xác minh giao dịch trên blockchain:', verifyError);
            }

            // Ngay cả khi không xác minh được trên blockchain,
            // nếu API báo thành công và đã thử đủ số lần, chúng ta vẫn tiếp tục quy trình
            if (!verifiedOnChain && attempt >= maxAttempts / 2) {
              console.log(
                'Không thể xác minh trên blockchain nhưng Bundler báo thành công, tiếp tục quy trình...',
              );
              break;
            }
          } else if (response.data && response.data.status === 'failed') {
            console.error('UserOperation thất bại:', response.data);
            return { success: false, verified: false };
          }

          console.log(`Trạng thái hiện tại từ Bundler: ${response.data?.status || 'pending'}`);

          // Đợi thời gian dựa trên số lần thử
          const waitTime = Math.min(15000, 5000 + attempt * 3000); // 5s, 8s, 11s, ...
          console.log(`Đợi ${waitTime / 1000}s trước khi kiểm tra lại...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } catch (error) {
          console.warn(`Lỗi khi kiểm tra trạng thái từ Bundler:`, error);
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
      }

      // Nếu Bundler báo thành công nhưng không xác minh được trên blockchain
      if (bundlerSuccess && !verifiedOnChain) {
        console.log(
          'CẢNH BÁO: UserOperation được Bundler báo thành công nhưng không xác minh được trên blockchain!',
        );

        // Thử xác minh lần cuối với thời gian dài hơn
        try {
          if (provider) {
            console.log(`Thử xác minh lần cuối trước khi tiếp tục...`);
            const finalVerification = await verifyTransactionOnChain(txHash, 4); // Thử 4 lần
            if (finalVerification.success) {
              verifiedOnChain = true;
              if (finalVerification.receipt?.blockNumber) {
                blockNumber = finalVerification.receipt.blockNumber;
              }
              console.log('Xác minh lần cuối thành công!');
            }
          }
        } catch (error) {
          console.warn('Lỗi khi thử xác minh lần cuối:', error);
        }

        // Tiếp tục quy trình với trạng thái "có thể thành công"
      }

      return {
        success: bundlerSuccess,
        txHash: txHash,
        verified: verifiedOnChain,
        blockNumber,
      };
    },
    [provider, verifyTransactionOnChain],
  );

  // Hàm xử lý định dạng ngày tháng dd/MM/yyyy HH:mm
  const parseVietnameseDate = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null;

    try {
      // Xử lý định dạng dd/MM/yyyy HH:mm
      if (dateStr.includes('/')) {
        // Tách phần ngày và giờ
        const parts = dateStr.split(' ');
        const datePart = parts[0];
        const timePart = parts.length > 1 ? parts[1] : '00:00';

        if (!datePart) return null;

        // Parse ngày
        const [day, month, year] = datePart.split('/').map((num) => parseInt(num, 10));

        // Parse giờ
        let hour = 0,
          minute = 0;
        if (timePart && timePart.includes(':')) {
          [hour, minute] = timePart.split(':').map((num) => parseInt(num, 10));
        }

        // Kiểm tra tính hợp lệ
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          console.warn(`Invalid date parts: day=${day}, month=${month}, year=${year}`);
          return null;
        }

        // Tạo đối tượng Date (lưu ý: tháng trong JS bắt đầu từ 0)
        const date = new Date(year, month - 1, day, hour, minute);
        return date;
      }

      // Thử parse định dạng ISO nếu không phải định dạng Việt Nam
      return new Date(dateStr);
    } catch (error) {
      console.error(`Error parsing date '${dateStr}':`, error);
      return null;
    }
  }, []);

  // Tính thời gian kéo dài
  const calculateDuration = useCallback((startDate: Date | null, endDate: Date | null): number => {
    const DEFAULT_DURATION = 7 * 24 * 60 * 60; // 7 ngày (trong giây)
    const MIN_DURATION = 60 * 60; // 1 giờ (trong giây)
    const MAX_DURATION = 365 * 24 * 60 * 60; // 1 năm (trong giây)

    try {
      // Kiểm tra cả hai ngày đều hợp lệ
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Ngày bắt đầu hoặc kết thúc không hợp lệ, sử dụng thời gian mặc định');
        return DEFAULT_DURATION;
      }

      // Kiểm tra thời gian hiện tại
      const now = new Date();
      if (startDate < now) {
        // Nếu ngày bắt đầu đã qua, điều chỉnh về thời điểm hiện tại
        console.warn('Ngày bắt đầu đã qua, điều chỉnh về thời điểm hiện tại');
        startDate = now;
      }

      // Tính khoảng cách thời gian
      const durationMs = endDate.getTime() - startDate.getTime();

      // Kiểm tra khoảng cách có hợp lệ không
      if (durationMs <= 0) {
        console.warn('Thời gian kết thúc phải sau thời gian bắt đầu, sử dụng thời gian mặc định');
        return DEFAULT_DURATION;
      }

      // Chuyển đổi sang giây và làm tròn xuống
      const durationSeconds = Math.floor(durationMs / 1000);

      // Kiểm tra giới hạn
      if (durationSeconds < MIN_DURATION) {
        console.warn(
          `Thời gian quá ngắn (${durationSeconds}s), sử dụng thời gian tối thiểu (${MIN_DURATION}s)`,
        );
        return MIN_DURATION;
      }

      if (durationSeconds > MAX_DURATION) {
        console.warn(
          `Thời gian quá dài (${durationSeconds}s), sử dụng thời gian tối đa (${MAX_DURATION}s)`,
        );
        return MAX_DURATION;
      }

      console.log(
        `Thời gian kéo dài hợp lệ: ${durationSeconds} giây (~${Math.round(durationSeconds / 86400)} ngày)`,
      );
      return durationSeconds;
    } catch (error) {
      console.error('Lỗi khi tính toán thời gian kéo dài:', error);
      return DEFAULT_DURATION;
    }
  }, []);

  // Kiểm tra số dư và allowances
  const checkBalancesAndAllowances = useCallback(async (): Promise<{
    hluBalance: string;
    allowanceForFactory: string;
    allowanceForPaymaster: string;
    needFactoryApproval: boolean;
    needPaymasterApproval: boolean;
  }> => {
    if (!provider || !contractAddresses) {
      throw new Error('Provider hoặc địa chỉ contract không được khởi tạo');
    }

    try {
      // Lấy interfaces
      const hluTokenInterface = new Interface([
        'function balanceOf(address account) view returns (uint256)',
        'function allowance(address owner, address spender) view returns (uint256)',
      ]);

      const hluToken = new Contract(contractAddresses.hluTokenAddress, hluTokenInterface, provider);

      // Lấy số dư và allowances
      const hluBalance = await hluToken.balanceOf(scwAddress);
      const allowanceForFactory = await hluToken.allowance(
        scwAddress,
        contractAddresses.factoryAddress,
      );
      const allowanceForPaymaster = await hluToken.allowance(
        scwAddress,
        contractAddresses.paymasterAddress,
      );

      const minFactoryAllowance = parseEther('4');
      const minPaymasterAllowance = parseEther('1');

      return {
        hluBalance: formatEther(hluBalance),
        allowanceForFactory: formatEther(allowanceForFactory),
        allowanceForPaymaster: formatEther(allowanceForPaymaster),
        needFactoryApproval: allowanceForFactory < minFactoryAllowance,
        needPaymasterApproval: allowanceForPaymaster < minPaymasterAllowance,
      };
    } catch (error) {
      console.error('Lỗi khi kiểm tra số dư và allowances:', error);
      throw error;
    }
  }, [provider, contractAddresses, scwAddress]);

  // Đồng bộ blockchain với cơ chế cải tiến và kiểm tra trực tiếp giao dịch
  const syncBlockchain = useCallback(
    async (id: string, txHash?: string): Promise<boolean> => {
      console.log(`Đồng bộ blockchain cho cuộc bầu cử ID: ${id}, hash: ${txHash || 'không có'}`);

      // Thử đồng bộ nhiều lần với backoff tăng dần
      const maxRetries = 10; // Tăng số lần thử
      let syncSuccess = false;
      let lastError = null;
      let lastStatus = 0;

      // Trước khi gọi API, kiểm tra xem giao dịch đã được xác minh chưa
      if (txHash && provider) {
        try {
          const receipt = await provider.getTransactionReceipt(txHash);

          if (receipt && receipt.status === 1) {
            console.log(`Giao dịch ${txHash} đã được xác nhận với block ${receipt.blockNumber}!`);

            // Cập nhật thông tin block vào backend
            try {
              await apiClient.post(`/api/CuocBauCu/recordTransaction/${id}`, {
                TxHash: txHash,
                ScwAddress: scwAddress,
                BlockNumber: receipt.blockNumber,
                Status: 'success',
              });
              console.log('Cập nhật thông tin block cho transaction thành công!');
            } catch (updateError) {
              console.warn('Lỗi khi cập nhật thông tin block:', updateError);
            }
          }
        } catch (txError) {
          console.warn('Lỗi khi kiểm tra receipt trước khi đồng bộ:', txError);
        }
      }

      for (let retryCount = 0; retryCount < maxRetries && !syncSuccess; retryCount++) {
        try {
          setSyncAttempts((prev) => prev + 1);

          console.log(`Lần thử #${retryCount + 1}/${maxRetries}: Đồng bộ blockchain...`);
          const syncResult = await apiClient.post(`/api/CuocBauCu/syncBlockchain/${id}`);

          if (syncResult.data && syncResult.data.success) {
            console.log(`Đồng bộ blockchain thành công cho cuộc bầu cử ID: ${id}`);
            syncSuccess = true;
            break;
          } else {
            lastStatus = syncResult.data?.status || 0;
            console.log(
              `Lần thử #${retryCount + 1}: Đồng bộ chưa thành công, trạng thái: ${lastStatus}`,
            );

            // Nếu đã triển khai thành công (status = 2), cũng coi như thành công
            if (syncResult.data && syncResult.data.status === 2) {
              console.log(`Cuộc bầu cử ID: ${id} đã được triển khai thành công (status=2)`);
              syncSuccess = true;
              break;
            }

            // Đợi thời gian tăng dần theo hàm mũ trước khi thử lại
            if (retryCount < maxRetries - 1) {
              const waitTime = Math.min(30000, 3000 * Math.pow(1.5, retryCount)); // 3s, 4.5s, 6.75s, 10.1s...
              console.log(`Chờ ${Math.round(waitTime / 1000)}s trước khi thử lại...`);
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
          }
        } catch (syncError: any) {
          lastError = syncError;
          console.warn(`Lần thử #${retryCount + 1}: Lỗi khi đồng bộ:`, syncError);

          // Nếu lỗi do kết nối, đợi lâu hơn
          const isConnectionError =
            syncError.message?.includes('network') ||
            syncError.message?.includes('timeout') ||
            syncError.message?.includes('connection');

          const waitTime = isConnectionError
            ? Math.min(45000, 5000 * Math.pow(1.5, retryCount)) // 5s, 7.5s, 11.25s...
            : Math.min(30000, 3000 * Math.pow(1.5, retryCount)); // 3s, 4.5s, 6.75s...

          if (retryCount < maxRetries - 1) {
            console.log(`Lỗi đồng bộ. Chờ ${Math.round(waitTime / 1000)}s trước khi thử lại...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      if (!syncSuccess) {
        console.warn(
          `Không thể đồng bộ sau ${maxRetries} lần thử. Lỗi cuối: ${lastError?.message || 'Unknown error'}, Trạng thái: ${lastStatus}`,
        );

        // Kiểm tra lại trạng thái hiện tại trên UI
        try {
          const statusCheck = await apiClient.get(`/api/CuocBauCu/blockchain/${id}`);
          if (statusCheck.data && statusCheck.data.status === 2) {
            console.log(
              `Trạng thái blockchain đã cập nhật thành công (status=2) mặc dù đồng bộ thất bại`,
            );
            syncSuccess = true;
          } else {
            console.log(
              `Trạng thái hiện tại sau khi đồng bộ thất bại: ${statusCheck.data?.status || 'unknown'}`,
            );
          }
        } catch (statusError) {
          console.warn('Lỗi khi kiểm tra lại trạng thái:', statusError);
        }

        // Thử tiếp cận trực tiếp nếu có transaction hash
        if (!syncSuccess && txHash && provider) {
          try {
            console.log('Thử kiểm tra giao dịch trực tiếp trên blockchain...');
            const verification = await verifyTransactionOnChain(txHash, 5);

            if (verification.success) {
              console.log('Giao dịch đã được xác nhận trên blockchain!');

              // Ghi nhận trực tiếp transaction vào backend
              try {
                await apiClient.post(`/api/CuocBauCu/recordTransaction/${id}`, {
                  TxHash: txHash,
                  ScwAddress: scwAddress,
                  BlockNumber: verification.receipt?.blockNumber,
                  Status: 'success',
                });

                // Gọi lại API đồng bộ một lần nữa sau khi đã cập nhật transaction
                try {
                  const finalSyncResult = await apiClient.post(
                    `/api/CuocBauCu/syncBlockchain/${id}`,
                  );
                  if (finalSyncResult.data && finalSyncResult.data.success) {
                    console.log('Đồng bộ thành công sau khi cập nhật transaction!');
                    syncSuccess = true;
                  }
                } catch (finalSyncError) {
                  console.warn('Lỗi sau cùng khi đồng bộ:', finalSyncError);
                }
              } catch (recordError) {
                console.warn('Lỗi khi ghi nhận transaction đã xác minh:', recordError);
              }
            }
          } catch (verifyError) {
            console.warn('Lỗi khi xác minh giao dịch trực tiếp:', verifyError);
          }
        }

        // Tạo hàng đợi đồng bộ lại sau khoảng thời gian dài hơn
        if (!syncSuccess) {
          console.log(`Sẽ thử đồng bộ lại sau 60 giây...`);
          setTimeout(async () => {
            try {
              console.log(`Thử đồng bộ lại cuộc bầu cử ID: ${id} lần cuối...`);
              const finalSyncResult = await apiClient.post(`/api/CuocBauCu/syncBlockchain/${id}`);
              if (finalSyncResult.data && finalSyncResult.data.success) {
                console.log(
                  `Đồng bộ blockchain thành công cho cuộc bầu cử ID: ${id} sau khi thử lại`,
                );
              }
            } catch (finalError) {
              console.error(`Không thể đồng bộ sau khi thử lại: ${finalError}`);
            }
          }, 60000);
        }
      }

      return syncSuccess;
    },
    [provider, scwAddress, verifyTransactionOnChain],
  );

  // Phê duyệt token với client-side signing
  const approveToken = useCallback(
    async (target: 'factory' | 'paymaster', amount: string): Promise<boolean> => {
      if (!provider || !contractAddresses) {
        throw new Error('Provider hoặc địa chỉ contract không được khởi tạo');
      }

      try {
        updateStatus(`approving_${target}`);

        // Lấy session key
        const sessionKey = await getSessionKey();
        if (!sessionKey) {
          throw new Error('Không thể lấy session key');
        }

        // Xác định địa chỉ target
        const targetAddress =
          target === 'factory'
            ? contractAddresses.factoryAddress
            : contractAddresses.paymasterAddress;

        // Lấy nonce từ EntryPoint
        const entryPointInterface = new Interface([
          'function getNonce(address sender) external view returns (uint256)',
        ]);

        const entryPointContract = new Contract(
          contractAddresses.entryPointAddress,
          entryPointInterface,
          provider,
        );

        const nonce = await entryPointContract.getNonce(scwAddress);

        // Tạo token approve callData
        const tokenInterface = new Interface([
          'function approve(address spender, uint256 amount) external returns (bool)',
        ]);

        const scwInterface = new Interface([
          'function execute(address dest, uint256 value, bytes calldata func) external',
        ]);

        const innerCallData = tokenInterface.encodeFunctionData('approve', [
          targetAddress,
          parseEther(amount),
        ]);

        const callData = scwInterface.encodeFunctionData('execute', [
          contractAddresses.hluTokenAddress,
          0, // Không gửi ETH
          innerCallData,
        ]);

        // Tạo UserOperation
        const userOp = {
          sender: scwAddress,
          nonce: nonce.toString(),
          initCode: '0x',
          callData: callData,
          callGasLimit: '200000',
          verificationGasLimit: '150000',
          preVerificationGas: '50000',
          maxFeePerGas: parseUnits('5', 'gwei').toString(),
          maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
          paymasterAndData: target === 'factory' ? '0x' : contractAddresses.paymasterAddress, // Không dùng paymaster cho approve factory
          signature: '0x', // Sẽ được cập nhật sau khi ký
        };

        // Tính UserOperation hash
        const userOpHash = await getUserOperationHash(
          userOp,
          contractAddresses.entryPointAddress,
          contractAddresses.chainId || 210,
        );

        // Ký UserOperation
        userOp.signature = await signUserOp(userOp, userOpHash, sessionKey);

        // Gửi UserOperation đến bundler với cơ chế thử lại
        let response = null;
        let responseUserOpHash = null;
        const maxRetries = 3;
        let retryCount = 0;
        let lastError = null;

        while (retryCount < maxRetries && !response) {
          try {
            response = await apiClient.post('/api/bundler/submit', userOp);
            if (!response.data || response.data.Message?.includes('error')) {
              throw new Error(`Lỗi từ bundler: ${response.data?.Message || 'Lỗi không xác định'}`);
            }
            responseUserOpHash = response.data.userOpHash || response.data.UserOpHash;
          } catch (error: any) {
            lastError = error;
            retryCount++;
            console.warn(`Lỗi khi gửi UserOp lần ${retryCount}/${maxRetries}:`, error);

            if (retryCount < maxRetries) {
              // Chờ trước khi thử lại
              await new Promise(
                (
                  (retry) => (resolve) =>
                    setTimeout(resolve, 2000 * retry)
                )(retryCount),
              );

              // Lấy nonce mới nếu lỗi liên quan đến nonce
              if (error.message?.includes('nonce') || error.message?.includes('Nonce')) {
                const newNonce = await entryPointContract.getNonce(scwAddress);
                userOp.nonce = newNonce.toString();
                console.log(`Cập nhật nonce mới: ${newNonce.toString()}`);

                // Tính lại hash và ký lại
                const newUserOpHash = await getUserOperationHash(
                  userOp,
                  contractAddresses.entryPointAddress,
                  contractAddresses.chainId || 210,
                );
                userOp.signature = await signUserOp(userOp, newUserOpHash, sessionKey);
              }
            }
          }
        }

        if (!response) {
          throw new Error(
            `Không thể gửi UserOperation sau ${maxRetries} lần thử: ${lastError?.message}`,
          );
        }

        console.log(`Phê duyệt token cho ${target} đã gửi:`, response.data);

        // Đợi bundler xử lý (30 giây)
        console.log('Đợi bundler xử lý UserOperation phê duyệt token...');
        await new Promise((resolve) => setTimeout(resolve, 30000));

        // Kiểm tra trạng thái nếu có userOpHash
        if (responseUserOpHash) {
          console.log(`Kiểm tra trạng thái UserOp: ${responseUserOpHash}`);
          const statusResult = await checkUserOpStatus(responseUserOpHash, 3);
          if (statusResult.success) {
            console.log(`Phê duyệt token cho ${target} thành công!`);

            // Thêm hàm chờ để giao dịch được mine và cập nhật
            await new Promise((resolve) => setTimeout(resolve, 5000));
          } else {
            console.warn(
              `Không thể xác nhận trạng thái phê duyệt token cho ${target}, tiếp tục...`,
            );
          }
        }

        // Kiểm tra allowance
        const newBalances = await checkBalancesAndAllowances();
        console.log(
          `Allowance mới cho ${target}:`,
          target === 'factory'
            ? newBalances.allowanceForFactory
            : newBalances.allowanceForPaymaster,
        );

        return true;
      } catch (error) {
        console.error(`Lỗi khi phê duyệt token cho ${target}:`, error);
        throw error;
      }
    },
    [
      provider,
      contractAddresses,
      scwAddress,
      getUserOperationHash,
      signUserOp,
      checkBalancesAndAllowances,
      updateStatus,
      getSessionKey,
      checkUserOpStatus,
    ],
  );

  // Hàm triển khai cuộc bầu cử chính
  const deployElection = useCallback(async () => {
    if (isCompleted) {
      console.log('Quá trình triển khai đã hoàn thành, không thực hiện lại');
      return;
    }

    if (!provider || !contractAddresses) {
      onError(new Error('Provider hoặc địa chỉ contract chưa được khởi tạo'));
      return;
    }

    try {
      setLoading(true);
      updateStatus('preparing');

      // 1. Lấy thông tin cuộc bầu cử
      updateStatus('fetching_election_details');
      const electionResponse = await apiClient.get(`/api/CuocBauCu/details/${electionId}`);
      if (!electionResponse.data) {
        throw new Error('Không thể lấy thông tin cuộc bầu cử');
      }

      const electionData = electionResponse.data;
      console.log('Election data:', electionData);

      // Parse ngày bắt đầu và kết thúc
      const startDate = parseVietnameseDate(electionData.ngayBatDau);
      const endDate = parseVietnameseDate(electionData.ngayKetThuc);
      console.log('Start date (parsed):', startDate);
      console.log('End date (parsed):', endDate);

      // Tính thời gian kéo dài theo giây
      const thoiGianKeoDai = calculateDuration(startDate, endDate);
      console.log('Final duration to use (seconds):', thoiGianKeoDai);

      // 2. Kiểm tra số dư và allowances
      updateStatus('checking_balances');
      const balances = await checkBalancesAndAllowances();
      console.log('Số dư và allowances:', balances);

      // Kiểm tra số dư HLU đủ
      if (parseFloat(balances.hluBalance) < 5.0) {
        throw new Error(
          `Số dư HLU không đủ để triển khai. Cần ít nhất 5 HLU, hiện có ${balances.hluBalance} HLU`,
        );
      }

      // 3. Lấy session key
      updateStatus('getting_session_key');
      const sessionKey = await getSessionKey();
      if (!sessionKey) {
        throw new Error('Không thể lấy session key');
      }
      console.log('Session key available:', !!sessionKey);

      // 4. Phê duyệt token nếu cần
      updateStatus('approving_if_needed');

      if (balances.needFactoryApproval) {
        console.log('Phê duyệt token cho Factory...');
        try {
          await approveToken('factory', '8'); // Approve 8 HLU
          console.log('Đã phê duyệt Factory thành công');
        } catch (approveError: any) {
          console.error('Lỗi khi phê duyệt token cho Factory:', approveError);
          throw new Error(`Không thể phê duyệt token cho Factory: ${approveError.message}`);
        }
      }

      if (balances.needPaymasterApproval) {
        console.log('Phê duyệt token cho Paymaster...');
        try {
          await approveToken('paymaster', '10'); // Approve 10 HLU
          console.log('Đã phê duyệt Paymaster thành công');
        } catch (approveError: any) {
          console.error('Lỗi khi phê duyệt token cho Paymaster:', approveError);
          throw new Error(`Không thể phê duyệt token cho Paymaster: ${approveError.message}`);
        }
      }

      // 5. Tạo UserOperation cho cuộc bầu cử
      updateStatus('deploying');
      console.log('Triển khai cuộc bầu cử...');

      // Lấy nonce từ EntryPoint
      const entryPointInterface = new Interface([
        'function getNonce(address sender) external view returns (uint256)',
      ]);

      const entryPointContract = new Contract(
        contractAddresses.entryPointAddress,
        entryPointInterface,
        provider,
      );

      const nonce = await entryPointContract.getNonce(scwAddress);
      console.log('Nonce hiện tại:', nonce.toString());

      // Tạo callData
      const factoryInterface = new Interface([
        'function trienKhaiServer(string tenCuocBauCu, uint256 thoiGianKeoDai, string moTa) external',
      ]);

      const scwInterface = new Interface([
        'function execute(address dest, uint256 value, bytes calldata func) external',
      ]);

      const innerCallData = factoryInterface.encodeFunctionData('trienKhaiServer', [
        electionData.tenCuocBauCu,
        thoiGianKeoDai,
        electionData.moTa || 'Không có mô tả',
      ]);
      console.log('Inner callData:', innerCallData);

      const callData = scwInterface.encodeFunctionData('execute', [
        contractAddresses.factoryAddress,
        0, // Không gửi ETH
        innerCallData,
      ]);
      console.log('Final callData:', callData.substring(0, 50) + '...');

      // Ước tính gas
      let callGasLimit;
      try {
        const gasEstimate = await provider.estimateGas({
          from: scwAddress,
          to: contractAddresses.factoryAddress,
          data: innerCallData,
        });

        // Thêm 50% buffer - Trong ethers v6, không cần dùng mul và div, có thể dùng các toán tử số học thông thường
        callGasLimit = ((gasEstimate * BigInt(150)) / BigInt(100)).toString();
        console.log(`Gas ước tính: ${gasEstimate.toString()}, với buffer: ${callGasLimit}`);
      } catch (gasError) {
        console.warn('Không thể ước tính gas, sử dụng giá trị mặc định:', gasError);
        callGasLimit = '2000000'; // Giá trị mặc định nếu không ước tính được
      }

      // Tạo UserOperation
      const userOp = {
        sender: scwAddress,
        nonce: nonce.toString(),
        initCode: '0x',
        callData: callData,
        callGasLimit: callGasLimit,
        verificationGasLimit: '600000',
        preVerificationGas: '210000',
        maxFeePerGas: parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
        paymasterAndData: contractAddresses.paymasterAddress, // Sử dụng paymaster
        signature: '0x', // Sẽ được cập nhật sau khi ký
      };

      console.log('Prepared UserOperation:', {
        sender: userOp.sender,
        nonce: userOp.nonce,
        callGasLimit: userOp.callGasLimit,
        verificationGasLimit: userOp.verificationGasLimit,
        preVerificationGas: userOp.preVerificationGas,
        maxFeePerGas: userOp.maxFeePerGas,
        maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
        paymasterAndData: userOp.paymasterAndData,
      });

      // Tính UserOperation hash
      console.log('Tính UserOperation hash...');
      const userOpHash = await getUserOperationHash(
        userOp,
        contractAddresses.entryPointAddress,
        contractAddresses.chainId || 210, // Mặc định 210 nếu không có
      );
      console.log('UserOpHash:', userOpHash);

      // Ký UserOperation
      console.log('Ký UserOperation bằng session key...');
      userOp.signature = await signUserOp(userOp, userOpHash, sessionKey);
      console.log('Đã ký. Signature:', userOp.signature.substring(0, 30) + '...');

      // *** CẢI TIẾN: Thêm userOpHash vào UserOperation (Phương án dự phòng) ***
      // @ts-ignore
      userOp.userOpHash = userOpHash;

      // Gửi UserOperation đến bundler với cơ chế thử lại
      console.log('Gửi UserOperation đến bundler...');
      let response = null;
      const maxRetries = 3;
      let retryCount = 0;
      let lastError = null;
      let txHash = '';
      let responseUserOpHash = '';

      while (retryCount < maxRetries && !response) {
        try {
          console.log(`Attempt #${retryCount + 1}: Gửi UserOperation...`);
          response = await apiClient.post('/api/bundler/submit', userOp, {
            timeout: 30000, // Timeout 30s
          });

          console.log('Response từ bundler:', response.data);
          if (!response.data || response.data.Message?.includes('error')) {
            throw new Error(`Lỗi từ bundler: ${response.data?.Message || 'Lỗi không xác định'}`);
          }

          // Lấy UserOpHash từ kết quả
          responseUserOpHash = response.data.userOpHash || response.data.UserOpHash || userOpHash;
          txHash = response.data.transactionHash || response.data.TxHash || responseUserOpHash;
        } catch (error: any) {
          lastError = error;
          retryCount++;
          console.warn(`Lỗi khi gửi UserOp lần ${retryCount}/${maxRetries}:`, error);
          console.error('Chi tiết lỗi:', error.response?.data || error.message);

          if (retryCount < maxRetries) {
            // Chờ trước khi thử lại
            const waitTime = 2000 * retryCount;
            console.log(`Chờ ${waitTime}ms trước khi thử lại...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));

            // Lấy nonce mới nếu lỗi liên quan đến nonce
            if (
              error.message?.includes('nonce') ||
              error.message?.includes('Nonce') ||
              error.response?.data?.Message?.includes('nonce') ||
              error.response?.data?.Message?.includes('Nonce')
            ) {
              console.log('Lỗi liên quan đến nonce, cập nhật nonce mới...');
              const newNonce = await entryPointContract.getNonce(scwAddress);
              userOp.nonce = newNonce.toString();
              console.log(`Đã cập nhật nonce mới: ${newNonce.toString()}`);

              // Tính lại hash và ký lại
              const newUserOpHash = await getUserOperationHash(
                userOp,
                contractAddresses.entryPointAddress,
                contractAddresses.chainId || 210,
              );
              console.log('New UserOpHash:', newUserOpHash);

              userOp.signature = await signUserOp(userOp, newUserOpHash, sessionKey);
              console.log('Đã ký lại với nonce mới');

              // Cập nhật userOpHash trong UserOperation
              // @ts-ignore
              userOp.userOpHash = newUserOpHash;
              responseUserOpHash = newUserOpHash;
            }
            // Nếu lỗi là "chữ ký không hợp lệ"
            else if (
              error.message?.includes('chữ ký') ||
              error.message?.includes('signature') ||
              error.response?.data?.Message?.includes('chữ ký') ||
              error.response?.data?.Message?.includes('signature')
            ) {
              console.log('Lỗi chữ ký, thử ký lại...');

              // Ký lại với cùng hash
              userOp.signature = await signUserOp(userOp, userOpHash, sessionKey);
              console.log('Đã ký lại với hash hiện tại');
            }
          }
        }
      }

      if (!response) {
        throw new Error(
          `Không thể gửi UserOperation sau ${maxRetries} lần thử: ${lastError?.message}`,
        );
      }

      if (!txHash && responseUserOpHash) {
        // Nếu không có txHash nhưng có userOpHash, sử dụng userOpHash thay thế
        txHash = responseUserOpHash;
        console.log('Sử dụng UserOpHash làm transaction hash tạm thời:', txHash);
      }

      if (!txHash) {
        console.warn(
          'Không tìm thấy transaction hash trong kết quả, nhưng giao dịch đã gửi thành công',
        );
        txHash = responseUserOpHash || 'pending'; // Sử dụng userOpHash hoặc "pending" nếu không có
      } else {
        console.log('Transaction hash:', txHash);
      }

      // Ghi nhận transaction vào backend (thêm nhiều thông tin hơn)
      try {
        const recordResponse = await apiClient.post(
          `/api/CuocBauCu/recordTransaction/${electionId}`,
          {
            TxHash: txHash, // Sử dụng txHash hoặc userOpHash
            ScwAddress: scwAddress,
            UserOpHash: responseUserOpHash, // Thêm userOpHash
            Source: 'frontend', // Thêm nguồn gốc
          },
        );

        console.log('Đã ghi nhận transaction:', recordResponse.data);
      } catch (recordError) {
        console.warn('Lỗi khi ghi nhận transaction:', recordError);
      }

      // Cập nhật UI
      updateStatus('success');
      setIsCompleted(true);
      onSuccess(txHash || 'unknown');

      // *** CẢI TIẾN: Đợi tối thiểu 60 giây để bundler xử lý ***
      updateStatus('waiting_for_bundler');
      console.log('Đợi bundler xử lý UserOperation (60 giây)...');
      await new Promise((resolve) => setTimeout(resolve, 60000));

      // *** CẢI TIẾN: Kiểm tra trạng thái UserOperation với xác minh kép và thời gian chờ dài hơn ***
      if (responseUserOpHash) {
        console.log(`Kiểm tra trạng thái UserOperation: ${responseUserOpHash}`);
        const opStatus = await checkUserOpStatus(responseUserOpHash, 10); // Kiểm tra 10 lần, với thời gian chờ tăng dần

        if (opStatus.success) {
          if (opStatus.verified) {
            updateStatus('op_confirmed');
            console.log('UserOperation đã được xác nhận và xác minh trên blockchain!');
            verifiedTxHashRef.current = opStatus.txHash || txHash;
          } else {
            updateStatus('op_partial_confirmed');
            console.log(
              'UserOperation đã được xác nhận bởi Bundler nhưng chưa xác minh trên blockchain!',
            );
          }

          // Cập nhật txHash nếu có
          if (opStatus.txHash) {
            txHash = opStatus.txHash;
            console.log('Cập nhật transaction hash:', txHash);

            // Cập nhật transaction hash trong backend (sử dụng recordTransaction thay vì updateTransaction)
            try {
              await apiClient.post(`/api/CuocBauCu/recordTransaction/${electionId}`, {
                TxHash: txHash,
                ScwAddress: scwAddress,
                BlockNumber: opStatus.blockNumber,
                Status: opStatus.verified ? 'success' : 'pending',
              });
              console.log('Đã cập nhật transaction hash mới trong backend');
            } catch (updateError) {
              console.warn('Lỗi khi cập nhật transaction hash:', updateError);
            }
          }
        } else {
          updateStatus('op_pending');
          console.warn(
            'Không thể xác nhận trạng thái UserOperation, tiếp tục với đồng bộ blockchain',
          );
        }
      }

      // Đợi thêm 15 giây trước khi bắt đầu đồng bộ blockchain
      const additionalWaitTime = 15000;
      console.log(
        `Đợi thêm ${additionalWaitTime / 1000} giây trước khi bắt đầu đồng bộ blockchain...`,
      );
      await new Promise((resolve) => setTimeout(resolve, additionalWaitTime));

      // Đồng bộ blockchain với cơ chế cải tiến
      updateStatus('syncing');
      try {
        // Kiểm tra trạng thái blockchain với endpoint chính xác
        const blockchainStatus = await apiClient.get(`/api/CuocBauCu/blockchain/${electionId}`);
        console.log('Trạng thái blockchain hiện tại:', blockchainStatus.data);

        // Chỉ đồng bộ nếu chưa thành công
        if (blockchainStatus.data && blockchainStatus.data.status !== 2) {
          // Gửi txHash hiện tại cho hàm syncBlockchain để kiểm tra trạng thái giao dịch
          const syncResult = await syncBlockchain(electionId, txHash);

          if (syncResult) {
            updateStatus('sync_success');
            console.log('Đồng bộ blockchain thành công!');
          } else {
            // Kiểm tra lại trạng thái blockchain trước khi đặt trạng thái partial
            try {
              const recheck = await apiClient.get(`/api/CuocBauCu/blockchain/${electionId}`);
              if (recheck.data && recheck.data.status === 2) {
                updateStatus('sync_success');
                console.log('Đồng bộ blockchain đã thành công dù quy trình báo lỗi!');
              } else {
                updateStatus('sync_partial');
                console.warn('Đồng bộ blockchain chưa hoàn tất, nhưng triển khai vẫn thành công');

                // Thử thêm một lần nữa sau 45 giây
                console.log('Sẽ thử đồng bộ lại sau 45 giây...');
                setTimeout(async () => {
                  try {
                    const finalSyncResult = await syncBlockchain(electionId, txHash);
                    console.log(
                      'Kết quả đồng bộ lần cuối:',
                      finalSyncResult ? 'Thành công' : 'Thất bại',
                    );

                    // Kiểm tra lại trạng thái nếu vẫn thất bại
                    if (!finalSyncResult) {
                      try {
                        const lastCheck = await apiClient.get(
                          `/api/CuocBauCu/blockchain/${electionId}`,
                        );
                        if (lastCheck.data && lastCheck.data.status === 2) {
                          updateStatus('sync_success');
                          console.log('Đồng bộ blockchain cuối cùng đã thành công!');
                        }
                      } catch (error) {
                        console.warn('Lỗi khi kiểm tra lại trạng thái cuối cùng:', error);
                      }
                    }
                  } catch (error) {
                    console.warn('Lỗi khi thử đồng bộ lần cuối:', error);
                  }
                }, 45000);
              }
            } catch (recheckError) {
              console.warn('Lỗi khi kiểm tra lại trạng thái blockchain:', recheckError);
              updateStatus('sync_partial');
            }
          }
        } else {
          console.log('Cuộc bầu cử đã được triển khai thành công, không cần đồng bộ thêm');
          updateStatus('sync_success');
        }
      } catch (statusError) {
        console.warn('Lỗi khi kiểm tra trạng thái blockchain:', statusError);

        // Vẫn thử đồng bộ dù không kiểm tra được trạng thái
        const syncResult = await syncBlockchain(electionId, txHash);
        if (syncResult) {
          updateStatus('sync_success');
        } else {
          updateStatus('sync_partial');
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi triển khai cuộc bầu cử:', error);
      updateStatus('error');
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [
    isCompleted,
    provider,
    contractAddresses,
    electionId,
    scwAddress,
    parseVietnameseDate,
    calculateDuration,
    checkBalancesAndAllowances,
    getSessionKey,
    approveToken,
    getUserOperationHash,
    signUserOp,
    syncBlockchain,
    checkUserOpStatus,
    updateStatus,
    onSuccess,
    onError,
  ]);

  // Ghi log thông tin debugging và kiểm tra lại trạng thái khi có lỗi
  useEffect(() => {
    if (status === 'error') {
      console.log('Debug info - session key attempts:', sessionKeyAttempts);
      console.log('Debug info - sync attempts:', syncAttempts);
      console.log('Debug info - verification attempts:', verificationAttempts);

      // Kiểm tra lại trạng thái blockchain sau khi xảy ra lỗi
      const checkBlockchainStatus = async () => {
        try {
          console.log('Đang kiểm tra lại trạng thái blockchain sau lỗi...');
          const statusResponse = await apiClient.get(`/api/CuocBauCu/blockchain/${electionId}`);

          if (statusResponse.data) {
            console.log('Trạng thái blockchain hiện tại:', statusResponse.data);

            // Nếu trạng thái là 2 (thành công) mặc dù UI báo lỗi, cập nhật UI
            if (statusResponse.data.status === 2) {
              console.log('Cuộc bầu cử đã được triển khai thành công mặc dù UI báo lỗi!');
              updateStatus('sync_success');
              setIsCompleted(true);

              // Nếu có transaction hash đã xác minh, thông báo thành công
              if (verifiedTxHashRef.current) {
                onSuccess(verifiedTxHashRef.current);
              } else if (statusResponse.data.transactionHash) {
                onSuccess(statusResponse.data.transactionHash);
              }
            }
          }
        } catch (error) {
          console.warn('Lỗi khi kiểm tra lại trạng thái blockchain:', error);
        }
      };

      // Chờ 5 giây trước khi kiểm tra lại
      setTimeout(checkBlockchainStatus, 5000);
    }
  }, [
    status,
    sessionKeyAttempts,
    syncAttempts,
    verificationAttempts,
    electionId,
    updateStatus,
    onSuccess,
  ]);

  // Hiển thị nút và trạng thái
  return (
    <div className="mt-4">
      <button
        onClick={deployElection}
        disabled={loading || !provider || !contractAddresses || isCompleted}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:bg-green-800"
      >
        {loading
          ? 'Đang triển khai...'
          : provider && contractAddresses
            ? isCompleted
              ? 'Đã triển khai thành công'
              : 'Triển khai với UserOp'
            : 'Đang chuẩn bị...'}
      </button>

      {status === 'preparing' && <p className="mt-2 text-gray-400">Đang chuẩn bị dữ liệu...</p>}
      {status === 'fetching_election_details' && (
        <p className="mt-2 text-gray-400">Đang lấy thông tin cuộc bầu cử...</p>
      )}
      {status === 'checking_balances' && (
        <p className="mt-2 text-gray-400">Đang kiểm tra số dư và allowances...</p>
      )}
      {status === 'getting_session_key' && (
        <p className="mt-2 text-gray-400">
          Đang lấy session key... (Lần thử: {sessionKeyAttempts})
        </p>
      )}
      {status === 'approving_factory' && (
        <p className="mt-2 text-gray-400">Đang phê duyệt token cho Factory...</p>
      )}
      {status === 'approving_paymaster' && (
        <p className="mt-2 text-gray-400">Đang phê duyệt token cho Paymaster...</p>
      )}
      {status === 'approving_if_needed' && (
        <p className="mt-2 text-gray-400">Đang kiểm tra và phê duyệt token nếu cần...</p>
      )}
      {status === 'deploying' && (
        <p className="mt-2 text-gray-400">Đang triển khai cuộc bầu cử...</p>
      )}
      {status === 'success' && (
        <p className="mt-2 text-green-500">Đã gửi yêu cầu triển khai thành công!</p>
      )}
      {status === 'waiting_for_bundler' && (
        <p className="mt-2 text-yellow-500">Đang đợi Bundler xử lý (60 giây)...</p>
      )}
      {status === 'op_confirmed' && (
        <p className="mt-2 text-green-500">
          UserOperation đã được xác nhận và xác minh trên blockchain!
        </p>
      )}
      {status === 'op_partial_confirmed' && (
        <p className="mt-2 text-yellow-500">
          UserOperation đã được xác nhận bởi Bundler nhưng chưa xác minh trên blockchain!
        </p>
      )}
      {status === 'op_pending' && (
        <p className="mt-2 text-yellow-500">UserOperation đang chờ xử lý...</p>
      )}
      {status === 'syncing' && (
        <p className="mt-2 text-yellow-500">Đang đồng bộ blockchain... (Lần thử: {syncAttempts})</p>
      )}
      {status === 'sync_success' && (
        <p className="mt-2 text-green-500">Triển khai và đồng bộ thành công!</p>
      )}
      {status === 'sync_partial' && (
        <p className="mt-2 text-yellow-500">
          Triển khai thành công, đồng bộ một phần. Sẽ tiếp tục đồng bộ...
        </p>
      )}
      {status === 'error' && <p className="mt-2 text-red-500">Có lỗi xảy ra khi triển khai</p>}

      {sessionKeyAddress && (
        <p className="mt-2 text-gray-400">
          Session key address: <span className="font-mono">{sessionKeyAddress}</span>
        </p>
      )}
    </div>
  );
};

export default UserOperationHandler;
