'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';
import apiClient from '../api/apiClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Các màu sắc cho biểu đồ
const COLORS = [
  '#845EC2', // Tím đậm
  '#5CBDB9', // Xanh ngọc
  '#D65DB1', // Hồng đậm
  '#2C73D2', // Xanh dương
  '#FF9671', // Cam đào
  '#0089BA', // Xanh biển
  '#008F7A', // Xanh lá đậm
  '#C34A36', // Đỏ gạch
];

// ABI tối thiểu cho các contract
const cuocBauCuAbi = [
  'function layKetQuaPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory ungVien, uint256[] memory soPhieu)',
  'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool dangHoatDongNe, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, uint256 soCuTriToiDa, uint256 soUngVienHienTai, uint256 soCuTriHienTai, address[] memory ungVienDacCu, bool taiBauCu, uint256 soLuongXacNhan, uint256 thoiGianHetHanXacNhan)',
  'function layThongTinCoBan(uint256 idCuocBauCu) external view returns (address nguoiSoHuu, bool dangHoatDongDay, uint256 thoiGianBatDau, uint256 ThoiGianKetThuc, string memory tenCuocBauCu, uint256 phiHLU)',
  'function laySoPhieuUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien) external view returns (uint256)',
  'function layDanhSachUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (address[] memory)',
  'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
  'function canKetThucSomPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool)',
  'function ketThucSomPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external',
  'function ketThucPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
];

// Component Theme Toggle
const ThemeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className="fixed top-2 right-2 sm:top-6 sm:right-6 z-50 p-2 rounded-full shadow-lg transition-all duration-300 dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-indigo-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};

// Loading Spinner Component
const LoadingSpinner = ({ message = 'Đang tải dữ liệu từ blockchain...' }) => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
    <div className="text-center p-8 backdrop-blur-lg bg-white/90 dark:bg-black/20 rounded-xl shadow-2xl">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-indigo-500"></div>
      <p className="mt-6 text-gray-800 dark:text-white text-lg font-medium">{message}</p>
      <p className="mt-2 text-indigo-600 dark:text-indigo-300 text-sm">
        Quá trình này có thể mất một chút thời gian
      </p>
    </div>
  </div>
);

