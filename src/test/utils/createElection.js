import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// Địa chỉ contract từ mã gốc
const scwAddress = '0xb65D6515910E92657c82eB88C85Fe009E67aD2b7';
const entryPointAddress = '0x2eb38B2483e14a103dc4F840e6c854F133D98c37';
const paymasterAddress = '0x1B0e7A821d918d9C8d3703aC4b87CBdaE3F13F9c';
const hluTokenAddress = '0x820F15F12Aa75BAa89A16B20768024C8604Ea16f';
const factoryAddress = '0x0b70c3CD86428B67C72295185CC66342571478e7';

// ABI tối thiểu (cần bổ sung đầy đủ từ hợp đồng thực tế)
const EntryPointABI = [
  'function nonceNguoiGui(address) view returns (uint256)',
  'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
  'function xuLyCacThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] ops, address beneficiary) returns (bool[])',
];
const CuocBauCuFactoryABI = [
  'function trienKhaiServer(string name, uint256 duration, string description)',
  'function taoUserOpTrienKhaiServer(address sender, string name, uint256 duration, string description) view returns (tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature))',
];
const HluTokenABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];
const SimpleAccountABI = [
  'function execute(address dest, uint256 value, bytes func) returns (bytes)',
];

export const createElection = async (signer, provider, electionData) => {
  const { name, duration, description } = electionData;

  // Session key từ mã gốc
  const sessionPrivateKey = '0x4ee7ef2495d27c2d54d47d4a4747484e20caa68ef55b94ad136de0f4d1be1c58';
  const sessionKeySigner = new ethers.Wallet(sessionPrivateKey).connect(provider);

  // Tạo instance của các contract
  const entryPoint = new ethers.Contract(entryPointAddress, EntryPointABI, signer);
  const factory = new ethers.Contract(factoryAddress, CuocBauCuFactoryABI, signer);
  const hluToken = new ethers.Contract(hluTokenAddress, HluTokenABI, signer);
  const simpleAccount = new ethers.Contract(scwAddress, SimpleAccountABI, signer);

  // Kiểm tra allowance cho paymaster và factory
  let allowanceForPaymaster = await hluToken.allowance(scwAddress, paymasterAddress);
  let allowanceForFactory = await hluToken.allowance(scwAddress, factoryAddress);

  // Approve cho Paymaster nếu cần
  if (allowanceForPaymaster < ethers.parseEther('1')) {
    const approveCallData = hluToken.interface.encodeFunctionData('approve', [
      paymasterAddress,
      ethers.parseEther('10'),
    ]);
    const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
      hluTokenAddress,
      0,
      approveCallData,
    ]);

    const nonce = await entryPoint.nonceNguoiGui(scwAddress);
    const approveUserOp = {
      sender: scwAddress,
      nonce: nonce.toString(),
      initCode: '0x',
      callData: executeCallData,
      callGasLimit: '200000',
      verificationGasLimit: '150000',
      preVerificationGas: '50000',
      maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
      paymasterAndData: '0x', // Không dùng paymaster cho bước này
      signature: '0x',
    };

    const userOpHash = await entryPoint.layHashThaoTac(approveUserOp);
    const signingKey = new ethers.SigningKey(sessionPrivateKey);
    const signatureObj = signingKey.sign(userOpHash);
    approveUserOp.signature = ethers.Signature.from({
      r: signatureObj.r,
      s: signatureObj.s,
      v: signatureObj.v,
    }).serialized;

    const tx = await entryPoint.xuLyCacThaoTac([approveUserOp], await signer.getAddress(), {
      gasLimit: 4000000,
    });
    toast.info('Đang approve cho Paymaster...');
    await tx.wait();
    toast.success('Approve cho Paymaster thành công!');
  }

  // Approve cho Factory nếu cần
  if (allowanceForFactory < ethers.parseEther('4')) {
    const approveCallData = hluToken.interface.encodeFunctionData('approve', [
      factoryAddress,
      ethers.parseEther('8'),
    ]);
    const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
      hluTokenAddress,
      0,
      approveCallData,
    ]);

    const nonce = await entryPoint.nonceNguoiGui(scwAddress);
    const approveUserOp = {
      sender: scwAddress,
      nonce: nonce.toString(),
      initCode: '0x',
      callData: executeCallData,
      callGasLimit: '200000',
      verificationGasLimit: '250000',
      preVerificationGas: '50000',
      maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
      maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
      paymasterAndData: paymasterAddress,
      signature: '0x',
    };

    const userOpHash = await entryPoint.layHashThaoTac(approveUserOp);
    const signingKey = new ethers.SigningKey(sessionPrivateKey);
    const signatureObj = signingKey.sign(userOpHash);
    approveUserOp.signature = ethers.Signature.from({
      r: signatureObj.r,
      s: signatureObj.s,
      v: signatureObj.v,
    }).serialized;

    const tx = await entryPoint.xuLyCacThaoTac([approveUserOp], await signer.getAddress(), {
      gasLimit: 4000000,
    });
    toast.info('Đang approve cho Factory...');
    await tx.wait();
    toast.success('Approve cho Factory thành công!');
  }

  // Tạo UserOperation để triển khai cuộc bầu cử
  const nonce = await entryPoint.nonceNguoiGui(scwAddress);
  const userOpRaw = await factory.taoUserOpTrienKhaiServer(scwAddress, name, duration, description);
  const createElectionUserOp = {
    sender: scwAddress,
    nonce: nonce.toString(),
    initCode: '0x',
    callData: userOpRaw.callData,
    callGasLimit: '2245362',
    verificationGasLimit: '600000',
    preVerificationGas: '210000',
    maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
    paymasterAndData: paymasterAddress,
    signature: '0x',
  };

  // Ký UserOperation
  const userOpHash = await entryPoint.layHashThaoTac(createElectionUserOp);
  const signingKey = new ethers.SigningKey(sessionPrivateKey);
  const signatureObj = signingKey.sign(userOpHash);
  createElectionUserOp.signature = ethers.Signature.from({
    r: signatureObj.r,
    s: signatureObj.s,
    v: signatureObj.v,
  }).serialized;

  // Gửi UserOperation
  const tx = await entryPoint.xuLyCacThaoTac([createElectionUserOp], await signer.getAddress(), {
    gasLimit: 5000000,
  });
  toast.info(`Đang tạo cuộc bầu cử: ${tx.hash}`);
  await tx.wait();
  toast.success('Cuộc bầu cử đã được tạo thành công!');
};
