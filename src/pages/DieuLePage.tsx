'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle,
  Edit,
  Download,
  Printer,
  MoreHorizontal,
  Info,
  Upload,
  History,
  Eye,
  RefreshCw,
  ArrowLeft,
  Save,
  Trash2,
  Send,
  PlusCircle,
  Loader2,
} from 'lucide-react';

// Redux actions
import {
  fetchDieuLeByCuocBauCuId,
  fetchDanhSachPhienBan,
  capNhatDieuLe,
  updateTrangThaiCongBo,
  uploadFile,
  guiThongBao,
  resetThongBao,
} from '../store/slice/dieuLeSlice';

// Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Label } from '../components/ui/Label';
import { Switch } from '../components/ui/Switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/Dropdown-Menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/AlterDialog';
import { useToast } from '../test/components/use-toast';
import type { DieuLe } from '../store/types';

// Editor
import { Editor } from '@tinymce/tinymce-react';

// Utilities
import { handlePrint, handleDownloadPDF } from '../utils/print-utils';

// Templates
import { mauDieuLe } from '../data/dieu-le-templates';

// Thêm khai báo kiểu cho window.tinymce
declare global {
  interface Window {
    tinymce?: {
      get: (id: string) => any;
      init: (config: any) => any;
    };
  }
}

