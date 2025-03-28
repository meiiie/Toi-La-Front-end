import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Descriptions,
  Spin,
  Alert,
  Steps,
  Image,
  Upload,
  Modal,
  Input,
  message,
} from 'antd';
import {
  UploadOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Step } = Steps;
const { confirm } = Modal;

const ChiTietCuocBauCu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deployLoading, setDeployLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [scwAddress, setSCWAddress] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    fetchData();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`/api/CuocBauCu/details/${id}`);
      setData(response.data);

      // Thiết lập polling để kiểm tra trạng thái nếu đang triển khai
      if (response.data.trangThaiBlockchain === 1) {
        const interval = setInterval(() => {
          checkBlockchainStatus();
        }, 5000);
        setPollingInterval(interval);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin cuộc bầu cử:', error);
      message.error('Không thể lấy thông tin cuộc bầu cử');
    } finally {
      setLoading(false);
    }
  };

  const checkBlockchainStatus = async () => {
    try {
      const response = await axios.get(`/api/CuocBauCu/blockchain/${id}`);

      if (response.data.status !== data.trangThaiBlockchain) {
        // Cập nhật dữ liệu nếu trạng thái thay đổi
        fetchData();

        // Dừng polling nếu đã triển khai hoặc thất bại
        if (response.data.status === 2 || response.data.status === 3) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }

          if (response.data.status === 2) {
            message.success('Cuộc bầu cử đã được triển khai thành công trên blockchain!');
          } else {
            message.error(`Triển khai thất bại: ${response.data.errorMessage}`);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái blockchain:', error);
    }
  };

  const handleDeploy = () => {
    confirm({
      title: 'Triển khai cuộc bầu cử lên blockchain',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Vui lòng nhập địa chỉ SCW để triển khai cuộc bầu cử:</p>
          <Input
            placeholder="Địa chỉ ví SCW (0x...)"
            value={scwAddress}
            onChange={(e) => setSCWAddress(e.target.value)}
          />
        </div>
      ),
      onOk: async () => {
        if (!scwAddress || !scwAddress.startsWith('0x') || scwAddress.length !== 42) {
          message.error('Địa chỉ SCW không hợp lệ!');
          return Promise.reject('Địa chỉ SCW không hợp lệ');
        }

        setDeployLoading(true);
        try {
          const response = await axios.post(`/api/CuocBauCu/deployBlockchain/${id}`, {
            SCWAddress: scwAddress,
          });

          if (response.data.success) {
            message.success('Đã gửi yêu cầu triển khai thành công!');
            fetchData(); // Cập nhật dữ liệu

            // Thiết lập polling để kiểm tra trạng thái
            const interval = setInterval(() => {
              checkBlockchainStatus();
            }, 5000);
            setPollingInterval(interval);
          } else {
            message.error(`Triển khai thất bại: ${response.data.errorMessage}`);
          }
        } catch (error) {
          console.error('Lỗi khi triển khai:', error);
          message.error(error.response?.data?.errorMessage || 'Có lỗi xảy ra khi triển khai');
        } finally {
          setDeployLoading(false);
        }
      },
      onCancel() {
        console.log('Đã hủy');
      },
    });
  };

  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;

    const formData = new FormData();
    formData.append('imageFile', file);

    setImageLoading(true);
    try {
      await axios.post(`/api/CuocBauCu/uploadImage/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Tải lên ảnh thành công');
      onSuccess('ok');
      fetchData(); // Cập nhật dữ liệu
    } catch (error) {
      console.error('Lỗi khi tải lên ảnh:', error);
      message.error('Không thể tải lên ảnh');
      onError(error);
    } finally {
      setImageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Đang tải thông tin cuộc bầu cử...</p>
      </div>
    );
  }

  return (
    <div className="chi-tiet-cuoc-bau-cu">
      <h1>{data.tenCuocBauCu}</h1>

      <div className="header-buttons">
        <Button type="primary" onClick={() => navigate('/cuoc-bau-cu')}>
          Quay lại danh sách
        </Button>

        {data.trangThaiBlockchain === 0 && (
          <Button
            type="primary"
            icon={<RocketOutlined />}
            onClick={handleDeploy}
            loading={deployLoading}
          >
            Triển khai lên Blockchain
          </Button>
        )}
      </div>

      <div className="content-container">
        <div className="left-column">
          <Card title="Ảnh đại diện" className="image-card">
            {data.anhCuocBauCu ? (
              <Image src={data.anhCuocBauCu} alt={data.tenCuocBauCu} style={{ maxWidth: '100%' }} />
            ) : (
              <div className="empty-image">
                <p>Chưa có ảnh đại diện</p>
                <Upload customRequest={handleImageUpload} showUploadList={false}>
                  <Button icon={<UploadOutlined />} loading={imageLoading}>
                    Tải lên ảnh
                  </Button>
                </Upload>
              </div>
            )}
          </Card>

          {data.trangThaiBlockchain > 0 && (
            <Card title="Trạng thái Blockchain" className="blockchain-card">
              <Steps
                direction="vertical"
                current={data.trangThaiBlockchain === 3 ? 1 : data.trangThaiBlockchain}
                status={data.trangThaiBlockchain === 3 ? 'error' : 'process'}
              >
                <Step title="Khởi tạo" description="Cuộc bầu cử đã được tạo" />
                <Step
                  title="Đang triển khai"
                  description="Đang triển khai lên blockchain"
                  icon={data.trangThaiBlockchain === 1 ? <LoadingOutlined /> : null}
                />
                <Step
                  title="Hoàn tất"
                  description="Đã triển khai thành công"
                  icon={data.trangThaiBlockchain === 2 ? <CheckCircleOutlined /> : null}
                />
              </Steps>

              {data.trangThaiBlockchain === 3 && (
                <Alert
                  message="Triển khai thất bại"
                  description={data.errorMessage}
                  type="error"
                  showIcon
                />
              )}

              {data.trangThaiBlockchain === 1 && (
                <div className="deployment-progress">
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  <p>Đang triển khai lên blockchain...</p>
                  <p className="text-muted">Quá trình này có thể mất vài phút.</p>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="right-column">
          <Card title="Thông tin chi tiết">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Tên cuộc bầu cử">{data.tenCuocBauCu}</Descriptions.Item>
              <Descriptions.Item label="Mô tả">{data.moTa}</Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">{data.ngayBatDau}</Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">{data.ngayKetThuc}</Descriptions.Item>

              {data.blockchainServerId > 0 && (
                <Descriptions.Item label="ID Server trên Blockchain">
                  {data.blockchainServerId}
                </Descriptions.Item>
              )}

              {data.blockchainAddress && (
                <Descriptions.Item label="Địa chỉ Smart Contract">
                  {data.blockchainAddress}
                </Descriptions.Item>
              )}

              <Descriptions.Item label="Trạng thái Blockchain">
                {data.trangThaiBlockchain === 0 && 'Chưa triển khai'}
                {data.trangThaiBlockchain === 1 && 'Đang triển khai'}
                {data.trangThaiBlockchain === 2 && 'Đã triển khai thành công'}
                {data.trangThaiBlockchain === 3 && 'Triển khai thất bại'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Các phiên bầu cử" className="mt-4">
            {/* Hiển thị danh sách phiên bầu cử */}
            <p>Chức năng này sẽ được triển khai sau...</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChiTietCuocBauCu;
