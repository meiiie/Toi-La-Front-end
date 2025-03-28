import { ExternalLink, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#ECEFF1] py-4 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center text-sm text-[#455A64]">
            <Info className="w-4 h-4 mr-2 text-[#0288D1]" />
            Mạng: POA Geth | Chain ID: 210
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://geth.holihu.online/rpc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#0288D1] hover:text-[#01579B] flex items-center gap-1"
            >
              RPC <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://geth.holihu.online/ws"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#0288D1] hover:text-[#01579B] flex items-center gap-1"
            >
              WebSocket <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://geth.holihu.online/explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#0288D1] hover:text-[#01579B] flex items-center gap-1"
            >
              Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="text-sm text-[#78909C]">© 2023 Blockchain Election Hub</div>
        </div>
      </div>
    </footer>
  );
}
