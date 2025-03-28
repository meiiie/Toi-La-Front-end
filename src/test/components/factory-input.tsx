import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loader2, Check, AlertCircle, Copy } from 'lucide-react';

interface FactoryInputProps {
  factoryAddress: string;
  setFactoryAddress: (address: string) => void;
  loadFactory: (address: string) => Promise<void>;
  isLoading: boolean;
  isFactoryLoaded: boolean;
  systemCount: number;
  isNetworkOnline: boolean;
}

export function FactoryInput({
  factoryAddress,
  setFactoryAddress,
  loadFactory,
  isLoading,
  isFactoryLoaded,
  systemCount,
  isNetworkOnline,
}: FactoryInputProps) {
  const handleVerify = () => {
    if (factoryAddress) {
      loadFactory(factoryAddress);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(factoryAddress);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tải Factory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="factory-address" className="text-sm font-medium text-[#37474F]">
            Địa chỉ Factory:
          </label>
          <div className="flex space-x-2">
            <Input
              id="factory-address"
              placeholder="Nhập địa chỉ factory (0x939eaa58...)"
              value={factoryAddress}
              onChange={(e) => setFactoryAddress(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleVerify}
              disabled={isLoading || !factoryAddress}
              className="bg-[#0288D1] hover:bg-[#01579B]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải
                </>
              ) : (
                'Xác minh & Tải'
              )}
            </Button>
          </div>

          <div className="flex items-center text-sm mt-2">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#FFB300]" />
                <span className="text-[#37474F]">Đang xác minh factory...</span>
              </>
            ) : isFactoryLoaded ? (
              <>
                <Check className="mr-2 h-4 w-4 text-[#4CAF50]" />
                <span className="text-[#37474F]">Đã tải factory thành công</span>
              </>
            ) : factoryAddress ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 text-[#CFD8DC]" />
                <span className="text-[#37474F]">Nhập địa chỉ factory và xác minh</span>
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4 text-[#CFD8DC]" />
                <span className="text-[#37474F]">Nhập địa chỉ factory</span>
              </>
            )}
          </div>
        </div>

        {isFactoryLoaded && (
          <div className="pt-4 border-t border-[#ECEFF1] space-y-2">
            <h3 className="text-base font-medium text-[#37474F]">Thông tin Factory</h3>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#37474F]">Địa chỉ:</span>
              <div className="flex items-center">
                <span className="text-sm text-[#37474F]">
                  {factoryAddress.substring(0, 6)}...{factoryAddress.substring(38)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="h-8 w-8 ml-1"
                >
                  <Copy className="h-4 w-4 text-[#0288D1]" />
                  <span className="sr-only">Sao chép</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#37474F]">Số lượng hệ thống:</span>
              <span className="text-sm text-[#37474F]">{systemCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#37474F]">Mạng:</span>
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${isNetworkOnline ? 'bg-[#4CAF50]' : 'bg-[#F44336]'}`}
                ></div>
                <span className="text-sm text-[#37474F]">
                  POA Geth {isNetworkOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
