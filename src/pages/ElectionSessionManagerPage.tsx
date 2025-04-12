'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../test/components/use-toast';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';

// Components
import { Button } from '../components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';

// Custom components
import ElectionList from '../components/election-session-manager/ElectionList';
import ElectionDetail from '../components/election-session-manager/ElectionDetail';
import SessionList from '../components/election-session-manager/SessionList';
import SessionDetail from '../components/election-session-manager/SessionDetail';
import VoterManager from '../components/election-session-manager/VoterManager';
import BlockchainSettings from '../components/election-session-manager/BlockchainSettings';

// Icons
import {
  RefreshCw,
  ChevronLeft,
  Server,
  Database,
  Users,
  Key,
  Cpu,
  Loader,
  AlertCircle,
} from 'lucide-react';

// Custom hooks
import useBlockchainOperations from '../hooks/useBlockchainOperations';
import useSessionKey from '../hooks/useSessionKey';

// Types
import type { CuocBauCu, PhienBauCu } from '../store/types';

// Memoized child components
const MemoizedElectionList = React.memo(ElectionList);
const MemoizedElectionDetail = React.memo(ElectionDetail);
const MemoizedSessionList = React.memo(SessionList);
const MemoizedSessionDetail = React.memo(SessionDetail);
const MemoizedVoterManager = React.memo(VoterManager);
const MemoizedBlockchainSettings = React.memo(BlockchainSettings);

