'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alter';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import type { RootState, AppDispatch } from '../store/store';
import { fetchPhienBauCuById, editPhienBauCu } from '../store/slice/phienBauCuSlice';
import { fetchCacCuTri, editCuTri } from '../store/slice/cuTriSlice';
import { fetchCacUngCuVien } from '../store/slice/ungCuVienSlice';
import type { PhienBauCu } from '../store/types';
import { Header, ElectionCard } from '../test/components/CommonComponents';
import VoterManagement from '../test/components/QuanLyCuTriPage';
import CandidateManagement from '../test/components/QuanLyUngVienPage';

const TienHanhPhienBauCuPage: React.FC = () => {
  const { idPhien } = useParams<{ idPhien: string }>();
  const [session, setSession] = useState<PhienBauCu | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    action: '',
    title: '',
    description: '',
  });
  const [currentPageVoters, setCurrentPageVoters] = useState(1);
  const [currentPageCandidates, setCurrentPageCandidates] = useState(1);
  const itemsPerPage = 5;
  const dispatch = useDispatch<AppDispatch>();

  const voters = useSelector((state: RootState) => state.cuTri.cacCuTri);
  const candidates = useSelector((state: RootState) => state.ungCuVien.cacUngCuVien);

  useEffect(() => {
    if (idPhien) {
      dispatch(fetchPhienBauCuById(parseInt(idPhien)));
    }
    dispatch(fetchCacCuTri());
    dispatch(fetchCacUngCuVien());
  }, [dispatch, idPhien]);

  const sessionData = useSelector((state: RootState) => state.phienBauCu.cacPhienBauCu);
  useEffect(() => {
    setSession(sessionData.length > 0 ? sessionData[0] : null);
  }, [sessionData]);

  const handleStartSession = async () => {
    if (!session) return;
    try {
      const updatedSession = { ...session, trangThai: 'ongoing' };
      await dispatch(editPhienBauCu(updatedSession));
      setSession(updatedSession);
      setConfirmationDialog({ isOpen: false, action: '', title: '', description: '' });
    } catch (error) {
      console.error('Lỗi khi bắt đầu phiên bầu cử:', error);
    }
  };

  const handleStopSession = async () => {
    if (!session) return;
    try {
      const updatedSession = { ...session, trangThai: 'completed' };
      await dispatch(editPhienBauCu(updatedSession));
      setSession(updatedSession);
      setConfirmationDialog({ isOpen: false, action: '', title: '', description: '' });
    } catch (error) {
      console.error('Lỗi khi kết thúc phiên bầu cử:', error);
    }
  };

  const handleUpdateSessionTime = async (startDate: string, endDate: string) => {
    if (!session) return;
    try {
      const updatedSession = {
        ...session,
        ngayBatDau: startDate,
        ngayKetThuc: endDate,
      };
      await dispatch(editPhienBauCu(updatedSession));
      setSession(updatedSession);
    } catch (error) {
      console.error('Lỗi khi cập nhật thời gian phiên bầu cử:', error);
    }
  };

  const handlePublishResults = async () => {
    if (!session) return;
    try {
      const updatedSession = { ...session, trangThai: 'results_published' };
      await dispatch(editPhienBauCu(updatedSession));
      setSession(updatedSession);
      setShowResults(true);
    } catch (error) {
      console.error('Lỗi khi công bố kết quả:', error);
    }
  };

  const totalPagesVoters = voters?.length > 0 ? Math.ceil(voters.length / itemsPerPage) : 1;
  const totalPagesCandidates =
    candidates?.length > 0 ? Math.ceil(candidates.length / itemsPerPage) : 1;

  if (!session) return <div>Đang tải...</div>;

  function handleToggleVoterStatus(voterId: number): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Header title="Tiến Hành Phiên Bầu Cử" status={session.trangThai || ''} />

      <ElectionCard
        title={session.tenPhienBauCu}
        description={session.moTa}
        startDate={session.ngayBatDau}
        endDate={session.ngayKetThuc}
        status={session.trangThai || ''}
        onStart={() =>
          setConfirmationDialog({
            isOpen: true,
            action: 'start',
            title: 'Bắt đầu phiên bầu cử',
            description: 'Bạn có chắc chắn muốn bắt đầu phiên bầu cử này?',
          })
        }
        onStop={() =>
          setConfirmationDialog({
            isOpen: true,
            action: 'stop',
            title: 'Kết thúc phiên bầu cử',
            description: 'Bạn có chắc chắn muốn kết thúc phiên bầu cử này?',
          })
        }
        onEditTime={() =>
          setConfirmationDialog({
            isOpen: true,
            action: 'edit_time',
            title: 'Chỉnh sửa thời gian phiên bầu cử',
            description: 'Vui lòng nhập thời gian bắt đầu và kết thúc mới.',
          })
        }
      />

      <Tabs defaultValue="voters" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voters">Danh sách Cử tri</TabsTrigger>
          <TabsTrigger value="candidates">Danh sách Ứng cử viên</TabsTrigger>
          <TabsTrigger value="results">Kết quả Bầu cử</TabsTrigger>
        </TabsList>

        <TabsContent value="voters">
          <VoterManagement
            voters={voters.slice(
              (currentPageVoters - 1) * itemsPerPage,
              currentPageVoters * itemsPerPage,
            )}
            onToggleVoterStatus={handleToggleVoterStatus}
            currentPage={currentPageVoters}
            totalPages={totalPagesVoters}
            onPageChange={setCurrentPageVoters}
          />
        </TabsContent>

        <TabsContent value="candidates">
          <CandidateManagement
            candidates={candidates.slice(
              (currentPageCandidates - 1) * itemsPerPage,
              currentPageCandidates * itemsPerPage,
            )}
            currentPage={currentPageCandidates}
            totalPages={totalPagesCandidates}
            onPageChange={setCurrentPageCandidates}
          />
        </TabsContent>

        <TabsContent value="results">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Kết quả Phiên Bầu cử</h2>
            {session.trangThai === 'completed' ? (
              showResults ? (
                <div>
                  {/* Hiển thị kết quả phiên bầu cử ở đây */}
                  <p>Kết quả phiên bầu cử sẽ được hiển thị ở đây.</p>
                </div>
              ) : (
                <Button onClick={handlePublishResults}>Công bố Kết quả</Button>
              )
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertTitle>Chưa có kết quả</AlertTitle>
                <AlertDescription>
                  Kết quả sẽ được hiển thị sau khi phiên bầu cử kết thúc.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={confirmationDialog.isOpen}
        onOpenChange={(isOpen) => setConfirmationDialog({ ...confirmationDialog, isOpen })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmationDialog.title}</DialogTitle>
            <DialogDescription>{confirmationDialog.description}</DialogDescription>
          </DialogHeader>
          {confirmationDialog.action === 'edit_time' && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="start-date" className="text-right">
                  Bắt đầu
                </label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  className="col-span-3"
                  defaultValue={session.ngayBatDau.toString().slice(0, 16)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="end-date" className="text-right">
                  Kết thúc
                </label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  className="col-span-3"
                  defaultValue={session.ngayKetThuc.toString().slice(0, 16)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (confirmationDialog.action === 'start') handleStartSession();
                else if (confirmationDialog.action === 'stop') handleStopSession();
                else if (confirmationDialog.action === 'edit_time') {
                  const startDate = (document.getElementById('start-date') as HTMLInputElement)
                    .value;
                  const endDate = (document.getElementById('end-date') as HTMLInputElement).value;
                  handleUpdateSessionTime(startDate, endDate);
                  setConfirmationDialog({ ...confirmationDialog, isOpen: false });
                }
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TienHanhPhienBauCuPage;
