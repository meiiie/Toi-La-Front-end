import { ethers } from 'ethers';
import apiClient from '../api/apiClient'; // Sử dụng apiClient thay vì axios trực tiếp
import { ContractABIs } from '../abi/ContractABIs';

interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

interface BundlerSDKConfig {
  rpcUrl: string;
  bundlerUrl: string;
  entryPointAddress: string;
  factoryAddress: string;
  hluTokenAddress: string;
  paymasterAddress: string;
  backendUrl?: string; // URL cho backend API (không cần nếu dùng apiClient)
}

interface CreateElectionAction {
  type: 'createElection';
  tenCuocBauCu: string;
  thoiGianKeoDai: number;
  moTa: string;
}

interface ApproveTokenAction {
  type: 'approveToken';
  target: 'factory' | 'paymaster';
  amount: string;
}

type Action = CreateElectionAction | ApproveTokenAction;

interface BundlerResponse {
  message: string;
  status?: string;
  transactionHash?: string;
  userOpHash?: string;
  txHash?: string;
  txStatus?: string;
}

interface DeployBlockchainResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
  userOpHash?: string;
  txHash?: string;
  blockchainAddress?: string;
  status?: number;
  paymasterUsed?: boolean;
  requiredHLU?: string;
  errorCode?: string;
}

class BundlerSDK {
  private provider: ethers.JsonRpcProvider;
  private bundlerUrl: string;
  private entryPointAddress: string;
  private factoryAddress: string;
  private hluTokenAddress: string;
  private paymasterAddress: string;
  private entryPoint: ethers.Contract;
  private factory: ethers.Contract;
  private hluToken: ethers.Contract;

  constructor(config: BundlerSDKConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.bundlerUrl = config.bundlerUrl;
    this.entryPointAddress = config.entryPointAddress;
    this.factoryAddress = config.factoryAddress;
    this.hluTokenAddress = config.hluTokenAddress;
    this.paymasterAddress = config.paymasterAddress;

    this.entryPoint = new ethers.Contract(
      this.entryPointAddress,
      ContractABIs.EntryPoint,
      this.provider,
    );
    this.factory = new ethers.Contract(
      this.factoryAddress,
      ContractABIs.CuocBauCuFactory,
      this.provider,
    );
    this.hluToken = new ethers.Contract(this.hluTokenAddress, ContractABIs.HluToken, this.provider);

    console.log('BundlerSDK initialized with:', {
      rpcUrl: config.rpcUrl,
      bundlerUrl: config.bundlerUrl,
      entryPointAddress: config.entryPointAddress,
      factoryAddress: config.factoryAddress,
      hluTokenAddress: config.hluTokenAddress,
      paymasterAddress: config.paymasterAddress,
    });
  }

  async checkBalancesAndAllowances(scwAddress: string): Promise<{
    hluBalance: string;
    allowanceForFactory: string;
    allowanceForPaymaster: string;
    needFactoryApproval: boolean;
    needPaymasterApproval: boolean;
  }> {
    try {
      if (!scwAddress || !scwAddress.startsWith('0x') || scwAddress.length !== 42) {
        throw new Error(`Địa chỉ SCW không hợp lệ: ${scwAddress}`);
      }

      const hluBalance = await this.hluToken.balanceOf(scwAddress);
      const allowanceForFactory = await this.hluToken.allowance(scwAddress, this.factoryAddress);
      const allowanceForPaymaster = await this.hluToken.allowance(
        scwAddress,
        this.paymasterAddress,
      );

      const minFactoryAllowance = ethers.parseEther('4');
      const minPaymasterAllowance = ethers.parseEther('1');

      console.log('Balances checked:', {
        hluBalance: ethers.formatEther(hluBalance),
        allowanceForFactory: ethers.formatEther(allowanceForFactory),
        allowanceForPaymaster: ethers.formatEther(allowanceForPaymaster),
      });

      return {
        hluBalance: ethers.formatEther(hluBalance),
        allowanceForFactory: ethers.formatEther(allowanceForFactory),
        allowanceForPaymaster: ethers.formatEther(allowanceForPaymaster),
        needFactoryApproval: allowanceForFactory < minFactoryAllowance,
        needPaymasterApproval: allowanceForPaymaster < minPaymasterAllowance,
      };
    } catch (error) {
      console.error('Lỗi khi kiểm tra số dư và allowances:', error);
      return {
        hluBalance: '0',
        allowanceForFactory: '0',
        allowanceForPaymaster: '0',
        needFactoryApproval: true,
        needPaymasterApproval: true,
      };
    }
  }

