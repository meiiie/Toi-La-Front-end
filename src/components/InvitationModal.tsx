'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from '../components/ui/Use-toast';
import QRCode from 'react-qr-code';
import { RootState, store } from '../store/store';
import { taoPhieuMoi } from '../store/slice/phieuMoiPhienBauCuSlice';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phienBauCuId: number;
}

export function InvitationModal({ isOpen, onClose, phienBauCuId }: InvitationModalProps) {
  const dispatch = useDispatch<typeof store.dispatch>();
  const [inviteLink, setInviteLink] = useState('');
  const { dangTai, loi } = useSelector((state: RootState) => state.phieuMoiPhienBauCu);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      generateInviteLink();
    }
  }, [isOpen]);

  const generateInviteLink = async () => {
    try {
      const result = await dispatch(
        taoPhieuMoi({ NguoiTaoId: 1, PhienBauCuId: phienBauCuId }),
      ).unwrap();
      const token = new URL(result).searchParams.get('invite');
      if (token) {
        setInviteLink(
          `https://localhost:3000/app/user-elections/elections/${phienBauCuId}/election-management/voter-management?invite=${token}`,
        );
      } else {
        throw new Error('Invalid invite link format');
      }
      toast({
        title: 'Thành công',
        description: 'Đã tạo mã mời thành công.',
      });
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo mã mời. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copied',
      description: 'Invite link copied to clipboard',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Voters</DialogTitle>
          <DialogDescription>
            Share this QR code or link to invite voters to the election session.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {inviteLink && (
            <>
              <QRCode value={inviteLink} size={200} />
              <Input value={inviteLink} readOnly />
              <Button onClick={copyToClipboard}>Copy Link</Button>
            </>
          )}
          {dangTai && <p>Generating invite link...</p>}
          {loi && <p className="text-red-500">{loi}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
