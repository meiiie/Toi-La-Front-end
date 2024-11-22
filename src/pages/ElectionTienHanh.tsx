import { useState, useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Calendar, Clock, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { ScrollArea } from '../components/ui/Scroll-area';
import { getElectionById } from '../api/electionApi';
import { getVotersByElectionId, saveVoters } from '../api/voterApi';
import { getCandidatesByElectionId } from '../api/candidateApi';
import { RootState } from '../store/store';
import { Election, Voter, Candidate } from '../store/types';
import { setElections, updateElection } from '../store/electionSlice';
import { setVoters, addVoter } from '../store/votersSlice';

export default function ElectionTienHanh() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [voters, setVotersState] = useState<Voter[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.users.currentUser);

  useEffect(() => {
    const fetchElectionData = async () => {
      if (id) {
        try {
          const electionData = await getElectionById(id);
          setElection(electionData);
          dispatch(updateElection(electionData));

          const votersData = await getVotersByElectionId(id);
          setVotersState(votersData);
          dispatch(setVoters(votersData));

          const candidatesData = await getCandidatesByElectionId(id);
          setCandidates(candidatesData);

          if (currentUser && currentUser.id) {
            setIsParticipating(votersData.some((voter) => voter.id === currentUser.id.toString()));
          }
        } catch (error) {
          console.error('Error fetching election data:', error);
        }
      }
    };
    fetchElectionData();
  }, [id, dispatch, currentUser]);

  const handleParticipation = async () => {
    if (!election || !currentUser || !currentUser.id) return;

    const newVoter: Voter = {
      id: currentUser.id.toString(),
      name: currentUser.name,
      phone: currentUser.account?.phone || '',
      email: currentUser.account?.email || '',
      isRestricted: false,
      roleId: currentUser.roles && currentUser.roles.length > 0 ? currentUser.roles[0].id : 0,
    };

    if (!isParticipating) {
      try {
        await saveVoters(election.id, [newVoter]);
        dispatch(addVoter(newVoter));
        setVotersState((prev) => [...prev, newVoter]);
        setIsParticipating(true);
      } catch (error) {
        console.error('Error saving voter:', error);
      }
    } else {
      // Implement logic to remove voter if needed
      setIsParticipating(false);
    }
  };

  if (!election) return <div>Đang tải...</div>;

  const getStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'ongoing';
  };

  const status = getStatus(election.startDate, election.endDate);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold">{election.name}</CardTitle>
            <Badge
              variant={
                status === 'ongoing' ? 'default' : status === 'upcoming' ? 'secondary' : 'outline'
              }
              className="text-lg"
            >
              {status === 'ongoing'
                ? 'Đang diễn ra'
                : status === 'upcoming'
                  ? 'Sắp diễn ra'
                  : 'Đã kết thúc'}
            </Badge>
          </div>
          <CardDescription className="text-lg mt-2">{election.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span>Bắt đầu: {new Date(election.startDate).toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>Kết thúc: {new Date(election.endDate).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleParticipation}
            disabled={status !== 'upcoming' || !currentUser}
            className={`w-full ${isParticipating ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isParticipating ? 'Đã Đăng Ký Tham Gia' : 'Đăng Ký Tham Gia'}
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Thông Tin Chi Tiết</TabsTrigger>
          <TabsTrigger value="voters">Danh Sách Cử Tri</TabsTrigger>
          <TabsTrigger value="candidates">Danh Sách Ứng Cử Viên</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Chi Tiết Cuộc Bầu Cử</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{election.description}</p>
              <h3 className="text-lg font-semibold mb-2">Lịch Trình Quan Trọng:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Thời gian đăng ký cử tri:{' '}
                  {new Date(election.startDate).toLocaleDateString('vi-VN')} -{' '}
                  {new Date(election.endDate).toLocaleDateString('vi-VN')}
                </li>
                <li>
                  Thời gian bỏ phiếu: {new Date(election.startDate).toLocaleString('vi-VN')} -{' '}
                  {new Date(election.endDate).toLocaleString('vi-VN')}
                </li>
                <li>
                  Thời gian công bố kết quả: {new Date(election.endDate).toLocaleString('vi-VN')}
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="voters">
          <Card>
            <CardHeader>
              <CardTitle>Danh Sách Cử Tri Đã Đăng Ký</CardTitle>
              <CardDescription>Tổng số cử tri đã đăng ký: {voters?.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                {voters?.map((voter) => (
                  <div key={voter.id} className="flex items-center space-x-4 mb-4">
                    <Avatar>
                      <AvatarImage
                        src={`https://api.dicebear.com/6.x/initials/svg?seed=${voter.name}`}
                      />
                      <AvatarFallback>{voter.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{voter.name}</p>
                      <p className="text-sm text-muted-foreground">{voter.email}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle>Danh Sách Ứng Cử Viên</CardTitle>
              <CardDescription>Tổng số ứng cử viên: {candidates?.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                {candidates?.map((candidate) => (
                  <div key={candidate.id} className="flex items-center space-x-4 mb-4">
                    <Avatar>
                      <AvatarImage src={candidate.imageUrl} />
                      <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{candidate.name}</p>
                      <p className="text-sm text-muted-foreground">{candidate.description}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {status === 'upcoming' && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Nhắc nhở
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Đăng ký nhận thông báo về các cập nhật quan trọng của cuộc bầu cử này.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Đăng Ký Nhắc Nhở
            </Button>
          </CardFooter>
        </Card>
      )}

      {status === 'ongoing' && (
        <Card className="mt-8 bg-yellow-100 dark:bg-yellow-900">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Cuộc bầu cử đang diễn ra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 dark:text-yellow-300">
              Hãy đảm bảo bạn đã bỏ phiếu trước khi cuộc bầu cử kết thúc.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
              Tiến Hành Bỏ Phiếu
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
