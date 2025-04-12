'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers, zeroPadValue } from 'ethers';
import apiClient from '../api/apiClient';
import type { CuocBauCu, PhienBauCu } from '../store/types';

// Blockchain configuration
const RPC_URL = 'https://geth.holihu.online/rpc';
const WS_URL = 'wss://geth.holihu.online/ws';

// ABI definitions for blockchain interactions
const factoryAbi = [
  'function layServerCuaNguoiDung(address nguoiDung) view returns (uint256[])',
  'function layThongTinServer(uint128 serverId) view returns (address, string, string, uint8, uint64, uint64, address)',
  'function hluPaymaster() view returns (address)',
];

const electionAbi = [
  'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) view returns (uint256[])',
  'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool, uint256, uint256, uint256, uint256, uint256, address[], bool, uint256, uint256)',
  'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256, string, uint256)',
  'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function layDanhSachUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (address[])',
  'function batDauPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu, uint256 thoiGianKeoDai) external',
  'function laCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) view returns (bool)',
  'event PhienBauCuDaBatDau(uint256 indexed idCuocBauCu, uint256 indexed idPhienBauCu)',
  'event PhieuBauDaGhiNhan(uint256 indexed idCuocBauCu, uint256 indexed idPhienBauCu, address indexed ungVien, uint256 soPhieu, address cuTri)',
];

const ballotManagerAbi = [
  'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
  'function capPhieuBau(address cuTri, uint256 idCuocBauCu, uint256 idPhienBauCu, string calldata uriToken) external',
];

const quanLyPhieuBauAbi = [
  'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
  'function capPhieuBau(address cuTri, uint256 idCuocBauCu, uint256 idPhienBauCu, string calldata uriToken) external',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function layDanhSachTokenCuaPhien(uint256 idPhienBauCu) view returns (uint256[])',
  'event PhieuBauDaCapPhat(address indexed server, uint256 indexed idPhienBauCu, address indexed cuTri, uint256 tokenId)',
];

/**
 * Custom hook for blockchain operations related to elections and sessions
 */
