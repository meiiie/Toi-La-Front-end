'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './web3-context-voting';
import { toast } from 'sonner';
import { QUAN_LY_PHIEN_BAU_CU_ABI, QUAN_LY_PHIEU_BAU_ABI } from './contract-abis';

// Contract addresses
const QUAN_LY_PHIEN_BAU_CU_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual address
const QUAN_LY_PHIEU_BAU_ADDRESS = '0x0987654321098765432109876543210987654321'; // Replace with actual address

// Types
interface Candidate {
  name: string;
  address: string;
  imageUrl?: string;
}

interface Voter {
  address: string;
  timestamp: string;
}

interface SessionInfo {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  active: boolean;
  voterCount: number;
  maxVoters: number;
}

type VotingRightStatus = 'valid' | 'invalid' | 'checking' | null;
type TransactionStatus = 'pending' | 'success' | 'error' | null;

interface VotingContextType {
  sessionInfo: SessionInfo | null;
  candidates: Candidate[];
  voters: Voter[];
  selectedCandidate: Candidate | null;
  votingRightStatus: VotingRightStatus;
  transactionStatus: TransactionStatus;
  timeRemaining: number | null;
  timePercentage: number;
  isLoading: boolean;
  loadSession: (sessionId: string) => Promise<void>;
  refreshCandidates: () => Promise<void>;
  refreshVoters: () => Promise<void>;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  verifyVotingRight: (tokenId: string) => Promise<void>;
  castVote: (tokenId: string, candidateAddress: string) => Promise<void>;
}

const VotingContext = createContext<VotingContextType>({
  sessionInfo: null,
  candidates: [],
  voters: [],
  selectedCandidate: null,
  votingRightStatus: null,
  transactionStatus: null,
  timeRemaining: null,
  timePercentage: 0,
  isLoading: false,
  loadSession: async () => {},
  refreshCandidates: async () => {},
  refreshVoters: async () => {},
  setSelectedCandidate: () => {},
  verifyVotingRight: async () => {},
  castVote: async () => {},
});

export const useVoting = () => useContext(VotingContext);

