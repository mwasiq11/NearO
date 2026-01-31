import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Star, 
  Shield, 
  Users, 
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const categories = [
  { id: 'home-repair', name: 'Home Repair', icon: '🔧', count: 156 },
  { id: 'tutoring', name: 'Tutoring', icon: '📚', count: 89 },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', count: 134 },
  { id: 'pet-care', name: 'Pet Care', icon: '🐕', count: 245 },
  { id: 'fitness', name: 'Fitness', icon: '💪', count: 189 },
  { id: 'gardening', name: 'Gardening', icon: '🌱', count: 67 },
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
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </div>
            <span className="font-bold text-xl text-foreground">NearO</span>
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <Badge variant="secondary" className="px-4 py-1.5">
                <Sparkles className="h-3 w-3 mr-1" />
                Trusted by 10,000+ neighbors
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Your Community,{' '}
                <span className="text-gradient-hero">Your Services</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Connect with trusted local providers for home repairs, tutoring, pet care, and more. 
                Build relationships with your neighbors while getting things done.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="xl" 
                  variant="hero" 
                  className="group"
                  onClick={() => navigate('/signup')}
                >
                  Find Services
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="xl" 
                  variant="outline"
                  onClick={() => navigate('/signup')}
                >
                  Become a Provider
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
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
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                    <span className="ml-1 font-medium">4.9</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Based on 2,500+ reviews</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20" />
              <div className="relative bg-card rounded-3xl border shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">Sarah Mitchell</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Mission District
                      </p>
                    </div>
                  </div>
                  <Badge variant="gold">Gold Provider</Badge>
                </div>
                
                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-1">Professional Home Repairs</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Expert plumbing, electrical, and general maintenance.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-medium">4.9</span>
                      <span className="text-muted-foreground">(87)</span>
                    </div>
                    <span className="font-semibold text-primary">$75/hr</span>
                  </div>
                </div>
                
                <Button className="w-full" variant="hero">
                  Book Now
                </Button>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-card rounded-xl border shadow-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 bg-card rounded-xl border shadow-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">156 bookings</span>
                </div>
              </motion.div>
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
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Popular Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover trusted local providers across a wide range of services
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/dashboard/browse?category=${category.id}`)}
                className="bg-card border rounded-2xl p-6 text-center hover:shadow-lg transition-all group"
              >
                <span className="text-4xl mb-3 block">{category.icon}</span>
                <p className="font-medium mb-1">{category.name}</p>
                <p className="text-sm text-muted-foreground">{category.count} providers</p>
              </motion.button>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" onClick={() => navigate('/dashboard/browse')}>
              View All Categories
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Search & Discover',
                description: 'Browse services in your neighborhood or search for specific skills you need.',
                icon: '🔍',
              },
              {
                step: '02',
                title: 'Connect & Chat',
                description: 'Message providers directly to discuss your needs and schedule a time.',
                icon: '💬',
              },
              {
                step: '03',
                title: 'Book & Review',
                description: 'Confirm your booking, get the job done, and leave a review for your neighbor.',
                icon: '⭐',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative bg-card rounded-2xl border p-8"
              >
                <span className="absolute -top-4 left-6 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
                  {item.step}
                </span>
                <span className="text-5xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-hero rounded-3xl p-12 text-center text-primary-foreground">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Join Your Local Community?
              </h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                Whether you're looking for help or want to offer your skills, 
                NearO connects you with trusted neighbors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="xl" 
                  variant="glass"
                  onClick={() => navigate('/signup')}
                >
                  Find Services
                </Button>
                <Button 
                  size="xl" 
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => navigate('/signup')}
                >
                  Become a Provider
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">N</span>
                </div>
                <span className="font-bold text-xl">NearO</span>
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