  // Hàm để đảm bảo thoiGianKeoDai là giá trị hợp lệ
  private ensureValidDuration(duration: number | string | undefined): bigint {
    try {
      // Nếu là undefined hoặc null, dùng giá trị mặc định
      if (duration === undefined || duration === null) {
        console.warn('Duration is undefined or null, using default value (7 days)');
        return BigInt(7 * 24 * 60 * 60); // 7 ngày (604800 giây)
      }

      // Nếu là chuỗi, chuyển thành số
      if (typeof duration === 'string') {
        duration = Number(duration);
      }

      // Kiểm tra nếu là NaN hoặc không phải số hợp lệ
      if (isNaN(duration) || !isFinite(duration) || duration <= 0) {
        console.warn(`Invalid duration value: ${duration}, using default value (7 days)`);
        return BigInt(7 * 24 * 60 * 60); // 7 ngày mặc định
      }

      // Chuyển thành BigInt an toàn
      return BigInt(Math.floor(duration));
    } catch (error) {
      console.error('Error converting duration to BigInt:', error);
      return BigInt(7 * 24 * 60 * 60); // 7 ngày mặc định nếu có lỗi
    }
  }

  async createUserOp(
    scwAddress: string,
    action: Action,
    usePaymaster: boolean = true,
  ): Promise<UserOperation> {
    console.log(`Creating UserOp for action: ${action.type}, scwAddress: ${scwAddress}`);

    // Kiểm tra địa chỉ SCW
    if (!scwAddress || !scwAddress.startsWith('0x') || scwAddress.length !== 42) {
      throw new Error(`Địa chỉ SCW không hợp lệ: ${scwAddress}`);
    }

    try {
      const nonce = await this.entryPoint.nonceNguoiGui(scwAddress);
      console.log(`Current nonce for ${scwAddress}: ${nonce.toString()}`);

      const scwContract = new ethers.Contract(
        scwAddress,
        ContractABIs.SimpleAccount,
        this.provider,
      );
      let callData: string;
      let callGasLimit: bigint;

      switch (action.type) {
        case 'createElection': {
          // Xử lý an toàn thoiGianKeoDai
          const validDuration = this.ensureValidDuration(action.thoiGianKeoDai);
          console.log(`Using validated duration: ${validDuration.toString()} seconds`);

          try {
            console.log('Attempting to create callData using taoUserOpTrienKhaiServer...', {
              scwAddress,
              tenCuocBauCu: action.tenCuocBauCu,
              thoiGianKeoDai: validDuration.toString(),
              moTa: action.moTa || 'Không có mô tả',
            });

            // Attempt to get callData directly from contract method
            try {
              const callResult = await this.factory.taoUserOpTrienKhaiServer(
                scwAddress,
                action.tenCuocBauCu,
                validDuration,
                action.moTa || 'Không có mô tả',
              );

              if (callResult && typeof callResult === 'object' && 'callData' in callResult) {
                callData = callResult.callData;
                console.log(
                  'Successfully obtained callData from contract:',
                  callData.slice(0, 66) + '...',
                );
              } else {
                throw new Error('Contract response does not contain callData property');
              }
            } catch (contractError) {
              // Fallback to creating callData manually
              console.warn('Error calling taoUserOpTrienKhaiServer:', contractError);
              console.log('Creating callData manually...');

              const innerCallData = this.factory.interface.encodeFunctionData('trienKhaiServer', [
                action.tenCuocBauCu,
                validDuration,
                action.moTa || 'Không có mô tả',
              ]);

              callData = scwContract.interface.encodeFunctionData('execute', [
                this.factoryAddress,
                0,
                innerCallData,
              ]);

              console.log('Created callData manually:', callData.slice(0, 66) + '...');
            }

            // Ước tính gas
            try {
              console.log('Estimating gas for operation...');
              const innerCallData = this.factory.interface.encodeFunctionData('trienKhaiServer', [
                action.tenCuocBauCu,
                validDuration,
                action.moTa || 'Không có mô tả',
              ]);

              const gasEstimate = await this.provider.estimateGas({
                from: scwAddress,
                to: this.factoryAddress,
                data: innerCallData,
              });

              // Thêm 50% buffer
              callGasLimit = (gasEstimate * BigInt(150)) / BigInt(100);
              console.log(`Gas estimated: ${gasEstimate}, with buffer: ${callGasLimit}`);
            } catch (gasError) {
              console.warn('Error estimating gas:', gasError);
              callGasLimit = BigInt(2000000); // Giá trị mặc định nếu ước tính thất bại
              console.log(`Using default gas limit: ${callGasLimit}`);
            }
          } catch (error) {
            console.error('Error creating callData for election:', error);

            // Tạo callData thủ công khi có lỗi
            const innerCallData = this.factory.interface.encodeFunctionData('trienKhaiServer', [
              action.tenCuocBauCu,
              validDuration,
              action.moTa || 'Không có mô tả',
            ]);

            callData = scwContract.interface.encodeFunctionData('execute', [
              this.factoryAddress,
              0,
              innerCallData,
            ]);

            callGasLimit = BigInt(2000000); // Giá trị mặc định
            console.log('Created fallback callData and using default gas limit');
          }
          break;
        }

        case 'approveToken': {
          console.log(`Creating approve token operation for ${action.target}`);
          const targetAddress =
            action.target === 'factory' ? this.factoryAddress : this.paymasterAddress;

          // Ensure amount is valid
          let amount: string;
          try {
            // Parse và validate amount
            const parsedAmount = parseFloat(action.amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
              console.warn(`Invalid amount: ${action.amount}, using default value (10)`);
              amount = '10';
            } else {
              amount = action.amount;
            }
          } catch (error) {
            console.warn(`Error parsing amount: ${action.amount}, using default value (10)`);
            amount = '10';
          }

          console.log(`Approving ${amount} HLU for ${action.target} (${targetAddress})`);

          const innerCallDataApprove = this.hluToken.interface.encodeFunctionData('approve', [
            targetAddress,
            ethers.parseEther(amount),
          ]);

          callData = scwContract.interface.encodeFunctionData('execute', [
            this.hluTokenAddress,
            0,
            innerCallDataApprove,
          ]);

          callGasLimit = BigInt(200000);
          console.log('Approve callData created successfully');
          break;
        }

        default:
          throw new Error('Loại hành động không được hỗ trợ');
      }

      // Create and return the UserOperation
      const userOp: UserOperation = {
        sender: scwAddress,
        nonce: nonce.toString(),
        initCode: '0x',
        callData,
        callGasLimit: callGasLimit.toString(),
        verificationGasLimit: '600000',
        preVerificationGas: '210000',
        maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
        paymasterAndData: usePaymaster ? this.paymasterAddress + '0'.repeat(64) : '0x',
        signature: '0x', // Backend sẽ ký
      };

      console.log('UserOp created successfully:', {
        sender: userOp.sender,
        nonce: userOp.nonce,
        callGasLimit: userOp.callGasLimit,
        usePaymaster,
      });

      return userOp;
    } catch (error) {
      console.error('Error creating UserOp:', error);
      throw error;
    }
  }