export const VotingProvider = ({ children }: { children: ReactNode }) => {
  const { provider, signer, account } = useWeb3();

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [votingRightStatus, setVotingRightStatus] = useState<VotingRightStatus>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timePercentage, setTimePercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (sessionInfo) {
      const ws = new WebSocket('wss://geth.holihu.online/ws');

      ws.onopen = () => {
        console.log('WebSocket connected');

        // Subscribe to PhieuDaBo events
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_subscribe',
            params: [
              'logs',
              {
                address: QUAN_LY_PHIEU_BAU_ADDRESS,
                topics: [ethers.id('PhieuDaBo(address,uint256,uint256,address)')],
              },
            ],
          }),
        );
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.params && data.params.result) {
          try {
            // Parse the log data
            const log = data.params.result;
            const topics = log.topics;

            // Extract voter address from the event
            const voterAddress = '0x' + topics[1].slice(26);

            // Add to voters list
            const now = new Date();
            const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

            setVoters((prev) => {
              // Check if voter already exists
              if (!prev.some((v) => v.address.toLowerCase() === voterAddress.toLowerCase())) {
                return [...prev, { address: voterAddress, timestamp }];
              }
              return prev;
            });
          } catch (error) {
            console.error('Error parsing WebSocket event:', error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      setWsConnection(ws);

      return () => {
        ws.close();
      };
    }
  }, [sessionInfo]);

  // Update time remaining
  useEffect(() => {
    if (!sessionInfo) return;

    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = sessionInfo.endTime;

      if (now >= endTime) {
        setTimeRemaining(0);
        setTimePercentage(100);
        return;
      }

      const startTime = sessionInfo.startTime;
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      const remaining = endTime - now;

      setTimeRemaining(remaining);
      setTimePercentage(Math.min(100, (elapsed / totalDuration) * 100));
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo]);

  // Load session information
  const loadSession = async (sessionId: string) => {
    if (!provider) {
      toast.error('Vui lòng kết nối ví MetaMask trước');
      return;
    }

    setIsLoading(true);

    try {
      // Create contract instance
      const phienBauCuContract = new ethers.Contract(
        QUAN_LY_PHIEN_BAU_CU_ADDRESS,
        QUAN_LY_PHIEN_BAU_CU_ABI,
        provider,
      );

      // Get session info
      const startTime = await phienBauCuContract.layThoiGianBatDauPhienBauCu(sessionId);
      const endTime = await phienBauCuContract.layThoiGianKetThucPhienBauCu(sessionId);
      const active = await phienBauCuContract.dangHoatDong(sessionId);
      const maxVoters = await phienBauCuContract.soCuTriToiDa(sessionId);
      const voterCount = await phienBauCuContract.soPhieuDaBau(sessionId);
      const name = await phienBauCuContract.tenPhienBauCu(sessionId);

      setSessionInfo({
        id: sessionId,
        name,
        startTime: Number(startTime),
        endTime: Number(endTime),
        active,
        voterCount: Number(voterCount),
        maxVoters: Number(maxVoters),
      });

      // Load candidates
      await refreshCandidates(sessionId, phienBauCuContract);

      // Load voters
      await refreshVoters(sessionId);

      toast.success('Đã tải thông tin phiên bầu cử');
    } catch (error) {
      console.error('Lỗi khi tải phiên bầu cử:', error);
      toast.error('Không thể tải thông tin phiên bầu cử');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh candidates list
  const refreshCandidates = async (sessionId?: string, contract?: ethers.Contract) => {
    if (!provider) {
      toast.error('Vui lòng kết nối ví MetaMask trước');
      return;
    }

    if (!sessionId && !sessionInfo) {
      toast.error('Vui lòng tải phiên bầu cử trước');
      return;
    }

    setIsLoading(true);

    try {
      const id = sessionId || sessionInfo?.id;
      const phienBauCuContract =
        contract ||
        new ethers.Contract(QUAN_LY_PHIEN_BAU_CU_ADDRESS, QUAN_LY_PHIEN_BAU_CU_ABI, provider);

      // Get candidates list
      const candidateAddresses = await phienBauCuContract.layDanhSachUngVien(id);

      // Get candidate details
      const candidatesList: Candidate[] = await Promise.all(
        candidateAddresses.map(async (address: string) => {
          try {
            const name = await phienBauCuContract.tenUngVien(id, address);
            // In a real app, you would get the image URL from IPFS or another source
            const imageUrl = `/placeholder.svg?height=200&width=200&text=${name}`;

            return { name, address, imageUrl };
          } catch (error) {
            console.error(`Error getting candidate details for ${address}:`, error);
            return { name: 'Unknown', address };
          }
        }),
      );

      setCandidates(candidatesList);
    } catch (error) {
      console.error('Lỗi khi tải danh sách ứng viên:', error);
      toast.error('Không thể tải danh sách ứng viên');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh voters list
  const refreshVoters = async (sessionId?: string) => {
    if (!provider) {
      toast.error('Vui lòng kết nối ví MetaMask trước');
      return;
    }

    if (!sessionId && !sessionInfo) {
      toast.error('Vui lòng tải phiên bầu cử trước');
      return;
    }

    setIsLoading(true);

    try {
      const id = sessionId || sessionInfo?.id;
      const phieuBauContract = new ethers.Contract(
        QUAN_LY_PHIEU_BAU_ADDRESS,
        QUAN_LY_PHIEU_BAU_ABI,
        provider,
      );

      // In a real implementation, you would query past events
      // This is a simplified version
      let filter;
      if (id) {
        filter = phieuBauContract.filters.PhieuDaBo(null, null, BigInt(id), null);
      } else {
        filter = '';
      }
      const events = await phieuBauContract.queryFilter(filter);

      const votersList: Voter[] = events.map((event) => {
        const timestamp = new Date(Number(event.blockNumber) * 1000).toLocaleString();
        return {
          address: (event as ethers.EventLog).args[0],
          timestamp,
        };
      });

      setVoters(votersList);
    } catch (error) {
      console.error('Lỗi khi tải danh sách cử tri:', error);
      // Don't show error toast as this might fail in test environment
    } finally {
      setIsLoading(false);
    }
  };

  // Verify voting right
  const verifyVotingRight = async (tokenId: string) => {
    if (!provider || !signer || !account) {
      toast.error('Vui lòng kết nối ví MetaMask trước');
      return;
    }

    if (!sessionInfo) {
      toast.error('Vui lòng tải phiên bầu cử trước');
      return;
    }

    setVotingRightStatus('checking');

    try {
      const phieuBauContract = new ethers.Contract(
        QUAN_LY_PHIEU_BAU_ADDRESS,
        QUAN_LY_PHIEU_BAU_ABI,
        signer,
      );

      const hasRight = await phieuBauContract.kiemTraQuyenBauCu(account, sessionInfo.id, tokenId);

      setVotingRightStatus(hasRight ? 'valid' : 'invalid');

      if (hasRight) {
        toast.success('Phiếu bầu hợp lệ');
      } else {
        toast.error('Phiếu bầu không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra quyền bầu cử:', error);
      toast.error('Không thể kiểm tra quyền bầu cử');
      setVotingRightStatus('invalid');
    }
  };

  // Cast vote
  const castVote = async (tokenId: string, candidateAddress: string) => {
    if (!signer || !account) {
      toast.error('Vui lòng kết nối ví MetaMask trước');
      return;
    }

    if (!sessionInfo) {
      toast.error('Vui lòng tải phiên bầu cử trước');
      return;
    }

    if (!selectedCandidate) {
      toast.error('Vui lòng chọn ứng viên trước');
      return;
    }

    setTransactionStatus('pending');

    try {
      const phieuBauContract = new ethers.Contract(
        QUAN_LY_PHIEU_BAU_ADDRESS,
        QUAN_LY_PHIEU_BAU_ABI,
        signer,
      );

      const tx = await phieuBauContract.boPhieu(tokenId, sessionInfo.id, candidateAddress);

      toast.info('Đang xử lý giao dịch...');

      await tx.wait();

      setTransactionStatus('success');
      toast.success('Bỏ phiếu thành công!');

      // Refresh voters list
      refreshVoters();
    } catch (error) {
      console.error('Lỗi khi bỏ phiếu:', error);
      toast.error('Không thể bỏ phiếu. Vui lòng thử lại.');
      setTransactionStatus('error');
    }
  };

  return (
    <VotingContext.Provider
      value={{
        sessionInfo,
        candidates,
        voters,
        selectedCandidate,
        votingRightStatus,
        transactionStatus,
        timeRemaining,
        timePercentage,
        isLoading,
        loadSession,
        refreshCandidates,
        refreshVoters,
        setSelectedCandidate,
        verifyVotingRight,
        castVote,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
};
