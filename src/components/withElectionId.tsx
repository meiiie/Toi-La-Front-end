// src/components/withElectionId.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

interface WithElectionIdProps {
  electionId: string;
}

const withElectionId = <P extends WithElectionIdProps>(
  WrappedComponent: React.ComponentType<P>,
) => {
  const ComponentWithElectionId = (props: Omit<P, 'electionId'>) => {
    const { id: electionId } = useParams<{ id: string }>();
    return <WrappedComponent {...(props as P)} electionId={electionId!} />;
  };

  return ComponentWithElectionId;
};

export default withElectionId;
