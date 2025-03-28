'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  Copy,
  Download,
  Trash2,
  Pause,
  Play,
} from 'lucide-react';
import type { ThongTinCuocBauCu } from './election-dashboard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/Dialog';
import { Label } from '../../components/ui/Label';
import type { ethers } from 'ethers';

interface SystemsManagementProps {
  systems: ThongTinCuocBauCu[];
  createSystem: (description: string) => Promise<void>;
  refreshSystems: () => Promise<void>;
  isLoading: boolean;
  factoryContract: ethers.Contract | null;
}

export function SystemsManagement({
  systems,
  createSystem,
  refreshSystems,
  isLoading,
  factoryContract,
}: SystemsManagementProps) {
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateAddress, setNewTemplateAddress] = useState('');
  const [selectedTemplateType, setSelectedTemplateType] = useState<string | null>(null);

  const handleCreateSystem = async () => {
    if (!description) return;

    setIsCreating(true);
    await createSystem(description);
    setDescription('');
    setIsCreating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const saveAllAddresses = () => {
    let content = 'ĐỊA CHỈ HỆ THỐNG BẦU CỬ BLOCKCHAIN\n\n';

    systems.forEach((system, index) => {
      content += `HỆ THỐNG ${index}: ${system.moTa}\n`;
      content += `QuanLyCuocBauCu: ${system.quanLyCuocBauCu}\n`;
      content += `QuanLyPhienBauCu: ${system.quanLyPhienBauCu}\n`;
      content += `QuanLyPhieuBau: ${system.quanLyPhieuBau}\n`;
      content += `QuanLyThanhTuu: ${system.quanLyThanhTuu}\n`;
      content += `Trạng thái: ${system.dangHoatDong ? 'Đang hoạt động' : 'Không hoạt động'}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dia_chi_bau_cu.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteSystem = async (id: number) => {
    if (!factoryContract) return;
    try {
      await factoryContract.xoaCuocBauCu(id, id);
      await refreshSystems();
    } catch (error) {
      console.error('Lỗi khi xóa hệ thống:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!factoryContract || !selectedTemplateType || !newTemplateAddress) return;
    try {
      let updateFunction;
      switch (selectedTemplateType) {
        case 'QuanLyCuocBauCu':
          updateFunction = factoryContract.capNhatMauQuanLyCuocBauCu;
          break;
        case 'QuanLyPhienBauCu':
          updateFunction = factoryContract.capNhatMauQuanLyPhienBauCu;
          break;
        case 'QuanLyPhieuBau':
          updateFunction = factoryContract.capNhatMauQuanLyPhieuBau;
          break;
        case 'QuanLyThanhTuu':
          updateFunction = factoryContract.capNhatMauQuanLyThanhTuu;
          break;
      }
      if (updateFunction) {
        await updateFunction(newTemplateAddress);
      }
      setNewTemplateAddress('');
      setSelectedTemplateType(null);
    } catch (error) {
      console.error('Lỗi khi cập nhật mẫu:', error);
    }
  };

  const handleExecuteTemplateUpdate = async (templateType: string) => {
    if (!factoryContract) return;
    try {
      let executeFunction;
      switch (templateType) {
        case 'QuanLyCuocBauCu':
          executeFunction = factoryContract.thucThiCapNhatMauQuanLyCuocBauCu;
          break;
        case 'QuanLyPhienBauCu':
          executeFunction = factoryContract.thucThiCapNhatMauQuanLyPhienBauCu;
          break;
        case 'QuanLyPhieuBau':
          executeFunction = factoryContract.thucThiCapNhatMauQuanLyPhieuBau;
          break;
        case 'QuanLyThanhTuu':
          executeFunction = factoryContract.thucThiCapNhatMauQuanLyThanhTuu;
          break;
      }
      if (executeFunction) {
        await executeFunction();
      }
    } catch (error) {
      console.error('Lỗi khi thực thi cập nhật mẫu:', error);
    }
  };

  const handlePauseSystem = async () => {
    if (!factoryContract) return;
    try {
      await factoryContract.tamDung();
    } catch (error) {
      console.error('Lỗi khi tạm dừng hệ thống:', error);
    }
  };

  const handleResumeSystem = async () => {
    if (!factoryContract) return;
    try {
      await factoryContract.moLai();
    } catch (error) {
      console.error('Lỗi khi mở lại hệ thống:', error);
    }
  };

  const filteredSystems = systems.filter((system) =>
    system.moTa.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quản lý Hệ thống</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-medium text-[#37474F]">Thêm Hệ thống Bầu cử Mới</h3>

          <div className="space-y-2">
            <label htmlFor="system-description" className="text-sm font-medium text-[#37474F]">
              Mô tả:
            </label>
            <div className="flex space-x-2">
              <Input
                id="system-description"
                placeholder="Nhập mô tả hệ thống (ví dụ: Bầu cử 2025)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCreateSystem}
                disabled={isCreating || !description}
                className="bg-[#0288D1] hover:bg-[#01579B]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo
                  </>
                ) : (
                  'Tạo Hệ thống'
                )}
              </Button>
            </div>

            <div className="flex items-center text-sm mt-2">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#FFB300]" />
                  <span className="text-[#37474F]">Đang tạo hệ thống (quy trình 2 bước)...</span>
                </>
              ) : description ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-[#4CAF50]" />
                  <span className="text-[#37474F]">Sẵn sàng tạo</span>
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 text-[#CFD8DC]" />
                  <span className="text-[#37474F]">Nhập mô tả hệ thống</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#ECEFF1]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-[#37474F]">Hệ thống Đã Triển khai</h3>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseSystem}
                className="text-[#F44336]"
              >
                <Pause className="mr-2 h-4 w-4" />
                Tạm dừng
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResumeSystem}
                className="text-[#4CAF50]"
              >
                <Play className="mr-2 h-4 w-4" />
                Mở lại
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSystems}
                disabled={isLoading}
                className="text-[#0288D1]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Làm mới
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex space-x-2 mb-4">
            <Input
              placeholder="Tìm kiếm theo mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader className="bg-[#F5F7FA]">
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead className="w-[200px]">Mô tả</TableHead>
                  <TableHead>Địa chỉ Proxy</TableHead>
                  <TableHead className="w-[80px]">Trạng thái</TableHead>
                  <TableHead className="w-[100px]">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSystems.length > 0 ? (
                  filteredSystems.map((system, index) => (
                    <TableRow key={index} className="hover:bg-[#FAFAFA]">
                      <TableCell className="font-medium">{index}</TableCell>
                      <TableCell>{system.moTa}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">QuanLyCuocBauCu:</span>
                            <div className="flex items-center">
                              <span className="text-sm">
                                {system.quanLyCuocBauCu.substring(0, 6)}...
                                {system.quanLyCuocBauCu.substring(38)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(system.quanLyCuocBauCu)}
                                className="h-6 w-6 ml-1"
                              >
                                <Copy className="h-3 w-3" />
                                <span className="sr-only">Sao chép</span>
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">QuanLyPhienBauCu:</span>
                            <div className="flex items-center">
                              <span className="text-sm">
                                {system.quanLyPhienBauCu.substring(0, 6)}...
                                {system.quanLyPhienBauCu.substring(38)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(system.quanLyPhienBauCu)}
                                className="h-6 w-6 ml-1"
                              >
                                <Copy className="h-3 w-3" />
                                <span className="sr-only">Sao chép</span>
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">QuanLyPhieuBau:</span>
                            <div className="flex items-center">
                              <span className="text-sm">
                                {system.quanLyPhieuBau.substring(0, 6)}...
                                {system.quanLyPhieuBau.substring(38)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(system.quanLyPhieuBau)}
                                className="h-6 w-6 ml-1"
                              >
                                <Copy className="h-3 w-3" />
                                <span className="sr-only">Sao chép</span>
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">QuanLyThanhTuu:</span>
                            <div className="flex items-center">
                              <span className="text-sm">
                                {system.quanLyThanhTuu.substring(0, 6)}...
                                {system.quanLyThanhTuu.substring(38)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(system.quanLyThanhTuu)}
                                className="h-6 w-6 ml-1"
                              >
                                <Copy className="h-3 w-3" />
                                <span className="sr-only">Sao chép</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`w-3 h-3 rounded-full ${system.dangHoatDong ? 'bg-[#4CAF50]' : 'bg-[#F44336]'}`}
                        ></div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSystem(index)}
                          className="text-[#F44336]"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Xóa</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      {searchTerm ? 'Không tìm thấy hệ thống phù hợp' : 'Không có hệ thống nào'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {systems.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={saveAllAddresses}
                className="text-[#37474F] hover:text-[#0288D1]"
              >
                <Download className="mr-2 h-4 w-4" />
                Lưu Tất cả Địa chỉ
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-[#ECEFF1]">
          <h3 className="text-base font-medium text-[#37474F]">Cập nhật Mẫu</h3>
          <div className="flex space-x-2">
            <Input
              placeholder="Địa chỉ mẫu mới"
              value={newTemplateAddress}
              onChange={(e) => setNewTemplateAddress(e.target.value)}
              className="flex-1"
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Chọn Loại Mẫu</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Chọn Loại Mẫu để Cập nhật</DialogTitle>
                  <DialogDescription>Chọn loại mẫu bạn muốn cập nhật.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="templateType" className="text-right">
                      Loại Mẫu
                    </Label>
                    <select
                      id="templateType"
                      className="col-span-3"
                      value={selectedTemplateType || ''}
                      onChange={(e) => setSelectedTemplateType(e.target.value)}
                    >
                      <option value="">Chọn loại mẫu</option>
                      <option value="QuanLyCuocBauCu">Quản Lý Cuộc Bầu Cử</option>
                      <option value="QuanLyPhienBauCu">Quản Lý Phiên Bầu Cử</option>
                      <option value="QuanLyPhieuBau">Quản Lý Phiếu Bầu</option>
                      <option value="QuanLyThanhTuu">Quản Lý Thành Tựu</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleUpdateTemplate}>
                    Cập nhật Mẫu
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            <Button onClick={() => handleExecuteTemplateUpdate('QuanLyCuocBauCu')}>
              Thực thi Cập nhật Mẫu Quản Lý Cuộc Bầu Cử
            </Button>
            <Button onClick={() => handleExecuteTemplateUpdate('QuanLyPhienBauCu')}>
              Thực thi Cập nhật Mẫu Quản Lý Phiên Bầu Cử
            </Button>
            <Button onClick={() => handleExecuteTemplateUpdate('QuanLyPhieuBau')}>
              Thực thi Cập nhật Mẫu Quản Lý Phiếu Bầu
            </Button>
            <Button onClick={() => handleExecuteTemplateUpdate('QuanLyThanhTuu')}>
              Thực thi Cập nhật Mẫu Quản Lý Thành Tựu
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
