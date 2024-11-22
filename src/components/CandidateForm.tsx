import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Candidate } from '../store/types';

interface CandidateFormProps {
  onSave: (data: Candidate) => void;
  onCancel: () => void;
}

const CandidateForm: React.FC<CandidateFormProps> = ({ onSave, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Candidate>();
  const [imageUrl, setImageUrl] = useState<string>('');

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

  const onSubmit = (data: Candidate) => {
    data.imageUrl = imageUrl;
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Tên</label>
        <input
          {...register('name', {
            required: 'Tên là bắt buộc',
            minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' },
          })}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        {errors.name && <span className="text-red-500 text-xs italic">{errors.name.message}</span>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Mô tả</label>
        <textarea
          {...register('description', {
            required: 'Mô tả là bắt buộc',
            minLength: { value: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
          })}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        {errors.description && (
          <span className="text-red-500 text-xs italic">{errors.description.message}</span>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Cam kết</label>
        <textarea
          {...register('pledge', {
            required: 'Cam kết là bắt buộc',
            minLength: { value: 20, message: 'Cam kết phải có ít nhất 20 ký tự' },
          })}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        {errors.pledge && (
          <span className="text-red-500 text-xs italic">{errors.pledge.message}</span>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Hình ảnh</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        {imageUrl && <img src={imageUrl} alt="Ứng viên" className="mt-2 rounded" />}
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
