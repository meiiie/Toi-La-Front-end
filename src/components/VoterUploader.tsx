'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  type File,
  Check,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  Download,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Info,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Alert, AlertDescription, AlertTitle } from './ui/Alter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Progress } from './ui/Progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/Dialog';
import { ScrollArea } from './ui/Scroll-area';
import { Badge } from './ui/Badge';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Cập nhật interface để bao gồm tất cả các trường cần thiết
interface VoterData {
  sdt: string;
  email: string;
  xacMinh: string | boolean; // Có thể là 'yes'/'no' khi đọc từ file hoặc boolean khi xử lý
  boPhieu?: boolean;
  soLanGuiOTP?: number;
  phienBauCuId?: number;
  cuocBauCuId?: number;
  taiKhoanId?: number;
  vaiTroId?: number;
  hasBlockchainWallet?: boolean;
}

// Interface cho dữ liệu đã được xử lý hoàn chỉnh
interface SanitizedVoterData {
  sdt: string;
  email: string;
  xacMinh: boolean;
  boPhieu: boolean;
  soLanGuiOTP: number;
  phienBauCuId: number;
  cuocBauCuId: number;
  taiKhoanId: number;
  vaiTroId: number;
  hasBlockchainWallet: boolean;
}

interface VoterUploaderProps {
  onUploadSuccess: (voters: SanitizedVoterData[]) => void;
  phienBauCuid: number;
  taiKhoanid: number;
}

