import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { getElectionById, updateElection } from '../api/electionApi';
import { getVotersByElectionId, saveVoters } from '../api/voterApi';
import { getCandidatesByElectionId, saveCandidates } from '../api/candidateApi';
import { RootState } from '../store/store';
import { Election, Voter, Candidate, User } from '../store/types';
import { setElections, updateElection as updateElectionAction } from '../store/electionSlice';
import { setVoters, updateVoter } from '../store/votersSlice';

export default function TienHanhBauCu() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [voters, setVotersState] = useState<Voter[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    action: '',
    title: '',
    description: '',
  });
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.users.currentUser);

  useEffect(() => {
    const fetchElectionData = async () => {
      if (id) {
        try {
          const electionData = await getElectionById(id);
          setElection(electionData);
          dispatch(updateElectionAction(electionData));

          const votersData = await getVotersByElectionId(id);
          setVotersState(votersData);
          dispatch(setVoters(votersData));

          const candidatesData = await getCandidatesByElectionId(id);
          setCandidates(candidatesData);
        } catch (error) {
          console.error('Lỗi khi tải dữ liệu bầu cử:', error);
        }
      }
    };
    fetchElectionData();
  }, [id, dispatch]);

  const handleStartElection = async () => {
    if (!election) return;
    try {
      const updatedElection = { ...election, status: 'ongoing' };
      await updateElection(election.id, updatedElection);
      setElection(updatedElection);
      dispatch(updateElectionAction(updatedElection));
      setConfirmationDialog({ isOpen: false, action: '', title: '', description: '' });
    } catch (error) {
      console.error('Lỗi khi bắt đầu cuộc bầu cử:', error);
    }
  };

  const handleStopElection = async () => {
    if (!election) return;
    try {
      const updatedElection = { ...election, status: 'completed' };
      await updateElection(election.id, updatedElection);
      setElection(updatedElection);
      dispatch(updateElectionAction(updatedElection));
      setConfirmationDialog({ isOpen: false, action: '', title: '', description: '' });
    } catch (error) {
      console.error('Lỗi khi kết thúc cuộc bầu cử:', error);
    }
  };

  const handleUpdateElectionTime = async (startDate: string, endDate: string) => {
    if (!election) return;
    try {
      const updatedElection = { ...election, startDate, endDate };
      await updateElection(election.id, updatedElection);
      setElection(updatedElection);
      dispatch(updateElectionAction(updatedElection));
    } catch (error) {
      console.error('Lỗi khi cập nhật thời gian bầu cử:', error);
    }
  };

  const handleToggleVoterStatus = async (voterId: string) => {
    const voter = voters.find((v) => v.id === voterId);
    if (!voter) return;
    try {
      const updatedVoter = { ...voter, isRestricted: !voter.isRestricted };
      await updateVoter(updatedVoter);
      setVotersState(voters?.map((v) => (v.id === voterId ? updatedVoter : v)));
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái cử tri:', error);
    }
  };

  const handlePublishResults = async () => {
    if (!election) return;
    try {
      const updatedElection = { ...election, status: 'results_published' };
      await updateElection(election.id, updatedElection);
      setElection(updatedElection);
      dispatch(updateElectionAction(updatedElection));
      setShowResults(true);
    } catch (error) {
      console.error('Lỗi khi công bố kết quả:', error);
    }
  };

  if (!election) return <div>Đang tải...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Bell className="h-8 w-8 mr-2" />
          <h1 className="text-2xl font-bold">Hệ thống Quản lý Bầu cử</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={election.status === 'ongoing' ? 'default' : 'secondary'}>
            {election.status === 'ongoing'
              ? 'Đang diễn ra'
              : election.status === 'completed'
                ? 'Đã kết thúc'
                : 'Chưa bắt đầu'}
          </Badge>
          <Button variant="outline">Đăng xuất</Button>
        </div>
      </nav>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{election.name}</CardTitle>
          <CardDescription>
            Bắt đầu: {new Date(election.startDate).toLocaleString('vi-VN')} | Kết thúc:{' '}
            {new Date(election.endDate).toLocaleString('vi-VN')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{election.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          {election.status === 'pending' && (
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
          {election.status === 'ongoing' && (
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
                  {voters?.map((voter) => (
                    <TableRow key={voter.id}>
                      <TableCell>{voter.name}</TableCell>
                      <TableCell>{voter.email}</TableCell>
                      <TableCell>
                        <Badge variant={voter.isRestricted ? 'destructive' : 'default'}>
                          {voter.isRestricted ? 'Bị khóa' : 'Hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" onClick={() => handleToggleVoterStatus(voter.id)}>
                          {voter.isRestricted ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates?.map((candidate) => (
                  <Card key={candidate.id}>
                    <CardHeader>
                      <Avatar>
                        <AvatarImage src={candidate.imageUrl} />
                        <AvatarFallback>{candidate.name[0]}</AvatarFallback>
                      </Avatar>
                      <CardTitle>{candidate.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{candidate.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả Bầu cử</CardTitle>
              <CardDescription>
                {election.status === 'completed'
                  ? 'Cuộc bầu cử đã kết thúc'
                  : 'Cuộc bầu cử chưa kết thúc'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {election.status === 'completed' ? (
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
                  <AlertTriangle className="h-4 w-4" />
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
                  defaultValue={election.startDate}
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
                  defaultValue={election.endDate}
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
