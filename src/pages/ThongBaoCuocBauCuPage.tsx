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
import { CuocBauCu } from '../store/types';
import { RootState } from '../store/store';
import { Helmet, HelmetProvider } from 'react-helmet-async';

export default function ElectionNotifications() {
  const dispatch = useDispatch();
  const elections = useSelector((state: RootState) => state.cuocBauCu.cacCuocBauCu);
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    //dispatch(fetchCacCuocBauCu());

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
    election.tenCuocBauCu?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <HelmetProvider>
      <Helmet>
        <title>Thông Báo Cuộc Bầu Cử | Nền Tảng Bầu Cử Blockchain</title>
        <meta
          name="description"
          content="Trang thông báo các cuộc bầu cử trên nền tảng bầu cử blockchain."
        />
        <meta name="keywords" content="Thông báo, Cuộc bầu cử, Blockchain, Bầu cử" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="canonical" href="http://example.com/thong-bao-cuoc-bau-cu" />
        <meta property="og:title" content="Thông Báo Cuộc Bầu Cử - Nền Tảng Bầu Cử Blockchain" />
        <meta
          property="og:description"
          content="Trang thông báo các cuộc bầu cử trên nền tảng bầu cử blockchain."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="http://example.com/thong-bao-cuoc-bau-cu" />
        <meta property="og:image" content="http://example.com/logo.png" />
      </Helmet>
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
                  .filter((e) => new Date(e.ngayBatDau) > new Date())
                  .map((election) => (
                    <ElectionCard key={election.id} election={election} />
                  ))}
              </TabsContent>

              <TabsContent value="ongoing" className="space-y-4">
                {filteredElections
                  .filter((e) => {
                    const now = new Date();
                    return new Date(e.ngayBatDau) <= now && new Date(e.ngayKetThuc) >= now;
                  })
                  .map((election) => (
                    <ElectionCard key={election.id} election={election} />
                  ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {filteredElections
                  .filter((e) => new Date(e.ngayKetThuc) < new Date())
                  .map((election) => (
                    <ElectionCard key={election.id} election={election} />
                  ))}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </HelmetProvider>
  );
}

function ElectionCard({ election }: { election: CuocBauCu }) {
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

  const getStatus = (ngayBatDau: Date, ngayKetThuc: Date) => {
    const now = new Date();
    if (now < ngayBatDau) return 'upcoming';
    if (now > ngayKetThuc) return 'completed';
    return 'ongoing';
  };

  const status = getStatus(new Date(election.ngayBatDau), new Date(election.ngayKetThuc));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{election.tenCuocBauCu}</CardTitle>
        <CardDescription>
          <Badge className={statusColors[status]}>{statusText[status]}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{election.moTa}</p>
        <div className="flex items-center mt-2">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Bắt đầu: {new Date(election.ngayBatDau).toLocaleString('vi-VN')}</span>
        </div>
        <div className="flex items-center mt-2">
          <Clock className="h-4 w-4 mr-2" />
          <span>Kết thúc: {new Date(election.ngayKetThuc).toLocaleString('vi-VN')}</span>
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