const ElectionSessionManagerPage: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redux state
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // Local state
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedElection, setSelectedElection] = useState<CuocBauCu | null>(null);
  const [selectedSession, setSelectedSession] = useState<PhienBauCu | null>(null);
  const [activeTab, setActiveTab] = useState('elections');
  const [scwAddress, setScwAddress] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(false);

  // Memoize SCW address
  const memoizedScwAddress = useMemo(() => scwAddress, [scwAddress]);

  // Custom hooks
  const {
    electionsList,
    sessionsList,
    votersList,
    electionStatus,
    sessionStatus,
    isLoadingVoters,
    refreshData: refreshBlockchainData,
    checkElectionPermissions,
    checkSessionStatusOnBlockchain,
    fetchSessionsFromBlockchain,
    fetchVotersFromBlockchain,
  } = useBlockchainOperations(memoizedScwAddress);

  const {
    sessionKey,
    isLoading: isLoadingSessionKey,
    getSessionKey,
  } = useSessionKey(userInfo, walletInfo, memoizedScwAddress, toast);

  // Message handlers - Memoized with useCallback
  const showMessage = useCallback(
    (msg: string) => {
      console.log(msg);
      toast({
        title: 'Thông báo',
        description: msg,
      });
    },
    [toast],
  );

  const showError = useCallback(
    (msg: string) => {
      console.error(msg);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: msg,
      });
    },
    [toast],
  );

  // Enhanced refresh function - Memoized with useCallback
  const refreshData = useCallback(async () => {
    if (!scwAddress) {
      showError('Không có địa chỉ SCW, vui lòng kiểm tra lại');
      return;
    }

    setIsRefreshing(true);
    try {
      // Refresh blockchain data
      await refreshBlockchainData();

      // If there's a selected election, check permissions
      if (selectedElectionId && selectedElection) {
        await checkElectionPermissions(selectedElection);
      }

      // If there's a selected session, check status
      if (selectedElection?.blockchainAddress && selectedSessionId) {
        await checkSessionStatusOnBlockchain(selectedElection.blockchainAddress, selectedSessionId);
      }

      showMessage('Dữ liệu đã được cập nhật thành công');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showError(error instanceof Error ? error.message : 'Lỗi không xác định khi làm mới dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  }, [
    scwAddress,
    showError,
    showMessage,
    refreshBlockchainData,
    checkElectionPermissions,
    selectedElectionId,
    selectedElection,
    selectedSessionId,
    checkSessionStatusOnBlockchain,
  ]);

  // Load sessions for the selected election - Memoized with useCallback
  const loadSessionsForElection = useCallback(
    async (election: CuocBauCu) => {
      if (!election.blockchainAddress) {
        showError('Cuộc bầu cử không có địa chỉ blockchain hợp lệ');
        return;
      }

      setIsLoadingSessions(true);
      try {
        const sessions = await fetchSessionsFromBlockchain(election.blockchainAddress);
        showMessage(`Đã tải ${sessions.length} phiên bầu cử`);

        // Auto-select the first session if available
        if (sessions.length > 0) {
          const activeSession = sessions.find((s) => s.trangThai);
          if (activeSession) {
            setSelectedSessionId(activeSession.id);
            setSelectedSession(activeSession);
          } else {
            setSelectedSessionId(sessions[0].id);
            setSelectedSession(sessions[0]);
          }
        } else {
          setSelectedSessionId(null);
          setSelectedSession(null);
          showMessage('Cuộc bầu cử này chưa có phiên bầu cử nào');
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        showError('Không thể tải phiên bầu cử từ blockchain');
      } finally {
        setIsLoadingSessions(false);
      }
    },
    [fetchSessionsFromBlockchain, showError, showMessage],
  );

  // Fetch data on component mount - Use stable dependencies
  useEffect(() => {
    const loadBlockchainData = async () => {
      if (userInfo && userInfo.id) {
        if (userInfo.diaChiVi) {
          dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
        }
      }
    };

    loadBlockchainData();
  }, [userInfo, dispatch]);

  // Set SCW address when wallet info is available
  useEffect(() => {
    if (walletInfo && walletInfo.diaChiVi !== scwAddress) {
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Set selected election from URL param and load sessions - Stable dependencies
  useEffect(() => {
    if (electionId && electionsList.length > 0) {
      const parsedId = Number.parseInt(electionId);
      const election = electionsList.find((e) => e.id === parsedId);

      if (election && (!selectedElection || selectedElection.id !== parsedId)) {
        // Only update if different from current selection
        setSelectedElectionId(parsedId);
        setSelectedElection(election);

        // Load sessions for this election
        if (election.blockchainAddress) {
          loadSessionsForElection(election);

          // Check permissions for this election
          setIsCheckingPermission(true);
          checkElectionPermissions(election).finally(() => {
            setIsCheckingPermission(false);
          });
        }
      }
    }
  }, [
    electionId,
    electionsList,
    loadSessionsForElection,
    checkElectionPermissions,
    selectedElection,
  ]);

  // Fetch voters when session is selected - Stable dependencies
  useEffect(() => {
    if (selectedSessionId && selectedElection?.blockchainAddress) {
      // Check session status on blockchain - only if we have a valid session ID and election address
      checkSessionStatusOnBlockchain(selectedElection.blockchainAddress, selectedSessionId);
    }
  }, [selectedSessionId, selectedElection?.blockchainAddress, checkSessionStatusOnBlockchain]);

  // Add a new function to load voters data explicitly
  const loadVotersData = useCallback(() => {
    if (selectedSessionId && selectedElection?.blockchainAddress) {
      fetchVotersFromBlockchain(selectedElection.blockchainAddress, selectedSessionId);
    }
  }, [selectedSessionId, selectedElection?.blockchainAddress, fetchVotersFromBlockchain]);

  // Go back to election list - Memoized with useCallback
  const goBack = useCallback(() => {
    navigate('/app/user-elections');
  }, [navigate]);

  // Handle election selection - Memoized with useCallback
  const handleElectionSelect = useCallback(
    async (id: string) => {
      const parsedId = Number.parseInt(id);
      if (selectedElectionId === parsedId) return; // Avoid unnecessary updates

      setSelectedElectionId(parsedId);
      setSelectedSessionId(null);
      setSelectedSession(null);

      const election = electionsList.find((e) => e.id === parsedId);
      if (election) {
        setSelectedElection(election);

        // Check permissions for this election
        if (election.blockchainAddress && scwAddress) {
          setIsCheckingPermission(true);
          await checkElectionPermissions(election)
            .catch(console.error)
            .finally(() => {
              setIsCheckingPermission(false);
            });
        }

        // Load sessions for this election
        if (election.blockchainAddress) {
          await loadSessionsForElection(election);
        }

        // Switch to sessions tab
        setActiveTab('sessions');

        // Update URL
        navigate(`/app/election-session-manager/${parsedId}`);
      }
    },
    [
      electionsList,
      scwAddress,
      selectedElectionId,
      checkElectionPermissions,
      loadSessionsForElection,
      navigate,
    ],
  );

  // Handle session selection - Memoized with useCallback
  const handleSessionSelect = useCallback(
    (id: string) => {
      const parsedId = Number.parseInt(id);
      if (selectedSessionId === parsedId) return; // Avoid unnecessary updates

      setSelectedSessionId(parsedId);

      const session = sessionsList.find((s) => s.id === parsedId);
      if (session) {
        setSelectedSession(session);

        // If selecting a session, check its status
        if (selectedElection?.blockchainAddress) {
          checkSessionStatusOnBlockchain(selectedElection.blockchainAddress, parsedId);
        }
      }
    },
    [sessionsList, selectedSessionId, selectedElection, checkSessionStatusOnBlockchain],
  );

  // Memoize handler for setting isStartingSession
  const setIsStartingSessionHandler = useCallback((value: boolean) => {
    setIsStartingSession(value);
  }, []);

  // Modify the handleTabChange function to load voters when switching to the voters tab
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);

      // Load voters data when switching to the voters tab
      if (value === 'voters') {
        loadVotersData();
      }
    },
    [loadVotersData],
  );

  // Render content based on active tab - Memoized with useMemo
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'elections':
        return (
          <div className="space-y-6">
            <MemoizedElectionList
              electionsList={electionsList}
              selectedElectionId={selectedElectionId}
              handleElectionSelect={handleElectionSelect}
              scwAddress={scwAddress}
              refreshData={refreshData}
            />
            {selectedElection && (
              <MemoizedElectionDetail
                selectedElection={selectedElection}
                electionStatus={electionStatus}
                checkElectionPermissions={() => checkElectionPermissions(selectedElection)}
                isCheckingPermission={isCheckingPermission}
              />
            )}
          </div>
        );
      case 'sessions':
        return (
          <div className="space-y-6">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center p-12">
                <Loader className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>Đang tải danh sách phiên bầu cử...</span>
              </div>
            ) : (
              <>
                <MemoizedSessionList
                  sessionsList={sessionsList}
                  selectedElection={selectedElection}
                  selectedSessionId={selectedSessionId}
                  handleSessionSelect={handleSessionSelect}
                />
                {selectedSession && selectedSessionId && (
                  <MemoizedSessionDetail
                    selectedSession={selectedSession}
                    selectedElection={selectedElection}
                    sessionStatus={sessionStatus}
                    electionStatus={electionStatus}
                    sessionKey={sessionKey}
                    getSessionKey={getSessionKey}
                    isStartingSession={isStartingSession}
                    setIsStartingSession={setIsStartingSessionHandler}
                    selectedSessionId={selectedSessionId}
                    isLoading={isLoadingSessionKey}
                    votersList={votersList}
                    scwAddress={scwAddress}
                    showError={showError}
                    showMessage={showMessage}
                  />
                )}
              </>
            )}
            {!selectedElection && (
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>Chưa chọn cuộc bầu cử</AlertTitle>
                <AlertDescription>
                  Vui lòng chọn một cuộc bầu cử từ tab "Cuộc Bầu Cử" trước khi xem phiên bầu cử.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );
      case 'voters':
        return (
          <MemoizedVoterManager
            selectedSession={selectedSession}
            sessionStatus={sessionStatus}
            sessionKey={sessionKey}
            votersList={votersList}
            isLoadingVoters={isLoadingVoters}
            refreshData={refreshData}
            getSessionKey={getSessionKey}
          />
        );
      case 'settings':
        return (
          <MemoizedBlockchainSettings
            sessionKey={sessionKey}
            walletInfo={walletInfo}
            getSessionKey={getSessionKey}
            isLoading={isLoadingSessionKey}
            toast={toast}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab,
    electionsList,
    sessionsList,
    votersList,
    selectedElectionId,
    selectedSessionId,
    selectedElection,
    selectedSession,
    electionStatus,
    sessionStatus,
    sessionKey,
    isLoadingSessions,
    isLoadingVoters,
    isLoadingSessionKey,
    isStartingSession,
    isCheckingPermission,
    scwAddress,
    handleElectionSelect,
    handleSessionSelect,
    refreshData,
    getSessionKey,
    checkElectionPermissions,
    showError,
    showMessage,
    setIsStartingSessionHandler,
    walletInfo,
    toast,
    loadVotersData,
  ]);

  // Memoize the tabs UI
  const tabsUI = useMemo(
    () => (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 gap-2 mb-6">
          <TabsTrigger value="elections" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden md:inline">Cuộc Bầu Cử</span>
            <span className="md:hidden">Cuộc BĐ</span>
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="flex items-center gap-2"
            disabled={!selectedElection}
          >
            <Database className="h-4 w-4" />
            <span className="hidden md:inline">Phiên Bầu Cử</span>
            <span className="md:hidden">Phiên BĐ</span>
            {isLoadingSessions && <Loader className="ml-1 h-3 w-3 animate-spin" />}
          </TabsTrigger>
          <TabsTrigger
            value="voters"
            className="flex items-center gap-2"
            disabled={!selectedSession}
          >
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Cử Tri</span>
            <span className="md:hidden">CT</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden md:inline">Cài Đặt</span>
            <span className="md:hidden">CĐ</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    ),
    [activeTab, selectedElection, selectedSession, isLoadingSessions, handleTabChange],
  );

  // Memoize header actions
  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-white"
          onClick={goBack}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Quay lại</span>
        </Button>
        <Button
          variant="outline"
          className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-white"
          onClick={refreshData}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          <span className="hidden sm:inline">Làm mới</span>
        </Button>
      </div>
    ),
    [goBack, refreshData, isRefreshing],
  );

  // Memoize header info
  const headerInfo = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
          <Cpu className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Quản Lý Phiên Bầu Cử
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {selectedElection && (
              <div className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md text-xs flex items-center">
                <Database className="h-3 w-3 mr-1" />
                {selectedElection.tenCuocBauCu}
              </div>
            )}
            {selectedSession && (
              <div className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 px-2 py-1 rounded-md text-xs flex items-center">
                <Database className="h-3 w-3 mr-1" />
                {selectedSession.tenPhienBauCu}
              </div>
            )}
            <div className="bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 px-2 py-1 rounded-md text-xs flex items-center">
              <Key className="h-3 w-3 mr-1" />
              SCW: {scwAddress.substring(0, 6)}...{scwAddress.substring(scwAddress.length - 4)}
            </div>
          </div>
        </div>
      </div>
    ),
    [selectedElection, selectedSession, scwAddress],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
      <div className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] rounded-xl shadow-md p-4 md:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {headerInfo}
          {headerActions}
        </header>

        {tabsUI}
        {renderTabContent}

        {/* Process guide section */}
        <div className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Hướng dẫn quản lý phiên bầu cử
          </h3>
          <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-5 list-decimal">
            <li>Chọn một cuộc bầu cử từ danh sách để xem chi tiết.</li>
            <li>Chuyển sang tab "Phiên Bầu Cử" để xem các phiên trong cuộc bầu cử đã chọn.</li>
            <li>Chọn một phiên bầu cử để quản lý.</li>
            <li>Đảm bảo đã tạo khóa phiên trong tab "Cài Đặt" trước khi bắt đầu phiên.</li>
            <li>Bắt đầu phiên bầu cử từ tab "Phiên Bầu Cử".</li>
            <li>Quản lý cử tri và cấp phiếu bầu từ tab "Cử Tri".</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ElectionSessionManagerPage;
