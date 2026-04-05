import React, { useState } from 'react';
import { BadgeIndianRupee, Coins, CreditCard, Landmark, Wallet } from 'lucide-react';
import TokenEstimatorCard from '../components/TokenEstimatorCard';
import { TOKEN_ECONOMY, formatInr } from '../config/tokenEconomy';

const comingSoonItems = [
  {
    title: 'Wallet',
    description: 'Users will eventually top up platform tokens, monitor spend, and view remaining balance.',
    icon: Wallet,
    color: 'text-emerald-400',
    borderColor: 'hover:border-emerald-400/40'
  },
  {
    title: 'Billing',
    description: 'Invoices, usage history, team summaries, and tax-ready billing exports are planned after the demo.',
    icon: BadgeIndianRupee,
    color: 'text-cyan-400',
    borderColor: 'hover:border-cyan-400/40'
  },
  {
    title: 'Payments',
    description: 'Checkout and real transaction collection are intentionally not implemented in this demo build.',
    icon: CreditCard,
    color: 'text-violet-400',
    borderColor: 'hover:border-violet-400/40'
  },
  {
    title: 'Withdrawals',
    description: 'Provider cash-out and transfer workflows are product ideas only at this stage.',
    icon: Landmark,
    color: 'text-amber-400',
    borderColor: 'hover:border-amber-400/40'
  },
];

