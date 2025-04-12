'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  RefreshCw,
  Award,
  Users,
  Info,
  Loader,
  CheckCircle,
  XCircle,
  Wallet,
  Copy,
  ExternalLink,
  User,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import {
  fetchUngCuVienByPhienBauCuId,
  fetchUngCuVienWithImagesByPhienBauCu,
  addUngCuVien,
  editUngCuVien,
  removeUngCuVien,
  fetchImageUngCuVien,
  fetchBlockchainAddress,
} from '../store/slice/ungCuVienSlice';
import { fetchViTriUngCuByPhienBauCuId } from '../store/slice/viTriUngCuSlice';
import { fetchCuTriByPhienBauCuId } from '../store/slice/cuTriSlice';
import type { UngCuVien, CuTri } from '../store/types';

// Components
import CardUngVien from '../features/CardUngVien';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/Dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { Textarea } from '../components/ui/Textarea';
import PaginationPhu from '../components/PaginationPhu';

interface EnhancedCandidateManagementProps {
  phienBauCuId: string;
  cuocBauCuId?: string;
  darkMode?: boolean;
}

const EnhancedCandidateManagement: React.FC<EnhancedCandidateManagementProps> = ({
  phienBauCuId,
  cuocBauCuId, // Không cần prop này nữa vì sẽ lấy từ URL
  darkMode = true,
}) => {
  // Lấy params từ URL
  const { id: cuocBauCuIdFromUrl } = useParams<{ id: string }>();

  // Chuyển đổi sang number
  const parsedCuocBauCuId = Number(cuocBauCuIdFromUrl);

  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const candidates = useSelector((state: RootState) => state.ungCuVien.cacUngCuVien);
  const candidatesWithImages = useSelector((state: RootState) => state.ungCuVien.cacUngCuVienCoAnh);
  const voters = useSelector((state: RootState) => state.cuTri.cacCuTri);
  const loading = useSelector((state: RootState) => state.ungCuVien.dangTai);
  const loadingVoters = useSelector((state: RootState) => state.cuTri.dangTai);
  const imagesMap = useSelector((state: RootState) => state.ungCuVien.imagesMap);
  const viTriList = useSelector((state: RootState) => state.viTriUngCu.cacViTriUngCu);
  const blockchainAddresses = useSelector(
    (state: RootState) => state.ungCuVien.blockchainAddresses,
  );

  // Local state
  const [activeTab, setActiveTab] = useState<string>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [voterSearchTerm, setVoterSearchTerm] = useState<string>('');
  const [selectedViTri, setSelectedViTri] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingCandidate, setEditingCandidate] = useState<UngCuVien | null>(null);
  const [selectedVoter, setSelectedVoter] = useState<CuTri | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Candidate form data for new candidates
  const [candidateForm, setCandidateForm] = useState({
    hoTen: '',
    moTa: '',
    viTriUngCuId: '',
  });

  const [candidatePage, setCandidatePage] = useState<number>(1);
  const [candidatesPerPage] = useState<number>(6);
  const [totalCandidatePages, setTotalCandidatePages] = useState<number>(1);

  const [voterPage, setVoterPage] = useState<number>(1);
  const [votersPerPage] = useState<number>(6);
  const [totalVoterPages, setTotalVoterPages] = useState<number>(1);

  // Fetch data when component mounts
  useEffect(() => {
    if (phienBauCuId) {
      loadData();
      dispatch(fetchViTriUngCuByPhienBauCuId(Number.parseInt(phienBauCuId)));
      dispatch(fetchCuTriByPhienBauCuId(Number.parseInt(phienBauCuId)));
    }
  }, [dispatch, phienBauCuId]);

  // Load candidate data
  const loadData = useCallback(async () => {
    if (phienBauCuId) {
      setIsRefreshing(true);
      try {
        await Promise.all([
          dispatch(fetchUngCuVienByPhienBauCuId(Number.parseInt(phienBauCuId))),
          dispatch(fetchUngCuVienWithImagesByPhienBauCu(Number.parseInt(phienBauCuId))),
        ]);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu ứng viên:', error);
        setAlertMessage({
          type: 'error',
          title: 'Lỗi tải dữ liệu',
          message: 'Không thể tải danh sách ứng viên. Vui lòng thử lại sau.',
        });
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [dispatch, phienBauCuId]);

  // When selecting a voter, populate candidate form and switch to info tab
  useEffect(() => {
    if (selectedVoter) {
      setCandidateForm({
        ...candidateForm,
        hoTen: selectedVoter.email?.split('@')[0] || 'Ứng viên mới',
      });
      setActiveTab('info');
    }
  }, [selectedVoter]);

  // Handle candidate edit
  const handleEditCandidate = (candidate: UngCuVien) => {
    setEditingCandidate(candidate);
    setCandidateForm({
      hoTen: candidate.hoTen,
      moTa: candidate.moTa,
      viTriUngCuId: candidate.viTriUngCuId?.toString() || '',
    });
    setActiveTab('info');
  };

  // Handle voter selection
  const handleSelectVoter = (voter: CuTri) => {
    setSelectedVoter(voter);
    // Pre-populate name from email if available
    if (voter.email) {
      const namePart = voter.email.split('@')[0];
      setCandidateForm({
        ...candidateForm,
        hoTen: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      });
    }
    setActiveTab('info');
  };

  // Handle blockchain info
  const handleViewBlockchainInfo = async (candidateId: number) => {
    try {
      await dispatch(fetchBlockchainAddress(candidateId));
    } catch (error) {
      console.error('Lỗi khi lấy thông tin blockchain:', error);
    }
  };

  // Handle candidate delete
  const handleDeleteCandidate = async (candidateId: number) => {
    try {
      await dispatch(removeUngCuVien(candidateId)).unwrap();
      setAlertMessage({
        type: 'success',
        title: 'Xóa thành công',
        message: 'Đã xóa ứng viên khỏi danh sách.',
      });

      // Auto-dismiss alert after 3 seconds
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Không thể xóa ứng viên:', error);
      setAlertMessage({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể xóa ứng viên. Vui lòng thử lại sau.',
      });
    }
  };

  // Handle save candidate
  const handleSaveCandidate = async () => {
    if (!selectedVoter && !editingCandidate) {
      setFormError('Vui lòng chọn cử tri trước khi tạo ứng viên mới');
      return;
    }

    if (!candidateForm.hoTen || !candidateForm.viTriUngCuId) {
      setFormError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingCandidate) {
        // Update existing candidate
        const updatedCandidate = {
          ...editingCandidate,
          hoTen: candidateForm.hoTen,
          moTa: candidateForm.moTa,
          viTriUngCuId: Number.parseInt(candidateForm.viTriUngCuId),
        };

        await dispatch(
          editUngCuVien({
            id: editingCandidate.id,
            ungCuVien: updatedCandidate,
          }),
        ).unwrap();

        setAlertMessage({
          type: 'success',
          title: 'Cập nhật thành công',
          message: `Đã cập nhật thông tin ứng viên ${updatedCandidate.hoTen}.`,
        });
      } else {
        console.log('Thêm ứng viên:', cuocBauCuId);

        // Add new candidate
        const newCandidate: Partial<UngCuVien> = {
          hoTen: candidateForm.hoTen,
          moTa: candidateForm.moTa,
          viTriUngCuId: Number.parseInt(candidateForm.viTriUngCuId),
          phienBauCuId: Number.parseInt(phienBauCuId),
          cuocBauCuId: parsedCuocBauCuId, // Sử dụng ID từ URL
          cuTriId: selectedVoter?.id,
          anh: '', // Default empty image
        };
        console.log('Thêm ứng viên:', parsedCuocBauCuId);

        await dispatch(addUngCuVien(newCandidate as UngCuVien)).unwrap();

        setAlertMessage({
          type: 'success',
          title: 'Thêm thành công',
          message: `Đã thêm ứng viên ${newCandidate.hoTen} vào danh sách.`,
        });
      }

      // Reset form state
      setSelectedVoter(null);
      setEditingCandidate(null);
      setCandidateForm({
        hoTen: '',
        moTa: '',
        viTriUngCuId: '',
      });
      setActiveTab('list');

      // Auto-dismiss alert after 3 seconds
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      console.error('Lỗi khi lưu ứng viên:', error);
      setFormError('Không thể lưu thông tin ứng viên. Vui lòng kiểm tra lại dữ liệu và thử lại.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter candidates based on search term and selected position
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch = candidate.hoTen?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition =
      selectedViTri === 'all' || candidate.viTriUngCuId?.toString() === selectedViTri;
    return matchesSearch && matchesPosition;
  });

  useEffect(() => {
    setTotalCandidatePages(Math.max(1, Math.ceil(filteredCandidates.length / candidatesPerPage)));
    if (
      candidatePage > Math.ceil(filteredCandidates.length / candidatesPerPage) &&
      filteredCandidates.length > 0
    ) {
      setCandidatePage(1);
    }
  }, [filteredCandidates, candidatesPerPage, candidatePage]);

  // Filter voters based on search term and verification status
  const filteredVoters = voters.filter((voter) => {
    // Only show verified voters who don't already have a candidate entry
    const isVerified = voter.xacMinh === true;
    const notAlreadyCandidate = !candidates.some((c) => c.cuTriId === voter.id);
    const matchesSearch =
      voter.email?.toLowerCase().includes(voterSearchTerm.toLowerCase()) ||
      voter.sdt?.includes(voterSearchTerm) ||
      false;

    return isVerified && notAlreadyCandidate && matchesSearch;
  });

  useEffect(() => {
    setTotalVoterPages(Math.max(1, Math.ceil(filteredVoters.length / votersPerPage)));
    if (voterPage > Math.ceil(filteredVoters.length / votersPerPage) && filteredVoters.length > 0) {
      setVoterPage(1);
    }
  }, [filteredVoters, votersPerPage, voterPage]);

  const paginatedCandidates = filteredCandidates.slice(
    (candidatePage - 1) * candidatesPerPage,
    candidatePage * candidatesPerPage,
  );

  const paginatedVoters = filteredVoters.slice(
    (voterPage - 1) * votersPerPage,
    voterPage * votersPerPage,
  );

  // Get position name by ID
  const getPositionName = (positionId?: number) => {
    if (!positionId) return 'Chưa phân loại';
    const position = viTriList.find((pos) => pos.id === positionId);
    return position ? position.tenViTriUngCu : 'Chưa phân loại';
  };

  // Group candidates by position for better organization
  const candidatesByPosition = React.useMemo(() => {
    const groups: Record<string, UngCuVien[]> = { uncategorized: [] };

    viTriList.forEach((position) => {
      groups[position.id.toString()] = [];
    });

    filteredCandidates.forEach((candidate) => {
      if (candidate.viTriUngCuId) {
        const positionId = candidate.viTriUngCuId.toString();
        if (groups[positionId]) {
          groups[positionId].push(candidate);
        } else {
          groups['uncategorized'].push(candidate);
        }
      } else {
        groups['uncategorized'].push(candidate);
      }
    });

    return groups;
  }, [filteredCandidates, viTriList]);

  // Animation variants for smoother UI transitions
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  // Copy blockchain address to clipboard
  const copyBlockchainAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setAlertMessage({
      type: 'success',
      title: 'Đã sao chép',
      message: 'Đã sao chép địa chỉ blockchain vào clipboard',
    });
    setTimeout(() => setAlertMessage(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Display alert message */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type === 'error' ? 'destructive' : 'default'}
          className={`${
            alertMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300'
              : alertMessage.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300'
          }`}
        >
          {alertMessage.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {alertMessage.type === 'error' && <XCircle className="h-4 w-4" />}
          {alertMessage.type === 'info' && <Info className="h-4 w-4" />}
          <AlertTitle>{alertMessage.title}</AlertTitle>
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-white dark:bg-[#162A45]/90 border border-gray-200 dark:border-[#2A3A5A]">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <Users className="mr-2 h-5 w-5 text-purple-500 dark:text-purple-400" />
            Quản lý Ứng Viên
          </CardTitle>
          <CardDescription>Quản lý danh sách ứng viên tham gia phiên bầu cử</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 overflow-x-auto text-xs sm:text-sm">
              <TabsTrigger value="list">
                <Users className="mr-2 h-4 w-4" />
                <span>Danh Sách Ứng Viên</span>
              </TabsTrigger>
              <TabsTrigger value="select">
                <User className="mr-2 h-4 w-4" />
                <span>Chọn Cử Tri</span>
              </TabsTrigger>
              <TabsTrigger value="info" disabled={!selectedVoter && !editingCandidate}>
                <Info className="mr-2 h-4 w-4" />
                <span>Thông Tin Ứng Viên</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Candidate List */}
            <TabsContent value="list" className="space-y-4">
              {/* Header section with search and actions */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm ứng viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
                  />
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <Select value={selectedViTri} onValueChange={setSelectedViTri}>
                    <SelectTrigger className="w-full md:w-44 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]">
                      <SelectValue placeholder="Lọc theo vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả vị trí</SelectItem>
                      {viTriList.map((position) => (
                        <SelectItem key={position.id} value={position.id.toString()}>
                          {position.tenViTriUngCu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1 bg-gray-100 dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A] rounded-md p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 ${viewMode === 'grid' ? 'bg-white dark:bg-[#243656] shadow-sm' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-grid"
                      >
                        <rect width="7" height="7" x="3" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="7" x="3" y="14" rx="1" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-1 ${viewMode === 'list' ? 'bg-white dark:bg-[#243656] shadow-sm' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-list"
                      >
                        <line x1="8" x2="21" y1="6" y2="6" />
                        <line x1="8" x2="21" y1="12" y2="12" />
                        <line x1="8" x2="21" y1="18" y2="18" />
                        <line x1="3" x2="3.01" y1="6" y2="6" />
                        <line x1="3" x2="3.01" y1="12" y2="12" />
                        <line x1="3" x2="3.01" y1="18" y2="18" />
                      </svg>
                    </Button>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
                          onClick={loadData}
                          disabled={isRefreshing}
                        >
                          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Làm mới dữ liệu</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-700 text-white gap-1.5"
                    onClick={() => {
                      setSelectedVoter(null);
                      setEditingCandidate(null);
                      setCandidateForm({
                        hoTen: '',
                        moTa: '',
                        viTriUngCuId: '',
                      });
                      setActiveTab('select');
                    }}
                  >
                    <Plus size={18} />
                    <span>Thêm ứng viên</span>
                  </Button>
                </div>
              </div>

              {/* Main content */}
              {loading && !candidates.length ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center">
                    <Loader
                      size={40}
                      className="animate-spin text-purple-500 dark:text-purple-400 mb-4"
                    />
                    <p className="text-gray-500 dark:text-gray-400">
                      Đang tải danh sách ứng viên...
                    </p>
                  </div>
                </div>
              ) : filteredCandidates.length > 0 ? (
                <div className="space-y-8">
                  {selectedViTri === 'all' ? (
                    // Group by position when showing all
                    Object.entries(candidatesByPosition).map(
                      ([positionId, candidatesInPosition]) => {
                        // Skip empty position groups
                        if (candidatesInPosition.length === 0) return null;

                        // Get position name
                        const positionName =
                          positionId === 'uncategorized'
                            ? 'Chưa phân loại'
                            : getPositionName(Number.parseInt(positionId));

                        return (
                          <motion.div
                            key={positionId}
                            initial="initial"
                            animate="animate"
                            variants={fadeInUp}
                            className="space-y-3"
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                                <Award className="mr-2 h-5 w-5 text-purple-500 dark:text-purple-400" />
                                {positionName}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              >
                                {candidatesInPosition.length} ứng viên
                              </Badge>
                            </div>

                            {viewMode === 'grid' ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {paginatedCandidates.map((candidate) => (
                                    <CardUngVien
                                      key={candidate.id}
                                      candidate={candidate}
                                      onEdit={handleEditCandidate}
                                      onDelete={handleDeleteCandidate}
                                      getPositionName={getPositionName}
                                    />
                                  ))}
                                </div>
                                {filteredCandidates.length > candidatesPerPage && (
                                  <PaginationPhu
                                    currentPage={candidatePage}
                                    totalPages={totalCandidatePages}
                                    onPageChange={setCandidatePage}
                                  />
                                )}
                              </div>
                            ) : (
                              <ListViewCandidates
                                candidates={paginatedCandidates}
                                getPositionName={getPositionName}
                                onEdit={handleEditCandidate}
                                onDelete={handleDeleteCandidate}
                                onViewBlockchainInfo={handleViewBlockchainInfo}
                                blockchainAddresses={blockchainAddresses}
                                copyBlockchainAddress={copyBlockchainAddress}
                                imagesMap={imagesMap}
                              />
                            )}
                            {filteredCandidates.length > candidatesPerPage && (
                              <div className="mt-4">
                                <PaginationPhu
                                  currentPage={candidatePage}
                                  totalPages={totalCandidatePages}
                                  onPageChange={setCandidatePage}
                                />
                              </div>
                            )}
                          </motion.div>
                        );
                      },
                    )
                  ) : (
                    // Show filtered by specific position
                    <motion.div
                      initial="initial"
                      animate="animate"
                      variants={fadeInUp}
                      className="space-y-4"
                    >
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredCandidates.map((candidate) => (
                            <CardUngVien
                              key={candidate.id}
                              candidate={candidate}
                              onEdit={handleEditCandidate}
                              onDelete={handleDeleteCandidate}
                              getPositionName={getPositionName}
                            />
                          ))}
                        </div>
                      ) : (
                        <ListViewCandidates
                          candidates={filteredCandidates}
                          getPositionName={getPositionName}
                          onEdit={handleEditCandidate}
                          onDelete={handleDeleteCandidate}
                          onViewBlockchainInfo={handleViewBlockchainInfo}
                          blockchainAddresses={blockchainAddresses}
                          copyBlockchainAddress={copyBlockchainAddress}
                          imagesMap={imagesMap}
                        />
                      )}
                    </motion.div>
                  )}
                </div>
              ) : (
                <EmptyStateComponent onAddNew={() => setActiveTab('select')} />
              )}
            </TabsContent>

            {/* Tab 2: Select Voter */}
            <TabsContent value="select" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm cử tri đã xác thực..."
                    value={voterSearchTerm}
                    onChange={(e) => setVoterSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
                  />
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                </div>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 mb-4">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">
                  Chọn từ cử tri đã xác thực
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  Ứng viên phải được chọn từ danh sách cử tri đã được xác thực. Chọn một cử tri để
                  tiếp tục.
                </AlertDescription>
              </Alert>

              {loadingVoters ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center">
                    <Loader
                      size={40}
                      className="animate-spin text-purple-500 dark:text-purple-400 mb-4"
                    />
                    <p className="text-gray-500 dark:text-gray-400">Đang tải danh sách cử tri...</p>
                  </div>
                </div>
              ) : filteredVoters.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-1">
                    {paginatedVoters.map((voter) => (
                      <Card
                        key={voter.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedVoter?.id === voter.id
                            ? 'border-2 border-purple-500 dark:border-purple-400'
                            : ''
                        }`}
                        onClick={() => handleSelectVoter(voter)}
                      >
                        <CardContent className="p-3 sm:p-4 flex items-start space-x-3 sm:space-x-4">
                          <Avatar className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30">
                            <AvatarFallback className="text-purple-700 dark:text-purple-300 font-medium">
                              {voter.email?.substring(0, 2).toUpperCase() || 'CU'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{voter.email}</h3>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Đã xác thực
                              </Badge>
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {voter.sdt || 'Chưa có SĐT'}
                            </div>

                            {voter.hasBlockchainWallet && (
                              <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                                <Wallet className="h-3 w-3 mr-1" />
                                Có ví Blockchain
                              </div>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-0"
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Chọn làm ứng viên
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredVoters.length > votersPerPage && (
                    <PaginationPhu
                      currentPage={voterPage}
                      totalPages={totalVoterPages}
                      onPageChange={setVoterPage}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/50 dark:bg-[#162A45]/30 border border-gray-200 dark:border-[#2A3A5A]/50 backdrop-blur-sm rounded-2xl shadow-inner">
                  <div className="mb-6 w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1A2942]/50 flex items-center justify-center">
                    <Users size={48} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-xl mb-4 text-gray-600 dark:text-gray-300 text-center">
                    Không tìm thấy cử tri đã xác thực hoặc tất cả đã được đăng ký làm ứng viên.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Tab 3: Candidate Information */}
            <TabsContent value="info" className="space-y-4">
              {selectedVoter || editingCandidate ? (
                <>
                  {/* Selected Voter Info or Editing Candidate */}
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 mb-4">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">
                      {selectedVoter ? 'Cử tri đã được chọn' : 'Chỉnh sửa ứng viên'}
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      {selectedVoter
                        ? `Bạn đã chọn ${selectedVoter.email} làm ứng viên. Vui lòng cung cấp thêm thông tin để hoàn tất quá trình đăng ký.`
                        : `Đang chỉnh sửa thông tin ứng viên ${editingCandidate?.hoTen}.`}
                    </AlertDescription>
                  </Alert>

                  {formError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTitle>Lỗi</AlertTitle>
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Candidate Registration Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Họ và tên ứng viên <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="Nhập họ và tên đầy đủ của ứng viên"
                          value={candidateForm.hoTen}
                          onChange={(e) =>
                            setCandidateForm({ ...candidateForm, hoTen: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Vị trí ứng cử <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={candidateForm.viTriUngCuId}
                          onValueChange={(value) =>
                            setCandidateForm({ ...candidateForm, viTriUngCuId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn vị trí ứng cử" />
                          </SelectTrigger>
                          <SelectContent>
                            {viTriList.map((position) => (
                              <SelectItem key={position.id} value={position.id.toString()}>
                                {position.tenViTriUngCu} (Tối đa {position.soPhieuToiDa} phiếu)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả chi tiết</label>
                        <Textarea
                          placeholder="Nhập thông tin giới thiệu về ứng viên"
                          rows={6}
                          value={candidateForm.moTa}
                          onChange={(e) =>
                            setCandidateForm({ ...candidateForm, moTa: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedVoter && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                          <h3 className="font-medium text-lg mb-2">Thông tin cử tri</h3>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500 dark:text-gray-400">
                                Email
                              </label>
                              <div className="font-medium flex items-center">
                                <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                {selectedVoter.email}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs text-gray-500 dark:text-gray-400">
                                Số điện thoại
                              </label>
                              <div className="font-medium flex items-center">
                                <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                {selectedVoter.sdt || 'Chưa có SĐT'}
                              </div>
                            </div>
                          </div>

                          {selectedVoter.hasBlockchainWallet && (
                            <div className="mt-4 space-y-1">
                              <label className="text-xs text-gray-500 dark:text-gray-400">
                                Trạng thái ví blockchain
                              </label>
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm font-medium text-green-700 dark:text-green-300 flex items-center">
                                <Wallet className="h-4 w-4 mr-1" />
                                Đã liên kết ví blockchain
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
                        <h3 className="font-medium mb-2 text-blue-800 dark:text-blue-300 flex items-center">
                          <Info className="h-4 w-4 mr-1" />
                          Lưu ý quan trọng
                        </h3>
                        <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                          <li>• Thông tin cử tri sẽ được liên kết với thông tin ứng viên</li>
                          <li>• Địa chỉ ví blockchain sẽ được sử dụng trong quá trình bầu cử</li>
                          <li>• Đảm bảo thông tin chính xác trước khi triển khai lên blockchain</li>
                        </ul>
                      </div>

                      {candidateForm.viTriUngCuId && (
                        <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800/30 bg-purple-50 dark:bg-purple-900/10">
                          <div className="flex items-center mb-2">
                            <Award className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                            <h3 className="font-medium text-purple-800 dark:text-purple-300">
                              Vị trí đã chọn
                            </h3>
                          </div>

                          <div className="space-y-2">
                            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                              {
                                viTriList.find(
                                  (p) => p.id === Number.parseInt(candidateForm.viTriUngCuId),
                                )?.tenViTriUngCu
                              }
                            </Badge>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                              Tối đa{' '}
                              {
                                viTriList.find(
                                  (p) => p.id === Number.parseInt(candidateForm.viTriUngCuId),
                                )?.soPhieuToiDa
                              }{' '}
                              phiếu bầu cho vị trí này
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-200 dark:border-gray-700 mt-6">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setSelectedVoter(null);
                        setEditingCandidate(null);
                        setCandidateForm({
                          hoTen: '',
                          moTa: '',
                          viTriUngCuId: '',
                        });
                        setActiveTab('list');
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 text-white"
                      onClick={handleSaveCandidate}
                      disabled={formSubmitting}
                    >
                      {formSubmitting ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : editingCandidate ? (
                        'Cập nhật ứng viên'
                      ) : (
                        'Đăng ký ứng viên'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/50 dark:bg-[#162A45]/30 border border-gray-200 dark:border-[#2A3A5A]/50 backdrop-blur-sm rounded-2xl shadow-inner">
                  <div className="mb-6 w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1A2942]/50 flex items-center justify-center">
                    <User size={48} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-xl mb-4 text-gray-600 dark:text-gray-300 text-center">
                    Vui lòng chọn cử tri từ tab "Chọn Cử Tri" trước khi thêm thông tin ứng viên.
                  </p>
                  <Button
                    onClick={() => setActiveTab('select')}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 text-white"
                  >
                    <User className="mr-2 inline-block" size={16} />
                    Chọn cử tri
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-indigo-700 dark:text-indigo-400 flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Quy trình đăng ký ứng viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-indigo-800 dark:text-indigo-300">
            <p>
              <strong>1. Chọn cử tri đã xác thực:</strong> Ứng viên phải là một cử tri đã được xác
              thực trong hệ thống.
            </p>
            <p>
              <strong>2. Bổ sung thông tin ứng viên:</strong> Thêm thông tin chi tiết và chọn vị trí
              ứng cử phù hợp.
            </p>
            <p>
              <strong>3. Liên kết với ví blockchain:</strong> Thông tin ứng viên sẽ được liên kết
              với ví blockchain của cử tri.
            </p>
            <p className="text-sm italic mt-2">
              Đây là quy trình đảm bảo mọi ứng viên đều phải có trong danh sách cử tri đã xác thực.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// List view component for candidates
const ListViewCandidates: React.FC<{
  candidates: UngCuVien[];
  getPositionName: (id?: number) => string;
  onEdit: (candidate: UngCuVien) => void;
  onDelete: (id: number) => void;
  onViewBlockchainInfo: (id: number) => void;
  blockchainAddresses: Record<number, string>;
  copyBlockchainAddress: (address: string) => void;
  imagesMap: Record<number, string>;
}> = ({
  candidates,
  getPositionName,
  onEdit,
  onDelete,
  onViewBlockchainInfo,
  blockchainAddresses,
  copyBlockchainAddress,
  imagesMap,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Load images for candidates if needed
  useEffect(() => {
    candidates.forEach((candidate) => {
      if (candidate.anh && !imagesMap[candidate.id]) {
        dispatch(fetchImageUngCuVien(candidate.id));
      }
    });
  }, [candidates, imagesMap, dispatch]);

  return (
    <div className="bg-white dark:bg-[#162A45]/80 rounded-lg border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#1A2942]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ứng viên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vị trí ứng cử
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ví Blockchain
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-800">
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-[#1A2942]/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                      {imagesMap[candidate.id] ? (
                        <img
                          src={imagesMap[candidate.id] || '/placeholder.svg'}
                          alt={`Hình ảnh của ${candidate.hoTen}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Xử lý lỗi khi ảnh không tải được
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `
                              <div class="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                              </div>
                            `;
                          }}
                        />
                      ) : candidate.anh ? (
                        // Loading indicator for image
                        <div className="h-full w-full flex items-center justify-center">
                          <Loader
                            size={16}
                            className="animate-spin text-purple-500 dark:text-purple-400"
                          />
                        </div>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <Users size={16} />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {candidate.hoTen}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {candidate.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/30"
                  >
                    {getPositionName(candidate.viTriUngCuId)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-300 line-clamp-2">
                    {candidate.moTa || 'Chưa có mô tả'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {blockchainAddresses[candidate.id] ? (
                    <div className="flex items-center">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono truncate max-w-[120px]">
                        {blockchainAddresses[candidate.id]}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-6 w-6 p-0"
                        onClick={() => copyBlockchainAddress(blockchainAddresses[candidate.id])}
                      >
                        <Copy size={12} />
                      </Button>
                      <a
                        href={`https://sepolia.etherscan.io/address/${blockchainAddresses[candidate.id]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-500"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 dark:text-blue-400 p-0"
                      onClick={() => onViewBlockchainInfo(candidate.id)}
                    >
                      <Wallet size={12} className="mr-1" />
                      Xem địa chỉ
                    </Button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      onClick={() => onEdit(candidate)}
                    >
                      Sửa
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Xóa
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Xác nhận xóa</DialogTitle>
                          <DialogDescription>
                            Bạn có chắc chắn muốn xóa ứng viên{' '}
                            <span className="font-medium">{candidate.hoTen}</span>? Hành động này
                            không thể hoàn tác.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>
                            Hủy
                          </Button>
                          <Button variant="destructive" onClick={() => onDelete(candidate.id)}>
                            Xóa
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Empty state component
const EmptyStateComponent: React.FC<{ onAddNew?: () => void }> = ({ onAddNew }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/50 dark:bg-[#162A45]/30 border border-gray-200 dark:border-[#2A3A5A]/50 backdrop-blur-sm rounded-2xl shadow-inner">
      <div className="mb-6 w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1A2942]/50 flex items-center justify-center">
        <Users size={48} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-xl mb-4 text-gray-600 dark:text-gray-300 text-center">
        Chưa có ứng viên nào. Hãy đăng ký ứng viên từ danh sách cử tri đã xác thực!
      </p>
      <Button
        onClick={onAddNew}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 text-white hover:shadow-lg dark:hover:shadow-purple-500/20 transition-all transform hover:translate-y-[-2px]"
      >
        <Plus className="mr-2 inline-block" size={16} />
        Thêm ứng viên mới
      </Button>
    </div>
  );
};

export default EnhancedCandidateManagement;
