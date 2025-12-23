import { Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import {
  Megaphone, Users, TrendingUp, Shield, ArrowRight, Star, DollarSign, Zap,
  BarChart3, MessageSquare, Award, Play, ChevronRight, Instagram, Youtube,
  Twitter, Sparkles, Rocket, Target, Gift, Percent, Clock, ChevronLeft,
} from 'lucide-react';
import Button from '../components/ui/Button';

const stats = [
  { value: 10000, suffix: '+', label: 'Active Influencers' },
  { value: 5000, suffix: '+', label: 'Brands' },
  { value: 2, prefix: '$', suffix: 'M+', label: 'Paid to Creators' },
  { value: 15000, suffix: '+', label: 'Campaigns Completed' },
];

const platforms = [
  { name: 'Instagram', icon: Instagram },
  { name: 'YouTube', icon: Youtube },
  { name: 'Twitter', icon: Twitter },
  { name: 'TikTok', icon: Play },
];

const offers = [
  { icon: Gift, title: 'New User Bonus', desc: 'Get $50 credit on first campaign', color: 'from-emerald-500 to-teal-500', badge: 'LIMITED' },
  { icon: Percent, title: '20% Off Premium', desc: 'Upgrade to Pro and save big', color: 'from-purple-500 to-pink-500', badge: 'HOT' },
  { icon: Rocket, title: 'Launch Special', desc: 'Free featured listing for brands', color: 'from-orange-500 to-red-500', badge: 'NEW' },
  { icon: Target, title: 'Referral Rewards', desc: 'Earn $25 for every referral', color: 'from-blue-500 to-cyan-500', badge: 'EARN' },
  { icon: Clock, title: 'Flash Deal', desc: '50% off verification today', color: 'from-rose-500 to-pink-500', badge: '24H' },
  { icon: Sparkles, title: 'Creator Boost', desc: 'Triple visibility first week', color: 'from-amber-500 to-yellow-500', badge: 'BOOST' },
];

const testimonials = [
  { quote: 'InfluenceHub helped us find the perfect creators. The ROI was incredible!', author: 'Sarah Chen', role: 'Marketing Director', company: 'TechStart Inc.', rating: 5 },
  { quote: "I've doubled my income since joining. Easy to find quality brands.", author: 'Marcus Johnson', role: 'Content Creator', company: '500K+ Followers', rating: 5 },
  { quote: "Transparent and fair. We've run 20+ successful campaigns here.", author: 'Emily Rodriguez', role: 'Brand Manager', company: 'Fashion Forward', rating: 5 },
];

const features = [
  { icon: Shield, title: 'Verified Profiles', desc: 'Authentic follower counts and engagement metrics.' },
  { icon: TrendingUp, title: 'Smart Matching', desc: 'Algorithm matches based on niche and budget.' },
  { icon: DollarSign, title: 'Secure Payments', desc: 'Escrow-protected payments for safety.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track performance with detailed metrics.' },
  { icon: MessageSquare, title: 'Direct Messaging', desc: 'Secure communication system.' },
  { icon: Award, title: 'Review System', desc: 'Build trust with verified reviews.' },
];


function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let current = 0;
      const timer = setInterval(() => {
        current += value / 60;
        if (current >= value) { setCount(value); clearInterval(timer); }
        else { setCount(Math.floor(current)); }
      }, 33);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function Card3D({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRotate({ x: (e.clientY - rect.top - rect.height / 2) / 10, y: (rect.width / 2 - (e.clientX - rect.left)) / 10 });
  };
  return (
    <motion.div className={`transform-gpu ${className}`} style={{ perspective: 1000 }}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseMove={handleMove} onMouseLeave={() => setRotate({ x: 0, y: 0 })}>
      {children}
    </motion.div>
  );
}

function FloatingElement({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}>{children}</motion.div>;
}

function OffersCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (dir: 'left' | 'right') => scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });

  useEffect(() => {
    const ref = scrollRef.current;
    ref?.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => ref?.removeEventListener('scroll', checkScroll);
  }, []);

  return (
    <div className="relative">
      {canScrollLeft && <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800/90 rounded-full flex items-center justify-center text-white hover:bg-slate-700 border border-slate-700"><ChevronLeft className="w-6 h-6" /></button>}
      {canScrollRight && <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-slate-800/90 rounded-full flex items-center justify-center text-white hover:bg-slate-700 border border-slate-700"><ChevronRight className="w-6 h-6" /></button>}
      <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 px-2 snap-x" style={{ scrollbarWidth: 'none' }}>
        {offers.map((offer, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, y: -5 }} className="flex-shrink-0 w-[300px] snap-start">
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${offer.color} p-6 h-[200px] shadow-xl`}>
              <div className="absolute top-3 right-3 px-2 py-1 bg-white/20 rounded-full text-xs font-bold text-white">{offer.badge}</div>
              <offer.icon className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
              <p className="text-white/80 text-sm">{offer.desc}</p>
              <button className="mt-4 text-white font-medium text-sm flex items-center gap-1">Claim Now <ArrowRight className="w-4 h-4" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


function GradientOrb({ className = '' }: { className?: string }) {
  return <motion.div className={`absolute rounded-full blur-3xl ${className}`} animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />;
}

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 0.8]), { stiffness: 100, damping: 30 });

  return (
    <div className="overflow-hidden bg-slate-900">
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <GradientOrb className="w-[600px] h-[600px] bg-rose-500/30 -top-40 -left-40" />
        <GradientOrb className="w-[500px] h-[500px] bg-purple-500/20 top-1/2 right-0" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 bg-rose-500/10 rounded-full px-4 py-2 text-rose-400 text-sm mb-6 border border-rose-500/20">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}><Zap className="w-4 h-4" /></motion.div>
                <span>The #1 Influencer Marketing Platform</span>
                <Sparkles className="w-4 h-4" />
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>Connect Brands with</motion.span>
                <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="block bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Top Creators</motion.span>
              </h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 text-xl text-slate-300 max-w-xl">
                The professional marketplace where brands find perfect influencers and creators land dream campaigns.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link to="/register?role=CLIENT">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="w-full sm:w-auto">I'm a Brand <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ArrowRight className="h-5 w-5 ml-2 inline" /></motion.span></Button>
                  </motion.div>
                </Link>
                <Link to="/register?role=INFLUENCER">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto border-slate-600 hover:bg-slate-800">I'm a Creator <ArrowRight className="ml-2 h-5 w-5" /></Button>
                  </motion.div>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-12 flex items-center gap-6">
                <span className="text-slate-400 text-sm">Supported:</span>
                <div className="flex items-center gap-3">
                  {platforms.map((p, i) => (
                    <FloatingElement key={p.name} delay={i * 0.5}>
                      <motion.div whileHover={{ scale: 1.2, rotate: 10 }} className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center" title={p.name}>
                        <p.icon className="w-5 h-5 text-slate-300" />
                      </motion.div>
                    </FloatingElement>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="hidden lg:block">
              <Card3D>
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 + i * 0.1 }} className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                        <p className="text-3xl font-bold text-white"><AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} /></p>
                        <p className="text-slate-400 mt-1 text-sm">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card3D>
            </motion.div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex flex-col items-center gap-2 text-slate-400">
            <span className="text-sm">Scroll to explore</span>
            <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex justify-center pt-2">
              <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      </section>


      {/* Offers */}
      <section className="relative py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="inline-flex items-center gap-2 bg-amber-500/20 rounded-full px-4 py-2 text-amber-400 text-sm mb-4 border border-amber-500/30">
              <Gift className="w-4 h-4" /><span>Special Offers</span>
            </motion.div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white">Exclusive Deals for You</h2>
            <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">Limited time offers to supercharge your journey</p>
          </motion.div>
          <OffersCarousel />
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">How It Works</h2>
            <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">Get started in minutes with our simple process</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Card3D>
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 hover:border-rose-500/30 transition-colors h-full">
                  <div className="flex items-center gap-4 mb-8">
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                      <Megaphone className="h-7 w-7 text-white" />
                    </motion.div>
                    <div><h3 className="text-xl font-bold text-white">For Brands</h3><p className="text-slate-400">Find your perfect creator</p></div>
                  </div>
                  <div className="space-y-6">
                    {['Post Your Campaign', 'Receive Proposals', 'Review & Select', 'Collaborate & Launch'].map((title, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4 group">
                        <motion.div whileHover={{ scale: 1.2 }} className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm group-hover:bg-rose-500 group-hover:text-white transition-colors">{i + 1}</motion.div>
                        <p className="font-semibold text-white pt-1">{title}</p>
                      </motion.div>
                    ))}
                  </div>
                  <Link to="/register?role=CLIENT" className="mt-8 block"><motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Button className="w-full">Start as a Brand <ChevronRight className="w-4 h-4 ml-1" /></Button></motion.div></Link>
                </div>
              </Card3D>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Card3D>
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/30 transition-colors h-full">
                  <div className="flex items-center gap-4 mb-8">
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Users className="h-7 w-7 text-white" />
                    </motion.div>
                    <div><h3 className="text-xl font-bold text-white">For Creators</h3><p className="text-slate-400">Monetize your influence</p></div>
                  </div>
                  <div className="space-y-6">
                    {['Create Your Profile', 'Browse Campaigns', 'Submit Proposals', 'Get Paid'].map((title, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4 group">
                        <motion.div whileHover={{ scale: 1.2 }} className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm group-hover:bg-purple-500 group-hover:text-white transition-colors">{i + 1}</motion.div>
                        <p className="font-semibold text-white pt-1">{title}</p>
                      </motion.div>
                    ))}
                  </div>
                  <Link to="/register?role=INFLUENCER" className="mt-8 block"><motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Button variant="secondary" className="w-full border-slate-600 hover:bg-slate-700">Start as a Creator <ChevronRight className="w-4 h-4 ml-1" /></Button></motion.div></Link>
                </div>
              </Card3D>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Features */}
      <section className="relative bg-slate-800/30 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">Everything You Need</h2>
            <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">Powerful features to help you succeed</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card3D>
                  <motion.div whileHover={{ y: -5 }} className="group p-6 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:border-rose-500/50 transition-all h-full">
                    <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.5 }} className="w-12 h-12 rounded-lg bg-rose-500/10 group-hover:bg-rose-500 flex items-center justify-center mb-4 transition-colors">
                      <f.icon className="h-6 w-6 text-rose-400 group-hover:text-white transition-colors" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-slate-400">{f.desc}</p>
                  </motion.div>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <GradientOrb className="w-[400px] h-[400px] bg-rose-500/20 top-0 left-0" />
        <GradientOrb className="w-[300px] h-[300px] bg-purple-500/20 bottom-0 right-0" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">Loved by Thousands</h2>
            <p className="mt-4 text-xl text-slate-400">See what our users say</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}>
                <Card3D>
                  <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 h-full">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(t.rating)].map((_, j) => <motion.div key={j} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.2 + j * 0.1 }}><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /></motion.div>)}
                    </div>
                    <p className="text-slate-300 mb-6">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-bold">{t.author.charAt(0)}</motion.div>
                      <div><p className="font-semibold text-white">{t.author}</p><p className="text-sm text-slate-400">{t.role}, {t.company}</p></div>
                    </div>
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-0 right-0 w-96 h-96 bg-rose-500 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">Ready to Transform Your Marketing?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Join thousands of brands and creators already growing with InfluenceHub.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Button size="lg">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Button></motion.div></Link>
            <Link to="/login"><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Button size="lg" variant="secondary" className="border-slate-600 hover:bg-slate-800">Sign In</Button></motion.div></Link>
          </div>
          <p className="mt-6 text-slate-400 text-sm">No credit card required • Free forever for basic features</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center"><Megaphone className="h-5 w-5 text-white" /></motion.div>
                <span className="text-xl font-bold text-white">InfluenceHub</span>
              </div>
              <p className="text-sm">The professional marketplace connecting brands with influencers worldwide.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">For Brands</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register?role=CLIENT" className="hover:text-white transition-colors">Post a Campaign</Link></li>
                <li><Link to="/register?role=CLIENT" className="hover:text-white transition-colors">Find Influencers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">For Creators</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register?role=INFLUENCER" className="hover:text-white transition-colors">Join as Creator</Link></li>
                <li><Link to="/register?role=INFLUENCER" className="hover:text-white transition-colors">Browse Campaigns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} InfluenceHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
