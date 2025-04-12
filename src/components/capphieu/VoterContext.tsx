import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useToast } from '../../test/components/use-toast';
import apiClient from '../../api/apiClient';
import type { PhienBauCu } from '../../store/types';

// Types
export interface CuTri {
  id: number;
  email?: string;
  sdt?: string;
  xacMinh: boolean;
  blockchainAddress?: string;
  hasBlockchainWallet?: boolean;
  voterName?: string;
  taiKhoanId?: number;
  phienBauCuId?: number;
  addedAt?: string;
}

export interface BallotMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
  external_url?: string;
  animation_url?: string;
  background_color?: string;
}

export interface ContractAddresses {
  entryPointAddress?: string;
  factoryAddress?: string;
  paymasterAddress?: string;
  quanLyPhieuBauAddress?: string;
  hluTokenAddress?: string;
}

export interface FilterOptions {
  showVerified: boolean;
  showUnverified: boolean;
  searchTerm: string;
  showWithTicket: boolean;
  showWithoutTicket: boolean;
}

export interface TicketSendProgress {
  current: number;
  total: number;
  success: number;
  failed: number;
  retries: number;
  currentBatchSize: number;
}

export interface VoterContextType {
  // Data
  voters: CuTri[];
  selectedVoters: number[];
  totalVoters: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  contractAddresses: ContractAddresses;
  filterOptions: FilterOptions;
  blockchainSessionId: number | null;
  ticketSendProgress: TicketSendProgress;

  // Status flags
  isLoadingVoters: boolean;
  isRefreshingList: boolean;
  isInitialLoading: boolean;
  isSendingBulkTickets: boolean;
  isPaused: boolean;
  isCheckingBlockchain: boolean;

  // Actions
  setSelectedVoters: React.Dispatch<React.SetStateAction<number[]>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;

  // Methods
  fetchVoters: (forceRefresh?: boolean) => Promise<void>;
  fetchBlockchainSessionId: () => Promise<number | null>;
  toggleVoterSelection: (voterId: number) => void;
  toggleSelectAllOnPage: () => void;
  sendBallotTickets: () => Promise<void>;
  generateTokenMetadata: (voter: CuTri) => string;
  checkVoterHasBallot: (voter: CuTri) => Promise<boolean>;
  goToPage: (page: number) => void;

  // Computed properties
  areAllVotersSelectedOnPage: boolean;
}

// Default values for context
const defaultFilterOptions: FilterOptions = {
  showVerified: true,
  showUnverified: true,
  searchTerm: '',
  showWithTicket: true,
  showWithoutTicket: true,
};

const defaultProgress: TicketSendProgress = {
  current: 0,
  total: 0,
  success: 0,
  failed: 0,
  retries: 0,
  currentBatchSize: 0,
};

// Create the context
export const VoterContext = createContext<VoterContextType | undefined>(undefined);

// Props for the provider
interface VoterProviderProps {
  children: ReactNode;
  selectedSession: PhienBauCu | null;
  sessionStatus: {
    isActive: boolean;
    startTime: number;
    endTime: number;
  };
  electionStatus: {
    isOwner: boolean;
    isActive: boolean;
    hasBanToChucRole: boolean;
  };
  sessionKey: any;
  scwAddress: string;
  refreshData?: () => void;
  ballotMetadata?: BallotMetadata;
  quanLyCuocBauCuAddress?: string;
  blockchainSessionId?: number | null;
  onTransactionSuccess?: (txHash: string) => void;
  onBlockchainSessionIdFound?: (sessionId: number) => void;
}

