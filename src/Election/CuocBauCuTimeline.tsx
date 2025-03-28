import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

interface ElectionTimelineProps {
  ngayBatDau: string;
  ngayKetThuc: string;
  formattedNgayBatDau: string;
  formattedNgayKetThuc: string;
  isPastDate: (dateString: string) => boolean;
}

const CuocBauCuTimeline: React.FC<ElectionTimelineProps> = ({
  ngayBatDau,
  ngayKetThuc,
  formattedNgayBatDau,
  formattedNgayKetThuc,
  isPastDate,
}) => {
  return (
    <div className="card mb-4">
      <h3 className="text-xl font-bold text-blue-700 mb-2">Timeline</h3>
      <div className="timeline">
        <div className={`timeline-step ${isPastDate(ngayBatDau) ? 'completed' : ''}`}>
          <div className="timeline-circle">
            {isPastDate(ngayBatDau) && <FaCheckCircle className="text-green-500" />}
          </div>
          <p className="timeline-label">Ngày bắt đầu: {formattedNgayBatDau}</p>
        </div>
        <div className={`timeline-step ${isPastDate(ngayKetThuc) ? 'completed' : ''}`}>
          <div className="timeline-circle">
            {isPastDate(ngayKetThuc) && <FaCheckCircle className="text-green-500" />}
          </div>
          <p className="timeline-label">Ngày kết thúc: {formattedNgayKetThuc}</p>
        </div>
      </div>
    </div>
  );
};

export default CuocBauCuTimeline;
