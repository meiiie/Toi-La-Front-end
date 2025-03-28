"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { toast } from "sonner"

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  account: string | null
  networkStatus: boolean
  connectWallet: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  networkStatus: false,
  connectWallet: async () => {},
})

export const useWeb3 = () => useContext(Web3Context)

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [networkStatus, setNetworkStatus] = useState<boolean>(false)

  // Check if MetaMask is installed
  const checkIfMetaMaskExists = () => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  }

  // Check network connection
  const checkNetworkStatus = async () => {
    try {
      const response = await fetch("https://geth.holihu.online/rpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "net_version",
          params: [],
          id: 1,
        }),
      })

      const data = await response.json()
      setNetworkStatus(!!data.result)
    } catch (error) {
      setNetworkStatus(false)
      console.error("Network check failed:", error)
    }
  }

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!checkIfMetaMaskExists()) {
      toast.error("MetaMask không được cài đặt. Vui lòng cài đặt MetaMask để tiếp tục.")
      return
    }

    try {
      // Request account access
      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await browserProvider.send("eth_requestAccounts", [])

      if (accounts.length > 0) {
        const userSigner = await browserProvider.getSigner()

        setProvider(browserProvider)
        setSigner(userSigner)
        setAccount(accounts[0])

        toast.success("Đã kết nối với MetaMask!")
      }
    } catch (error) {
      console.error("Lỗi kết nối ví:", error)
      toast.error("Không thể kết nối với MetaMask. Vui lòng thử lại.")
    }
  }

  // Handle account changes
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null)
      setSigner(null)
      toast.info("Đã ngắt kết nối với MetaMask.")
    } else if (accounts[0] !== account) {
      setAccount(accounts[0])
      toast.info("Đã chuyển tài khoản MetaMask.")
    }
  }

  // Initialize and set up event listeners
  useEffect(() => {
    checkNetworkStatus()

    const interval = setInterval(() => {
      checkNetworkStatus()
    }, 30000) // Check every 30 seconds

    if (checkIfMetaMaskExists()) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)

      // Auto connect if previously connected
      const autoConnect = async () => {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await browserProvider.listAccounts()

          if (accounts.length > 0) {
            const userSigner = await browserProvider.getSigner()
            setProvider(browserProvider)
            setSigner(userSigner)
            setAccount(accounts[0].address)
          }
        } catch (error) {
          console.error("Auto connect error:", error)
        }
      }

      autoConnect()
    }

    return () => {
      clearInterval(interval)
      if (checkIfMetaMaskExists()) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [checkIfMetaMaskExists]) // Removed checkNetworkStatus and handleAccountsChanged from dependencies

  return (
    <Web3Context.Provider value={{ provider, signer, account, networkStatus, connectWallet }}>
      {children}
    </Web3Context.Provider>
  )
}

