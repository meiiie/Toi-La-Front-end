'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ConnectWallet } from '../test/components/connect-wallet';
import { SessionOverview } from '../test/components/session-overview';
import { ResultsDisplay } from '../test/components/results-display';
import { VoterParticipation } from '../test/components/voter-participation';
import { NetworkStatus } from '../test/components/network-status';
import { BarChart } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// ABI giữ nguyên như cũ
const quanLyPhienBauCuABI = [
  'function layThoiGianBatDauPhienBauCu(uint256 idPhienBauCu) view returns (uint256)',
  'function layThoiGianKetThucPhienBauCu(uint256 idPhienBauCu) view returns (uint256)',
  'function dangHoatDong(uint256 idPhienBauCu) view returns (bool)',
  'function soCuTriToiDa(uint256 idPhienBauCu) view returns (uint256)',
  'function layDanhSachUngVien(uint256 idPhienBauCu) view returns (address[])',
  'function soPhieu(address ungVien) view returns (uint256)',
  'function layTenPhienBauCu(uint256 idPhienBauCu) view returns (string)',
  'event PhieuDaBo(address indexed cuTri, address indexed ungVien, uint256 indexed idPhienBauCu, uint256 thoiGian)',
];

export default function KetQuaBauCu() {
  // State giữ nguyên như cũ
  const [provider, setProvider] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isNetworkConnected, setIsNetworkConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState<string>('');

  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(browserProvider);

          const network = await browserProvider.getNetwork();
          setIsNetworkConnected(network.name === 'poa' || network.chainId === BigInt(100));

          const accounts = await browserProvider.listAccounts();
          if (accounts.length > 0) {
            setIsConnected(true);
            setAccount(accounts[0].address);

            const signer = await browserProvider.getSigner();
            const quanLyPhienBauCuContract = new ethers.Contract(
              contractAddress,
              quanLyPhienBauCuABI,
              signer,
            );
            setContract(quanLyPhienBauCuContract);
            toast.success('Đã kết nối ví thành công!');
          }
        } catch (error) {
          console.error('Lỗi kết nối mạng:', error);
          setIsNetworkConnected(false);
          toast.error('Không thể kết nối đến mạng blockchain');
        }
      }
    };

    checkConnection();

    try {
      const wsUrl = 'wss://geth.holihu.online/ws';
      const wsConnection = new WebSocket(wsUrl);

      wsConnection.onopen = () => {
        console.log('WebSocket đã kết nối');
        toast.success('Đã kết nối WebSocket thành công!');

        const subscribeMsg = {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_subscribe',
          params: [
            'logs',
            {
              address: contractAddress,
              topics: [ethers.id('PhieuDaBo(address,address,uint256,uint256)')],
            },
          ],
        };

        wsConnection.send(JSON.stringify(subscribeMsg));
      };

      wsConnection.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response.params && response.params.result) {
          const log = response.params.result;

          const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
            ['address', 'address', 'uint256', 'uint256'],
            log.data,
          );

          const voter = decodedData[0];
          const timestamp = new Date(Number(decodedData[3]) * 1000);

          setVoters((prev) => [
            {
              address: voter,
              timestamp: timestamp,
            },
            ...prev,
          ]);

          if (sessionId) {
            loadCandidateData(sessionId);
          }

          toast.info('Có phiếu bầu mới được ghi nhận!');
        }
      };

      wsConnection.onerror = (error) => {
        console.error('Lỗi WebSocket:', error);
        toast.error('Lỗi kết nối WebSocket');
      };

      return () => {
        wsConnection.close();
      };
    } catch (error) {
      console.error('Lỗi thiết lập WebSocket:', error);
      toast.error('Không thể thiết lập kết nối WebSocket');
    }
  }, [sessionId]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        const accounts = await browserProvider.listAccounts();
        setAccount(accounts[0].address);

        const signer = await browserProvider.getSigner();
        const quanLyPhienBauCuContract = new ethers.Contract(
          contractAddress,
          quanLyPhienBauCuABI,
          signer,
        );
        setContract(quanLyPhienBauCuContract);
        setIsConnected(true);
        toast.success('Đã kết nối ví thành công!');
      } catch (error) {
        console.error('Người dùng từ chối kết nối:', error);
        toast.error('Không thể kết nối ví');
      }
    } else {
      toast.error('Vui lòng cài đặt MetaMask để sử dụng ứng dụng');
    }
  };

  const loadSessionData = async () => {
    if (!contract || !sessionId) return;

    setIsLoading(true);
    try {
      const isActive = await contract.dangHoatDong(sessionId);
      const startTime = await contract.layThoiGianBatDauPhienBauCu(sessionId);
      const endTime = await contract.layThoiGianKetThucPhienBauCu(sessionId);
      const maxVoters = await contract.soCuTriToiDa(sessionId);
      const sessionName = await contract.layTenPhienBauCu(sessionId);

      setSessionData({
        id: sessionId,
        name: sessionName,
        isActive,
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(endTime) * 1000),
        maxVoters: Number(maxVoters),
        votesCast: voters.length,
      });

      await loadCandidateData(sessionId);
      toast.success('Đã tải dữ liệu phiên bầu cử thành công!');
    } catch (error) {
      console.error('Lỗi tải dữ liệu phiên:', error);
      toast.error('Lỗi tải dữ liệu phiên bầu cử');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCandidateData = async (id: string) => {
    if (!contract) return;

    try {
      const candidateAddresses = await contract.layDanhSachUngVien(id);

      const candidatesWithVotes = await Promise.all(
        candidateAddresses.map(async (address: string) => {
          const votes = await contract.soPhieu(address);
          return {
            address,
            votes: Number(votes),
            name: `Ứng viên ${address.substring(0, 6)}...${address.substring(38)}`,
            imageUrl: `/placeholder.svg?height=150&width=150`,
          };
        }),
      );

      const sortedCandidates = candidatesWithVotes.sort((a, b) => b.votes - a.votes);
      setCandidates(sortedCandidates);
    } catch (error) {
      console.error('Lỗi tải dữ liệu ứng viên:', error);
      toast.error('Lỗi tải dữ liệu ứng viên');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster richColors position="top-right" />

      <header className="bg-white border-b border-[#ECEFF1] py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <BarChart className="w-6 h-6 text-[#0288D1] mr-2" />
          <h1 className="text-xl font-bold text-[#37474F]">Kết Quả Bầu Cử</h1>
        </div>

        <div className="flex items-center gap-4">
          <NetworkStatus isConnected={isNetworkConnected} networkName="POA Geth" />
          <ConnectWallet isConnected={isConnected} onConnect={connectWallet} address={account} />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <SessionOverview
              sessionId={sessionId}
              setSessionId={setSessionId}
              sessionData={sessionData}
              onLoadResults={loadSessionData}
              isLoading={isLoading}
            />
          </div>

          <div className="md:col-span-2">
            <ResultsDisplay
              candidates={candidates}
              onRefresh={() => loadCandidateData(sessionId)}
              isLoading={isLoading}
            />
          </div>

          <div className="md:col-span-3">
            <VoterParticipation
              voters={voters}
              sessionData={sessionData}
              onRefresh={() => loadSessionData()}
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#ECEFF1] py-4 px-6 text-center text-[#37474F] text-sm">
        <p>
          Mạng: POA Geth | RPC: https://geth.holihu.online/rpc |
          <button
            className="text-[#0288D1] hover:text-[#01579B] ml-2"
            onClick={() => alert('Trợ giúp')}
          >
            Trợ giúp
          </button>
        </p>
      </footer>
    </div>
  );
}
