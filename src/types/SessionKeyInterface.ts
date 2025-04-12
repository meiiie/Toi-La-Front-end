export interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

export interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  quanLyPhieuBauAddress: string;
  hluTokenAddress: string;
  chainId?: number;
}

export interface BalanceInfo {
  hluBalance: string;
  allowanceForFactory?: string;
  allowanceForPaymaster?: string;
  allowanceForQuanLyPhieu?: string;
  allowanceForElection?: string;
  isApproved?: boolean;
}
