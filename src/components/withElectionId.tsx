import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { validateElectionId } from '../store/slice/cuocBauCuSlice';
import { AppDispatch } from '../store/store';
import { unwrapResult } from '@reduxjs/toolkit';

interface WithElectionIdProps {
  cuocBauCuId: string;
}

const withElectionId = <P extends WithElectionIdProps>(
  WrappedComponent: React.ComponentType<P>,
) => {
  const ComponentWithElectionId = (props: Omit<P, 'electionId'>) => {
    const { id: electionId } = useParams<{ id: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const [isValid, setIsValid] = useState<boolean | null>(null);

    useEffect(() => {
      const validate = async () => {
        try {
          const resultAction = await dispatch(validateElectionId(Number(electionId)));
          unwrapResult(resultAction);
          setIsValid(true);
        } catch (error) {
          setIsValid(false);
        }
      };

      if (electionId) {
        validate();
      } else {
        setIsValid(false);
      }
    }, [dispatch, electionId]);

    if (isValid === null) {
      return <div>Loading...</div>;
    }

    if (!isValid) {
      return <div>Error: Election ID is missing or invalid</div>;
    }

    return <WrappedComponent {...(props as P)} electionId={electionId} />;
  };

  return ComponentWithElectionId;
};

export default withElectionId;
