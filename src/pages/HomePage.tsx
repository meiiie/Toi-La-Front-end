import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setElections } from '../store/electionSlice';
import { getElections } from '../api/electionApi';
import Pagination from '../components/Pagination';
import { RootState } from './../store/store';
import { Election } from '../store/types';

const HomePage = () => {
  const dispatch = useDispatch();
  const elections = useSelector((state: RootState) => state.elections.elections);
  const [searchParams] = useSearchParams();
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchElections = async () => {
      const data = await getElections();
      dispatch(setElections(data));
    };

    fetchElections();
  }, [dispatch]);

  const filteredElections = elections.filter((election: Election) => {
    const search = searchParams.get('search');
    if (!search) return true;
    return election.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="text-center p-4 h-18 bg-gradient-to-r from-white via-purple-200 to-purple-300">
      <div className="w-full bg-white rounded-full outline outline-offset-2 outline-4 outline-pink-500 px-4 py-4 mb-10 shadow-lg shadow-indigo-500/40">
        <h1 className="text-3xl font-press-start font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
          Chào Mừng Tới Bầu Cử Blockchain!
        </h1>
      </div>
      <Pagination filteredElections={filteredElections} itemsPerPage={itemsPerPage} />
    </div>
  );
};

export default HomePage;
