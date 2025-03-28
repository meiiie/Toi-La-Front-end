'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useVoting } from './voting-context';
import { useWeb3 } from './web3-context-voting';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function VotingAction() {
  const [tokenId, setTokenId] = useState('');
  const {
    selectedCandidate,
    verifyVotingRight,
    castVote,
    votingRightStatus,
    transactionStatus,
    isLoading,
  } = useVoting();
  const { account } = useWeb3();

  const getStatusIcon = () => {
    if (votingRightStatus === 'valid') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (votingRightStatus === 'invalid') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getTransactionIcon = () => {
    if (transactionStatus === 'pending') {
      return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />;
    } else if (transactionStatus === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (transactionStatus === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (votingRightStatus === 'valid') {
      return 'Phiếu hợp lệ';
    } else if (votingRightStatus === 'invalid') {
      return 'Phiếu không hợp lệ';
    } else if (votingRightStatus === 'checking') {
      return 'Đang kiểm tra...';
    }
    return 'Chưa kiểm tra';
  };

  const getTransactionText = () => {
    if (transactionStatus === 'pending') {
      return 'Đang xử lý';
    } else if (transactionStatus === 'success') {
      return 'Thành công';
    } else if (transactionStatus === 'error') {
      return 'Lỗi';
    }
    return 'Sẵn sàng';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bỏ Phiếu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700">Phiếu Bầu Của Bạn</h3>
          <div className="flex space-x-2">
            <Input
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Nhập ID token"
              className="max-w-[200px]"
            />
            <Button
              variant="outline"
              onClick={() => verifyVotingRight(tokenId)}
              disabled={!account || !tokenId || isLoading}
            >
              Kiểm Tra
            </Button>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span>Trạng thái:</span>
            {getStatusIcon()}
            <span
              className={`
              ${votingRightStatus === 'valid' ? 'text-green-600' : ''}
              ${votingRightStatus === 'invalid' ? 'text-red-600' : ''}
              ${votingRightStatus === 'checking' ? 'text-amber-600' : ''}
              ${!votingRightStatus ? 'text-slate-500' : ''}
            `}
            >
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-medium text-slate-700">Ứng Viên Đã Chọn</h3>
          {selectedCandidate ? (
            <div className="flex items-center space-x-4">
              <img
                src={
                  selectedCandidate.imageUrl ||
                  `/placeholder.svg?height=100&width=100&text=${selectedCandidate.name}`
                }
                alt={selectedCandidate.name}
                className="w-[100px] h-[100px] object-cover rounded-md border-2 border-primary"
              />
              <div>
                <p className="font-medium text-slate-800">{selectedCandidate.name}</p>
                <p className="text-sm text-slate-500">
                  {selectedCandidate.address.substring(0, 6)}...
                  {selectedCandidate.address.substring(selectedCandidate.address.length - 4)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Chưa chọn ứng viên</p>
          )}
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            disabled={!account || !selectedCandidate || votingRightStatus !== 'valid' || isLoading}
            onClick={() => castVote(tokenId, selectedCandidate?.address || '')}
          >
            Bỏ Phiếu
          </Button>
          <div className="flex items-center space-x-2 mt-2 text-sm">
            <span>Giao dịch:</span>
            {getTransactionIcon()}
            <span
              className={`
              ${transactionStatus === 'success' ? 'text-green-600' : ''}
              ${transactionStatus === 'error' ? 'text-red-600' : ''}
              ${transactionStatus === 'pending' ? 'text-amber-600' : ''}
              ${!transactionStatus ? 'text-slate-500' : ''}
            `}
            >
              {getTransactionText()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
