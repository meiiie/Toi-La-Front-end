import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ElectionForm from './ElectionForm';
import { connectWallet } from './utils/connectWallet';
import { createElection } from './utils/createElection';

const App = () => {
  const handleSubmit = async (electionData: {
    name: string;
    date: string;
    candidates: string[];
  }) => {
    try {
      const { signer, provider } = await connectWallet();
      await createElection(signer, provider, electionData);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Lỗi: ${error.message}`);
      } else {
        toast.error('Đã xảy ra lỗi không xác định.');
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Tạo cuộc bầu cử</h1>
      <ElectionForm onSubmit={handleSubmit} />
      <ToastContainer />
    </div>
  );
};

export default App;
