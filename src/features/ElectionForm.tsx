// src/components/ElectionForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { NewElectionData, Election } from '../store/types';

interface ElectionFormProps {
  onSave: (data: NewElectionData) => Promise<Election>;
  initialData?: Election | null;
}

const ElectionForm: React.FC<ElectionFormProps> = ({ onSave, initialData }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewElectionData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || '');

  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name);
      setValue('description', initialData.description);
      setValue('organizer', initialData.organizer);
      setValue('startDate', initialData.startDate);
      setValue('endDate', initialData.endDate);
      setValue('status', initialData.status);
      setValue('imageUrl', initialData.imageUrl || '');
    }
  }, [initialData, setValue]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
        setValue('imageUrl', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitForm = async (data: NewElectionData) => {
    const savedElection = await onSave(data); // onSave nên trả về election với id
    if (savedElection && savedElection.id) {
      navigate(`/app/user-elections/elections/${savedElection.id}/election-management`);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-3xl w-full">
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Thông tin phiên bầu cử</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Tên Phiên Bầu Cử</label>
            <input
              {...register('name', { required: 'You must enter the election name' })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.name && (
              <span className="text-red-500 text-xs italic">{errors.name.message}</span>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Người tổ chức</label>
            <input
              {...register('organizer', { required: 'You must enter the organizer' })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.organizer && (
              <span className="text-red-500 text-xs italic">{errors.organizer.message}</span>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Mô tả</label>
            <textarea
              {...register('description', { required: 'You must enter the description' })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.description && (
              <span className="text-red-500 text-xs italic">{errors.description.message}</span>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Ngày bắt đầu</label>
            <input
              type="datetime-local"
              {...register('startDate', { required: 'You must enter the start date and time' })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.startDate && (
              <span className="text-red-500 text-xs italic">{errors.startDate.message}</span>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Ngày kết thúc</label>
            <input
              type="datetime-local"
              {...register('endDate', { required: 'You must enter the end date and time' })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.endDate && (
              <span className="text-red-500 text-xs italic">{errors.endDate.message}</span>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Trạng thái</label>
            <select
              {...register('status', { required: 'You must select a status' })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="" hidden></option>
              <option value="ongoing">Diễn Ra</option>
              <option value="upcoming">Sắp Diên Rã</option>
              <option value="completed">Hoàn Thành</option>
            </select>
            {errors.status && (
              <span className="text-red-500 text-xs italic">{errors.status.message}</span>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2" />
            {imageUrl && <img src={imageUrl} alt="Election" className="mt-2 rounded" />}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
          >
            {initialData ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ElectionForm;
