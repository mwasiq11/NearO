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
  PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const categories = [
  { id: 'home-repair', name: 'Home Repair', icon: Wrench, color: 'bg-orange-100 text-orange-600', count: 156 },
  { id: 'tutoring', name: 'Tutoring', icon: BookOpen, color: 'bg-blue-100 text-blue-600', count: 89 },
  { id: 'cleaning', name: 'Cleaning', icon: Sparkles, color: 'bg-purple-100 text-purple-600', count: 134 },
  { id: 'pet-care', name: 'Pet Care', icon: PawPrint, color: 'bg-rose-100 text-rose-600', count: 245 },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell, color: 'bg-emerald-100 text-emerald-600', count: 189 },
  { id: 'gardening', name: 'Gardening', icon: Leaf, color: 'bg-lime-100 text-lime-600', count: 67 },
];

const stats = [
  { label: 'Active Providers', value: '2,500+' },
  { label: 'Services Completed', value: '15,000+' },
  { label: 'Neighborhoods', value: '50+' },
  { label: 'Happy Customers', value: '98%' },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1 group">
            <div className="h-10 w-10 flex items-center justify-center -ml-2">
              <img 
                src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" 
                alt="NearO" 
                className="h-[120%] w-[120%] object-contain mix-blend-multiply dark:invert dark:-hue-rotate-180 dark:mix-blend-screen transform-gpu drop-shadow-sm relative z-10" 
              />
            </div>
            <div className="overflow-hidden transition-all duration-500 ease-in-out w-0 opacity-0 group-hover:w-[90px] group-hover:opacity-100 flex items-center whitespace-nowrap transform-gpu relative -ml-1">
              <span style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent tracking-tight transform -translate-x-8 group-hover:translate-x-0 transition-all duration-500 ease-out pl-2 py-1">NearO</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/dashboard/browse" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse Services
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Log In
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth/moderator-login')}>
              Moderator
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth/admin-login')}>
              Admin
            </Button>
            <Button variant="hero" onClick={() => navigate('/signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center space-y-8"
            >
            

              <div className="space-y-4">
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                  <span style={{ fontFamily: 'Poppins, sans-serif' }} className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent pb-2 block">
                    NearO
                  </span>
                </h1>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Your Community, Your Services
                </h2>
              </div>

              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Connect with trusted local providers for home repairs, tutoring, pet care, and more.
                Build relationships with your neighbors while getting things done.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="xl"
                  variant="hero"
                  className="group"
                  onClick={() => navigate('/signup')}
                >
                  Find Services
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                >
                  Become a Provider
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-8 justify-center">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden"
                    >
                      <img
                        src={`https://i.pravatar.cc/40?img=${i + 10}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex w-full items-center justify-center sm:justify-start gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                    <span className="ml-1 font-medium">4.9</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Based on 2,500+ reviews</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-4 bg-muted/10 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary px-4 py-1.5">
              <Sparkles className="h-4 w-4 mr-2 inline-block" />
              Explore Services
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Popular Categories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover trusted local providers across a wide range of services
            </p>
          </div>

          <div className="relative overflow-hidden group">
            {/* Extended Fade Edges */}
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <motion.div
              className="flex gap-6 py-6 pr-6"
              animate={{ x: [0, "-50%"] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 35,
                  ease: "linear",
                },
              }}
              whileHover={{ animationPlayState: "paused" }}
              style={{ width: "max-content" }}
            >
              {[...categories, ...categories].map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={`${category.id}-${index}`}
                    whileHover={{ y: -6 }}
                    onClick={() => navigate(`/dashboard/browse?category=${category.id}`)}
                    className="flex-shrink-0 w-[200px] bg-background/80 backdrop-blur-md border border-border/50 hover:border-primary/40 rounded-3xl p-6 text-center hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/5 transition-all duration-500 group/card relative overflow-hidden"
                  >
                    {/* Vibrant Theme Hover Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className={`relative h-14 w-14 mx-auto mb-4 rounded-xl ${category.color} flex items-center justify-center transition-all duration-500 group-hover/card:scale-110 group-hover/card:-translate-y-1 group-hover/card:shadow-md`}>
                      <Icon className="h-6 w-6 transition-transform duration-500 group-hover/card:scale-110" />
                    </div>
                    <h3 className="text-base font-semibold mb-1 relative z-10 transition-colors duration-300 group-hover/card:text-primary">{category.name}</h3>
                    <p className="text-muted-foreground text-sm font-medium relative z-10">{category.count} providers</p>

                    <div className="absolute top-3 right-3 p-1.5 bg-primary/10 backdrop-blur-sm rounded-full opacity-0 group-hover/card:opacity-100 transition-all duration-300 transform translate-x-4 -translate-y-4 group-hover/card:translate-x-0 group-hover/card:translate-y-0 border border-primary/20">
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="xl" className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-colors h-14 text-lg" onClick={() => navigate('/dashboard/browse')}>
              View All Categories
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 relative overflow-hidden bg-background">
        <style dangerouslySetInnerHTML={{__html: `
          .three-d-wrapper {
            perspective: 1000px;
          }
          .three-d-wrapper .obj {
            position: relative;
            width: 140px;
            height: 140px;
            transform-style: preserve-3d;
            transition: 0.5s all;
            transform: rotateX(-25deg) rotateY(20deg);
          }
          .three-d-wrapper .objchild {
            animation: objRotate 4s infinite linear;
            transform-style: preserve-3d;
            position: absolute;
            width: 100%;
            height: 100%;
          }
          .three-d-wrapper .objchild::after {
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
            filter: blur(20px);
            box-shadow: 0 0 100px 10px var(--glow-color);
            transform: rotateX(90deg) scale(1.1) translateZ(-60px);
          }
          .three-d-wrapper .inn6 {
            position: absolute;
            width: 100%;
            height: 100%;
            background: rgb(21, 21, 21);
            transform: rotateX(90deg) translateZ(60px);
            animation: objUpdown 4s infinite ease-in-out;
            border-radius: 12px;
          }
          @keyframes objRotate {
            0% { transform: rotate3d(0,1,0,0deg); }
            100% { transform: rotate3d(0,1,0,360deg); }
          }
          @keyframes objUpdown {
            0% { transform: translateY(40px) rotateX(90deg) translateZ(40px); }
            50% { transform: translateY(80px); }
            100% { transform: translateY(40px) rotateX(450deg) translateZ(40px); }
          }
        `}} />
        {/* Soft background glow for the glass bounding area to blur */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-amber-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/10 text-primary px-4 py-1.5 backdrop-blur-md">
              <Sparkles className="h-4 w-4 mr-2 inline-block" />
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search & Discover',
                description: 'Browse services in your neighborhood or search for specific skills you need for your home.',
                glowColor: 'rgba(59,130,246,0.5)',
                glow: 'group-hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)]',
                icon: Compass
              },
              {
                step: '02',
                title: 'Connect & Chat',
                description: 'Message friendly providers directly to discuss your needs and schedule a perfect time.',
                glowColor: 'rgba(16,185,129,0.5)',
                glow: 'group-hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]',
                icon: HeartHandshake
              },
              {
                step: '03',
                title: 'Book & Smile',
                description: 'Confirm your booking, get the job done beautifully, and leave a review for your neighbor.',
                glowColor: 'rgba(249,115,22,0.5)',
                glow: 'group-hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.3)]',
                icon: PartyPopper
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className={`bg-background/60 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/10 p-8 transition-all duration-500 group hover:-translate-y-2 relative overflow-hidden shadow-lg ${item.glow} flex flex-col`}
                >
                  {/* Subtle inner gradient shift on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div 
                    className="three-d-wrapper flex items-center justify-center my-10 relative z-10 mx-auto"
                    style={{ '--glow-color': item.glowColor } as React.CSSProperties}
                  >
                    <div className="obj">
                      <div className="objchild">
                        <span className="inn6 shadow-2xl flex items-center justify-center">
                          <Icon className="w-12 h-12 text-white/90" />
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto relative z-10 text-center">
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="relative w-full rounded-[3rem] overflow-hidden border border-border/50 shadow-2xl bg-card">
            
            {/* Colorful soft lights strictly contained inside the box */}
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-400/30 dark:bg-emerald-500/20 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-teal-400/30 dark:bg-teal-500/20 rounded-full blur-[80px] translate-y-1/2 pointer-events-none" />

            {/* Frosty Glass Layer */}
            <div className="relative z-10 bg-background/60 backdrop-blur-2xl p-12 md:p-24 text-center">
              {/* Subtle inner top-edge glare */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto relative z-10"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground">
                  Ready to Join Your Local Community?
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                  Whether you're looking for help or want to offer your skills,
                  NearO connects you with trusted neighbors.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full sm:w-auto font-bold text-lg hover:-translate-y-1 transition-transform"
                    onClick={() => navigate('/signup')}
                  >
                    Find Services
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full sm:w-auto font-bold text-lg hover:-translate-y-1 transition-transform bg-background/50 backdrop-blur"
                    onClick={() => navigate('/signup')}
                  >
                    Become a Provider
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-1 mb-4 group cursor-default">
                <div className="h-10 w-10 flex items-center justify-center -ml-2">
                  <img 
                    src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493" 
                    alt="NearO" 
                    className="h-[120%] w-[120%] object-contain mix-blend-multiply dark:invert dark:-hue-rotate-180 dark:mix-blend-screen transform-gpu drop-shadow-sm relative z-10" 
                  />
                </div>
                <div className="overflow-hidden transition-all duration-500 ease-in-out w-0 opacity-0 group-hover:w-[80px] group-hover:opacity-100 flex items-center whitespace-nowrap transform-gpu relative -ml-1">
                  <span style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent tracking-tight transform -translate-x-8 group-hover:translate-x-0 transition-all duration-500 ease-out pl-2 py-1">NearO</span>
                </div>
              </div>
              <p className="text-muted-foreground">
                Building stronger communities through local connections.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Seekers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/dashboard/browse" className="hover:text-foreground transition-colors">Browse Services</Link></li>
                <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                <li><Link to="/safety" className="hover:text-foreground transition-colors">Safety Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/signup" className="hover:text-foreground transition-colors">Get Started</Link></li>
                <li><Link to="/resources" className="hover:text-foreground transition-colors">Resources</Link></li>
                <li><Link to="/success-stories" className="hover:text-foreground transition-colors">Success Stories</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} NearO. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
