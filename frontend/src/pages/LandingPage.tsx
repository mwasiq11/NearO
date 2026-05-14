import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Shield,
  Users,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Wrench,
  BookOpen,
  PawPrint,
  Dumbbell,
  Leaf,
  Search,
  MessageSquare,
  Compass,
  HeartHandshake,
  PartyPopper,
  Lock,
  Activity,
  Server,
  Headset,
  CheckCircle,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Iridescence from '@/components/animations/Iridescence';
import LogoLoop from '@/components/animations/LogoLoop';
import BorderGlow from '@/components/animations/BorderGlow';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'home-repair', name: 'Home Repair', icon: Wrench, color: 'bg-orange-100 text-orange-600', count: 156 },
  { id: 'tutoring', name: 'Tutoring', icon: BookOpen, color: 'bg-blue-100 text-blue-600', count: 89 },
  { id: 'cleaning', name: 'Cleaning', icon: Sparkles, color: 'bg-purple-100 text-purple-600', count: 134 },
  { id: 'pet-care', name: 'Pet Care', icon: PawPrint, color: 'bg-rose-100 text-rose-600', count: 245 },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell, color: 'bg-emerald-100 text-emerald-600', count: 189 },
  { id: 'gardening', name: 'Gardening', icon: Leaf, color: 'bg-lime-100 text-lime-600', count: 67 },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Global Background Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Iridescence
          color={[0.0, 0.68, 0.4]}
          mouseReact={true}
          amplitude={0.1}
          speed={0.5}
          className="opacity-60"
        />
      </div>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/[0.03] backdrop-blur-2xl border-b border-white/10 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1 group">
            <div className="h-10 w-10 flex items-center justify-center -ml-2">
              <img
                src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493"
                alt="NearO"
                className="h-[120%] w-[120%] object-contain brightness-0 invert transform-gpu drop-shadow-sm relative z-10"
              />
            </div>
            <div className="overflow-hidden transition-all duration-500 ease-in-out w-0 opacity-0 group-hover:w-[90px] group-hover:opacity-100 flex items-center whitespace-nowrap transform-gpu relative -ml-1">
              <span style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-2xl text-white tracking-tight transform -translate-x-8 group-hover:translate-x-0 transition-all duration-500 ease-out pl-2 py-1">NearO</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/dashboard/browse" className="text-white/70 hover:text-white transition-colors font-medium">
              Browse Services
            </Link>
            <Link to="/how-it-works" className="text-white/70 hover:text-white transition-colors font-medium">
              How It Works
            </Link>
            <Link to="/about" className="text-white/70 hover:text-white transition-colors font-medium">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/login')}>
              Log In
            </Button>
            <Button 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold shadow-lg shadow-black/5"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 overflow-hidden min-h-screen flex items-center">
        <div className="container mx-auto relative z-10 pt-20">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center space-y-8"
            >


              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
                  <span style={{ fontFamily: 'Poppins, sans-serif' }} className="text-white drop-shadow-2xl pb-2 block">
                    NearO
                  </span>
                </h1>

                <h2 className="text-xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg leading-tight">
                  Your Community, Your Services
                </h2>
              </div>

              <p className="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-md max-w-[90%] sm:max-w-2xl mx-auto leading-relaxed font-medium">
                Connect with trusted local providers for home repairs, tutoring, pet care, and more.
                Build relationships with your neighbors while getting things done.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="xl"
                  className="group bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl font-bold shadow-xl transition-all duration-500"
                  onClick={() => navigate('/signup')}
                >
                  Find Services
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  className="text-sm sm:text-base bg-white/5 text-white border-white/10 hover:bg-white/10 backdrop-blur-md"
                  onClick={() => navigate('/signup')}
                >
                  Become a Provider
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-8 justify-center">
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enterprise Grade Section */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-indigo-500/20 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 backdrop-blur-md">
              <Shield className="h-4 w-4 mr-2 inline-block" />
              Trusted Reliability
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">Enterprise Grade by Design</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Built rigorously for scale, security, and uncompromising performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                id: 'ent-1',
                title: 'Data Security',
                description: 'End-to-end encryption and robust access controls ensuring your data remains completely private.',
                glowColor: '217 91% 60%',
                colors: ['#3b82f6', '#60a5fa', '#2563eb'],
                icon: Lock,
              },
              {
                id: 'ent-2',
                title: 'High Availability',
                description: 'Globally distributed architecture guaranteeing 99.99% uptime for mission-critical operations.',
                glowColor: '160 84% 65%',
                colors: ['#10b981', '#34d399', '#059669'],
                icon: Server,
              },
              {
                id: 'ent-3',
                title: 'Global Compliance',
                description: 'Certified to meet the most stringent international regulatory and compliance standards.',
                glowColor: '280 80% 60%',
                colors: ['#a855f7', '#c084fc', '#9333ea'],
                icon: CheckCircle,
              },
              {
                id: 'ent-4',
                title: 'Infinite Scalability',
                description: 'Elastic infrastructure that instantly scales up or down based on your real-time demands.',
                glowColor: '24 95% 53%',
                colors: ['#f97316', '#fb923c', '#ea580c'],
                icon: Activity,
              },
              {
                id: 'ent-5',
                title: 'Worldwide Reach',
                description: 'Low-latency global edge network serving users flawlessly no matter their location.',
                glowColor: '316 70% 50%',
                colors: ['#ec4899', '#f472b6', '#db2777'],
                icon: Globe,
              },
              {
                id: 'ent-6',
                title: '24/7 Support',
                description: 'Dedicated engineering and support experts available around the clock for rapid resolution.',
                glowColor: '45 93% 47%',
                colors: ['#eab308', '#facc15', '#ca8a04'],
                icon: Headset,
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full group"
                >
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor={item.glowColor}
                    backgroundColor="transparent"
                    borderRadius={28}
                    glowRadius={40}
                    glowIntensity={1.5}
                    coneSpread={25}
                    animated={false}
                    colors={item.colors}
                    className="w-full h-[260px] bg-white/5 backdrop-blur-sm shadow-xl"
                  >
                    <div className="p-8 flex flex-col justify-start h-full text-left">
                      <div className="mb-6 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 self-start">
                        <Icon className="h-8 w-8" style={{ color: item.colors[0] }} fill="currentColor" fillOpacity={0.2} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white tracking-wide">{item.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </BorderGlow>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 backdrop-blur-md">
              <Sparkles className="h-4 w-4 mr-2 inline-block" />
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">How It Works</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'Search & Discover',
                description: 'Browse services in your neighborhood or search for specific skills you need for your home. NearO connects you with the best local talent instantly.',
                glowColor: '217 91% 60%',
                colors: ['#3b82f6', '#60a5fa', '#2563eb'],
                icon: Compass,
              },
              {
                step: '02',
                title: 'Connect & Chat',
                description: 'Message providers directly to discuss your needs.',
                glowColor: '160 84% 65%',
                colors: ['#10b981', '#34d399', '#059669'],
                icon: HeartHandshake,
              },
              {
                step: '03',
                title: 'Book & Smile',
                description: 'Confirm your booking and get the job done beautifully.',
                glowColor: '24 95% 53%',
                colors: ['#f97316', '#fb923c', '#ea580c'],
                icon: PartyPopper,
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="w-full group"
                >
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor={item.glowColor}
                    backgroundColor="transparent"
                    borderRadius={28}
                    glowRadius={40}
                    glowIntensity={1.5}
                    coneSpread={25}
                    animated={false}
                    colors={item.colors}
                    className="w-full h-[260px] bg-white/5 backdrop-blur-sm shadow-xl"
                  >
                    <div className="p-8 flex flex-col justify-start h-full text-left">
                      <div className="mb-6 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 self-start">
                        <Icon className="h-8 w-8" style={{ color: item.colors[0] }} fill="currentColor" fillOpacity={0.2} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white tracking-wide">{item.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </BorderGlow>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-transparent border-t border-white/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-1 mb-4 group cursor-default">
                <div className="h-10 w-10 flex items-center justify-center -ml-2">
                  <img
                    src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493"
                    alt="NearO"
                    className="h-[120%] w-[120%] object-contain brightness-0 invert transform-gpu drop-shadow-sm relative z-10"
                  />
                </div>
                <div className="overflow-hidden transition-all duration-500 ease-in-out w-0 opacity-0 group-hover:w-[80px] group-hover:opacity-100 flex items-center whitespace-nowrap transform-gpu relative -ml-1">
                  <span style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-xl text-white tracking-tight transform -translate-x-8 group-hover:translate-x-0 transition-all duration-500 ease-out pl-2 py-1">NearO</span>
                </div>
              </div>
              <p className="text-white/50">
                Building stronger communities through local connections.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">For Seekers</h4>
              <ul className="space-y-2 text-white/50">
                <li><Link to="/dashboard/browse" className="hover:text-emerald-400 transition-colors">Browse Services</Link></li>
                <li><Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</Link></li>
                <li><Link to="/safety" className="hover:text-emerald-400 transition-colors">Safety Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">For Providers</h4>
              <ul className="space-y-2 text-white/50">
                <li><Link to="/signup" className="hover:text-emerald-400 transition-colors">Get Started</Link></li>
                <li><Link to="/resources" className="hover:text-emerald-400 transition-colors">Resources</Link></li>
                <li><Link to="/success-stories" className="hover:text-emerald-400 transition-colors">Success Stories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-white/50">
                <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/30">
            <p>&copy; {new Date().getFullYear()} NearO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
