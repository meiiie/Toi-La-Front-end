import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Award,
  Clock,
  BarChart,
  ChevronRight,
  Mail,
  Bell,
  RefreshCw,
  CheckCircle,
  Vote,
  Shield,
  Megaphone,
  Share2,
  Database,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { Separator } from '../../components/ui/Separator';
import { Switch } from '../../components/ui/Switch';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import ParticleBackground from '../../components/backgrounds/ParticleBackground';

interface ElectionResultsWaitingProps {
  phienBauCu: any;
  cuocBauCu: any;
  endTime?: Date; // Thời gian kết thúc/công bố kết quả
  userVoteInfo?: {
    hasVoted: boolean;
    ballotId?: number;
    candidateVoted?: string;
  };
  votingStats?: {
    totalVoters: number;
    totalVoted: number;
    participationPercentage: number;
  };
  onSubscribeNotification?: () => void;
}

const ElectionResultsWaiting: React.FC<ElectionResultsWaitingProps> = ({
  phienBauCu,
  cuocBauCu,
  endTime = new Date(Date.now() + 86400000), // Mặc định 24 giờ từ bây giờ
  userVoteInfo = { hasVoted: true, ballotId: 12345, candidateVoted: 'Nguyễn Văn A' },
  votingStats = { totalVoters: 120, totalVoted: 78, participationPercentage: 65 },
  onSubscribeNotification = () => console.log('Subscribed to notifications'),
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(false);
  const [emailNotification, setEmailNotification] = useState<string>('');
  const [animateGraph, setAnimateGraph] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Xác định dark mode
  useEffect(() => {
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  }, []);

  // Tính toán thời gian còn lại
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const difference = endTime.getTime() - new Date().getTime();

      if (difference <= 0) {
        // Đã đến hoặc qua thời gian kết thúc
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  // Animation cho biểu đồ
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateGraph(true);
      setTimeout(() => setAnimateGraph(false), 2000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Xử lý đăng ký nhận thông báo
  const handleNotificationSubscribe = () => {
    if (emailNotification.trim() !== '') {
      onSubscribeNotification();
      setNotifyEnabled(true);
      // Show success message or toast here
    }
  };

  // Component con cho số đếm ngược
  const CountdownDigit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <motion.div
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg"
        >
          {value < 10 ? `0${value}` : value}
        </motion.div>
        <motion.div
          animate={{
            opacity: [0, 1, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 1, repeat: 0 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-500/30"
          style={{ display: value === 0 ? 'none' : 'block' }}
        />
      </div>
      <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">{label}</span>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Particle Background */}
      <ParticleBackground isDarkMode={isDarkMode} />

      <div className="container mx-auto p-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6"
          >
            <Award className="h-10 w-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            Đang chờ kết quả phiên bầu cử
          </motion.h1>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            Phiên bầu cử đang diễn ra. Kết quả sẽ được công bố sau khi phiên bầu cử kết thúc.
          </motion.p>
        </div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                <Clock className="h-5 w-5 text-blue-500 mr-2" />
                Thời gian đến khi công bố kết quả
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-8 pb-6">
              {/* Countdown display */}
              <div className="flex space-x-4 mb-6">
                <CountdownDigit value={timeRemaining.days} label="Ngày" />
                <span className="text-3xl font-bold text-gray-400 dark:text-gray-500 self-center">
                  :
                </span>
                <CountdownDigit value={timeRemaining.hours} label="Giờ" />
                <span className="text-3xl font-bold text-gray-400 dark:text-gray-500 self-center">
                  :
                </span>
                <CountdownDigit value={timeRemaining.minutes} label="Phút" />
                <span className="text-3xl font-bold text-gray-400 dark:text-gray-500 self-center">
                  :
                </span>
                <CountdownDigit value={timeRemaining.seconds} label="Giây" />
              </div>

              {/* Thông báo khi nào có kết quả */}
              <div className="w-full max-w-md">
                <div className="flex items-center mb-4">
                  <Bell className="h-5 w-5 text-purple-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nhận thông báo khi có kết quả
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type="email"
                      placeholder="Email của bạn"
                      value={emailNotification}
                      onChange={(e) => setEmailNotification(e.target.value)}
                      className="w-full pl-10"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <Button
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md"
                    onClick={handleNotificationSubscribe}
                    disabled={notifyEnabled}
                  >
                    {notifyEnabled ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Đã đăng ký
                      </>
                    ) : (
                      <>
                        <Bell className="mr-2 h-4 w-4" />
                        Thông báo cho tôi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Thông tin bầu cử và thống kê */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Thông tin phiên bầu cử */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg h-full">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  Thông tin phiên bầu cử
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tên phiên:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {phienBauCu?.tenPhienBauCu || 'Phiên bầu cử chính thức'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Thời gian:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {phienBauCu?.ngayBatDau &&
                        new Date(phienBauCu.ngayBatDau).toLocaleDateString('vi-VN')}{' '}
                      -
                      {phienBauCu?.ngayKetThuc &&
                        new Date(phienBauCu.ngayKetThuc).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Cuộc bầu cử:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {cuocBauCu?.tenCuocBauCu || 'Cuộc bầu cử trực tuyến'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Trạng thái:</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      Đang diễn ra
                    </Badge>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">ID Blockchain:</span>
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                      {phienBauCu?.blockchainId || '0x123...789'}
                    </span>
                  </div>
                </div>

                <Alert className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
                    Tất cả thông tin phiếu bầu đã được mã hóa và lưu trữ an toàn trên blockchain.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>

          {/* Thống kê tham gia */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg h-full">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                  <BarChart className="h-5 w-5 text-purple-500 mr-2" />
                  Thống kê tham gia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Tổng số cử tri:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {votingStats.totalVoters}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Đã bỏ phiếu:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {votingStats.totalVoted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Tỷ lệ tham gia:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {votingStats.participationPercentage}%
                    </span>
                  </div>

                  <div className="relative">
                    <motion.div
                      animate={
                        animateGraph
                          ? {
                              pathLength: [0, 1],
                              opacity: [0.2, 1],
                            }
                          : {}
                      }
                      transition={{ duration: 2, ease: 'easeInOut' }}
                    >
                      <Progress
                        value={votingStats.participationPercentage}
                        className="h-2.5 bg-gray-100 dark:bg-gray-700"
                      />
                    </motion.div>

                    {/* Animated sparkle on the graph */}
                    {animateGraph && (
                      <motion.div
                        initial={{ left: '0%', opacity: 0 }}
                        animate={{
                          left: `${votingStats.participationPercentage}%`,
                          opacity: [0, 1, 0],
                          scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                        className="absolute top-0 -mt-1"
                      >
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 p-3 rounded-lg">
                  <div className="mb-2 flex items-center">
                    <RefreshCw className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1.5" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Cập nhật liên tục
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-ping" />
                      Trực tiếp
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Cập nhật 1 phút trước
                    </Badge>
                  </div>
                </div>

                <Alert className="bg-purple-50/70 dark:bg-purple-900/20 border border-purple-100/50 dark:border-purple-800/30 backdrop-blur-sm">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <AlertDescription className="text-xs text-purple-700 dark:text-purple-400">
                    Số liệu được cập nhật từ blockchain và hệ thống theo thời gian thực.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>

          {/* Thông tin phiếu bầu của bạn */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg h-full">
              <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                  <Vote className="h-5 w-5 text-green-500 mr-2" />
                  Thông tin phiếu bầu của bạn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {userVoteInfo.hasVoted ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Trạng thái:</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Đã bỏ phiếu
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Mã phiếu bầu:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                        #{userVoteInfo.ballotId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Đã bầu cho:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {userVoteInfo.candidateVoted}
                      </span>
                    </div>

                    <div className="py-2">
                      <div className="w-full h-16 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 flex items-center justify-center border border-green-100 dark:border-green-800/50">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Phiếu bầu đã được xác nhận
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    {/* Thời điểm bỏ phiếu */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Thời điểm bỏ phiếu:
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {new Date().toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <Alert className="bg-green-50/70 dark:bg-green-900/20 border border-green-100/50 dark:border-green-800/30 backdrop-blur-sm">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-xs text-green-700 dark:text-green-400">
                        Phiếu bầu của bạn đã được mã hóa và lưu trữ an toàn. Kết quả sẽ được công bố
                        sau khi phiên bầu cử kết thúc.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mb-3">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                        Bạn chưa bỏ phiếu
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Hãy bỏ phiếu trước khi phiên bầu cử kết thúc
                      </p>
                      <Button className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white">
                        Bỏ phiếu ngay
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Nút tương tác */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-2">
          <Button
            variant="outline"
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md"
          >
            <Megaphone className="mr-2 h-4 w-4" />
            Xem thông báo từ ban tổ chức
          </Button>

          <Button
            variant="outline"
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Chia sẻ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ElectionResultsWaiting;
