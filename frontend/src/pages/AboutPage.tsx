import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  HeartHandshake,
  Leaf,
  Shield,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const values = [
  {
    title: "Community First",
    description: "We prioritize local relationships and neighborhood growth.",
    icon: Users,
  },
  {
    title: "Trust & Safety",
    description: "Verified providers, transparent reviews, and secure payments.",
    icon: Shield,
  },
  {
    title: "Sustainable Impact",
    description: "Keep spending local and strengthen your community economy.",
    icon: Leaf,
  },
];

const milestones = [
  {
    year: "2022",
    title: "NearO launched",
    description: "Built to connect neighbors with trusted local providers.",
  },
  {
    year: "2023",
    title: "10K+ bookings",
    description: "Reached a major milestone with repeat customers and referrals.",
  },
  {
    year: "2024",
    title: "Provider growth",
    description: "Expanded to new neighborhoods and service categories.",
  },
  {
    year: "2025",
    title: "Community programs",
    description: "Partnered with local organizations to create job opportunities.",
  },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-1.5">
              <img
                src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493"
                alt="NearO"
                className="h-full w-full object-contain"
              />
            </div>
            <span
              style={{ fontFamily: "Poppins, sans-serif" }}
              className="font-bold text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight"
            >
              NearO
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/dashboard/browse" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse Services
            </Link>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/about" className="text-foreground font-medium">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")}>Log In</Button>
            <Button variant="hero" onClick={() => navigate("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-16 px-4">
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
                About NearO
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Building trust between neighbors, one service at a time.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                NearO helps communities thrive by connecting people with local experts for everything from
                home repairs to pet care. We believe that strong neighborhoods begin with meaningful
                connections.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" variant="hero" onClick={() => navigate("/signup")}>
                  Join the Community
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="xl" variant="outline" onClick={() => navigate("/dashboard/browse")}>
                  Explore Services
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20" />
              <Card className="relative rounded-3xl border shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-primary" />
                    Our mission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Empower neighbors to support each other with trustworthy services, local knowledge,
                    and shared opportunities.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <p className="text-2xl font-semibold text-foreground">2,500+</p>
                      <p className="text-sm">Active providers</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <p className="text-2xl font-semibold text-foreground">98%</p>
                      <p className="text-sm">Positive reviews</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <p className="text-2xl font-semibold text-foreground">50+</p>
                      <p className="text-sm">Neighborhoods</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-4">
                      <p className="text-2xl font-semibold text-foreground">15K+</p>
                      <p className="text-sm">Services completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Our values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that shape every decision and experience on NearO.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full rounded-2xl border bg-card">
                    <CardHeader>
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                      {value.description}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-6">Milestones that shaped our journey</h2>
              <div className="space-y-6">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {milestone.year}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{milestone.title}</p>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <Card className="rounded-3xl border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Focused on local impact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  We partner with community organizations to support workforce development and provide
                  meaningful opportunities for local providers.
                </p>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="font-medium text-foreground">Neighborhood grants</p>
                  <p className="text-sm">
                    Micro-grants help providers build new service offerings and hire helpers.
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="font-medium text-foreground">Workshops & training</p>
                  <p className="text-sm">Monthly sessions to grow skills, pricing, and customer care.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-hero rounded-3xl p-12 text-center text-primary-foreground">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Grow your neighborhood with us</h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                Join the NearO community to find trusted services or become a provider.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" variant="glass" onClick={() => navigate("/signup")}>
                  Join NearO
                </Button>
                <Button
                  size="xl"
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => navigate("/dashboard/browse")}
                >
                  Browse Services
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="bg-muted/50 border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-1.5">
                  <img
                    src="https://companieslogo.com/img/orig/NBLY.TO-63e791bf.png?t=1720244493"
                    alt="NearO"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span style={{ fontFamily: "Poppins, sans-serif" }} className="font-bold text-xl tracking-tight">
                  NearO
                </span>
              </div>
              <p className="text-muted-foreground">
                Building stronger communities through local connections.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Seekers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="/dashboard/browse" className="hover:text-foreground transition-colors">
                    Browse Services
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/safety" className="hover:text-foreground transition-colors">
                    Safety Center
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Providers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="/signup" className="hover:text-foreground transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link to="/resources" className="hover:text-foreground transition-colors">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link to="/success-stories" className="hover:text-foreground transition-colors">
                    Success Stories
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
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

export default AboutPage;