  // Phương thức mới để tạo session key
  async createSessionKey(taiKhoanId: number, viId: number, token: string): Promise<any> {
    try {
      // Đảm bảo taiKhoanId và viId là số nguyên
      const parsedTaiKhoanId = parseInt(taiKhoanId.toString(), 10);
      const parsedViId = parseInt(viId.toString(), 10);

      if (isNaN(parsedTaiKhoanId) || isNaN(parsedViId)) {
        throw new Error(
          `Giá trị TaiKhoanID hoặc ViID không hợp lệ: TaiKhoanID=${taiKhoanId}, ViID=${viId}`,
        );
      }

      console.log(`Creating session key for TaiKhoanID: ${parsedTaiKhoanId}, ViID: ${parsedViId}`);

      // Sử dụng apiClient thay vì axios trực tiếp
      const response = await apiClient.post(`/api/blockchain/create-session`, {
        TaiKhoanID: parsedTaiKhoanId,
        ViID: parsedViId,
      });

      if (response.data && response.data.sessionKey) {
        console.log('Session key created successfully');
      } else {
        console.warn('No sessionKey in response:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating session key:', error);
      throw error;
    }
  }

  // Phương thức để lấy session key hợp lệ
  async getValidSessionKey(taiKhoanId: number, viId: number, token: string): Promise<any> {
    try {
      // Đảm bảo taiKhoanId và viId là số nguyên
      const parsedTaiKhoanId = parseInt(taiKhoanId.toString(), 10);
      const parsedViId = parseInt(viId.toString(), 10);

      if (isNaN(parsedTaiKhoanId) || isNaN(parsedViId)) {
        throw new Error(
          `Giá trị TaiKhoanID hoặc ViID không hợp lệ: TaiKhoanID=${taiKhoanId}, ViID=${viId}`,
        );
      }

      console.log(
        `Getting valid session key for TaiKhoanID: ${parsedTaiKhoanId}, ViID: ${parsedViId}`,
      );

      // Sử dụng apiClient thay vì axios trực tiếp
      const response = await apiClient.post(`/api/blockchain/get-session-key`, {
        TaiKhoanID: parsedTaiKhoanId,
        ViID: parsedViId,
      });

      if (response.data && response.data.sessionKey) {
        console.log('Valid session key found');
      } else {
        console.warn('No sessionKey in response:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Error getting valid session key:', error);
      throw error;
    }
  }

  // Phương thức mới để triển khai cuộc bầu cử qua API backend
  async deployElectionViaBackend(
    cuocBauCuId: number,
    scwAddress: string,
    token: string,
  ): Promise<DeployBlockchainResponse> {
    try {
      // Đảm bảo cuocBauCuId là số nguyên
      const parsedCuocBauCuId = parseInt(cuocBauCuId.toString(), 10);

      if (isNaN(parsedCuocBauCuId) || parsedCuocBauCuId <= 0) {
        throw new Error(`ID cuộc bầu cử không hợp lệ: ${cuocBauCuId}`);
      }

      if (!scwAddress || !scwAddress.startsWith('0x') || scwAddress.length !== 42) {
        throw new Error(`Địa chỉ SCW không hợp lệ: ${scwAddress}`);
      }

      console.log(
        `Deploying election via backend for ID: ${parsedCuocBauCuId}, SCW: ${scwAddress}`,
      );

      // Sử dụng đường dẫn chữ hoa CuocBauCu thay vì cuoc-bau-cu
      const response = await apiClient.post(
        `/api/CuocBauCu/deployBlockchain/${parsedCuocBauCuId}`,
        {
          SCWAddress: scwAddress,
        },
      );

      console.log('Backend deployment response:', response.data);

      // Nếu response không có transaction hash, kiểm tra các trường khác
      if (response.data && response.data.success) {
        if (!response.data.transactionHash && (response.data.txHash || response.data.userOpHash)) {
          response.data.transactionHash = response.data.txHash || response.data.userOpHash;
          console.log(
            'Updated transactionHash from alternative fields:',
            response.data.transactionHash,
          );
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Error deploying election via backend:', error);

      // Cố gắng trích xuất thông báo lỗi từ response nếu có
      if (error.response && error.response.data) {
        console.warn('Backend error response:', error.response.data);
        return {
          success: false,
          message: error.response.data.message || error.response.data.error || error.message,
          errorCode: error.response.data.errorCode || 'BACKEND_ERROR',
        };
      }

      return {
        success: false,
        message: error.message || 'Lỗi không xác định khi triển khai cuộc bầu cử qua backend',
        errorCode: 'UNKNOWN_ERROR',
      };
    }
  }

  // Phương thức để kiểm tra trạng thái triển khai
  async checkDeploymentStatus(cuocBauCuId: number, token: string): Promise<any> {
    try {
      // Đảm bảo cuocBauCuId là số nguyên
      const parsedCuocBauCuId = parseInt(cuocBauCuId.toString(), 10);

      if (isNaN(parsedCuocBauCuId) || parsedCuocBauCuId <= 0) {
        throw new Error(`ID cuộc bầu cử không hợp lệ: ${cuocBauCuId}`);
      }

      console.log(`Checking deployment status for election ID: ${parsedCuocBauCuId}`);

      // Sử dụng đường dẫn chữ hoa CuocBauCu thay vì cuoc-bau-cu
      const response = await apiClient.get(`/api/CuocBauCu/blockchain/${parsedCuocBauCuId}`);

      console.log('Deployment status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking deployment status:', error);
      throw error;
    }
  }

  // Phương thức để đồng bộ blockchain sau khi triển khai
  async syncBlockchain(cuocBauCuId: number, token: string): Promise<any> {
    try {
      // Đảm bảo cuocBauCuId là số nguyên
      const parsedCuocBauCuId = parseInt(cuocBauCuId.toString(), 10);

      if (isNaN(parsedCuocBauCuId) || parsedCuocBauCuId <= 0) {
        throw new Error(`ID cuộc bầu cử không hợp lệ: ${cuocBauCuId}`);
      }

      console.log(`Syncing blockchain for election ID: ${parsedCuocBauCuId}`);

      // Sử dụng đường dẫn chữ hoa CuocBauCu thay vì cuoc-bau-cu
      const response = await apiClient.post(
        `/api/CuocBauCu/syncBlockchain/${parsedCuocBauCuId}`,
        {},
      );

      console.log('Blockchain sync response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing blockchain:', error);
      throw error;
    }
  }

  // Thêm mới: Ghi nhận giao dịch transaction hash
  async recordTransaction(cuocBauCuId: number, txHash: string, scwAddress: string): Promise<any> {
    try {
      // Validate inputs
      const parsedCuocBauCuId = parseInt(cuocBauCuId.toString(), 10);

      if (isNaN(parsedCuocBauCuId) || parsedCuocBauCuId <= 0) {
        throw new Error(`ID cuộc bầu cử không hợp lệ: ${cuocBauCuId}`);
      }

      if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
        console.warn(`Transaction hash không hợp lệ: ${txHash}, nhưng vẫn thử ghi nhận`);
      }

      if (!scwAddress || !scwAddress.startsWith('0x') || scwAddress.length !== 42) {
        throw new Error(`Địa chỉ SCW không hợp lệ: ${scwAddress}`);
      }

      console.log(`Recording transaction ${txHash} for election ID: ${parsedCuocBauCuId}`);

      // Sử dụng đường dẫn chữ hoa CuocBauCu thay vì cuoc-bau-cu
      const response = await apiClient.post(
        `/api/CuocBauCu/recordTransaction/${parsedCuocBauCuId}`,
        {
          TxHash: txHash,
          ScwAddress: scwAddress,
        },
      );

      console.log('Transaction recording response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  async submitUserOp(userOp: UserOperation, token: string): Promise<BundlerResponse> {
    try {
      console.log(`Submitting UserOp to bundler: ${this.bundlerUrl}`, {
        sender: userOp.sender,
        nonce: userOp.nonce,
        callGasLimit: userOp.callGasLimit,
        paymasterUsed: userOp.paymasterAndData !== '0x',
      });

      // Sử dụng apiClient thay vì axios trực tiếp
      const response = await apiClient.post(`${this.bundlerUrl}/submit`, userOp);

      console.log('Bundler response:', response.data);

      // Chuẩn hóa kết quả trả về để luôn có transaction hash
      if (response.data) {
        if (!response.data.transactionHash && (response.data.userOpHash || response.data.txHash)) {
          response.data.transactionHash = response.data.userOpHash || response.data.txHash;
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Error submitting UserOp to bundler:', error);

      if (error.response && error.response.data) {
        return error.response.data;
      }

      return {
        message: error.message || 'Lỗi không xác định khi gửi UserOperation',
        status: 'error',
      };
    }
  }

  // Phương thức để phê duyệt token (sử dụng khi cần thêm allowance)
  async approveToken(
    scwAddress: string,
    target: 'factory' | 'paymaster',
    amount: string,
    token: string,
    usePaymaster: boolean = false,
  ): Promise<BundlerResponse> {
    try {
      console.log(
        `Approving tokens for ${target}. SCW: ${scwAddress}, Amount: ${amount}, UsePaymaster: ${usePaymaster}`,
      );

      const action: ApproveTokenAction = {
        type: 'approveToken',
        target,
        amount,
      };

      const userOp = await this.createUserOp(scwAddress, action, usePaymaster);
      const result = await this.submitUserOp(userOp, token);

      console.log(`Token approval ${target} result:`, result);

      // Xử lý thống nhất kết quả transaction hash
      if (result && !result.transactionHash && (result.userOpHash || result.txHash)) {
        result.transactionHash = result.userOpHash || result.txHash;
      }

      return result;
    } catch (error: any) {
      console.error(`Error approving tokens for ${target}:`, error);
      return {
        message: error.message || `Lỗi khi phê duyệt token cho ${target}`,
        status: 'error',
      };
    }
  }

  // Phương thức chính để triển khai cuộc bầu cử - ưu tiên sử dụng API backend
  async createElection(
    cuocBauCuId: number,
    scwAddress: string,
    tenCuocBauCu: string,
    thoiGianKeoDai: number,
    moTa: string,
    token: string,
  ): Promise<DeployBlockchainResponse> {
    try {
      // Validate inputs
      if (!tenCuocBauCu) {
        throw new Error('Tên cuộc bầu cử không được để trống');
      }

      // Đảm bảo thoiGianKeoDai là số hợp lệ
      let validDuration;
      try {
        if (typeof thoiGianKeoDai !== 'number' || isNaN(thoiGianKeoDai) || thoiGianKeoDai <= 0) {
          console.warn(
            `Thời gian kéo dài không hợp lệ: ${thoiGianKeoDai}, sử dụng giá trị mặc định (7 ngày)`,
          );
          validDuration = 7 * 24 * 60 * 60; // 7 ngày mặc định
        } else {
          validDuration = Math.floor(thoiGianKeoDai);
        }
      } catch (error) {
        console.error('Error validating duration:', error);
        validDuration = 7 * 24 * 60 * 60; // 7 ngày mặc định nếu có lỗi
      }

      console.log(
        `Creating election: ID=${cuocBauCuId}, Name=${tenCuocBauCu}, Duration=${validDuration}`,
      );

      // Ưu tiên sử dụng API backend để triển khai
      try {
        const deployResult = await this.deployElectionViaBackend(cuocBauCuId, scwAddress, token);

        if (deployResult.success) {
          console.log('Backend deployment successful:', deployResult);

          // Đảm bảo rằng deployResult luôn có transaction hash
          if (!deployResult.transactionHash && (deployResult.userOpHash || deployResult.txHash)) {
            deployResult.transactionHash = deployResult.userOpHash || deployResult.txHash;
            console.log(
              'Updated transactionHash from alternative fields:',
              deployResult.transactionHash,
            );
          }

          // Đồng bộ blockchain sau 10 giây thay vì 5 giây
          setTimeout(async () => {
            try {
              console.log('Starting blockchain sync after delay...');
              const syncResult = await this.syncBlockchain(cuocBauCuId, token);
              console.log('Blockchain sync completed:', syncResult);
            } catch (syncError) {
              console.warn('Error syncing blockchain:', syncError);
            }
          }, 10000); // Tăng thời gian chờ lên 10 giây

          return deployResult;
        } else {
          console.warn('Backend deployment failed, trying alternative method:', deployResult);
        }
      } catch (backendError) {
        console.warn('Error deploying via backend, trying alternative method:', backendError);
      }

      // Fallback: Triển khai trực tiếp qua bundler
      console.log('Using direct bundler deployment...');

      // Kiểm tra balances và allowances
      const balances = await this.checkBalancesAndAllowances(scwAddress);
      console.log('Current balances and allowances:', balances);

      // Phê duyệt tokens nếu cần
      if (balances.needPaymasterApproval) {
        console.log('Approving tokens for paymaster...');
        const paymasterResult = await this.approveToken(
          scwAddress,
          'paymaster',
          '10',
          token,
          false,
        );
        console.log('Paymaster approval result:', paymasterResult);

        if (paymasterResult.status === 'error') {
          throw new Error(`Không thể phê duyệt token cho Paymaster: ${paymasterResult.message}`);
        }

        // Wait for transaction to be mined
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      if (balances.needFactoryApproval) {
        console.log('Approving tokens for factory...');
        const factoryResult = await this.approveToken(
          scwAddress,
          'factory',
          '8',
          token,
          parseFloat(balances.allowanceForPaymaster) >= 1,
        );
        console.log('Factory approval result:', factoryResult);

        if (factoryResult.status === 'error') {
          throw new Error(`Không thể phê duyệt token cho Factory: ${factoryResult.message}`);
        }

        // Wait for transaction to be mined
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Tạo và gửi UserOperation trực tiếp
      console.log('Creating election UserOp...');
      const action: CreateElectionAction = {
        type: 'createElection',
        tenCuocBauCu,
        thoiGianKeoDai: validDuration,
        moTa: moTa || 'Không có mô tả',
      };

      const userOp = await this.createUserOp(scwAddress, action, true);
      console.log('Submitting election UserOp to bundler...');
      const result = await this.submitUserOp(userOp, token);
      console.log('Bundler response:', result);

      // Extract transaction hash from result
      const txHash = result.userOpHash || result.transactionHash || result.txHash;

      if (!txHash) {
        throw new Error('Không nhận được transaction hash từ bundler');
      }

      // Record transaction in backend
      try {
        console.log(`Recording transaction ${txHash} in backend...`);
        await this.recordTransaction(cuocBauCuId, txHash, scwAddress);
      } catch (recordError) {
        console.warn('Error recording transaction in backend:', recordError);
        // Continue execution even if recording fails
      }

      // Đồng bộ blockchain sau 10 giây
      setTimeout(async () => {
        try {
          console.log(`Syncing blockchain for election ID: ${cuocBauCuId}...`);
          await this.syncBlockchain(cuocBauCuId, token);
          console.log(`Blockchain sync completed for election ID: ${cuocBauCuId}`);
        } catch (error) {
          console.warn('Error syncing blockchain:', error);
        }
      }, 10000);

      return {
        success: true,
        message: 'Đã gửi UserOperation tạo cuộc bầu cử thành công qua bundler.',
        transactionHash: txHash,
        status: 1,
      };
    } catch (error: any) {
      console.error('Error creating election:', error);
      return {
        success: false,
        message: error.message || 'Lỗi không xác định khi triển khai cuộc bầu cử',
        errorCode: 'DEPLOYMENT_ERROR',
      };
    }
  }
}

export default BundlerSDK;
