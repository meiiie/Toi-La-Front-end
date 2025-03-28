import { Button } from '../../components/ui/Button';
import { Wallet } from 'lucide-react';

interface ConnectWalletProps {
  account: string;
  isAdmin: boolean;
  onConnect: () => void;
}

export default function ConnectWallet({ account, isAdmin, onConnect }: ConnectWalletProps) {
  if (!account) {
    return (
      <Button onClick={onConnect} className="flex items-center space-x-2">
        <Wallet className="w-4 h-4" />
        <span>Kết Nối MetaMask</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="px-3 py-1 text-sm bg-gray-100 border border-gray-200 rounded-md">
        {account.substring(0, 6)}...{account.substring(38)}
      </div>
      {isAdmin && (
        <div className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
          Admin
        </div>
      )}
    </div>
  );
}
