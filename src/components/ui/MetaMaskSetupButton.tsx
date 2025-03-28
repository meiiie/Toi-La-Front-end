'use client';

import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { FaEthereum } from 'react-icons/fa';

interface MetaMaskSetupButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MetaMaskSetupButton: React.FC<MetaMaskSetupButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const { isMetaMaskInstalled, isNetworkConnected, isTokenAdded, showSetupModal } = useWeb3();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Calculate setup progress
  const getSetupProgress = () => {
    if (!isMetaMaskInstalled) return 0;
    if (!isNetworkConnected) return 1;
    if (!isTokenAdded) return 2;
    return 3; // All complete
  };

  const setupProgress = getSetupProgress();
  const isSetupComplete = setupProgress === 3;

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  // Variant classes
  const variantClasses = {
    default: isSetupComplete
      ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
      : 'bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-[0_0_15px_rgba(2,136,209,0.3)]',
    outline: isSetupComplete
      ? 'bg-transparent text-green-400 border border-green-500/30 hover:bg-green-500/10'
      : 'bg-transparent text-blue-400 border border-blue-500/30 hover:bg-blue-500/10',
    ghost: isSetupComplete
      ? 'bg-transparent text-green-400 hover:bg-green-500/10'
      : 'bg-transparent text-blue-400 hover:bg-blue-500/10',
    link: isSetupComplete
      ? 'bg-transparent text-green-400 hover:underline p-0'
      : 'bg-transparent text-blue-400 hover:underline p-0',
  };

  const handleClick = () => {
    if (isSetupComplete) {
      // Nếu đã thiết lập xong, chuyển đến trang blockchain setup
      navigate('/blockchain-setup');
    } else {
      // Nếu chưa thiết lập xong, hiển thị modal
      showSetupModal();
    }
  };

  return (
    <button
      className={`relative rounded-lg transition-all duration-300 flex items-center ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isSetupComplete ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Blockchain đã thiết lập</span>
        </>
      ) : (
        <>
          <FaEthereum className="h-4 w-4 mr-2" />
          <span>Thiết lập blockchain</span>
          {setupProgress > 0 && (
            <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/20 text-xs">
              {setupProgress}/3
            </span>
          )}
        </>
      )}

      {/* Tooltip */}
      {isHovered && !isSetupComplete && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-[#1E293B] rounded-lg border border-[#334155] shadow-lg z-50">
          <div className="text-xs text-blue-200/80 mb-2">Trạng thái thiết lập:</div>
          <div className="space-y-1.5">
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 flex-shrink-0">
                {isMetaMaskInstalled ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
              </div>
              <span className="text-xs">
                {isMetaMaskInstalled ? 'MetaMask đã cài đặt' : 'Cài đặt MetaMask'}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 flex-shrink-0">
                {isNetworkConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
              </div>
              <span className="text-xs">
                {isNetworkConnected ? 'Đã kết nối mạng HoLiHu' : 'Kết nối mạng HoLiHu'}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 flex-shrink-0">
                {isTokenAdded ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
              </div>
              <span className="text-xs">
                {isTokenAdded ? 'Đã thêm token HLU' : 'Thêm token HLU'}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#334155] flex items-center justify-between">
            <span className="text-xs text-blue-300">Nhấn để thiết lập</span>
            <ExternalLink className="h-3 w-3 text-blue-300" />
          </div>
        </div>
      )}
    </button>
  );
};

export default MetaMaskSetupButton;
