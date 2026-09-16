import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const GATE_ADDRESS = import.meta.env.VITE_EVIFIX_GATE_ADDRESS as `0x${string}` | undefined;
export const TARGET_ADDRESS = import.meta.env.VITE_EVIFIX_TARGET_ADDRESS as `0x${string}` | undefined;

export const NETWORK = {
  name: "GenLayer Studionet",
  chainId: 61999,
  chainHex: "0xF22F",
  rpc: "https://studio.genlayer.com/api",
  explorer: "https://explorer-studio.genlayer.com",
  symbol: "GEN",
} as const;

const CHAIN_PARAMS = {
  chainId: NETWORK.chainHex,
  chainName: NETWORK.name,
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: [NETWORK.rpc],
  blockExplorerUrls: [NETWORK.explorer],
};

const CONNECTED_ADDRESS_KEY = "evifix.connectedAddress";
export const readClient = createClient({ chain: studionet });

let writeClient: ReturnType<typeof createClient> | null = null;
let connectedAddress: string | null = typeof window !== "undefined"
  ? window.localStorage.getItem(CONNECTED_ADDRESS_KEY)
  : null;

function remember(address: string | null) {
  connectedAddress = address;
  if (typeof window === "undefined") return;
  if (address) window.localStorage.setItem(CONNECTED_ADDRESS_KEY, address);
  else window.localStorage.removeItem(CONNECTED_ADDRESS_KEY);
}

export async function ensureStudionet(): Promise<void> {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK.chainHex }],
    });
  } catch (error: any) {
    if (error?.code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [CHAIN_PARAMS],
    });
  }
}

function buildWriteClient(address: `0x${string}`) {
  writeClient = createClient({ chain: studionet, account: address, provider: window.ethereum });
  remember(address);
}

export function getConnectedAddress() {
  return connectedAddress;
}

export async function syncWalletAddress(): Promise<string | null> {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
  const selected = accounts[0] as `0x${string}` | undefined;
  if (!selected) {
    disconnectWallet();
    return null;
  }
  buildWriteClient(selected);
  return selected;
}

export async function currentChainId(): Promise<number | null> {
  if (!window.ethereum) return null;
  const value = await window.ethereum.request({ method: "eth_chainId" }) as string;
  return Number(value);
}

export function getWriteClient() {
  if (!writeClient) throw new Error("Wallet not connected");
  return writeClient;
}

export async function restoreWalletConnection(): Promise<string | null> {
  if (!window.ethereum || !connectedAddress) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
  const selected = accounts.find(a => a.toLowerCase() === connectedAddress?.toLowerCase()) ?? accounts[0];
  if (!selected) {
    disconnectWallet();
    return null;
  }
  await ensureStudionet();
  buildWriteClient(selected as `0x${string}`);
  return selected;
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) throw new Error("No injected wallet found. Install MetaMask or a compatible wallet.");
  await ensureStudionet();
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
  if (!accounts.length) throw new Error("Wallet returned no account");
  const address = accounts[0] as `0x${string}`;
  buildWriteClient(address);
  return address;
}

export function disconnectWallet() {
  writeClient = null;
  remember(null);
}

const DECIDED_FAILURES = new Set(["UNDETERMINED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT", "CANCELED"]);
const SUCCESS_STATES = new Set(["ACCEPTED", "FINALIZED"]);

function failureReason(tx: any): string | null {
  const leader = tx?.consensus_data?.leader_receipt;
  const receipts = leader ? (Array.isArray(leader) ? leader : [leader]) : [];
  for (const receipt of receipts) {
    const result = receipt?.result;
    if (result && typeof result === "object" && "Rollback" in result) return String(result.Rollback);
    if (result && typeof result === "object" && String(result.status ?? "").toLowerCase() === "rollback") {
      return String(result.payload ?? result.reason ?? result.message ?? "Contract reverted");
    }
    if (result?.rollback) return String(result.rollback.message ?? result.rollback);
  }
  if (tx?.error) return String(tx.error.message ?? tx.error);
  return null;
}

export async function waitForAcceptedOrFinalized(hash: `0x${string}`, timeoutMs = 240_000) {
  // 3s = 20 polls/minute, deliberately below the 30 requests/minute ceiling.
  const intervalMs = 3_000;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const tx: any = await (readClient.getTransaction as any)({ hash });
      const status = String(tx?.statusName ?? tx?.status ?? "");
      const rollback = failureReason(tx);
      if (rollback) throw new Error(rollback);
      if (DECIDED_FAILURES.has(status)) throw new Error(`Transaction ended in ${status}`);
      if (SUCCESS_STATES.has(status)) return { tx, status };
    } catch (error: any) {
      if (/Transaction ended|revert|rollback/i.test(String(error?.message ?? error))) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for transaction ${hash}`);
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
