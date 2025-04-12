import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import apiClient from '../api/apiClient';

// Khai báo kiểu dữ liệu cho cuộc bầu cử từ blockchain
interface ElectionBlockchainInfo {
  serverId: number;
  contractAddress: string;
  name: string;
  description: string;
  status: number;
  creatorAddress: string;
}

// Khai báo kiểu dữ liệu cho cuộc bầu cử từ database
interface ElectionDbInfo {
  id: number;
  tenCuocBauCu: string;
  blockchainAddress: string;
  blockchainServerId?: number;
  trangThaiBlockchain: number;
}

// ABI của Factory (chỉ những hàm cần thiết)
const factoryABI = [
  'function layServerCuaNguoiDung(address nguoiDung) external view returns (uint256[] memory)',
  'function layThongTinServer(uint128 id) view returns (address quanLyCuocBauCu, string memory tenCuocBauCu, string memory moTa, uint8 trangThai, uint64 soLuongBaoCao, uint64 soLuongViPhamXacNhan, address nguoiTao)',
];

const BlockchainSyncTool: React.FC = () => {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [factoryAddress, setFactoryAddress] = useState<string>('');
  const [userAddress, setUserAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingElections, setIsLoadingElections] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [userElections, setUserElections] = useState<ElectionBlockchainInfo[]>([]);
  const [dbElections, setDbElections] = useState<ElectionDbInfo[]>([]);
  const [syncResults, setSyncResults] = useState<
    { id: number; success: boolean; message: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<'blockchain' | 'sql'>('blockchain');
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false);

  // Khởi tạo provider khi component mount
  useEffect(() => {
    try {
      const rpcUrl = 'https://geth.holihu.online/rpc';
      const newProvider = new ethers.JsonRpcProvider(rpcUrl);
      setProvider(newProvider);

      // Tải danh sách cuộc bầu cử từ database khi component mount
      loadDbElections();
    } catch (err: any) {
      setError(`Lỗi kết nối RPC: ${err.message}`);
    }
  }, []);

  // Tải danh sách cuộc bầu cử từ database
  const loadDbElections = async (): Promise<void> => {
    try {
      setIsLoadingElections(true);
      const response = await apiClient.get<ElectionDbInfo[]>('/api/CuocBauCu/all');
      setDbElections(response.data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách từ database:', err.message);
    } finally {
      setIsLoadingElections(false);
    }
  };

  // Kết nối với Factory contract
  const connectToFactory = async (): Promise<void> => {
    if (!provider || !factoryAddress) {
      setError('Vui lòng nhập địa chỉ Factory và đảm bảo provider được khởi tạo');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const contract = new ethers.Contract(factoryAddress, factoryABI, provider);

      // Kiểm tra xem contract có tồn tại không bằng cách gọi một hàm
      await contract.getAddress();

      setFactoryContract(contract);

      // Nếu đã có userAddress, tự động load danh sách
      if (userAddress) {
        await getUserElections();
      }
    } catch (err: any) {
      setError(`Lỗi kết nối với Factory contract: ${err.message}`);
      setFactoryContract(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy địa chỉ ví từ localStorage (nếu đã đăng nhập)
  const getWalletFromStorage = (): string => {
    try {
      // Kiểm tra xem localStorage có thông tin ví không
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        if (userData.wallet) {
          return userData.wallet;
        }
      }
    } catch (err) {
      console.error('Lỗi khi lấy địa chỉ ví từ localStorage:', err);
    }
    return '';
  };

  // Lấy danh sách cuộc bầu cử của người dùng từ blockchain
  const getUserElections = async (): Promise<void> => {
    if (!factoryContract) {
      setError('Chưa kết nối với Factory contract');
      return;
    }

    if (!userAddress || !ethers.isAddress(userAddress)) {
      setError('Địa chỉ người dùng không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setUserElections([]);

      // Dùng hàm có sẵn trong Factory để lấy danh sách ID cuộc bầu cử
      const electionIds = await factoryContract.layServerCuaNguoiDung(userAddress);
      console.log('IDs từ blockchain:', electionIds);

      const elections: ElectionBlockchainInfo[] = [];

      // Lấy thông tin chi tiết cho từng ID
      for (const id of electionIds) {
        try {
          const info = await factoryContract.layThongTinServer(id);

          elections.push({
            serverId: Number(id),
            contractAddress: info[0], // quanLyCuocBauCu
            name: info[1], // tenCuocBauCu
            description: info[2], // moTa
            status: Number(info[3]), // trangThai
            creatorAddress: info[6], // nguoiTao
          });
        } catch (err: any) {
          console.warn(`Lỗi khi lấy thông tin cho ID ${id}:`, err.message);
        }
      }

      setUserElections(elections);
    } catch (err: any) {
      setError(`Lỗi khi lấy danh sách cuộc bầu cử: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Tìm thông tin cuộc bầu cử trong database từ địa chỉ contract và serverId
  const findDbElectionByAddress = (
    contractAddress: string,
    serverId: number,
  ): ElectionDbInfo | null => {
    if (!dbElections || !Array.isArray(dbElections) || dbElections.length === 0) return null;

    try {
      // Tìm kiếm theo địa chỉ contract (cách chính xác)
      let foundElection = dbElections.find(
        (e) =>
          e &&
          e.blockchainAddress &&
          typeof e.blockchainAddress === 'string' &&
          e.blockchainAddress.toLowerCase() === contractAddress.toLowerCase(),
      );

      // Nếu không tìm thấy theo địa chỉ, thử tìm theo serverId
      if (!foundElection) {
        foundElection = dbElections.find((e) => e && e.blockchainServerId === serverId);
      }

      return foundElection || null;
    } catch (err) {
      console.error('Lỗi khi tìm cuộc bầu cử trong database:', err);
      return null;
    }
  };

  // Đồng bộ một cuộc bầu cử vào database
  const syncElectionToDb = async (electionId: number, serverId: number): Promise<void> => {
    try {
      setIsSyncing(true);
      // Gọi API để cập nhật serverId
      const response = await apiClient.post(`/api/CuocBauCu/syncServerId/${electionId}`, {
        serverId: serverId,
      });

      // Cập nhật kết quả đồng bộ
      setSyncResults((prev) => [
        {
          id: electionId,
          success: response.data.success,
          message: response.data.message,
        },
        ...prev,
      ]);

      // Tải lại dữ liệu từ database
      await loadDbElections();

      // Hiển thị thông báo
      if (response.data.success) {
        alert(`Đã đồng bộ thành công ServerId ${serverId} cho cuộc bầu cử ID ${electionId}`);
      } else {
        alert(`Lỗi: ${response.data.message}`);
      }
    } catch (err: any) {
      setSyncResults((prev) => [
        {
          id: electionId,
          success: false,
          message: `Lỗi: ${err.message}`,
        },
        ...prev,
      ]);
      alert(`Lỗi khi đồng bộ: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Đồng bộ tất cả cuộc bầu cử của người dùng
  const syncAllByCreator = async (): Promise<void> => {
    if (!userAddress || !ethers.isAddress(userAddress)) {
      setError('Địa chỉ người dùng không hợp lệ');
      return;
    }

    try {
      setIsSyncing(true);
      setError('');

      // Gọi API để đồng bộ tất cả cuộc bầu cử của người dùng kèm tham số ghi đè
      const response = await apiClient.post(
        `/api/CuocBauCu/syncByNameForCreator/${userAddress}?overwriteExisting=${overwriteExisting}`,
      );

      // Cập nhật kết quả
      if (response.data.success) {
        alert(
          `Đã đồng bộ ${response.data.syncCount}/${response.data.totalFound || 'tổng số'} cuộc bầu cử từ blockchain vào SQL.`,
        );
      } else {
        setError(response.data.message || 'Đồng bộ không thành công');
      }

      // Tải lại dữ liệu từ cả hai nguồn
      await loadDbElections();
      await getUserElections(); // Làm mới danh sách blockchain

      // Log chi tiết
      console.log('Kết quả đồng bộ:', response.data);
    } catch (err: any) {
      setError(`Lỗi khi đồng bộ: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Đồng bộ tất cả các cuộc bầu cử thiếu ServerId
  const syncAllMissingServerIds = async (): Promise<void> => {
    try {
      setIsSyncing(true);
      setError('');

      // Gọi API để đồng bộ tất cả
      const response = await apiClient.post('/api/CuocBauCu/syncAllServerIds');

      // Hiển thị kết quả
      alert(
        `Đồng bộ hoàn tất: ${response.data.successCount}/${response.data.totalProcessed} thành công`,
      );

      // Tải lại dữ liệu từ database
      await loadDbElections();
    } catch (err: any) {
      setError(`Lỗi khi đồng bộ: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cập nhật tất cả địa chỉ contract
  const updateAllContractAddresses = async (): Promise<void> => {
    try {
      setIsSyncing(true);
      setError('');

      // Gọi API để cập nhật tất cả địa chỉ contract
      const response = await apiClient.post('/api/CuocBauCu/updateAllContractAddresses');

      // Hiển thị thông báo kết quả
      if (response.data.success) {
        alert(`${response.data.message}`);

        // Tải lại dữ liệu
        await loadDbElections();
        await getUserElections(); // Làm mới danh sách blockchain
      } else {
        setError(response.data.message || 'Cập nhật không thành công');
      }

      console.log('Chi tiết cập nhật:', response.data);
    } catch (err: any) {
      setError(`Lỗi khi cập nhật địa chỉ contract: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Tìm địa chỉ ví khi trang load
  useEffect(() => {
    // Tự động điền địa chỉ ví từ localStorage nếu có
    const savedWallet = getWalletFromStorage();
    if (savedWallet) {
      setUserAddress(savedWallet);
    }
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-2 text-blue-700">Công cụ đồng bộ ServerId Blockchain</h1>
      <p className="text-gray-600 mb-6">
        Công cụ này giúp đồng bộ ServerId từ blockchain vào cơ sở dữ liệu SQL.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Kết nối Factory */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">1. Kết nối Factory Contract</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 border rounded"
            placeholder="Địa chỉ Factory Contract"
            value={factoryAddress}
            onChange={(e) => setFactoryAddress(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={connectToFactory}
            disabled={isLoading || !factoryAddress}
          >
            {isLoading ? 'Đang kết nối...' : 'Kết nối'}
          </button>
        </div>
        {factoryContract && (
          <div className="mt-2 text-green-600">✅ Đã kết nối với Factory Contract</div>
        )}
      </div>

      {/* Nhập địa chỉ người dùng */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">2. Nhập địa chỉ người dùng</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 border rounded"
            placeholder="Địa chỉ người dùng (ví dụ: 0x8Ab98b94495b3447a2bc9B2fB003336e82698b85)"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            onClick={getUserElections}
            disabled={isLoading || !factoryContract || !userAddress}
          >
            {isLoading ? 'Đang tải...' : 'Tìm kiếm'}
          </button>
        </div>
      </div>

      {/* Công cụ bổ sung */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Công cụ bổ sung</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            onClick={updateAllContractAddresses}
            disabled={isSyncing}
          >
            {isSyncing ? 'Đang cập nhật...' : 'Cập nhật địa chỉ contract'}
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            onClick={() => {
              loadDbElections();
              getUserElections();
            }}
            disabled={isSyncing || isLoading}
          >
            {isLoading ? 'Đang tải...' : 'Làm mới tất cả dữ liệu'}
          </button>
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              className="mr-2"
            />
            <span>Ghi đè ServerId đã tồn tại</span>
          </label>
        </div>
      </div>

      {/* Tab để chuyển đổi giữa xem blockchain và SQL */}
      {(userElections.length > 0 || dbElections.length > 0) && (
        <div className="mb-4 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                className={`inline-block p-4 ${
                  activeTab === 'blockchain'
                    ? 'text-blue-600 border-b-2 border-blue-600 rounded-t-lg active'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('blockchain')}
              >
                Dữ liệu Blockchain
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 ${
                  activeTab === 'sql'
                    ? 'text-blue-600 border-b-2 border-blue-600 rounded-t-lg active'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('sql')}
              >
                Dữ liệu SQL
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Hiển thị danh sách cuộc bầu cử từ blockchain */}
      {activeTab === 'blockchain' && userElections.length > 0 && (
        <div className="mb-6 p-4 border rounded">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">
              Cuộc bầu cử trên Blockchain ({userElections.length})
            </h2>
            <button
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
              onClick={syncAllByCreator}
              disabled={isSyncing}
            >
              {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ tất cả vào SQL'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Server ID</th>
                  <th className="p-2 border">Tên cuộc bầu cử</th>
                  <th className="p-2 border">Địa chỉ contract</th>
                  <th className="p-2 border">Trạng thái</th>
                  <th className="p-2 border">SQL ID</th>
                  <th className="p-2 border">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {userElections.map((election) => {
                  // Tìm thông tin trong database - sử dụng cả địa chỉ và serverId
                  const dbElection = findDbElectionByAddress(
                    election.contractAddress,
                    election.serverId,
                  );
                  const isInDb = dbElection !== null;
                  const hasServerId =
                    isInDb && dbElection && (dbElection.blockchainServerId || 0) > 0;

                  return (
                    <tr
                      key={election.serverId}
                      className={
                        isInDb ? (hasServerId ? 'bg-green-50' : 'bg-yellow-50') : 'bg-gray-50'
                      }
                    >
                      <td className="p-2 border text-center">{election.serverId}</td>
                      <td className="p-2 border">{election.name}</td>
                      <td className="p-2 border">
                        <span className="text-xs break-all">{election.contractAddress}</span>
                      </td>
                      <td className="p-2 border text-center">
                        {election.status === 0 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Hoạt động
                          </span>
                        ) : election.status === 1 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Tạm dừng
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            Lưu trữ
                          </span>
                        )}
                      </td>
                      <td className="p-2 border text-center">
                        {isInDb && dbElection ? (
                          <span className="font-semibold">{dbElection.id}</span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-2 border text-center">
                        {isInDb && dbElection ? (
                          hasServerId ? (
                            <span className="text-green-600">✓ Đã đồng bộ</span>
                          ) : (
                            <button
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                              onClick={() => syncElectionToDb(dbElection.id, election.serverId)}
                              disabled={isSyncing}
                            >
                              Đồng bộ
                            </button>
                          )
                        ) : (
                          <span className="text-gray-400">Chưa có trong SQL</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hiển thị danh sách cuộc bầu cử từ SQL */}
      {activeTab === 'sql' && (
        <div className="mb-6 p-4 border rounded">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Cuộc bầu cử trong SQL ({dbElections.length})</h2>
            <button
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
              onClick={syncAllMissingServerIds}
              disabled={isSyncing || isLoadingElections}
            >
              {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ tất cả thiếu ServerId'}
            </button>
          </div>

          {isLoadingElections ? (
            <div className="p-4 text-center">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">SQL ID</th>
                    <th className="p-2 border">Tên cuộc bầu cử</th>
                    <th className="p-2 border">Địa chỉ Blockchain</th>
                    <th className="p-2 border">Server ID</th>
                    <th className="p-2 border">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {dbElections.map((election) => (
                    <tr
                      key={election.id}
                      className={election.blockchainServerId ? 'bg-green-50' : 'bg-gray-50'}
                    >
                      <td className="p-2 border text-center">{election.id}</td>
                      <td className="p-2 border">{election.tenCuocBauCu}</td>
                      <td className="p-2 border">
                        <span className="text-xs break-all">
                          {election.blockchainAddress || 'N/A'}
                        </span>
                      </td>
                      <td className="p-2 border text-center">
                        {election.blockchainServerId ? (
                          <span className="font-semibold">{election.blockchainServerId}</span>
                        ) : (
                          <span className="text-red-500">Chưa đồng bộ</span>
                        )}
                      </td>
                      <td className="p-2 border text-center">
                        {election.trangThaiBlockchain === 0 ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                            Chưa triển khai
                          </span>
                        ) : election.trangThaiBlockchain === 1 ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Đang triển khai
                          </span>
                        ) : election.trangThaiBlockchain === 2 ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Đã triển khai
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            Thất bại
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hiển thị kết quả đồng bộ */}
      {syncResults.length > 0 && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-3">Kết quả đồng bộ gần đây</h2>
          <div className="space-y-2">
            {syncResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <strong>ID {result.id}:</strong> {result.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-gray-500 text-sm mt-8">
        <p>RPC: https://geth.holihu.online/rpc (ChainID: 210)</p>
        <p className="mt-1">Hướng dẫn:</p>
        <ol className="list-decimal ml-5 mt-1">
          <li>Nhập địa chỉ Factory Contract và kết nối</li>
          <li>Nhập địa chỉ ví người dùng để tìm cuộc bầu cử</li>
          <li>Đồng bộ từng cuộc bầu cử hoặc tất cả vào SQL</li>
        </ol>
      </div>
    </div>
  );
};

export default BlockchainSyncTool;
