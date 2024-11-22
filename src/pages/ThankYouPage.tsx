import { useNavigate } from 'react-router-dom';
import logo from '../logo.svg';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={logo} alt="Logo" className="w-48 h-48 mb-8" />
      <h1 className="text-4xl font-bold mb-4">Cảm Vì Đã Đến!</h1>
      <p className="text-lg mb-8">Chúng tôi hy vọng sẽ gặp lại bạn sớm.</p>
      <button
        onClick={handleGoHome}
        className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-700"
      >
        Quay về trang chủ
      </button>
    </div>
  );
};

export default ThankYouPage;
