import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { uploadImage, fetchImageUrl, resetImageState } from '../store/slice/cuocBauCuImageSlice';

// Component hiển thị spinner
const LoadingSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 mr-2"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
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
);

interface CuocBauCuImageUploaderProps {
  cuocBauCuId: number;
  onUploadSuccess?: (imageUrl: string) => void;
  className?: string;
}

const CuocBauCuImageUploader: React.FC<CuocBauCuImageUploaderProps> = ({
  cuocBauCuId,
  onUploadSuccess,
  className = '',
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Lấy state từ Redux
  const uploadState = useSelector((state: RootState) => state.cuocBauCuImage);
  const dangTai = uploadState.dangTai || false;
  const uploadSuccess = uploadState.uploadSuccess || false;
  const uploadError = uploadState.uploadError || null;
  const imageUrl = uploadState.imageUrl || null;

  // State cho file đã chọn và preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Lấy ảnh hiện tại khi component được mount
  useEffect(() => {
    if (cuocBauCuId > 0) {
      dispatch(fetchImageUrl(cuocBauCuId));
    }

    return () => {
      dispatch(resetImageState());
    };
  }, [cuocBauCuId, dispatch]);

  // Xử lý callback khi upload thành công
  useEffect(() => {
    if (uploadSuccess && imageUrl && onUploadSuccess) {
      onUploadSuccess(imageUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [uploadSuccess, imageUrl, onUploadSuccess]);

  // Xử lý khi chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const file = files[0];

    // Kiểm tra file phải là ảnh
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file ảnh');
      e.target.value = ''; // Reset input file
      return;
    }

    setSelectedFile(file);

    // Tạo URL xem trước
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        setPreviewUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Xử lý khi tải ảnh lên
  const handleUpload = () => {
    if (selectedFile && cuocBauCuId > 0) {
      dispatch(uploadImage({ id: cuocBauCuId, imageFile: selectedFile }));
    }
  };

  // Render
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Card Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Ảnh đại diện cuộc bầu cử</h3>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Ảnh hiện tại */}
        {imageUrl && (
          <div className="mb-4 text-center">
            <p className="mb-2 font-semibold">Ảnh hiện tại:</p>
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt="Ảnh cuộc bầu cử"
                className="border border-gray-200 rounded max-h-48 max-w-full"
              />
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="mb-4">
          <label htmlFor="image-upload" className="block mb-2 font-medium text-gray-700">
            Chọn ảnh mới
          </label>
          <input
            id="image-upload"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            disabled={dangTai}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">
            Hỗ trợ các định dạng: JPG, PNG, GIF. Ảnh mới sẽ thay thế ảnh hiện tại (nếu có).
          </p>
        </div>

        {/* Xem trước ảnh */}
        {previewUrl && (
          <div className="mb-4 text-center">
            <p className="mb-2 font-semibold">Xem trước:</p>
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Xem trước"
                className="border border-gray-200 rounded max-h-48 max-w-full"
              />
            </div>
          </div>
        )}

        {/* Nút tải lên */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || dangTai}
          className={`w-full py-2 px-4 flex justify-center items-center rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            !selectedFile || dangTai
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {dangTai ? (
            <>
              <LoadingSpinner />
              <span>Đang tải lên...</span>
            </>
          ) : (
            <span>Tải lên</span>
          )}
        </button>

        {/* Thông báo */}
        {uploadSuccess && (
          <div className="mt-4 p-3 bg-green-50 text-green-800 rounded border border-green-200">
            Tải lên ảnh thành công!
          </div>
        )}

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded border border-red-200">
            Lỗi: {uploadError}
          </div>
        )}
      </div>
    </div>
  );
};

export default CuocBauCuImageUploader;
