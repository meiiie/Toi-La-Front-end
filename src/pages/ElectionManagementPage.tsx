// src/pages/ElectionManagementPage.tsx
import React, { useState, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import TienHanhBauCu from './TienHanhBauCu';

const ElectionRoleForm = React.lazy(() => import('../components/ElectionRoleForm'));
const CandidateManagement = React.lazy(() => import('../pages/CandidateManagement'));
const VoterManagement = React.lazy(() => import('../pages/VoterManagement'));
const EditElectionPage = React.lazy(() => import('./EditElectionPage'));

const ElectionManagementPage: React.FC = () => {
  const { id: electionId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);

  const handleTabChange = (tab: string) => {
    setLoading(true);
    setActiveTab(tab);
    setTimeout(() => setLoading(false), 500); // Simulate loading time
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
        </div>
      );
    }
    switch (activeTab) {
      case 'details':
        return <TienHanhBauCu />;
      case 'edit':
        return <EditElectionPage />;
      case 'candidates':
        return <CandidateManagement electionId={electionId!} />;
      case 'voters':
        return <VoterManagement electionId={electionId!} darkMode={false} />;
      case 'roles':
        return <ElectionRoleForm electionId={electionId!} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 bg-gray-50">
      <Helmet>
        <title>Quản lý phiên bầu cử</title>
        <meta
          name="description"
          content="Trang quản lý các chi tiết, ứng viên, cử tri và vai trò cho phiên bầu cử."
        />
        <link
          rel="preload"
          href="/path/to/critical/font.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/path/to/critical/script.js" as="script" />
      </Helmet>
      <h1 className="text-xl md:text-3xl font-bold mb-4 text-center text-gray-700">
        Quản lý phiên bầu cử
      </h1>
      <div className="tabs flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4 justify-center">
        <button
          onClick={() => handleTabChange('details')}
          className={`tab px-4 py-2 rounded-t-lg transition-colors duration-300 hover:bg-blue-600 ${
            activeTab === 'details'
              ? 'bg-blue-500 text-white border-b-2 border-blue-700'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Chi tiết
        </button>
        <button
          onClick={() => handleTabChange('edit')}
          className={`tab px-4 py-2 rounded-t-lg transition-colors duration-300 hover:bg-blue-600 ${
            activeTab === 'edit'
              ? 'bg-blue-500 text-white border-b-2 border-blue-700'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Chỉnh sửa
        </button>
        <button
          onClick={() => handleTabChange('candidates')}
          className={`tab px-4 py-2 rounded-t-lg transition-colors duration-300 hover:bg-blue-600 ${
            activeTab === 'candidates'
              ? 'bg-blue-500 text-white border-b-2 border-blue-700'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Ứng viên
        </button>
        <button
          onClick={() => handleTabChange('voters')}
          className={`tab px-4 py-2 rounded-t-lg transition-colors duration-300 hover:bg-blue-600 ${
            activeTab === 'voters'
              ? 'bg-blue-500 text-white border-b-2 border-blue-700'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Cử tri
        </button>
        <button
          onClick={() => handleTabChange('roles')}
          className={`tab px-4 py-2 rounded-t-lg transition-colors duration-300 ${
            activeTab === 'roles'
              ? 'bg-blue-500 text-white border-b-2 border-blue-700'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Vai trò
        </button>
      </div>
      <div className="tab-content">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700">
          {activeTab === 'details' && 'Chi tiết'}
          {activeTab === 'edit' && 'Chỉnh sửa'}
          {activeTab === 'candidates' && 'Ứng viên'}
          {activeTab === 'voters' && 'Cử tri'}
          {activeTab === 'roles' && 'Vai trò'}
        </h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default ElectionManagementPage;
