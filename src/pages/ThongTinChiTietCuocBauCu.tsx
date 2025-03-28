import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Calendar, Clock, AlertTriangle } from 'lucide-react';
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
import { fetchCacCuocBauCu } from '../store/slice/cuocBauCuSlice';
import { fetchCacCuTri, addCuTri } from '../store/slice/cuTriSlice';
import { fetchCacUngCuVien } from '../store/slice/ungCuVienSlice';
import { RootState, AppDispatch } from '../store/store';
import { CuocBauCu, CuTri, UngCuVien } from '../store/types';
import { Helmet, HelmetProvider } from 'react-helmet-async';

export default function TienHanhPhienBauCuPage() {
  const { id } = useParams<{ id: string }>();
  const [cuocBauCu, setCuocBauCu] = useState<CuocBauCu | null>(null);
  const [cuTris, setCuTris] = useState<CuTri[]>([]);
  const [ungCuViens, setUngCuViens] = useState<UngCuVien[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.nguoiDung.nguoiDung);

  useEffect(() => {
    const fetchElectionData = async () => {
      if (id) {
        try {
          const electionData = await dispatch(fetchCacCuocBauCu()).unwrap();
          const election = electionData.find((e: CuocBauCu) => e.id === parseInt(id));
          setCuocBauCu(election || null);

          const votersData = await dispatch(fetchCacCuTri()).unwrap();
          const electionVoters = votersData.filter((voter: CuTri) => voter.id === parseInt(id));
          setCuTris(electionVoters);

          const candidatesData = await dispatch(fetchCacUngCuVien()).unwrap();
          const electionCandidates = candidatesData.filter(
            (candidate: UngCuVien) => candidate.viTriUngCuId === parseInt(id),
          );
          setUngCuViens(electionCandidates);

          if (currentUser && currentUser.id) {
            setIsParticipating(electionVoters.some((voter) => voter.id === currentUser.id));
          }
        } catch (error) {
          console.error('Error fetching election data:', error);
        }
      }
    };
    fetchElectionData();
  }, [id, dispatch, currentUser]);

  const handleParticipation = async () => {
    if (!cuocBauCu || !currentUser || !currentUser.id) return;

    const newVoter: CuTri = {
      id: currentUser.id,
      sdt: currentUser.sdt,
      email: currentUser.email,
      xacMinh: false,
      boPhieu: false,
      soLanGuiOTP: 0,
    };

    if (!isParticipating) {
      try {
        await dispatch(addCuTri(newVoter)).unwrap();
        setCuTris((prev) => [...prev, newVoter]);
        setIsParticipating(true);
      } catch (error) {
        console.error('Error saving voter:', error);
      }
    } else {
      // Implement logic to remove voter if needed
      setIsParticipating(false);
    }
  };

  if (!cuocBauCu) return <div>Đang tải...</div>;

  const getStatus = (startDate: Date, endDate: Date) => {
    const now = new Date();
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'ongoing';
  };

  const status = getStatus(new Date(cuocBauCu.ngayBatDau), new Date(cuocBauCu.ngayKetThuc));

  return (
    <HelmetProvider>
      {/* <Helmet>
        <title>Tiến Hành Phiên Bầu Cử | Nền Tảng Bầu Cử Blockchain</title>
        <meta
          name="description"
          content="Trang tiến hành phiên bầu cử trên hệ thống Bầu Cử Blockchain."
        />
        <meta name="keywords" content="Bầu cử, Blockchain, Phiên bầu cử, Tiến hành phiên bầu cử" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="Tiến Hành Phiên Bầu Cử - Bầu Cử Blockchain" />
        <meta
          property="og:description"
          content="Trang tiến hành phiên bầu cử trên hệ thống Bầu Cử Blockchain."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="http://localhost:3000/election-progress" />
        <meta property="og:image" content="http://localhost:3000/logo.png" />
      </Helmet> */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl font-bold">{cuocBauCu.tenCuocBauCu}</CardTitle>
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
            <CardDescription className="text-lg mt-2">{cuocBauCu.moTa}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                <span>Bắt đầu: {new Date(cuocBauCu.ngayBatDau).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span>Kết thúc: {new Date(cuocBauCu.ngayKetThuc).toLocaleString('vi-VN')}</span>
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
                <p className="mb-4">{cuocBauCu.moTa}</p>
                <h3 className="text-lg font-semibold mb-2">Lịch Trình Quan Trọng:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    Thời gian đăng ký cử tri:{' '}
                    {new Date(cuocBauCu.ngayBatDau).toLocaleDateString('vi-VN')} -{' '}
                    {new Date(cuocBauCu.ngayKetThuc).toLocaleDateString('vi-VN')}
                  </li>
                  <li>
                    Thời gian bỏ phiếu: {new Date(cuocBauCu.ngayBatDau).toLocaleString('vi-VN')} -{' '}
                    {new Date(cuocBauCu.ngayKetThuc).toLocaleString('vi-VN')}
                  </li>
                  <li>
                    Thời gian công bố kết quả:{' '}
                    {new Date(cuocBauCu.ngayKetThuc).toLocaleString('vi-VN')}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="voters">
            <Card>
              <CardHeader>
                <CardTitle>Danh Sách Cử Tri Đã Đăng Ký</CardTitle>
                <CardDescription>Tổng số cử tri đã đăng ký: {cuTris?.length}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  {cuTris?.map((voter) => (
                    <div key={voter.id} className="flex items-center space-x-4 mb-4">
                      <Avatar>
                        <AvatarImage
                          src={`https://api.dicebear.com/6.x/initials/svg?seed=${voter.email}`}
                        />
                        <AvatarFallback>{voter.email?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{voter.email}</p>
                        <p className="text-sm text-muted-foreground">{voter.sdt}</p>
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
                <CardDescription>Tổng số ứng cử viên: {ungCuViens?.length}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  {ungCuViens?.map((candidate) => (
                    <div key={candidate.id} className="flex items-center space-x-4 mb-4">
                      <Avatar>
                        <AvatarImage src={candidate.anh} />
                        <AvatarFallback>{candidate.hoTen.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{candidate.hoTen}</p>
                        <p className="text-sm text-muted-foreground">{candidate.moTa}</p>
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
    </HelmetProvider>
  );
}
