import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { AppDispatch } from '../store/store';
import { unwrapResult } from '@reduxjs/toolkit';

interface WithPhienBauCuIdProps {
  phienBauCuId: string;
}

const withPhienBauCuId = <P extends object>(
  WrappedComponent: React.ComponentType<P & WithPhienBauCuIdProps>,
) => {
  const ComponentWithPhienBauCuId = (props: P) => {
    const { idPhien: phienBauCuId } = useParams<{ idPhien: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const [isValid, setIsValid] = useState<boolean | null>(null);

    useEffect(() => {
      const validate = async () => {
        try {
          const resultAction = await dispatch(fetchPhienBauCuById(Number(phienBauCuId)));
          unwrapResult(resultAction);
          setIsValid(true);
        } catch (error) {
          setIsValid(false);
        }
      };

      if (phienBauCuId) {
        validate();
      } else {
        setIsValid(false);
      }
    }, [dispatch, phienBauCuId]);

    if (isValid === null) {
      return <div>Loading...</div>;
    }

    if (!isValid) {
      return <div>Error: Phien Bau Cu ID is missing or invalid</div>;
    }

    return phienBauCuId ? <WrappedComponent {...props} phienBauCuId={phienBauCuId} /> : null;
  };

  return ComponentWithPhienBauCuId;
};

export default withPhienBauCuId;
