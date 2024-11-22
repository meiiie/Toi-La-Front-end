// src/components/ElectionsList.tsx
import React from 'react';
import { Election } from './types';

type Props = {
  elections: Election[];
};

export function ElectionsList({ elections }: Props) {
  return (
    <ul className="list-none p-4 mx-auto max-w-xl bg-gradient-to-r from-blue-100 to-pink-200 rounded-lg shadow-lg">
      {elections.map((election) => (
        <li
          key={election.id}
          className="border-b py-4 mb-4 rounded-md bg-white shadow-md px-4 transition-transform transform hover:scale-105 hover:bg-blue-50"
        >
          <h3 className="text-slate-900 font-bold text-lg">{election.name}</h3>
          <p className="text-slate-900 text-sm">{election.description}</p>
          <p className="text-slate-900 text-sm">Organizer: {election.organizer}</p>
          <p className="text-slate-900 text-sm">Status: {election.status}</p>
          <p className="text-slate-900 text-sm">
            Date:{' '}
            {new Intl.DateTimeFormat('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }).format(new Date(election.date))}
          </p>
        </li>
      ))}
    </ul>
  );
}