// Provider component
export const VoterProvider: React.FC<VoterProviderProps> = ({
  children,
  selectedSession,
  sessionStatus,
  electionStatus,
  sessionKey,
  scwAddress,
  refreshData,
  ballotMetadata,
  quanLyCuocBauCuAddress,
  blockchainSessionId: initialBlockchainSessionId,
  onTransactionSuccess,
  onBlockchainSessionIdFound,
}) => {
  // State
  const [voters, setVoters] = useState<CuTri[]>([]);
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [isLoadingVoters, setIsLoadingVoters] = useState<boolean>(false);
  const [isRefreshingList, setIsRefreshingList] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalVoters, setTotalVoters] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses>({});
  const [blockchainSessionId, setBlockchainSessionId] = useState<number | null>(
    initialBlockchainSessionId || null,
  );
  const [isSendingBulkTickets, setIsSendingBulkTickets] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [ticketSendProgress, setTicketSendProgress] = useState<TicketSendProgress>(defaultProgress);
  const [isCheckingBlockchain, setIsCheckingBlockchain] = useState<boolean>(false);

  // References
  const lastRequestRef = React.useRef<number>(0);
  const isCheckingRef = React.useRef<boolean>(false);

  // Hooks
  const { toast } = useToast();

  // Toggle voter selection
  const toggleVoterSelection = (voterId: number) => {
    setSelectedVoters((prev) => {
      if (prev.includes(voterId)) {
        return prev.filter((id) => id !== voterId);
      } else {
        return [...prev, voterId];
      }
    });
  };

  // Toggle select all voters on current page
  const toggleSelectAllOnPage = () => {
    const eligibleVoterIds = voters
      .filter((voter) => !voter.hasBlockchainWallet)
      .map((voter) => voter.id);

    const allSelected = eligibleVoterIds.every((id) => selectedVoters.includes(id));

    if (allSelected) {
      // Bỏ chọn tất cả trên trang này
      setSelectedVoters((prev) => prev.filter((id) => !eligibleVoterIds.includes(id)));
    } else {
      // Chọn tất cả trên trang này
      const newSelectedVoters = [...selectedVoters];
      eligibleVoterIds.forEach((id) => {
        if (!newSelectedVoters.includes(id)) {
          newSelectedVoters.push(id);
        }
      });
      setSelectedVoters(newSelectedVoters);
    }
  };

  // Check if all voters on current page are selected
  const areAllVotersSelectedOnPage = React.useMemo(() => {
    const eligibleVoters = voters.filter((voter) => !voter.hasBlockchainWallet);
    if (eligibleVoters.length === 0) return false;
    return eligibleVoters.every((voter) => selectedVoters.includes(voter.id));
  }, [voters, selectedVoters]);

  // Pagination function
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Fetch contract addresses
  const fetchContractAddresses = async () => {
    try {
      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      if (response.data && response.data.success) {
        setContractAddresses(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy địa chỉ contract:', error);
      return null;
    }
  };

  // Fetch blockchain session ID
  const fetchBlockchainSessionId = async () => {
    if (!selectedSession?.blockchainAddress || !contractAddresses.entryPointAddress) {
      return null;
    }

    setIsCheckingBlockchain(true);
    try {
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI cho QuanLyCuocBauCu chỉ với hàm cần thiết
      const quanLyCuocBauCuAbi = [
        'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
        'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool)',
      ];

      const quanLyCuocBauCu = new ethers.Contract(
        selectedSession.blockchainAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Lấy danh sách phiên bầu cử
      console.log('[DEBUG] Fetching session list from blockchain...');
      const phienBauCuList = await quanLyCuocBauCu.layDanhSachPhienBauCu(1, 0, 10);

      if (phienBauCuList && phienBauCuList.length > 0) {
        // Lấy phiên bầu cử mới nhất (cuối cùng trong danh sách)
        const latestSessionId = phienBauCuList[phienBauCuList.length - 1];
        console.log('[DEBUG] Latest blockchain session ID:', Number(latestSessionId));

        // Kiểm tra trạng thái phiên bầu cử
        const isActive = await quanLyCuocBauCu.laPhienHoatDong(1, latestSessionId);
        console.log('[DEBUG] Session active status:', isActive);

        setBlockchainSessionId(Number(latestSessionId));

        // Thông báo cho component cha
        if (onBlockchainSessionIdFound) {
          onBlockchainSessionIdFound(Number(latestSessionId));
        }

        return Number(latestSessionId);
      } else {
        console.warn('[DEBUG] No election sessions found on blockchain');
        return null;
      }
    } catch (error) {
      console.error('[DEBUG] Error fetching blockchain session ID:', error);
      return null;
    } finally {
      setIsCheckingBlockchain(false);
    }
  };

  // Check if voter has ballot
  const checkVoterHasBallot = async (voter: CuTri) => {
    if (
      !voter.blockchainAddress ||
      !selectedSession?.blockchainAddress ||
      !contractAddresses.quanLyPhieuBauAddress
    ) {
      return false;
    }

    try {
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
      const quanLyPhieuBauAbi = [
        'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
      ];

      const quanLyPhieuBau = new ethers.Contract(
        contractAddresses.quanLyPhieuBauAddress,
        quanLyPhieuBauAbi,
        provider,
      );

      // Sử dụng ID phiên bầu cử từ blockchain nếu có
      const sessionIdToUse =
        blockchainSessionId || (await fetchBlockchainSessionId()) || selectedSession.id;

      return await quanLyPhieuBau.daNhanNFT(
        selectedSession.blockchainAddress,
        sessionIdToUse,
        voter.blockchainAddress,
      );
    } catch (error) {
      console.warn(`Lỗi kiểm tra phiếu bầu cho cử tri ${voter.blockchainAddress}:`, error);
      return false;
    }
  };

  // Update blockchain status for voters
  const updateBlockchainStatus = async (votersList: CuTri[], sessionId: number) => {
    if (!selectedSession?.blockchainAddress || !contractAddresses.quanLyPhieuBauAddress) {
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI cho các contract
      const quanLyPhieuBauAbi = [
        'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
      ];

      const quanLyCuocBauCuAbi = [
        'function laCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) view returns (bool)',
      ];

      // Tạo các instance contract
      const quanLyPhieuBau = new ethers.Contract(
        contractAddresses.quanLyPhieuBauAddress,
        quanLyPhieuBauAbi,
        provider,
      );

      const quanLyCuocBauCu = selectedSession.blockchainAddress
        ? new ethers.Contract(selectedSession.blockchainAddress, quanLyCuocBauCuAbi, provider)
        : null;

      // Kiểm tra mỗi lần 5 cử tri để tránh quá nhiều request
      const votersToCheck = votersList
        .filter((v) => v.blockchainAddress && !v.hasBlockchainWallet)
        .slice(0, 5);

      let hasUpdates = false;
      const updatedVoters = [...votersList];

      for (const voter of votersToCheck) {
        if (voter.blockchainAddress) {
          try {
            // Kiểm tra song song cả hai điều kiện
            let hasBallot = false;
            let isVoter = false;

            if (quanLyCuocBauCu) {
              [hasBallot, isVoter] = await Promise.all([
                quanLyPhieuBau.daNhanNFT(
                  selectedSession.blockchainAddress,
                  sessionId,
                  voter.blockchainAddress,
                ),
                quanLyCuocBauCu.laCuTri(
                  1, // ID cuộc bầu cử luôn là 1 trong contract
                  sessionId,
                  voter.blockchainAddress,
                ),
              ]);
            } else {
              // Nếu quanLyCuocBauCu là null, chỉ kiểm tra hasBallot
              hasBallot = await quanLyPhieuBau.daNhanNFT(
                selectedSession.blockchainAddress,
                sessionId,
                voter.blockchainAddress,
              );
            }

            // Cập nhật trạng thái nếu có phiếu bầu nhưng chưa được cập nhật
            if (hasBallot && !voter.hasBlockchainWallet) {
              const voterIndex = updatedVoters.findIndex((v) => v.id === voter.id);
              if (voterIndex !== -1) {
                updatedVoters[voterIndex] = {
                  ...updatedVoters[voterIndex],
                  hasBlockchainWallet: true,
                };
                hasUpdates = true;
              }
            }

            console.log(`Cử tri ${voter.email}: isVoter=${isVoter}, hasBallot=${hasBallot}`);
          } catch (error) {
            console.warn(`Lỗi kiểm tra phiếu bầu cho ${voter.blockchainAddress}:`, error);
          }
        }
      }

      // Cập nhật state nếu có sự thay đổi
      if (hasUpdates) {
        setVoters(updatedVoters);
      }
    } catch (error) {
      console.warn('Lỗi khi kiểm tra trạng thái blockchain:', error);
    }
  };

  // Generate token metadata for ballot
  const generateTokenMetadata = (voter: CuTri) => {
    // Sử dụng metadata được cung cấp hoặc tạo mặc định
    if (ballotMetadata) {
      // Thay thế các placeholder trong metadata
      const name = ballotMetadata.name.replace('{voterName}', voter.voterName || '');
      const description = ballotMetadata.description
        .replace('{voterName}', voter.voterName || '')
        .replace('{voterEmail}', voter.email || '')
        .replace('{voterAddress}', voter.blockchainAddress || '');

      // Tạo bản sao của các thuộc tính và thêm thông tin cụ thể của cử tri
      const attributes = [...ballotMetadata.attributes];

      // Đảm bảo có thuộc tính địa chỉ cử tri
      if (!attributes.some((attr) => attr.trait_type === 'Địa chỉ cử tri')) {
        attributes.push({
          trait_type: 'Địa chỉ cử tri',
          value: voter.blockchainAddress || '',
        });
      }

      // Đảm bảo có thuộc tính ngày cấp
      if (!attributes.some((attr) => attr.trait_type === 'Ngày cấp')) {
        attributes.push({
          trait_type: 'Ngày cấp',
          value: new Date().toISOString(),
        });
      }

      // Đảm bảo có hash kiểm chứng
      if (!attributes.some((attr) => attr.trait_type === 'Hash kiểm chứng')) {
        const timestamp = Date.now();
        attributes.push({
          trait_type: 'Hash kiểm chứng',
          value: ethers.keccak256(ethers.toUtf8Bytes(`${voter.blockchainAddress}-${timestamp}`)),
        });
      }

      // Thêm thông tin phiên bầu cử
      if (!attributes.some((attr) => attr.trait_type === 'ID phiên bầu cử')) {
        attributes.push({
          trait_type: 'ID phiên bầu cử',
          value: String(blockchainSessionId || selectedSession?.id || ''),
        });
      }

      // Tạo metadata cuối cùng
      const metadata = {
        name,
        description,
        image: ballotMetadata.image,
        attributes,
        background_color: ballotMetadata.background_color,
        external_url: ballotMetadata.external_url,
        animation_url: ballotMetadata.animation_url,
      };

      const jsonString = JSON.stringify(metadata);
      const base64Encoded = btoa(jsonString);
      return `data:application/json;base64,${base64Encoded}`;
    }

    // Tạo metadata mặc định nếu không có metadata được cung cấp
    const timestamp = Date.now();
    const uniqueId = `${timestamp}-${voter.id}-${Math.floor(Math.random() * 1000000)}`;

    const metadata = {
      name: `Phiếu bầu cử - ${selectedSession?.tenPhienBauCu || 'Không xác định'}`,
      description: `Phiếu bầu chính thức cho cử tri ${voter.email || voter.voterName || voter.blockchainAddress} trong phiên bầu cử "${selectedSession?.tenPhienBauCu || 'Không xác định'}"`,
      image: 'ipfs://QmDefaultBallotImage',
      attributes: [
        {
          trait_type: 'Loại phiếu',
          value: 'Phiếu bầu cử chính thức',
        },
        {
          trait_type: 'ID phiên',
          value: String(blockchainSessionId || selectedSession?.id || 'Không xác định'),
        },
        {
          trait_type: 'Địa chỉ cử tri',
          value: voter.blockchainAddress || '',
        },
        {
          trait_type: 'Ngày cấp',
          value: new Date().toISOString(),
        },
        {
          trait_type: 'Trạng thái',
          value: 'Hợp lệ',
        },
        {
          trait_type: 'Hash kiểm chứng',
          value: ethers.keccak256(ethers.toUtf8Bytes(`${voter.blockchainAddress}-${timestamp}`)),
        },
      ],
      external_url: `https://holihu.online/ballot/${uniqueId}`,
    };

    const jsonString = JSON.stringify(metadata);
    const base64Encoded = btoa(jsonString);
    return `data:application/json;base64,${base64Encoded}`;
  };

  // Fetch voters from API
  const fetchVoters = async (forceRefresh: boolean = false) => {
    if (!selectedSession?.id) {
      setVoters([]);
      setTotalVoters(0);
      setTotalPages(1);
      setIsInitialLoading(false);
      return;
    }

    try {
      const requestId = Date.now();
      lastRequestRef.current = requestId;

      if (forceRefresh) {
        setIsRefreshingList(true);
      } else {
        setIsLoadingVoters(true);
      }

      console.log('[DEBUG] Fetching voters for session ID:', selectedSession.id);

      try {
        // Gọi đúng endpoint từ CuTriController.cs - path parameter
        const response = await apiClient.get(`/api/CuTri/phienbaucu/${selectedSession.id}`);

        // Nếu không phải request mới nhất, bỏ qua
        if (lastRequestRef.current !== requestId) return;

        if (response.data) {
          // Xử lý phân trang và lọc ở client
          let allVoters = response.data;

          // Lọc theo searchTerm
          if (filterOptions.searchTerm) {
            const searchTerm = filterOptions.searchTerm.toLowerCase();
            allVoters = allVoters.filter(
              (voter: CuTri) =>
                voter.email?.toLowerCase().includes(searchTerm) ||
                voter.sdt?.toLowerCase().includes(searchTerm) ||
                voter.blockchainAddress?.toLowerCase().includes(searchTerm),
            );
          }

          // Lọc theo trạng thái xác minh
          if (!(filterOptions.showVerified && filterOptions.showUnverified)) {
            if (filterOptions.showVerified) {
              allVoters = allVoters.filter((voter: CuTri) => voter.xacMinh);
            } else if (filterOptions.showUnverified) {
              allVoters = allVoters.filter((voter: CuTri) => !voter.xacMinh);
            }
          }

          // Lọc theo trạng thái phiếu bầu
          if (!(filterOptions.showWithTicket && filterOptions.showWithoutTicket)) {
            if (filterOptions.showWithTicket) {
              allVoters = allVoters.filter((voter: CuTri) => voter.hasBlockchainWallet);
            } else if (filterOptions.showWithoutTicket) {
              allVoters = allVoters.filter((voter: CuTri) => !voter.hasBlockchainWallet);
            }
          }

          // Tính toán phân trang
          const total = allVoters.length;
          const totalPages = Math.ceil(total / pageSize) || 1;

          // Phân trang
          const startIndex = (currentPage - 1) * pageSize;
          const paginatedVoters = allVoters.slice(startIndex, startIndex + pageSize);

          // Cập nhật state
          setVoters(paginatedVoters);
          setTotalVoters(total);
          setTotalPages(totalPages);

          // Kiểm tra phiên bầu cử từ blockchain nếu chưa có
          const sessionIdToUse = blockchainSessionId || (await fetchBlockchainSessionId());

          // Nếu có địa chỉ blockchain và contract, kiểm tra trạng thái
          if (
            selectedSession.blockchainAddress &&
            contractAddresses.quanLyPhieuBauAddress &&
            sessionIdToUse
          ) {
            updateBlockchainStatus(paginatedVoters, sessionIdToUse);
          }
        }
      } catch (error) {
        console.warn('[DEBUG] Error with primary approach, trying alternative:', error);

        // Thử phương thức thay thế với query parameter
        try {
          const params = new URLSearchParams();
          params.append('phienBauCuId', selectedSession.id.toString());
          params.append('page', currentPage.toString());
          params.append('pageSize', pageSize.toString());

          // Thêm các filter params
          if (filterOptions.searchTerm) {
            params.append('search', filterOptions.searchTerm);
          }

          // Trạng thái xác minh
          if (filterOptions.showVerified && !filterOptions.showUnverified) {
            params.append('verificationStatus', 'verified');
          } else if (!filterOptions.showVerified && filterOptions.showUnverified) {
            params.append('verificationStatus', 'unverified');
          }

          // Trạng thái phiếu bầu
          if (filterOptions.showWithTicket && !filterOptions.showWithoutTicket) {
            params.append('ballotStatus', 'withTicket');
          } else if (!filterOptions.showWithTicket && filterOptions.showWithoutTicket) {
            params.append('ballotStatus', 'withoutTicket');
          }

          // Gọi API với query parameters
          const response = await apiClient.get(`/api/CuTri/phien-bau-cu?${params.toString()}`);

          // Kiểm tra request mới nhất
          if (lastRequestRef.current !== requestId) return;

          if (response.data && response.data.success) {
            const loadedVoters = response.data.data;
            setVoters(loadedVoters);
            setTotalVoters(response.data.totalRecords || loadedVoters.length);
            setTotalPages(
              response.data.totalPages || Math.ceil(loadedVoters.length / pageSize) || 1,
            );

            // Kiểm tra blockchain status
            const sessionIdToUse = blockchainSessionId || (await fetchBlockchainSessionId());
            if (
              selectedSession.blockchainAddress &&
              contractAddresses.quanLyPhieuBauAddress &&
              sessionIdToUse
            ) {
              updateBlockchainStatus(loadedVoters, sessionIdToUse);
            }
          } else {
            throw new Error(response.data?.message || 'Không thể tải danh sách cử tri');
          }
        } catch (secondError) {
          console.error('[DEBUG] Both API approaches failed:', secondError);
          throw secondError;
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching voters:', error);
      // Log thêm thông tin lỗi chi tiết
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: any } };
        console.error('Error details:', axiosError.response.status, axiosError.response.data);
      }

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: `Không thể tải danh sách cử tri: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      });
    } finally {
      setIsLoadingVoters(false);
      setIsRefreshingList(false);
      setIsInitialLoading(false);
    }
  };

  // Send ballot tickets to selected voters
  const sendBallotTickets = async () => {
    if (selectedVoters.length === 0) {
      toast({
        variant: 'default',
        title: 'Chưa chọn cử tri',
        description: 'Vui lòng chọn ít nhất một cử tri để cấp phiếu bầu',
      });
      return;
    }

    if (!selectedSession?.blockchainAddress || !selectedSession.id || !sessionKey) {
      toast({
        variant: 'destructive',
        title: 'Không thể cấp phiếu bầu',
        description:
          'Thiếu thông tin cần thiết. Vui lòng chọn cuộc bầu cử, phiên bầu cử và tạo khóa phiên.',
      });
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      return;
    }

    try {
      setIsSendingBulkTickets(true);
      setTicketSendProgress({
        current: 0,
        total: selectedVoters.length,
        success: 0,
        failed: 0,
        retries: 0,
        currentBatchSize: 0,
      });

      // Lấy thông tin contract addresses
      if (!contractAddresses.entryPointAddress || !contractAddresses.quanLyPhieuBauAddress) {
        const addressesResponse = await apiClient.get('/api/Blockchain/contract-addresses');
        if (!addressesResponse.data || !addressesResponse.data.success) {
          throw new Error('Không thể lấy địa chỉ contract');
        }
        setContractAddresses(addressesResponse.data);
      }

      const entryPointAddress = contractAddresses.entryPointAddress;
      const paymasterAddress = contractAddresses.paymasterAddress;
      const quanLyPhieuBauAddress = contractAddresses.quanLyPhieuBauAddress;

      // Provider để tương tác với blockchain
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // Kết nối đến các contract
      const quanLyCuocBauCuAbi = [
        'function capPhieuBauChoNhieuCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address[] memory cuTriList, string[] memory uriList) external',
        'function laCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) view returns (bool)',
        'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) view returns (uint256[])',
      ];

      const quanLyPhieuBauAbi = [
        'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
      ];

      const simpleAccountAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      const quanLyCuocBauCu = new ethers.Contract(
        selectedSession.blockchainAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      if (!quanLyPhieuBauAddress) {
        throw new Error('Địa chỉ quanLyPhieuBau không hợp lệ');
      }

      const quanLyPhieuBau = new ethers.Contract(
        quanLyPhieuBauAddress,
        quanLyPhieuBauAbi,
        provider,
      );

      const simpleAccount = new ethers.Contract(sessionKey.scwAddress, simpleAccountAbi, provider);

      if (!entryPointAddress) {
        throw new Error('Địa chỉ EntryPoint không hợp lệ');
      }

      const entryPoint = new ethers.Contract(entryPointAddress, entryPointAbi, provider);

      // Lấy danh sách các cử tri đã được chọn
      const selectedVotersList = voters.filter((voter) => selectedVoters.includes(voter.id));

      // Xác định phiên bầu cử ID từ blockchain
      let sessionIdToUse = blockchainSessionId;

      if (!sessionIdToUse) {
        try {
          const phienBauCuList = await quanLyCuocBauCu.layDanhSachPhienBauCu(1, 0, 10);
          if (phienBauCuList && phienBauCuList.length > 0) {
            sessionIdToUse = Number(phienBauCuList[phienBauCuList.length - 1]);
            setBlockchainSessionId(sessionIdToUse);
            if (onBlockchainSessionIdFound) {
              onBlockchainSessionIdFound(sessionIdToUse);
            }
          } else {
            sessionIdToUse = selectedSession.id;
          }
        } catch (error) {
          console.error('[DEBUG] Error fetching blockchain session ID:', error);
          sessionIdToUse = selectedSession.id;
        }
      }

      console.log(`[DEBUG] Using session ID for ballot: ${sessionIdToUse}`);

      // Lọc cử tri theo lô để kiểm tra hiệu quả hơn
      const PROCESS_BATCH_SIZE = 5;
      const votersToProcess = [];

      for (let i = 0; i < selectedVotersList.length; i += PROCESS_BATCH_SIZE) {
        const batch = selectedVotersList.slice(i, i + PROCESS_BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (voter) => {
            if (!voter || !voter.blockchainAddress) return null;

            try {
              // Kiểm tra song song cả hai điều kiện
              const [hasTicket, isVoter] = await Promise.all([
                quanLyPhieuBau.daNhanNFT(
                  selectedSession.blockchainAddress,
                  sessionIdToUse,
                  voter.blockchainAddress,
                ),
                quanLyCuocBauCu.laCuTri(
                  1, // Election ID luôn là 1 trong contract
                  sessionIdToUse,
                  voter.blockchainAddress,
                ),
              ]);

              // Chỉ thêm vào danh sách cử tri chưa có phiếu và đã được triển khai lên blockchain
              if (!hasTicket && isVoter) {
                return voter;
              } else if (hasTicket && !voter.hasBlockchainWallet) {
                // Cập nhật UI nếu cử tri đã có phiếu bầu nhưng UI chưa phản ánh điều này
                setVoters((prevVoters) =>
                  prevVoters.map((v) =>
                    v.id === voter.id ? { ...v, hasBlockchainWallet: true } : v,
                  ),
                );
              } else if (!isVoter) {
                console.log(
                  `[WARNING] Voter ${voter.email} not found on blockchain. Need to deploy first.`,
                );
              }
            } catch (error) {
              console.warn(`Lỗi khi kiểm tra cử tri ${voter.blockchainAddress}:`, error);
            }
            return null;
          }),
        );

        // Thêm cử tri hợp lệ vào danh sách xử lý
        votersToProcess.push(...batchResults.filter(Boolean));

        // Cập nhật tiến độ kiểm tra
        setTicketSendProgress((prev) => ({
          ...prev,
          current: Math.min(i + PROCESS_BATCH_SIZE, selectedVotersList.length),
          total: selectedVotersList.length,
        }));
      }

      if (votersToProcess.length === 0) {
        toast({
          title: 'Thông báo',
          description: 'Không có cử tri nào cần cấp phiếu bầu.',
        });
        setIsSendingBulkTickets(false);
        return;
      }

      console.log(`Chuẩn bị cấp phiếu cho ${votersToProcess.length} cử tri...`);

      // Cải tiến: Sử dụng dynamic batch size
      // Ban đầu dùng batch lớn, nếu lỗi thì giảm kích thước batch tự động
      let BATCH_SIZE = 20;
      let retryCount = 0;
      let processedCount = 0;

      // Reset tiến độ
      setTicketSendProgress({
        current: 0,
        total: votersToProcess.length,
        success: 0,
        failed: 0,
        retries: 0,
        currentBatchSize: BATCH_SIZE,
      });

      while (processedCount < votersToProcess.length && retryCount < 5 && !isPaused) {
        const remainingVoters = votersToProcess.slice(processedCount);
        const currentBatchSize = Math.min(BATCH_SIZE, remainingVoters.length);
        const currentBatch = remainingVoters.slice(0, currentBatchSize);

        setTicketSendProgress((prev) => ({
          ...prev,
          currentBatchSize: currentBatchSize,
        }));

        console.log(
          `Đang xử lý batch ${Math.floor(processedCount / currentBatchSize) + 1} với ${currentBatch.length} cử tri (kích thước batch: ${BATCH_SIZE})...`,
        );

        try {
          // Tạo metadata cho từng cử tri
          const filteredBatch = currentBatch.filter((voter): voter is CuTri => voter !== null);
          const voterAddresses = filteredBatch.map((voter) => voter.blockchainAddress);
          const tokenURIs = filteredBatch.map((voter) => generateTokenMetadata(voter));

          // Lấy nonce hiện tại
          let currentNonce;
          try {
            currentNonce = await entryPoint.getNonce(sessionKey.scwAddress);
          } catch {
            try {
              currentNonce = await entryPoint.nonceNguoiGui(sessionKey.scwAddress);
            } catch (nonceError) {
              throw new Error(
                'Không thể lấy nonce: ' +
                  (nonceError instanceof Error ? nonceError.message : 'Lỗi không xác định'),
              );
            }
          }

          // Tính toán gas limit dựa trên kích thước batch
          // Mỗi cử tri tiêu thụ khoảng 50,000 gas
          const estimatedGas = 500000 + currentBatch.length * 50000;

          // Tạo calldata
          const capPhieuCallData = quanLyCuocBauCu.interface.encodeFunctionData(
            'capPhieuBauChoNhieuCuTri',
            [
              1, // ID cuộc bầu cử trong contract luôn là 1
              sessionIdToUse,
              voterAddresses,
              tokenURIs,
            ],
          );

          const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
            selectedSession.blockchainAddress,
            0,
            capPhieuCallData,
          ]);

          // Chuẩn bị paymasterAndData
          const currentTimestamp = Math.floor(Date.now() / 1000);
          const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
          const validationTime = currentTimestamp;

          if (!paymasterAddress) {
            throw new Error('Địa chỉ paymaster không được định nghĩa');
          }

          const paymasterAndData = ethers.concat([
            paymasterAddress,
            ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
            ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
          ]);

          // Chuẩn bị UserOperation
          const userOp = {
            sender: sessionKey.scwAddress,
            nonce: currentNonce.toString(),
            initCode: '0x',
            callData: executeCallData,
            callGasLimit: estimatedGas.toString(),
            verificationGasLimit: Math.floor(estimatedGas * 0.8).toString(),
            preVerificationGas: '300000',
            maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
            maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
            paymasterAndData: paymasterAndData,
            signature: '0x',
          };

          // Lấy hash và ký userOp
          const userOpHash = await entryPoint.layHashThaoTac(userOp);

          try {
            const signingKey = new ethers.SigningKey(sessionKey.sessionKey);
            const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

            const signature = ethers.Signature.from({
              r: signatureObj.r,
              s: signatureObj.s,
              v: signatureObj.v,
            }).serialized;

            userOp.signature = signature;
          } catch (error) {
            throw new Error(
              'Lỗi khi ký giao dịch: ' +
                (error instanceof Error ? error.message : 'Không xác định'),
            );
          }

          // Gửi UserOperation
          console.log(`Đang gửi giao dịch cấp phiếu cho ${currentBatch.length} cử tri...`);

          const response = await apiClient.post('/api/bundler/submit', {
            ...userOp,
            userOpHash: userOpHash,
          });

          if (!response.data) {
            throw new Error('Không nhận được phản hồi từ bundler');
          }

          // Thông báo transaction success
          const txHash = response.data.txHash || response.data.userOpHash;
          if (txHash && onTransactionSuccess) {
            onTransactionSuccess(txHash);
          }

          // Giám sát giao dịch
          if (txHash) {
            // Theo dõi trạng thái giao dịch
            let confirmed = false;
            for (let i = 0; i < 10 && !isPaused; i++) {
              // Thử tối đa 10 lần
              await new Promise((resolve) => setTimeout(resolve, 3000)); // Đợi 3 giây

              try {
                const statusResponse = await apiClient.get(
                  `/api/bundler/check-status?userOpHash=${userOpHash}`,
                );

                if (statusResponse.data && statusResponse.data.status === 'success') {
                  confirmed = true;
                  break;
                } else if (statusResponse.data && statusResponse.data.status === 'failed') {
                  throw new Error(statusResponse.data.message || 'Giao dịch thất bại');
                }
              } catch (error) {
                console.warn('Lỗi khi kiểm tra trạng thái:', error);
              }
            }

            if (!confirmed && !isPaused) {
              console.warn('Không thể xác nhận trạng thái giao dịch, nhưng tiếp tục xử lý');
            }
          }

          // Cập nhật tiến độ
          processedCount += currentBatch.length;
          const currentProcessedCount = processedCount;
          setTicketSendProgress((prev) => ({
            ...prev,
            current: currentProcessedCount,
            success: prev.success + currentBatch.length,
          }));

          // Cập nhật trạng thái cử tri trong UI
          const updatedVoterIds = currentBatch
            .filter((voter): voter is CuTri => voter !== null)
            .map((voter) => voter.id);
          setVoters((prev) =>
            prev.map((voter) =>
              updatedVoterIds.includes(voter.id) ? { ...voter, hasBlockchainWallet: true } : voter,
            ),
          );

          // Nếu thành công, có thể tăng batch size cho lần sau
          if (BATCH_SIZE < 30 && retryCount === 0) {
            BATCH_SIZE += 5;
          }

          // Đợi 3 giây để blockchain cập nhật
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`Lỗi khi cấp phiếu cho batch với ${currentBatch.length} cử tri:`, error);

          setTicketSendProgress((prev) => ({
            ...prev,
            retries: prev.retries + 1,
          }));

          // Giảm kích thước batch và thử lại
          retryCount++;
          BATCH_SIZE = Math.max(5, Math.floor(BATCH_SIZE / 2));

          // Nếu batch đã nhỏ nhất (5) và vẫn lỗi, đánh dấu cử tri trong batch này là thất bại
          if (BATCH_SIZE <= 5 && retryCount >= 3) {
            setTicketSendProgress((prev) => ({
              ...prev,
              failed: prev.failed + currentBatch.length,
            }));

            // Tiếp tục với cử tri tiếp theo
            processedCount += currentBatch.length;
          }
        }
      }

      // Hiển thị kết quả cuối cùng
      const finalProgress = ticketSendProgress;
      if (finalProgress.success > 0) {
        toast({
          title: 'Cấp phiếu bầu thành công',
          description: `Đã cấp phiếu bầu cho ${finalProgress.success} cử tri. ${finalProgress.failed > 0 ? `${finalProgress.failed} cử tri thất bại.` : ''}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Cấp phiếu bầu thất bại',
          description: 'Không thể cấp phiếu bầu cho cử tri nào.',
        });
      }

      // Làm mới danh sách cử tri
      if (refreshData) {
        setTimeout(refreshData, 5000); // Làm mới sau 5 giây
      } else {
        setTimeout(() => fetchVoters(true), 5000); // Làm mới danh sách cử tri
      }

      // Clear selection
      setSelectedVoters([]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi khi cấp phiếu bầu',
        description: (error as Error).message,
      });
    } finally {
      setIsSendingBulkTickets(false);
      setIsPaused(false);
    }
  };

  // Fetch contract addresses on mount
  useEffect(() => {
    fetchContractAddresses();
  }, []);

  // Initialize blockchain session ID
  useEffect(() => {
    if (selectedSession?.blockchainAddress && contractAddresses.entryPointAddress) {
      fetchBlockchainSessionId();
    }
  }, [selectedSession?.blockchainAddress, contractAddresses.entryPointAddress]);

  // Update when blockchainSessionId prop changes
  useEffect(() => {
    if (initialBlockchainSessionId !== null && initialBlockchainSessionId !== blockchainSessionId) {
      setBlockchainSessionId(initialBlockchainSessionId ?? null);
    }
  }, [initialBlockchainSessionId, blockchainSessionId]);

  // Fetch voters when dependencies change
  useEffect(() => {
    fetchVoters();
  }, [selectedSession?.id, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions]);

  // Provide the context
  const contextValue: VoterContextType = {
    // Data
    voters,
    selectedVoters,
    totalVoters,
    totalPages,
    currentPage,
    pageSize,
    contractAddresses,
    filterOptions,
    blockchainSessionId,
    ticketSendProgress,

    // Status flags
    isLoadingVoters,
    isRefreshingList,
    isInitialLoading,
    isSendingBulkTickets,
    isPaused,
    isCheckingBlockchain,

    // Actions
    setSelectedVoters,
    setCurrentPage,
    setPageSize,
    setFilterOptions,
    setIsPaused,

    // Methods
    fetchVoters,
    fetchBlockchainSessionId,
    toggleVoterSelection,
    toggleSelectAllOnPage,
    sendBallotTickets,
    generateTokenMetadata,
    checkVoterHasBallot,
    goToPage,

    // Computed properties
    areAllVotersSelectedOnPage,
  };

  return <VoterContext.Provider value={contextValue}>{children}</VoterContext.Provider>;
};

// Custom hook to use the voter context
export const useVoter = () => {
  const context = useContext(VoterContext);
  if (context === undefined) {
    throw new Error('useVoter must be used within a VoterProvider');
  }
  return context;
};
