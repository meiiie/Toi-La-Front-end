// src/api/getElections.tsx
import { Election } from './types';

export async function getElections() {
  const response = await fetch(process.env.REACT_APP_API_URL!);
  const body = (await response.json()) as unknown;
  console.log(body); // Thêm dòng này để kiểm tra phản hồi
  assertIsElections(body);
  return body;
}

export function assertIsElections(electionsData: unknown): asserts electionsData is Election[] {
  if (!Array.isArray(electionsData)) {
    throw new Error("elections isn't an array");
  }
  if (electionsData.length === 0) {
    return;
  }
  electionsData.forEach((election) => {
    if (!('id' in election)) {
      throw new Error("election doesn't contain id");
    }
    if (typeof election.id !== 'string') {
      throw new Error('id is not a string');
    }
    if (!('name' in election)) {
      throw new Error("election doesn't contain name");
    }
    if (typeof election.name !== 'string') {
      throw new Error('name is not a string');
    }
    if (!('description' in election)) {
      throw new Error("election doesn't contain description");
    }
    if (typeof election.description !== 'string') {
      throw new Error('description is not a string');
    }
    if (!('organizer' in election)) {
      throw new Error("election doesn't contain organizer");
    }
    if (typeof election.organizer !== 'string') {
      throw new Error('organizer is not a string');
    }
    if (!('voters' in election)) {
      throw new Error("election doesn't contain voters");
    }
    if (!Array.isArray(election.voters)) {
      throw new Error('voters is not an array');
    }
    if (!('candidates' in election)) {
      throw new Error("election doesn't contain candidates");
    }
    if (!Array.isArray(election.candidates)) {
      throw new Error('candidates is not an array');
    }
    if (!('status' in election)) {
      throw new Error("election doesn't contain status");
    }
    if (typeof election.status !== 'string') {
      throw new Error('status is not a string');
    }
    if (!('date' in election)) {
      throw new Error("election doesn't contain date");
    }
    if (typeof election.date !== 'string') {
      throw new Error('date is not a string');
    }
  });
}
