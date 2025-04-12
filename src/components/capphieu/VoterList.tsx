'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/Tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Progress } from '../../components/ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { useToast } from '../../test/components/use-toast';
import {
  Users,
  Search,
  Mail,
  Phone,
  User,
  Filter,
  Ticket,
  Copy,
  ExternalLink,
  BadgeCheck,
  XCircle,
  AlertCircle,
  Loader,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  BarChart3,
  PauseCircle,
  PlayCircle,
  FileImage,
  AlertTriangle,
} from 'lucide-react';
import type { PhienBauCu } from '../../store/types';
import apiClient from '../../api/apiClient';
import { ethers } from 'ethers';

// Cấu trúc dữ liệu cử tri
interface CuTri {
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

interface BallotMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
  external_url?: string;
  animation_url?: string;
  background_color?: string;
}

interface VoterListProps {
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
  configState?: {
    isValid: boolean;
    message?: string;
  };
  onConfigureClick?: () => void;
}

const VoterList: React.FC<VoterListProps> = ({
  selectedSession,
  sessionStatus,
  electionStatus,
  sessionKey,
  scwAddress,
  refreshData,
  ballotMetadata,
  quanLyCuocBauCuAddress,
  blockchainSessionId,
  onTransactionSuccess,
  onBlockchainSessionIdFound,
  configState,
  onConfigureClick,
}) => {
  // State cho danh sách cử tri
  const [voters, setVoters] = useState<CuTri[]>([]);
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [isLoadingVoters, setIsLoadingVoters] = useState<boolean>(false);
  const [isRefreshingList, setIsRefreshingList] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalVoters, setTotalVoters] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // State cho bộ lọc
  const [filterOptions, setFilterOptions] = useState({
    showVerified: true,
    showUnverified: true,
    searchTerm: '',
    showWithTicket: true,
    showWithoutTicket: true,
  });

  // State cho cấp phiếu bầu
  const [isSendingBulkTickets, setIsSendingBulkTickets] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [ticketSendProgress, setTicketSendProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
    retries: 0,
    currentBatchSize: 0,
    message: '',
  });

  const [isCheckingBallots, setIsCheckingBallots] = useState(false);

  // State để lưu trữ phiên bầu cử từ blockchain
  const [localBlockchainSessionId, setLocalBlockchainSessionId] = useState<number | null>(
    blockchainSessionId ?? null,
  );
  const [isCheckingBlockchain, setIsCheckingBlockchain] = useState<boolean>(false);

  // Tham chiếu cho lần request cuối
  const lastRequestRef = useRef<number>(0);

  // Toast
  const { toast } = useToast();

  // Lấy địa chỉ các contract cần thiết
  const [contractAddresses, setContractAddresses] = useState<{
    entryPointAddress?: string;
    factoryAddress?: string;
    paymasterAddress?: string;
    quanLyPhieuBauAddress?: string;
    hluTokenAddress?: string;
  }>({});

  const [localQuanLyCuocBauCuAddress, setLocalQuanLyCuocBauCuAddress] = useState<
    string | undefined
  >(quanLyCuocBauCuAddress);

  // Thêm useEffect để cập nhật địa chỉ khi prop thay đổi
  useEffect(() => {
    if (quanLyCuocBauCuAddress && quanLyCuocBauCuAddress !== localQuanLyCuocBauCuAddress) {
      console.log(
        '[DEBUG] VoterList - Updating quanLyCuocBauCuAddress from props:',
        quanLyCuocBauCuAddress,
      );
      setLocalQuanLyCuocBauCuAddress(quanLyCuocBauCuAddress);
    }
  }, [quanLyCuocBauCuAddress, localQuanLyCuocBauCuAddress]);

  // Thêm useEffect để sử dụng địa chỉ từ selectedSession nếu có
  useEffect(() => {
    if (selectedSession?.blockchainAddress && !localQuanLyCuocBauCuAddress) {
      console.log(
        '[DEBUG] VoterList - Using blockchainAddress from selectedSession:',
        selectedSession.blockchainAddress,
      );
      setLocalQuanLyCuocBauCuAddress(selectedSession.blockchainAddress);
    }
  }, [selectedSession, localQuanLyCuocBauCuAddress]);

  // Hàm helper để lấy địa chỉ blockchain thực tế với thứ tự ưu tiên đúng
  const getActualQuanLyCuocBauCuAddress = useCallback(() => {
    const actualAddress =
      selectedSession?.blockchainAddress || localQuanLyCuocBauCuAddress || quanLyCuocBauCuAddress;

    console.log('[DEBUG] VoterList - Using blockchain address:', actualAddress);
    return actualAddress;
  }, [selectedSession, localQuanLyCuocBauCuAddress, quanLyCuocBauCuAddress]);

  // Lấy địa chỉ contract khi component mount
  useEffect(() => {
    const fetchContractAddresses = async () => {
      try {
        const response = await apiClient.get('/api/Blockchain/contract-addresses');
        if (response.data && response.data.success) {
          console.log('[DEBUG] Contract addresses received:', response.data);
          setContractAddresses(response.data);
        }
      } catch (error) {
        console.error('Lỗi khi lấy địa chỉ contract:', error);
      }
    };

    fetchContractAddresses();
  }, []);

  // Thêm hàm lấy ID phiên bầu cử từ blockchain
  const fetchBlockchainSessionId = useCallback(async () => {
    // Xác định địa chỉ blockchain thực tế
    const actualQuanLyCuocBauCuAddress = getActualQuanLyCuocBauCuAddress();
    if (!actualQuanLyCuocBauCuAddress || !contractAddresses.entryPointAddress) {
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
        actualQuanLyCuocBauCuAddress,
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

        setLocalBlockchainSessionId(Number(latestSessionId));

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
  }, [
    getActualQuanLyCuocBauCuAddress,
    contractAddresses.entryPointAddress,
    onBlockchainSessionIdFound,
  ]);

  // Kiểm tra phiên bầu cử từ blockchain khi component mount hoặc blockchain address thay đổi
  useEffect(() => {
    if (selectedSession?.blockchainAddress && contractAddresses.entryPointAddress) {
      fetchBlockchainSessionId();
    }
  }, [
    selectedSession?.blockchainAddress,
    contractAddresses.entryPointAddress,
    fetchBlockchainSessionId,
  ]);

  const checkAllVotersBallotStatus = useCallback(async () => {
    if (!selectedSession?.blockchainAddress || !contractAddresses.quanLyPhieuBauAddress) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Thiếu thông tin cần thiết để kiểm tra trạng thái phiếu bầu',
      });
      return;
    }

    try {
      setIsCheckingBallots(true);
      console.log('[DEBUG] Bắt đầu kiểm tra trạng thái phiếu bầu của tất cả cử tri');

      // Xác định địa chỉ blockchain thực tế
      const actualQuanLyCuocBauCuAddress = getActualQuanLyCuocBauCuAddress();
      if (!actualQuanLyCuocBauCuAddress) {
        console.warn('[DEBUG] Không có địa chỉ QuanLyCuocBauCu, không thể kiểm tra trạng thái');
        return;
      }

      // Lấy ID phiên bầu cử từ blockchain nếu chưa có
      const sessionIdToUse = localBlockchainSessionId || (await fetchBlockchainSessionId());
      if (!sessionIdToUse) {
        console.warn('[DEBUG] Không thể lấy ID phiên bầu cử từ blockchain');
        return;
      }

      console.log(`[DEBUG] Sử dụng sessionId từ blockchain: ${sessionIdToUse}`);
      console.log(`[DEBUG] QuanLyCuocBauCu address: ${actualQuanLyCuocBauCuAddress}`);
      console.log(`[DEBUG] QuanLyPhieuBau address: ${contractAddresses.quanLyPhieuBauAddress}`);

      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI cho các contract
      const quanLyPhieuBauAbi = [
        'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
      ];

      // Kết nối đến contract QuanLyPhieuBau
      const quanLyPhieuBau = new ethers.Contract(
        contractAddresses.quanLyPhieuBauAddress,
        quanLyPhieuBauAbi,
        provider,
      );

      // Lọc các cử tri có địa chỉ blockchain
      const votersWithBlockchainAddress = voters.filter((voter) => voter.blockchainAddress);
      console.log(
        `[DEBUG] Kiểm tra ${votersWithBlockchainAddress.length} cử tri có địa chỉ blockchain`,
      );

      // Mảng lưu trữ danh sách cử tri có cập nhật
      let hasUpdates = false;
      const updatedVoters = [...voters];

      // Kiểm tra từng cử tri
      for (const voter of votersWithBlockchainAddress) {
        try {
          // Quan trọng: Gọi đúng tham số theo thứ tự:
          // 1. Địa chỉ QuanLyCuocBauCu
          // 2. ID phiên bầu cử từ blockchain
          // 3. Địa chỉ ví của cử tri
          const hasBallot = await quanLyPhieuBau.daNhanNFT(
            actualQuanLyCuocBauCuAddress,
            sessionIdToUse,
            voter.blockchainAddress,
          );

          console.log(
            `[DEBUG] Cử tri ${voter.email || voter.id} (${voter.blockchainAddress}): Có phiếu = ${hasBallot}`,
          );

          // Nếu có phiếu bầu nhưng trạng thái chưa được cập nhật trong state
          if (hasBallot && !voter.hasBlockchainWallet) {
            // Tìm vị trí của cử tri trong mảng
            const voterIndex = updatedVoters.findIndex((v) => v.id === voter.id);
            if (voterIndex !== -1) {
              // Cập nhật trạng thái
              updatedVoters[voterIndex] = {
                ...updatedVoters[voterIndex],
                hasBlockchainWallet: true,
              };
              hasUpdates = true;
              console.log(`[DEBUG] Đã cập nhật trạng thái phiếu bầu cho cử tri ID ${voter.id}`);
            }
          }
        } catch (error) {
          console.warn(`[DEBUG] Lỗi kiểm tra phiếu bầu cho ${voter.blockchainAddress}:`, error);
        }
      }

      // Cập nhật state nếu có thay đổi
      if (hasUpdates) {
        console.log('[DEBUG] Cập nhật state với trạng thái phiếu bầu mới');
        setVoters(updatedVoters);

        toast({
          title: 'Cập nhật thành công',
          description: 'Đã cập nhật trạng thái phiếu bầu cho các cử tri',
        });
      } else {
        console.log('[DEBUG] Không có cử tri nào cần cập nhật trạng thái phiếu bầu');
        toast({
          title: 'Đã kiểm tra',
          description: 'Trạng thái phiếu bầu đã được cập nhật đầy đủ',
        });
      }
    } catch (error) {
      console.error('[DEBUG] Lỗi khi kiểm tra trạng thái phiếu bầu:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: `Không thể kiểm tra trạng thái phiếu bầu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      });
    } finally {
      setIsCheckingBallots(false);
    }
  }, [
    selectedSession,
    contractAddresses.quanLyPhieuBauAddress,
    getActualQuanLyCuocBauCuAddress,
    localBlockchainSessionId,
    fetchBlockchainSessionId,
    voters,
    toast,
  ]);

  useEffect(() => {
    // Kiểm tra ngay khi component mount nếu có đủ thông tin
    if (
      selectedSession?.blockchainAddress &&
      contractAddresses.quanLyPhieuBauAddress &&
      !isInitialLoading
    ) {
      console.log('[DEBUG] Tự động kiểm tra trạng thái phiếu bầu khi component mount');
      // Để tránh quá tải, đợi 2 giây sau khi tải xong
      const timer = setTimeout(() => {
        checkAllVotersBallotStatus();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    selectedSession?.blockchainAddress,
    contractAddresses.quanLyPhieuBauAddress,
    isInitialLoading,
    checkAllVotersBallotStatus,
  ]);

  // Cập nhật localBlockchainSessionId khi prop blockchainSessionId thay đổi
  useEffect(() => {
    if (blockchainSessionId !== null && blockchainSessionId !== localBlockchainSessionId) {
      setLocalBlockchainSessionId(blockchainSessionId ?? null);
    }
  }, [blockchainSessionId, localBlockchainSessionId]);

  // Hàm hỗ trợ để cập nhật trạng thái blockchain cho danh sách cử tri
  const updateBlockchainStatus = useCallback(
    async (votersList: CuTri[], sessionId: number) => {
      if (!contractAddresses.quanLyPhieuBauAddress) {
        console.warn(
          '[DEBUG] Không có địa chỉ quanLyPhieuBauAddress, không thể kiểm tra trạng thái',
        );
        return;
      }

      // Xác định địa chỉ blockchain thực tế
      const actualQuanLyCuocBauCuAddress = getActualQuanLyCuocBauCuAddress();
      if (!actualQuanLyCuocBauCuAddress) {
        console.warn('[DEBUG] Không có địa chỉ QuanLyCuocBauCu, không thể kiểm tra trạng thái');
        return;
      }

      try {
        const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

        // Nếu không có ID phiên bầu cử blockchain, không thể check được
        if (!sessionId) {
          console.warn('[DEBUG] Không có sessionId, không thể kiểm tra trạng thái');
          return;
        }

        // Log thông tin quan trọng để debug
        console.log('[DEBUG] Kiểm tra trạng thái blockchain với: ', {
          quanLyPhieuBauAddress: contractAddresses.quanLyPhieuBauAddress,
          quanLyCuocBauCuAddress: actualQuanLyCuocBauCuAddress,
          sessionId: sessionId,
          totalVoters: votersList.length,
        });

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

        const quanLyCuocBauCu = new ethers.Contract(
          actualQuanLyCuocBauCuAddress,
          quanLyCuocBauCuAbi,
          provider,
        );

        // Kiểm tra tất cả cử tri có địa chỉ blockchain (không giới hạn 5 cử tri)
        const votersToCheck = votersList.filter((v) => v.blockchainAddress);
        console.log(`[DEBUG] Sẽ kiểm tra ${votersToCheck.length} cử tri có địa chỉ blockchain`);

        let hasUpdates = false;
        const updatedVoters = [...votersList];

        for (const voter of votersToCheck) {
          if (voter.blockchainAddress) {
            try {
              // Kiểm tra cử tri đã nhận phiếu bầu chưa
              const hasBallot = await quanLyPhieuBau.daNhanNFT(
                actualQuanLyCuocBauCuAddress,
                sessionId,
                voter.blockchainAddress,
              );

              // Kiểm tra cử tri có trong danh sách bầu cử không
              const isVoter = await quanLyCuocBauCu.laCuTri(
                1, // ID cuộc bầu cử luôn là 1 trong contract
                sessionId,
                voter.blockchainAddress,
              );

              console.log(
                `[DEBUG] Cử tri ${voter.email}: isVoter=${isVoter}, hasBallot=${hasBallot}`,
              );

              // Cập nhật trạng thái nếu có phiếu bầu nhưng chưa được cập nhật
              if (hasBallot && !voter.hasBlockchainWallet) {
                const voterIndex = updatedVoters.findIndex((v) => v.id === voter.id);
                if (voterIndex !== -1) {
                  updatedVoters[voterIndex] = {
                    ...updatedVoters[voterIndex],
                    hasBlockchainWallet: true,
                  };
                  hasUpdates = true;
                  console.log(`[DEBUG] Đã cập nhật trạng thái phiếu bầu cho cử tri ${voter.email}`);
                }
              }
            } catch (error) {
              console.warn(`[DEBUG] Lỗi kiểm tra phiếu bầu cho ${voter.blockchainAddress}:`, error);
            }
          }
        }

        // Cập nhật state nếu có sự thay đổi
        if (hasUpdates) {
          console.log('[DEBUG] Cập nhật state với danh sách cử tri mới');
          setVoters(updatedVoters);
        }
      } catch (error) {
        console.warn('[DEBUG] Lỗi khi kiểm tra trạng thái blockchain:', error);
      }
    },
    [contractAddresses.quanLyPhieuBauAddress, getActualQuanLyCuocBauCuAddress],
  );

  // Lấy danh sách cử tri từ API với cải tiến để lấy thông tin chính xác
  const fetchVoters = useCallback(
    async (forceRefresh: boolean = false) => {
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
            const sessionIdToUse = localBlockchainSessionId || (await fetchBlockchainSessionId());

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
              const sessionIdToUse = localBlockchainSessionId || (await fetchBlockchainSessionId());
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
    },
    [
      selectedSession,
      currentPage,
      pageSize,
      filterOptions,
      toast,
      contractAddresses,
      localBlockchainSessionId,
      fetchBlockchainSessionId,
      updateBlockchainStatus,
    ],
  );

  // Tải danh sách cử tri khi params thay đổi
  useEffect(() => {
    fetchVoters();
  }, [fetchVoters, selectedSession?.id, currentPage, pageSize]);

  // Reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions]);

  // Kiểm tra cử tri đã có phiếu bầu trên blockchain chưa
  const checkVoterHasBallot = useCallback(
    async (voter: CuTri) => {
      if (!voter.blockchainAddress || !contractAddresses.quanLyPhieuBauAddress) {
        return false;
      }

      // Xác định địa chỉ blockchain thực tế
      const actualQuanLyCuocBauCuAddress = getActualQuanLyCuocBauCuAddress();
      if (!actualQuanLyCuocBauCuAddress) {
        console.warn('[DEBUG] No QuanLyCuocBauCu address available, cannot check ballot status');
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
          localBlockchainSessionId || (await fetchBlockchainSessionId()) || selectedSession.id;

        return await quanLyPhieuBau.daNhanNFT(
          actualQuanLyCuocBauCuAddress,
          sessionIdToUse,
          voter.blockchainAddress,
        );
      } catch (error) {
        console.warn(`Lỗi kiểm tra phiếu bầu cho cử tri ${voter.blockchainAddress}:`, error);
        return false;
      }
    },
    [
      selectedSession,
      contractAddresses.quanLyPhieuBauAddress,
      localBlockchainSessionId,
      fetchBlockchainSessionId,
      getActualQuanLyCuocBauCuAddress,
    ],
  );

  // Kiểm tra cử tri có trên blockchain không
  const checkVoterOnBlockchain = useCallback(
    async (voter: CuTri) => {
      if (!voter.blockchainAddress) {
        return false;
      }

      // Xác định địa chỉ blockchain thực tế
      const actualQuanLyCuocBauCuAddress = getActualQuanLyCuocBauCuAddress();
      if (!actualQuanLyCuocBauCuAddress) {
        console.warn('[DEBUG] No QuanLyCuocBauCu address available, cannot check voter status');
        return false;
      }

      try {
        const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
        const quanLyCuocBauCuAbi = [
          'function laCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) view returns (bool)',
        ];

        const quanLyCuocBauCu = new ethers.Contract(
          actualQuanLyCuocBauCuAddress,
          quanLyCuocBauCuAbi,
          provider,
        );

        // Sử dụng ID phiên bầu cử từ blockchain nếu có
        const sessionIdToUse =
          localBlockchainSessionId || (await fetchBlockchainSessionId()) || selectedSession.id;

        return await quanLyCuocBauCu.laCuTri(
          1, // Election ID luôn là 1 trong contract
          sessionIdToUse,
          voter.blockchainAddress,
        );
      } catch (error) {
        console.warn(`Lỗi kiểm tra cử tri ${voter.blockchainAddress} trên blockchain:`, error);
        return false;
      }
    },
    [
      selectedSession,
      localBlockchainSessionId,
      fetchBlockchainSessionId,
      getActualQuanLyCuocBauCuAddress,
    ],
  );

  // Xử lý chọn tất cả cử tri trên trang hiện tại
  const toggleSelectAllOnPage = useCallback(() => {
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
  }, [voters, selectedVoters]);

  // Xử lý chọn một cử tri
  const toggleVoterSelection = useCallback((voterId: number) => {
    setSelectedVoters((prev) => {
      if (prev.includes(voterId)) {
        return prev.filter((id) => id !== voterId);
      } else {
        return [...prev, voterId];
      }
    });
  }, []);

  // Kiểm tra xem tất cả cử tri trên trang hiện tại đã được chọn chưa
  const areAllVotersSelectedOnPage = useMemo(() => {
    const eligibleVoters = voters.filter((voter) => !voter.hasBlockchainWallet);
    if (eligibleVoters.length === 0) return false;

    return eligibleVoters.every((voter) => selectedVoters.includes(voter.id));
  }, [voters, selectedVoters]);

  // Phân trang
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  // Hàm lấy địa chỉ blockchain của cử tri từ API
  const refreshVoterVerificationStatus = useCallback(
    async (voter: CuTri) => {
      if (!voter.email || !selectedSession?.id) {
        console.warn('[DEBUG] Không thể kiểm tra xác thực - thiếu email hoặc phienBauCuId');
        return null;
      }

      try {
        console.log(`[DEBUG] Kiểm tra trạng thái xác thực cho email ${voter.email}...`);

        // Sử dụng API check-verification để lấy thông tin đầy đủ về cử tri
        const response = await apiClient.get(
          `/api/CuTri/check-verification?email=${encodeURIComponent(voter.email)}&phienBauCuId=${selectedSession.id}`,
        );

        if (response.data && response.data.success) {
          // Log thông tin chi tiết để gỡ lỗi
          console.log('[DEBUG] Thông tin xác thực nhận được:', {
            id: response.data.id,
            email: response.data.email,
            xacMinh: response.data.xacMinh,
            hasBlockchainWallet: response.data.hasBlockchainWallet,
            blockchainAddress: response.data.blockchainAddress,
            status: response.data.status,
          });

          // Kiểm tra xem API có trả về địa chỉ blockchain không
          if (response.data.blockchainAddress) {
            console.log(
              `[DEBUG] ✅ Tìm thấy địa chỉ blockchain: ${response.data.blockchainAddress}`,
            );
          } else if (response.data.hasBlockchainWallet) {
            console.log('[DEBUG] ⚠️ Tài khoản có ví blockchain nhưng API không trả về địa chỉ');
          } else {
            console.log('[DEBUG] ℹ️ Cử tri không có ví blockchain');
          }

          return response.data;
        } else {
          console.warn(
            '[DEBUG] API check-verification không trả về kết quả thành công:',
            response.data,
          );
          return null;
        }
      } catch (error) {
        console.error(`[DEBUG] ❌ Lỗi khi kiểm tra xác thực: ${(error as Error).message}`);
        return null;
      }
    },
    [selectedSession],
  );

  // Hàm mã hóa base64 an toàn cho Unicode
  const encodeUTF8ToBase64 = useCallback((str: string): string => {
    const utf8Encoder = new TextEncoder();
    const utf8Bytes = utf8Encoder.encode(str);

    const base64 = btoa(
      Array.from(utf8Bytes)
        .map((byte) => String.fromCharCode(byte))
        .join(''),
    );

    return base64;
  }, []);

  // Tạo metadata cho phiếu bầu
  const generateTokenMetadata = useCallback(
    (voter: CuTri) => {
      // Sử dụng metadata được cung cấp hoặc tạo mặc định
      if (ballotMetadata) {
        // Thay thế các placeholder trong metadata
        const name = ballotMetadata.name
          .replace('{voterName}', voter.voterName || '')
          .replace('{email}', voter.email || '')
          .replace('{sdt}', voter.sdt || '');

        const description = ballotMetadata.description
          .replace('{voterName}', voter.voterName || '')
          .replace('{voterEmail}', voter.email || '')
          .replace('{voterAddress}', voter.blockchainAddress || '')
          .replace('{phienBauCu}', selectedSession?.tenPhienBauCu || '')
          .replace('{sdt}', voter.sdt || '');

        // Tạo bản sao của các thuộc tính và thêm thông tin cụ thể của cử tri
        const attributes = [...ballotMetadata.attributes];

        // Đảm bảo có thuộc tính địa chỉ cử tri
        if (
          !attributes.some(
            (attr) =>
              attr.trait_type.toLowerCase() === 'địa chỉ cử tri' ||
              attr.trait_type.toLowerCase() === 'voter address',
          )
        ) {
          attributes.push({
            trait_type: 'Địa chỉ cử tri',
            value: voter.blockchainAddress || '',
          });
        } else {
          // Cập nhật giá trị nếu thuộc tính đã tồn tại
          const addrIndex = attributes.findIndex(
            (attr) =>
              attr.trait_type.toLowerCase() === 'địa chỉ cử tri' ||
              attr.trait_type.toLowerCase() === 'voter address',
          );
          if (addrIndex >= 0) {
            attributes[addrIndex].value = voter.blockchainAddress || '';
          }
        }

        // Đảm bảo có thuộc tính email cử tri nếu có
        if (
          voter.email &&
          !attributes.some(
            (attr) =>
              attr.trait_type.toLowerCase() === 'email' ||
              attr.trait_type.toLowerCase() === 'email cử tri',
          )
        ) {
          attributes.push({
            trait_type: 'Email cử tri',
            value: voter.email,
          });
        }

        // Đảm bảo có thuộc tính tên cử tri nếu có
        if (
          voter.voterName &&
          !attributes.some(
            (attr) =>
              attr.trait_type.toLowerCase() === 'tên cử tri' ||
              attr.trait_type.toLowerCase() === 'voter name',
          )
        ) {
          attributes.push({
            trait_type: 'Tên cử tri',
            value: voter.voterName,
          });
        }

        // Đảm bảo có thuộc tính ngày cấp
        if (
          !attributes.some(
            (attr) =>
              attr.trait_type.toLowerCase() === 'ngày cấp' ||
              attr.trait_type.toLowerCase() === 'issue date',
          )
        ) {
          const today = new Date();
          const dateStr = today.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });

          attributes.push({
            trait_type: 'Ngày cấp',
            value: dateStr,
          });
        }

        // Đảm bảo có hash kiểm chứng
        if (
          !attributes.some(
            (attr) =>
              attr.trait_type.toLowerCase() === 'hash kiểm chứng' ||
              attr.trait_type.toLowerCase() === 'verification hash',
          )
        ) {
          const timestamp = Date.now();
          const verificationData = `${voter.blockchainAddress}-${voter.email || ''}-${timestamp}`;
          attributes.push({
            trait_type: 'Hash kiểm chứng',
            value: ethers.keccak256(ethers.toUtf8Bytes(verificationData)),
          });
        }

        // Thêm thông tin phiên bầu cử
        if (
          !attributes.some(
            (attr) =>
              attr.trait_type.toLowerCase() === 'id phiên bầu cử' ||
              attr.trait_type.toLowerCase() === 'session id',
          )
        ) {
          attributes.push({
            trait_type: 'ID phiên bầu cử',
            value: String(localBlockchainSessionId || selectedSession?.id || ''),
          });
        }

        // Thêm thông tin tên phiên bầu cử
        if (
          !attributes.some(
            (attr) =>
              attr.trait_type.toLowerCase() === 'tên phiên bầu cử' ||
              attr.trait_type.toLowerCase() === 'session name',
          )
        ) {
          attributes.push({
            trait_type: 'Tên phiên bầu cử',
            value: selectedSession?.tenPhienBauCu || 'Không xác định',
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
        const base64Encoded = encodeUTF8ToBase64(jsonString);
        return `data:application/json;base64,${base64Encoded}`;
      }

      // Tạo metadata mặc định nếu không có metadata được cung cấp
      const timestamp = Date.now();
      const uniqueId = `${timestamp}-${voter.id}-${Math.floor(Math.random() * 1000000)}`;
      const today = new Date().toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const metadata = {
        name: `Phiếu bầu cử - ${voter.voterName || voter.email || 'Cử tri'}`,
        description: `Phiếu bầu chính thức cho cử tri ${voter.voterName || voter.email || voter.blockchainAddress} trong phiên bầu cử "${selectedSession?.tenPhienBauCu || 'Không xác định'}"`,
        image: 'ipfs://QmDefaultBallotImage',
        attributes: [
          {
            trait_type: 'Loại phiếu',
            value: 'Phiếu bầu cử chính thức',
          },
          {
            trait_type: 'ID phiên bầu cử',
            value: String(localBlockchainSessionId || selectedSession?.id || 'Không xác định'),
          },
          {
            trait_type: 'Tên phiên bầu cử',
            value: selectedSession?.tenPhienBauCu || 'Không xác định',
          },
          {
            trait_type: 'Địa chỉ cử tri',
            value: voter.blockchainAddress || '',
          },
          {
            trait_type: 'Email cử tri',
            value: voter.email || 'Không có',
          },
          voter.voterName
            ? {
                trait_type: 'Tên cử tri',
                value: voter.voterName,
              }
            : null,
          {
            trait_type: 'Ngày cấp',
            value: today,
          },
          {
            trait_type: 'Trạng thái',
            value: 'Hợp lệ',
          },
          {
            trait_type: 'Hash kiểm chứng',
            value: ethers.keccak256(
              ethers.toUtf8Bytes(`${voter.blockchainAddress}-${voter.email || ''}-${timestamp}`),
            ),
          },
        ].filter(Boolean), // Lọc bỏ giá trị null
        external_url: `https://holihu.online/ballot/${uniqueId}`,
      };

      const jsonString = JSON.stringify(metadata);
      const base64Encoded = encodeUTF8ToBase64(jsonString);
      return `data:application/json;base64,${base64Encoded}`;
    },
    [selectedSession, ballotMetadata, localBlockchainSessionId, encodeUTF8ToBase64],
  );

  // Cấp phiếu bầu cho nhiều cử tri - Cải tiến với xử lý phiên bầu cử từ blockchain
  const sendBallotTickets = useCallback(async () => {
    if (selectedVoters.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không có cử tri nào được chọn để cấp phiếu bầu.',
      });
      return;
    }

    if (!sessionStatus.isActive || !sessionKey) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Phiên bầu cử chưa bắt đầu hoặc thiếu khóa phiên.',
      });
      return;
    }

    try {
      setIsSendingBulkTickets(true);

      // Lấy danh sách các cử tri đã được chọn
      const selectedVotersList = voters.filter((voter) => selectedVoters.includes(voter.id));

      console.log(`[DEBUG] Selected voters: ${selectedVotersList.length}`);

      // Khởi tạo trạng thái gửi
      setTicketSendProgress({
        current: 0,
        total: selectedVotersList.length,
        success: 0,
        failed: 0,
        retries: 0,
        currentBatchSize: Math.min(5, selectedVotersList.length),
        message: 'Đang chuẩn bị triển khai phiếu bầu...',
      });

      // Xác định phiên bầu cử ID từ blockchain
      let sessionIdToUse = localBlockchainSessionId;

      if (!sessionIdToUse) {
        sessionIdToUse = await fetchBlockchainSessionId();
      }

      if (!sessionIdToUse) {
        throw new Error('Không thể xác định ID phiên bầu cử từ blockchain.');
      }

      // Xác định địa chỉ hợp đồng quản lý phiếu bầu
      const actualQuanLyCuocBauCuAddress = getActualQuanLyCuocBauCuAddress();

      // Sử dụng địa chỉ cứng cho quanLyPhieuBauAddress nếu không có giá trị
      const hardcodedQuanLyPhieuBauAddress = '0x9c244B5E1F168510B9b812573b1B667bd1E654c8';
      const actualQuanLyPhieuBauAddress =
        contractAddresses.quanLyPhieuBauAddress || hardcodedQuanLyPhieuBauAddress;

      // Debug log để kiểm tra các địa chỉ contract
      console.log('[DEBUG] Contract addresses before validation:', {
        quanLyCuocBauCuAddress: actualQuanLyCuocBauCuAddress,
        quanLyPhieuBauAddress: actualQuanLyPhieuBauAddress,
        isUsingHardcodedAddress: !contractAddresses.quanLyPhieuBauAddress,
        allAddresses: contractAddresses,
        scwAddress: sessionKey.scwAddress,
      });

      if (!actualQuanLyCuocBauCuAddress) {
        throw new Error('Thiếu địa chỉ quản lý cuộc bầu cử (QuanLyCuocBauCu).');
      }

      if (!actualQuanLyPhieuBauAddress) {
        throw new Error('Thiếu địa chỉ quản lý phiếu bầu (QuanLyPhieuBau).');
      }

      // Chuẩn bị provider và khởi tạo kết nối blockchain
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI cho các smart contract
      const quanLyCuocBauCuAbi = [
        'function capPhieuBauChoNhieuCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address[] memory danhSachCuTri, string[] memory uriPhieuBaus) external',
        'function laCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) external view returns (bool)',
        'function hasRole(bytes32 role, address account) external view returns (bool)',
      ];

      const simpleAccountAbi = [
        'function execute(address dest, uint256 value, bytes calldata func) external returns (bytes memory)',
      ];

      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      // Địa chỉ EntryPoint contract
      const entryPointAddress =
        contractAddresses.entryPointAddress || '0x5c1Ec052254B485A97eFeCdE6dEC5A7c3c171656';
      const paymasterAddress =
        contractAddresses.paymasterAddress || '0x68eD6525Fa00B2A0AF28311280b46f6E03C5EE4a';

      // Khởi tạo các contract
      console.log(
        '[DEBUG] Session key type:',
        typeof sessionKey.sessionKey,
        'Value:',
        sessionKey.sessionKey,
      );
      const simpleAccountContract = new ethers.Contract(
        sessionKey.scwAddress,
        simpleAccountAbi,
        provider,
      );
      const entryPointContract = new ethers.Contract(entryPointAddress, entryPointAbi, provider);
      const quanLyCuocBauCuContract = new ethers.Contract(
        actualQuanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // THÊM MỚI: Kiểm tra quyền BANTOCHUC trước khi gửi giao dịch
      try {
        setTicketSendProgress((prev) => ({
          ...prev,
          message: 'Đang kiểm tra quyền truy cập...',
        }));

        const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
        const laBanToChuc = await quanLyCuocBauCuContract.hasRole(BANTOCHUC, sessionKey.scwAddress);

        console.log(`[DEBUG] SCW ${sessionKey.scwAddress} có quyền BANTOCHUC:`, laBanToChuc);

        if (!laBanToChuc) {
          throw new Error(
            'SCW không có quyền BANTOCHUC. Vui lòng cấp quyền trước khi cấp phiếu bầu.',
          );
        }
      } catch (roleError) {
        console.warn('[DEBUG] Error checking BANTOCHUC role:', roleError);
        // Tiếp tục thực hiện dù có lỗi khi kiểm tra quyền
      }

      // Lấy các địa chỉ blockchain của cử tri
      const votersWithConfirmedAddresses = [];
      console.log('[DEBUG] Refreshing blockchain addresses for all selected voters...');

      for (let i = 0; i < selectedVotersList.length; i++) {
        const voter = selectedVotersList[i];

        // Cập nhật tiến độ chuẩn bị dữ liệu
        setTicketSendProgress((prev) => ({
          ...prev,
          message: `Đang lấy địa chỉ blockchain cho cử tri ${i + 1}/${selectedVotersList.length}...`,
        }));

        // Nếu cử tri đã có địa chỉ blockchain, sử dụng luôn
        if (voter.blockchainAddress) {
          console.log(`[DEBUG] Voter ${voter.id} already has address: ${voter.blockchainAddress}`);
          votersWithConfirmedAddresses.push({
            ...voter,
            confirmedAddress: voter.blockchainAddress,
          });
          continue;
        }

        // Nếu cử tri chưa có địa chỉ blockchain, gọi API để lấy
        if (voter.email && (voter.phienBauCuId || selectedSession?.id)) {
          try {
            console.log(`[DEBUG] Fetching blockchain address for voter ${voter.email}...`);
            const verificationData = await refreshVoterVerificationStatus(voter);

            if (
              verificationData &&
              verificationData.success &&
              verificationData.blockchainAddress
            ) {
              console.log(
                `[DEBUG] Successfully got address: ${verificationData.blockchainAddress}`,
              );
              votersWithConfirmedAddresses.push({
                ...voter,
                confirmedAddress: verificationData.blockchainAddress,
              });
            } else {
              console.warn(`[DEBUG] Failed to get blockchain address for voter ${voter.id}`);
            }
          } catch (error) {
            console.error(`[DEBUG] Error fetching address for voter ${voter.id}:`, error);
          }
        }
      }

      console.log(
        `[DEBUG] Found ${votersWithConfirmedAddresses.length} voters with blockchain addresses out of ${selectedVotersList.length} selected`,
      );

      // Nếu không có cử tri nào có địa chỉ blockchain, thông báo lỗi và dừng
      if (votersWithConfirmedAddresses.length === 0) {
        throw new Error('Không tìm thấy địa chỉ blockchain cho bất kỳ cử tri nào đã chọn.');
      }

      // Cập nhật tổng số cử tri thực tế sẽ được xử lý
      setTicketSendProgress((prev) => ({
        ...prev,
        total: votersWithConfirmedAddresses.length,
        message: `Đã tìm thấy ${votersWithConfirmedAddresses.length} cử tri có địa chỉ blockchain.`,
      }));

      // THAY ĐỔI: xử lý từng cử tri một (batch size = 1)
      const BATCH_SIZE = 1;
      const batches = [];

      for (let i = 0; i < votersWithConfirmedAddresses.length; i += BATCH_SIZE) {
        batches.push(votersWithConfirmedAddresses.slice(i, i + BATCH_SIZE));
      }

      console.log(`[DEBUG] Creating ${batches.length} batches for ballot issuance.`);

      // Xử lý từng batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (isPaused) {
          console.log('[DEBUG] Batch processing paused');
          break;
        }

        const batch = batches[batchIndex];
        const voter = batch[0]; // Chỉ có 1 cử tri trong mỗi batch
        const blockchainAddress = voter.confirmedAddress;

        if (!blockchainAddress) {
          console.warn(`[DEBUG] Voter ID ${voter.id} lacks blockchain address`);
          setTicketSendProgress((prev) => ({
            ...prev,
            current: prev.current + 1,
            failed: prev.failed + 1,
            message: `Cử tri ID ${voter.id} không có địa chỉ blockchain`,
          }));
          continue;
        }

        try {
          setTicketSendProgress((prev) => ({
            ...prev,
            currentBatchSize: 1,
            message: `Đang xử lý cử tri ${batchIndex + 1}/${batches.length}: ${voter.email || voter.id}`,
          }));

          // Kiểm tra xem cử tri đã có phiếu bầu chưa hoặc đã là cử tri chưa
          let isVoterInBlockchain = false;
          try {
            isVoterInBlockchain = await quanLyCuocBauCuContract.laCuTri(
              1,
              sessionIdToUse,
              blockchainAddress,
            );

            if (!isVoterInBlockchain) {
              console.warn(`[DEBUG] Voter ${voter.id} is not registered in the blockchain`);
              setTicketSendProgress((prev) => ({
                ...prev,
                current: prev.current + 1,
                failed: prev.failed + 1,
                message: `Cử tri ${voter.email || voter.id} chưa được đăng ký trên blockchain`,
              }));
              continue;
            }
          } catch (checkError) {
            console.warn(`[DEBUG] Error checking if voter is registered:`, checkError);
            // Tiếp tục với giả định rằng cử tri đã đăng ký
          }

          // Tạo metadata cho phiếu bầu
          const tokenUri = generateTokenMetadata({
            ...voter,
            blockchainAddress,
          });

          // Chuẩn bị danh sách địa chỉ và URIs cho batch
          const voterAddresses = [blockchainAddress];
          const tokenUris = [tokenUri];

          // THAY ĐỔI: 1. Chuẩn bị callData cho capPhieuBauChoNhieuCuTri với thứ tự tham số đúng
          const capPhieuBauCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
            'capPhieuBauChoNhieuCuTri',
            [
              1, // ID cuộc bầu cử luôn là 1 trong contract
              sessionIdToUse,
              voterAddresses,
              tokenUris,
            ],
          );

          // 2. Chuẩn bị callData cho execute của SCW
          const executeCallData = simpleAccountContract.interface.encodeFunctionData('execute', [
            actualQuanLyCuocBauCuAddress, // Gọi đến contract QuanLyCuocBauCu
            0, // value (ETH amount)
            capPhieuBauCallData,
          ]);

          // 3. Lấy nonce hiện tại từ EntryPoint
          let currentNonce;
          try {
            currentNonce = await entryPointContract.getNonce(sessionKey.scwAddress);
          } catch (error) {
            try {
              currentNonce = await entryPointContract.nonceNguoiGui(sessionKey.scwAddress);
            } catch (error2) {
              throw new Error(
                'Không thể lấy nonce: ' +
                  (error2 instanceof Error ? error2.message : String(error2)),
              );
            }
          }

          console.log(`[DEBUG] Current nonce for SCW: ${currentNonce}`);

          // 4. Chuẩn bị paymasterAndData
          const currentTimestamp = Math.floor(Date.now() / 1000);
          const deadlineTime = currentTimestamp + 3600; // 1 giờ
          const validationTime = currentTimestamp;

          const paymasterAndData = ethers.concat([
            paymasterAddress,
            ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
            ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
          ]);

          // 5. Tạo UserOperation với cấu hình gas điều chỉnh theo script
          const userOp = {
            sender: sessionKey.scwAddress,
            nonce: currentNonce.toString(),
            initCode: '0x',
            callData: executeCallData,
            callGasLimit: '2000000', // Tăng gas limit
            verificationGasLimit: '2000000', // Tăng gas limit
            preVerificationGas: '500000', // Tăng gas limit
            maxFeePerGas: ethers.parseUnits('10', 'gwei').toString(), // Tăng gas price
            maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei').toString(), // Tăng priority fee
            paymasterAndData: paymasterAndData,
            signature: '0x',
          };

          // 6. Ký UserOperation bằng session key
          const userOpHash = await entryPointContract.layHashThaoTac(userOp);

          // Tạo key từ private key của session
          const signingKey = new ethers.SigningKey(sessionKey.sessionKey);
          const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

          const signature = ethers.Signature.from({
            r: signatureObj.r,
            s: signatureObj.s,
            v: signatureObj.v,
          }).serialized;

          userOp.signature = signature;

          // 7. Gửi UserOperation đến bundler API
          setTicketSendProgress((prev) => ({
            ...prev,
            message: `Đang gửi giao dịch cấp phiếu cho cử tri ${voter.email || voter.id}...`,
          }));

          console.log('[DEBUG] Sending UserOperation to bundler...');
          const response = await apiClient.post('/api/bundler/submit', {
            ...userOp,
            userOpHash: userOpHash,
          });

          if (!response.data) {
            throw new Error('Không nhận được phản hồi từ bundler');
          }

          const txHash = response.data.txHash || response.data.userOpHash;
          console.log(`[DEBUG] Transaction submitted with hash: ${txHash}`);

          // 8. Theo dõi trạng thái giao dịch
          setTicketSendProgress((prev) => ({
            ...prev,
            message: `Đang chờ xác nhận giao dịch cho cử tri ${voter.email || voter.id}...`,
          }));

          let confirmed = false;
          let attempts = 0;
          const maxAttempts = 10;

          while (!confirmed && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Đợi 5 giây
            attempts++;

            try {
              const statusResponse = await apiClient.get(
                `/api/bundler/check-status?userOpHash=${txHash}`,
              );

              if (statusResponse.data.status === 'success') {
                confirmed = true;
                console.log(
                  `[DEBUG] Transaction confirmed with hash: ${statusResponse.data.txHash || txHash}`,
                );

                if (onTransactionSuccess) {
                  onTransactionSuccess(statusResponse.data.txHash || txHash);
                }

                // Cập nhật trạng thái tiến độ
                setTicketSendProgress((prev) => ({
                  ...prev,
                  current: prev.current + 1,
                  success: prev.success + 1,
                  message: `Đã cấp phiếu thành công cho cử tri ${voter.email || voter.id}`,
                }));

                // Cập nhật UI
                setVoters((prev) => {
                  const updatedVoters = [...prev];
                  const voterIndex = updatedVoters.findIndex((v) => v.id === voter.id);
                  if (voterIndex !== -1) {
                    updatedVoters[voterIndex] = {
                      ...updatedVoters[voterIndex],
                      hasBlockchainWallet: true,
                      blockchainAddress: blockchainAddress,
                    };
                  }
                  return updatedVoters;
                });
              } else if (statusResponse.data.status === 'failed') {
                console.error('[DEBUG] Transaction failed:', statusResponse.data);

                throw new Error(
                  `Giao dịch thất bại: ${statusResponse.data.message || 'Lỗi không xác định'}`,
                );
              } else {
                setTicketSendProgress((prev) => ({
                  ...prev,
                  message: `Đang chờ xác nhận giao dịch (${attempts}/${maxAttempts})...`,
                }));
              }
            } catch (statusError) {
              console.error('[DEBUG] Error checking transaction status:', statusError);
            }
          }

          if (!confirmed) {
            // Giao dịch không được xác nhận sau nhiều lần thử
            setTicketSendProgress((prev) => ({
              ...prev,
              current: prev.current + 1,
              failed: prev.failed + 1,
              message: `Hết thời gian chờ giao dịch cho cử tri ${voter.email || voter.id}`,
            }));
          }
        } catch (error) {
          console.error(`[DEBUG] Error processing voter ${voter.id}:`, error);

          setTicketSendProgress((prev) => ({
            ...prev,
            current: prev.current + 1,
            failed: prev.failed + 1,
            message: `Lỗi khi cấp phiếu cho cử tri ${voter.email || voter.id}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
          }));

          // Hiển thị thông báo lỗi chi tiết
          toast({
            variant: 'destructive',
            title: 'Lỗi khi cấp phiếu',
            description: `${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
          });
        }

        // Delay giữa các batch để tránh quá tải
        if (batchIndex < batches.length - 1 && !isPaused) {
          await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 giây
        }
      }

      // Kết thúc quá trình xử lý
      toast({
        title: 'Hoàn tất',
        description: `Đã cấp phiếu bầu: ${ticketSendProgress.success} thành công, ${ticketSendProgress.failed} thất bại`,
      });

      // Làm mới danh sách cử tri
      refreshData?.();
      fetchVoters(true);
    } catch (error) {
      console.error('[DEBUG] Error sending ballot tickets:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: `Không thể cấp phiếu bầu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      });
    } finally {
      setIsSendingBulkTickets(false);
      setSelectedVoters([]);

      // Thêm delay trước khi refresh để đảm bảo blockchain đã xử lý xong giao dịch
      setTimeout(() => {
        console.log('[DEBUG] Đang làm mới danh sách cử tri sau khi cấp phiếu...');
        refreshData?.();

        // Thêm delay trước khi fetch voters để đảm bảo API có thời gian cập nhật
        setTimeout(() => {
          fetchVoters(true);
        }, 2000);
      }, 5000); // Đợi 5 giây trước khi refresh
    }
  }, [
    selectedVoters,
    sessionStatus,
    sessionKey,
    voters,
    localBlockchainSessionId,
    fetchBlockchainSessionId,
    getActualQuanLyCuocBauCuAddress,
    contractAddresses,
    isPaused,
    generateTokenMetadata,
    onTransactionSuccess,
    toast,
    refreshData,
    fetchVoters,
    ticketSendProgress,
    refreshVoterVerificationStatus,
    selectedSession,
  ]);

  // Thêm state để theo dõi chế độ hiển thị mobile
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  // Theo dõi kích thước màn hình
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Kiểm tra lần đầu
    checkIfMobile();

    // Theo dõi thay đổi kích thước màn hình
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Định nghĩa component VoterStatistics
  const VoterStatistics: React.FC<{ voters: CuTri[] }> = ({ voters }) => {
    // Tính toán các thống kê
    const verifiedVoters = voters.filter((v) => v.xacMinh).length;
    const votersWithBallot = voters.filter((v) => v.hasBlockchainWallet).length;

    // Tỷ lệ phần trăm
    const verificationRate = totalVoters ? Math.round((verifiedVoters / totalVoters) * 100) : 0;
    const ballotRate = totalVoters ? Math.round((votersWithBallot / totalVoters) * 100) : 0;

    return (
      <div className="rounded-lg p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 border border-teal-100 dark:border-teal-800/30 mb-4">
        <h3 className="text-sm font-medium text-teal-800 dark:text-teal-300 mb-3 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Thống kê cử tri
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-center">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Tổng cử tri</h4>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-1">{totalVoters}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-center">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Đã xác minh</h4>
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {verifiedVoters}
              <span className="text-sm ml-1 text-gray-500">({verificationRate}%)</span>
            </p>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${verificationRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-center">
              <h4 className="text-sm text-gray-500 dark:text-gray-400">Đã cấp phiếu</h4>
              <Ticket className="h-4 w-4 text-violet-500" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {votersWithBallot}
              <span className="text-sm ml-1 text-gray-500">({ballotRate}%)</span>
            </p>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${ballotRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Định nghĩa component BallotConfigPreview
  const BallotConfigPreview: React.FC = () => {
    // Nếu không có cấu hình hoặc cấu hình không hợp lệ
    if (!ballotMetadata || !ballotMetadata.image) {
      return (
        <div className="rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 mb-4">
          <div className="flex flex-col sm:flex-row items-start">
            <AlertTriangle className="h-5 w-5 mr-0 sm:mr-3 mb-3 sm:mb-0 sm:mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                Cấu hình phiếu bầu không đầy đủ
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                {configState?.message || 'Vui lòng cấu hình phiếu bầu trước khi cấp phiếu.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onConfigureClick}
                className="w-full sm:w-auto bg-white dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
              >
                <FileImage className="h-3.5 w-3.5 mr-1" />
                Cấu hình phiếu bầu
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Hiển thị xem trước cấu hình
    return (
      <div className="rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-800/30 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Hình ảnh/mẫu phiếu bầu */}
          <div className="sm:w-1/5 w-full max-w-[180px] mx-auto sm:mx-0 min-w-[120px]">
            <div className="aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-emerald-200 dark:border-emerald-800/50 relative">
              {ballotMetadata.image.endsWith('.glb') || ballotMetadata.image.endsWith('.gltf') ? (
                <div className="h-full w-full">
                  <span className="absolute top-1 right-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs px-1.5 py-0.5 rounded-md">
                    3D
                  </span>
                </div>
              ) : (
                <img
                  src={
                    ballotMetadata.image.startsWith('ipfs://')
                      ? `https://ipfs.io/ipfs/${ballotMetadata.image.replace('ipfs://', '')}`
                      : ballotMetadata.image
                  }
                  alt="Ballot preview"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/200x200/e2e8f0/667085?text=Ballot+Image';
                  }}
                />
              )}
            </div>
          </div>

          {/* Thông tin phiếu bầu */}
          <div className="flex-1 mt-4 sm:mt-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {ballotMetadata.name || `Phiếu bầu cử - ${selectedSession?.tenPhienBauCu || ''}`}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 line-clamp-2">
                  {ballotMetadata.description || 'Phiếu bầu chính thức'}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onConfigureClick}
                className="h-7 mt-0 text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                <FileImage className="h-3 w-3 mr-1" />
                Chỉnh sửa
              </Button>
            </div>

            {/* Các thuộc tính phiếu */}
            {ballotMetadata.attributes && ballotMetadata.attributes.length > 0 && (
              <div className="mt-2 grid grid-cols-1 xs:grid-cols-2 gap-2">
                {ballotMetadata.attributes.slice(0, 4).map((attr, idx) => (
                  <div
                    key={idx}
                    className="bg-white/60 dark:bg-gray-800/30 rounded px-2 py-1 text-xs"
                  >
                    <span className="text-gray-500 dark:text-gray-400">{attr.trait_type}:</span>{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                      {attr.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 mt-3 pt-2 border-t border-emerald-100 dark:border-emerald-800/30">
              <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                <span>
                  {configState?.isValid ? 'Cấu hình phiếu bầu hợp lệ' : 'Cấu hình cơ bản'}
                </span>
              </div>

              {ballotMetadata.image.startsWith('ipfs://') && (
                <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                  <Database className="h-3.5 w-3.5 mr-1" />
                  <span>Lưu trữ trên IPFS</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Định nghĩa component PaginationControls
  const PaginationControls: React.FC = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Hiển thị {voters.length} trên {totalVoters} cử tri
        </span>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Hiển thị:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1); // Reset to first page when changing page size
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Trang đầu</span>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Trang trước</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          <span className="hidden sm:inline">Trang </span>
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Trang sau</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Trang cuối</span>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Component Card View cho mobile
  const VoterCardView: React.FC<{
    voters: CuTri[];
    selectedVoters: number[];
    toggleVoterSelection: (id: number) => void;
    handleSendBallot: (voter: CuTri) => void;
  }> = ({ voters, selectedVoters, toggleVoterSelection, handleSendBallot }) => {
    return (
      <div className="space-y-3">
        {voters.length > 0 ? (
          voters.map((voter) => (
            <div
              key={voter.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/40 p-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedVoters.includes(voter.id)}
                    onCheckedChange={() => toggleVoterSelection(voter.id)}
                    aria-label={`Chọn cử tri ${voter.id}`}
                    disabled={voter.hasBlockchainWallet}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">ID: {voter.id}</span>
                      {voter.xacMinh ? (
                        <Badge className="h-5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Đã xác minh
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="h-5 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Chưa xác minh
                        </Badge>
                      )}
                    </div>
                    {voter.email && (
                      <div className="text-sm flex items-center mt-1.5">
                        <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300 break-all">
                          {voter.email}
                        </span>
                      </div>
                    )}
                    {voter.sdt && (
                      <div className="text-sm flex items-center mt-1">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{voter.sdt}</span>
                      </div>
                    )}

                    {/* Address info */}
                    <div className="mt-3 flex items-center">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                        Địa chỉ ví:
                      </span>
                      {voter.blockchainAddress ? (
                        <div className="flex items-center">
                          <span className="font-mono text-xs bg-gray-50 dark:bg-gray-800 rounded px-1.5 py-0.5 border border-gray-200 dark:border-gray-700">
                            {voter.blockchainAddress.substring(0, 6)}...
                            {voter.blockchainAddress.substring(voter.blockchainAddress.length - 4)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(voter.blockchainAddress || '');
                              toast({
                                description: 'Đã sao chép địa chỉ ví',
                              });
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Chưa có</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  {voter.hasBlockchainWallet ? (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      <Ticket className="h-3.5 w-3.5 mr-1" />
                      Đã cấp phiếu
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-200 dark:border-gray-700">
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Chưa cấp phiếu
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!voter.hasBlockchainWallet && voter.blockchainAddress && (
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSendBallot(voter)}
                    disabled={isSendingBulkTickets || !sessionStatus.isActive || !sessionKey}
                  >
                    <Ticket className="h-4 w-4 mr-1.5" />
                    Cấp phiếu
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <Filter className="h-10 w-10 mb-2 opacity-40" />
              <p>Không có cử tri nào phù hợp với bộ lọc</p>
              <p className="text-sm">Vui lòng thử các bộ lọc khác</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Xử lý cấp phiếu cho một cử tri
  const handleSendBallot = useCallback(
    (voter: CuTri) => {
      setSelectedVoters([voter.id]);
      sendBallotTickets();
    },
    [sendBallotTickets],
  );

  return (
    <div className="space-y-4">
      {/* Voter statistics */}
      <VoterStatistics voters={voters} />

      {/* Ballot Configuration Preview */}
      <BallotConfigPreview />

      {/* Add Check Ballot Status Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-white"
          onClick={checkAllVotersBallotStatus}
          disabled={isCheckingBallots}
        >
          {isCheckingBallots ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Ticket className="mr-2 h-4 w-4" />
          )}
          <span className="hidden xs:inline">Kiểm tra phiếu bầu</span>
          <span className="xs:hidden">Kiểm tra</span>
        </Button>
      </div>

      {/* Progress bar for bulk sending */}
      {isSendingBulkTickets && (
        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-lg">
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-2 gap-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-teal-700 dark:text-teal-300 mr-2">
                {ticketSendProgress.message ||
                  `Đang cấp phiếu bầu: ${ticketSendProgress.current}/${ticketSendProgress.total}`}
              </span>
              {isPaused ? (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  Tạm dừng
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  Đang xử lý
                </Badge>
              )}
            </div>
            <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
              {Math.round((ticketSendProgress.current / ticketSendProgress.total) * 100)}%
            </span>
          </div>

          <div className="relative h-2 bg-teal-100 dark:bg-teal-800/50 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{
                width: `${(ticketSendProgress.current / ticketSendProgress.total) * 100}%`,
              }}
            ></div>
          </div>

          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mt-2 text-xs gap-2">
            <div className="flex flex-col xs:flex-row xs:space-x-4 space-y-2 xs:space-y-0">
              <span className="text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="inline-block h-3 w-3 mr-1" />
                Thành công: {ticketSendProgress.success}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                <XCircle className="inline-block h-3 w-3 mr-1" />
                Thất bại: {ticketSendProgress.failed}
              </span>
              {ticketSendProgress.retries > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  <RefreshCw className="inline-block h-3 w-3 mr-1" />
                  Thử lại: {ticketSendProgress.retries}
                </span>
              )}
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
                onClick={() => setIsPaused((prev) => !prev)}
              >
                {isPaused ? (
                  <PlayCircle className="h-3 w-3" />
                ) : (
                  <PauseCircle className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dùng Card View cho mobile và Table cho desktop */}
      {isMobileView ? (
        <VoterCardView
          voters={voters}
          selectedVoters={selectedVoters}
          toggleVoterSelection={toggleVoterSelection}
          handleSendBallot={handleSendBallot}
        />
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[56px]">
                  <Checkbox
                    checked={areAllVotersSelectedOnPage}
                    onCheckedChange={toggleSelectAllOnPage}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
                <TableHead className="w-[56px]">#</TableHead>
                <TableHead className="w-[180px]">Thông tin liên hệ</TableHead>
                <TableHead className="w-[140px]">Địa chỉ ví</TableHead>
                <TableHead className="w-[120px] text-center">Phiếu bầu</TableHead>
                <TableHead className="w-[120px] text-center">Trạng thái</TableHead>
                <TableHead className="w-[120px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <Loader className="h-12 w-12 mb-4 opacity-40 animate-spin text-emerald-500 dark:text-emerald-400" />
                      <p className="text-base">
                        Đang tải danh sách cử tri và kiểm tra trạng thái blockchain...
                      </p>
                      <p className="text-sm mt-2">Quá trình này có thể mất vài giây</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isLoadingVoters ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <Loader className="h-8 w-8 mb-2 opacity-40 animate-spin text-emerald-500 dark:text-emerald-400" />
                      <p>Đang tải danh sách cử tri...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : voters.length > 0 ? (
                voters.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedVoters.includes(voter.id)}
                        onCheckedChange={() => toggleVoterSelection(voter.id)}
                        aria-label={`Chọn cử tri ${voter.id}`}
                        disabled={voter.hasBlockchainWallet}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{voter.id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {voter.email && (
                          <div
                            className="font-medium truncate max-w-[180px] flex items-center"
                            title={voter.email}
                          >
                            <Mail className="h-3.5 w-3.5 mr-1 text-gray-400" />
                            {voter.email}
                          </div>
                        )}
                        {voter.sdt && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="h-3.5 w-3.5 mr-1 inline-block" />
                            {voter.sdt}
                          </div>
                        )}
                        {voter.voterName && (
                          <div className="text-sm font-medium">
                            <User className="h-3.5 w-3.5 mr-1 inline-block text-gray-400" />
                            {voter.voterName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {voter.blockchainAddress ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="inline-flex">
                              <span className="font-mono text-xs truncate max-w-[140px]">
                                {voter.blockchainAddress.substring(0, 6)}...
                                {voter.blockchainAddress.substring(
                                  voter.blockchainAddress.length - 4,
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="p-0">
                              <div className="max-w-xs p-2">
                                <p className="font-mono text-xs break-all p-1">
                                  {voter.blockchainAddress}
                                </p>
                                <div className="flex gap-1 mt-2 border-t pt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(voter.blockchainAddress || '');
                                      toast({
                                        description: 'Đã sao chép địa chỉ ví',
                                      });
                                    }}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    <span>Sao chép</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(
                                        `https://explorer.holihu.online/address/${voter.blockchainAddress}`,
                                        '_blank',
                                      );
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    <span>Xem</span>
                                  </Button>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Chưa có</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {voter.hasBlockchainWallet ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          <Ticket className="h-3.5 w-3.5 mr-1" />
                          Đã cấp
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-200 dark:border-gray-700">
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Chưa cấp
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {voter.xacMinh ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Đã xác minh
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400"
                        >
                          <AlertCircle className="h-3.5 w-3.5 mr-1" />
                          Chưa xác minh
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {voter.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`mailto:${voter.email}`, '_blank');
                            }}
                            title="Gửi email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {!voter.hasBlockchainWallet && voter.blockchainAddress && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleSendBallot(voter)}
                            disabled={
                              isSendingBulkTickets || !sessionStatus.isActive || !sessionKey
                            }
                            title="Cấp phiếu"
                          >
                            <Ticket className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {totalVoters === 0 ? (
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <Users className="h-10 w-10 mb-2 opacity-40" />
                        <p>Không có cử tri nào trong phiên bầu cử này</p>
                        <p className="text-sm">Vui lòng thêm cử tri trước khi tiến hành bầu cử</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <Filter className="h-10 w-10 mb-2 opacity-40" />
                        <p>Không có cử tri nào phù hợp với bộ lọc</p>
                        <p className="text-sm">Vui lòng thử các bộ lọc khác</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination controls */}
      {totalVoters > 0 && <PaginationControls />}

      {/* Bulk actions */}
      {selectedVoters.length > 0 && (
        <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/20">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Đã chọn {selectedVoters.length} cử tri
            </span>
            <div className="flex gap-2 w-full xs:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVoters([])}
                className="h-8 flex-1 xs:flex-initial"
              >
                <span>Bỏ chọn</span>
              </Button>
              <Button
                size="sm"
                disabled={isSendingBulkTickets || !sessionStatus.isActive || !sessionKey}
                onClick={sendBallotTickets}
                className="h-8 flex-1 xs:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Ticket className="h-3.5 w-3.5 mr-1" />
                <span>Cấp phiếu</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Session status notifications */}
      {selectedSession && !sessionStatus.isActive && (
        <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Phiên bầu cử chưa bắt đầu</AlertTitle>
          <AlertDescription>
            Bạn cần bắt đầu phiên bầu cử trên blockchain trước khi có thể cấp phiếu bầu cho cử tri.
            {!sessionKey && ' Cần lấy khóa phiên trước khi bắt đầu phiên bầu cử.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VoterList;
