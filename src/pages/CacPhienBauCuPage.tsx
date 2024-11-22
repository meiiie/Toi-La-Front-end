import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ElectionCard from '../features/ElectionCard';
import axios from 'axios';
import { Election } from '../store/types';

const CacPhienBauCuPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cacPhienBauCu, setCacPhienBauCu] = useState<Election[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('http://localhost:3001/elections');
        setCacPhienBauCu(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, []);

  function locCacPhienBauCu() {
    const search = searchParams.get('search');
    if (search === null || search === '') {
      return cacPhienBauCu;
    } else {
      return cacPhienBauCu.filter(
        (phienBauCu) => phienBauCu.name.toLowerCase().indexOf(search.toLowerCase()) > -1,
      );
    }
  }

  return (
    <div className="text-center p-5">
      <h2 className="text-4xl font-bold text-slate-600">Các Danh Mục</h2>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locCacPhienBauCu().map((phienBauCu) => (
          <ElectionCard
            key={phienBauCu.id}
            id={phienBauCu.id}
            name={phienBauCu.name}
            description={phienBauCu.description}
            date={phienBauCu.date}
            organizer={phienBauCu.organizer}
            status={phienBauCu.status}
            voters={phienBauCu.voters}
            candidates={phienBauCu.candidates}
            startDate={phienBauCu.startDate}
            endDate={phienBauCu.endDate}
          />
        ))}
      </div>
    </div>
  );
};

export default CacPhienBauCuPage;