const useBlockchainOperations = (scwAddress: string) => {
  // State
  const [electionsList, setElectionsList] = useState<CuocBauCu[]>([]);
  const [sessionsList, setSessionsList] = useState<PhienBauCu[]>([]);
  const [votersList, setVotersList] = useState<any[]>([]);
  const [isLoadingVoters, setIsLoadingVoters] = useState<boolean>(false);
  const [isLoadingElections, setIsLoadingElections] = useState<boolean>(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [electionStatus, setElectionStatus] = useState<{
    isOwner: boolean;
    isActive: boolean;
    hasBanToChucRole: boolean;
  }>({
    isOwner: false,
    isActive: false,
    hasBanToChucRole: false,
  });
  const [sessionStatus, setSessionStatus] = useState<{
    isActive: boolean;
    startTime: number;
    endTime: number;
  }>({
    isActive: false,
    startTime: 0,
    endTime: 0,
  });

  // Blockchain provider singleton
  const getProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(RPC_URL);
  }, []);

  // Cache contract addresses
  const [contractAddresses, setContractAddresses] = useState<any>(null);
  const [quanLyCuocBauCu, setQuanLyCuocBauCu] = useState<ethers.Contract | null>(null);
  const [quanLyPhieuBau, setQuanLyPhieuBau] = useState<ethers.Contract | null>(null);

  // Fetch contract addresses only once
  const getContractAddresses = useCallback(async () => {
    if (contractAddresses) return contractAddresses;

    const addressesResponse = await apiClient.get('/api/Blockchain/contract-addresses');
    if (!addressesResponse.data || !addressesResponse.data.success) {
      throw new Error('Không thể lấy địa chỉ contract');
    }

    setContractAddresses(addressesResponse.data);

    if (addressesResponse.data.quanLyPhieuBauAddress) {
      const provider = getProvider();
      setQuanLyPhieuBau(
        new ethers.Contract(
          addressesResponse.data.quanLyPhieuBauAddress,
          quanLyPhieuBauAbi,
          provider,
        ),
      );
    }
    return addressesResponse.data;
  }, [contractAddresses, getProvider]);

  // Direct blockchain data fetching functions - memoized with useCallback
  const fetchElectionsFromBlockchain = useCallback(async () => {
    if (!scwAddress) {
      console.error('SCW address is missing');
      return [];
    }

    setIsLoadingElections(true);
    try {
      const provider = getProvider();

      // Get contract addresses
      const addresses = await getContractAddresses();

      const factoryContract = new ethers.Contract(addresses.factoryAddress, factoryAbi, provider);

      // Get user's server IDs
      const userServers = await factoryContract.layServerCuaNguoiDung(scwAddress);
      console.log('User servers from blockchain:', userServers);

      if (!userServers || userServers.length === 0) {
        console.log('No servers found for this user');
        setElectionsList([]);
        return [];
      }

      // Get details for each election
      const electionsPromises = userServers.map(async (serverId: bigint) => {
        try {
          const serverInfo = await factoryContract.layThongTinServer(serverId);
          const [address, name, description, status, reportCount, violationCount, owner] =
            serverInfo;

          return {
            id: Number(serverId),
            blockchainAddress: address,
            tenCuocBauCu: name,
            moTa: description,
            trangThaiBlockchain: Number(status),
            ngayBatDau: new Date().toISOString(),
            ngayKetThuc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            trangThai: status === 0 ? 'Đang diễn ra' : status === 1 ? 'Tạm dừng' : 'Lưu trữ',
            nguoiSoHuu: owner,
          };
        } catch (error) {
          console.error(`Error fetching details for server ${serverId}:`, error);
          return null;
        }
      });

      const elections = (await Promise.all(electionsPromises)).filter(
        (election) => election !== null,
      ) as CuocBauCu[];

      console.log('Elections loaded from blockchain:', elections);
      setElectionsList(elections);
      return elections;
    } catch (error) {
      console.error('Error fetching elections from blockchain:', error);
      setElectionsList([]);
      return [];
    } finally {
      setIsLoadingElections(false);
    }
  }, [scwAddress, getProvider, getContractAddresses]);

  const fetchSessionsFromBlockchain = useCallback(
    async (electionAddress: string) => {
      if (!electionAddress) {
        console.error('Election address is missing');
        return [];
      }

      setIsLoadingSessions(true);
      try {
        const provider = getProvider();
        const electionContract = new ethers.Contract(electionAddress, electionAbi, provider);

        // Lưu ý: Trong contract, idCuocBauCu luôn là 1
        const sessionIds = await electionContract.layDanhSachPhienBauCu(1, 0, 100);
        console.log('Session IDs from blockchain:', sessionIds);

        if (!sessionIds || sessionIds.length === 0) {
          console.log('No sessions found for election:', electionAddress);
          setSessionsList([]);
          return [];
        }

        // Get details for each session
        const sessionsPromises = sessionIds.map(async (sessionId: bigint) => {
          try {
            const sessionInfo = await electionContract.layThongTinPhienBauCu(1, sessionId);
            const [
              isActive,
              startTime,
              endTime,
              maxVoters,
              candidateCount,
              voterCount,
              winners,
              isReelection,
              confirmCount,
              confirmDeadline,
            ] = sessionInfo;

            return {
              id: Number(sessionId),
              tenPhienBauCu: `Phiên bầu cử #${sessionId}`,
              cuocBauCuId: 1, // Trong contract luôn là 1
              moTa: 'Thông tin từ blockchain',
              ngayBatDau:
                Number(startTime) > 0
                  ? new Date(Number(startTime) * 1000).toISOString()
                  : new Date().toISOString(),
              ngayKetThuc:
                Number(endTime) > 0
                  ? new Date(Number(endTime) * 1000).toISOString()
                  : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              trangThai: isActive
                ? 'Đang diễn ra'
                : Number(startTime) === 0
                  ? 'Sắp diễn ra'
                  : 'Đã kết thúc',
              dangHoatDong: isActive,
              maxVoters: Number(maxVoters),
              voterCount: Number(voterCount),
              candidateCount: Number(candidateCount),
              blockchainAddress: electionAddress,
            };
          } catch (error) {
            console.error(`Error fetching details for session ${sessionId}:`, error);
            return null;
          }
        });

        const sessions = (await Promise.all(sessionsPromises)).filter(
          (session) => session !== null,
        ) as PhienBauCu[];
        console.log('Sessions loaded from blockchain:', sessions);
        setSessionsList(sessions);
        return sessions;
      } catch (error) {
        console.error('Error fetching sessions from blockchain:', error);
        setSessionsList([]);
        return [];
      } finally {
        setIsLoadingSessions(false);
      }
    },
    [getProvider],
  );

  // Cập nhật hàm fetchVotersFromBlockchain trong useBlockchainOperations.tsx
  const fetchVotersFromBlockchain = useCallback(
    async (electionAddress: string, sessionId: number) => {
      if (!electionAddress || !sessionId) {
        console.log('Missing electionAddress or sessionId for voters fetch');
        return [];
      }

      // Don't reload if already loading
      if (isLoadingVoters) return votersList;

      setIsLoadingVoters(true);
      try {
        console.log(`Fetching voters for election ${electionAddress}, session ${sessionId}`);
        const provider = getProvider();

        // Đảm bảo contract addresses đã được lấy
        const addresses = await getContractAddresses();

        // Kết nối đến QuanLyCuocBauCu và QuanLyPhieuBau
        if (!electionAddress) throw new Error('Địa chỉ election không hợp lệ');

        // Contract interface cần thiết
        const qlcbcAbi = [
          'function laCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) view returns (bool)',
          'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool, uint256, uint256, uint256, uint256, uint256, address[], bool, uint256, uint256)',
          'event CuTriDaThem(uint256 indexed idCuocBauCu, uint256 indexed idPhienBauCu, address cuTri)',
        ];

        const quanLyCuocBauCu = new ethers.Contract(electionAddress, qlcbcAbi, provider);

        // Bước 1: Kiểm tra thông tin phiên bầu cử
        console.log('Lấy thông tin phiên bầu cử...');
        let phienBauCuInfo;
        try {
          phienBauCuInfo = await quanLyCuocBauCu.layThongTinPhienBauCu(1, sessionId);
          console.log('Thông tin phiên bầu cử:', phienBauCuInfo);
        } catch (error) {
          console.error('Lỗi khi lấy thông tin phiên bầu cử:', error);
          setIsLoadingVoters(false);
          return [];
        }

        // Bước 2: Lấy danh sách cử tri từ sự kiện CuTriDaThem
        console.log('Lấy danh sách cử tri từ sự kiện...');

        // Lọc sự kiện CuTriDaThem cho cuộc bầu cử và phiên bầu cử cụ thể
        const filter = {
          address: electionAddress,
          topics: [
            ethers.id('CuTriDaThem(uint256,uint256,address)'),
            zeroPadValue(ethers.toBeHex(1), 32), // idCuocBauCu luôn là 1
            zeroPadValue(ethers.toBeHex(sessionId), 32), // idPhienBauCu
          ],
        };

        // Lấy danh sách sự kiện
        let events;
        try {
          events = await provider.getLogs({
            ...filter,
            fromBlock: -10000, // Lấy 10000 block gần nhất
            toBlock: 'latest',
          });
          console.log(`Tìm thấy ${events.length} sự kiện CuTriDaThem`);
        } catch (error) {
          console.error('Lỗi khi lấy sự kiện CuTriDaThem:', error);

          // Nếu không lấy được sự kiện, thử cách tiếp cận khác
          console.log('Không thể lấy sự kiện, tạo dữ liệu mẫu từ thông tin phiên bầu cử');

          // Lấy số cử tri từ thông tin phiên
          const totalVoters =
            phienBauCuInfo && phienBauCuInfo.length >= 6 ? Number(phienBauCuInfo[5]) : 0; // Vị trí 5 là số cử tri

          if (totalVoters === 0) {
            console.log('Không có cử tri trong phiên bầu cử');
            setIsLoadingVoters(false);
            setVotersList([]);
            return [];
          }

          // Tạo danh sách cử tri mẫu theo file complete-election-workflow.js
          const sampleVoters = [
            '0x9c94B000d007a41284df66C4d6204AB2Ac8cfd9E',
            '0x0671FE3C25e955B3818444b3714EB7B08a1e30bd',
            '0xC1d2F0975Cd2329f2Ee7CAB64BD729335C5b30f4',
            '0xbAf3a8941FebB356a3A72feb8ea8030D251459aE',
          ];

          const voters = await Promise.all(
            sampleVoters.map(async (address, index) => {
              // Kiểm tra xem địa chỉ có phải là cử tri trong phiên không
              let isCuTri = false;
              try {
                isCuTri = await quanLyCuocBauCu.laCuTri(1, sessionId, address);
              } catch (error) {
                console.warn(`Lỗi kiểm tra laCuTri cho ${address}:`, error);
              }

              if (isCuTri) {
                let hasBlockchainWallet = false;
                if (addresses?.quanLyPhieuBauAddress) {
                  try {
                    const qlpbAbi = [
                      'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
                    ];
                    const quanLyPhieuBau = new ethers.Contract(
                      addresses.quanLyPhieuBauAddress,
                      qlpbAbi,
                      provider,
                    );
                    hasBlockchainWallet = await quanLyPhieuBau.daNhanNFT(
                      electionAddress,
                      sessionId,
                      address,
                    );
                  } catch (error) {
                    console.warn(`Lỗi kiểm tra daNhanNFT cho ${address}:`, error);
                  }
                }

                return {
                  id: index + 1,
                  email: `voter${index + 1}@example.com`,
                  sdt: `+84${900000 + index}`,
                  xacMinh: true, // Đã xác minh vì đã là cử tri
                  blockchainAddress: address,
                  hasBlockchainWallet,
                  voterName: `Voter ${index + 1}`,
                };
              }
              return null;
            }),
          );

          const validVoters = voters.filter(Boolean);
          setVotersList(validVoters);
          setIsLoadingVoters(false);
          return validVoters;
        }

        // Bước 3: Xử lý sự kiện và lấy địa chỉ cử tri
        const voterAddresses = events
          .map((event) => {
            // Lấy địa chỉ cử tri từ sự kiện (vị trí thứ 3 trong data hoặc topics[3])
            const iface = new ethers.Interface(qlcbcAbi);
            try {
              const log = iface.parseLog({
                topics: event.topics as string[],
                data: event.data,
              });
              return log?.args?.cuTri;
            } catch (e) {
              console.warn('Không thể parse event log:', e);
              return null;
            }
          })
          .filter(Boolean);

        // Bước 4: Loại bỏ trùng lặp
        const uniqueAddresses = [...new Set(voterAddresses)];
        console.log(`Tìm thấy ${uniqueAddresses.length} địa chỉ cử tri duy nhất`);

        // Bước 5: Lấy thông tin chi tiết cho mỗi cử tri
        // Kết nối tới QuanLyPhieuBau để kiểm tra phiếu bầu
        let quanLyPhieuBau = null;
        if (addresses?.quanLyPhieuBauAddress) {
          const qlpbAbi = [
            'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
          ];
          quanLyPhieuBau = new ethers.Contract(addresses.quanLyPhieuBauAddress, qlpbAbi, provider);
        }

        const voters = await Promise.all(
          uniqueAddresses.map(async (address, index) => {
            try {
              // Kiểm tra xem địa chỉ có phải là cử tri trong phiên không
              let isCuTri = false;
              try {
                isCuTri = await quanLyCuocBauCu.laCuTri(1, sessionId, address);
              } catch (error) {
                console.warn(`Lỗi kiểm tra laCuTri cho ${address}:`, error);
              }

              if (!isCuTri) return null;

              // Kiểm tra xem cử tri đã nhận phiếu bầu chưa
              let hasBlockchainWallet = false;
              if (quanLyPhieuBau) {
                try {
                  hasBlockchainWallet = await quanLyPhieuBau.daNhanNFT(
                    electionAddress,
                    sessionId,
                    address,
                  );
                } catch (error) {
                  console.warn(`Lỗi kiểm tra daNhanNFT cho ${address}:`, error);
                }
              }

              return {
                id: index + 1,
                email: `voter${index + 1}@example.com`,
                sdt: `+84${900000 + index}`,
                xacMinh: true, // Mặc định đã xác minh vì đã là cử tri
                blockchainAddress: address,
                hasBlockchainWallet,
                addedAt: new Date().toISOString(),
                voterName: `Voter ${index + 1}`,
              };
            } catch (error) {
              console.error(`Lỗi khi xử lý cử tri ${address}:`, error);
              return null;
            }
          }),
        );

        const validVoters = voters.filter(Boolean);
        console.log(`Tìm thấy ${validVoters.length} cử tri hợp lệ`);

        setVotersList(validVoters);
        return validVoters;
      } catch (error) {
        console.error('Error fetching voters from blockchain:', error);
        setVotersList([]);
        return [];
      } finally {
        setIsLoadingVoters(false);
      }
    },
    [getProvider, isLoadingVoters, getContractAddresses, votersList],
  );

  // Check session status on blockchain - memoized with useCallback
  const checkSessionStatusOnBlockchain = useCallback(
    async (electionAddress: string, sessionId: number) => {
      if (!electionAddress || !sessionId) {
        console.log('Missing electionAddress or sessionId for status check');
        return;
      }

      try {
        console.log(
          `Checking session status for election ${electionAddress}, session ${sessionId}`,
        );
        const provider = getProvider();
        const electionContract = new ethers.Contract(electionAddress, electionAbi, provider);

        // Check if session is active - Đảm bảo idCuocBauCu luôn là 1
        const isActive = await electionContract.laPhienHoatDong(1, sessionId);

        // Get session details
        const sessionDetails = await electionContract.layThongTinPhienBauCu(1, sessionId);

        const newStatus = {
          isActive,
          startTime: Number(sessionDetails[1]),
          endTime: Number(sessionDetails[2]),
        };

        // Only update if different to prevent re-renders
        if (
          newStatus.isActive !== sessionStatus.isActive ||
          newStatus.startTime !== sessionStatus.startTime ||
          newStatus.endTime !== sessionStatus.endTime
        ) {
          setSessionStatus(newStatus);
          console.log('Session status updated:', newStatus);
        }

        // REMOVED: The call to fetchVotersFromBlockchain that was causing the infinite loop

        return newStatus;
      } catch (error) {
        console.error('Error checking session status on blockchain:', error);
        return null;
      }
    },
    [getProvider, sessionStatus], // Removed fetchVotersFromBlockchain from dependencies
  );

  // Check election permissions on blockchain - memoized with useCallback
  const checkElectionPermissions = useCallback(
    async (selectedElection?: CuocBauCu) => {
      if (!scwAddress) {
        console.error('SCW address is missing');
        return null;
      }

      const electionToCheck = selectedElection || electionsList.find((e) => e.blockchainAddress);
      if (!electionToCheck || !electionToCheck.blockchainAddress) {
        console.error('No election selected or no blockchain address');
        return null;
      }

      try {
        console.log('Checking election permissions for address:', scwAddress);
        console.log('Election address:', electionToCheck.blockchainAddress);

        const provider = getProvider();
        const electionContract = new ethers.Contract(
          electionToCheck.blockchainAddress,
          electionAbi,
          provider,
        );

        // Lưu ý: Trong contract, idCuocBauCu luôn là 1
        const baseInfo = await electionContract.layThongTinCoBan(1);
        const owner = baseInfo[0];
        const isActive = baseInfo[1];

        // Kiểm tra quyền BANTOCHUC
        const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
        const hasBanToChucRole = await electionContract.hasRole(BANTOCHUC, scwAddress);

        const permissions = {
          isOwner: owner.toLowerCase() === scwAddress.toLowerCase(),
          isActive,
          hasBanToChucRole,
        };

        console.log('Election permissions:', permissions);

        // Only update if different to prevent re-renders
        if (
          permissions.isOwner !== electionStatus.isOwner ||
          permissions.isActive !== electionStatus.isActive ||
          permissions.hasBanToChucRole !== electionStatus.hasBanToChucRole
        ) {
          setElectionStatus(permissions);
        }

        return permissions;
      } catch (error) {
        console.error('Error checking election permissions:', error);
        return null;
      }
    },
    [scwAddress, electionsList, getProvider, electionStatus],
  );

  // Refresh all data - memoized with useCallback
  const refreshData = useCallback(() => {
    if (!scwAddress) {
      console.error('Cannot refresh data: SCW address is missing');
      return;
    }

    console.log('Refreshing blockchain data');
    fetchElectionsFromBlockchain();
  }, [scwAddress, fetchElectionsFromBlockchain]);

  // Load elections when wallet info is available - Fixed dependencies
  useEffect(() => {
    if (scwAddress) {
      console.log('SCW address available, refreshing data:', scwAddress);
      fetchElectionsFromBlockchain();
    }
  }, [scwAddress, fetchElectionsFromBlockchain]);

  // Return memoized values to prevent unnecessary rerenders
  return useMemo(
    () => ({
      electionsList,
      sessionsList,
      votersList,
      electionStatus,
      sessionStatus,
      isLoadingVoters,
      isLoadingElections,
      isLoadingSessions,
      refreshData,
      checkElectionPermissions,
      checkSessionStatusOnBlockchain,
      fetchElectionsFromBlockchain,
      fetchSessionsFromBlockchain,
      fetchVotersFromBlockchain,
    }),
    [
      electionsList,
      sessionsList,
      votersList,
      electionStatus,
      sessionStatus,
      isLoadingVoters,
      isLoadingElections,
      isLoadingSessions,
      refreshData,
      checkElectionPermissions,
      checkSessionStatusOnBlockchain,
      fetchElectionsFromBlockchain,
      fetchSessionsFromBlockchain,
      fetchVotersFromBlockchain,
    ],
  );
};

export default useBlockchainOperations;
