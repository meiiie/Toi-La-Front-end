import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import { Bell, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alter';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { RootState, AppDispatch } from '../store/store';
import { fetchCacCuocBauCu, editCuocBauCu } from '../store/slice/cuocBauCuSlice';
import { fetchCacCuTri, editCuTri } from '../store/slice/cuTriSlice';
import { fetchCacUngCuVien } from '../store/slice/ungCuVienSlice';
import PaginationPhu from '../components/PaginationPhu'; // Import PaginationPhu
import { CuocBauCu } from '../store/types';

export default function TienHanhBauCu() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<CuocBauCu | null>(null);
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

  const elections = useSelector((state: RootState) => state.cuocBauCu.cacCuocBauCu);
  const voters = useSelector((state: RootState) => state.cuTri.cacCuTri);
  const candidates = useSelector((state: RootState) => state.ungCuVien.cacUngCuVien);

  useEffect(() => {
    dispatch(fetchCacCuocBauCu());
    dispatch(fetchCacCuTri());
    dispatch(fetchCacUngCuVien());
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      const electionData = elections.find((e) => e.id === parseInt(id));
      setElection(electionData || null);
    }
  }, [id, elections]);

  const handleStartElection = async () => {
    if (!election) return;
    try {
      const updatedElection = { ...election, trangThai: 'ongoing' };
      await dispatch(editCuocBauCu({ id: election.id, cuocBauCu: updatedElection }));
      setElection(updatedElection);
      setConfirmationDialog({ isOpen: false, action: '', title: '', description: '' });
    } catch (error) {
      console.error('Lỗi khi bắt đầu cuộc bầu cử:', error);
    }
  };

  const handleStopElection = async () => {
    if (!election) return;
    try {
      const updatedElection = { ...election, trangThai: 'completed' };
      await dispatch(editCuocBauCu({ id: election.id, cuocBauCu: updatedElection }));
      setElection(updatedElection);
      setConfirmationDialog({ isOpen: false, action: '', title: '', description: '' });
    } catch (error) {
      console.error('Lỗi khi kết thúc cuộc bầu cử:', error);
    }
  };

  const handleUpdateElectionTime = async (startDate: string, endDate: string) => {
    if (!election) return;
    try {
      const updatedElection = {
        ...election,
        ngayBatDau: new Date(startDate),
        ngayKetThuc: new Date(endDate),
      };
      await dispatch(editCuocBauCu({ id: election.id, cuocBauCu: updatedElection }));
      setElection(updatedElection);
    } catch (error) {
      console.error('Lỗi khi cập nhật thời gian bầu cử:', error);
    }
  };

  const handleToggleVoterStatus = async (voterId: number) => {
    const voter = voters.find((v) => v.id === voterId);
    if (!voter) return;
    try {
      const updatedVoter = { ...voter, xacMinh: !voter.xacMinh };
      await dispatch(editCuTri({ id: voter.id, cuTri: updatedVoter }));
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái cử tri:', error);
    }
  };

  const handlePublishResults = async () => {
    if (!election) return;
    try {
      const updatedElection = { ...election, trangThai: 'results_published' };
      await dispatch(editCuocBauCu({ id: election.id, cuocBauCu: updatedElection }));
      setElection(updatedElection);
      setShowResults(true);
    } catch (error) {
      console.error('Lỗi khi công bố kết quả:', error);
    }
  };

  const totalPagesVoters = voters?.length > 0 ? Math.ceil(voters.length / itemsPerPage) : 1;
  const paginatedVoters =
    voters?.length > 0
      ? voters.slice((currentPageVoters - 1) * itemsPerPage, currentPageVoters * itemsPerPage)
      : [];

  const totalPagesCandidates =
    candidates?.length > 0 ? Math.ceil(candidates.length / itemsPerPage) : 1;
  const paginatedCandidates =
    candidates?.length > 0
      ? candidates.slice(
          (currentPageCandidates - 1) * itemsPerPage,
          currentPageCandidates * itemsPerPage,
        )
      : [];

  const handlePageChangeVoters = (page: number) => {
    setCurrentPageVoters(page);
  };

  const handlePageChangeCandidates = (page: number) => {
    setCurrentPageCandidates(page);
  };

  if (!election) return <div>Đang tải...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Quản lý phiên bầu cử | Nền Tảng Bầu Cử Blockchain</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Trang quản lý các chi tiết, ứng viên, cử tri và vai trò cho phiên bầu cử."
        />
        <meta
          name="keywords"
          content="quản lý phiên bầu cử, bầu cử, theo dõi bầu cử, quản lý bầu cử"
        />
      </Helmet>
      <nav className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Bell className="h-8 w-8 mr-2" />
          <h1 className="text-2xl font-bold">Hệ thống Quản lý Bầu cử</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={election.trangThai === 'ongoing' ? 'default' : 'secondary'}>
            {election.trangThai === 'ongoing'
              ? 'Đang diễn ra'
              : election.trangThai === 'completed'
                ? 'Đã kết thúc'
                : 'Chưa bắt đầu'}
          </Badge>
        </div>
      </nav>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{election.tenCuocBauCu}</CardTitle>
          <CardDescription>
            Bắt đầu: {new Date(election.ngayBatDau).toLocaleString('vi-VN')} | Kết thúc:{' '}
            {new Date(election.ngayKetThuc).toLocaleString('vi-VN')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{election.moTa}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          {election.trangThai === 'pending' && (
            <Button
              onClick={() =>
                setConfirmationDialog({
                  isOpen: true,
                  action: 'start',
                  title: 'Bắt đầu cuộc bầu cử',
                  description: 'Bạn có chắc chắn muốn bắt đầu cuộc bầu cử này?',
                })
              }
            >
              Bắt đầu Bầu cử
            </Button>
          )}
          {election.trangThai === 'ongoing' && (
            <Button
              onClick={() =>
                setConfirmationDialog({
                  isOpen: true,
                  action: 'stop',
                  title: 'Kết thúc cuộc bầu cử',
                  description: 'Bạn có chắc chắn muốn kết thúc cuộc bầu cử này?',
                })
              }
            >
              Kết thúc Bầu cử
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() =>
              setConfirmationDialog({
                isOpen: true,
                action: 'edit_time',
                title: 'Chỉnh sửa thời gian bầu cử',
                description: 'Vui lòng nhập thời gian bắt đầu và kết thúc mới.',
              })
            }
          >
            Chỉnh sửa Thời gian
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="voters" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voters">Danh sách Cử tri</TabsTrigger>
          <TabsTrigger value="candidates">Danh sách Ứng cử viên</TabsTrigger>
          <TabsTrigger value="results">Kết quả Bầu cử</TabsTrigger>
        </TabsList>

        <TabsContent value="voters">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Cử tri</CardTitle>
              <CardDescription>Tổng số cử tri: {voters?.length}</CardDescription>
            </CardHeader>
            <CardContent>
              {voters?.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedVoters?.map((voter) => (
                        <TableRow key={voter.id}>
                          <TableCell>{voter.sdt}</TableCell>
                          <TableCell>{voter.email}</TableCell>
                          <TableCell>
                            <Badge variant={voter.xacMinh ? 'default' : 'destructive'}>
                              {voter.xacMinh ? 'Hoạt động' : 'Bị khóa'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              onClick={() => handleToggleVoterStatus(voter.id)}
                            >
                              {voter.xacMinh ? (
                                <Unlock className="h-4 w-4 text-green-500" />
                              ) : (
                                <Lock className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationPhu
                    currentPage={currentPageVoters}
                    totalPages={totalPagesVoters}
                    onPageChange={handlePageChangeVoters}
                  />
                </>
              ) : (
                <p>Không có cử tri nào.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Ứng cử viên</CardTitle>
              <CardDescription>Tổng số ứng cử viên: {candidates?.length}</CardDescription>
            </CardHeader>
            <CardContent>
              {candidates?.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedCandidates?.map((candidate) => (
                      <Card key={candidate.id}>
                        <CardHeader>
                          <Avatar>
                            <AvatarImage src={candidate.anh} />
                            <AvatarFallback>{candidate.hoTen[0]}</AvatarFallback>
                          </Avatar>
                          <CardTitle>{candidate.hoTen}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{candidate.moTa}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <PaginationPhu
                    currentPage={currentPageCandidates}
                    totalPages={totalPagesCandidates}
                    onPageChange={handlePageChangeCandidates}
                  />
                </>
              ) : (
                <p>Không có ứng cử viên nào.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả Bầu cử</CardTitle>
              <CardDescription>
                {election.trangThai === 'completed'
                  ? 'Cuộc bầu cử đã kết thúc'
                  : 'Cuộc bầu cử chưa kết thúc'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {election.trangThai === 'completed' ? (
                showResults ? (
                  <div>
                    {/* Hiển thị kết quả bầu cử ở đây */}
                    <p>Kết quả bầu cử sẽ được hiển thị ở đây.</p>
                  </div>
                ) : (
                  <Button onClick={handlePublishResults}>Công bố Kết quả</Button>
                )
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle>Chưa có kết quả</AlertTitle>
                  <AlertDescription>
                    Kết quả sẽ được hiển thị sau khi cuộc bầu cử kết thúc.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
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
                  defaultValue={election.ngayBatDau.toISOString().slice(0, 16)}
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
                  defaultValue={election.ngayKetThuc.toISOString().slice(0, 16)}
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
                if (confirmationDialog.action === 'start') handleStartElection();
                else if (confirmationDialog.action === 'stop') handleStopElection();
                else if (confirmationDialog.action === 'edit_time') {
                  const startDate = (document.getElementById('start-date') as HTMLInputElement)
                    .value;
                  const endDate = (document.getElementById('end-date') as HTMLInputElement).value;
                  handleUpdateElectionTime(startDate, endDate);
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
}
