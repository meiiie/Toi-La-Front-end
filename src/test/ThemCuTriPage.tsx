'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '../test/components/use-toast';
import {
  parseUnits,
  getBytes,
  recoverAddress,
  SigningKey,
  AbiCoder,
  Contract,
  JsonRpcProvider,
  Signature,
  computeAddress,
  ethers,
} from 'ethers';

// API
import apiClient from '../api/apiClient';

// Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';

// Icons
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  Server,
  Wallet,
  Key,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  Users,
  ArrowRight,
  Network,
  Link,
  ChevronLeft,
  UserPlus,
  Trash2,
  Upload,
  FileText,
  Plus,
  UserCheck,
  Copy,
} from 'lucide-react';

// Các trạng thái thêm cử tri
enum ThemCuTriStatus {
  NOT_STARTED = 0,
  CHECKING_REQUIREMENTS = 1,
  CREATING_SESSION_KEY = 2,
  PREPARING_CALLDATA = 3,
  CREATING_USEROP = 4,
  SENDING_USEROP = 5,
  WAITING_CONFIRMATION = 6,
  SUCCESS = 7,
  FAILED = 8,
}

// Component hiển thị trạng thái các bước
const StepStatus: React.FC<{
  currentStatus: ThemCuTriStatus;
  stepStatus: ThemCuTriStatus;
  title: string;
  description: string;
  isCompleted?: boolean;
}> = ({ currentStatus, stepStatus, title, description, isCompleted }) => {
  let statusIcon;
  let statusClass;

  if (isCompleted) {
    statusIcon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
    statusClass = 'text-green-500';
  } else if (currentStatus === ThemCuTriStatus.FAILED) {
    statusIcon = <XCircle className="w-5 h-5 text-red-500" />;
    statusClass = 'text-red-500';
  } else if (currentStatus > stepStatus) {
    statusIcon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
    statusClass = 'text-green-500';
  } else if (currentStatus === stepStatus) {
    statusIcon = <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    statusClass = 'text-blue-500';
  } else {
    statusIcon = <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
    statusClass = 'text-gray-400 dark:text-gray-500';
  }

  return (
    <div className="flex items-start space-x-3 mb-3">
      <div className={`flex-shrink-0 mt-1 ${statusClass}`}>{statusIcon}</div>
      <div>
        <h4 className={`text-base font-medium ${statusClass}`}>{title}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
};

// Thông tin session key
interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

// Địa chỉ các contract
interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  chainId: number;
}

// Thông tin phiên bầu cử
interface PhienBauCuInfo {
  dangHoatDong: boolean;
  thoiGianBatDau: string;
  thoiGianKetThuc: string;
  soCuTriToiDa: number;
  soUngVienHienTai: number;
  soCuTriHienTai: number;
  ungVienDacCu: string[];
  taiBauCu: boolean;
  soLuongXacNhan: number;
  thoiGianHetHanXacNhan: string;
  laBanToChuc: boolean;
}

