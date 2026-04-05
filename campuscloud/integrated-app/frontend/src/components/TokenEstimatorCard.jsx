import React from 'react';
import { Coins, Landmark, Wallet } from 'lucide-react';
import { TOKEN_ECONOMY, estimateTokenUsage, formatInr } from '../config/tokenEconomy';

function TokenEstimatorCard({
  title = 'Demo Token Estimator',
  description = 'This is a demo-only preview of how CampusCloud explains pricing and provider incentives.',
  selectedMinutes = TOKEN_ECONOMY.billingIncrementMinutes,
  onSelectMinutes,
  showSelector = true,
  compact = false,
}) {
  const estimate = estimateTokenUsage(selectedMinutes);

  return (
    <section className="hover-tilt rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)] group transition-all duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-cyan-400 text-sm font-bold tracking-[0.18em] uppercase drop-[0_0_8px_rgba(0,255,255,0.8)]">Demo Tokenomics</p>
          <h3 className="text-2xl font-bold mt-2 text-white">{title}</h3>
          <p className="text-sm text-slate-300 mt-3 max-w-2xl leading-relaxed">{description}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/50 bg-amber-500/20 px-5 py-3 text-sm font-bold text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)] backdrop-blur-md">
          {TOKEN_ECONOMY.comingSoonMessage}
        </div>
      </div>

      {showSelector ? (
        <div className="mt-5 mb-6">
          <label className="block w-full max-w-sm">
            <span className="block text-sm text-slate-300 mb-2 font-medium">Estimated usage duration</span>
            <div className="relative">
              <select
                value={estimate.durationMinutes}
                onChange={(event) => onSelectMinutes?.(Number(event.target.value))}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none backdrop-blur-md transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:border-cyan-400/40 appearance-none cursor-pointer"
              >
                {TOKEN_ECONOMY.supportedDurations.map((minutes) => (
                  <option key={minutes} value={minutes} className="bg-black text-white">
                    {minutes} minutes
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </label>
        </div>
      ) : null}

      <div className={`grid gap-4 mt-6 ${compact ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-4'}`}>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] relative overflow-hidden group/item">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-400/10 rounded-full blur-[30px] pointer-events-none group-hover/item:bg-cyan-400/20 transition-colors" />
          <Coins className="w-6 h-6 text-cyan-400 relative z-10" />
          <p className="text-sm font-medium text-slate-300 mt-4 relative z-10">Total usage</p>
          <p className="text-2xl font-bold mt-1 text-white relative z-10">{estimate.totalTokens} tokens</p>
          <p className="text-sm font-bold text-cyan-300 mt-2 relative z-10">{formatInr(estimate.totalValueInr)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-[0_10px_40px_rgba(16,185,129,0.12)] relative overflow-hidden group/item">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-400/10 rounded-full blur-[30px] pointer-events-none group-hover/item:bg-emerald-400/20 transition-colors" />
          <Wallet className="w-6 h-6 text-emerald-400 relative z-10" />
          <p className="text-sm font-medium text-slate-300 mt-4 relative z-10">Provider payout</p>
          <p className="text-2xl font-bold mt-1 text-white relative z-10">{estimate.providerTokens} tokens</p>
          <p className="text-sm font-bold text-emerald-300 mt-2 relative z-10">{formatInr(estimate.providerValueInr)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_10px_40px_rgba(139,92,246,0.12)] relative overflow-hidden group/item">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-400/10 rounded-full blur-[30px] pointer-events-none group-hover/item:bg-violet-400/20 transition-colors" />
          <Landmark className="w-6 h-6 text-violet-400 relative z-10" />
          <p className="text-sm font-medium text-slate-300 mt-4 relative z-10">Platform fee</p>
          <p className="text-2xl font-bold mt-1 text-white relative z-10">{estimate.platformTokens} tokens</p>
          <p className="text-sm font-bold text-violet-300 mt-2 relative z-10">{formatInr(estimate.platformValueInr)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] relative overflow-hidden group/item">
           <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-400/10 rounded-full blur-[30px] pointer-events-none group-hover/item:bg-cyan-400/20 transition-colors" />
          <p className="text-sm font-medium text-slate-300 relative z-10">Rate card</p>
          <p className="text-2xl font-bold mt-4 text-white relative z-10">
            {TOKEN_ECONOMY.tokensPerThirtyMinutes} / {TOKEN_ECONOMY.billingIncrementMinutes}m
          </p>
          <p className="text-sm font-bold text-cyan-300 mt-2 relative z-10">
            1t = {formatInr(TOKEN_ECONOMY.tokenValueInr)}
          </p>
        </div>
      </div>
    </section>
  );
}

export default TokenEstimatorCard;
