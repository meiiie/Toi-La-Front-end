import React, { useState } from 'react';
import { sendTransaction, getBalance } from './testWeb3fake';

const He: React.FC = () => {
  const [balance, setBalance] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState<string>('');

  const handleSendTransaction = async () => {
    try {
      const fromAccount = '0x5EdAf1E24a66B5d0451c9BBD439A38f24c73Ba3F'; // Source account
      const toAccount = '0x1c2eA9cAA694f72E14F3D3eB78BaA6Be5c469302'; // Destination account
      const amount = '0.1'; // Amount of ETH to send

      // Send transaction
      const txHash = await sendTransaction(fromAccount, toAccount, amount, passphrase);
      setTxHash(txHash);

      // Get the new balance of the source account after sending
      const newBalance = await getBalance(fromAccount);
      setBalance(newBalance);
    } catch (error) {
      if ((error as any).message.includes('could not decrypt key with given password')) {
        console.error('Invalid passphrase. Please try again.');
        alert('Invalid passphrase. Please try again.');
      } else if ((error as any).message.includes('transaction indexing is in progress')) {
        console.error('Transaction indexing is in progress. Please try again later.');
        alert('Transaction indexing is in progress. Please try again later.');
      } else {
        console.error('Transaction failed', error);
        alert('Transaction failed. Please try again.');
      }
    }
  };

  return (
    <div className="App">
      <h1>Ethereum Transaction Example</h1>
      <input
        type="password"
        placeholder="Enter passphrase"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />
      <button onClick={handleSendTransaction}>Send 0.1 ETH</button>
      {balance && <p>Balance: {balance} ETH</p>}
      {txHash && <p>Transaction Hash: {txHash}</p>}
    </div>
  );
};

export default He;
