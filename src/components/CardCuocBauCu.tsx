import React from 'react';

const cardStyle = 'p-8 bg-gray-700 rounded shadow-lg transform transition duration-300';

const Card: React.FC<{
  title: string;
  icon?: JSX.Element;
  description?: string;
  delay?: number;
  children?: React.ReactNode;
}> = ({ title, icon, description, delay, children }) => (
  <div
    className={`${cardStyle} z-50 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 hover:bg-gray-800`}
    data-aos="fade-right"
    data-aos-delay={delay}
  >
    {icon}
    <h3 className="text-xl font-semibold mb-4 font-sans text-white">{title}</h3>
    {description && <p className="text-gray-200">{description}</p>}
    {children}
  </div>
);

export default Card;
