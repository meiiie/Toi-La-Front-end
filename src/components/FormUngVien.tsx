import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { UngCuVien } from '../store/types';

interface CandidateFormProps {
  onSave: (data: UngCuVien) => void;
  onCancel: () => void;
  initialData?: UngCuVien | null;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ onSave, onCancel, initialData }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UngCuVien>();
  const [imageUrl, setImageUrl] = useState<string>(initialData?.anh || '');

  useEffect(() => {
    if (initialData) {
      setValue('hoTen', initialData.hoTen);
      setValue('moTa', initialData.moTa);
      setValue('viTriUngCuId', initialData.viTriUngCuId);
      setImageUrl(initialData.anh);
    }
  }, [initialData, setValue]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: UngCuVien) => {
    data.anh = imageUrl;
    onSave(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-lg mx-auto text-gray-700 dark:text-gray-300"
      aria-labelledby="candidate-form-title"
    >
      <h2 id="candidate-form-title" className="text-xl font-bold mb-4 text-center">
        {initialData ? 'Chỉnh sửa ứng viên' : 'Thêm ứng viên mới'}
      </h2>
      <div className="mb-4">
        <label
          htmlFor="hoTen"
          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
        >
          Họ Tên
        </label>
        <input
          id="hoTen"
          {...register('hoTen', {
            required: 'Họ tên là bắt buộc',
            minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
          })}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
          aria-describedby="hoTen-error"
        />
        {errors.hoTen && (
          <span id="hoTen-error" className="text-red-500 text-xs italic">
            {errors.hoTen.message}
          </span>
        )}
      </div>
      <div className="mb-4">
        <label
          htmlFor="moTa"
          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
        >
          Mô tả
        </label>
        <textarea
          id="moTa"
          {...register('moTa', {
            required: 'Mô tả là bắt buộc',
            minLength: { value: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
          })}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
          aria-describedby="moTa-error"
        />
        {errors.moTa && (
          <span id="moTa-error" className="text-red-500 text-xs italic">
            {errors.moTa.message}
          </span>
        )}
      </div>
      <div className="mb-4">
        <label
          htmlFor="viTriUngCuId"
          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
        >
          Vị trí ứng cử
        </label>
        <input
          id="viTriUngCuId"
          type="number"
          {...register('viTriUngCuId', {
            required: 'Vị trí ứng cử là bắt buộc',
          })}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
          aria-describedby="viTriUngCuId-error"
        />
        {errors.viTriUngCuId && (
          <span id="viTriUngCuId-error" className="text-red-500 text-xs italic">
            {errors.viTriUngCuId.message}
          </span>
        )}
      </div>
      <div className="mb-4">
        <label
          htmlFor="image"
          className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
        >
          Hình ảnh
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
          aria-describedby="image-error"
        />
        {imageUrl && (
          <div className="mt-2 overflow-auto max-h-48">
            <img src={imageUrl} alt="Ứng viên" className="rounded w-full object-cover" />
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Lưu ứng viên
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Hủy
        </button>
      </div>
    </form>
  );
};

export default CandidateForm;