function TokenomicsPage() {
  const [selectedMinutes, setSelectedMinutes] = useState(TOKEN_ECONOMY.billingIncrementMinutes);

  return (
    <div className="flex flex-col gap-8 bg-transparent min-h-full rounded-3xl relative p-2 scroll-smooth">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes staggerFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div 
        className="absolute inset-0 z-0 pointer-events-none rounded-3xl"
        style={{ background: 'radial-gradient(circle at top, rgba(0,255,255,0.06), transparent)' }}
      />

      <div className="flex flex-col gap-8 w-full relative z-10">
        
        <section className="hover-tilt animate-fade-in-up flex flex-col gap-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)]" style={{ animationDelay: '0s' }}>
          <div>
            <p className="text-cyan-400 text-sm font-bold tracking-[0.18em] uppercase drop-[0_0_8px_rgba(0,255,255,0.8)]">Monetization Model</p>
            <h2 className="text-3xl font-bold mt-2 text-white">Demo token economy</h2>
            <p className="text-slate-300 mt-4 max-w-3xl leading-relaxed">
              CampusCloud uses a simple token story for the hackathon demo so teachers can understand how users pay for GPU time
              and why providers are motivated to contribute machines.
            </p>
            <div className="rounded-2xl border border-amber-500/50 bg-amber-500/20 p-5 font-medium text-amber-100 mt-6 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              Demo mode: token pricing and provider earnings are presentation-ready, but real wallet, billing, payments, and withdrawals are intentionally not implemented yet.
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-400/10 rounded-full blur-[30px] pointer-events-none group-hover:bg-cyan-400/20 transition-colors" />
              <Coins className="w-6 h-6 text-cyan-400 mb-4 relative z-10" />
              <p className="text-sm font-medium text-slate-300 relative z-10">Token price</p>
              <p className="text-3xl font-bold mt-2 text-white relative z-10">{formatInr(TOKEN_ECONOMY.tokenValueInr)}</p>
              <p className="text-sm font-bold text-cyan-300 mt-2 relative z-10">per token</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_10px_40px_rgba(0,255,255,0.12)] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-400/10 rounded-full blur-[30px] pointer-events-none group-hover:bg-cyan-400/20 transition-colors" />
              <BadgeIndianRupee className="w-6 h-6 text-cyan-400 mb-4 relative z-10" />
              <p className="text-sm font-medium text-slate-300 relative z-10">Usage rate</p>
              <p className="text-3xl font-bold mt-2 text-white relative z-10">{TOKEN_ECONOMY.tokensPerThirtyMinutes} <span className="text-xl">tokens</span></p>
              <p className="text-sm font-bold text-cyan-300 mt-2 relative z-10">every {TOKEN_ECONOMY.billingIncrementMinutes} minutes</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-[0_10px_40px_rgba(16,185,129,0.12)] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-400/10 rounded-full blur-[30px] pointer-events-none group-hover:bg-emerald-400/20 transition-colors" />
              <Wallet className="w-6 h-6 text-emerald-400 mb-4 relative z-10" />
              <p className="text-sm font-medium text-slate-300 relative z-10">Provider reward</p>
              <p className="text-3xl font-bold mt-2 text-white relative z-10">{TOKEN_ECONOMY.providerSharePerThirtyMinutes} <span className="text-xl">tokens</span></p>
              <p className="text-sm font-bold text-emerald-400 mt-2 relative z-10">per 30 min block</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_10px_40px_rgba(139,92,246,0.12)] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-400/10 rounded-full blur-[30px] pointer-events-none group-hover:bg-violet-400/20 transition-colors" />
              <Landmark className="w-6 h-6 text-violet-400 mb-4 relative z-10" />
              <p className="text-sm font-medium text-slate-300 relative z-10">Platform fee</p>
              <p className="text-3xl font-bold mt-2 text-white relative z-10">{TOKEN_ECONOMY.platformSharePerThirtyMinutes} <span className="text-xl">tokens</span></p>
              <p className="text-sm font-bold text-violet-400 mt-2 relative z-10">per 30 min block</p>
            </div>
          </div>
        </section>

        <section className="hover-tilt reveal-on-scroll animate-fade-in-up bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_40px_rgba(0,255,255,0.06)]" style={{ animationDelay: '0.1s' }}>
          <p className="text-cyan-400 text-sm font-bold tracking-[0.18em] uppercase drop-[0_0_8px_rgba(0,255,255,0.8)]">Teacher View</p>
          <h3 className="text-2xl font-bold mt-2 text-white">What this demonstrates</h3>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-cyan-400/30">
              <p className="font-bold text-white text-lg">User pricing</p>
              <p className="mt-3 text-slate-300 leading-relaxed">Users spend tokens for compute time instead of negotiating per-machine pricing.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-emerald-400/30">
              <p className="font-bold text-white text-lg">Provider incentive</p>
              <p className="mt-3 text-slate-300 leading-relaxed">Most of the usage block goes to the provider, so idle GPUs can become revenue-producing assets.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-violet-400/30">
              <p className="font-bold text-white text-lg">Platform revenue</p>
              <p className="mt-3 text-slate-300 leading-relaxed">A fixed platform cut funds orchestration, scheduling, monitoring, and future payments infrastructure.</p>
            </div>
          </div>
        </section>

        <div className="animate-fade-in-up w-full" style={{ animationDelay: '0.2s' }}>
          <TokenEstimatorCard
            selectedMinutes={selectedMinutes}
            onSelectMinutes={setSelectedMinutes}
            title="Compute cost estimator"
            description="Pick a demo duration to see how usage converts into tokens, rupee value, provider earnings, and platform fee."
          />
        </div>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {comingSoonItems.map((item, idx) => (
            <div key={item.title} className={`hover-tilt rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 transition-all duration-300 ${item.borderColor} hover:shadow-[0_10px_40px_rgba(0,255,255,0.06)] group relative overflow-hidden`} style={{ animation: 'staggerFadeIn 0.4s ease-out forwards', animationDelay: `${0.3 + idx * 0.1}s`, opacity: 0 }}>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-white/10 transition-colors" />
              <item.icon className={`w-8 h-8 mb-5 ${item.color} drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]`} />
              <p className="text-2xl font-bold text-white">{item.title}</p>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">{item.description}</p>
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300 mt-6 backdrop-blur-sm shadow-inner group-hover:bg-amber-500/20 transition-colors">
                {TOKEN_ECONOMY.comingSoonMessage}
              </div>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}

export default TokenomicsPage;
