import Link from "next/link";
import Image from "next/image";
import { Github, Play, ArrowRight, TrendingUp, Search, Bell, BarChart3, ShieldCheck, Zap, Globe } from "lucide-react";

const LandingPage = () => {
  const GITHUB_REPO = "https://github.com/Vatsa10/TradeXpert";

  return (
    <div className="relative flex flex-col w-full bg-[#030303] overflow-x-hidden pt-10">
      {/* MESH BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none overflow-hidden h-[120vh]">
        <Image 
          src="/landing/mesh-bg.png"
          alt="Futuristic Background"
          fill
          className="object-cover scale-110 blur-xl animate-pulse duration-[8000ms]"
          priority
        />
      </div>

      <div className="absolute top-0 left-0 w-full h-[150vh] bg-gradient-to-b from-black/0 via-[#030303]/80 to-[#030303] z-0 pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative z-10 container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 mb-8 text-xs font-bold tracking-widest uppercase text-yellow-500 bg-yellow-400/5 border border-yellow-400/10 rounded-full">
            <Zap size={14} className="fill-yellow-500 animate-pulse" />
            <span>REAL-TIME INTELLIGENCE • v1.02</span>
          </div>

          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white mb-8 leading-[1]">
             TRADING AT THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-400 to-orange-600">
              SPEED OF LIGHT.
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed opacity-80">
            Institutional power, democratized for the next-gen investor. 
            Real-time <span className="text-white">Finnhub</span> data meets advanced <span className="text-yellow-500">AI analysis</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-32">
            <Link href="/sign-up">
              <button className="group h-16 px-10 bg-yellow-500 hover:bg-white text-black font-bold rounded-2xl flex items-center gap-3 transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-2xl shadow-yellow-500/20">
                START TRADING
                <ArrowRight size={20} className="group-hover:translate-x-1 duration-300" />
              </button>
            </Link>
            <Link href={GITHUB_REPO} target="_blank">
              <button className="h-16 px-10 glassmorphism-btn border border-white/10 hover:border-white/20 text-white font-bold rounded-2xl flex items-center gap-3 transition-all duration-300 hover:scale-[1.03] active:scale-95">
                <Github size={20} />
                SOURCE CODE
              </button>
            </Link>
          </div>
        </div>

        {/* SHOWCASE SECTION - REAL IMAGES WITH SCROLL EFFECT */}
        <div className="flex flex-col gap-20 w-full max-w-6xl mx-auto mb-40">
           <div className="scroll-reveal animate-in fade-in slide-in-from-bottom-10 relative z-10 p-1 glassmorphism border border-white/10 rounded-[32px] overflow-hidden group">
             <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors pointer-events-none z-10" />
             <Image 
                src="/landing/dashboard-real-1.png"
                alt="Dashboard Overview"
                width={1920}
                height={1080}
                className="rounded-3xl w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
             />
             <div className="absolute bottom-6 left-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-bold tracking-widest uppercase">
               MARKET OVERVIEW HUB
             </div>
           </div>

           <div className="scroll-reveal animate-in fade-in slide-in-from-bottom-10 relative z-10 p-1 glassmorphism border border-white/10 rounded-[32px] overflow-hidden group">
             <Image 
                src="/landing/dashboard-real-2.png"
                alt="Heatmap & Analytics"
                width={1920}
                height={1080}
                className="rounded-3xl w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
             />
             <div className="absolute top-6 right-6 z-20 bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold text-xs tracking-widest uppercase">
               LIVE HEATMAPS
             </div>
           </div>

           <div className="scroll-reveal animate-in fade-in slide-in-from-bottom-10 relative z-10 p-1 glassmorphism border border-white/10 rounded-[32px] overflow-hidden group">
             <Image 
                src="/landing/dashboard-real-3.png"
                alt="Detailed View"
                width={1920}
                height={1080}
                className="rounded-3xl w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
             />
             <div className="absolute bottom-6 right-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-bold tracking-widest uppercase">
               DEEP ANALYSIS
             </div>
           </div>
        </div>

        {/* FEATURE HUB */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full mb-40">
           <FeatureSquare 
             icon={<Globe className="text-yellow-400" />}
             stat="GLOBAL"
             title="Instant Search"
             desc="Browse 10k+ tickers with sub-millisecond fuzzy search."
           />
           <FeatureSquare 
             icon={<BarChart3 className="text-blue-400" />}
             stat="ACCURATE"
             title="Advanced Charts"
             desc="Professional TradingView widgets for deep technical analysis."
           />
           <FeatureSquare 
             icon={<ShieldCheck className="text-green-400" />}
             stat="AUTHENTIC"
             title="Secure Flow"
             desc="Bank-grade authentication with session persistence."
           />
           <FeatureSquare 
             icon={<Zap className="text-orange-400" />}
             stat="POWERFUL"
             title="AI Intelligence"
             desc="Deep analysis reports generated by Gemini 1.5 Pro."
           />
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="relative z-10 py-20 w-full border-t border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden flex flex-col items-center">
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[18vw] font-black text-white/[0.03] leading-none pointer-events-none select-none uppercase tracking-[0.05em]">
          TRADXPERT
        </div>

        <div className="flex flex-col items-center gap-10">
          <Link 
            href={GITHUB_REPO} 
            target="_blank"
            className="group relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-yellow-400/10 blur-2xl group-hover:scale-150 transition-all duration-700" />
            <div className="relative py-4 px-10 border border-white/10 rounded-2xl flex items-center gap-4 text-white hover:text-yellow-400 font-bold transition-all duration-500 overflow-hidden">
              <Github size={24} />
              DEV-FIRST PHILOSOPHY: EXPLORE SOURCE CODE
              <ArrowRight size={18} />
            </div>
          </Link>

          <div className="flex gap-8 text-gray-500 text-xs font-mono uppercase tracking-[0.4em] opacity-40">
             <span>v1.02.0</span>
             <span>•</span>
             <span>GITHUB REPO</span>
             <span>•</span>
             <span>OPEN SOURCE FINTECH</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureSquare = ({ icon, stat, title, desc }: any) => {
  return (
    <div className="group relative p-1 pb-1 flex flex-col items-start text-left bg-white/5 border border-white/5 rounded-[24px] hover:border-yellow-400/30 transition-all duration-500 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-8 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-10">
           <div className="p-3 bg-white/5 rounded-xl group-hover:bg-yellow-400/10 group-hover:scale-110 transition-all">
             {icon}
           </div>
           <span className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase group-hover:text-yellow-400 transition-colors">
             {stat}
           </span>
        </div>
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide group-hover:translate-x-1 transition-transform">
          {title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed font-medium mt-auto group-hover:text-gray-400 transition-colors">
          {desc}
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
