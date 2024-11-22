import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import NotificationModal from '../components/NotificationModal';
import { Election } from '../store/types';

const ElectionCard: React.FC<Election> = ({
  id,
  name,
  description,
  organizer,
  voters,
  candidates,
  status,
  startDate,
  endDate,
  date,
  imageUrl,
}) => {
  const defaultImageUrl = imageUrl || './tai_xuong.jpg';
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const user = useSelector((state: RootState) => state.users.user);
  const navigate = useNavigate();

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const handleViewDetails = () => {
    if (!user) {
      setShowNotification(true);
    } else {
      navigate(`/app/elections/${id}`);
    }
  };

  const truncatedDescription =
    description.length > 25 ? description.substring(0, 25) + '...' : description;

  return (
    <div className="border p-6 rounded-lg shadow-lg relative w-full max-w-md bg-white hover:bg-indigo-100 transition duration-300 ease-in-out font-sans">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">{name}</h3>

      {/* Ảnh bo tròn nằm giữa sau tên, bo viền gradient */}
      {defaultImageUrl && (
        <div className="w-full h-48 mb-4 relative overflow-hidden rounded-lg">
          <div className="w-full h-full rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105">
            <img
              src={defaultImageUrl}
              alt={`Ảnh của ${name}`}
              className="w-full h-full object-cover rounded-lg border-4 border-gradient-to-r from-[#F88195] to-[#C06C84]"
            />
            <div className="absolute inset-0 rounded-lg border-4 border-transparent bg-gradient-to-r from-[#F88195] to-[#C06C84] opacity-15"></div>
          </div>
        </div>
      )}

      {/* Mô tả cuộc bầu cử */}
      <p className="text-gray-700 mb-6 text-left text-m">
        {showFullDescription ? description : truncatedDescription}
        {description.length > 25 && (
          <span onClick={toggleDescription} className="text-[#F67280] cursor-pointer">
            {showFullDescription ? ' Ẩn bớt' : ' xem thêm'}
          </span>
        )}
      </p>

      {/* Ngày bắt đầu, chỉnh sửa vị trí để nằm cách lề trái */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-violet-800 border-solid border-2 border-sky-300 rounded-full px-2 py-1 text-xs">
          {new Date(startDate).toLocaleString()}
        </span>

        {/* Nút Xem thêm chi tiết */}
        <button
          onClick={handleViewDetails}
          className="relative inline-flex items-center justify-center p-2 overflow-hidden font-medium text-white transition duration-300 ease-in-out bg-[#F67280] rounded-full group"
        >
          <span className="absolute w-0 h-0 transition-all duration-300 ease-in-out bg-rose-700 rounded-full group-hover:w-56 group-hover:h-56"></span>
          <span className="relative z-10">Xem thêm chi tiết</span>
        </button>
      </div>

      {showNotification && (
        <NotificationModal
          title="Thông báo"
          message="Bạn cần đăng nhập để xem chi tiết"
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
};

export default ElectionCard;
