import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

// Khai báo các kiểu dữ liệu
interface CuocBauCu {
  id: number;
  tenCuocBauCu: string;
  moTa: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  taiKhoanId: number;
  anhCuocBauCu?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
}

interface AuthState {
  token: string | null;
  userId: number | null;
  isAuthenticated: boolean;
}

const App: React.FC = () => {
  // State cho đăng nhập
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId') || '0') : null,
    isAuthenticated: !!localStorage.getItem('token'),
  });

  // State cho form đăng nhập
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // State cho danh sách cuộc bầu cử
  const [elections, setElections] = useState<CuocBauCu[]>([]);
  const [selectedElection, setSelectedElection] = useState<CuocBauCu | null>(null);
  const [loadingElections, setLoadingElections] = useState<boolean>(false);

  // State cho upload ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Xử lý đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const response = await axios.post('/api/TaiKhoan/login', {
        username,
        password,
      });

      const { token, userId } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId.toString());

      setAuth({
        token,
        userId,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Đăng nhập thất bại', error);
      setLoginError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');

    setAuth({
      token: null,
      userId: null,
      isAuthenticated: false,
    });

    setElections([]);
    setSelectedElection(null);
  };

  // Lấy danh sách cuộc bầu cử
  const fetchElections = async () => {
    if (!auth.isAuthenticated || !auth.userId) return;

    setLoadingElections(true);

    try {
      const response = await axios.get<CuocBauCu[]>(`/api/CuocBauCu/taikhoan/${auth.userId}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setElections(response.data);
      setLoadingElections(false);
    } catch (error) {
      console.error('Không thể lấy danh sách cuộc bầu cử', error);
      setLoadingElections(false);
    }
  };

  // Xử lý khi chọn file ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadResponse(null);

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Kiểm tra file phải là ảnh
      if (!file.type.startsWith('image/')) {
        setUploadError('Vui lòng chọn một file ảnh');
        return;
      }

      setSelectedFile(file);

      // Tạo URL xem trước
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý khi tải ảnh lên
  const handleUpload = async () => {
    if (!selectedElection || !selectedFile || !auth.token) {
      setUploadError('Vui lòng chọn cuộc bầu cử và ảnh trước khi tải lên');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadResponse(null);

    const formData = new FormData();
    formData.append('imageFile', selectedFile);

    try {
      const response = await axios.post<UploadResponse>(
        `/api/CuocBauCu/uploadImage/${selectedElection.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );

      setUploadResponse(response.data);

      // Cập nhật URL ảnh trong danh sách cuộc bầu cử
      if (response.data.success && response.data.imageUrl) {
        // Cập nhật danh sách cuộc bầu cử
        const updatedElections = elections.map((election) =>
          election.id === selectedElection.id
            ? { ...election, anhCuocBauCu: response.data.imageUrl }
            : election,
        );
        setElections(updatedElections);

        // Cập nhật cuộc bầu cử đang chọn
        setSelectedElection({ ...selectedElection, anhCuocBauCu: response.data.imageUrl });
      }
    } catch (error: any) {
      console.error('Lỗi khi tải ảnh lên', error);
      setUploadError(error.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  // Load danh sách cuộc bầu cử khi đăng nhập thành công
  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchElections();
    }
  }, [auth.isAuthenticated]);

  // Giao diện đăng nhập
  if (!auth.isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>Đăng nhập</h2>

          {loginError && <div className="alert alert-error">{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Giao diện chính sau khi đăng nhập
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Hệ thống quản lý ảnh cuộc bầu cử</h1>
        <button onClick={handleLogout} className="btn btn-logout">
          Đăng xuất
        </button>
      </header>

      <main className="main-content">
        <div className="elections-list">
          <h2>Danh sách cuộc bầu cử</h2>

          {loadingElections ? (
            <div className="loading">Đang tải...</div>
          ) : elections.length === 0 ? (
            <div className="no-data">Không có cuộc bầu cử nào</div>
          ) : (
            <ul>
              {elections.map((election) => (
                <li
                  key={election.id}
                  className={selectedElection?.id === election.id ? 'selected' : ''}
                  onClick={() => {
                    setSelectedElection(election);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setUploadResponse(null);
                    setUploadError(null);
                  }}
                >
                  <div className="election-item">
                    <div className="election-title">{election.tenCuocBauCu}</div>
                    <div className="election-dates">
                      {election.ngayBatDau} - {election.ngayKetThuc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="upload-section">
          {selectedElection ? (
            <div className="election-details">
              <h2>{selectedElection.tenCuocBauCu}</h2>
              <p className="election-description">{selectedElection.moTa}</p>
              <div className="election-dates">
                <strong>Thời gian:</strong> {selectedElection.ngayBatDau} -{' '}
                {selectedElection.ngayKetThuc}
              </div>

              {selectedElection.anhCuocBauCu && (
                <div className="current-image">
                  <h3>Ảnh hiện tại:</h3>
                  <img src={selectedElection.anhCuocBauCu} alt={selectedElection.tenCuocBauCu} />
                </div>
              )}

              <div className="upload-form">
                <h3>Tải lên ảnh mới</h3>
                <p className="note">Lưu ý: Ảnh mới sẽ thay thế ảnh hiện tại (nếu có)</p>

                <div className="form-group">
                  <label htmlFor="image-file">Chọn ảnh:</label>
                  <input type="file" id="image-file" accept="image/*" onChange={handleFileChange} />
                </div>

                {previewUrl && (
                  <div className="image-preview">
                    <h4>Xem trước:</h4>
                    <img src={previewUrl} alt="Xem trước" />
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="btn btn-primary"
                >
                  {uploading ? 'Đang tải lên...' : 'Tải lên'}
                </button>

                {uploadError && <div className="alert alert-error">{uploadError}</div>}

                {uploadResponse && uploadResponse.success && (
                  <div className="alert alert-success">{uploadResponse.message}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Vui lòng chọn một cuộc bầu cử từ danh sách bên trái</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
