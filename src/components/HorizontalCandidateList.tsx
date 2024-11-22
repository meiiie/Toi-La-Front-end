// src/components/HorizontalCandidateList.tsx
import React, { useState } from 'react';
import { Candidate } from '../store/types';
import { useSwipeable } from 'react-swipeable';

interface HorizontalCandidateListProps {
  candidates: Candidate[];
}

const HorizontalCandidateList: React.FC<HorizontalCandidateListProps> = ({ candidates }) => {
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  const toggleDescription = (id: string) => {
    setExpandedCandidateId(expandedCandidateId === id ? null : id);
  };

  const truncateText = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => console.log('Swiped left!', eventData),
    onSwipedRight: (eventData) => console.log('Swiped right!', eventData),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div
      {...swipeHandlers}
      className="scroll-area overflow-x-auto p-4"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      <div className="flex space-x-4">
        {candidates.map((candidate) => (
          <figure
            key={candidate.id}
            className="w-32 md:w-48 p-4 bg-white shadow-lg rounded-lg text-center flex-shrink-0 transform transition-transform hover:scale-105 hover:shadow-xl"
            style={{ scrollSnapAlign: 'start' }}
          >
            <img
              src={candidate.imageUrl}
              alt={candidate.name}
              className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full mb-4"
              loading="lazy"
              width="128"
              height="128"
            />
            <figcaption>
              <h3 className="text-lg font-bold mb-2">{candidate.name}</h3>
              <p className="text-gray-700 mb-2">
                {expandedCandidateId === candidate.id
                  ? candidate.description
                  : truncateText(candidate.description, 70)}
                {candidate.description.length > 70 && (
                  <span
                    onClick={() => toggleDescription(candidate.id)}
                    className="text-blue-500 cursor-pointer"
                  >
                    {expandedCandidateId === candidate.id ? ' Ẩn bớt' : ' xem thêm'}
                  </span>
                )}
              </p>
              <p className="text-gray-700 italic mb-4">
                {expandedCandidateId === candidate.id
                  ? candidate.pledge
                  : truncateText(candidate.pledge, 30)}
                {candidate.pledge.length > 30 && (
                  <span
                    onClick={() => toggleDescription(candidate.id)}
                    className="text-blue-500 cursor-pointer"
                  >
                    {expandedCandidateId === candidate.id ? ' Ẩn bớt' : ' xem thêm'}
                  </span>
                )}
              </p>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors">
                Tìm hiểu thêm
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
};

export default HorizontalCandidateList;