const DieuLePage: React.FC = () => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const editorRef = useRef<any>(null);

  // Redux state
  const {
    dieuLeCuocBauCu,
    danhSachPhienBan,
    dangTai,
    dangLuu,
    dangXoa,
    dangUpload,
    dangGuiThongBao,
    loi,
    thanhCong,
  } = useSelector((state: RootState) => state.dieuLe);

  // Local state
  const [activeTab, setActiveTab] = useState('view');
  const [editorContent, setEditorContent] = useState('');
  const [title, setTitle] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showSendNotificationDialog, setShowSendNotificationDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{
    first: number | null;
    second: number | null;
  }>({ first: null, second: null });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Kiểm tra dark mode
  useEffect(() => {
    // Kiểm tra nếu người dùng đã chọn dark mode
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fetch điều lệ khi component mount
  useEffect(() => {
    if (cuocBauCuId) {
      dispatch(fetchDieuLeByCuocBauCuId(Number(cuocBauCuId)));
      dispatch(fetchDanhSachPhienBan(Number(cuocBauCuId)));
    }

    // Cleanup
    return () => {
      dispatch(resetThongBao());
    };
  }, [dispatch, cuocBauCuId]);

  // Cập nhật state khi có dữ liệu từ Redux
  useEffect(() => {
    if (dieuLeCuocBauCu) {
      setEditorContent(dieuLeCuocBauCu.noiDung || '');
      setTitle(dieuLeCuocBauCu.tieuDe || '');
      setIsPublished(dieuLeCuocBauCu.daCongBo || false);
      setRequireConfirmation(dieuLeCuocBauCu.yeuCauXacNhan || false);
    } else {
      // Nếu chưa có điều lệ, đặt giá trị mặc định
      setEditorContent('');
      setTitle(`Điều lệ bầu cử`);
      setIsPublished(false);
      setRequireConfirmation(false);
    }
  }, [dieuLeCuocBauCu]);

  // Hiển thị thông báo khi có lỗi hoặc thành công
  useEffect(() => {
    if (loi) {
      toast({
        title: 'Lỗi',
        description: loi,
        variant: 'destructive',
      });
      dispatch(resetThongBao());
    }

    if (thanhCong) {
      toast({
        title: 'Thành công',
        description: thanhCong,
      });
      dispatch(resetThongBao());
    }
  }, [loi, thanhCong, toast, dispatch]);

  // Xử lý khi chọn mẫu điều lệ
  const handleSelectTemplate = (template: string) => {
    setSelectedTemplate(template);
    switch (template) {
      case 'coBan':
        setEditorContent(mauDieuLe.coBan);
        break;
      case 'nangCao':
        setEditorContent(mauDieuLe.nangCao);
        break;
      case 'doanhNghiep':
        setEditorContent(mauDieuLe.doanhNghiep);
        break;
      default:
        break;
    }
  };

  // Xử lý khi thay đổi nội dung editor
  const handleEditorChange = (content: string) => {
    setEditorContent(content);
  };

  // Xử lý khi lưu điều lệ
  const handleSaveDieuLe = async (publish = false) => {
    if (!cuocBauCuId) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy ID cuộc bầu cử',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tiêu đề điều lệ',
        variant: 'destructive',
      });
      return;
    }

    if (!editorContent.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập nội dung điều lệ',
        variant: 'destructive',
      });
      return;
    }

    const dieuLeData: Partial<DieuLe> = {
      id: dieuLeCuocBauCu?.id,
      cuocBauCuId: Number(cuocBauCuId),
      tieuDe: title,
      noiDung: editorContent,
      daCongBo: publish,
      yeuCauXacNhan: requireConfirmation,
    };

    try {
      await dispatch(capNhatDieuLe(dieuLeData)).unwrap();
      setIsPublished(publish);

      // Nếu đã công bố, chuyển về tab xem
      if (publish) {
        setActiveTab('view');
      }

      // Cập nhật danh sách phiên bản
      dispatch(fetchDanhSachPhienBan(Number(cuocBauCuId)));
    } catch (error) {
      console.error('Lỗi khi lưu điều lệ:', error);
    }
  };

  // Xử lý khi thay đổi trạng thái công bố
  const handlePublishStatusChange = async () => {
    if (!dieuLeCuocBauCu?.id) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy điều lệ để cập nhật trạng thái',
        variant: 'destructive',
      });
      return;
    }

    try {
      await dispatch(
        updateTrangThaiCongBo({
          id: dieuLeCuocBauCu.id,
          daCongBo: !isPublished,
        }),
      ).unwrap();
      setIsPublished(!isPublished);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái công bố:', error);
    }
  };

  // Xử lý khi upload file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra loại file
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Loại file không hỗ trợ',
          description: 'Vui lòng chọn file PDF, DOCX hoặc TXT',
          variant: 'destructive',
        });
        return;
      }

      // Kiểm tra kích thước file (giới hạn 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File quá lớn',
          description: 'Vui lòng chọn file có kích thước nhỏ hơn 10MB',
          variant: 'destructive',
        });
        return;
      }

      setUploadedFile(file);
    }
  };

  // Xử lý khi upload file điều lệ
  const handleUploadFile = async () => {
    if (!cuocBauCuId || !uploadedFile) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn file để tải lên',
        variant: 'destructive',
      });
      return;
    }

    try {
      await dispatch(
        uploadFile({
          cuocBauCuId: Number(cuocBauCuId),
          file: uploadedFile,
        }),
      ).unwrap();

      // Cập nhật lại dữ liệu
      dispatch(fetchDieuLeByCuocBauCuId(Number(cuocBauCuId)));
      dispatch(fetchDanhSachPhienBan(Number(cuocBauCuId)));

      // Reset state
      setUploadedFile(null);

      // Chuyển về tab xem
      setActiveTab('view');
    } catch (error) {
      console.error('Lỗi khi tải lên file:', error);
    }
  };

  // Xử lý khi gửi thông báo
  const handleSendNotification = async () => {
    if (!dieuLeCuocBauCu?.id || !cuocBauCuId) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy thông tin điều lệ hoặc cuộc bầu cử',
        variant: 'destructive',
      });
      return;
    }

    try {
      await dispatch(
        guiThongBao({
          dieuLeId: dieuLeCuocBauCu.id,
          cuocBauCuId: Number(cuocBauCuId),
        }),
      ).unwrap();
      setShowSendNotificationDialog(false);
    } catch (error) {
      console.error('Lỗi khi gửi thông báo:', error);
    }
  };

  // Xử lý khi khôi phục phiên bản
  const handleRestoreVersion = async (dieuLe: DieuLe) => {
    if (!cuocBauCuId) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy ID cuộc bầu cử',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Tạo bản sao của điều lệ đã chọn nhưng với ID mới
      const dieuLeData: Partial<DieuLe> = {
        cuocBauCuId: Number(cuocBauCuId),
        tieuDe: dieuLe.tieuDe,
        noiDung: dieuLe.noiDung,
        daCongBo: false, // Mặc định là bản nháp khi khôi phục
        yeuCauXacNhan: dieuLe.yeuCauXacNhan,
      };

      await dispatch(capNhatDieuLe(dieuLeData)).unwrap();

      // Cập nhật lại dữ liệu
      dispatch(fetchDieuLeByCuocBauCuId(Number(cuocBauCuId)));
      dispatch(fetchDanhSachPhienBan(Number(cuocBauCuId)));

      // Chuyển về tab xem
      setActiveTab('view');
    } catch (error) {
      console.error('Lỗi khi khôi phục phiên bản:', error);
    }
  };

  // Xử lý khi so sánh phiên bản
  const handleCompareVersions = (firstId: number, secondId: number) => {
    setCompareVersions({ first: firstId, second: secondId });
    // Hiển thị modal so sánh hoặc chuyển đến trang so sánh
  };

  // Xử lý khi tìm kiếm trong nội dung điều lệ
  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    // Sử dụng TinyMCE API để tìm kiếm trong nội dung
    if (editorRef.current && editorRef.current.editor) {
      const editor = editorRef.current.editor;
      editor.focus();
      try {
        const found = editor.execCommand('SearchReplace', true, {
          find: searchTerm,
          matchCase: false,
        });

        if (!found) {
          toast({
            title: 'Không tìm thấy',
            description: `Không tìm thấy "${searchTerm}" trong nội dung điều lệ`,
          });
        }
      } catch (error) {
        console.error('Lỗi khi tìm kiếm:', error);
        toast({
          title: 'Lỗi tìm kiếm',
          description: 'Không thể thực hiện tìm kiếm trong nội dung',
          variant: 'destructive',
        });
      }
    } else {
      // Fallback khi không có TinyMCE
      const content = document.querySelector('.prose');
      if (content) {
        // Highlight tất cả các kết quả tìm kiếm
        const html = content.innerHTML;
        const regex = new RegExp(searchTerm, 'gi');
        if (html.match(regex)) {
          content.innerHTML = html.replace(
            regex,
            (match) => `<mark class="bg-yellow-200 dark:bg-yellow-700">${match}</mark>`,
          );
        } else {
          toast({
            title: 'Không tìm thấy',
            description: `Không tìm thấy "${searchTerm}" trong nội dung điều lệ`,
          });
        }
      }
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Cấu hình TinyMCE
  const getTinyMCEConfig = (isReadOnly = false) => {
    return {
      height: 500,
      menubar: !isReadOnly,
      toolbar: isReadOnly
        ? false
        : 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
      plugins: [
        'searchreplace',
        ...(isReadOnly
          ? []
          : [
              'anchor',
              'autolink',
              'charmap',
              'codesample',
              'emoticons',
              'image',
              'link',
              'lists',
              'media',
              'table',
              'visualblocks',
              'wordcount',
              'checklist',
              'mediaembed',
              'casechange',
              'export',
              'formatpainter',
              'pageembed',
              'a11ychecker',
              'tinymcespellchecker',
              'permanentpen',
              'powerpaste',
              'advtable',
              'advcode',
              'editimage',
              'advtemplate',
              'mentions',
              'tableofcontents',
              'footnotes',
              'mergetags',
              'autocorrect',
              'typography',
              'inlinecss',
              'markdown',
            ]),
      ],
      readonly: isReadOnly,
      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
      skin: isDarkMode ? 'oxide-dark' : 'oxide',
      content_css: isDarkMode ? 'dark' : 'default',
      branding: false,
      statusbar: !isReadOnly,
      language: 'vi',
      language_url: 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/langs/vi.js',
    };
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      <div className="container mx-auto p-4 space-y-6">
        {/* Header Section */}
        <motion.div initial="initial" animate="animate" variants={fadeInUp} className="px-0">
          <div className="bg-white dark:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Quay lại
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                    Điều lệ bầu cử
                  </h1>
                  {dieuLeCuocBauCu?.daCongBo ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Đã công bố
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Bản nháp
                    </Badge>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-300">
                  Quản lý và công bố điều lệ cho cuộc bầu cử
                </p>
              </div>

              <div className="flex space-x-2 self-end md:self-auto">
                {dieuLeCuocBauCu && (
                  <>
                    {activeTab === 'view' && (
                      <Button
                        variant="outline"
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        onClick={() => setActiveTab('edit')}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                        <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                        <DropdownMenuItem
                          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            if (dieuLeCuocBauCu?.noiDung) {
                              handlePrint(
                                dieuLeCuocBauCu.tieuDe || 'Điều lệ bầu cử',
                                dieuLeCuocBauCu.noiDung,
                              );
                            }
                          }}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          <span>In điều lệ</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            if (dieuLeCuocBauCu?.noiDung) {
                              handleDownloadPDF(
                                dieuLeCuocBauCu.tieuDe || 'Điều lệ bầu cử',
                                dieuLeCuocBauCu.noiDung,
                              );
                              toast({
                                title: 'Đang tạo PDF',
                                description: 'Tệp PDF sẽ được tải xuống trong giây lát',
                              });
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          <span>Tải xuống PDF</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                        <DropdownMenuItem
                          className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowSendNotificationDialog(true)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          <span>Gửi thông báo</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>

            {/* Metadata */}
            {dieuLeCuocBauCu && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cập nhật cuối</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {formatDate(dieuLeCuocBauCu.thoiGianCapNhat)}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center">
                  <Tag className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phiên bản</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      v{dieuLeCuocBauCu.phienBan}.0
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center">
                  <Info className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Trạng thái</p>
                    <div className="flex items-center">
                      {dieuLeCuocBauCu.daCongBo ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            Đã công bố
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5"></span>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            Bản nháp
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content with Tabs */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={{
            ...fadeInUp,
            animate: { ...fadeInUp.animate, transition: { delay: 0.1, duration: 0.5 } },
          }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger
                value="view"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Xem điều lệ
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Soạn thảo
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Tải lên
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
              >
                <History className="h-4 w-4 mr-2" />
                Lịch sử
              </TabsTrigger>
            </TabsList>

            <Card className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md overflow-hidden">
              {/* Tab Xem điều lệ */}
              <TabsContent value="view" className="p-0 m-0">
                <CardContent className="p-6 space-y-6">
                  {dangTai ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Đang tải...</span>
                    </div>
                  ) : dieuLeCuocBauCu ? (
                    <>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                          {dieuLeCuocBauCu.tieuDe}
                        </h2>
                        <div className="relative w-full md:w-auto">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="text"
                              placeholder="Tìm kiếm trong điều lệ..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full md:w-64 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                            />
                            <Button
                              variant="outline"
                              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              onClick={handleSearch}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 min-h-[400px]">
                        {/* Sử dụng TinyMCE cho chế độ xem nếu cần tính năng tìm kiếm nâng cao */}
                        <Editor
                          apiKey="hnhk7yhahvso9ca3umd4b6yaf47to3o0899j7tc50rj3tzpo"
                          id="dieu-le-viewer"
                          onInit={(evt: unknown, editor: any) => (editorRef.current = editor)}
                          value={dieuLeCuocBauCu.noiDung as string}
                          init={getTinyMCEConfig(true) as Record<string, unknown>}
                        />
                      </div>

                      {dieuLeCuocBauCu.fileUrl && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                            Tài liệu đính kèm
                          </h3>
                          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-blue-500 mr-2" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {dieuLeCuocBauCu.tenFile}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              onClick={() => window.open(dieuLeCuocBauCu.fileUrl, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Tải xuống
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={dieuLeCuocBauCu.daCongBo}
                            onCheckedChange={handlePublishStatusChange}
                            disabled={dangLuu}
                          />
                          <Label className="text-gray-700 dark:text-gray-300">
                            {dieuLeCuocBauCu.daCongBo ? 'Đã công bố' : 'Bản nháp'}
                          </Label>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            onClick={() => setActiveTab('edit')}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </Button>

                          {dieuLeCuocBauCu.daCongBo && (
                            <Button
                              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                              onClick={() => setShowSendNotificationDialog(true)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Gửi thông báo
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chưa có điều lệ
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Cuộc bầu cử này chưa có điều lệ. Hãy tạo điều lệ mới hoặc tải lên file điều
                        lệ.
                      </p>
                      <div className="flex flex-col md:flex-row justify-center space-y-3 md:space-y-0 md:space-x-4">
                        <Button
                          variant="outline"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          onClick={() => setActiveTab('upload')}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Tải lên file
                        </Button>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                          onClick={() => setActiveTab('edit')}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Soạn thảo mới
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </TabsContent>

              {/* Tab Soạn thảo */}
              <TabsContent value="edit" className="p-0 m-0">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                        Tiêu đề điều lệ
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tiêu đề điều lệ"
                        className="mt-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">Chọn mẫu điều lệ</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                        <Button
                          variant={selectedTemplate === 'coBan' ? 'default' : 'outline'}
                          className={
                            selectedTemplate === 'coBan'
                              ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
                          }
                          onClick={() => handleSelectTemplate('coBan')}
                        >
                          Cơ bản
                        </Button>
                        <Button
                          variant={selectedTemplate === 'nangCao' ? 'default' : 'outline'}
                          className={
                            selectedTemplate === 'nangCao'
                              ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
                          }
                          onClick={() => handleSelectTemplate('nangCao')}
                        >
                          Nâng cao
                        </Button>
                        <Button
                          variant={selectedTemplate === 'doanhNghiep' ? 'default' : 'outline'}
                          className={
                            selectedTemplate === 'doanhNghiep'
                              ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
                          }
                          onClick={() => handleSelectTemplate('doanhNghiep')}
                        >
                          Doanh nghiệp
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="editor" className="text-gray-700 dark:text-gray-300">
                        Nội dung điều lệ
                      </Label>
                      <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <Editor
                          apiKey="hnhk7yhahvso9ca3umd4b6yaf47to3o0899j7tc50rj3tzpo"
                          id="editor"
                          onInit={(evt: unknown, editor: any) => (editorRef.current = editor)}
                          value={editorContent}
                          onEditorChange={handleEditorChange}
                          init={getTinyMCEConfig(false)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                          <div>
                            <Label className="text-gray-700 dark:text-gray-300">
                              Công bố điều lệ
                            </Label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Khi công bố, điều lệ sẽ hiển thị cho tất cả người tham gia
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={requireConfirmation}
                            onCheckedChange={setRequireConfirmation}
                          />
                          <div>
                            <Label className="text-gray-700 dark:text-gray-300">
                              Yêu cầu xác nhận
                            </Label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Yêu cầu người tham gia xác nhận đã đọc trước khi bỏ phiếu
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3 pt-4">
                    <Button
                      variant="outline"
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      onClick={() => setActiveTab('view')}
                    >
                      Hủy
                    </Button>

                    <Button
                      variant="outline"
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      onClick={() => handleSaveDieuLe(false)}
                      disabled={dangLuu}
                    >
                      {dangLuu ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Lưu bản nháp
                        </>
                      )}
                    </Button>

                    <Button
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                      onClick={() => handleSaveDieuLe(true)}
                      disabled={dangLuu}
                    >
                      {dangLuu ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Lưu và công bố
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Tab Tải lên */}
              <TabsContent value="upload" className="p-0 m-0">
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-md">
                      <div className="text-center mb-6">
                        <Upload className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                        <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
                          Tải lên điều lệ
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Tải lên tệp điều lệ của bạn. Hỗ trợ: PDF, DOCX, TXT
                        </p>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200">
                        {uploadedFile ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-center">
                              <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-gray-700 dark:text-gray-300 font-medium">
                                {uploadedFile.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(uploadedFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              onClick={() => setUploadedFile(null)}
                            >
                              Chọn file khác
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer py-8"
                            onClick={() => document.getElementById('file-upload-dieule')?.click()}
                          >
                            <div className="flex flex-col items-center">
                              <Upload className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                                Click để chọn file hoặc kéo thả file vào đây
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Hỗ trợ PDF, DOCX, TXT (tối đa 10MB)
                              </p>
                            </div>
                            <Input
                              id="file-upload-dieule"
                              type="file"
                              accept=".pdf,.docx,.txt"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-1" />
                          Lưu ý khi tải lên tệp điều lệ
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc pl-4">
                          <li>Định dạng PDF sẽ được hiển thị đúng cho người dùng</li>
                          <li>Định dạng DOCX và TXT sẽ được chuyển đổi tự động sang HTML</li>
                          <li>Kích thước file tối đa là 10MB</li>
                        </ul>
                      </div>

                      <div className="mt-6 flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3">
                        <Button
                          variant="outline"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          onClick={() => setActiveTab('view')}
                        >
                          Hủy
                        </Button>

                        <Button
                          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                          onClick={handleUploadFile}
                          disabled={!uploadedFile || dangUpload}
                        >
                          {dangUpload ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang tải lên...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Tải lên
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Tab Lịch sử */}
              <TabsContent value="history" className="p-0 m-0">
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-4">
                    Lịch sử phiên bản
                  </h3>

                  {dangTai ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Đang tải...</span>
                    </div>
                  ) : danhSachPhienBan.length > 0 ? (
                    <div className="space-y-4">
                      {danhSachPhienBan.map((dieuLe, index) => (
                        <Card
                          key={dieuLe.id}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                                    Phiên bản {dieuLe.phienBan}.0
                                  </h4>
                                  {dieuLeCuocBauCu?.id === dieuLe.id && (
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">
                                      HIỆN TẠI
                                    </Badge>
                                  )}
                                  {dieuLe.daCongBo && (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                                      ĐÃ CÔNG BỐ
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Cập nhật: {formatDate(dieuLe.thoiGianCapNhat)}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {dieuLe.tieuDe}
                                </p>
                              </div>

                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                  onClick={() => {
                                    // Hiển thị nội dung phiên bản này
                                    setEditorContent(dieuLe.noiDung);
                                    setTitle(dieuLe.tieuDe);
                                    setActiveTab('view');
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Xem
                                </Button>

                                {index < danhSachPhienBan.length - 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    onClick={() =>
                                      handleCompareVersions(
                                        dieuLe.id,
                                        danhSachPhienBan[index + 1].id,
                                      )
                                    }
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    So sánh
                                  </Button>
                                )}

                                {dieuLeCuocBauCu?.id !== dieuLe.id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    onClick={() => handleRestoreVersion(dieuLe)}
                                  >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Khôi phục
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chưa có phiên bản nào
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Lịch sử phiên bản sẽ được hiển thị ở đây sau khi bạn tạo hoặc cập nhật điều
                        lệ.
                      </p>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                        onClick={() => setActiveTab('edit')}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tạo điều lệ mới
                      </Button>
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Card>
          </Tabs>
        </motion.div>

        {/* Send Notification Dialog */}
        <AlertDialog open={showSendNotificationDialog} onOpenChange={setShowSendNotificationDialog}>
          <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Gửi thông báo điều lệ</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                Gửi thông báo về điều lệ mới cho tất cả người tham gia cuộc bầu cử này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                      Lưu ý
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Thông báo sẽ được gửi đến tất cả người tham gia cuộc bầu cử này. Họ sẽ nhận
                      được email và thông báo trong ứng dụng.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSendNotification}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg"
                disabled={dangGuiThongBao}
              >
                {dangGuiThongBao ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gửi thông báo
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa điều lệ</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                Bạn có chắc chắn muốn xóa điều lệ này không? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                disabled={dangXoa}
              >
                {dangXoa ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default DieuLePage;
