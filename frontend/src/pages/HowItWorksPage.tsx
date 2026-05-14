import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle2,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  ArrowRight,
  Compass,
  HeartHandshake,
  PartyPopper
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Iridescence from "@/components/animations/Iridescence";
import BorderGlow from "@/components/animations/BorderGlow";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Discover Local Services",
    description: "Search by category, location, or availability to find trusted providers near you.",
    icon: Search,
    glowColor: "217 91% 60%", // Blue
    colors: ['#3b82f6', '#60a5fa', '#2563eb'],
  },
  {
    title: "Chat and Confirm",
    description: "Message providers to align on pricing, timing, and expectations before booking.",
    icon: MessageCircle,
    glowColor: "160 84% 65%", // Emerald
    colors: ['#10b981', '#34d399', '#059669'],
  },
  {
    title: "Book with Confidence",
    description: "Secure payments, verified profiles, and review tools keep everything transparent.",
    icon: CalendarCheck,
    glowColor: "24 95% 53%", // Orange
    colors: ['#f97316', '#fb923c', '#ea580c'],
  },
];

const trustItems = [
  {
    title: "Verified Providers",
    description: "ID checks and profile reviews create a trusted marketplace.",
  },
  {
    title: "Transparent Reviews",
    description: "Honest ratings and detailed feedback help you choose confidently.",
  },
  {
    title: "Secure Payments",
    description: "Payment protection gives you peace of mind for every booking.",
  },
];

const providerSteps = [
  "Create a service profile with photos, pricing, and availability.",
  "Respond to requests and confirm the booking details.",
  "Deliver great work and grow your local reputation.",
];

const HowItWorksPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden text-white">
      {/* Global Background Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Iridescence
          color={[0.0, 0.68, 0.4]}
          mouseReact={true}
          amplitude={0.1}
          speed={0.5}
          className="opacity-40"
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
            <Link to="/how-it-works" className="text-white font-medium">
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

      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 backdrop-blur-md">
                <Sparkles className="h-4 w-4 mr-2" />
                How NearO Works
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                Find local help in <span className="text-emerald-400">minutes</span>, not hours.
              </h1>
              <p className="text-xl text-white/70 leading-relaxed max-w-xl">
                From quick repairs to ongoing projects, NearO keeps everything simple with verified
                providers, secure payments, and neighborhood reviews.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="xl" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl font-bold" onClick={() => navigate("/signup")}>
                  Start Booking
                </Button>
                <Button size="xl" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={() => navigate("/dashboard/browse")}>
                  Browse Services
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <BorderGlow
                edgeSensitivity={30}
                glowColor="160 84% 65%"
                backgroundColor="rgba(255, 255, 255, 0.03)"
                borderRadius={40}
                glowRadius={50}
                glowIntensity={1.2}
                colors={['#10b981', '#34d399', '#059669']}
              >
                <div className="p-8 md:p-10">
                  <div className="pb-6">
                    <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
                      <div className="p-2 rounded-xl bg-emerald-500/20">
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                      Built for Trust
                    </h3>
                  </div>
                  <div className="space-y-6">
                    <p className="text-lg text-white/80 leading-relaxed">
                      Our trust framework keeps the community safe with verified profiles, clear policies,
                      and ongoing monitoring.
                    </p>
                    <div className="grid gap-4">
                      {trustItems.map((item) => (
                        <div key={item.title} className="flex gap-4 rounded-2xl bg-white/[0.05] border border-white/10 p-5 group hover:bg-white/[0.08] transition-colors">
                          <CheckCircle2 className="h-6 w-6 text-emerald-400 mt-1" />
                          <div>
                            <p className="text-xl font-bold text-white">{item.title}</p>
                            <p className="text-white/60">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </BorderGlow>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 relative">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Three Simple Steps</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Book trusted help with just a few taps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "Discover Local Services",
                description: "Search by category, location, or availability to find trusted providers near you. Our advanced filtering makes finding the perfect help effortless.",
                icon: Search,
                glowColor: "217 91% 60%", // Blue
                colors: ['#3b82f6', '#60a5fa', '#2563eb']
              },
              {
                title: "Chat and Confirm",
                description: "Message providers to align on pricing and timing.",
                icon: MessageCircle,
                glowColor: "160 84% 65%", // Emerald
                colors: ['#10b981', '#34d399', '#059669']
              },
              {
                title: "Book with Confidence",
                description: "Secure payments and verified profiles keep everything transparent.",
                icon: CalendarCheck,
                glowColor: "24 95% 53%", // Orange
                colors: ['#f97316', '#fb923c', '#ea580c']
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="w-full group"
                >
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor={step.glowColor}
                    backgroundColor="transparent"
                    borderRadius={28}
                    glowRadius={40}
                    glowIntensity={1.5}
                    coneSpread={25}
                    animated={false}
                    colors={step.colors}
                    className="w-full h-[260px] bg-white/5 backdrop-blur-sm shadow-xl"
                  >
                    <div className="p-8 flex flex-col justify-start h-full text-left">
                      <div className="mb-6 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 self-start">
                        <Icon className="h-8 w-8" style={{ color: step.colors[0] }} fill="currentColor" fillOpacity={0.2} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{step.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </BorderGlow>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="container mx-auto relative z-10 grid lg:grid-cols-2 gap-12">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="200 80% 60%"
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderRadius={48}
            glowRadius={60}
            glowIntensity={1.5}
            colors={['#3b82f6', '#60a5fa', '#2563eb']}
          >
            <div className="p-10">
              <div className="mb-8">
                <h3 className="text-3xl font-bold flex items-center gap-3 text-white">
                  <div className="p-2.5 rounded-2xl bg-white/[0.05]">
                    <Users className="h-7 w-7 text-blue-400" />
                  </div>
                  For Service Seekers
                </h3>
              </div>
              <div className="space-y-8">
                <p className="text-xl text-white/70 leading-relaxed">
                  Filter by neighborhood, read real reviews, and chat with providers before you book.
                </p>
                <div className="space-y-4">
                  {["Personalized recommendations", "Instant messaging", "Protected payments"].map((item) => (
                    <div key={item} className="flex items-center gap-4 text-lg text-white/60">
                      <CheckCircle2 className="h-6 w-6 text-blue-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/10 text-white text-lg h-14 px-8 rounded-2xl" onClick={() => navigate("/dashboard/browse")}>
                  Find a Provider
                </Button>
              </div>
            </div>
          </BorderGlow>

          <BorderGlow
            edgeSensitivity={30}
            glowColor="160 84% 65%"
            backgroundColor="rgba(255, 255, 255, 0.03)"
            borderRadius={48}
            glowRadius={60}
            glowIntensity={1.5}
            colors={['#10b981', '#34d399', '#059669']}
          >
            <div className="p-10">
              <div className="mb-8">
                <h3 className="text-3xl font-bold flex items-center gap-3 text-white">
                  <div className="p-2.5 rounded-2xl bg-white/[0.05]">
                    <MessageCircle className="h-7 w-7 text-emerald-400" />
                  </div>
                  For Providers
                </h3>
              </div>
              <div className="space-y-8">
                <p className="text-xl text-white/70 leading-relaxed">
                  Build your local reputation, manage bookings, and grow your business on your schedule.
                </p>
                <div className="space-y-4">
                  {providerSteps.map((step) => (
                    <div key={step} className="flex items-start gap-4 text-lg text-white/60">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 mt-1 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/10 text-white text-lg h-14 px-8 rounded-2xl" onClick={() => navigate("/signup")}>
                  Become a Provider
                </Button>
              </div>
            </div>
          </BorderGlow>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="relative w-full rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-3xl">
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-teal-400/20 rounded-full blur-[80px] translate-y-1/2 pointer-events-none" />
            <div className="relative z-10 p-12 md:p-24 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto"
              >
                <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight leading-tight">
                  Ready to see NearO in action?
                </h2>
                <p className="text-xl text-white/60 mb-12 leading-relaxed">
                  Create your account and start connecting with trusted neighbors today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="xl" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl font-bold shadow-xl" onClick={() => navigate("/signup")}>
                    Get Started
                  </Button>
                  <Button size="xl" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={() => navigate("/about")}>
                    Learn About NearO
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-transparent border-t border-white/10 py-16 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-1 mb-6 group cursor-default">
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
              <p className="text-white/50 text-lg leading-relaxed">
                Building stronger communities through local connections.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">For Seekers</h4>
              <ul className="space-y-4 text-white/50">
                <li><Link to="/dashboard/browse" className="hover:text-emerald-400 transition-colors">Browse Services</Link></li>
                <li><Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</Link></li>
                <li><Link to="/safety" className="hover:text-emerald-400 transition-colors">Safety Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">For Providers</h4>
              <ul className="space-y-4 text-white/50">
                <li><Link to="/signup" className="hover:text-emerald-400 transition-colors">Get Started</Link></li>
                <li><Link to="/resources" className="hover:text-emerald-400 transition-colors">Resources</Link></li>
                <li><Link to="/success-stories" className="hover:text-emerald-400 transition-colors">Success Stories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
              <ul className="space-y-4 text-white/50">
                <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-16 pt-8 text-center text-white/30">
            <p>&copy; {new Date().getFullYear()} NearO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorksPage;
