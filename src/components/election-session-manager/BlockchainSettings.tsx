'use client';

import type React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Cpu,
  Key,
  Wallet,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader,
} from 'lucide-react';

interface BlockchainSettingsProps {
  sessionKey: any;
  walletInfo: any;
  getSessionKey: () => Promise<any>;
  isLoading: boolean;
  toast: any;
}

const BlockchainSettings: React.FC<BlockchainSettingsProps> = ({
  sessionKey,
  walletInfo,
  getSessionKey,
  isLoading,
  toast,
}) => {
  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-blue-500 dark:border-blue-600 bg-gradient-to-br from-white to-blue-50 dark:from-[#162A45]/90 dark:to-[#1A2B48]/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
            <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Cài Đặt Blockchain
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Quản lý khóa phiên và thông tin blockchain cho phiên bầu cử
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Session Key Info */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-blue-100 dark:border-[#2A3A5A]/70">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Thông Tin Khóa Phiên
              </h3>

              {sessionKey ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </h4>
                    <div className="flex items-center mt-1">
                      {sessionKey.expiresAt * 1000 > Date.now() ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Còn hiệu lực
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Hết hạn
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A]/50">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                        Địa Chỉ Ví Thông Minh (SCW)
                      </p>
                      <div className="flex items-center">
                        <p className="font-mono text-sm truncate text-gray-800 dark:text-gray-200">
                          {sessionKey.scwAddress}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#243656]"
                          onClick={() => {
                            navigator.clipboard.writeText(sessionKey.scwAddress);
                            toast({
                              title: 'Đã sao chép',
                              description: 'Địa chỉ ví đã được sao chép vào clipboard',
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A]/50">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                        Thời Hạn Sử Dụng
                      </p>
                      <p className="text-gray-800 dark:text-gray-200 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                        {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                        <span className="ml-2 text-sm text-emerald-600 dark:text-emerald-400">
                          (Còn{' '}
                          {Math.floor(
                            (sessionKey.expiresAt * 1000 - Date.now()) / (1000 * 60 * 60),
                          )}{' '}
                          giờ)
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center mt-2">
                    <Button
                      onClick={getSessionKey}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                    >
                      {isLoading ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Làm Mới Khóa Phiên
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="bg-blue-500/10 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-full p-3 inline-flex mb-4">
                    <Key className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Chưa có khóa phiên
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Bạn cần tạo khóa phiên để thực hiện các giao dịch trên blockchain
                  </p>
                  <Button
                    onClick={getSessionKey}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  >
                    {isLoading ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="mr-2 h-4 w-4" />
                    )}
                    Lấy Khóa Phiên
                  </Button>
                </div>
              )}
            </div>

            {/* SCW Information */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-violet-100 dark:border-[#2A3A5A]/70">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-violet-600 dark:text-violet-400" />
                Thông Tin Ví Thông Minh (SCW)
              </h3>

              {walletInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-violet-100 dark:border-[#2A3A5A]/50">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Địa Chỉ Ví</p>
                      <div className="flex items-center">
                        <p className="font-mono text-sm truncate text-gray-800 dark:text-gray-200">
                          {walletInfo.diaChiVi}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#243656]"
                          onClick={() => {
                            navigator.clipboard.writeText(walletInfo.diaChiVi);
                            toast({
                              title: 'Đã sao chép',
                              description: 'Địa chỉ ví đã được sao chép vào clipboard',
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <a
                          href={`https://explorer.holihu.online/address/${walletInfo.diaChiVi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 flex items-center justify-center text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-violet-100 dark:border-[#2A3A5A]/50">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Loại Ví</p>
                      <p className="text-gray-800 dark:text-gray-200 flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-violet-600 dark:text-violet-400" />
                        {walletInfo.loaiVi === 2 ? 'Smart Contract Wallet (SCW)' : 'EOA Wallet'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-violet-100 dark:border-[#2A3A5A]/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Thông Tin Khác</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 mr-2">ID ví:</span>
                        <span className="text-gray-800 dark:text-gray-200">{walletInfo.viId}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 mr-2">Tài khoản ID:</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {walletInfo.taiKhoanId}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 mr-2">Ngày tạo:</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {new Date(walletInfo.thoiGianTao).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 mr-2">Trạng thái:</span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {walletInfo.trangThai ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Vô hiệu
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  <div className="h-4 w-48 mt-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 w-32 mt-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainSettings;
