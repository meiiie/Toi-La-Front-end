import React, { useState } from 'react';

const ElectionForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(7 * 24 * 60 * 60); // Mặc định 7 ngày (tính bằng giây)
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, duration, description });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <input
        type="text"
        placeholder="Tên cuộc bầu cử"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Thời gian kéo dài (giây)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Mô tả"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <button type="submit">Tạo cuộc bầu cử</button>
    </form>
  );
};

export default ElectionForm;
