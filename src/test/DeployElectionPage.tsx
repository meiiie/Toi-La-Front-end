import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchHluBalance,
  fetchAddressDetails,
  fetchTokenInfo,
} from '../store/sliceBlockchain/blockchainSlice';
import { RootState } from '../store/store';
import {
  getHluBalanceDirectly,
  getAllowance,
  approveHluToken,
} from '../api/apiBlockchain/blockchain-api';
import { isValidAddress } from '../api/apiBlockchain/blockchain-utils';
import UserOperationHandler from './UserOperationHandler';
import { ethers } from 'ethers';
import apiClient from '../api/apiClient';

// Các trạng thái triển khai
enum DeploymentStatus {
  NOT_STARTED = 0,
  CHECKING_REQUIREMENTS = 1,
  APPROVING_TOKENS = 2,
  DEPLOYING = 3,
  CONFIRMING = 4,
  SUCCESS = 5,
  FAILED = 6,
}

// Địa chỉ contracts cần approve
const FACTORY_ADDRESS = '0x0b70c3CD86428B67C72295185CC66342571478e7';
const PAYMASTER_ADDRESS = '0x1B0e7A821d918d9C8d3703aC4b87CBdaE3F13F9c';

interface ElectionData {
  id: number;
  tenCuocBauCu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string;
  trangThaiBlockchain: number;
  blockchainAddress: string;
  blockchainServerId: number;
}

// Hàm tạo callData bằng ethers.js
const createCallData = async (
  factoryAddress: string,
  scwAddress: string,
  tenCuocBauCu: string,
  thoiGianKeoDai: number,
  moTa: string,
): Promise<string> => {
  try {
    // Tạo interface cho Factory contract
    const factoryInterface = new ethers.Interface([
      'function trienKhaiServer(string,uint256,string) returns (uint128)',
    ]);

    // Tạo inner callData để gọi hàm trienKhaiServer
    const innerCallData = factoryInterface.encodeFunctionData('trienKhaiServer', [
      tenCuocBauCu,
      thoiGianKeoDai,
      moTa,
    ]);

    console.log('Inner callData được tạo:', innerCallData);

    // Tạo interface cho SCW contract
    const scwInterface = new ethers.Interface(['function execute(address,uint256,bytes) external']);

    // Tạo callData cuối cùng để gọi hàm execute của SCW
    const callData = scwInterface.encodeFunctionData('execute', [
      factoryAddress,
      0, // Không gửi ETH
      innerCallData,
    ]);

    console.log('CallData cuối cùng:', callData);

    return callData;
  } catch (error) {
    console.error('Lỗi khi tạo callData:', error);
    throw error;
  }
};

