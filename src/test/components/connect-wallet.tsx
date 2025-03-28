'use client';

import { Button } from '../../components/ui/Button';
import { useState, useEffect } from 'react';

interface ConnectWalletProps {
  isConnected: boolean;
  onConnect: () => Promise<void>;
  address: string | Promise<string>;
}

export function ConnectWallet({ isConnected, onConnect, address }: ConnectWalletProps) {
  const [displayAddress, setDisplayAddress] = useState<string>('');

  useEffect(() => {
    const getAddress = async () => {
      if (isConnected && address) {
        const resolvedAddress = await address;
        const shortAddress = `${resolvedAddress.substring(0, 6)}...${resolvedAddress.substring(resolvedAddress.length - 4)}`;
        setDisplayAddress(shortAddress);
      }
    };

    getAddress();
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <Button
        onClick={onConnect}
        className="bg-[#0288D1] hover:bg-[#01579B] text-white font-bold rounded-lg px-4 py-2"
      >
        Kết Nối Ví
      </Button>
    );
  }

  return (
    <div className="bg-white border border-[#CFD8DC] rounded-md px-3 py-1.5 text-sm text-[#37474F]">
      {displayAddress}
    </div>
  );
}
