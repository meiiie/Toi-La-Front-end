'use client';
import { Button } from '../../components/ui/Button';
import { useWeb3 } from './web3-context-voting';
import { VoteIcon } from 'lucide-react';

export default function Header() {
  const { account, connectWallet, networkStatus } = useWeb3();

  return (
    <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <VoteIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-slate-800">Election Voting Hub</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${networkStatus ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-sm text-slate-700">POA Geth</span>
          </div>

          {!account ? (
            <Button
              onClick={connectWallet}
              className="bg-primary hover:bg-primary/90 text-white font-medium"
            >
              Connect MetaMask
            </Button>
          ) : (
            <div className="px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-700">
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