const VoterUploader: React.FC<VoterUploaderProps> = ({
  onUploadSuccess,
  phienBauCuid,
  taiKhoanid,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; type: string } | null>(
    null,
  );
  const [previewData, setPreviewData] = useState<SanitizedVoterData[] | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState('csv');
  const [progress, setProgress] = useState(0);
  const [showFullData, setShowFullData] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errors: Array<{ row: number; column: string; message: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Khởi tạo tiến trình khi bắt đầu xử lý
    if (isProcessing) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else if (progress > 0 && progress < 100) {
      // Hoàn thành tiến trình khi kết thúc xử lý
      setProgress(100);
    }
  }, [isProcessing, progress]);

  // Kiểm tra email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Kiểm tra số điện thoại Việt Nam (cấu trúc: 0xxxxxxxxx)
  const isValidVietnamPhone = (phone: string) => {
    if (!phone) return true; // Cho phép trống
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
    return phoneRegex.test(phone);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const validateData = (
    data: VoterData[],
  ): {
    isValid: boolean;
    validData: VoterData[];
    validationResults: {
      totalRecords: number;
      validRecords: number;
      invalidRecords: number;
      errors: Array<{ row: number; column: string; message: string }>;
    };
  } => {
    const validData: VoterData[] = [];
    const errors: Array<{ row: number; column: string; message: string }> = [];

    data.forEach((row, index) => {
      let isRowValid = true;

      // Kiểm tra email (bắt buộc)
      if (!row.email) {
        errors.push({
          row: index + 2, // +2 vì đếm từ 1 và tính cả hàng tiêu đề
          column: 'email',
          message: 'Email không được để trống',
        });
        isRowValid = false;
      } else if (!isValidEmail(row.email)) {
        errors.push({
          row: index + 2,
          column: 'email',
          message: `Email '${row.email}' không hợp lệ`,
        });
        isRowValid = false;
      }

      // Kiểm tra số điện thoại (nếu có)
      if (row.sdt && !isValidVietnamPhone(row.sdt)) {
        errors.push({
          row: index + 2,
          column: 'sdt',
          message: `Số điện thoại '${row.sdt}' không hợp lệ`,
        });
        isRowValid = false;
      }

      if (isRowValid) {
        validData.push(row);
      }
    });

    // Kiểm tra email trùng lặp trong tệp
    const emailCounts: Record<string, number> = {};
    validData.forEach((row) => {
      const email = row.email.toLowerCase();
      emailCounts[email] = (emailCounts[email] || 0) + 1;
    });

    // Nếu có email trùng lặp
    const duplicates = Object.entries(emailCounts)
      .filter(([_, count]) => count > 1)
      .map(([email]) => email);

    if (duplicates.length > 0) {
      duplicates.forEach((email) => {
        // Tìm các dòng có email trùng lặp
        validData.forEach((row, idx) => {
          if (row.email.toLowerCase() === email) {
            errors.push({
              row: idx + 2,
              column: 'email',
              message: `Email '${email}' bị trùng lặp trong file`,
            });
          }
        });
      });
    }

    const filteredValidData = validData.filter(
      (row) => !duplicates.includes(row.email.toLowerCase()),
    );

    return {
      isValid: errors.length === 0,
      validData: filteredValidData,
      validationResults: {
        totalRecords: data.length,
        validRecords: filteredValidData.length,
        invalidRecords: data.length - filteredValidData.length,
        errors,
      },
    };
  };

  const processCSV = (csvData: string): VoterData[] => {
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0) {
      throw new Error(`Lỗi khi phân tích CSV: ${parsed.errors[0].message}`);
    }

    // Kiểm tra các trường bắt buộc
    const headers = parsed.meta.fields || [];
    if (!headers.includes('email')) {
      throw new Error('Thiếu trường bắt buộc: email');
    }

    // Chuyển đổi dữ liệu
    return parsed.data.map((row: any) => ({
      email: row.email?.toString()?.trim() || '',
      sdt: row.sdt?.toString()?.trim() || '',
      xacMinh:
        row.xacminh?.toString()?.toLowerCase() === 'true' ||
        row.xacminh?.toString()?.toLowerCase() === 'yes' ||
        row.xacminh === '1'
          ? 'yes'
          : 'no',
    }));
  };

  const processExcel = (file: File): Promise<VoterData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error('Không thể đọc file');

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Chuyển đổi dữ liệu từ Excel sang JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Kiểm tra dữ liệu
          if (jsonData.length <= 1) {
            throw new Error('File không chứa đủ dữ liệu');
          }

          // Lấy headers (chuyển thành chữ thường)
          const headers = (jsonData[0] as any[]).map((h) => String(h).trim().toLowerCase());

          if (!headers.includes('email')) {
            throw new Error('Thiếu trường bắt buộc: email');
          }

          // Tìm vị trí của các cột
          const emailIndex = headers.indexOf('email');
          const sdtIndex = headers.indexOf('sdt');
          const xacminhIndex = headers.indexOf('xacminh');

          if (emailIndex === -1) {
            throw new Error('Không tìm thấy cột email');
          }

          // Chuyển đổi dữ liệu
          const voters: VoterData[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];

            // Bỏ qua dòng trống
            if (!row || row.length === 0) continue;

            const email = emailIndex >= 0 && row[emailIndex] ? String(row[emailIndex]).trim() : '';
            const sdt = sdtIndex >= 0 && row[sdtIndex] ? String(row[sdtIndex]).trim() : '';
            let xacMinh = 'no';

            if (xacminhIndex >= 0 && row[xacminhIndex]) {
              const xacminhValue = String(row[xacminhIndex]).toLowerCase();
              xacMinh =
                xacminhValue === 'true' || xacminhValue === 'yes' || xacminhValue === '1'
                  ? 'yes'
                  : 'no';
            }

            voters.push({ email, sdt, xacMinh });
          }

          resolve(voters);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  // Hàm mới: Chuẩn hóa dữ liệu cử tri
  const sanitizeVoterData = (voter: VoterData): SanitizedVoterData => {
    return {
      // Chuẩn hóa các trường chuỗi
      email: voter.email || '',
      sdt: voter.sdt || '',

      // Chuẩn hóa các trường boolean
      xacMinh: voter.xacMinh === true || voter.xacMinh === 'yes',
      boPhieu: !!voter.boPhieu,
      hasBlockchainWallet: !!voter.hasBlockchainWallet,

      // Chuẩn hóa các trường số
      phienBauCuId: Number(voter.phienBauCuId || phienBauCuid),
      cuocBauCuId: Number(voter.cuocBauCuId || 0),
      taiKhoanId: Number(voter.taiKhoanId || 0),
      vaiTroId: Number(voter.vaiTroId || 0),
      soLanGuiOTP: Number(voter.soLanGuiOTP || 0),
    };
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setValidationResults(null);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
    });

    try {
      let rawVoters: VoterData[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        rawVoters = processCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        rawVoters = await processExcel(file);
      } else {
        throw new Error('Định dạng file không được hỗ trợ. Vui lòng sử dụng .csv, .xlsx hoặc .xls');
      }

      // Kiểm tra và lọc dữ liệu
      const { isValid, validData, validationResults } = validateData(rawVoters);
      setValidationResults(validationResults);

      if (validData.length === 0) {
        throw new Error('Không có dữ liệu hợp lệ trong file. Vui lòng kiểm tra lại định dạng.');
      }

      // QUAN TRỌNG: Chuẩn hóa dữ liệu cử tri để tránh lỗi null/undefined
      const sanitizedVoters = validData.map((voter) => sanitizeVoterData(voter));

      // Log cho debug
      console.log('Dữ liệu cử tri sau khi chuẩn hóa:', sanitizedVoters);

      // Sử dụng dữ liệu đã chuẩn hóa
      setPreviewData(sanitizedVoters);

      if (isValid) {
        setSuccessMessage(`Đã đọc thành công ${sanitizedVoters.length} cử tri từ file.`);
      } else {
        setSuccessMessage(
          `Đã đọc ${sanitizedVoters.length}/${rawVoters.length} cử tri hợp lệ từ file. Có ${validationResults.errors.length} lỗi.`,
        );
      }
    } catch (err) {
      console.error('Lỗi khi xử lý file:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi xử lý file');
      setPreviewData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const generateTemplateCSV = () => {
    // Tạo header
    const headers = ['email', 'sdt', 'xacminh'];

    // Tạo dữ liệu mẫu
    const sampleData = [
      ['nguyenvana@example.com', '0912345678', 'no'],
      ['nguyenvanb@example.com', '0987654321', 'yes'],
      ['nguyenvanc@example.com', '0976543210', 'no'],
    ];

    // Tạo nội dung CSV
    const csvContent = [headers.join(','), ...sampleData.map((row) => row.join(','))].join('\n');

    // Tạo blob và download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_danh_sach_cu_tri.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateTemplateExcel = () => {
    // Tạo workbook mới
    const wb = XLSX.utils.book_new();

    // Tạo header và dữ liệu mẫu
    const headers = ['email', 'sdt', 'xacminh'];
    const sampleData = [
      ['nguyenvana@example.com', '0912345678', 'no'],
      ['nguyenvanb@example.com', '0987654321', 'yes'],
      ['nguyenvanc@example.com', '0976543210', 'no'],
    ];

    // Kết hợp header và dữ liệu mẫu
    const aoa = [headers, ...sampleData];

    // Tạo worksheet từ dữ liệu
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, 'CuTri');

    // Tạo blob và download
    XLSX.writeFile(wb, 'mau_danh_sach_cu_tri.xlsx');
  };

  const renderFileInfo = () => {
    if (!fileInfo) return null;

    return (
      <div className="flex items-center mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md mr-3">
          <FileText className="h-6 w-6 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800 dark:text-gray-200">{fileInfo.name}</p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span>{fileInfo.size}</span>
            <span className="mx-2">•</span>
            <Badge variant="outline" className="h-5 px-1 text-xs">
              {fileInfo.type === 'text/csv' ? 'CSV' : 'Excel'}
            </Badge>
          </div>
        </div>
        {isProcessing ? (
          <Loader2 className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-spin" />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFileInfo(null);
              setPreviewData(null);
              setSuccessMessage(null);
              setValidationResults(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderValidationSummary = () => {
    if (!validationResults) return null;

    return (
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Kết quả kiểm tra dữ liệu
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-[#1A2942]/50 p-3 rounded-lg border border-blue-100 dark:border-blue-800/20">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng số bản ghi</p>
            <p className="text-2xl font-semibold">{validationResults.totalRecords}</p>
          </div>

          <div className="bg-white dark:bg-[#1A2942]/50 p-3 rounded-lg border border-green-100 dark:border-green-800/20">
            <p className="text-sm text-gray-500 dark:text-gray-400">Hợp lệ</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {validationResults.validRecords}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1A2942]/50 p-3 rounded-lg border border-red-100 dark:border-red-800/20">
            <p className="text-sm text-gray-500 dark:text-gray-400">Không hợp lệ</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {validationResults.invalidRecords}
            </p>
          </div>
        </div>

        {validationResults.errors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Chi tiết lỗi:</p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowFullData(!showFullData)}
              >
                {showFullData ? 'Ẩn bớt' : 'Xem tất cả'}
                {showFullData ? (
                  <ChevronDown className="ml-1 h-3 w-3" />
                ) : (
                  <ChevronRight className="ml-1 h-3 w-3" />
                )}
              </Button>
            </div>

            <ScrollArea
              className={`border border-red-100 dark:border-red-800/20 rounded-lg ${showFullData ? 'h-40' : 'h-24'}`}
            >
              <div className="p-2">
                {validationResults.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 dark:text-red-400 mb-1">
                    <span className="font-medium">Dòng {error.row}:</span> {error.message}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  };

  const renderPreviewData = () => {
    if (!previewData) return null;

    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Xem trước dữ liệu
          </h3>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-300 dark:border-green-700/30"
          >
            {previewData.length} cử tri hợp lệ
          </Badge>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Email</span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    <span>Số điện thoại</span>
                  </div>
                </TableHead>
                <TableHead>Xác minh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.slice(0, 5).map((voter, index) => (
                <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{voter.email}</TableCell>
                  <TableCell>{voter.sdt || <span className="text-gray-400">—</span>}</TableCell>
                  <TableCell>
                    <Badge
                      variant={voter.xacMinh ? 'default' : 'secondary'}
                      className={
                        voter.xacMinh
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300'
                      }
                    >
                      {voter.xacMinh ? 'Có' : 'Không'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {previewData.length > 5 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Hiển thị 5/{previewData.length} cử tri...
          </p>
        )}

        <div className="mt-4">
          <Button
            onClick={() => {
              if (previewData && previewData.length > 0) {
                // Kiểm tra double-check dữ liệu trước khi gửi
                console.log('Dữ liệu cử tri trước khi gửi đi:', previewData);

                // Đảm bảo tất cả dữ liệu đã được chuẩn hóa đúng cách
                const finalizedVoters = previewData.map((voter) => ({
                  ...voter,
                  // Đảm bảo không có giá trị null/undefined
                  email: voter.email || '',
                  sdt: voter.sdt || '',
                  xacMinh: Boolean(voter.xacMinh),
                  boPhieu: Boolean(voter.boPhieu),
                  hasBlockchainWallet: Boolean(voter.hasBlockchainWallet),
                  phienBauCuId: Number(voter.phienBauCuId || phienBauCuid),
                  cuocBauCuId: Number(voter.cuocBauCuId || 0),
                  taiKhoanId: Number(voter.taiKhoanId || 0),
                  vaiTroId: Number(voter.vaiTroId || 0),
                  soLanGuiOTP: Number(voter.soLanGuiOTP || 0),
                }));

                onUploadSuccess(finalizedVoters);
                setSuccessMessage(
                  `Đã thêm ${previewData.length} cử tri vào hệ thống. Hệ thống sẽ gửi email xác thực cho cử tri chưa được xác thực tự động.`,
                );
                setPreviewData(null);
                setFileInfo(null);
                setValidationResults(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            Xác nhận và thêm {previewData.length} cử tri
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 dark:border-blue-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Tải lên danh sách cử tri</CardTitle>
          <CardDescription>Tải lên danh sách cử tri từ file CSV hoặc Excel</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Hiển thị thông báo thành công */}
          {successMessage && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300">
              <Check className="h-4 w-4 mr-2" />
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Hiển thị thông báo lỗi */}
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Hướng dẫn định dạng file */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                  Hướng dẫn định dạng file
                </h3>
                <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-400">
                  <li>
                    • File phải có định dạng <strong>CSV</strong> hoặc <strong>Excel</strong> (xlsx,
                    xls)
                  </li>
                  <li>
                    • Phải có cột <strong>email</strong> (bắt buộc) và các cột <strong>sdt</strong>,{' '}
                    <strong>xacminh</strong> (không bắt buộc)
                  </li>
                  <li>
                    • Cột <strong>xacminh</strong> có giá trị "yes"/"no" hoặc "true"/"false" hoặc
                    "1"/"0"
                  </li>
                </ul>
                <div className="mt-2 flex">
                  <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300 dark:border-blue-700 dark:text-blue-400"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Tải xuống file mẫu
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-[#162A45] border dark:border-[#2A3A5A]">
                      <DialogHeader>
                        <DialogTitle>Tải xuống file mẫu</DialogTitle>
                        <DialogDescription>Chọn định dạng file mẫu để tải xuống</DialogDescription>
                      </DialogHeader>

                      <Tabs
                        value={activeTemplateTab}
                        onValueChange={setActiveTemplateTab}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="csv">CSV</TabsTrigger>
                          <TabsTrigger value="excel">Excel</TabsTrigger>
                        </TabsList>

                        <TabsContent value="csv" className="mt-4">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-sm font-mono overflow-x-auto">
                            <div>email,sdt,xacminh</div>
                            <div>nguyenvana@example.com,0912345678,no</div>
                            <div>nguyenvanb@example.com,0987654321,yes</div>
                            <div>nguyenvanc@example.com,0976543210,no</div>
                          </div>
                        </TabsContent>

                        <TabsContent value="excel" className="mt-4">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>email</TableHead>
                                  <TableHead>sdt</TableHead>
                                  <TableHead>xacminh</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell>nguyenvana@example.com</TableCell>
                                  <TableCell>0912345678</TableCell>
                                  <TableCell>no</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>nguyenvanb@example.com</TableCell>
                                  <TableCell>0987654321</TableCell>
                                  <TableCell>yes</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>nguyenvanc@example.com</TableCell>
                                  <TableCell>0976543210</TableCell>
                                  <TableCell>no</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <DialogFooter>
                        <Button
                          onClick={() => {
                            if (activeTemplateTab === 'csv') {
                              generateTemplateCSV();
                            } else {
                              generateTemplateExcel();
                            }
                            setIsTemplateDialogOpen(false);
                          }}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Tải xuống file {activeTemplateTab.toUpperCase()}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>

          {/* Drag and drop area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                : 'border-gray-300 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mb-4 relative">
                  <svg
                    className="animate-spin h-16 w-16 text-blue-600 dark:text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  Đang xử lý file...
                </p>
                <Progress value={progress} className="w-48 h-2 mt-2" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Kéo thả hoặc chọn file
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Hỗ trợ file CSV, Excel (.xlsx, .xls)
                </p>
                <Button className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md">
                  Chọn file
                </Button>
              </div>
            )}
          </div>

          {renderFileInfo()}
          {renderValidationSummary()}
          {renderPreviewData()}

          {/* Thông tin về quy trình xác thực */}
          {previewData && previewData.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-700/30 mt-4">
              <div className="flex items-center mb-2">
                <Info className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-blue-800 dark:text-blue-300">
                  Thông tin về quy trình tự động
                </h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Sau khi thêm cử tri, hệ thống sẽ tự động:
              </p>
              <ul className="text-sm space-y-1 mt-2 text-blue-700 dark:text-blue-400">
                <li>• Kiểm tra các email đã tồn tại trong hệ thống</li>
                <li>
                  • Nếu email đã liên kết với tài khoản có ví blockchain, cử tri sẽ được xác thực tự
                  động
                </li>
                <li>• Nếu không, hệ thống sẽ gửi email xác thực tới các cử tri</li>
                <li>
                  • Cử tri phải nhấp vào liên kết trong email để xác thực và tiếp tục quy trình
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(VoterUploader);
