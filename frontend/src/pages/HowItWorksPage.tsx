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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    title: "Discover local services",
    description: "Search by category, location, or availability to find trusted providers near you.",
    icon: Search,
  },
  {
    title: "Chat and confirm",
    description: "Message providers to align on pricing, timing, and expectations before booking.",
    icon: MessageCircle,
  },
  {
    title: "Book with confidence",
    description: "Secure payments, verified profiles, and review tools keep everything transparent.",
    icon: CalendarCheck,
  },
];

const trustItems = [
  {
    title: "Verified providers",
    description: "ID checks and profile reviews create a trusted marketplace.",
  },
  {
    title: "Transparent reviews",
    description: "Honest ratings and detailed feedback help you choose confidently.",
  },
  {
    title: "Secure payments",
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
            <Link to="/how-it-works" className="text-foreground font-medium">
              How It Works
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
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
                How NearO Works
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Find local help in minutes, not hours.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                From quick repairs to ongoing projects, NearO keeps everything simple with verified
                providers, secure payments, and neighborhood reviews.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" variant="hero" onClick={() => navigate("/signup")}>
                  Start Booking
                </Button>
                <Button size="xl" variant="outline" onClick={() => navigate("/dashboard/browse")}>
                  Browse Services
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
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Built for trust
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Our trust framework keeps the community safe with verified profiles, clear policies,
                    and ongoing monitoring.
                  </p>
                  <div className="grid gap-3">
                    {trustItems.map((item) => (
                      <div key={item.title} className="flex gap-3 rounded-2xl bg-muted/40 p-4">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Three simple steps</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Book trusted help with just a few taps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full rounded-2xl border">
                    <CardHeader>
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                      {step.description}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-10">
          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                For service seekers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Filter by neighborhood, read real reviews, and chat with providers before you book.
              </p>
              <div className="grid gap-3">
                {["Personalized recommendations", "Instant messaging", "Protected payments"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={() => navigate("/dashboard/browse")}>
                Find a provider
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                For providers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Build your local reputation, manage bookings, and grow your business on your schedule.
              </p>
              <div className="grid gap-3">
                {providerSteps.map((step) => (
                  <div key={step} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={() => navigate("/signup")}>
                Become a provider
              </Button>
            </CardContent>
          </Card>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to see NearO in action?</h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                Create your account and start connecting with trusted neighbors today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" variant="glass" onClick={() => navigate("/signup")}>
                  Get Started
                </Button>
                <Button
                  size="xl"
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => navigate("/about")}
                >
                  Learn about NearO
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

export default HowItWorksPage;
