import React, { useState } from 'react';
import taoServerApi, { BlockchainResponse, CuocBauCu } from '../api/apiBlockchain/taoServerApi';

const BlockchainDeploymentTest: React.FC = () => {
  const [electionId, setElectionId] = useState<number>(0);
  const [scwAddress, setSCWAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<BlockchainResponse | null>(null);
  const [electionDetails, setElectionDetails] = useState<CuocBauCu | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchDetails = async () => {
    if (!electionId) {
      setError('Please enter a valid election ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const details = await taoServerApi.getDetails(electionId);
      setElectionDetails(details);
    } catch (err: any) {
      setError(`Error fetching election details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!electionId) {
      setError('Please enter a valid election ID');
      return;
    }

    if (!scwAddress) {
      setError('Please enter an SCW address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await taoServerApi.deployToBlockchain(electionId, scwAddress);
      setResponse(result);
    } catch (err: any) {
      setError(`Deployment error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!electionId) {
      setError('Please enter a valid election ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await taoServerApi.getBlockchainStatus(electionId);
      setResponse(result);
    } catch (err: any) {
      setError(`Status check error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!electionId) {
      setError('Please enter a valid election ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await taoServerApi.syncBlockchain(electionId);
      setResponse(result);
    } catch (err: any) {
      setError(`Sync error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-2xl font-bold mb-4 text-white">Blockchain Deployment Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 border border-gray-700 rounded bg-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-white">Deployment Controls</h2>

          <div className="mb-3">
            <label className="block mb-1 text-gray-300">Election ID:</label>
            <input
              type="number"
              value={electionId || ''}
              onChange={(e) => setElectionId(Number(e.target.value))}
              className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
            />
          </div>

          <div className="mb-3">
            <label className="block mb-1 text-gray-300">SCW Address:</label>
            <input
              type="text"
              value={scwAddress}
              onChange={(e) => setSCWAddress(e.target.value)}
              className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
              placeholder="0x..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleFetchDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={loading}
            >
              Fetch Details
            </button>
            <button
              onClick={handleDeploy}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={loading}
            >
              Deploy to Blockchain
            </button>
            <button
              onClick={handleCheckStatus}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              disabled={loading}
            >
              Check Status
            </button>
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              disabled={loading}
            >
              Sync Blockchain
            </button>
          </div>

          {loading && <div className="mt-3 text-gray-300">Loading...</div>}
          {error && <div className="mt-3 text-red-400">{error}</div>}
        </div>

        <div className="p-4 border border-gray-700 rounded bg-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-white">Election Details</h2>
          {electionDetails ? (
            <div className="space-y-2 text-gray-300">
              <p>
                <strong className="text-white">Name:</strong> {electionDetails.TenCuocBauCu}
              </p>
              <p>
                <strong className="text-white">Description:</strong> {electionDetails.MoTa}
              </p>
              <p>
                <strong className="text-white">Start Date:</strong> {electionDetails.NgayBatDau}
              </p>
              <p>
                <strong className="text-white">End Date:</strong> {electionDetails.NgayKetThuc}
              </p>
              <p>
                <strong className="text-white">Blockchain Status:</strong>{' '}
                {electionDetails.TrangThaiBlockchain}
              </p>
              <p>
                <strong className="text-white">Blockchain Address:</strong>{' '}
                {electionDetails.BlockchainAddress || 'Not deployed'}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No election details to display. Fetch details first.</p>
          )}
        </div>
      </div>

      <div className="p-4 border border-gray-700 rounded bg-gray-800">
        <h2 className="text-xl font-semibold mb-2 text-white">API Response</h2>
        {response ? (
          <div className="overflow-auto">
            <pre className="bg-gray-900 p-2 rounded text-gray-300 border border-gray-700">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-400">No response data to display yet.</p>
        )}
      </div>
    </div>
  );
};

export default BlockchainDeploymentTest;