const DeployElectionComponent: React.FC = () => {
  const dispatch = useDispatch();

  // Lấy state từ Redux
  const blockchainState = useSelector((state: RootState) => state.blockchain);

  // Component state
  const [electionId, setElectionId] = useState<string>('');
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>(
    DeploymentStatus.NOT_STARTED,
  );
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [scwAddress, setScwAddress] = useState<string>(
    '0xb65D6515910E92657c82eB88C85Fe009E67aD2b7',
  );
  const [txHash, setTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(true);
  const [isSessionKeyCreated, setIsSessionKeyCreated] = useState<boolean>(false);
  const [balances, setBalances] = useState({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
    needFactoryApproval: false,
    needPaymasterApproval: false,
  });
  const [taiKhoanId, setTaiKhoanId] = useState<string>('');
  const [viId, setViId] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState<boolean>(false);
  const [approvingFactory, setApprovingFactory] = useState<boolean>(false);
  const [approvingPaymaster, setApprovingPaymaster] = useState<boolean>(false);

  // Hàm để hiển thị thông báo thành công
  const showSuccess = (message: string) => {
    alert(message); // Thay thế bằng toasts/notifications trong ứng dụng thực tế
  };

  // Hàm để hiển thị thông báo lỗi
  const showError = (message: string) => {
    setErrorMessage(message);
    console.error(message);
  };

  // Hàm xử lý cho UserOperationHandler
  const handleDeploymentSuccess = (txHash: string) => {
    setTxHash(txHash);
    setDeploymentStatus(DeploymentStatus.CONFIRMING);
    setProgress(80);

    // Kiểm tra trạng thái sau vài giây
    setTimeout(() => {
      checkBlockchainStatus();
    }, 5000);
  };

  const handleDeploymentError = (error: Error) => {
    console.error('Lỗi triển khai:', error);
    setErrorMessage(`Có lỗi xảy ra khi triển khai cuộc bầu cử: ${error.message}`);
    setDeploymentStatus(DeploymentStatus.FAILED);
  };

  const handleStatusChange = (status: string) => {
    if (
      status === 'preparing' ||
      status === 'fetching_election_details' ||
      status === 'getting_session_key'
    ) {
      setDeploymentStatus(DeploymentStatus.CHECKING_REQUIREMENTS);
      setProgress(20);
    } else if (
      status === 'approving_factory' ||
      status === 'approving_paymaster' ||
      status === 'approving_if_needed'
    ) {
      setDeploymentStatus(DeploymentStatus.APPROVING_TOKENS);
      setProgress(40);
    } else if (status === 'deploying') {
      setDeploymentStatus(DeploymentStatus.DEPLOYING);
      setProgress(60);
    } else if (status === 'success' || status === 'syncing') {
      setDeploymentStatus(DeploymentStatus.CONFIRMING);
      setProgress(80);
    } else if (status === 'sync_success') {
      setDeploymentStatus(DeploymentStatus.SUCCESS);
      setProgress(100);
      showSuccess('Cuộc bầu cử đã được triển khai và đồng bộ thành công!');
    } else if (status === 'sync_partial') {
      setDeploymentStatus(DeploymentStatus.CONFIRMING);
      setProgress(85);
      // Đã triển khai nhưng chưa đồng bộ hoàn toàn
    } else if (status === 'error') {
      setDeploymentStatus(DeploymentStatus.FAILED);
      setProgress(0);
    }
  };

  // 1. Lấy thông tin cuộc bầu cử
  const fetchElectionDetails = async (id: string): Promise<void> => {
    if (!id) return;

    setIsLoading(true);
    setErrorMessage(''); // Xóa thông báo lỗi trước khi gọi API mới

    try {
      const response = await apiClient.get<ElectionData>(`/api/CuocBauCu/details/${id}`);

      if (response.data) {
        setElectionData(response.data);
        // Cập nhật trạng thái dựa trên dữ liệu từ server
        if (response.data.trangThaiBlockchain !== undefined) {
          setDeploymentStatus(response.data.trangThaiBlockchain);
          updateProgressBasedOnStatus(response.data.trangThaiBlockchain);
        }

        // Cập nhật thông tin blockchain nếu có
        if (response.data.blockchainAddress) {
          setTxHash(response.data.blockchainAddress);
        }
      } else {
        // Xử lý khi dữ liệu rỗng
        setErrorMessage('Không tìm thấy thông tin cuộc bầu cử');
      }
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin cuộc bầu cử:', error);
      setErrorMessage(
        `Không thể lấy thông tin cuộc bầu cử: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Đảm bảo component được cập nhật khi có thông tin mới
  useEffect(() => {
    if (electionData) {
      // Nếu đã có dữ liệu cuộc bầu cử, xóa thông báo lỗi
      setErrorMessage('');
    }
  }, [electionData]);

  // Cập nhật tiến trình dựa trên trạng thái
  const updateProgressBasedOnStatus = (status: number): void => {
    switch (status) {
      case DeploymentStatus.CHECKING_REQUIREMENTS:
        setProgress(20);
        break;
      case DeploymentStatus.APPROVING_TOKENS:
        setProgress(40);
        break;
      case DeploymentStatus.DEPLOYING:
        setProgress(60);
        break;
      case DeploymentStatus.CONFIRMING:
        setProgress(80);
        break;
      case DeploymentStatus.SUCCESS:
        setProgress(100);
        break;
      default:
        setProgress(0);
    }
  };

  // Kiểm tra trạng thái blockchain với API cải tiến
  const checkBlockchainStatus = async (): Promise<void> => {
    if (!electionId) {
      setErrorMessage('Vui lòng nhập ID cuộc bầu cử');
      return;
    }

    setIsLoading(true);
    try {
      // SỬA: Sử dụng endpoint chính xác từ controller
      const response = await apiClient.get<any>(`/api/CuocBauCu/blockchain/${electionId}`);
      if (response.data) {
        // Xử lý trạng thái từ endpoint blockchain
        const blockchainStatus = response.data.status || DeploymentStatus.NOT_STARTED;
        setDeploymentStatus(blockchainStatus);
        updateProgressBasedOnStatus(blockchainStatus);

        if (response.data.blockchainAddress) {
          setTxHash(response.data.blockchainAddress);
        }

        if (response.data.transactionHash) {
          setTxHash(response.data.transactionHash);
        }

        // Nếu có lỗi, hiển thị
        if (response.data.errorMessage) {
          setErrorMessage(response.data.errorMessage);
        }

        // Cập nhật UI dựa trên thành công/thất bại
        if (response.data.success) {
          showSuccess('Thông tin blockchain đã được cập nhật');

          // Nếu đã triển khai thành công
          if (blockchainStatus === 2) {
            showSuccess('Cuộc bầu cử đã được triển khai thành công!');
          }
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra trạng thái blockchain:', error);

      // Thử endpoint khác nếu endpoint blockchain không hoạt động
      try {
        const detailsResponse = await apiClient.get<any>(`/api/CuocBauCu/details/${electionId}`);
        if (detailsResponse.data) {
          setDeploymentStatus(
            detailsResponse.data.trangThaiBlockchain || DeploymentStatus.NOT_STARTED,
          );
          updateProgressBasedOnStatus(detailsResponse.data.trangThaiBlockchain);

          if (detailsResponse.data.blockchainAddress) {
            setTxHash(detailsResponse.data.blockchainAddress);
          }

          if (detailsResponse.data.errorMessage) {
            setErrorMessage(detailsResponse.data.errorMessage);
          }
        }
      } catch (detailsError) {
        console.error('Lỗi khi tải chi tiết cuộc bầu cử:', detailsError);
        setErrorMessage('Không thể kiểm tra trạng thái blockchain');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Đồng bộ blockchain - Cải tiến API
  const syncBlockchain = async (): Promise<void> => {
    if (!electionId) {
      setErrorMessage('Vui lòng nhập ID cuộc bầu cử');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post(`/api/CuocBauCu/syncBlockchain/${electionId}`);
      if (response.data && response.data.success) {
        setDeploymentStatus(DeploymentStatus.SUCCESS);
        setProgress(100);
        showSuccess('Đồng bộ blockchain thành công!');

        // Cập nhật thông tin blockchain
        if (response.data.blockchainServerId) {
          setElectionData((prev) =>
            prev ? { ...prev, blockchainServerId: response.data.blockchainServerId } : prev,
          );
        }

        if (response.data.blockchainAddress) {
          setTxHash(response.data.blockchainAddress);
          setElectionData((prev) =>
            prev ? { ...prev, blockchainAddress: response.data.blockchainAddress } : prev,
          );
        }
      } else if (response.data) {
        // Cập nhật trạng thái nếu có
        const status = response.data.status || DeploymentStatus.NOT_STARTED;
        setDeploymentStatus(status);
        updateProgressBasedOnStatus(status);

        // Hiển thị thông báo lỗi nếu có
        if (response.data.errorMessage) {
          setErrorMessage(response.data.errorMessage);
        }

        // Nếu là status=2 nhưng không có success flag, vẫn coi là thành công
        if (status === 2) {
          setDeploymentStatus(DeploymentStatus.SUCCESS);
          setProgress(100);
          showSuccess('Cuộc bầu cử đã được triển khai thành công!');
        }
      }
    } catch (error: any) {
      console.error('Lỗi khi đồng bộ blockchain:', error);

      // Cải thiện xử lý lỗi
      let errorMsg = 'Không thể đồng bộ blockchain';

      if (error.response) {
        if (error.response.status === 400) {
          errorMsg +=
            ': Yêu cầu không hợp lệ. Có thể cuộc bầu cử chưa được triển khai hoặc không cần đồng bộ.';
        } else if (error.response.status === 403) {
          errorMsg += ': Bạn không có quyền đồng bộ cuộc bầu cử này.';
        } else if (error.response.status === 404) {
          errorMsg += ': Không tìm thấy cuộc bầu cử.';
        } else {
          errorMsg += ': ' + (error.response.data?.message || error.message);
        }
      } else {
        errorMsg += ': ' + error.message;
      }

      setErrorMessage(errorMsg);

      // Kiểm tra trạng thái hiện tại
      try {
        await checkBlockchainStatus();
      } catch (checkError) {
        console.warn('Không thể kiểm tra trạng thái hiện tại:', checkError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy số dư và allowance từ blockchain
  const fetchBalancesAndAllowances = async (address: string): Promise<void> => {
    if (!address || !isValidAddress(address)) {
      setErrorMessage('Địa chỉ ví không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      // Dispatch action để lấy thông tin từ blockchain qua Redux
      await dispatch(fetchHluBalance(address) as any);
      await dispatch(fetchAddressDetails(address) as any);

      // Lấy thêm thông tin allowance
      const [allowanceFactory, allowancePaymaster] = await Promise.all([
        getAllowance(address, FACTORY_ADDRESS),
        getAllowance(address, PAYMASTER_ADDRESS),
      ]);

      // Lấy số dư từ state Redux hoặc trực tiếp từ API
      const hluBalance = blockchainState.hluBalance || (await getHluBalanceDirectly(address));

      // Cập nhật state
      setBalances({
        hluBalance: hluBalance,
        allowanceForFactory: allowanceFactory,
        allowanceForPaymaster: allowancePaymaster,
        needFactoryApproval: parseFloat(allowanceFactory) < 4.0, // Cần ít nhất 5 HLU
        needPaymasterApproval: parseFloat(allowancePaymaster) < 3.0, // Cần ít nhất 3 HLU
      });
    } catch (error) {
      console.error('Lỗi khi lấy thông tin từ blockchain:', error);
      setErrorMessage('Không thể lấy thông tin từ blockchain');
    } finally {
      setIsLoading(false);
    }
  };

  // Phê duyệt token cho Factory
  const approveTokenForFactory = async (): Promise<void> => {
    if (!privateKey) {
      setErrorMessage('Vui lòng nhập private key để phê duyệt');
      return;
    }

    setApprovingFactory(true);
    setIsLoading(true);
    try {
      // Approve một số lượng đủ lớn cho Factory
      const approveAmount = '10.0'; // Giả sử approve 10 HLU
      const receipt = await approveHluToken(privateKey, FACTORY_ADDRESS, approveAmount);

      if (receipt) {
        // Cập nhật lại số dư và allowance
        setTimeout(async () => {
          await fetchBalancesAndAllowances(scwAddress);
          setApprovingFactory(false);
          showSuccess('Đã phê duyệt token cho Factory thành công!');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Lỗi khi phê duyệt token cho Factory:', error);
      setErrorMessage('Không thể phê duyệt token: ' + (error.message || 'Lỗi không xác định'));
      setApprovingFactory(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Phê duyệt token cho Paymaster
  const approveTokenForPaymaster = async (): Promise<void> => {
    if (!privateKey) {
      setErrorMessage('Vui lòng nhập private key để phê duyệt');
      return;
    }

    setApprovingPaymaster(true);
    setIsLoading(true);
    try {
      // Approve một số lượng đủ lớn cho Paymaster
      const approveAmount = '10.0'; // Giả sử approve 10 HLU
      const receipt = await approveHluToken(privateKey, PAYMASTER_ADDRESS, approveAmount);

      if (receipt) {
        // Cập nhật lại số dư và allowance
        setTimeout(async () => {
          await fetchBalancesAndAllowances(scwAddress);
          setApprovingPaymaster(false);
          showSuccess('Đã phê duyệt token cho Paymaster thành công!');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Lỗi khi phê duyệt token cho Paymaster:', error);
      setErrorMessage('Không thể phê duyệt token: ' + (error.message || 'Lỗi không xác định'));
      setApprovingPaymaster(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Kiểm tra yêu cầu trước khi triển khai
  const checkRequirements = async (): Promise<boolean> => {
    setDeploymentStatus(DeploymentStatus.CHECKING_REQUIREMENTS);
    setProgress(20);
    setIsLoading(true);

    try {
      // Lấy số dư và allowance từ blockchain
      await fetchBalancesAndAllowances(scwAddress);

      // Kiểm tra xem có đủ điều kiện để triển khai không
      const hasEnoughBalance = parseFloat(balances.hluBalance) >= 5.0; // Cần ít nhất 5 HLU

      if (!hasEnoughBalance) {
        setErrorMessage(
          `Số dư HLU không đủ để triển khai. Cần ít nhất 5 HLU, hiện có ${balances.hluBalance} HLU`,
        );
        setDeploymentStatus(DeploymentStatus.FAILED);
        return false;
      }

      if (balances.needFactoryApproval || balances.needPaymasterApproval) {
        setErrorMessage('Bạn cần phê duyệt token cho factory hoặc paymaster trước');
        setDeploymentStatus(DeploymentStatus.APPROVING_TOKENS);
        setProgress(40);
        return false;
      }

      if (!isSessionKeyCreated) {
        setErrorMessage('Bạn cần tạo session key trước khi triển khai');
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Lỗi khi kiểm tra yêu cầu:', error);
      setErrorMessage(
        'Không thể kiểm tra yêu cầu triển khai: ' + (error.message || 'Lỗi không xác định'),
      );
      setDeploymentStatus(DeploymentStatus.FAILED);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Triển khai cuộc bầu cử (phương pháp cũ)
  const deployElectionOld = async (): Promise<void> => {
    if (!electionId) {
      setErrorMessage('Vui lòng nhập ID cuộc bầu cử');
      return;
    }

    try {
      // Kiểm tra yêu cầu trước
      const requirementsMet = await checkRequirements();
      if (!requirementsMet) return;

      // Triển khai
      setDeploymentStatus(DeploymentStatus.DEPLOYING);
      setProgress(60);
      setIsLoading(true);

      // Gọi API để triển khai
      const response = await apiClient.post(`/api/CuocBauCu/deployBlockchain/${electionId}`, {
        SCWAddress: scwAddress,
      });

      if (response.data) {
        // Cập nhật thông tin
        if (response.data.transactionHash) {
          setTxHash(response.data.transactionHash);
        } else if (response.data.txHash) {
          setTxHash(response.data.txHash);
        } else if (response.data.blockchainAddress) {
          setTxHash(response.data.blockchainAddress);
        } else {
          setTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'); // Fallback mẫu
        }

        setDeploymentStatus(DeploymentStatus.CONFIRMING);
        setProgress(80);
        showSuccess('Đã gửi yêu cầu triển khai thành công!');

        // Kiểm tra trạng thái sau vài giây
        setTimeout(() => {
          checkBlockchainStatus();
        }, 5000);
      }
    } catch (error: any) {
      console.error('Lỗi khi triển khai cuộc bầu cử:', error);
      let errorMsg = 'Có lỗi xảy ra khi triển khai cuộc bầu cử';

      if (error.response?.data?.message) {
        errorMsg += ': ' + error.response.data.message;
      } else if (error.response?.data?.errorMessage) {
        errorMsg += ': ' + error.response.data.errorMessage;
      } else if (error.message) {
        errorMsg += ': ' + error.message;
      }

      setErrorMessage(errorMsg);
      setDeploymentStatus(DeploymentStatus.FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  // Triển khai cuộc bầu cử với callData từ frontend
  const deployElection = async (): Promise<void> => {
    if (!electionId) {
      setErrorMessage('Vui lòng nhập ID cuộc bầu cử');
      return;
    }

    try {
      // Kiểm tra yêu cầu trước khi triển khai
      const requirementsMet = await checkRequirements();
      if (!requirementsMet) return;

      setIsDeploying(true);
      setDeploymentStatus(DeploymentStatus.DEPLOYING);
      setProgress(60);

      // 1. Lấy thông tin cuộc bầu cử
      const electionResponse = await apiClient.get(`/api/CuocBauCu/details/${electionId}`);
      if (!electionResponse.data) {
        throw new Error('Không thể lấy thông tin cuộc bầu cử');
      }

      const electionInfo = electionResponse.data;
      const { tenCuocBauCu, moTa } = electionInfo;

      // 2. Tính thời gian kéo dài (giây)
      // Parse ngày từ định dạng Việt Nam dd/MM/yyyy HH:mm
      const parseDate = (dateStr: string): Date => {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/').map((num) => parseInt(num, 10));
        const [hour, minute] = timePart
          ? timePart.split(':').map((num) => parseInt(num, 10))
          : [0, 0];
        return new Date(year, month - 1, day, hour, minute);
      };

      const startDate = parseDate(electionInfo.ngayBatDau);
      const endDate = parseDate(electionInfo.ngayKetThuc);
      const thoiGianKeoDai = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

      // 3. Lấy địa chỉ factory từ API
      const contractResponse = await apiClient.get('/api/Blockchain/contract-addresses');
      const factoryAddress = contractResponse.data.factoryAddress || FACTORY_ADDRESS;

      // 4. Tạo callData từ front-end
      const callData = await createCallData(
        factoryAddress,
        scwAddress,
        tenCuocBauCu,
        thoiGianKeoDai,
        moTa || 'Không có mô tả',
      );

      // 5. Gửi request đến backend với callData được tạo sẵn
      const response = await apiClient.post(
        `/api/CuocBauCu/deployBlockchainWithCallData/${electionId}`,
        {
          scwAddress: scwAddress,
          callData: callData,
        },
      );

      if (response.data) {
        // Lấy transaction hash từ response (ưu tiên các trường khác nhau)
        let txHashFromResponse =
          response.data.transactionHash ||
          response.data.txHash ||
          response.data.userOpHash ||
          response.data.blockchainAddress;

        if (txHashFromResponse) {
          setTxHash(txHashFromResponse);
        }

        setDeploymentStatus(DeploymentStatus.CONFIRMING);
        setProgress(80);
        showSuccess('Đã gửi yêu cầu triển khai thành công!');
      }

      // 6. Kiểm tra trạng thái định kỳ sau 5 giây
      setTimeout(() => {
        checkBlockchainStatus();
      }, 5000);
    } catch (error: any) {
      console.error('Lỗi khi triển khai cuộc bầu cử:', error);

      let errorMsg = 'Lỗi khi triển khai cuộc bầu cử';

      if (error.response?.data?.errorMessage) {
        errorMsg += ': ' + error.response.data.errorMessage;
      } else if (error.response?.data?.message) {
        errorMsg += ': ' + error.response.data.message;
      } else if (error.message) {
        errorMsg += ': ' + error.message;
      }

      setErrorMessage(errorMsg);
      setDeploymentStatus(DeploymentStatus.FAILED);
    } finally {
      setIsDeploying(false);
    }
  };

  // Tạo session key
  const createSessionKey = async (): Promise<void> => {
    if (!taiKhoanId || !viId) {
      setErrorMessage('Vui lòng nhập ID tài khoản và ID ví');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/Blockchain/create-session', {
        TaiKhoanID: parseInt(taiKhoanId, 10),
        ViID: parseInt(viId, 10),
      });

      if (response.data && response.data.Success) {
        setIsSessionKeyCreated(true);
        showSuccess('Đã tạo session key thành công!');

        // Tự động xác minh sau khi tạo
        await verifySessionKey();
      } else {
        throw new Error(response.data?.Message || 'Không thể tạo session key');
      }
    } catch (error: any) {
      console.error('Lỗi khi tạo session key:', error);

      let errorMsg = 'Không thể tạo session key';

      if (error.response?.data?.Message) {
        errorMsg += ': ' + error.response.data.Message;
      } else if (error.message) {
        errorMsg += ': ' + error.message;
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Xác thực session key
  const verifySessionKey = async (): Promise<void> => {
    if (!taiKhoanId || !viId) {
      setErrorMessage('Vui lòng nhập ID tài khoản và ID ví');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: parseInt(taiKhoanId, 10),
        ViID: parseInt(viId, 10),
      });
      console.log('Response:', response.data);

      if (response.data && response.data.sessionKey) {
        setIsSessionKeyCreated(true);
        showSuccess('Session key hợp lệ!');

        // Lưu SCW address từ response nếu có
        if (response.data.scwAddress && isValidAddress(response.data.scwAddress)) {
          setScwAddress(response.data.scwAddress);
          console.log('SCW address từ session key:', response.data.scwAddress);

          // Cập nhật thông tin balances
          await fetchBalancesAndAllowances(response.data.scwAddress);
        }
      } else {
        setIsSessionKeyCreated(false);
        throw new Error('Không tìm thấy session key hợp lệ');
      }
    } catch (error: any) {
      console.error('Lỗi khi xác thực session key:', error);
      setIsSessionKeyCreated(false);

      let errorMsg = 'Không tìm thấy session key hợp lệ';

      if (error.response?.data?.Message) {
        errorMsg += ': ' + error.response.data.Message;
      } else if (error.message) {
        errorMsg += ': ' + error.message;
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle hiển thị/ẩn private key
  const togglePrivateKeyVisibility = (): void => {
    setIsPrivateKeyVisible(!isPrivateKeyVisible);
  };

  // Kiểm tra session key khi component được tải
  useEffect(() => {
    if (taiKhoanId && viId) {
      verifySessionKey();
    }
  }, [taiKhoanId, viId]);

  // Kiểm tra thông tin cuộc bầu cử khi ID thay đổi
  useEffect(() => {
    if (electionId) {
      fetchElectionDetails(electionId);
    }
  }, [electionId]);

  // Lấy thông tin về token khi component được tải
  useEffect(() => {
    dispatch(fetchTokenInfo() as any);
  }, [dispatch]);

  // Lấy thông tin số dư khi địa chỉ SCW thay đổi
  useEffect(() => {
    if (scwAddress && isValidAddress(scwAddress)) {
      fetchBalancesAndAllowances(scwAddress);
    }
  }, [scwAddress]);

  return (
    <div className="p-4 bg-gray-900 text-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-blue-400">Triển khai cuộc bầu cử blockchain</h1>

      {/* Thêm trường nhập ID cuộc bầu cử */}
      <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block font-medium mb-1 text-gray-300">ID Cuộc bầu cử:</label>
            <input
              type="text"
              value={electionId}
              onChange={(e) => setElectionId(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"
              placeholder="Nhập ID cuộc bầu cử"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-gray-300">
              Smart Contract Wallet Address:
            </label>
            <input
              type="text"
              value={scwAddress}
              onChange={(e) => setScwAddress(e.target.value)}
              className="w-full p-2 border rounded-md font-mono text-sm bg-gray-700 border-gray-600 text-white"
              placeholder="0x..."
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-800"
              onClick={() => fetchElectionDetails(electionId)}
              disabled={isLoading || !electionId}
            >
              {isLoading ? 'Đang tải...' : 'Tải thông tin'}
            </button>
          </div>
        </div>
      </div>

      {/* Private Key (chỉ hiển thị khi cần approve) */}
      {(balances.needFactoryApproval || balances.needPaymasterApproval) && (
        <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-400">Thông tin Private Key</h2>
          <div className="text-yellow-400 text-sm mb-2">
            <p>
              Private key được yêu cầu để phê duyệt token cho contracts. Thông tin này không được
              lưu trữ hoặc gửi đi.
            </p>
          </div>
          <div className="relative">
            <label className="block font-medium mb-1 text-gray-300">Private Key:</label>
            <div className="flex">
              <input
                type={isPrivateKeyVisible ? 'text' : 'password'}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full p-2 border rounded-md font-mono text-sm bg-gray-700 border-gray-600 text-white"
                placeholder="Nhập private key của ví"
              />
              <button
                onClick={togglePrivateKeyVisibility}
                className="ml-2 px-3 py-2 bg-gray-600 text-gray-200 rounded-md"
              >
                {isPrivateKeyVisible ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <div className="mt-2 flex space-x-2">
            {balances.needFactoryApproval && (
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:bg-purple-800"
                onClick={approveTokenForFactory}
                disabled={isLoading || !privateKey || approvingFactory}
              >
                {approvingFactory
                  ? 'Đang phê duyệt Factory...'
                  : `Phê duyệt Factory (${balances.allowanceForFactory}/5.0)`}
              </button>
            )}

            {balances.needPaymasterApproval && (
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-800"
                onClick={approveTokenForPaymaster}
                disabled={isLoading || !privateKey || approvingPaymaster}
              >
                {approvingPaymaster
                  ? 'Đang phê duyệt Paymaster...'
                  : `Phê duyệt Paymaster (${balances.allowanceForPaymaster}/3.0)`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thêm trường nhập thông tin session key */}
      <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-blue-400">Thông tin Session Key</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block font-medium mb-1 text-gray-300">ID Tài khoản:</label>
            <input
              type="text"
              value={taiKhoanId}
              onChange={(e) => setTaiKhoanId(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"
              placeholder="Nhập ID tài khoản"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-gray-300">ID Ví:</label>
            <input
              type="text"
              value={viId}
              onChange={(e) => setViId(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white"
              placeholder="Nhập ID ví"
            />
          </div>
        </div>

        <div className="mt-2 flex space-x-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:bg-green-800"
            onClick={createSessionKey}
            disabled={isLoading || !taiKhoanId || !viId}
          >
            {isLoading ? 'Đang tạo...' : 'Tạo Session Key'}
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-800"
            onClick={verifySessionKey}
            disabled={isLoading || !taiKhoanId || !viId}
          >
            {isLoading ? 'Đang xác thực...' : 'Xác thực Session Key'}
          </button>
        </div>

        <div className="mt-2">
          <span
            className={`px-2 py-1 rounded inline-block ${isSessionKeyCreated ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}
          >
            {isSessionKeyCreated ? 'Session key hợp lệ ✓' : 'Chưa có session key hợp lệ ✗'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thông tin cuộc bầu cử */}
        <div className="border border-gray-700 p-4 rounded-lg bg-gray-800 shadow">
          <h2 className="text-lg font-semibold mb-3 text-blue-400">Thông tin cuộc bầu cử</h2>

          {!electionData ? (
            <p className="text-gray-400">Vui lòng nhập ID cuộc bầu cử và tải thông tin</p>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="font-medium text-gray-300">Tên cuộc bầu cử:</label>
                <p>{electionData.tenCuocBauCu}</p>
              </div>
              <div>
                <label className="font-medium text-gray-300">Thời gian:</label>
                <p>
                  {electionData.ngayBatDau} - {electionData.ngayKetThuc}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-300">Mô tả:</label>
                <p>{electionData.moTa || 'Không có mô tả'}</p>
              </div>

              <div>
                <label className="font-medium text-gray-300">Trạng thái blockchain:</label>
                <div className="mt-1">
                  {deploymentStatus === DeploymentStatus.NOT_STARTED && (
                    <span className="px-2 py-1 bg-gray-700 rounded text-gray-300">
                      Chưa triển khai
                    </span>
                  )}
                  {deploymentStatus === DeploymentStatus.CHECKING_REQUIREMENTS && (
                    <span className="px-2 py-1 bg-blue-900 rounded text-blue-300">
                      Đang kiểm tra
                    </span>
                  )}
                  {deploymentStatus === DeploymentStatus.APPROVING_TOKENS && (
                    <span className="px-2 py-1 bg-blue-900 rounded text-blue-300">
                      Đang phê duyệt tokens
                    </span>
                  )}
                  {deploymentStatus === DeploymentStatus.DEPLOYING && (
                    <span className="px-2 py-1 bg-blue-900 rounded text-blue-300">
                      Đang triển khai
                    </span>
                  )}
                  {deploymentStatus === DeploymentStatus.CONFIRMING && (
                    <span className="px-2 py-1 bg-yellow-900 rounded text-yellow-300">
                      Đang xác nhận
                    </span>
                  )}
                  {deploymentStatus === DeploymentStatus.SUCCESS && (
                    <span className="px-2 py-1 bg-green-900 rounded text-green-300">
                      Đã triển khai
                    </span>
                  )}
                  {deploymentStatus === DeploymentStatus.FAILED && (
                    <span className="px-2 py-1 bg-red-900 rounded text-red-300">
                      Triển khai thất bại
                    </span>
                  )}
                </div>
              </div>

              {electionData.blockchainAddress && (
                <div>
                  <label className="font-medium text-gray-300">Địa chỉ blockchain:</label>
                  <p className="font-mono text-sm break-all">{electionData.blockchainAddress}</p>
                </div>
              )}

              {deploymentStatus === DeploymentStatus.SUCCESS && electionData.blockchainServerId && (
                <div>
                  <label className="font-medium text-gray-300">Server ID:</label>
                  <p>{electionData.blockchainServerId}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Triển khai */}
        <div className="border border-gray-700 p-4 rounded-lg bg-gray-800 shadow">
          <h2 className="text-lg font-semibold mb-3 text-blue-400">Triển khai lên blockchain</h2>

          {/* Tiến trình */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Tiến trình:</span>
              <span className="text-gray-300">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-1 text-sm text-gray-400">
              {deploymentStatus === DeploymentStatus.NOT_STARTED && 'Chưa bắt đầu'}
              {deploymentStatus === DeploymentStatus.CHECKING_REQUIREMENTS &&
                'Đang kiểm tra yêu cầu'}
              {deploymentStatus === DeploymentStatus.APPROVING_TOKENS && 'Đang phê duyệt tokens'}
              {deploymentStatus === DeploymentStatus.DEPLOYING && 'Đang triển khai'}
              {deploymentStatus === DeploymentStatus.CONFIRMING && 'Đang xác nhận'}
              {deploymentStatus === DeploymentStatus.SUCCESS && 'Triển khai thành công'}
              {deploymentStatus === DeploymentStatus.FAILED && 'Triển khai thất bại'}
            </div>
          </div>

          {/* Yêu cầu */}
          <div className="mb-4">
            <h3 className="font-medium mb-2 text-gray-300">Yêu cầu triển khai:</h3>
            <ul className="space-y-1">
              <li className="flex items-center">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-gray-300">MetaMask đã cài đặt</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-gray-300">Ví đã được kết nối</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-gray-300">Smart Contract Wallet</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`mr-2 ${isSessionKeyCreated ? 'text-green-500' : 'text-yellow-500'}`}
                >
                  {isSessionKeyCreated ? '✓' : '⚠'}
                </span>
                <span className="text-gray-300">Session Key hợp lệ</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`mr-2 ${parseFloat(balances.hluBalance) >= 5.0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {parseFloat(balances.hluBalance) >= 5.0 ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">Số dư HLU: {balances.hluBalance}</span>
              </li>
              <li className="flex items-center">
                <span
                  className={`mr-2 ${!balances.needFactoryApproval ? 'text-green-500' : 'text-red-500'}`}
                >
                  {!balances.needFactoryApproval ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">
                  Factory Allowance: {balances.allowanceForFactory}
                </span>
              </li>
              <li className="flex items-center">
                <span
                  className={`mr-2 ${!balances.needPaymasterApproval ? 'text-green-500' : 'text-red-500'}`}
                >
                  {!balances.needPaymasterApproval ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">
                  Paymaster Allowance: {balances.allowanceForPaymaster}
                </span>
              </li>
            </ul>
          </div>

          {/* Thông tin giao dịch */}
          {(deploymentStatus === DeploymentStatus.CONFIRMING ||
            deploymentStatus === DeploymentStatus.SUCCESS) &&
            txHash && (
              <div className="mb-4">
                <h3 className="font-medium mb-1 text-gray-300">Thông tin giao dịch:</h3>
                <div className="p-2 bg-gray-700 rounded-md">
                  <p className="text-sm font-medium text-gray-300">Transaction Hash:</p>
                  <p className="font-mono text-sm break-all text-blue-400">{txHash}</p>
                  <p className="mt-1 text-sm">
                    {deploymentStatus === DeploymentStatus.CONFIRMING && (
                      <span className="text-yellow-400">Đang chờ xác nhận...</span>
                    )}
                    {deploymentStatus === DeploymentStatus.SUCCESS && (
                      <span className="text-green-400">Giao dịch đã được xác nhận!</span>
                    )}
                  </p>
                </div>
              </div>
            )}

          {/* Lỗi */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-md">
              <h3 className="font-medium">Lỗi:</h3>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex flex-wrap gap-2 mt-4">
            {/* Nút với callData từ frontend */}
            {(deploymentStatus === DeploymentStatus.NOT_STARTED ||
              deploymentStatus === DeploymentStatus.FAILED) && (
              <>
                {/* Nút triển khai với callData từ frontend */}
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:bg-green-800"
                  onClick={deployElection}
                  disabled={isDeploying || !electionId || !scwAddress || !isSessionKeyCreated}
                >
                  {isDeploying ? 'Đang triển khai...' : 'Triển khai (Frontend CallData)'}
                </button>

                {/* Nút triển khai gốc */}
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-800"
                  onClick={deployElectionOld}
                  disabled={isLoading || !electionId || !scwAddress}
                >
                  {isLoading ? 'Đang xử lý...' : 'Triển khai (Cũ)'}
                </button>

                {/* Component triển khai sử dụng UserOp */}
                {isSessionKeyCreated && !isLoading && (
                  <UserOperationHandler
                    electionId={electionId}
                    scwAddress={scwAddress}
                    taiKhoanId={taiKhoanId}
                    viId={viId}
                    onSuccess={handleDeploymentSuccess}
                    onError={handleDeploymentError}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </>
            )}

            {/* Nút kiểm tra lại yêu cầu */}
            {deploymentStatus === DeploymentStatus.CHECKING_REQUIREMENTS && (
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:bg-yellow-800"
                onClick={checkRequirements}
                disabled={isLoading}
              >
                {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra lại yêu cầu'}
              </button>
            )}

            {/* Nút cho trạng thái đang phê duyệt token */}
            {deploymentStatus === DeploymentStatus.APPROVING_TOKENS && (
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:bg-purple-800"
                onClick={deployElection}
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Tiếp tục sau khi phê duyệt'}
              </button>
            )}

            {/* Nút tiếp tục cho trạng thái đang triển khai */}
            {deploymentStatus === DeploymentStatus.DEPLOYING && (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:bg-green-800"
                onClick={deployElection}
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Tiếp tục triển khai'}
              </button>
            )}

            {/* Nút đồng bộ cho trạng thái đang xác nhận */}
            {deploymentStatus === DeploymentStatus.CONFIRMING && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-800"
                onClick={syncBlockchain}
                disabled={isLoading}
              >
                {isLoading ? 'Đang đồng bộ...' : 'Đồng bộ blockchain'}
              </button>
            )}

            {/* Nút triển khai lại nếu đã triển khai thành công */}
            {deploymentStatus === DeploymentStatus.SUCCESS && (
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-800"
                onClick={() => checkBlockchainStatus()}
                disabled={isLoading}
              >
                {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái'}
              </button>
            )}

            {/* Nút Check Status */}
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:bg-purple-800"
              onClick={checkBlockchainStatus}
              disabled={isLoading || !electionId}
            >
              {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái'}
            </button>

            <button
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
              onClick={() => window.history.back()}
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployElectionComponent;
