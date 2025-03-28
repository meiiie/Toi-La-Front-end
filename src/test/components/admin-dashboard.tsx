'use client';

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useWeb3 } from './web3-context';
import Header from './headerAdmin';
import ElectionSelection from './election-selection';
import ElectionStart from './election-start';
import NotificationSection from './notification-section';
import ElectionStatus from './election-status';
import Footer from './footerAdmin';

interface Notification {
  message: string;
  timestamp: Date;
  target: 'election' | 'session';
  sessionId?: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { account, isConnected } = useWeb3();
  const [electionId, setElectionId] = useState<string>('');
  const [electionInfo, setElectionInfo] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  // Kết nối WebSocket để lắng nghe sự kiện blockchain
  useEffect(() => {
    if (isConnected) {
      const ws = new WebSocket('wss://geth.holihu.online/ws');

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Đăng ký lắng nghe sự kiện
        const subscribeMsg = {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_subscribe',
          params: [
            'logs',
            {
              topics: [
                // CuocBauCuDaBatDau event signature
                '0x1a2c2a2bbbf9d6191dda0e341c8f9b830c2a970c9b64f73b9927346c2e9d2a39',
                // PhienBauCuDaBatDau event signature
                '0x4b5dc5c76c2890d2d518c267c6c4bfcf6b63f42c1948fd9bd6cb5b5361c31f5a',
                // NotificationSent event signature (giả định)
                '0x5b5dc5c76c2890d2d518c267c6c4bfcf6b63f42c1948fd9bd6cb5b5361c31f5b',
              ],
            },
          ],
        };
        ws.send(JSON.stringify(subscribeMsg));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.params && data.params.result) {
          // Xử lý sự kiện từ blockchain
          refreshElectionData();

          // Xử lý sự kiện thông báo (giả định)
          if (
            data.params.result.topics[0] ===
            '0x5b5dc5c76c2890d2d518c267c6c4bfcf6b63f42c1948fd9bd6cb5b5361c31f5b'
          ) {
            const notification = decodeNotificationEvent(data.params.result);
            if (notification) {
              setLatestNotification(notification);
            }
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'Lỗi kết nối WebSocket',
          description: 'Không thể lắng nghe sự kiện blockchain',
          variant: 'destructive',
        });
      };

      setWsConnection(ws);

      return () => {
        ws.close();
      };
    }
  }, [isConnected, toast]);

  // Giả lập giải mã sự kiện thông báo
  const decodeNotificationEvent = (event: any): Notification | null => {
    try {
      // Trong thực tế, giải mã data từ event
      return {
        message: 'Phiên bầu cử sẽ bắt đầu trong 10 phút nữa...',
        timestamp: new Date(),
        target: 'election',
      };
    } catch (error) {
      console.error('Error decoding notification event:', error);
      return null;
    }
  };

  // Làm mới dữ liệu cuộc bầu cử
  const refreshElectionData = async () => {
    if (electionId && isConnected) {
      try {
        setLoading(true);
        // Gọi hàm lấy thông tin cuộc bầu cử từ smart contract
        const info = await fetchElectionInfo(electionId);
        setElectionInfo(info);

        // Lấy danh sách phiên bầu cử
        const sessionsList = await fetchElectionSessions(electionId);
        setSessions(sessionsList);
      } catch (error) {
        console.error('Error refreshing election data:', error);
        toast({
          title: 'Lỗi cập nhật dữ liệu',
          description: 'Không thể lấy thông tin cuộc bầu cử',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Hàm giả lập lấy thông tin cuộc bầu cử (sẽ thay thế bằng gọi smart contract thực tế)
  const fetchElectionInfo = async (id: string) => {
    // Trong thực tế, gọi hàm layThongTinCuocBauCu từ smart contract
    return {
      id,
      name: `Bầu Cử ${id}`,
      owner: account,
      isActive: false,
      startTime: null,
      endTime: null,
    };
  };

  // Hàm giả lập lấy danh sách phiên bầu cử (sẽ thay thế bằng gọi smart contract thực tế)
  const fetchElectionSessions = async (electionId: string) => {
    // Trong thực tế, gọi hàm danhSachPhienBauCu từ smart contract
    return [
      { id: '1', status: 'pending', startTime: null, endTime: null },
      { id: '2', status: 'pending', startTime: null, endTime: null },
    ];
  };

  // Xử lý khi chọn cuộc bầu cử
  const handleElectionSelect = async (id: string) => {
    setElectionId(id);
    await refreshElectionData();
  };

  // Xử lý khi bắt đầu cuộc bầu cử
  const handleStartElection = async (duration: number, unit: string) => {
    if (!isConnected || !electionId) return;

    try {
      setLoading(true);
      toast({
        title: 'Đang bắt đầu cuộc bầu cử',
        description: 'Vui lòng xác nhận giao dịch trong ví MetaMask',
      });

      // Trong thực tế, gọi hàm batDauCuocBauCu từ smart contract
      // await contract.methods.batDauCuocBauCu(electionId, durationInSeconds).send({ from: account });

      // Giả lập thành công
      setTimeout(() => {
        setElectionInfo({
          ...electionInfo,
          isActive: true,
          startTime: new Date(),
          endTime: new Date(Date.now() + duration * getTimeMultiplier(unit)),
        });

        toast({
          title: 'Thành công',
          description: 'Cuộc bầu cử đã được bắt đầu',
        });
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error starting election:', error);
      toast({
        title: 'Lỗi bắt đầu cuộc bầu cử',
        description: 'Vui lòng thử lại sau',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Xử lý khi bắt đầu phiên bầu cử
  const handleStartSession = async (sessionId: string, duration: number, unit: string) => {
    if (!isConnected || !electionInfo?.isActive) return;

    try {
      setLoading(true);
      toast({
        title: 'Đang bắt đầu phiên bầu cử',
        description: `Phiên #${sessionId} - Vui lòng xác nhận giao dịch`,
      });

      // Trong thực tế, gọi hàm batDauPhienBauCu từ smart contract
      // await contract.methods.batDauPhienBauCu(sessionId, durationInSeconds).send({ from: account });

      // Giả lập thành công
      setTimeout(() => {
        const updatedSessions = sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status: 'active',
                startTime: new Date(),
                endTime: new Date(Date.now() + duration * getTimeMultiplier(unit)),
              }
            : session,
        );

        setSessions(updatedSessions);
        toast({
          title: 'Thành công',
          description: `Phiên bầu cử #${sessionId} đã được bắt đầu`,
        });
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Lỗi bắt đầu phiên bầu cử',
        description: 'Vui lòng thử lại sau',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Xử lý khi bắt đầu tất cả phiên bầu cử
  const handleStartAllSessions = async (duration: number, unit: string) => {
    if (!isConnected || !electionInfo?.isActive) return;

    try {
      setLoading(true);
      toast({
        title: 'Đang bắt đầu tất cả phiên bầu cử',
        description: 'Vui lòng xác nhận các giao dịch',
      });

      // Trong thực tế, gọi hàm batDauPhienBauCu cho từng phiên

      // Giả lập thành công
      setTimeout(() => {
        const updatedSessions = sessions.map((session) => ({
          ...session,
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + duration * getTimeMultiplier(unit)),
        }));

        setSessions(updatedSessions);
        toast({
          title: 'Thành công',
          description: 'Tất cả phiên bầu cử đã được bắt đầu',
        });
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error starting all sessions:', error);
      toast({
        title: 'Lỗi bắt đầu phiên bầu cử',
        description: 'Vui lòng thử lại sau',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Hàm chuyển đổi đơn vị thời gian sang milliseconds
  const getTimeMultiplier = (unit: string): number => {
    switch (unit) {
      case 'minutes':
        return 60 * 1000;
      case 'hours':
        return 60 * 60 * 1000;
      case 'days':
        return 24 * 60 * 60 * 1000;
      default:
        return 60 * 1000;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ElectionSelection
              onSelect={handleElectionSelect}
              electionInfo={electionInfo}
              loading={loading}
            />

            <ElectionStart
              electionInfo={electionInfo}
              sessions={sessions}
              onStartElection={handleStartElection}
              onStartSession={handleStartSession}
              onStartAllSessions={handleStartAllSessions}
              loading={loading}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <NotificationSection
              electionInfo={electionInfo}
              sessions={sessions}
              loading={loading}
            />

            <ElectionStatus
              electionInfo={electionInfo}
              sessions={sessions}
              latestNotification={latestNotification || undefined}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
