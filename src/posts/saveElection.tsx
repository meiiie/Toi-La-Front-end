// src/api/saveElection.tsx
import { NewElectionData, SavedElectionData } from './types';

export async function saveElection(newElectionData: NewElectionData) {
  const response = await fetch(process.env.REACT_APP_API_URL!, {
    method: 'POST',
    body: JSON.stringify(newElectionData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const body = (await response.json()) as unknown;
  assertIsSavedElection(body);
  return { ...newElectionData, ...body };
}

function assertIsSavedElection(election: any): asserts election is SavedElectionData {
  if (!('id' in election)) {
    throw new Error("election doesn't contain id");
  }
  if (typeof election.id !== 'string') {
    throw new Error('id is not a string');
  }
}