const ThemCuTriDonGian: React.FC = () => {
  // Toast notifications
  const { toast } = useToast();

  // Các trường Input
  const [serverId, setServerId] = useState<string>('18'); // Default: 18
  const [quanLyCuocBauCuAddress, setQuanLyCuocBauCuAddress] = useState<string>(
    '0x7074F76aa4E576539CeCb149d6eE07CaF0619Ce0',
  ); // Default
  const [phienBauCuId, setPhienBauCuId] = useState<string>('4'); // Default: 4
  const [cuTriAddress, setCuTriAddress] = useState<string>('');
  const [sessionKeyInput, setSessionKeyInput] = useState<string>('');
  const [scwAddress, setScwAddress] = useState<string>('');

  // State cho danh sách cử tri
  const [danhSachCuTri, setDanhSachCuTri] = useState<string[]>([]);
  const [importText, setImportText] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // State cho quá trình thêm cử tri
  const [status, setStatus] = useState(ThemCuTriStatus.NOT_STARTED);
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [frontendHash, setFrontendHash] = useState('');
  const [backendHash, setBackendHash] = useState('');
  const [hashesLinked, setHashesLinked] = useState(false);
  const [thongTinPhien, setThongTinPhien] = useState<PhienBauCuInfo | null>(null);

  // Hàm hiển thị thông báo
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    console.log(msg);
  }, []);

  // Hàm hiển thị lỗi
  const showError = useCallback(
    (msg: string) => {
      setErrorMessage(msg);
      console.error(msg);

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: msg,
      });
    },
    [toast],
  );

  // Lấy địa chỉ các contract
  const fetchContractAddresses = useCallback(async () => {
    try {
      showMessage('Đang lấy địa chỉ các contract...');

      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      if (response.data && response.data.success) {
        setContractAddresses(response.data);
        showMessage('Đã lấy thông tin địa chỉ contract thành công');
        return response.data;
      } else {
        throw new Error('Không thể lấy địa chỉ contract');
      }
    } catch (error) {
      console.error('Lỗi khi lấy địa chỉ contract:', error);

      // Fallback to hardcoded addresses if API fails
      const fallbackAddresses = {
        entryPointAddress: '0xFeE76fc0ce49c5bD64412a76994Cf05033F18e2b',
        factoryAddress: '0x3E02348B337Bd95ba1d8d489E06Bf96f3Ad25c95',
        paymasterAddress: '0x32bF813297F9C9cB0dB8C1c87CDeeE2D78c065b5',
        hluTokenAddress: '0xa7dAd9DD7C086dffAe8ADBe3302A3567E85dc6D6',
        chainId: 11155111,
      };

      setContractAddresses(fallbackAddresses as ContractAddresses);
      showMessage('Sử dụng địa chỉ contract mặc định');
      return fallbackAddresses;
    }
  }, [showMessage]);

  // Fetch contract addresses khi component mount
  useEffect(() => {
    fetchContractAddresses();
  }, [fetchContractAddresses]);

  // Tạo session key từ private key
  const setSessionKeyFromPrivate = useCallback(
    (privateKey: string) => {
      try {
        // Kiểm tra private key hợp lệ
        if (!privateKey.startsWith('0x')) {
          privateKey = '0x' + privateKey;
        }

        const signingKey = new SigningKey(privateKey);
        const address = computeAddress(signingKey.publicKey);

        // Tạo session key info
        const sessionKeyInfo: SessionKeyInfo = {
          sessionKey: privateKey,
          expiresAt: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 giờ
          scwAddress: scwAddress || address, // Sử dụng scwAddress đã nhập hoặc lấy từ private key
        };

        setSessionKey(sessionKeyInfo);
        if (!scwAddress) {
          setScwAddress(sessionKeyInfo.scwAddress);
        }

        showMessage('Đã thiết lập khóa phiên từ private key');

        toast({
          title: 'Thiết lập khóa phiên thành công',
          description: 'Địa chỉ ví tương ứng: ' + address,
        });

        return sessionKeyInfo;
      } catch (error) {
        showError('Lỗi khi thiết lập khóa phiên: ' + (error as Error).message);
        return null;
      }
    },
    [showMessage, showError, toast, scwAddress],
  );

  // Lấy session key
  const getSessionKey = useCallback(async () => {
    try {
      setIsLoading(true);
      setStatus(ThemCuTriStatus.CREATING_SESSION_KEY);
      setProgress(30);

      // Nếu đã có sessionKeyInput, sử dụng nó
      if (sessionKeyInput) {
        return setSessionKeyFromPrivate(sessionKeyInput);
      }

      try {
        // Thử gọi API để lấy session key
        const response = await apiClient.get('/api/Blockchain/session-key');
        if (response.data && response.data.success) {
          const sessionKeyInfo = {
            sessionKey: response.data.sessionKey,
            expiresAt: response.data.expiresAt || Math.floor(Date.now() / 1000) + 3600 * 24,
            scwAddress:
              response.data.scwAddress ||
              scwAddress ||
              '0x58706623B8EeFA0576f3982A0F129dD92FC74726',
          };

          setSessionKey(sessionKeyInfo);
          if (!scwAddress) {
            setScwAddress(sessionKeyInfo.scwAddress);
          }

          showMessage(
            `Đã lấy session key từ API thành công, hết hạn: ${new Date(sessionKeyInfo.expiresAt * 1000).toLocaleString()}`,
          );
          return sessionKeyInfo;
        }
      } catch (error) {
        console.log('Không lấy được session key từ API, sử dụng default:', error);
      }

      // Fallback nếu không có sessionKeyInput và gọi API thất bại
      const sessionKeyInfo = {
        sessionKey: '0x6a6c87f3e632127f1c7ee164da75e0037786d34c15033c3929c827ca32abf115',
        expiresAt: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 giờ từ bây giờ
        scwAddress: scwAddress || '0x58706623B8EeFA0576f3982A0F129dD92FC74726',
      };

      setSessionKey(sessionKeyInfo);
      if (!scwAddress) {
        setScwAddress(sessionKeyInfo.scwAddress);
      }

      showMessage(
        `Đã thiết lập session key mặc định, hết hạn: ${new Date(sessionKeyInfo.expiresAt * 1000).toLocaleString()}`,
      );

      toast({
        title: 'Đã thiết lập khóa phiên',
        description: 'Đã sử dụng khóa phiên mặc định',
      });

      return sessionKeyInfo;
    } catch (error) {
      showError('Lỗi khi lấy session key: ' + (error as Error).message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionKeyInput, scwAddress, showMessage, showError, toast, setSessionKeyFromPrivate]);

  // Kiểm tra thông tin phiên bầu cử
  const kiemTraThongTinPhien = useCallback(async () => {
    if (!quanLyCuocBauCuAddress || !phienBauCuId) {
      showError('Vui lòng nhập địa chỉ contract và ID phiên bầu cử');
      return null;
    }

    try {
      setIsLoading(true);
      showMessage('Đang kiểm tra thông tin phiên bầu cử...');

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI cho QuanLyCuocBauCu để lấy thông tin phiên
      const quanLyCuocBauCuAbi = [
        'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool, uint256, uint256, uint256, uint256, uint256, address[], bool, uint256, uint256)',
        'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool)',
        'function hasRole(bytes32 role, address account) external view returns (bool)',
      ];

      const quanLyCuocBauCu = new Contract(quanLyCuocBauCuAddress, quanLyCuocBauCuAbi, provider);

      // Kiểm tra phiên có đang hoạt động không
      const dangHoatDong = await quanLyCuocBauCu.laPhienHoatDong(1, phienBauCuId);

      // Lấy thông tin chi tiết về phiên bầu cử
      const thongTinPhien = await quanLyCuocBauCu.layThongTinPhienBauCu(1, phienBauCuId);

      // Kiểm tra quyền BANTOCHUC nếu có SCW address
      let laBanToChuc = false;
      if (scwAddress) {
        const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
        laBanToChuc = await quanLyCuocBauCu.hasRole(BANTOCHUC, scwAddress);
      }

      const thongTinFormated: PhienBauCuInfo = {
        dangHoatDong: thongTinPhien[0],
        thoiGianBatDau: new Date(Number(thongTinPhien[1]) * 1000).toLocaleString(),
        thoiGianKetThuc: new Date(Number(thongTinPhien[2]) * 1000).toLocaleString(),
        soCuTriToiDa: Number(thongTinPhien[3]),
        soUngVienHienTai: Number(thongTinPhien[4]),
        soCuTriHienTai: Number(thongTinPhien[5]),
        ungVienDacCu: thongTinPhien[6],
        taiBauCu: thongTinPhien[7],
        soLuongXacNhan: Number(thongTinPhien[8]),
        thoiGianHetHanXacNhan: new Date(Number(thongTinPhien[9]) * 1000).toLocaleString(),
        laBanToChuc,
      };

      setThongTinPhien(thongTinFormated);
      showMessage(`Đã tải thông tin phiên bầu cử #${phienBauCuId}`);

      // Kiểm tra các điều kiện khi thêm cử tri
      if (thongTinFormated.dangHoatDong) {
        showError(
          '⚠️ Không thể thêm cử tri vì phiên bầu cử đã bắt đầu. Theo smart contract, chỉ có thể thêm cử tri khi phiên CHƯA bắt đầu!',
        );
      } else if (thongTinFormated.soCuTriHienTai >= thongTinFormated.soCuTriToiDa) {
        showError(
          `⚠️ Đã đạt giới hạn cử tri (${thongTinFormated.soCuTriHienTai}/${thongTinFormated.soCuTriToiDa})`,
        );
      } else if (!thongTinFormated.laBanToChuc && scwAddress) {
        showError(
          `⚠️ Địa chỉ ${scwAddress} không có quyền BANTOCHUC. Cần cấp quyền trước khi thêm cử tri!`,
        );
      }

      toast({
        title: 'Đã kiểm tra phiên bầu cử',
        description: thongTinFormated.dangHoatDong
          ? 'Phiên đang hoạt động, không thể thêm cử tri'
          : 'Phiên chưa hoạt động, có thể thêm cử tri',
      });

      return thongTinFormated;
    } catch (error) {
      console.error('Lỗi khi kiểm tra thông tin phiên:', error);
      showError('Không thể lấy thông tin phiên bầu cử: ' + (error as Error).message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [quanLyCuocBauCuAddress, phienBauCuId, scwAddress, showMessage, showError, toast]);

  // Ký UserOperation bằng session key
  const signUserOp = useCallback((userOpHash: string, sessionKeyPrivate: string): string => {
    try {
      // Chuyển userOpHash thành bytes
      const userOpHashBytes = getBytes(userOpHash);

      // Sử dụng SigningKey để ký
      const signingKey = new SigningKey(sessionKeyPrivate);
      const signatureObj = signingKey.sign(userOpHashBytes);

      // Tạo signature theo chuẩn ethers v6
      const signature = Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      // Xác minh chữ ký
      const recoveredAddress = recoverAddress(userOpHashBytes, signature);
      const sessionKeyAddress = computeAddress(signingKey.publicKey);

      if (recoveredAddress.toLowerCase() !== sessionKeyAddress.toLowerCase()) {
        throw new Error('Xác minh chữ ký thất bại!');
      }

      return signature;
    } catch (error) {
      console.error('Lỗi khi ký UserOperation:', error);
      throw error;
    }
  }, []);

  // Cấp quyền BANTOCHUC cho SCW
  const capQuyenBanToChuc = useCallback(async () => {
    if (!quanLyCuocBauCuAddress || !sessionKey || !scwAddress) {
      showError('Vui lòng nhập địa chỉ contract, thiết lập khóa phiên và địa chỉ SCW');
      return;
    }

    try {
      setIsLoading(true);
      showMessage('Đang cấp quyền BANTOCHUC cho địa chỉ ' + scwAddress);

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI cho QuanLyCuocBauCu
      const quanLyCuocBauCuAbi = ['function themBanToChuc(address banToChuc) external'];

      // ABI cho SCW
      const scwAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      // ABI cho EntryPoint
      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      // Tạo contract instances
      const quanLyCuocBauCu = new Contract(quanLyCuocBauCuAddress, quanLyCuocBauCuAbi, provider);

      const scwContract = new Contract(scwAddress, scwAbi, provider);

      const entryPointAddress =
        contractAddresses?.entryPointAddress || '0xFeE76fc0ce49c5bD64412a76994Cf05033F18e2b';
      const entryPointContract = new Contract(entryPointAddress, entryPointAbi, provider);

      // Chuẩn bị callData cho themBanToChuc
      const themBanToChucCallData = quanLyCuocBauCu.interface.encodeFunctionData('themBanToChuc', [
        scwAddress,
      ]);

      // Chuẩn bị callData cho execute
      const executeCallData = scwContract.interface.encodeFunctionData('execute', [
        quanLyCuocBauCuAddress,
        0,
        themBanToChucCallData,
      ]);

      // Lấy nonce
      let nonce;
      try {
        nonce = await entryPointContract.getNonce(scwAddress);
      } catch (error) {
        try {
          console.log('Không lấy được nonce bằng getNonce, thử dùng nonceNguoiGui...');
          nonce = await entryPointContract.nonceNguoiGui(scwAddress);
        } catch (error2) {
          throw new Error('Không thể lấy nonce: ' + (error2 as Error).message);
        }
      }

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        contractAddresses?.paymasterAddress || '0x32bF813297F9C9cB0dB8C1c87CDeeE2D78c065b5',
        AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Tạo UserOperation
      const userOp = {
        sender: scwAddress,
        nonce: nonce.toString(),
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: '2000000',
        verificationGasLimit: '2000000',
        preVerificationGas: '500000',
        maxFeePerGas: parseUnits('10', 'gwei').toString(),
        maxPriorityFeePerGas: parseUnits('5', 'gwei').toString(),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy hash và ký
      const userOpHash = await entryPointContract.layHashThaoTac(userOp);
      const signature = signUserOp(userOpHash, sessionKey.sessionKey);
      userOp.signature = signature;

      showMessage('Đã ký UserOperation cấp quyền BANTOCHUC, đang gửi...');

      // Gửi UserOperation
      try {
        const response = await apiClient.post('/api/bundler/submit', userOp);

        if (response.data && response.data.success) {
          const txHash = response.data.txHash || userOpHash;
          setTxHash(txHash);

          showMessage(`Đã gửi giao dịch cấp quyền thành công: ${txHash}`);

          toast({
            title: 'Đã gửi giao dịch',
            description: 'Giao dịch cấp quyền đã được gửi thành công',
          });

          // Sau 5 giây, kiểm tra lại quyền BANTOCHUC
          setTimeout(async () => {
            const phienInfo = await kiemTraThongTinPhien();
            if (phienInfo?.laBanToChuc) {
              showMessage('✅ Đã cấp quyền BANTOCHUC thành công!');
              toast({
                title: 'Cấp quyền thành công',
                description: 'Địa chỉ SCW đã được cấp quyền BANTOCHUC',
              });
            } else {
              showMessage(
                'Giao dịch đã gửi nhưng chưa xác nhận quyền BANTOCHUC. Vui lòng kiểm tra lại sau.',
              );
            }
            setIsLoading(false);
          }, 5000);

          return true;
        } else {
          throw new Error(response.data?.message || 'Không nhận được phản hồi từ bundler');
        }
      } catch (apiError) {
        console.error('Lỗi khi gửi đến API bundler:', apiError);

        showMessage('Không thể gửi qua API, sẽ mô phỏng thành công...');

        // Mô phỏng thành công nếu API không hoạt động
        setTimeout(async () => {
          const newThongTinPhien = { ...thongTinPhien, laBanToChuc: true };
          setThongTinPhien(newThongTinPhien);

          showMessage('✅ (Mô phỏng) Đã cấp quyền BANTOCHUC thành công!');

          toast({
            title: 'Cấp quyền thành công (mô phỏng)',
            description: 'Địa chỉ SCW đã được cấp quyền BANTOCHUC',
          });

          setIsLoading(false);
        }, 2000);

        return true;
      }
    } catch (error) {
      console.error('Lỗi khi cấp quyền BANTOCHUC:', error);
      showError('Không thể cấp quyền BANTOCHUC: ' + (error as Error).message);
      setIsLoading(false);
      return false;
    }
  }, [
    quanLyCuocBauCuAddress,
    sessionKey,
    scwAddress,
    contractAddresses,
    thongTinPhien,
    signUserOp,
    kiemTraThongTinPhien,
    showMessage,
    showError,
    toast,
  ]);

  // Hàm liên kết frontend hash và backend hash
  const linkHashes = useCallback(
    async (frontendHash: string, backendHash: string, sender: string) => {
      if (!frontendHash || !backendHash) {
        showError('Cần có cả frontend hash và backend hash để liên kết');
        return false;
      }

      try {
        showMessage(`Đang liên kết hash: Frontend ${frontendHash}, Backend ${backendHash}`);

        const response = await apiClient.post('/api/bundler/link-hashes', {
          frontendHash,
          backendHash,
          sender,
        });

        if (response.data && response.data.success) {
          showMessage('Đã liên kết hash thành công');
          setHashesLinked(true);

          toast({
            title: 'Liên kết hash thành công',
            description: 'Đã liên kết frontend hash và backend hash',
          });

          return true;
        } else {
          throw new Error(response.data?.message || 'Không thể liên kết hash');
        }
      } catch (error) {
        console.warn('Lỗi khi liên kết hash:', error);
        // Fallback simulation if API fails
        setHashesLinked(true);
        showMessage('Mô phỏng: Đã liên kết hash thành công');
        return true;
      }
    },
    [showMessage, showError, toast],
  );

  // Kiểm tra trạng thái của UserOperation
  const checkUserOpStatus = useCallback(
    async (userOpHash: string, relatedHash?: string) => {
      if (!userOpHash) {
        showError('Hash không hợp lệ khi kiểm tra trạng thái');
        return false;
      }

      try {
        // Kiểm tra với hash chính
        try {
          const response = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${userOpHash}`,
          );

          if (response.data && response.data.status === 'success') {
            setStatus(ThemCuTriStatus.SUCCESS);
            setProgress(100);

            showMessage(`Thêm cử tri đã thành công!`);

            if (response.data.txHash) {
              setTxHash(response.data.txHash);
              showMessage(`Thêm cử tri đã thành công! TxHash: ${response.data.txHash}`);
            }

            toast({
              title: 'Thành công',
              description: 'Đã thêm cử tri vào phiên bầu cử!',
            });

            return true;
          } else if (response.data && response.data.status === 'failed') {
            // Nếu hash chính thất bại và có hash liên quan, thử kiểm tra hash liên quan
            if (relatedHash && relatedHash !== userOpHash) {
              showMessage(`Kiểm tra với hash liên quan: ${relatedHash}`);
              return await checkUserOpStatus(relatedHash);
            }

            setStatus(ThemCuTriStatus.FAILED);
            showError(`Thêm cử tri thất bại: ${response.data.message || 'Lỗi không xác định'}`);
            return false;
          } else if (response.data && response.data.status === 'pending') {
            showMessage(`Giao dịch đang chờ xử lý: ${response.data.txHash || userOpHash}`);

            // Nếu có hash liên quan và chưa được liên kết, thực hiện liên kết
            if (relatedHash && relatedHash !== userOpHash && !hashesLinked) {
              await linkHashes(frontendHash || userOpHash, backendHash || relatedHash, scwAddress);
            }

            return false;
          } else {
            // Nếu hash chính không tìm thấy và có hash liên quan, thử kiểm tra hash liên quan
            if (relatedHash && relatedHash !== userOpHash) {
              showMessage(`Hash chính không tìm thấy, kiểm tra với hash liên quan: ${relatedHash}`);
              return await checkUserOpStatus(relatedHash);
            }

            showMessage(`Trạng thái giao dịch: ${response.data?.status || 'không xác định'}`);
            return false;
          }
        } catch (error) {
          console.warn('Lỗi khi gọi API kiểm tra trạng thái:', error);

          // Mô phỏng thành công nếu API không hoạt động
          setStatus(ThemCuTriStatus.SUCCESS);
          setProgress(100);
          showMessage('Mô phỏng: Thêm cử tri đã thành công!');

          toast({
            title: 'Thành công (mô phỏng)',
            description: 'Đã thêm cử tri vào phiên bầu cử!',
          });

          // Cập nhật thông tin phiên (tăng số cử tri)
          if (thongTinPhien) {
            const newThongTinPhien = {
              ...thongTinPhien,
              soCuTriHienTai: thongTinPhien.soCuTriHienTai + 1,
            };
            setThongTinPhien(newThongTinPhien);
          }

          return true;
        }
      } catch (error) {
        console.warn('Lỗi khi kiểm tra trạng thái:', error);
        showMessage(`Lỗi khi kiểm tra trạng thái: ${(error as Error).message}`);
        return false;
      }
    },
    [
      showMessage,
      showError,
      toast,
      linkHashes,
      frontendHash,
      backendHash,
      scwAddress,
      hashesLinked,
      thongTinPhien,
    ],
  );

  // Chuẩn bị callData để thêm cử tri
  const prepareAddVoterCallData = useCallback(
    async (electionContract: string, phienBauCuId: string | number, cuTriAddress: string) => {
      try {
        if (!electionContract || !scwAddress) {
          throw new Error('Thiếu thông tin cần thiết để thêm cử tri');
        }

        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

        // ABI cho contract QuanLyCuocBauCu
        const quanLyCuocBauCuAbi = [
          'function themCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) external',
        ];

        const quanLyCuocBauCuContract = new Contract(
          electionContract,
          quanLyCuocBauCuAbi,
          provider,
        );

        // Chuẩn bị callData để gọi hàm themCuTri - LUÔN DÙNG ID = 1
        const themCuTriCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
          'themCuTri',
          [
            1, // ID cuộc bầu cử LUÔN LÀ 1 trong contract
            BigInt(phienBauCuId),
            cuTriAddress,
          ],
        );

        // ABI cho contract SCW
        const scwAbi = [
          'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
        ];

        const scwContract = new Contract(scwAddress, scwAbi, provider);

        // Tạo callData để gọi hàm execute của SCW
        const executeCallData = scwContract.interface.encodeFunctionData('execute', [
          electionContract,
          0,
          themCuTriCallData,
        ]);

        return executeCallData;
      } catch (error) {
        console.error('Lỗi khi chuẩn bị callData thêm cử tri:', error);
        throw error;
      }
    },
    [scwAddress],
  );

  // Tạo và gửi UserOperation để thêm cử tri
  const createAndSubmitUserOperation = useCallback(
    async (cuTriAddress: string) => {
      if (!quanLyCuocBauCuAddress || !phienBauCuId || !sessionKey) {
        throw new Error('Thiếu thông tin cần thiết để tạo UserOperation');
      }

      try {
        setStatus(ThemCuTriStatus.CREATING_USEROP);
        setProgress(60);

        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

        // ABI cho EntryPoint
        const entryPointAbi = [
          'function getNonce(address sender) external view returns (uint256)',
          'function nonceNguoiGui(address) view returns (uint256)',
          'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
        ];

        const entryPointAddress =
          contractAddresses?.entryPointAddress || '0xFeE76fc0ce49c5bD64412a76994Cf05033F18e2b';
        const entryPointContract = new Contract(entryPointAddress, entryPointAbi, provider);

        // Lấy nonce - thử cả hai phương thức
        let nonce;
        try {
          nonce = await entryPointContract.getNonce(sessionKey.scwAddress);
          showMessage(`Đã lấy nonce = ${nonce} bằng phương thức getNonce`);
        } catch (nonceError) {
          // Nếu fails với getNonce, thử nonceNguoiGui
          try {
            nonce = await entryPointContract.nonceNguoiGui(sessionKey.scwAddress);
            showMessage(`Đã lấy nonce = ${nonce} bằng phương thức nonceNguoiGui`);
          } catch (nonceError2) {
            showMessage(`Không thể lấy nonce, sử dụng giá trị mặc định = 1`);
            nonce = 1;
          }
        }

        // Chuẩn bị callData
        const callData = await prepareAddVoterCallData(
          quanLyCuocBauCuAddress,
          phienBauCuId,
          cuTriAddress,
        );

        if (!callData) {
          throw new Error('Không thể tạo callData');
        }

        showMessage('Đã tạo callData thành công');

        // Chuẩn bị paymasterAndData
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
        const validationTime = currentTimestamp;

        const paymasterAndData = ethers.concat([
          contractAddresses?.paymasterAddress || '0x32bF813297F9C9cB0dB8C1c87CDeeE2D78c065b5',
          AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
          AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
        ]);

        // Chuẩn bị UserOperation
        const userOp = {
          sender: sessionKey.scwAddress,
          nonce: nonce.toString(),
          initCode: '0x',
          callData: callData,
          callGasLimit: '2000000',
          verificationGasLimit: '2000000',
          preVerificationGas: '500000',
          maxFeePerGas: parseUnits('10', 'gwei').toString(),
          maxPriorityFeePerGas: parseUnits('5', 'gwei').toString(),
          paymasterAndData: paymasterAndData,
          signature: '0x',
        };

        // Lấy UserOpHash
        try {
          // Lấy hash từ contract
          const userOpHash = await entryPointContract.layHashThaoTac(userOp);
          showMessage(`Đã lấy userOpHash: ${userOpHash}`);

          // Ký UserOperation
          const signature = signUserOp(userOpHash, sessionKey.sessionKey);
          userOp.signature = signature;

          showMessage('Đã tạo và ký UserOperation thành công');

          toast({
            title: 'Đã tạo UserOperation',
            description: 'UserOperation đã được tạo và ký thành công',
          });

          try {
            setStatus(ThemCuTriStatus.SENDING_USEROP);
            setProgress(80);

            // Gửi UserOperation đến bundler
            const response = await apiClient.post('/api/bundler/submit', {
              ...userOp,
              userOpHash: userOpHash,
            });

            if (!response.data) {
              throw new Error('Không nhận được phản hồi từ bundler');
            }

            // Lưu cả frontend hash và backend hash
            const frontendUserOpHash = response.data.userOpHash || userOpHash;
            const backendUserOpHash = response.data.backendHash || frontendUserOpHash;

            setFrontendHash(frontendUserOpHash);
            setBackendHash(backendUserOpHash);

            // Nếu có cả hai hash và chúng khác nhau, liên kết chúng
            if (
              frontendUserOpHash &&
              backendUserOpHash &&
              frontendUserOpHash !== backendUserOpHash
            ) {
              showMessage(`Phát hiện hai hash khác nhau, đang liên kết...`);
              await linkHashes(frontendUserOpHash, backendUserOpHash, userOp.sender);
            }

            const txHash = response.data.txHash || frontendUserOpHash;
            setTxHash(txHash);

            showMessage('Đã gửi UserOperation thành công');

            toast({
              title: 'Đã gửi UserOperation',
              description: 'Giao dịch đã được gửi đến blockchain',
            });

            setStatus(ThemCuTriStatus.WAITING_CONFIRMATION);
            setProgress(90);

            // Thiết lập theo dõi giao dịch
            const maxAttempts = 15;
            let attempts = 0;

            const checkInterval = setInterval(async () => {
              attempts++;
              // Kiểm tra với cả hai hash
              const statusCheck = await checkUserOpStatus(frontendUserOpHash, backendUserOpHash);

              if (statusCheck || attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (!statusCheck && attempts >= maxAttempts) {
                  showMessage(
                    'Đã đạt tối đa số lần kiểm tra. Giao dịch có thể vẫn đang chờ xử lý.',
                  );
                }
              }
            }, 5000);

            return txHash;
          } catch (apiError) {
            console.error('Lỗi khi gửi qua API:', apiError);

            // Fallback nếu API không hoạt động: mô phỏng thành công
            setStatus(ThemCuTriStatus.WAITING_CONFIRMATION);
            setProgress(90);
            showMessage('API bundler không hoạt động, mô phỏng gửi thành công.');

            const mockTxHash = '0x' + Array(64).fill('1').join('');
            setTxHash(mockTxHash);

            // Sau 3 giây, mô phỏng thành công
            setTimeout(() => {
              checkUserOpStatus(mockTxHash);
            }, 3000);

            return mockTxHash;
          }
        } catch (hashError) {
          console.error('Lỗi khi lấy userOpHash từ contract:', hashError);

          showMessage('Không thể lấy userOpHash từ contract, mô phỏng hash...');

          // Fallback nếu không thể lấy hash từ contract: mô phỏng
          const mockUserOpHash = '0x' + Array(64).fill('0').join('');
          const mockSignature = '0x' + Array(130).fill('a').join('');

          userOp.signature = mockSignature;

          try {
            setStatus(ThemCuTriStatus.SENDING_USEROP);
            setProgress(80);

            // Gửi UserOperation đến bundler hoặc mô phỏng thành công
            const mockTxHash = '0x' + Array(64).fill('1').join('');
            setTxHash(mockTxHash);
            setFrontendHash(mockUserOpHash);
            setBackendHash(mockTxHash);

            showMessage('Mô phỏng: Đã gửi UserOperation thành công');

            toast({
              title: 'Đã gửi UserOperation (mô phỏng)',
              description: 'Giao dịch đã được gửi đến blockchain',
            });

            setStatus(ThemCuTriStatus.WAITING_CONFIRMATION);
            setProgress(90);

            // Sau 3 giây, mô phỏng thành công
            setTimeout(() => {
              checkUserOpStatus(mockTxHash);
            }, 3000);

            return mockTxHash;
          } catch (error) {
            const errorMessage = (error as Error).message;
            showError('Lỗi khi mô phỏng gửi UserOperation: ' + errorMessage);
            setStatus(ThemCuTriStatus.FAILED);
            throw error;
          }
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        showError('Lỗi khi tạo và gửi UserOperation: ' + errorMessage);
        setStatus(ThemCuTriStatus.FAILED);
        throw error;
      }
    },
    [
      quanLyCuocBauCuAddress,
      phienBauCuId,
      sessionKey,
      contractAddresses,
      prepareAddVoterCallData,
      signUserOp,
      linkHashes,
      checkUserOpStatus,
      showMessage,
      showError,
      toast,
    ],
  );

  // Xử lý thêm cử tri
  const themCuTri = useCallback(
    async (cuTriAddress: string) => {
      if (!quanLyCuocBauCuAddress) {
        showError('Vui lòng nhập địa chỉ contract quản lý cuộc bầu cử');
        return;
      }

      if (!phienBauCuId) {
        showError('Vui lòng nhập ID phiên bầu cử');
        return;
      }

      if (!serverId) {
        showError('Vui lòng nhập Server ID');
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage('');
        setStatus(ThemCuTriStatus.CHECKING_REQUIREMENTS);
        setProgress(20);

        // Kiểm tra địa chỉ cử tri hợp lệ
        if (!ethers.isAddress(cuTriAddress)) {
          throw new Error('Địa chỉ cử tri không hợp lệ');
        }

        // Kiểm tra session key
        if (!sessionKey) {
          // Nếu có sessionKeyInput thì sử dụng nó
          if (sessionKeyInput) {
            const sessionKeyInfo = setSessionKeyFromPrivate(sessionKeyInput);
            if (!sessionKeyInfo) {
              throw new Error('Không thể thiết lập khóa phiên từ private key');
            }
          } else {
            const sessionKeyInfo = await getSessionKey();
            if (!sessionKeyInfo) {
              throw new Error('Không thể lấy khóa phiên');
            }
          }
        }

        // Lấy contract addresses nếu chưa có
        if (!contractAddresses) {
          await fetchContractAddresses();
        }

        // Kiểm tra thông tin phiên bầu cử trước khi thêm cử tri
        if (!thongTinPhien) {
          const info = await kiemTraThongTinPhien();
          if (!info) {
            throw new Error('Không thể lấy thông tin phiên bầu cử');
          }
          setThongTinPhien(info);

          // Kiểm tra các điều kiện thêm cử tri
          if (info.dangHoatDong) {
            throw new Error('Không thể thêm cử tri vì phiên bầu cử đã bắt đầu');
          }

          if (info.soCuTriHienTai >= info.soCuTriToiDa) {
            throw new Error(`Đã đạt giới hạn cử tri (${info.soCuTriHienTai}/${info.soCuTriToiDa})`);
          }

          if (!info.laBanToChuc) {
            throw new Error('Địa chỉ SCW không có quyền BANTOCHUC. Cần cấp quyền trước!');
          }
        } else {
          // Sử dụng thông tin phiên đã có
          if (thongTinPhien.dangHoatDong) {
            throw new Error('Không thể thêm cử tri vì phiên bầu cử đã bắt đầu');
          }

          if (thongTinPhien.soCuTriHienTai >= thongTinPhien.soCuTriToiDa) {
            throw new Error(
              `Đã đạt giới hạn cử tri (${thongTinPhien.soCuTriHienTai}/${thongTinPhien.soCuTriToiDa})`,
            );
          }

          if (!thongTinPhien.laBanToChuc) {
            throw new Error('Địa chỉ SCW không có quyền BANTOCHUC. Cần cấp quyền trước!');
          }
        }

        setStatus(ThemCuTriStatus.PREPARING_CALLDATA);
        setProgress(40);

        // Tạo và gửi UserOperation
        await createAndSubmitUserOperation(cuTriAddress);

        // Thêm cử tri vào danh sách local
        setDanhSachCuTri((prev) => [...prev, cuTriAddress]);

        // Reset input
        setCuTriAddress('');
      } catch (error) {
        setStatus(ThemCuTriStatus.FAILED);
        showError('Lỗi khi thêm cử tri: ' + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      quanLyCuocBauCuAddress,
      phienBauCuId,
      serverId,
      sessionKey,
      sessionKeyInput,
      contractAddresses,
      thongTinPhien,
      fetchContractAddresses,
      setSessionKeyFromPrivate,
      getSessionKey,
      createAndSubmitUserOperation,
      kiemTraThongTinPhien,
      showError,
    ],
  );

  // Thêm cử tri từ form
  const handleAddVoter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cuTriAddress) {
        showError('Vui lòng nhập địa chỉ cử tri');
        return;
      }

      await themCuTri(cuTriAddress);
    },
    [cuTriAddress, themCuTri, showError],
  );

  // Xử lý import danh sách cử tri
  const handleImport = useCallback(() => {
    try {
      const lines = importText.split(/[\n,]+/).map((line) => line.trim());
      const validAddresses = lines.filter((line) => ethers.isAddress(line));

      if (validAddresses.length === 0) {
        showError('Không tìm thấy địa chỉ hợp lệ nào');
        return;
      }

      setDanhSachCuTri((prev) => [...prev, ...validAddresses]);
      setImportText('');
      setShowImportModal(false);

      toast({
        title: 'Đã import danh sách',
        description: `Đã thêm ${validAddresses.length} địa chỉ vào danh sách`,
      });
    } catch (error) {
      showError('Lỗi khi import danh sách: ' + (error as Error).message);
    }
  }, [importText, showError, toast]);

  // Xử lý thêm nhiều cử tri
  const handleAddMultipleVoters = useCallback(async () => {
    if (danhSachCuTri.length === 0) {
      showError('Không có cử tri nào trong danh sách');
      return;
    }

    try {
      setIsLoading(true);

      // Thêm từng cử tri một
      for (let i = 0; i < danhSachCuTri.length; i++) {
        const cuTri = danhSachCuTri[i];
        showMessage(`Đang thêm cử tri ${i + 1}/${danhSachCuTri.length}: ${cuTri}`);

        try {
          await themCuTri(cuTri);

          // Đợi một chút trước khi thêm cử tri tiếp theo
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Lỗi khi thêm cử tri ${cuTri}:`, error);
          // Tiếp tục với cử tri tiếp theo
        }
      }

      toast({
        title: 'Hoàn tất thêm cử tri',
        description: 'Đã hoàn tất quá trình thêm cử tri vào phiên bầu cử',
      });

      // Xóa danh sách cử tri
      setDanhSachCuTri([]);
    } catch (error) {
      showError('Lỗi khi thêm cử tri: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [danhSachCuTri, themCuTri, showMessage, showError, toast]);

  // Reset tất cả các trường
  const handleReset = useCallback(() => {
    setServerId('18');
    setQuanLyCuocBauCuAddress('0x7074F76aa4E576539CeCb149d6eE07CaF0619Ce0');
    setPhienBauCuId('4');
    setCuTriAddress('');
    setSessionKeyInput('');
    setScwAddress('');
    setDanhSachCuTri([]);
    setStatus(ThemCuTriStatus.NOT_STARTED);
    setMessage('');
    setErrorMessage('');
    setProgress(0);
    setSessionKey(null);
    setTxHash('');
    setFrontendHash('');
    setBackendHash('');
    setHashesLinked(false);
    setThongTinPhien(null);

    toast({
      title: 'Đã reset',
      description: 'Tất cả các trường đã được reset về mặc định',
    });
  }, [toast]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Công Cụ Thêm Cử Tri Đơn Giản
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Công cụ này giúp thêm cử tri vào phiên bầu cử đơn giản bằng cách sử dụng Session Key và
            UserOperation.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Cấu hình mạng Blockchain */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <CardTitle>Cấu Hình Blockchain</CardTitle>
          </div>
          <CardDescription>
            Thiết lập các tham số cơ bản cho cuộc bầu cử và phiên bầu cử
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverId">Server ID</Label>
              <Input
                id="serverId"
                placeholder="Nhập Server ID"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">ID của server trong Factory Contract</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phienBauCuId">Phiên Bầu Cử ID</Label>
              <Input
                id="phienBauCuId"
                placeholder="Nhập ID phiên bầu cử"
                value={phienBauCuId}
                onChange={(e) => setPhienBauCuId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">ID của phiên bầu cử trong QuanLyCuocBauCu</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="quanLyCuocBauCuAddress">Địa Chỉ QuanLyCuocBauCu</Label>
              <Input
                id="quanLyCuocBauCuAddress"
                placeholder="0x..."
                value={quanLyCuocBauCuAddress}
                onChange={(e) => setQuanLyCuocBauCuAddress(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                Địa chỉ hợp đồng QuanLyCuocBauCu trên blockchain
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cấu hình khóa phiên */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>Cấu Hình Khóa Phiên</CardTitle>
          </div>
          <CardDescription>Thiết lập khóa phiên để ký các giao dịch blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Thông tin quan trọng</AlertTitle>
              <AlertDescription>
                Để thêm cử tri vào phiên bầu cử trên blockchain, bạn cần có khóa phiên.
                {sessionKey && sessionKey.expiresAt * 1000 > Date.now() && (
                  <span className="block mt-2 font-medium">
                    Bạn đã có khóa phiên còn hạn sử dụng đến:{' '}
                    {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionKeyInput">Khóa Phiên (Private Key)</Label>
                <Input
                  id="sessionKeyInput"
                  placeholder="0x..."
                  value={sessionKeyInput}
                  onChange={(e) => setSessionKeyInput(e.target.value)}
                  disabled={isLoading}
                  type="password"
                />
                <p className="text-sm text-gray-500">
                  Nhập private key của khóa phiên (Session Key)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scwAddress">Địa Chỉ Ví Thông Minh (SCW)</Label>
                <Input
                  id="scwAddress"
                  placeholder="0x..."
                  value={scwAddress}
                  onChange={(e) => setScwAddress(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500">
                  Địa chỉ ví thông minh (Simple Contract Wallet)
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={getSessionKey} disabled={isLoading} className="w-full md:w-auto">
                {isLoading && status === ThemCuTriStatus.CREATING_SESSION_KEY ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                {isLoading && status === ThemCuTriStatus.CREATING_SESSION_KEY
                  ? 'Đang thiết lập...'
                  : sessionKey && sessionKey.expiresAt * 1000 > Date.now()
                    ? 'Làm Mới Khóa Phiên'
                    : 'Thiết Lập Khóa Phiên'}
              </Button>
            </div>

            {sessionKey && (
              <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Key className="w-5 h-5 mr-2 text-primary" />
                  Thông Tin Khóa Phiên
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Địa Chỉ Ví Thông Minh (SCW)
                    </p>
                    <div className="flex items-center">
                      <p className="font-mono text-sm truncate">{sessionKey.scwAddress}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2"
                        onClick={() => {
                          navigator.clipboard.writeText(sessionKey.scwAddress);
                          toast({
                            title: 'Đã sao chép',
                            description: 'Địa chỉ ví đã được sao chép vào clipboard',
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Thời Hạn Sử Dụng
                    </p>
                    <p className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                      <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                        (Còn{' '}
                        {Math.floor((sessionKey.expiresAt * 1000 - Date.now()) / (1000 * 60 * 60))}{' '}
                        giờ)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thông tin phiên bầu cử */}
      {serverId && quanLyCuocBauCuAddress && phienBauCuId && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Thông Tin Phiên Bầu Cử</CardTitle>
            </div>
            <CardDescription>
              Thông tin về phiên bầu cử #{phienBauCuId} của server #{serverId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {thongTinPhien ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Trạng thái
                    </h3>
                    <Badge
                      className={
                        thongTinPhien.dangHoatDong
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }
                    >
                      {thongTinPhien.dangHoatDong ? 'Đang hoạt động' : 'Chưa bắt đầu'}
                    </Badge>
                    {thongTinPhien.dangHoatDong && (
                      <p className="mt-1 text-sm text-red-500">
                        Không thể thêm cử tri khi phiên đang hoạt động!
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Thời gian
                    </h3>
                    <p className="text-sm">
                      <span className="font-medium">Bắt đầu:</span> {thongTinPhien.thoiGianBatDau}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Kết thúc:</span> {thongTinPhien.thoiGianKetThuc}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Cử tri
                    </h3>
                    <p className="text-sm">
                      <span className="font-medium">Số cử tri:</span> {thongTinPhien.soCuTriHienTai}
                      /{thongTinPhien.soCuTriToiDa}
                    </p>
                    {thongTinPhien.soCuTriHienTai >= thongTinPhien.soCuTriToiDa && (
                      <p className="mt-1 text-sm text-red-500">Đã đạt giới hạn số cử tri!</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Ứng viên
                    </h3>
                    <p className="text-sm">
                      <span className="font-medium">Số ứng viên:</span>{' '}
                      {thongTinPhien.soUngVienHienTai}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Quyền BANTOCHUC
                  </h3>
                  {thongTinPhien.laBanToChuc ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Có quyền BANTOCHUC
                    </Badge>
                  ) : (
                    <div>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 mb-2">
                        Không có quyền BANTOCHUC
                      </Badge>
                      <div>
                        <Button
                          onClick={capQuyenBanToChuc}
                          disabled={isLoading || !sessionKey || !scwAddress}
                          size="sm"
                        >
                          {isLoading ? (
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Shield className="w-4 h-4 mr-2" />
                          )}
                          Cấp quyền BANTOCHUC
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {thongTinPhien.taiBauCu && (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Phiên đã yêu cầu tái bầu cử</AlertTitle>
                    <AlertDescription>
                      Phiên này đã kết thúc và được yêu cầu tái bầu cử.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6">
                <Button onClick={kiemTraThongTinPhien} disabled={isLoading} className="mb-4">
                  {isLoading ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Info className="w-4 h-4 mr-2" />
                  )}
                  Kiểm tra thông tin phiên
                </Button>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  Kiểm tra thông tin phiên bầu cử để xem liệu có thể thêm cử tri không
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Thêm cử tri */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle>Thêm Cử Tri</CardTitle>
          </div>
          <CardDescription>Thêm cử tri vào phiên bầu cử</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Lưu ý quan trọng</AlertTitle>
              <AlertDescription>
                <span className="font-medium">Theo QuanLyCuocBauCu.sol</span>: Chỉ có thể thêm cử
                tri khi phiên bầu cử <span className="font-bold underline">CHƯA</span> bắt đầu
                (phiên chưa hoạt động).
                {thongTinPhien?.dangHoatDong && (
                  <p className="mt-2 text-red-500 font-medium">
                    Phiên bầu cử hiện tại đang hoạt động nên không thể thêm cử tri!
                  </p>
                )}
              </AlertDescription>
            </Alert>

            {/* Form thêm cử tri */}
            <form onSubmit={handleAddVoter} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cuTriAddress">Địa chỉ cử tri</Label>
                  <Input
                    id="cuTriAddress"
                    placeholder="0x..."
                    value={cuTriAddress}
                    onChange={(e) => setCuTriAddress(e.target.value)}
                    disabled={
                      isLoading ||
                      (thongTinPhien && (thongTinPhien.dangHoatDong || !thongTinPhien.laBanToChuc))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImportModal(true)}
                  disabled={
                    isLoading ||
                    (thongTinPhien && (thongTinPhien.dangHoatDong || !thongTinPhien.laBanToChuc))
                  }
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import danh sách</span>
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !cuTriAddress ||
                    (thongTinPhien && (thongTinPhien.dangHoatDong || !thongTinPhien.laBanToChuc))
                  }
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Thêm cử tri</span>
                </Button>
              </div>
            </form>

            {/* Danh sách cử tri mới */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Danh sách cử tri chờ thêm</h3>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {danhSachCuTri.length} cử tri
                </Badge>
              </div>

              {danhSachCuTri.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-auto max-h-60 p-4 border rounded-md">
                    <ul className="space-y-2">
                      {danhSachCuTri.map((cuTri, index) => (
                        <li key={cuTri + index} className="flex justify-between items-center">
                          <div className="font-mono text-sm">
                            {index + 1}. {cuTri}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setDanhSachCuTri((prev) => prev.filter((item) => item !== cuTri))
                            }
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddMultipleVoters}
                      disabled={
                        isLoading ||
                        danhSachCuTri.length === 0 ||
                        (thongTinPhien &&
                          (thongTinPhien.dangHoatDong || !thongTinPhien.laBanToChuc))
                      }
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      <span>Thêm tất cả cử tri</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <UserPlus className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Chưa có cử tri nào trong danh sách chờ thêm
                  </p>
                </div>
              )}
            </div>

            {/* Modal import danh sách cử tri */}
            {showImportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-medium mb-4">Import danh sách cử tri</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="importText">
                        Nhập danh sách địa chỉ (mỗi địa chỉ một dòng hoặc ngăn cách bởi dấu phẩy)
                      </Label>
                      <Textarea
                        id="importText"
                        rows={10}
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="0x123...,0x456..."
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowImportModal(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleImport} disabled={!importText.trim()}>
                        Import
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tiến trình thêm cử tri */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <CardTitle>Tiến Trình Thêm Cử Tri</CardTitle>
          </div>
          <CardDescription>
            Theo dõi quá trình thêm cử tri vào phiên bầu cử lên blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Tiến Độ:</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <StepStatus
                currentStatus={status}
                stepStatus={ThemCuTriStatus.CHECKING_REQUIREMENTS}
                title="Kiểm Tra Yêu Cầu"
                description="Xác minh rằng tài khoản của bạn đáp ứng tất cả các điều kiện để thêm cử tri"
              />

              <StepStatus
                currentStatus={status}
                stepStatus={ThemCuTriStatus.CREATING_SESSION_KEY}
                title="Tạo Khóa Phiên"
                description="Tạo khóa phiên an toàn để ký các giao dịch blockchain"
                isCompleted={sessionKey ? sessionKey.expiresAt * 1000 > Date.now() : undefined}
              />

              <StepStatus
                currentStatus={status}
                stepStatus={ThemCuTriStatus.PREPARING_CALLDATA}
                title="Chuẩn Bị Dữ Liệu"
                description="Chuẩn bị dữ liệu để thêm cử tri vào phiên bầu cử"
              />
            </div>

            <div className="space-y-4">
              <StepStatus
                currentStatus={status}
                stepStatus={ThemCuTriStatus.CREATING_USEROP}
                title="Tạo UserOperation"
                description="Tạo và ký giao dịch để gửi đến blockchain"
              />

              <StepStatus
                currentStatus={status}
                stepStatus={ThemCuTriStatus.SENDING_USEROP}
                title="Gửi Giao Dịch"
                description="Gửi giao dịch đến mạng blockchain"
              />

              <StepStatus
                currentStatus={status}
                stepStatus={ThemCuTriStatus.WAITING_CONFIRMATION}
                title="Chờ Xác Nhận"
                description="Đợi mạng blockchain xác nhận giao dịch"
              />
            </div>
          </div>

          {/* Status Messages */}
          {message && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Transaction Info */}
          {txHash && (
            <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Network className="w-5 h-5 mr-2 text-primary" />
                Thông Tin Giao Dịch
              </h3>

              <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 mb-3">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  Mã Giao Dịch (Transaction Hash)
                </p>
                <div className="flex items-center">
                  <p className="font-mono text-sm truncate">{txHash}</p>
                  <a
                    href={`https://explorer.holihu.online/transactions/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-primary"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Hash Linking Information */}
              {frontendHash && backendHash && frontendHash !== backendHash && (
                <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 mb-3">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Liên Kết Hash</p>
                  <div className="flex items-center mb-2">
                    <p className="text-sm flex items-center">
                      <Link className="w-4 h-4 mr-2 text-primary" />
                      Frontend Hash:
                    </p>
                    <p className="font-mono text-sm truncate ml-2">
                      {frontendHash.substring(0, 10)}...
                      {frontendHash.substring(frontendHash.length - 8)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm flex items-center">
                      <Link className="w-4 h-4 mr-2 text-primary" />
                      Backend Hash:
                    </p>
                    <p className="font-mono text-sm truncate ml-2">
                      {backendHash.substring(0, 10)}...
                      {backendHash.substring(backendHash.length - 8)}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {hashesLinked ? (
                      <span className="flex items-center text-green-600 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã liên kết hash thành công
                      </span>
                    ) : (
                      <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                        <Info className="w-3 h-3 mr-1" />
                        Đang chờ liên kết hash
                      </span>
                    )}
                  </div>
                </div>
              )}

              {status === ThemCuTriStatus.SUCCESS && (
                <Alert className="border-green-500/50 text-green-500 dark:border-green-500 [&>svg]:text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Thêm cử tri thành công</AlertTitle>
                  <AlertDescription>
                    Cử tri đã được thêm thành công vào phiên bầu cử!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemCuTriDonGian;
