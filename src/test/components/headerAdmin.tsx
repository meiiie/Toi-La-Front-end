'use client';

import { Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useWeb3 } from './web3-context';
import { shortenAddress } from './utils';

export default function Header() {
  const { account, isConnected, connectWallet, networkName } = useWeb3();

  return (
    <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-gray-800">Admin Bầu Cử Blockchain</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`}
            ></div>
            <span className="text-sm text-gray-600">{networkName || 'Chưa kết nối'}</span>
          </div>

          {isConnected ? (
            <div className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700">
              {shortenAddress(account)}
            </div>
          ) : (
            <Button onClick={connectWallet} size="sm">
              Kết nối MetaMask
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
