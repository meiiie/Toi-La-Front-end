interface NetworkStatusProps {
  isConnected: boolean;
  networkName: string;
}

export function NetworkStatus({ isConnected, networkName }: NetworkStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#4CAF50]' : 'bg-[#F44336]'}`}
      ></div>
      <span className="text-sm text-[#37474F]">{networkName}</span>
    </div>
  );
}
