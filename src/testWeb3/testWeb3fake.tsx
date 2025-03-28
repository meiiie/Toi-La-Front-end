import Web3 from 'web3';

// URL RPC node của bạn
const rpcUrl = 'http://127.0.0.1:8545';
const web3 = new Web3(rpcUrl);

// Gửi giao dịch
export const sendTransaction = async (
  from: string,
  to: string,
  amount: string,
  passphrase: string,
): Promise<string> => {
  try {
    // Chuyển đổi Ether sang Wei
    const value = web3.utils.toWei(amount, 'ether');

    // Gửi giao dịch
    const txHash = await web3.eth.personal.sendTransaction(
      {
        from,
        to,
        value,
      },
      passphrase, // Passphrase của tài khoản gửi
    );

    console.log('Giao dịch thành công! Hash:', txHash);
    return txHash;
  } catch (error) {
    console.error('Giao dịch thất bại:', error);
    throw error;
  }
};

// Lấy số dư
export const getBalance = async (account: string): Promise<string> => {
  try {
    const balanceInWei = await web3.eth.getBalance(account);
    const balanceInEther = web3.utils.fromWei(balanceInWei, 'ether');
    return balanceInEther;
  } catch (error) {
    console.error('Không thể lấy số dư:', error);
    throw error;
  }
};
