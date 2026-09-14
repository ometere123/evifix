import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { connectWallet, disconnectWallet, restoreWalletConnection } from "./client";

type WalletValue = {
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    restoreWalletConnection().then(setAddress).catch(() => setAddress(null));
  }, []);

  const value = useMemo<WalletValue>(() => ({
    address,
    connecting,
    connect: async () => {
      setConnecting(true);
      try {
        setAddress(await connectWallet());
      } finally {
        setConnecting(false);
      }
    },
    disconnect: () => {
      disconnectWallet();
      setAddress(null);
    },
  }), [address, connecting]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
