import { Link } from 'react-router-dom';
import {
  Megaphone, Users, TrendingUp, Shield, ArrowRight, CheckCircle,
  Star, DollarSign, Zap, Globe, Instagram, Youtube, Twitter,
  BarChart3, MessageSquare, Award, Play, ChevronRight
} from 'lucide-react';
import Button from '../components/ui/Button';

const stats = [
  { value: '10K+', label: 'Active Influencers' },
  { value: '5K+', label: 'Brands' },
  { value: '$2M+', label: 'Paid to Creators' },
  { value: '15K+', label: 'Campaigns Completed' },
];

const platforms = [
  { name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500' },
  { name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600' },
  { name: 'Twitter', icon: Twitter, color: 'from-blue-400 to-blue-500' },
  { name: 'TikTok', icon: Play, color: 'from-gray-800 to-gray-900' },
];

const testimonials = [
  {
    quote: "InfluenceHub helped us find the perfect creators for our product launch. The ROI was incredible!",
    author: "Sarah Chen",
    role: "Marketing Director",
    company: "TechStart Inc.",
    rating: 5,
  },
  {
    quote: "As an influencer, I've doubled my income since joining. The platform makes it easy to find quality brands.",
    author: "Marcus Johnson",
    role: "Content Creator",
    company: "500K+ Followers",
    rating: 5,
  },
  {
    quote: "The bidding system is transparent and fair. We've run 20+ successful campaigns through the platform.",
    author: "Emily Rodriguez",
    role: "Brand Manager",
    company: "Fashion Forward",
    rating: 5,
  },
];

const features = [
  {
    icon: Shield,
    title: 'Verified Profiles',
    description: 'All influencers are verified with authentic follower counts and engagement metrics.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Matching',
    description: 'Our algorithm matches brands with influencers based on niche, audience, and budget.',
  },
  {
    icon: DollarSign,
    title: 'Secure Payments',
    description: 'Escrow-protected payments ensure both parties are satisfied before funds are released.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track campaign performance with detailed analytics and ROI metrics.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Messaging',
    description: 'Communicate directly with brands or influencers through our secure messaging system.',
  },
  {
    icon: Award,
    title: 'Review System',
    description: 'Build trust with verified reviews from completed campaigns.',
  },
];

export default function Landing() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm mb-6">
                <Zap className="w-4 h-4" />
                <span>The #1 Influencer Marketing Platform</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                Connect Brands with
                <span className="block text-primary-200">Top Creators</span>
              </h1>
              <p className="mt-6 text-xl text-primary-100 max-w-xl">
                The professional marketplace where brands find perfect influencers and creators land dream campaigns. Start growing today.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link to="/register?role=CLIENT">
                  <Button size="lg" className="w-full sm:w-auto bg-white !text-primary-700 hover:bg-primary-50">
                    I'm a Brand <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/register?role=INFLUENCER">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto border-white/30 !text-white hover:bg-white/10 !bg-transparent">
                    I'm a Creator <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Platform Icons */}
              <div className="mt-12 flex items-center gap-6">
                <span className="text-primary-200 text-sm">Supported platforms:</span>
                <div className="flex items-center gap-4">
                  {platforms.map((p) => (
                    <div
                      key={p.name}
                      className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center"
                      title={p.name}
                    >
                      <p.icon className="w-5 h-5 text-white" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center p-4">
                      <p className="text-4xl font-bold text-white">{stat.value}</p>
                      <p className="text-primary-200 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Mobile */}
      <section className="lg:hidden bg-primary-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-primary-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes. Our streamlined process makes influencer marketing simple.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* For Brands */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Megaphone className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">For Brands</h3>
                  <p className="text-gray-500">Find your perfect creator match</p>
                </div>
              </div>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Post Your Campaign', desc: 'Describe your goals, budget, and requirements' },
                  { step: '2', title: 'Receive Proposals', desc: 'Get bids from qualified influencers' },
                  { step: '3', title: 'Review & Select', desc: 'Compare profiles, portfolios, and pricing' },
                  { step: '4', title: 'Collaborate & Launch', desc: 'Work together and track results' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register?role=CLIENT" className="mt-8 block">
                <Button className="w-full">
                  Start as a Brand <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* For Influencers */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">For Creators</h3>
                  <p className="text-gray-500">Monetize your influence</p>
                </div>
              </div>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Create Your Profile', desc: 'Showcase your stats, niche, and portfolio' },
                  { step: '2', title: 'Browse Campaigns', desc: 'Find opportunities that match your style' },
                  { step: '3', title: 'Submit Proposals', desc: 'Pitch your ideas and set your price' },
                  { step: '4', title: 'Get Paid', desc: 'Deliver content and receive secure payments' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register?role=INFLUENCER" className="mt-8 block">
                <Button variant="secondary" className="w-full">
                  Start as a Creator <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Everything You Need</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you succeed in influencer marketing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-100 group-hover:bg-primary-600 flex items-center justify-center mb-4 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Loved by Thousands</h2>
            <p className="mt-4 text-xl text-gray-600">See what our users have to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of brands and creators already growing with InfluenceHub. Start for free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-white !text-primary-700 hover:bg-primary-50">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto border-white/30 !text-white hover:bg-white/10 !bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-primary-200 text-sm">
            No credit card required • Free forever for basic features
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="h-7 w-7 text-primary-500" />
                <span className="text-xl font-bold text-white">InfluenceHub</span>
              </div>
              <p className="text-sm">
                The professional marketplace connecting brands with influencers worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">For Brands</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register?role=CLIENT" className="hover:text-white transition-colors">Post a Campaign</Link></li>
                <li><Link to="/register?role=CLIENT" className="hover:text-white transition-colors">Find Influencers</Link></li>
                <li><Link to="/register?role=CLIENT" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">For Creators</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register?role=INFLUENCER" className="hover:text-white transition-colors">Join as Creator</Link></li>
                <li><Link to="/register?role=INFLUENCER" className="hover:text-white transition-colors">Browse Campaigns</Link></li>
                <li><Link to="/register?role=INFLUENCER" className="hover:text-white transition-colors">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} InfluenceHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
