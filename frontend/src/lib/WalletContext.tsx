import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { connectWallet, currentChainId, disconnectWallet, NETWORK, restoreWalletConnection, syncWalletAddress } from "./client";

type WalletValue = {
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreWalletConnection().then(setAddress).catch(() => setAddress(null));
    const provider = window.ethereum;
    if (!provider) return;
    const onAccountsChanged = () => { void syncWalletAddress().then(setAddress).catch(() => setAddress(null)); };
    const onChainChanged = () => { void currentChainId().then(chain => setError(chain === NETWORK.chainId ? null : `Switch your wallet to ${NETWORK.name} (chain ${NETWORK.chainId}).`)).catch(() => setError("Unable to read the wallet network.")); };
    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const value = useMemo<WalletValue>(() => ({
    address,
    connecting,
    connect: async () => {
      setConnecting(true);
      try {
      setError(null);
      setAddress(await connectWallet());
    } catch (reason: any) {
      setError(String(reason?.message ?? reason ?? "Wallet connection failed."));
    } finally {
        setConnecting(false);
      }
    },
    error,
    disconnect: () => {
      disconnectWallet();
      setAddress(null);
      setError(null);
    },
  }), [address, connecting, error]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
