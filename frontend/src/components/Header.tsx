import { Flame, Wallet, X } from "lucide-react";
import { NETWORK } from "../lib/client";
import { shortHash } from "../lib/validation";
import { useWallet } from "../lib/WalletContext";

export function Header({ inApp, onHome, onLaunch }: { inApp: boolean; onHome: () => void; onLaunch: () => void }) {
  const wallet = useWallet();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={onHome} className="flex items-center gap-2 text-left">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
            <Flame className="h-4 w-4" />
          </span>
          <span>
            <strong className="block text-sm tracking-wide text-white">EVIFIX</strong>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500">release evidence gate</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-gray-800 bg-gray-950 px-3 py-1.5 text-xs text-gray-400 sm:inline-flex">
            {NETWORK.name} · {NETWORK.chainId}
          </span>
          {!inApp ? (
            <button onClick={onLaunch} className="btn-primary">Launch app</button>
          ) : wallet.address ? (
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-xs text-gray-300">
                {shortHash(wallet.address, 6, 4)}
              </span>
              <button aria-label="Disconnect wallet" onClick={wallet.disconnect} className="icon-btn"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => void wallet.connect()} disabled={wallet.connecting} className="btn-primary">
              <Wallet className="h-4 w-4" /> {wallet.connecting ? "Connecting" : "Connect wallet"}
            </button>
          )}
        </div>
      </div>
      {wallet.error ? <div role="alert" className="mx-auto max-w-7xl border-t border-danger/20 px-4 py-2 text-xs text-danger sm:px-6">{wallet.error}</div> : null}
    </header>
  );
}
