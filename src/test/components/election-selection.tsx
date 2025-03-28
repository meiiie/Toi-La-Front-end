'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Copy, CheckCircle, Clock } from 'lucide-react';
import { shortenAddress } from './utils';
import { useToast } from './use-toast';

interface ElectionSelectionProps {
  onSelect: (id: string) => void;
  electionInfo: any;
  loading: boolean;
}

export default function ElectionSelection({
  onSelect,
  electionInfo,
  loading,
}: ElectionSelectionProps) {
  const [inputId, setInputId] = useState<string>('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputId.trim()) {
      onSelect(inputId.trim());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: 'Địa chỉ đã được sao chép vào clipboard',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chọn Cuộc Bầu Cử</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Nhập ID cuộc bầu cử"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              className="max-w-[200px]"
            />
            <Button type="submit" disabled={loading || !inputId.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tải Thông Tin
            </Button>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {loading
                ? 'Đang tải...'
                : electionInfo
                  ? 'Đã tải thông tin cuộc bầu cử'
                  : 'Nhập ID cuộc bầu cử để bắt đầu'}
            </span>
          </div>
        </form>

        {electionInfo && (
          <div className="pt-2 space-y-2 border-t border-gray-100">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{electionInfo.name}</h3>
            </div>

            <div className="flex items-center space-x-1">
              {electionInfo.isActive ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">
                Trạng thái: {electionInfo.isActive ? 'Đang hoạt động' : 'Chưa bắt đầu'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Chủ sở hữu: {shortenAddress(electionInfo.owner)}
              </span>
              <button
                onClick={() => copyToClipboard(electionInfo.owner)}
                className="text-primary hover:text-primary/80"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Số phiên bầu cử: {electionInfo.sessions?.length || 0}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
