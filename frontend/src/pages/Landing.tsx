import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion, useScroll, useTransform, useSpring, AnimatePresence, useInView, useAnimation
} from 'framer-motion';
import {
  Megaphone, TrendingUp, Shield, ArrowRight,
  CheckCircle, Sparkles, Rocket, Zap,
  ArrowUpRight, LayoutGrid, Globe, DollarSign,
  Twitter, Instagram, Linkedin, Mail
} from 'lucide-react';
import api from '../lib/api';
import Button from '../components/ui/Button';

// Types
interface LandingData {
  stats: {
    totalUsers: number;
    totalInfluencers: number;
    totalClients: number;
    totalCampaigns: number;
    completedCampaigns: number;
    totalRevenue: number;
  };
  heroAds: any[];
  topInfluencers: any[];
  testimonials: any[];
  categories: any[];
}

// --- Components ---

function ScrambleText({ text, className = "" }: { text: string, className?: string }) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  const [displayText, setDisplayText] = useState(text);
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref);

  useEffect(() => {
    if (isInView) {
      let iteration = 0;
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((letter, index) => {
              if (index < iteration) return text[index];
              return letters[Math.floor(Math.random() * 26)];
            })
            .join("")
        );
        if (iteration >= text.length) clearInterval(interval);
        iteration += 1 / 3;
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isInView, text]);

  return <span ref={ref} className={className}>{displayText}</span>;
}

