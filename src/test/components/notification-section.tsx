'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import { useToast } from './use-toast';
import { useWeb3 } from './web3-context';

interface NotificationSectionProps {
  electionInfo: any;
  sessions: any[];
  loading: boolean;
}

export default function NotificationSection({
  electionInfo,
  sessions,
  loading,
}: NotificationSectionProps) {
  const [target, setTarget] = useState<string>('election');
  const [message, setMessage] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  const { toast } = useToast();
  const { account, isConnected } = useWeb3();

  const handleSendNotification = async () => {
    if (!isConnected || !message.trim()) return;

    try {
      setSending(true);
      toast({
        title: 'Đang gửi thông báo',
        description: 'Vui lòng xác nhận giao dịch trong ví MetaMask',
      });

      // Trong thực tế, gọi hàm sendNotification từ smart contract
      // if (target === "election") {
      //   await contract.methods.sendNotification(electionInfo.id, message).send({ from: account });
      // } else {
      //   await contract.methods.sendSessionNotification(selectedSession, message).send({ from: account });
      // }

      // Giả lập thành công
      setTimeout(() => {
        toast({
          title: 'Thành công',
          description: 'Thông báo đã được gửi',
          variant: 'success',
        });
        setMessage('');
        setSending(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Lỗi gửi thông báo',
        description: 'Vui lòng thử lại sau',
        variant: 'destructive',
      });
      setSending(false);
    }
  };

  if (!electionInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gửi Thông Báo</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Vui lòng chọn cuộc bầu cử trước</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gửi Thông Báo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Đối tượng nhận thông báo</label>

          <Select
            value={target}
            onValueChange={(value) => {
              setTarget(value);
              setSelectedSession('');
            }}
            disabled={loading || sending}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn đối tượng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="election">Toàn bộ cuộc bầu cử</SelectItem>
              <SelectItem value="session">Phiên bầu cử cụ thể</SelectItem>
            </SelectContent>
          </Select>

          {target === 'session' && sessions?.length > 0 && (
            <Select
              value={selectedSession}
              onValueChange={setSelectedSession}
              disabled={loading || sending}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn phiên bầu cử" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    Phiên #{session.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Nội dung thông báo</label>

          <Textarea
            placeholder="Nhập nội dung thông báo..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading || sending}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleSendNotification}
            disabled={
              loading || sending || !message.trim() || (target === 'session' && !selectedSession)
            }
            className="w-full"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Gửi Thông Báo
          </Button>

          <div className="flex items-center text-sm text-gray-500">
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                <span>Đang gửi thông báo...</span>
              </>
            ) : message.trim() ? (
              <>
                <Clock className="h-4 w-4 mr-1" />
                <span>Sẵn sàng gửi</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Nhập nội dung thông báo</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
