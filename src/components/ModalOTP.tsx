import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/InputOTP';
import { Button } from '../components/ui/Button';
import { X, ArrowRight, Mail } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  email: string;
  onResend: () => void;
  error: string | null;
}

const maskEmail = (email: string | undefined) => {
  if (!email) return 'Email không hợp lệ';
  const [localPart, domain] = email.split('@');
  return `${localPart[0]}${localPart[1]}***@***${domain.slice(-1)}`;
};

const ModalOTP: React.FC<ModalProps> = ({ isOpen, onClose, onVerify, email, onResend, error }) => {
  const [otp, setOtp] = useState<string>('');
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  useEffect(() => {
    if (!isOpen) {
      setOtp('');
      setTimer(30);
    }
  }, [isOpen]);

  const handleVerify = useCallback(() => {
    if (otp.length === 6) {
      onVerify(otp);
    }
  }, [otp, onVerify]);

  const handleResend = useCallback(() => {
    setTimer(30);
    setOtp('');
    onResend();
  }, [onResend]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl relative max-w-md w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="text-center mb-6">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 inline-block mb-4">
            <Mail size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold mb-2 dark:text-white">Xác thực OTP</h3>
          <p className="text-gray-600 dark:text-gray-300">Chúng tôi đã gửi mã OTP đến email</p>
          <p className="text-gray-600 dark:text-gray-300">
            ( mã OTP sẽ có hiệu lực trong 15 phút )
          </p>
          <p className="font-medium text-gray-800 dark:text-gray-200">{maskEmail(email)}</p>
        </div>
        <InputOTP value={otp} onChange={setOtp} maxLength={6} className="mb-6">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        {error && <p className="text-red-500 ml-7 mt-2">Mã OTP không hợp lệ.</p>}
        <Button onClick={handleVerify} className="w-full mb-4 mt-4" disabled={otp.length !== 6}>
          Xác nhận
          <ArrowRight className="ml-2" size={18} />
        </Button>
        <div className="text-center">
          {timer > 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Gửi lại mã sau {timer} giây</p>
          ) : (
            <Button
              variant="link"
              onClick={handleResend}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Gửi lại mã OTP
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default React.memo(ModalOTP);
