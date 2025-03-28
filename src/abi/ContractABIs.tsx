export const ContractABIs = {
  EntryPoint: [
    'function nonceNguoiGui(address sender) view returns (uint256)',
    'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) view returns (bytes32)',
  ],
  SimpleAccount: [
    'function execute(address dest, uint256 value, bytes data)',
    'function owner() view returns (address)',
    'function sessionKeys(address sessionKey) view returns (uint256 expiration)',
    'function setSessionKey(address key, uint256 expiration)',
  ],
  CuocBauCuFactory: [
    'function trienKhaiServer(string tenCuocBauCu, uint256 thoiGianKeoDai, string moTa)',
    'function taoUserOpTrienKhaiServer(address account, string tenCuocBauCu, uint256 thoiGianKeoDai, string moTa) view returns (tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature))',
    'function layThongTinServer(uint256 id) view returns (address proxy)',
  ],
  HluToken: [
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount)',
  ],
  QuanLyCuocBauCu: [
    'function themUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien)',
  ],
};
