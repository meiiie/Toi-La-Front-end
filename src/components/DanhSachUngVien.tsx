// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState, AppDispatch } from '../store/store';
// import { fetchCacUngCuVie } from '../store/slice/ungCuVienSlice';
// import { useSwipeable } frnom 'react-swipeable';

// interface DanhSachUngVienProps {
//   electionId: number;
// }

// const DanhSachUngVien: React.FC<DanhSachUngVienProps> = ({ electionId }) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const candidates = useSelector((state: RootState) => state.ungCuVien.cacUngCuVien);

//   const dangTai = useSelector((state: RootState) => state.ungCuVien.dangTai);
//   const [expandedCandidateId, setExpandedCandidateId] = useState<number | null>(null);

//   useEffect(() => {
//     dispatch(fetchCacUngCuVien(electionId));
//   }, [dispatch, electionId]);

//   const toggleDescription = (id: number) => {
//     setExpandedCandidateId(expandedCandidateId === id ? null : id);
//   };

//   const truncateText = (text: string, length: number) => {
//     return text.length > length ? text.substring(0, length) + '...' : text;
//   };

//   const swipeHandlers = useSwipeable({
//     onSwipedLeft: (eventData) => console.log('Swiped left!', eventData),
//     onSwipedRight: (eventData) => console.log('Swiped right!', eventData),
//     preventScrollOnSwipe: true,
//     trackMouse: true,
//   });

//   if (dangTai) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="spinner border-t-4 border-blue-500 rounded-full w-16 h-16 animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <div
//       {...swipeHandlers}
//       className="scroll-area overflow-x-auto p-4"
//       style={{ scrollSnapType: 'x mandatory' }}
//     >
//       <div className="flex space-x-4">
//         {candidates.map((candidate) => (
//           <figure
//             key={candidate.id}
//             className="w-32 md:w-48 p-4 bg-white shadow-lg rounded-lg text-center flex-shrink-0 transform transition-transform hover:scale-105 hover:shadow-xl"
//             style={{ scrollSnapAlign: 'start' }}
//           >
//             <img
//               src={candidate.anh}
//               alt={`${candidate.ho} ${candidate.ten}`}
//               className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full mb-4"
//               loading="lazy"
//               width="128"
//               height="128"
//             />
//             <figcaption>
//               <h3 className="text-lg font-bold mb-2">{`${candidate.ho} ${candidate.ten}`}</h3>
//               <p className="text-gray-700 mb-2">
//                 {expandedCandidateId === candidate.id
//                   ? candidate.moTa
//                   : truncateText(candidate.moTa, 70)}
//                 {candidate.moTa.length > 70 && (
//                   <span
//                     onClick={() => toggleDescription(candidate.id)}
//                     className="text-blue-500 cursor-pointer"
//                   >
//                     {expandedCandidateId === candidate.id ? ' Ẩn bớt' : ' xem thêm'}
//                   </span>
//                 )}
//               </p>
//               <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors">
//                 Tìm hiểu thêm
//               </button>
//             </figcaption>
//           </figure>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default DanhSachUngVien;
