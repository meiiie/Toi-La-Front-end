import type Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import { QuanLyCuocBauCuABI } from '../../abi/QuanLyCuocBauCuABI';
import { QuanLyPhienBauCuABI } from '../../abi/QuanLyPhienBauCuABI';
import { QuanLyPhieuBauABI } from '../../abi/QuanLyPhieuBauABI';
import { QuanLyThanhTuuABI } from '../../abi/QuanLyThanhTuuABI';

export const CONTRACT_ADDRESSES = {
  QUAN_LY_CUOC_BAU_CU: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  QUAN_LY_PHIEN_BAU_CU: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  QUAN_LY_PHIEU_BAU: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  QUAN_LY_THANH_TUU: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
};

export const NETWORK_CONFIG = {
  chainId: '0xD2', // 210 in hexadecimal
  chainName: 'POA Geth Network',
  nativeCurrency: {
    name: 'POA',
    symbol: 'POA',
    decimals: 18,
  },
  rpcUrls: ['https://geth.holihu.online/rpc'],
  blockExplorerUrls: ['https://geth.holihu.online/explorer'],
};

export const isMetaMaskAvailable = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

export const initializeContracts = (web3Instance: Web3) => {
  try {
    const quanLyCuocBauCu = new web3Instance.eth.Contract(
      QuanLyCuocBauCuABI,
      CONTRACT_ADDRESSES.QUAN_LY_CUOC_BAU_CU,
    ) as unknown as Contract<typeof QuanLyCuocBauCuABI>;

    const quanLyPhienBauCu = new web3Instance.eth.Contract(
      QuanLyPhienBauCuABI,
      CONTRACT_ADDRESSES.QUAN_LY_PHIEN_BAU_CU,
    ) as unknown as Contract<typeof QuanLyPhienBauCuABI>;

    const quanLyPhieuBau = new web3Instance.eth.Contract(
      QuanLyPhieuBauABI,
      CONTRACT_ADDRESSES.QUAN_LY_PHIEU_BAU,
    ) as unknown as Contract<typeof QuanLyPhieuBauABI>;

    const quanLyThanhTuu = new web3Instance.eth.Contract(
      QuanLyThanhTuuABI,
      CONTRACT_ADDRESSES.QUAN_LY_THANH_TUU,
    ) as unknown as Contract<typeof QuanLyThanhTuuABI>;

    return { quanLyCuocBauCu, quanLyPhienBauCu, quanLyPhieuBau, quanLyThanhTuu };
  } catch (error) {
    console.error('Lỗi khởi tạo contracts:', error);
    return null;
  }
};

export const switchToCorrectChain = async () => {
  if (!isMetaMaskAvailable()) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK_CONFIG.chainId }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_CONFIG],
        });
        return true;
      } catch (addError) {
        console.error('Lỗi khi thêm mạng:', addError);
        return false;
      }
    }
    console.error('Lỗi khi chuyển mạng:', switchError);
    return false;
  }
};
