import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewAccountForm } from '../features/NewAccountForm';
import { registerAccount } from '../api/register';
import { NewAccountData } from '../store/types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = async (newAccount: NewAccountData) => {
    try {
      await registerAccount(newAccount);
      navigate('/login');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-md space-y-6">
        <h1 className="text-3xl font-bold text-blue-700 text-center">Tạo tài khoản mới</h1>
        <NewAccountForm onSave={handleSave} />
      </div>
    </div>
  );
};

export default RegisterPage;