// Error Alert Component
const ErrorAlert = ({ message }) => (
  <div className="bg-red-50 dark:bg-red-900/40 backdrop-blur-md border-l-4 border-red-500 text-red-800 dark:text-red-100 p-6 mb-8 rounded-lg shadow-xl">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg
          className="h-6 w-6 text-red-500 dark:text-red-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-lg">{message}</p>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyStatePrompt = ({ message, icon, actionButton = null }) => (
  <div className="backdrop-blur-lg bg-white/90 dark:bg-white/5 rounded-xl shadow-2xl p-8 mb-8 text-center border border-gray-200 dark:border-white/10">
    <div className="py-16">
      {icon}
      <h3 className="text-xl font-medium text-gray-800 dark:text-indigo-200 mb-3">{message}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8">{actionButton?.description}</p>
      {actionButton?.button}
    </div>
  </div>
);

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
        <div
          className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3
                className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                id="modal-headline"
              >
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-300">{message}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
              onClick={onConfirm}
            >
              {confirmText || 'Xác nhận'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={onClose}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success Alert Component
const SuccessAlert = ({ message, onClose }) => (
  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 dark:bg-green-900/80 backdrop-blur-md border-l-4 border-green-500 text-green-800 dark:text-green-100 p-4 rounded-lg shadow-xl max-w-md animate-fadeIn">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg
          className="h-5 w-5 text-green-500 dark:text-green-300"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="ml-auto pl-3">
        <div className="-mx-1.5 -my-1.5">
          <button
            onClick={onClose}
            className="inline-flex rounded-md p-1.5 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50 focus:outline-none"
          >
            <span className="sr-only">Đóng</span>
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
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
      </div>
    </div>
  </div>
);

// Custom tooltip cho biểu đồ
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="backdrop-blur-md bg-white/95 dark:bg-gray-800/95 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
        <p className="font-bold text-gray-800 dark:text-gray-100">{data.displayAddress}</p>
        <p className="text-indigo-600 dark:text-indigo-300 font-semibold">{data.votes} phiếu</p>
        <p className="text-gray-600 dark:text-gray-400">{data.percentage}% tổng phiếu</p>
        {data.isElected && (
          <p className="text-emerald-600 dark:text-emerald-400 flex items-center mt-1 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Trúng cử
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Enum cho trạng thái triển khai
enum DeploymentStatus {
  NOT_STARTED = 0,
  PREPARING_CALLDATA = 1,
  CREATING_USEROP = 2,
  SENDING_USEROP = 3,
  WAITING_CONFIRMATION = 4,
  SUCCESS = 5,
  FAILED = 6,
}

// Status Message Component
const StatusMessage = ({ status, message, isProcessing }) => {
  if (!message) return null;

  let bgClass = 'bg-blue-50 dark:bg-blue-900/40';
  let borderClass = 'border-blue-200 dark:border-blue-700/50';
  let textClass = 'text-blue-800 dark:text-blue-200';
  let icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-blue-600 dark:text-blue-400"
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
  );

  if (status === DeploymentStatus.SUCCESS) {
    bgClass = 'bg-green-50 dark:bg-green-900/40';
    borderClass = 'border-green-200 dark:border-green-700/50';
    textClass = 'text-green-800 dark:text-green-200';
    icon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-green-600 dark:text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  } else if (status === DeploymentStatus.FAILED) {
    bgClass = 'bg-red-50 dark:bg-red-900/40';
    borderClass = 'border-red-200 dark:border-red-700/50';
    textClass = 'text-red-800 dark:text-red-200';
    icon = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-red-600 dark:text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  }

  return (
    <div
      className={`flex items-start p-4 rounded-lg ${bgClass} border ${borderClass} mb-4 transition-all duration-300`}
    >
      <div className="flex-shrink-0 mr-3">
        {isProcessing ? (
          <svg
            className="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400"
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
        ) : (
          icon
        )}
      </div>
      <div className={`flex-1 ${textClass}`}>
        <p className="font-medium">{message}</p>
        {status === DeploymentStatus.WAITING_CONFIRMATION && (
          <div className="mt-2">
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full animate-progress"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component
const KetQuaBauCu = () => {
  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // Thông tin cố định
  const cuocBauCuId = 1; // Fix cứng ID cuộc bầu cử
  const [contractAddresses, setContractAddresses] = useState({
    entryPointAddress: '',
    factoryAddress: '',
    paymasterAddress: '',
    hluTokenAddress: '',
  });
  const [contractAddress, setContractAddress] = useState('');
  const [serverId, setServerId] = useState(null);

  // State cho dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode
        ? JSON.parse(savedMode)
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // States cho phiên bầu cử
  const [danhSachPhien, setDanhSachPhien] = useState([]);
  const [selectedPhien, setSelectedPhien] = useState(null);

  // States cho dữ liệu
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingSession, setIsChangingSession] = useState(false);
  const [error, setError] = useState(null);
  const [electionInfo, setElectionInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [votingResults, setVotingResults] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    voted: 0,
    percentage: 0,
  });

  // State cho theo dõi real-time
  const [isMonitoring, setIsMonitoring] = useState(false);

  // State cho quyền dừng phiên
  const [canEndSession, setCanEndSession] = useState(false);
  const [canEarlyEndSession, setCanEarlyEndSession] = useState(false);

  // State cho thông tin người dùng và SCW
  const [taiKhoanId, setTaiKhoanId] = useState('');
  const [viId, setViId] = useState('');
  const [scwAddress, setScwAddress] = useState('');
  const [sessionKey, setSessionKey] = useState(null);
  const [electionStatus, setElectionStatus] = useState({
    owner: '',
    isOwner: false,
    isActive: false,
    hasBanToChucRole: false,
  });

  // State cho modal xác nhận
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successAlert, setSuccessAlert] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState(DeploymentStatus.NOT_STARTED);
  const [frontendHash, setFrontendHash] = useState('');
  const [backendHash, setBackendHash] = useState('');
  const [txHash, setTxHash] = useState('');

  // State cho thông báo trạng thái
  const [statusMessage, setStatusMessage] = useState('');

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Lưu dark mode vào localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));

      // Áp dụng class dark vào document
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  // Hiển thị thông báo với cải tiến
  const showMessage = useCallback((msg) => {
    console.log(msg);
    setStatusMessage(msg);
  }, []);

  // Hiển thị lỗi
  const setErrorMessage = useCallback((msg) => {
    setError(msg);
    console.error(msg);
  }, []);

  // Cập nhật tài khoản từ userInfo khi component được tải
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());

      if (userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }
    }
  }, [userInfo, dispatch]);

  // Set viId and scwAddress from walletInfo when available
  useEffect(() => {
    if (walletInfo) {
      setViId(walletInfo.viId.toString());
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Lấy thông tin contract addresses
  useEffect(() => {
    const fetchContractAddresses = async () => {
      try {
        // Kiểm tra nếu đã có địa chỉ contract thì không cần fetch lại
        if (contractAddresses.entryPointAddress) {
          return;
        }

        setIsLoading(true);

        try {
          const { data } = await apiClient.get('/api/Blockchain/contract-addresses');

          if (data) {
            setContractAddresses(data);
            showMessage('Đã lấy thông tin địa chỉ contract');
          }
        } catch (error) {
          console.error('Lỗi khi lấy địa chỉ contract:', error);
          // Use default values as fallback
          setContractAddresses({
            entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
            factoryAddress: '0x9406Cc6185a346906296840746125a0E44976454',
            paymasterAddress: '0x0576a174D229E3cFA37253523E645A78A0C91B57',
            hluTokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          });
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Lỗi khi lấy địa chỉ contract:', error);
      }
    };

    fetchContractAddresses();
  }, []); // Chỉ chạy một lần khi component mount

  // Lấy thông tin cuộc bầu cử và serverId
  useEffect(() => {
    const fetchElectionInfo = async () => {
      try {
        // Kiểm tra nếu đã có địa chỉ contract thì không cần fetch lại
        if (contractAddress) {
          return;
        }

        setIsLoading(true);

        try {
          const { data } = await apiClient.get(`/api/CuocBauCu/${cuocBauCuId}`);

          if (data) {
            // Get blockchain address from election
            setContractAddress(
              data.blockchainAddress || '0xc00E42F5d43A9B0bBA8eAEbBb3Ab4e32d2Ec6D10',
            );
            setServerId(data.blockchainServerId || 4);
          }
        } catch (error) {
          console.error('Lỗi khi lấy thông tin cuộc bầu cử:', error);

          // Fallback: If API doesn't work, use default values
          setContractAddress('0xc00E42F5d43A9B0bBA8eAEbBb3Ab4e32d2Ec6D10');
          setServerId(8);
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin cuộc bầu cử:', error);
      }
    };

    fetchElectionInfo();
  }, []); // Chỉ chạy một lần khi component mount

  // Lấy session key
  const getSessionKey = useCallback(async () => {
    if (!userInfo?.id) {
      setErrorMessage('Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản');
      return null;
    }

    // Kiểm tra nếu session key đã tồn tại và còn hạn sử dụng
    if (sessionKey && sessionKey.expiresAt * 1000 > Date.now()) {
      showMessage('Đã có khóa phiên và còn hạn sử dụng');
      return sessionKey;
    }

    try {
      setIsLoading(true);

      // Gọi API để lấy session key - thêm ViID parameter
      const { data } = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(userInfo.id.toString(), 10),
        ViID: walletInfo?.viId ? Number.parseInt(walletInfo.viId.toString(), 10) : undefined,
      });

      if (data && data.success && data.sessionKey) {
        // Lưu session key và thông tin liên quan
        const sessionKeyInfo = {
          sessionKey: data.sessionKey,
          expiresAt: data.expiresAt,
          scwAddress: data.scwAddress,
        };

        setSessionKey(sessionKeyInfo);
        showMessage(
          `Đã lấy session key thành công, hết hạn: ${new Date(sessionKeyInfo.expiresAt * 1000).toLocaleString()}`,
        );
        return sessionKeyInfo;
      } else {
        throw new Error(data?.message || 'Không thể lấy session key');
      }
    } catch (error) {
      setErrorMessage(
        'Lỗi khi lấy session key: ' + (error instanceof Error ? error.message : String(error)),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userInfo, walletInfo, sessionKey, showMessage, setErrorMessage]);

  // Kiểm tra trạng thái cuộc bầu cử
  const checkElectionStatus = useCallback(async () => {
    if (!contractAddress) {
      setErrorMessage('Thiếu thông tin địa chỉ hợp đồng để kiểm tra trạng thái cuộc bầu cử');
      return false;
    }

    try {
      setIsLoading(true);
      // Only set status message once to avoid repetitive messages
      if (!statusMessage.includes('Đang kiểm tra')) {
        showMessage('Đang kiểm tra quyền quản lý phiên bầu cử...');
      }

      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
      const quanLyCuocBauCuAbi = [
        'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256, string, uint256)',
        'function hasRole(bytes32 role, address account) view returns (bool)',
      ];

      const contract = new ethers.Contract(contractAddress, quanLyCuocBauCuAbi, provider);

      // Always use ID = 1 for contract
      const baseInfo = await contract.layThongTinCoBan(1);
      const owner = baseInfo[0];
      const isActive = baseInfo[1];

      let hasBanToChucRole = false;
      // Only check role if we have session key with SCW address
      if (sessionKey?.scwAddress) {
        // Kiểm tra quyền BANTOCHUC
        const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
        hasBanToChucRole = await contract.hasRole(BANTOCHUC, sessionKey.scwAddress);
      }

      // Set status regardless of session key availability
      setElectionStatus({
        owner,
        isOwner: sessionKey?.scwAddress
          ? owner.toLowerCase() === sessionKey.scwAddress.toLowerCase()
          : false,
        isActive,
        hasBanToChucRole,
      });

      // Can end session if owner or has BANTOCHUC role
      const canEndSessionValue = electionStatus.isOwner || hasBanToChucRole;
      setCanEndSession(canEndSessionValue && sessionInfo?.isActive);

      return true;
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái cuộc bầu cử:', error);
      setErrorMessage(
        'Lỗi khi kiểm tra trạng thái cuộc bầu cử: ' +
          (error instanceof Error ? error.message : String(error)),
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    contractAddress,
    sessionKey,
    sessionInfo,
    electionStatus.isOwner,
    showMessage,
    setErrorMessage,
    statusMessage,
  ]);

  // Lấy danh sách phiên bầu cử khi có contractAddress
  useEffect(() => {
    if (!contractAddress) return;

    // Thêm biến để kiểm soát việc fetch chỉ chạy một lần
    let isMounted = true;
    let hasLoaded = false;

    const fetchPhienBauCu = async () => {
      // Nếu đã load rồi và đã có phiên được chọn, không cần fetch lại
      if (hasLoaded && selectedPhien) return;

      try {
        setIsLoading(true);

        // Kết nối với blockchain
        const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
        const contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

        // Lấy thông tin cuộc bầu cử
        const electionData = await contract.layThongTinCoBan(cuocBauCuId);

        if (isMounted) {
          setElectionInfo({
            name: electionData[4], // tenCuocBauCu
            owner: electionData[0], // nguoiSoHuu
            isActive: electionData[1], // dangHoatDongDay
            startTime: new Date(Number(electionData[2]) * 1000).toLocaleString(), // thoiGianBatDau
            endTime: new Date(Number(electionData[3]) * 1000).toLocaleString(), // thoiGianKetThuc
          });

          // Lấy danh sách phiên bầu cử
          const phienIds = await contract.layDanhSachPhienBauCu(cuocBauCuId, 0, 10);

          if (phienIds && phienIds.length > 0) {
            // Lấy thông tin chi tiết cho từng phiên
            const phienDetails = await Promise.all(
              phienIds.map(async (id) => {
                try {
                  const phienData = await contract.layThongTinPhienBauCu(cuocBauCuId, id);
                  return {
                    id: Number(id),
                    isActive: phienData[0],
                    startTime: new Date(Number(phienData[1]) * 1000),
                    endTime: new Date(Number(phienData[2]) * 1000),
                    candidateCount: Number(phienData[4]),
                    voterCount: Number(phienData[5]),
                  };
                } catch (error) {
                  console.warn(`Không thể lấy thông tin chi tiết cho phiên ${id}:`, error);
                  return { id: Number(id), error: true };
                }
              }),
            );

            const validPhiens = phienDetails.filter((p) => !p.error);
            setDanhSachPhien(validPhiens);

            // Chọn phiên đầu tiên nếu chưa có phiên nào được chọn
            if (validPhiens.length > 0 && !selectedPhien) {
              setSelectedPhien(validPhiens[0].id);
            }
          }

          hasLoaded = true;
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách phiên bầu cử:', error);
        if (isMounted) {
          setError(`Không thể lấy danh sách phiên bầu cử: ${error.message}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPhienBauCu();

    return () => {
      isMounted = false;
    };
  }, [contractAddress, cuocBauCuId, selectedPhien]); // Chỉ chạy khi contractAddress hoặc cuocBauCuId thay đổi

  const fetchSessionResults = useCallback(async () => {
    if (!contractAddress || !selectedPhien) return;

    try {
      // Kết nối với blockchain
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
      const contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

      // Lấy thông tin phiên bầu cử
      const sessionData = await contract.layThongTinPhienBauCu(cuocBauCuId, selectedPhien);

      // Lưu thông tin phiên bầu cử
      const newSessionInfo = {
        isActive: sessionData[0], // dangHoatDongNe
        startTime: new Date(Number(sessionData[1]) * 1000).toLocaleString(), // thoiGianBatDau
        endTime: new Date(Number(sessionData[2]) * 1000).toLocaleString(), // thoiGianKetThuc
        maxVoters: Number(sessionData[3]), // soCuTriToiDa
        candidateCount: Number(sessionData[4]), // soUngVienHienTai
        voterCount: Number(sessionData[5]), // soCuTriHienTai
        electedCandidates: sessionData[6], // ungVienDacCu
        reElection: sessionData[7], // taiBauCu
      };

      // Chỉ cập nhật state nếu có thay đổi để tránh render lại không cần thiết
      if (JSON.stringify(newSessionInfo) !== JSON.stringify(sessionInfo)) {
        setSessionInfo(newSessionInfo);
      }

      // Check if the user can end the session - do this regardless of session state
      if (sessionKey && sessionKey.scwAddress) {
        await checkElectionStatus();
      }

      // Cách xử lý khác nhau tùy theo trạng thái phiên
      const isSessionActive = sessionData[0];

      if (isSessionActive) {
        // Phiên đang hoạt động - lấy thông tin ứng viên và số phiếu hiện tại
        const candidates = await contract.layDanhSachUngVien(cuocBauCuId, selectedPhien);

        // Lấy số phiếu từng ứng viên
        const tempResults = [];
        let totalVotes = 0;

        for (const candidate of candidates) {
          try {
            const votes = await contract.laySoPhieuUngVien(cuocBauCuId, selectedPhien, candidate);
            totalVotes += Number(votes);

            tempResults.push({
              address: candidate,
              votes: Number(votes),
              isElected: false, // Chưa có kết quả đắc cử
            });
          } catch (err) {
            console.warn(`Không thể lấy số phiếu cho ứng viên ${candidate}:`, err);
          }
        }

        // Tính phần trăm
        for (const result of tempResults) {
          result.percentage =
            totalVotes > 0 ? Number(((result.votes / totalVotes) * 100).toFixed(2)) : 0;
        }

        // Sắp xếp theo số phiếu giảm dần
        tempResults.sort((a, b) => b.votes - a.votes);

        // Cập nhật kết quả
        const formattedResults = tempResults.map((r) => ({
          ...r,
          displayAddress: `${r.address.substring(0, 6)}...${r.address.substring(r.address.length - 4)}`,
        }));

        // Chỉ cập nhật state nếu có thay đổi để tránh render lại không cần thiết
        if (JSON.stringify(formattedResults) !== JSON.stringify(votingResults)) {
          setVotingResults(formattedResults);
        }

        // Cập nhật tiến trình
        if (Number(sessionData[5]) > 0) {
          const percentage = ((totalVotes / Number(sessionData[5])) * 100).toFixed(2);
          const newProgress = {
            total: Number(sessionData[5]),
            voted: totalVotes,
            percentage: Number(percentage),
          };

          // Chỉ cập nhật state nếu có thay đổi
          if (JSON.stringify(newProgress) !== JSON.stringify(progress)) {
            setProgress(newProgress);
          }
        }
      } else {
        // Phiên đã kết thúc - lấy kết quả chính thức
        try {
          const results = await contract.layKetQuaPhienBauCu(cuocBauCuId, selectedPhien);

          // Tính tổng số phiếu
          const totalVotes = results[1].reduce((sum, votes) => sum + Number(votes), 0);

          // Xử lý kết quả bỏ phiếu cho biểu đồ
          const formattedResults = results[0].map((address, index) => {
            const voteCount = Number(results[1][index]);
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : 0;
            const isElected = sessionData[6].includes(address);

            return {
              address: address,
              displayAddress:
                address.substring(0, 6) + '...' + address.substring(address.length - 4),
              votes: voteCount,
              percentage: Number(percentage),
              isElected: isElected,
            };
          });

          // Sắp xếp theo số phiếu giảm dần
          formattedResults.sort((a, b) => b.votes - a.votes);

          // Chỉ cập nhật state nếu có thay đổi
          if (JSON.stringify(formattedResults) !== JSON.stringify(votingResults)) {
            setVotingResults(formattedResults);
          }

          // Cập nhật tiến trình
          if (Number(sessionData[5]) > 0) {
            const percentage = ((totalVotes / Number(sessionData[5])) * 100).toFixed(2);
            const newProgress = {
              total: Number(sessionData[5]),
              voted: totalVotes,
              percentage: Number(percentage),
            };

            // Chỉ cập nhật state nếu có thay đổi
            if (JSON.stringify(newProgress) !== JSON.stringify(progress)) {
              setProgress(newProgress);
            }
          }
        } catch (error) {
          console.error('Lỗi khi lấy kết quả:', error);
          setError(
            'Không thể lấy kết quả bầu cử: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      }

      // Check early end condition after getting results
      if (sessionInfo?.isActive) {
        try {
          const canEarlyEnd = await contract.canKetThucSomPhienBauCu(cuocBauCuId, selectedPhien);
          if (canEarlyEnd !== canEarlyEndSession) {
            setCanEarlyEndSession(canEarlyEnd);
          }
        } catch (err) {
          console.error('Lỗi khi kiểm tra điều kiện kết thúc sớm:', err);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy kết quả phiên bầu cử:', error);
      setError(`Lỗi khi lấy kết quả: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [
    contractAddress,
    selectedPhien,
    cuocBauCuId,
    sessionKey,
    sessionInfo,
    checkElectionStatus,
    votingResults,
    progress,
    canEarlyEndSession,
  ]);

  // Sửa useEffect cho việc lấy kết quả phiên bầu cử
  useEffect(() => {
    if (!selectedPhien || !contractAddress) return;

    let isMounted = true;

    const fetchResults = async () => {
      try {
        setIsChangingSession(true);
        await fetchSessionResults();
      } catch (error) {
        console.error('Lỗi khi lấy kết quả phiên bầu cử:', error);
        if (isMounted) {
          setError(
            `Lỗi khi lấy kết quả: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } finally {
        if (isMounted) {
          setIsChangingSession(false);
        }
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [selectedPhien, contractAddress, fetchSessionResults]);

  // Sửa useEffect cho việc kiểm tra quyền kết thúc phiên
  useEffect(() => {
    if (!sessionKey || !contractAddress || !selectedPhien || !sessionInfo) return;

    let isMounted = true;

    const checkPermissions = async () => {
      try {
        if (isMounted) {
          await checkElectionStatus();
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra quyền:', error);
      }
    };

    checkPermissions();

    return () => {
      isMounted = false;
    };
  }, [sessionKey, contractAddress, selectedPhien, sessionInfo, checkElectionStatus]);

  // Sửa useEffect cho việc kiểm tra có thể kết thúc sớm phiên không
  useEffect(() => {
    if (!contractAddress || !selectedPhien || !sessionInfo || !sessionInfo.isActive) {
      setCanEarlyEndSession(false);
      return;
    }

    let isMounted = true;

    const checkEarlyEndCondition = async () => {
      try {
        const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
        const contract = new ethers.Contract(contractAddress, cuocBauCuAbi, provider);

        const canEarlyEnd = await contract.canKetThucSomPhienBauCu(cuocBauCuId, selectedPhien);
        if (isMounted) {
          setCanEarlyEndSession(canEarlyEnd);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra điều kiện kết thúc sớm:', error);
        if (isMounted) {
          setCanEarlyEndSession(false);
        }
      }
    };

    checkEarlyEndCondition();

    return () => {
      isMounted = false;
    };
  }, [contractAddress, selectedPhien, sessionInfo, cuocBauCuId]);

  // Sửa useEffect cho việc theo dõi real-time
  useEffect(() => {
    if (!isMonitoring || !contractAddress || !selectedPhien) return;

    let provider;
    let interval;
    let isMounted = true;

    const setupMonitoring = async () => {
      try {
        // Thiết lập kết nối WebSocket nếu có
        try {
          provider = new ethers.WebSocketProvider('wss://geth.holihu.online/ws');
          console.log('WebSocket kết nối thành công');
        } catch (wsError) {
          // Fallback to HTTP polling
          console.warn('Không thể kết nối WebSocket, sử dụng HTTP polling:', wsError);
          provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
          if (isMounted) {
            interval = setInterval(() => {
              fetchSessionResults().catch(console.error);
            }, 30000); // Cập nhật mỗi 30 giây
          }
          return;
        }

        // Chỉ dùng polling thay vì WebSocket listener (để tránh lỗi event)
        console.log('Thiết lập polling cho cập nhật dữ liệu');
        if (isMounted) {
          interval = setInterval(() => {
            fetchSessionResults().catch(console.error);
          }, 15000); // Cập nhật mỗi 15 giây
        }
      } catch (error) {
        console.error('Lỗi khi thiết lập theo dõi:', error);
        // Fallback nếu có lỗi
        if (isMounted) {
          interval = setInterval(() => {
            fetchSessionResults().catch(console.error);
          }, 30000);
        }
      }
    };

    setupMonitoring();

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (provider) {
        if (provider.destroy) provider.destroy();
        provider.removeAllListeners();
      }
    };
  }, [isMonitoring, contractAddress, selectedPhien, fetchSessionResults]);

  // Tính thời gian còn lại
  const calculateTimeRemaining = () => {
    if (!sessionInfo) return null;

    const endTime = new Date(sessionInfo.endTime);
    const now = new Date();

    if (now > endTime) return 'Phiên đã kết thúc';

    const diff = endTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days > 0 ? `${days} ngày ` : ''}${hours} giờ ${minutes} phút`;
  };

  // Xử lý khi thay đổi phiên bầu cử
  const handleSessionChange = (e) => {
    setSelectedPhien(Number(e.target.value));
  };

  // Toggle theo dõi
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  // Hàm làm mới dữ liệu
  const refreshData = () => {
    fetchSessionResults();
  };

  // Tạo và gửi UserOperation để dừng phiên
  const endSession = async () => {
    if (!contractAddress || !selectedPhien) {
      setError('Thiếu thông tin cần thiết để dừng phiên bầu cử');
      return;
    }

    // Reset status message
    setStatusMessage('');

    // If no session key, try to get one
    if (!sessionKey) {
      const newSessionKey = await getSessionKey();
      if (!newSessionKey) {
        setError('Không thể lấy khóa phiên để thực hiện giao dịch');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setStatus(DeploymentStatus.PREPARING_CALLDATA);
      showMessage('Đang chuẩn bị dữ liệu để kết thúc phiên bầu cử...');

      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // Kết nối tới contract
      const quanLyCuocBauCuAbi = [
        'function ketThucPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external',
        'function ketThucSomPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external',
        'function canKetThucSomPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool)',
      ];

      const simpleAccountAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      const quanLyCuocBauCu = new ethers.Contract(contractAddress, quanLyCuocBauCuAbi, provider);
      const simpleAccount = new ethers.Contract(sessionKey.scwAddress, simpleAccountAbi, provider);
      const entryPoint = new ethers.Contract(
        contractAddresses.entryPointAddress,
        entryPointAbi,
        provider,
      );

      // Kiểm tra có thể kết thúc sớm không
      const canEarlyEnd = await quanLyCuocBauCu.canKetThucSomPhienBauCu(cuocBauCuId, selectedPhien);
      setCanEarlyEndSession(canEarlyEnd);

      // Chuẩn bị callData
      const methodName = canEarlyEnd ? 'ketThucSomPhienBauCu' : 'ketThucPhienBauCu';
      const endSessionCallData = quanLyCuocBauCu.interface.encodeFunctionData(methodName, [
        cuocBauCuId, // ID cuộc bầu cử (luôn là 1 trong contract)
        selectedPhien,
      ]);

      const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
        contractAddress,
        0,
        endSessionCallData,
      ]);

      // Lấy nonce hiện tại
      const currentNonce = await entryPoint.getNonce(sessionKey.scwAddress);

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        contractAddresses.paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Chuẩn bị UserOperation
      const userOp = {
        sender: sessionKey.scwAddress,
        nonce: currentNonce.toString(),
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: '1000000',
        verificationGasLimit: '1000000',
        preVerificationGas: '300000',
        maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      setStatus(DeploymentStatus.CREATING_USEROP);
      showMessage(
        canEarlyEnd
          ? 'Đang tạo giao dịch kết thúc sớm phiên bầu cử...'
          : 'Đang tạo giao dịch kết thúc phiên bầu cử...',
      );

      try {
        // Ký UserOperation
        const userOpHash = await entryPoint.layHashThaoTac(userOp);
        const signingKey = new ethers.SigningKey(sessionKey.sessionKey);
        const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

        const signature = ethers.Signature.from({
          r: signatureObj.r,
          s: signatureObj.s,
          v: signatureObj.v,
        }).serialized;

        userOp.signature = signature;

        // Gửi UserOperation
        setStatus(DeploymentStatus.SENDING_USEROP);
        showMessage('Đang gửi giao dịch đến blockchain...');

        const { data } = await apiClient.post('/api/bundler/submit', {
          ...userOp,
          userOpHash: userOpHash,
        });

        if (!data) {
          throw new Error('Không nhận được phản hồi từ bundler');
        }

        const frontendHash = data.userOpHash || userOpHash;
        const backendHash = data.backendHash || frontendHash;
        const txHash = data.txHash || frontendHash;

        setFrontendHash(frontendHash);
        setBackendHash(backendHash);
        setTxHash(txHash);

        setStatus(DeploymentStatus.WAITING_CONFIRMATION);
        showMessage(
          canEarlyEnd
            ? 'Đang chờ blockchain xác nhận kết thúc sớm phiên bầu cử...'
            : 'Đang chờ blockchain xác nhận kết thúc phiên bầu cử...',
        );

        // Kiểm tra trạng thái giao dịch
        let checkCount = 0;
        const maxChecks = 30;
        const checkInterval = setInterval(async () => {
          checkCount++;
          try {
            const { data: statusData } = await apiClient.get(
              `/api/bundler/check-status?userOpHash=${frontendHash}`,
            );

            if (statusData && statusData.status === 'success') {
              clearInterval(checkInterval);

              setStatus(DeploymentStatus.SUCCESS);
              setSuccessAlert(
                canEarlyEnd
                  ? 'Phiên bầu cử đã được kết thúc sớm thành công!'
                  : 'Phiên bầu cử đã được kết thúc thành công!',
              );
              showMessage(
                canEarlyEnd
                  ? 'Phiên bầu cử đã được kết thúc sớm thành công! Dữ liệu đã được lưu trên blockchain.'
                  : 'Phiên bầu cử đã được kết thúc thành công! Dữ liệu đã được lưu trên blockchain.',
              );

              // Cập nhật lại dữ liệu
              await fetchSessionResults();
            } else if (statusData && statusData.status === 'failed') {
              clearInterval(checkInterval);
              setStatus(DeploymentStatus.FAILED);
              setError('Giao dịch thất bại: ' + (statusData.message || 'Lỗi không xác định'));
            }

            if (checkCount >= maxChecks) {
              clearInterval(checkInterval);
              showMessage(
                'Đã hết thời gian chờ xác nhận. Vui lòng làm mới trang để kiểm tra trạng thái.',
              );
            }
          } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái:', error);
          }
        }, 5000); // Kiểm tra mỗi 5 giây
      } catch (error) {
        setStatus(DeploymentStatus.FAILED);
        setError(
          'Lỗi khi ký hoặc gửi giao dịch: ' +
            (error instanceof Error ? error.message : String(error)),
        );
      }
    } catch (error) {
      setStatus(DeploymentStatus.FAILED);
      setError(
        'Lỗi khi dừng phiên bầu cử: ' + (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Tạo và tải xuống báo cáo PDF
  const handleDownloadPDF = async () => {
    if (!selectedPhien || !sessionInfo) {
      setError('Vui lòng chọn phiên bầu cử để tải kết quả');
      return;
    }

    try {
      setIsLoading(true);
      showMessage('Đang chuẩn bị tài liệu PDF...');

      // Create a new PDF document in A4 format with UTF-8 support
      const pdf = new jsPDF('portrait', 'mm', 'a4');

      // Import the standard font with encoding
      pdf.addFont('helvetica', 'Helvetica', 'normal');
      pdf.addFont('helvetica', 'Helvetica', 'bold');

      // Force Unicode encoding
      const textOptions = { isUnicode: true };

      // Add header
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('KẾT QUẢ BẦU CỬ BLOCKCHAIN', 105, 15, { align: 'center', ...textOptions });

      if (electionInfo) {
        pdf.setFontSize(14);
        pdf.text(electionInfo.name, 105, 22, { align: 'center', ...textOptions });
      }

      // Add generation info and timestamp
      const now = new Date().toLocaleString();
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`Thời gian xuất báo cáo: ${now}`, 105, 30, { align: 'center', ...textOptions });
      pdf.text(`Phiên bầu cử: #${selectedPhien}`, 105, 35, { align: 'center', ...textOptions });

      // Add session info
      pdf.setFontSize(12);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('THÔNG TIN PHIÊN BẦU CỬ', 15, 45, textOptions);
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(10);

      const sessionStatus = sessionInfo.isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc';
      pdf.text(`Trạng thái: ${sessionStatus}`, 15, 52, textOptions);
      pdf.text(`Thời gian bắt đầu: ${sessionInfo.startTime}`, 15, 57, textOptions);
      pdf.text(`Thời gian kết thúc: ${sessionInfo.endTime}`, 15, 62, textOptions);
      pdf.text(`Số cử tri: ${sessionInfo.voterCount}`, 15, 67, textOptions);
      pdf.text(`Số ứng viên: ${sessionInfo.candidateCount}`, 15, 72, textOptions);
      pdf.text(
        `Số ứng viên trúng cử: ${sessionInfo.electedCandidates?.length || 0}`,
        15,
        77,
        textOptions,
      );
      pdf.text(
        `Tỷ lệ tham gia: ${progress.percentage}% (${progress.voted}/${progress.total})`,
        15,
        82,
        textOptions,
      );

      // Add progress bar
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(200, 200, 200);
      pdf.rect(15, 87, 180, 5, 'F');

      // Select color based on percentage
      if (progress.percentage >= 80) {
        pdf.setFillColor(16, 185, 129); // emerald-500
      } else if (progress.percentage >= 50) {
        pdf.setFillColor(37, 99, 235); // blue-600
      } else {
        pdf.setFillColor(245, 158, 11); // amber-500
      }

      pdf.rect(15, 87, 180 * (progress.percentage / 100), 5, 'F');

      // Current Y position for content
      let yPosition = 100;

      // Add Results title
      pdf.setFontSize(12);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('KẾT QUẢ PHIÊN BẦU CỬ', 15, yPosition, textOptions);
      yPosition += 10;

      // Get charts container element
      const chartContainer = document.getElementById('result-charts-container');
      if (chartContainer && votingResults.length > 0) {
        const chartCanvas = await html2canvas(chartContainer, {
          scale: 2, // Higher quality
          useCORS: true,
          logging: false,
        });

        // Add chart image to PDF
        const chartImgData = chartCanvas.toDataURL('image/png');
        pdf.addImage(chartImgData, 'PNG', 15, yPosition, 180, 85);
        yPosition += 90;
      }

      // Create table for results
      if (votingResults.length > 0) {
        // Check if we need a new page
        if (yPosition > 240) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setFontSize(12);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('BẢNG KẾT QUẢ CHI TIẾT', 15, yPosition, textOptions);
        yPosition += 8;

        // Table headers
        pdf.setFillColor(73, 85, 156); // indigo color
        pdf.setTextColor(255, 255, 255);
        pdf.rect(15, yPosition, 10, 8, 'F');
        pdf.rect(25, yPosition, 70, 8, 'F');
        pdf.rect(95, yPosition, 30, 8, 'F');
        pdf.rect(125, yPosition, 30, 8, 'F');
        pdf.rect(155, yPosition, 40, 8, 'F');

        pdf.setFontSize(9);
        pdf.text('#', 20, yPosition + 5, { align: 'center', ...textOptions });
        pdf.text('Địa chỉ', 60, yPosition + 5, { align: 'center', ...textOptions });
        pdf.text('Số phiếu', 110, yPosition + 5, { align: 'center', ...textOptions });
        pdf.text('Tỷ lệ', 140, yPosition + 5, { align: 'center', ...textOptions });
        pdf.text('Trạng thái', 175, yPosition + 5, { align: 'center', ...textOptions });

        yPosition += 8;

        // Table rows
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.setFont('Helvetica', 'normal');

        let rowColor = false;
        votingResults.forEach((result, index) => {
          // Check if we need a new page
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 15;

            // Recreate headers on new page
            pdf.setFillColor(73, 85, 156);
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(9);
            pdf.setFont('Helvetica', 'bold');

            pdf.rect(15, yPosition, 10, 8, 'F');
            pdf.rect(25, yPosition, 70, 8, 'F');
            pdf.rect(95, yPosition, 30, 8, 'F');
            pdf.rect(125, yPosition, 30, 8, 'F');
            pdf.rect(155, yPosition, 40, 8, 'F');

            pdf.text('#', 20, yPosition + 5, { align: 'center', ...textOptions });
            pdf.text('Địa chỉ', 60, yPosition + 5, { align: 'center', ...textOptions });
            pdf.text('Số phiếu', 110, yPosition + 5, { align: 'center', ...textOptions });
            pdf.text('Tỷ lệ', 140, yPosition + 5, { align: 'center', ...textOptions });
            pdf.text('Trạng thái', 175, yPosition + 5, { align: 'center', ...textOptions });

            yPosition += 8;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(8);
            pdf.setFont('Helvetica', 'normal');
            rowColor = false;
          }

          // Row background
          if (result.isElected) {
            pdf.setFillColor(209, 250, 229); // emerald-100
            pdf.rect(15, yPosition, 180, 7, 'F');
          } else if (rowColor) {
            pdf.setFillColor(243, 244, 246); // gray-100
            pdf.rect(15, yPosition, 180, 7, 'F');
          }
          rowColor = !rowColor;

          // Row content
          pdf.text((index + 1).toString(), 20, yPosition + 4, { align: 'center', ...textOptions });
          pdf.text(result.displayAddress, 60, yPosition + 4, { align: 'center', ...textOptions });
          pdf.text(result.votes.toString(), 110, yPosition + 4, {
            align: 'center',
            ...textOptions,
          });
          pdf.text(`${result.percentage}%`, 140, yPosition + 4, {
            align: 'center',
            ...textOptions,
          });

          const status = result.isElected
            ? sessionInfo.isActive
              ? 'Đang kiểm'
              : 'Trúng cử'
            : sessionInfo.isActive
              ? 'Đang kiểm'
              : 'Chưa trúng';
          pdf.text(status, 175, yPosition + 4, { align: 'center', ...textOptions });

          yPosition += 7;
        });
      }

      // Add elected candidates section if applicable
      if (
        !sessionInfo.isActive &&
        sessionInfo.electedCandidates &&
        sessionInfo.electedCandidates.length > 0
      ) {
        // Check if we need a new page
        if (yPosition > 240) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setFontSize(12);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('DANH SÁCH TRÚNG CỬ', 15, yPosition + 15, textOptions);
        yPosition += 25;

        // Add elected candidates in a nice format
        sessionInfo.electedCandidates.forEach((address, index) => {
          const candidateInfo = votingResults.find((r) => r.address === address);

          // Check if we need a new page
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 15;

            pdf.setFontSize(12);
            pdf.setFont('Helvetica', 'bold');
            pdf.text('DANH SÁCH TRÚNG CỬ (TIẾP THEO)', 15, yPosition, textOptions);
            yPosition += 10;
          }

          pdf.setDrawColor(16, 185, 129); // emerald-500
          pdf.setFillColor(240, 255, 244); // emerald-50
          pdf.rect(15, yPosition, 180, 20, 'FD');

          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('Helvetica', 'bold');
          pdf.text(`Ứng viên #${index + 1}:`, 25, yPosition + 7, textOptions);
          pdf.setFont('Helvetica', 'normal');

          const shortAddress = `${address.substring(0, 18)}...${address.substring(address.length - 8)}`;
          pdf.text(shortAddress, 70, yPosition + 7, textOptions);

          if (candidateInfo) {
            pdf.text(
              `Số phiếu: ${candidateInfo.votes} (${candidateInfo.percentage}% tổng số phiếu)`,
              25,
              yPosition + 15,
              textOptions,
            );
          }

          yPosition += 25;
        });
      }

      // Save the PDF
      pdf.save(`ket-qua-bau-cu-phien-${selectedPhien}.pdf`);

      setIsLoading(false);
      setSuccessAlert('Đã tạo báo cáo PDF thành công!');
    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error);
      setError(`Không thể tạo tệp PDF: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };

  // RENDER LOGIC
  if (isLoading) {
    return (
      <>
        <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-white transition-colors duration-500`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header kết quả */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-r from-indigo-100/80 via-indigo-200/80 to-indigo-100/80 dark:from-indigo-900/80 dark:via-purple-900/80 dark:to-indigo-900/80 rounded-2xl shadow-xl border border-indigo-200/50 dark:border-indigo-800/50 p-8 mb-8">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-200 dark:to-purple-200">
              Kết Quả Bầu Cử Blockchain
            </h1>
            {electionInfo && (
              <p className="text-xl opacity-90 text-indigo-600 dark:text-indigo-200">
                {electionInfo.name}
              </p>
            )}
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            {/* Pattern SVG */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {error && <ErrorAlert message={error} />}

        {/* Status Message */}
        {statusMessage && (
          <StatusMessage status={status} message={statusMessage} isProcessing={isProcessing} />
        )}

        {/* Chọn phiên bầu cử */}
        <div className="backdrop-blur-lg bg-white/90 dark:bg-white/5 rounded-xl shadow-xl p-4 sm:p-6 mb-8 border border-gray-200 dark:border-white/10 transition-all duration-300 hover:bg-white/100 dark:hover:bg-white/10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
            <div className="flex-grow">
              <label
                htmlFor="phien-select"
                className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2"
              >
                Chọn phiên bầu cử:
              </label>
              <select
                id="phien-select"
                value={selectedPhien || ''}
                onChange={handleSessionChange}
                className="block w-full px-3 py-2 sm:px-4 sm:py-3 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                disabled={isChangingSession}
              >
                <option value="">-- Chọn phiên bầu cử --</option>
                {danhSachPhien.map((phien) => (
                  <option key={phien.id} value={phien.id}>
                    Phiên #{phien.id} - {phien.isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
                    {phien.isActive
                      ? ` (${phien.candidateCount} ứng viên, ${phien.voterCount} cử tri)`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={refreshData}
                className="flex-1 sm:flex-auto px-3 sm:px-5 py-2 sm:py-3 bg-indigo-600 dark:bg-indigo-700 text-white text-sm sm:text-base rounded-lg hover:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg shadow-indigo-600/20 dark:shadow-indigo-900/50"
                disabled={isChangingSession || !selectedPhien}
              >
                {isChangingSession ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                    <span className="whitespace-nowrap">Đang cập nhật...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Làm mới
                  </span>
                )}
              </button>

              {/* PDF Download button */}
              <button
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-auto px-3 sm:px-5 py-2 sm:py-3 bg-blue-600 dark:bg-blue-700 text-white text-sm sm:text-base rounded-lg hover:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/50"
                disabled={isChangingSession || !selectedPhien || isLoading}
              >
                <span className="flex items-center justify-center">
                  {isLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  <span className="whitespace-nowrap">Xuất PDF</span>
                </span>
              </button>

              <button
                onClick={toggleMonitoring}
                className={`flex-1 sm:flex-auto px-3 sm:px-5 py-2 sm:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-lg flex items-center justify-center text-sm sm:text-base ${
                  isMonitoring
                    ? 'bg-rose-600 dark:bg-rose-700 text-white hover:bg-rose-500 dark:hover:bg-rose-600 focus:ring-rose-500 shadow-rose-600/20 dark:shadow-rose-900/50'
                    : 'bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-500 dark:hover:bg-emerald-600 focus:ring-emerald-500 shadow-emerald-600/20 dark:shadow-emerald-900/50'
                }`}
                disabled={!selectedPhien}
              >
                {isMonitoring ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="whitespace-nowrap">Dừng theo dõi</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span className="whitespace-nowrap">Theo dõi</span>
                  </>
                )}
              </button>

              {/* Always show stop/end session button when a session is selected and active */}
              {sessionInfo && sessionInfo.isActive && (
                <button
                  onClick={() => setConfirmModalOpen(true)}
                  className="flex-1 sm:flex-auto px-3 sm:px-5 py-2 sm:py-3 bg-red-600 dark:bg-red-700 text-white text-sm sm:text-base rounded-lg hover:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg shadow-red-600/20 dark:shadow-red-900/50"
                  disabled={isProcessing}
                >
                  <span className="flex items-center justify-center">
                    {isProcessing ? (
                      <svg
                        className="animate-spin -ml-1 mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                          fill="none"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                    )}
                    <span className="whitespace-nowrap">
                      {canEarlyEndSession ? 'Kết thúc sớm' : 'Dừng phiên'}
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>

          {isMonitoring && (
            <div className="mt-4 bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-300/50 dark:border-emerald-700/50 rounded-lg p-4 text-emerald-700 dark:text-emerald-300 text-sm animate-pulse">
              <div className="flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div>
                  <p className="font-medium">Đang theo dõi phiên bầu cử #{selectedPhien}</p>
                  <p className="mt-1 text-emerald-600 dark:text-emerald-400/80">
                    Dữ liệu sẽ tự động cập nhật khi có phiếu bầu mới hoặc phiên kết thúc.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedPhien && sessionInfo ? (
          <>
            {/* Thông tin phiên bầu cử */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-8">
              <div className="backdrop-blur-lg bg-white/90 dark:bg-white/5 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-200 dark:border-white/10 transition-all duration-300 hover:bg-white/100 dark:hover:bg-white/10">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-200 dark:to-purple-200 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400"
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
                  Thông tin phiên #{selectedPhien}
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                    <span
                      className={`font-medium ${sessionInfo.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                    >
                      {sessionInfo.isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Thời gian bắt đầu:</span>
                    <span className="font-medium text-gray-800 dark:text-indigo-200">
                      {sessionInfo.startTime}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Thời gian kết thúc:</span>
                    <span className="font-medium text-gray-800 dark:text-indigo-200">
                      {sessionInfo.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Số cử tri:</span>
                    <span className="font-medium text-gray-800 dark:text-indigo-200">
                      {sessionInfo.voterCount}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Số ứng viên:</span>
                    <span className="font-medium text-gray-800 dark:text-indigo-200">
                      {sessionInfo.candidateCount}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                    <span className="text-gray-600 dark:text-gray-400">Số ứng viên trúng cử:</span>
                    <span className="font-medium text-gray-800 dark:text-indigo-200">
                      {sessionInfo.electedCandidates?.length || 0}
                    </span>
                  </div>

                  {sessionInfo.isActive && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/40 rounded-lg border border-indigo-200 dark:border-indigo-700/50 p-4 mt-2">
                      <p className="text-indigo-700 dark:text-indigo-200 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          <strong className="font-semibold">Thời gian còn lại:</strong>{' '}
                          <span className="ml-1 text-indigo-800 dark:text-indigo-100">
                            {calculateTimeRemaining()}
                          </span>
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="backdrop-blur-lg bg-white/90 dark:bg-white/5 rounded-xl shadow-xl p-4 sm:p-6 border border-gray-200 dark:border-white/10 transition-all duration-300 hover:bg-white/100 dark:hover:bg-white/10">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-200 dark:to-purple-200 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z"
                    />
                  </svg>
                  Tiến trình bỏ phiếu
                </h2>
                <div className="text-right mb-2">
                  <span className="font-medium text-lg">
                    <span className="text-indigo-700 dark:text-indigo-300">{progress.voted}</span>
                    <span className="text-gray-600 dark:text-gray-400"> / </span>
                    <span className="text-indigo-700 dark:text-indigo-300">{progress.total}</span>
                    <span className="text-gray-600 dark:text-gray-400"> cử tri </span>
                    <span className="text-indigo-800 dark:text-indigo-400">
                      ({progress.percentage}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 mb-6 overflow-hidden">
                  <div
                    className={`h-5 rounded-full transition-all duration-500 ${
                      progress.percentage >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : progress.percentage >= 50
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  >
                    {progress.percentage > 10 && (
                      <div className="h-full flex items-center justify-end pr-2">
                        <span className="text-xs font-semibold">{progress.percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-800/50 dark:to-indigo-900/50 p-5 rounded-lg text-center shadow-lg">
                    <div className="text-3xl font-bold text-indigo-800 dark:text-indigo-300">
                      {sessionInfo.voterCount}
                    </div>
                    <div className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                      Tổng số cử tri
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-800/50 dark:to-emerald-900/50 p-5 rounded-lg text-center shadow-lg">
                    <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">
                      {progress.voted}
                    </div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                      Số phiếu đã bỏ
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-sm">
                  {progress.percentage >= 60 ? (
                    <div className="flex items-start bg-emerald-50/80 dark:bg-emerald-900/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-700/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-emerald-800 dark:text-emerald-300">
                        Đủ điều kiện kết thúc sớm (trên 60% tham gia). Ban tổ chức có thể kết thúc
                        phiên bầu cử ngay bây giờ.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start bg-indigo-50/80 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400 flex-shrink-0"
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
                      <span className="text-indigo-800 dark:text-indigo-300">
                        Chưa đủ điều kiện kết thúc sớm (cần trên 60% cử tri tham gia). Phiên sẽ kết
                        thúc theo thời gian đã định.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kết quả bỏ phiếu */}
            <div className="backdrop-blur-lg bg-white/90 dark:bg-white/5 rounded-xl shadow-xl p-4 sm:p-6 mb-8 border border-gray-200 dark:border-white/10 transition-all duration-300 hover:bg-white/100 dark:hover:bg-white/10">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-200 dark:to-purple-200 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2z"
                  />
                </svg>
                {sessionInfo.isActive ? 'Kết quả bỏ phiếu hiện tại' : 'Kết quả bỏ phiếu cuối cùng'}
                {sessionInfo.isActive && (
                  <span className="ml-2 inline-block animate-pulse px-2 py-1 bg-indigo-100 dark:bg-indigo-800/50 text-xs rounded-md text-indigo-700 dark:text-indigo-300">
                    Đang cập nhật
                  </span>
                )}
              </h2>

              {votingResults.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600 opacity-50"
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
                  <p className="text-xl">Chưa có dữ liệu kết quả bỏ phiếu.</p>
                  {sessionInfo.isActive && (
                    <p className="mt-2 text-indigo-600 dark:text-indigo-400">
                      Phiên bầu cử đang diễn ra, hãy chờ đến khi có cử tri bỏ phiếu.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div
                    id="result-charts-container"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-10"
                  >
                    {/* Biểu đồ cột với hiệu ứng glass */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-lg h-64 sm:h-96">
                      <h3 className="text-center text-base sm:text-lg font-medium mb-2 sm:mb-3 text-indigo-700 dark:text-indigo-300">
                        Số phiếu theo ứng viên
                      </h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                          data={votingResults}
                          margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                        >
                          <XAxis
                            dataKey="displayAddress"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tick={{ fill: darkMode ? '#a5b4fc' : '#4f46e5' }}
                            stroke={darkMode ? '#4f46e5' : '#4338ca'}
                          />
                          <YAxis
                            tick={{ fill: darkMode ? '#a5b4fc' : '#4f46e5' }}
                            stroke={darkMode ? '#4f46e5' : '#4338ca'}
                          />
                          <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                          <Bar
                            dataKey="votes"
                            name="Số phiếu"
                            fill={(data) => (data.isElected ? '#10b981' : '#6366f1')}
                            radius={[6, 6, 0, 0]}
                          >
                            {votingResults.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isElected ? '#10b981' : COLORS[index % COLORS.length]}
                                style={{
                                  filter: 'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.3))',
                                }}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Biểu đồ tròn với hiệu ứng glass */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-lg h-64 sm:h-96">
                      <h3 className="text-center text-base sm:text-lg font-medium mb-2 sm:mb-3 text-indigo-700 dark:text-indigo-300">
                        Phân phối phiếu bầu
                      </h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={votingResults}
                            dataKey="votes"
                            nameKey="displayAddress"
                            cx="50%"
                            cy="50%"
                            outerRadius={window.innerWidth < 640 ? 70 : 100}
                            innerRadius={window.innerWidth < 640 ? 40 : 60}
                            labelLine={false}
                            label={({
                              cx,
                              cy,
                              midAngle,
                              innerRadius,
                              outerRadius,
                              percent,
                              index,
                            }) => {
                              // Only show labels if there's enough space
                              if (window.innerWidth < 400 && votingResults.length > 3) return null;

                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);

                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill={darkMode ? '#fff' : '#333'}
                                  fontSize={window.innerWidth < 640 ? 9 : 11}
                                  fontWeight="bold"
                                  textAnchor={x > cx ? 'start' : 'end'}
                                  dominantBaseline="central"
                                >
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                            style={{ filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.4))' }}
                          >
                            {votingResults.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isElected ? '#10b981' : COLORS[index % COLORS.length]}
                                style={{
                                  opacity: 0.95,
                                  strokeWidth: entry.isElected ? 2 : 1,
                                  stroke: entry.isElected
                                    ? darkMode
                                      ? '#fff'
                                      : '#333'
                                    : darkMode
                                      ? '#333'
                                      : '#fff',
                                }}
                              />
                            ))}
                          </Pie>
                          <Legend
                            layout={window.innerWidth < 500 ? 'vertical' : 'horizontal'}
                            align={window.innerWidth < 500 ? 'center' : 'center'}
                            verticalAlign={window.innerWidth < 500 ? 'bottom' : 'bottom'}
                            formatter={(value, entry, index) => (
                              <span
                                style={{
                                  color: darkMode ? '#a5b4fc' : '#4f46e5',
                                  fontSize: window.innerWidth < 640 ? '0.7rem' : '0.8rem',
                                }}
                              >
                                {votingResults[index]?.displayAddress}
                              </span>
                            )}
                          />
                          <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bảng chi tiết với thiết kế responsive */}
                  <div
                    id="results-table-container"
                    className="overflow-hidden rounded-xl shadow-xl border border-gray-200 dark:border-indigo-900/50"
                  >
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-indigo-50 dark:bg-indigo-900/50">
                          <tr>
                            <th className="px-2 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-2 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              Địa chỉ
                            </th>
                            <th className="px-2 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              Số phiếu
                            </th>
                            <th className="px-2 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              Tỷ lệ
                            </th>
                            <th className="px-2 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {votingResults.map((result, index) => (
                            <tr
                              key={result.address}
                              className={`${
                                result.isElected
                                  ? 'bg-emerald-50 dark:bg-emerald-900/30'
                                  : 'odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800/30 dark:even:bg-gray-800/10'
                              } hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-150`}
                            >
                              <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center justify-center rounded-full h-5 w-5 sm:h-7 sm:w-7 text-xs sm:text-sm
                                  ${
                                    result.isElected
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-600/50'
                                      : 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800/70 dark:text-gray-300 dark:border-gray-700'
                                  }`}
                                >
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap font-mono text-xs sm:text-sm text-gray-800 dark:text-indigo-300">
                                {result.displayAddress}
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                <span className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">
                                  {result.votes}
                                </span>
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 mr-2 sm:mr-3">
                                    <div
                                      className={`h-1.5 sm:h-2 rounded-full ${result.isElected ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                      style={{ width: `${result.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs sm:text-sm text-gray-700 dark:text-indigo-200">
                                    {result.percentage}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs">
                                {sessionInfo.isActive ? (
                                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-800/50 dark:text-amber-300 dark:border-amber-700/50">
                                    <svg
                                      className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 animate-spin"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    Đang kiểm
                                  </span>
                                ) : result.isElected ? (
                                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-800/50 dark:text-emerald-300 dark:border-emerald-700/50">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Trúng cử
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700/50">
                                    Chưa trúng
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Thông tin người trúng cử */}
            {!sessionInfo.isActive &&
              sessionInfo.electedCandidates &&
              sessionInfo.electedCandidates.length > 0 && (
                <div className="backdrop-blur-lg bg-white/90 dark:bg-white/5 rounded-xl shadow-xl p-4 sm:p-6 mb-8 border border-gray-200 dark:border-white/10 transition-all duration-300 hover:bg-white/100 dark:hover:bg-white/10">
                  <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-200 dark:to-purple-200 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Danh sách trúng cử
                  </h2>

                  <div className="bg-emerald-50 dark:bg-emerald-900/30 backdrop-blur-md p-5 rounded-lg mb-8 text-emerald-800 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-700/50">
                    <div className="flex">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mr-4 text-emerald-600 dark:text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <div>
                        <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-200">
                          Kết quả bầu cử đã được ghi nhận trên blockchain
                        </h3>
                        <p className="mt-2 leading-relaxed text-emerald-700 dark:text-emerald-300">
                          Phiên bầu cử #{selectedPhien} đã kết thúc với{' '}
                          <span className="font-semibold text-emerald-900 dark:text-white">
                            {sessionInfo.electedCandidates.length}
                          </span>{' '}
                          ứng viên trúng cử.
                          {sessionInfo.electedCandidates.length > 1 &&
                            ' Kết quả có số phiếu ngang nhau.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                    {sessionInfo.electedCandidates.map((address, index) => {
                      const candidateInfo = votingResults.find((r) => r.address === address);
                      return (
                        <div
                          key={address}
                          className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-teal-900/30 backdrop-blur-md border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3 sm:p-5 shadow-lg transition-all duration-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:shadow-emerald-300/20 dark:hover:shadow-emerald-900/40 group"
                        >
                          <div className="flex items-center">
                            <div className="bg-emerald-200 dark:bg-emerald-800/70 rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center mr-3 sm:mr-4 border border-emerald-300 dark:border-emerald-600/50 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <span className="text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-lg">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-sm sm:text-lg text-emerald-800 dark:text-emerald-200">
                                {address.substring(0, 6)}...{address.substring(address.length - 4)}
                              </h3>
                              {candidateInfo && (
                                <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">
                                  {candidateInfo.votes} phiếu ({candidateInfo.percentage}%)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 sm:mt-4 bg-emerald-200/50 dark:bg-emerald-900/30 h-1.5 rounded-full">
                            <div
                              className="h-1.5 bg-emerald-500 rounded-full"
                              style={{ width: `${candidateInfo?.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </>
        ) : (
          <EmptyStatePrompt
            message="Chọn một phiên bầu cử để xem kết quả"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4 text-indigo-500 dark:text-indigo-400 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
            actionButton={{
              description: 'Sử dụng menu dropdown ở trên để chọn phiên bầu cử',
              button: (
                <button
                  onClick={() => getSessionKey()}
                  className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200"
                >
                  Lấy khóa phiên
                </button>
              ),
            }}
          />
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={endSession}
        title={
          canEarlyEndSession
            ? 'Xác nhận kết thúc sớm phiên bầu cử'
            : 'Xác nhận kết thúc phiên bầu cử'
        }
        message={`Bạn có chắc chắn muốn ${canEarlyEndSession ? 'kết thúc sớm' : 'kết thúc'} phiên bầu cử #${selectedPhien}? ${
          canEarlyEndSession
            ? 'Phiên bầu cử đã đủ điều kiện kết thúc sớm do đã đạt tỷ lệ tham gia cần thiết.'
            : 'Hành động này sẽ đóng phiên bầu cử hiện tại.'
        } Hành động này không thể hoàn tác.`}
        confirmText={canEarlyEndSession ? 'Kết thúc sớm' : 'Kết thúc phiên'}
      />

      {/* Success Alert */}
      {successAlert && (
        <SuccessAlert message={successAlert} onClose={() => setSuccessAlert(null)} />
      )}

      {/* Theme Toggle */}
      <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  );
};

// Add animation for progress bar
const style = document.createElement('style');
style.textContent = `
  @keyframes progress {
    0% { width: 5%; }
    10% { width: 15%; }
    25% { width: 35%; }
    50% { width: 55%; }
    75% { width: 75%; }
    90% { width: 90%; }
    100% { width: 95%; }
  }
  .animate-progress {
    animation: progress 3s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default KetQuaBauCu;