function HeroCarousel({ items }: { items: any[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div className="relative w-full h-[500px] perspective-1000 group">
      <div className="absolute inset-0 flex items-center justify-center transform-style-3d">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            // Logic to show prev, current, next
            const offset = (index - current + items.length) % items.length;
            const isVisible = offset === 0 || offset === 1 || offset === items.length - 1;

            if (!isVisible) return null;

            let x = 0;
            let scale = 1;
            let zIndex = 0;
            let opacity = 1;
            let rotateY = 0;

            if (offset === 0) { // Current
              zIndex = 10;
            } else if (offset === 1) { // Next
              x = 100;
              scale = 0.8;
              zIndex = 5;
              opacity = 0.6;
              rotateY = -15;
            } else { // Previous
              x = -100;
              scale = 0.8;
              zIndex = 5;
              opacity = 0.6;
              rotateY = 15;
            }

            return (
              <motion.div
                key={item.id}
                initial={false}
                animate={{ x, scale, zIndex, opacity, rotateY }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute w-[80%] max-w-[350px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900"
                style={{
                  transformStyle: 'preserve-3d',
                  boxShadow: offset === 0 ? '0 0 50px rgba(244, 63, 94, 0.2)' : 'none'
                }}
              >
                <div className="relative h-full w-full">
                  <img
                    src={item.imageUrl || `https://source.unsplash.com/random/800x600?${item.category?.slug || 'marketing'}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{item.platform}</span>
                  </div>

                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <h3 className="text-xl font-bold text-white line-clamp-2 mb-2 drop-shadow-md">{item.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        ${item.budgetMin?.toLocaleString()} - ${item.budgetMax?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LiveTicker() {
  const activities = [
    { text: "Sarah K. just earned $1,200", icon: DollarSign, color: "text-emerald-400" },
    { text: "Nike posted a new campaign", icon: Megaphone, color: "text-rose-400" },
    { text: "TechReviewer reached 100k followers", icon: TrendingUp, color: "text-blue-400" },
    { text: "Alex M. closed a deal with Spotify", icon: CheckCircle, color: "text-purple-400" },
    { text: "New Fashion campaign live: $5k budget", icon: Zap, color: "text-amber-400" },
  ];

  return (
    <div className="w-full bg-slate-900/50 border-y border-slate-800 backdrop-blur-sm overflow-hidden py-3">
      <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
        {[...activities, ...activities, ...activities].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ROICalculator() {
  const [followers, setFollowers] = useState(10000);
  const potential = Math.round(followers * 0.02 * 50); // Just a dummy formula

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-purple-500/5 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-white mb-2">Estimate Your Earnings</h3>
        <p className="text-slate-400 mb-8">See how much you could earn per campaign based on your reach.</p>

        <div className="mb-8">
          <div className="flex justify-between text-slate-300 mb-2 font-medium">
            <span>Followers</span>
            <span className="text-rose-400">{followers.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="1000"
            max="1000000"
            step="1000"
            value={followers}
            onChange={(e) => setFollowers(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>1k</span>
            <span>1M</span>
          </div>
        </div>

        <div className="text-center bg-slate-950/50 rounded-xl p-4 border border-slate-800">
          <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Potential Earnings</p>
          <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            ${potential.toLocaleString()} <span className="text-lg text-slate-500 font-normal">/ post</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function Landing() {
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/public/landing-data');
        setData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch landing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
          <div className="absolute inset-0 border-4 border-rose-500 rounded-full border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 selection:bg-rose-500/30 font-sans overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-grain opacity-[0.03]" />
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-rose-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[80px] animate-float-delayed" />
      </div>

      {/* Live Ticker */}
      <div className="absolute top-[80px] z-40 w-full pointer-events-none opacity-90">
        <LiveTicker />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center pt-32 pb-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Content */}
            <motion.div style={{ opacity, scale }} className="space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm font-medium backdrop-blur-sm shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              >
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>The #1 Marketplace for Creators</span>
              </motion.div>

              <div className="relative">
                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white">
                  <ScrambleText text="Amplify" className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400" /> Your <br />
                  Digital <span className="relative inline-block">
                    Impact
                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-rose-500 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <line x1="0" y1="5" x2="100" y2="5" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                  </span>
                </h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light"
              >
                Stop chasing partnerships. Start closing them. We connect elite brands with verified creators to build campaigns that actually convert.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link to="/register?role=CLIENT">
                  <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:shadow-[0_0_50px_rgba(244,63,94,0.6)] hover:scale-105 transition-all duration-300 bg-gradient-to-r from-rose-500 to-pink-600 border-none">
                    Start Campaign <Rocket className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/register?role=INFLUENCER">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <Button size="lg" variant="secondary" className="relative h-14 px-8 text-lg w-full sm:w-auto border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800">
                      Join as Creator
                    </Button>
                  </div>
                </Link>
              </motion.div>

              <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 border-t border-slate-800/50 mt-8">
                <div>
                  <div className="text-3xl font-bold text-white">{data?.stats.totalInfluencers}+</div>
                  <div className="text-sm text-slate-500">Active Creators</div>
                </div>
                <div className="w-px h-10 bg-slate-800" />
                <div>
                  <div className="text-3xl font-bold text-white">${((data?.stats.totalRevenue || 0) / 1000000).toFixed(1)}M+</div>
                  <div className="text-sm text-slate-500">Creator Earnings</div>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative hidden lg:block h-[600px] w-full"
            >
              {/* Abstract Background Shapes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-rose-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-[80px] animate-pulse-slow" />

              {/* Main 3D Card Stack */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <HeroCarousel items={(!data?.heroAds || data.heroAds.length === 0) ? [
                  { id: 'ph1', title: 'Summer Collection Launch', platform: 'INSTAGRAM', budgetMin: 5000, budgetMax: 10000, category: { name: 'Fashion' }, imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop' },
                  { id: 'ph2', title: 'Tech Review Series', platform: 'YOUTUBE', budgetMin: 8000, budgetMax: 15000, category: { name: 'Technology' }, imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=800&auto=format&fit=crop' },
                  { id: 'ph3', title: 'Fitness App Promotion', platform: 'TIKTOK', budgetMin: 3000, budgetMax: 6000, category: { name: 'Health' }, imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop' }
                ] : data.heroAds} />
              </div>

              {/* Floating Element: Budget - Top Right */}
              <motion.div
                className="absolute top-20 right-10 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-2xl z-20 w-48"
                animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Avg Budget</p>
                    <p className="text-lg font-bold text-white">$4,500</p>
                  </div>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1 overflow-hidden">
                  <motion.div
                    className="bg-emerald-500 h-full rounded-full"
                    animate={{ width: ["40%", "70%", "50%"] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Floating Element: Engagement - Bottom Right */}
              <motion.div
                className="absolute bottom-32 -right-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-2xl z-20 w-52"
                animate={{ y: [0, 20, 0], rotate: [0, -2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Engagement</span>
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">+12.5%</span>
                </div>
                <div className="flex items-end gap-1 h-12 justify-between">
                  {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-rose-500 rounded-t-sm"
                      style={{ height: `${h}%`, opacity: 0.5 + (i * 0.1) }}
                      animate={{ height: [`${h}%`, `${h + 10}%`, `${h}%`] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Floating Element: Active Users - Left */}
              <motion.div
                className="absolute top-40 -left-10 bg-slate-800/80 backdrop-blur-md p-3 pr-5 rounded-full border border-slate-700/50 shadow-2xl z-20 flex items-center gap-3"
                animate={{ x: [0, 10, 0], y: [0, 5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-800 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Active Now</p>
                  <p className="text-sm font-bold text-white">2.4k Creators</p>
                </div>
              </motion.div>

              {/* Floating Element: Verified Badge - Bottom Left */}
              <motion.div
                className="absolute bottom-20 left-10 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.3)] z-20 flex items-center gap-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-white text-sm">Verified Escrow</span>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* Engage Section */}
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* ROI Calculator */}
            <div className="order-2 lg:order-1">
              <ROICalculator />
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-white mb-6">Maximize Your Potential</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Whether you're a micro-influencer or a mega-star, Adfluencer provides the tools to monetize your audience effectively. Our AI-driven engine matches you with brands that align with your values.
              </p>

              <div className="space-y-4">
                {[
                  { title: "Smart Matching", desc: "Get matched with brands that fit your niche perfectly." },
                  { title: "Guaranteed Assignments", desc: "Escrow protection ensures you always get paid on time." },
                  { title: "Performance Tracking", desc: "Real-time analytics to prove your ROI to brands." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{item.title}</h4>
                      <p className="text-slate-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Categories - Expanding Accordion Gallery */}
      <section className="py-32 bg-slate-950 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-80" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-widest mb-4"
            >
              <Sparkles className="w-3 h-3" />
              <span>Curated Collections</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Discover Your Niche</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
              Explore our most popular categories and find the perfect creators for your brand's unique voice.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-2 h-[800px] lg:h-[500px] w-full">
            {/* We'll use a fixed set of high-performing categories for this display to ensure quality */}
            {[
              { id: 'tech', name: 'Technology', desc: 'Gadgets, Software, & AI', image: 'photo-1519389950473-47ba0277781c', color: 'from-blue-500/80 to-indigo-500/80' },
              { id: 'fashion', name: 'Fashion', desc: 'Style, Trends, & Apparel', image: 'photo-1483985988355-763728e1935b', color: 'from-rose-500/80 to-pink-500/80' },
              { id: 'travel', name: 'Travel', desc: 'Destinations & Adventure', image: 'photo-1476514525535-07fb3b4ae5f1', color: 'from-emerald-500/80 to-teal-500/80' },
              { id: 'fitness', name: 'Fitness', desc: 'Health, Wellness, & Sport', image: 'photo-1517836357463-d25dfeac3438', color: 'from-orange-500/80 to-red-500/80' },
              { id: 'gaming', name: 'Gaming', desc: 'Esports, Streaming, & Reviews', image: 'photo-1542751371-adc38448a05e', color: 'from-purple-500/80 to-violet-500/80' }
            ].map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative flex-1 min-h-[100px] lg:min-w-[100px] hover:grow-[3] hover:flex-[3] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-3xl overflow-hidden cursor-pointer border border-slate-800 hover:border-slate-600 shadow-2xl"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={`https://images.unsplash.com/${cat.image}?q=80&w=800&h=1000&auto=format&fit=crop`}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/0 transition-colors duration-500" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-0 group-hover:opacity-40 transition-opacity duration-500 mix-blend-overlay`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity duration-500" />
                </div>

                {/* Vertical Text (Default State) */}
                <div className="absolute inset-0 flex items-center justify-center lg:opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                  <h3 className="text-2xl font-bold text-white tracking-[0.2em] uppercase lg:-rotate-90 whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    {cat.name}
                  </h3>
                </div>

                {/* Expanded Content (Hover State) */}
                <div className="absolute inset-x-0 bottom-0 p-8 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 flex flex-col justify-end h-full">
                  <div className="transform translate-y-0 transition-transform duration-500">
                    <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-white bg-white/20 backdrop-blur-md rounded-full border border-white/10">
                      Top Category
                    </span>
                    <h3 className="text-5xl font-black text-white mb-2 tracking-tight">{cat.name}</h3>
                    <p className="text-slate-200 text-lg mb-8 font-medium max-w-md">{cat.desc}</p>

                    <div className="flex items-center gap-4">
                      <Button className="h-12 rounded-full px-8 bg-white text-slate-950 hover:bg-white/90 transition-colors border-none font-bold">
                        Explore <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                      <div className="flex -space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                        {[1, 2, 3, 4].map(k => (
                          <div key={k} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden shadow-lg">
                            <img src={`https://i.pravatar.cc/100?img=${k + (i * 5)}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-white/80 ml-2 animate-pulse">+200 New</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Features Section - Enhanced Neon Timeline */}
      <section className="py-32 bg-slate-950 relative overflow-hidden">
        {/* Professional Gradient Mesh Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />

        {/* Subtle Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-block"
            >
              <span className="py-1 px-3 rounded-full bg-slate-900 border border-slate-700 text-rose-400 text-xs font-bold uppercase tracking-widest mb-4 inline-flex items-center gap-2 shadow-xl shadow-rose-900/10">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Roadmap 2024
              </span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-6 tracking-tight">
              Future of Influence
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
              We aren't just building a platform; we're architecting the next generation of digital collaboration.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Timeline Line (Desktop) */}
            <div className="hidden lg:block absolute top-[60px] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent border-t border-dashed border-slate-600/50" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: 'AI Help Center',
                  desc: 'Instant, intelligent support resolving 90% of queries in seconds.',
                  icon: Zap,
                  color: 'amber',
                  hex: '#fbbf24',
                  status: 'Beta'
                },
                {
                  title: 'Creator Studio',
                  desc: 'Powerful mobile suite for campaign management on the fly.',
                  icon: LayoutGrid,
                  color: 'rose',
                  hex: '#f43f5e',
                  status: 'In Dev'
                },
                {
                  title: 'Global Payouts',
                  desc: 'Instant crypto & fiat withdrawals in 150+ countries.',
                  icon: Globe,
                  color: 'emerald',
                  hex: '#34d399',
                  status: 'Q3 2024'
                },
                {
                  title: 'Generative AI',
                  desc: 'Automated brief creation and moodboard generation.',
                  icon: Sparkles,
                  color: 'purple',
                  hex: '#a78bfa',
                  status: 'Concept'
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, type: 'spring' }}
                  className="group relative pt-8"
                >
                  {/* Glowing Node on Timeline */}
                  <div className="hidden lg:flex absolute top-[44px] left-1/2 -translate-x-1/2 w-8 h-8 items-center justify-center z-20">
                    <div className={`w-3 h-3 rounded-full bg-${feature.color}-500 shadow-[0_0_15px_${feature.hex}] ring-4 ring-slate-950 group-hover:scale-150 transition-transform duration-500`} />
                  </div>

                  {/* Card */}
                  <div className="relative h-full bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:border-slate-600 group-hover:shadow-2xl">
                    {/* Hover Gradient Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 border border-${feature.color}-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                      <feature.icon className={`w-7 h-7 text-${feature.color}-400 drop-shadow-lg`} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 group-hover:text-slate-300 transition-colors">
                      {feature.desc}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-${feature.color}-500/10 text-${feature.color}-400 border border-${feature.color}-500/20`}>
                        {feature.status}
                      </span>
                      <ArrowRight className={`w-4 h-4 text-slate-600 group-hover:text-${feature.color}-400 transition-colors -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 duration-300`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact Section (Replaces Testimonials) */}
      <section className="py-32 bg-slate-950 relative overflow-hidden">
        {/* Abstract World Map Dotted Background */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at center, #f43f5e 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 15}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-slate-400 text-sm font-medium">+12k Creators Joined</span>
              </div>
              <h2 className="text-5xl font-black text-white mb-6 leading-tight">
                Global Scale,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-500">Local Impact.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-lg">
                Connect with creators in over 45 countries. From Tokyo fashion weeks to NYC tech launches, our network spans every major cultural hub.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                {[
                  { label: "Active Countries", value: "45+" },
                  { label: "Campaigns Launched", value: "12.5k" },
                  { label: "Creator Payouts", value: "$25M+" }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 px-6 py-4 rounded-2xl">
                    <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Link to="/register">
                <Button size="lg" className="h-14 px-8 shadow-xl shadow-rose-900/30">
                  Join the Network <Globe className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Visual: Abstract Nodes Map */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative h-[500px] w-full bg-slate-900/30 rounded-[3rem] border border-slate-800 backdrop-blur-sm overflow-hidden"
            >
              {/* Decorative Gradient Blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow" />

              {/* Map Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

              {/* Floating Locations */}
              {[
                { x: '20%', y: '30%', label: 'New York', color: 'rose' },
                { x: '45%', y: '25%', label: 'London', color: 'purple' },
                { x: '55%', y: '40%', label: 'Dubai', color: 'amber' },
                { x: '80%', y: '35%', label: 'Tokyo', color: 'emerald' },
                { x: '75%', y: '65%', label: 'Singapore', color: 'blue' }
              ].map((loc, i) => (
                <motion.div
                  key={i}
                  className="absolute flex flex-col items-center gap-2 group cursor-pointer"
                  style={{ left: loc.x, top: loc.y }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                >
                  <div className={`relative w-4 h-4 rounded-full bg-${loc.color}-500 shadow-[0_0_20px_rgba(255,255,255,0.5)]`}>
                    <div className={`absolute inset-0 rounded-full bg-${loc.color}-500 animate-ping opacity-75`} />
                  </div>
                  <div className="px-3 py-1 bg-slate-900/90 border border-slate-700 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-xs font-bold text-white whitespace-nowrap">{loc.label}</span>
                  </div>
                </motion.div>
              ))}

              {/* Connection Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                <motion.path
                  d="M200 150 Q 400 50 450 125 T 550 200 T 800 175"
                  fill="none"
                  stroke="url(#gradient-line)"
                  strokeWidth="2"
                  strokeDasharray="10 10"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
                <defs>
                  <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Mega Footer */}
      <footer className="bg-slate-950 pt-24 pb-12 border-t border-slate-900 relative overflow-hidden">
        {/* Background Beams */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src="/adfluencer-logo.png" alt="Adfluencer" className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold text-white tracking-tight">Adfluencer</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The enterprise-grade marketplace for creators and brands. Automated, secure, and data-driven.
              </p>
              <div className="flex gap-4">
                {[Twitter, Instagram, Linkedin, Globe].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-rose-500/50 hover:bg-rose-500/10 transition-all duration-300">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-white font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                {['Browse Creators', 'For Brands', 'Pricing', 'Case Studies', 'Enterprise'].map(item => (
                  <li key={item}><a href="#" className="hover:text-rose-400 transition-colors flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-5 group-hover:ml-0" />
                    {item}
                  </a></li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                {['About Us', 'Careers', 'Blog', 'Press Kit', 'Contact'].map(item => (
                  <li key={item}><a href="#" className="hover:text-rose-400 transition-colors flex items-center gap-2">
                    {item}
                    {item === 'Careers' && <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-md">WE'RE HIRING</span>}
                  </a></li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-bold mb-6">Stay Updated</h4>
              <p className="text-slate-400 text-sm mb-4">Latest features and creator trends delivered to your inbox.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500 w-full"
                />
                <Button size="sm" className="bg-rose-600 hover:bg-rose-500">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs text-center md:text-left">
            <p className="mb-4 md:mb-0">
              © 2024 Adfluencer Inc. All rights reserved.
              <span className="mx-2">|</span>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span className="mx-2">|</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
