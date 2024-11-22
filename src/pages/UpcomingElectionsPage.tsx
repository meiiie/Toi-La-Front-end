import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Calendar, CheckCircle, Clock, Search, User } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { setElections, setUserElections } from '../store/electionSlice';
import { getElections, getUserElections } from '../api/electionApi';
import { Election } from '../store/types';
import { RootState } from '../store/store';

export default function ElectionNotifications() {
  const dispatch = useDispatch();
  const elections = useSelector((state: RootState) => state.elections.elections);
  const userElections = useSelector((state: RootState) => state.elections.userElections);
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchElections = async () => {
      const allElections = await getElections();
      dispatch(setElections(allElections));
      // Assuming we have a logged-in user with id 1
      const userElecs = await getUserElections(1);
      dispatch(setUserElections(userElecs));
    };
    fetchElections();

    // Kiểm tra chế độ tối của hệ thống
    const isDarkMode =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);

    // Lắng nghe sự thay đổi chế độ tối
    const listener = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    window.matchMedia('(prefers-color-scheme: dark)').addListener(listener);

    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeListener(listener);
    };
  }, [dispatch]);

  const filteredElections = elections.filter((election) =>
    election.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Bell className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">Thông báo Bầu cử</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm cuộc bầu cử..."
              className="pl-10 pr-4 py-2 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <main>
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">Sắp diễn ra</TabsTrigger>
              <TabsTrigger value="ongoing">Đang diễn ra</TabsTrigger>
              <TabsTrigger value="completed">Đã hoàn thành</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {filteredElections
                .filter((e) => new Date(e.startDate) > new Date())
                .map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
            </TabsContent>

            <TabsContent value="ongoing" className="space-y-4">
              {filteredElections
                .filter((e) => {
                  const now = new Date();
                  return new Date(e.startDate) <= now && new Date(e.endDate) >= now;
                })
                .map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {filteredElections
                .filter((e) => new Date(e.endDate) < new Date())
                .map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function ElectionCard({ election }: { election: Election }) {
  const statusColors = {
    upcoming: 'bg-green-500',
    ongoing: 'bg-yellow-500',
    completed: 'bg-gray-500',
  };

  const statusText = {
    upcoming: 'Sắp diễn ra',
    ongoing: 'Đang diễn ra',
    completed: 'Đã hoàn thành',
  };

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
    <Card>
      <CardHeader>
        <CardTitle>{election.name}</CardTitle>
        <CardDescription>
          <Badge className={statusColors[status]}>{statusText[status]}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{election.description}</p>
        <div className="flex items-center mt-2">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Bắt đầu: {new Date(election.startDate).toLocaleString('vi-VN')}</span>
        </div>
        <div className="flex items-center mt-2">
          <Clock className="h-4 w-4 mr-2" />
          <span>Kết thúc: {new Date(election.endDate).toLocaleString('vi-VN')}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Chi tiết</Button>
        {status === 'upcoming' && (
          <Button>
            <Bell className="h-4 w-4 mr-2" />
            Nhắc nhở tôi
          </Button>
        )}
        {status === 'ongoing' && (
          <Button>
            <User className="h-4 w-4 mr-2" />
            Tham gia ngay
          </Button>
        )}
        {status === 'completed' && (
          <Button variant="secondary">
            <CheckCircle className="h-4 w-4 mr-2" />
            Xem kết quả
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
