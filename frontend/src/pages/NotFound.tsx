import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: Page not found -", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -80, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -right-40 bottom-0 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Animated Icon Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl ring-1 ring-primary/20 backdrop-blur-sm">
            <MapPinOff className="h-12 w-12 text-primary" strokeWidth={1.5} />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent shadow-[0_0_10px_rgba(var(--accent),0.5)]"
            />
          </div>
        </motion.div>

        {/* 404 Text with Gradient */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-2 text-8xl font-black tracking-tighter sm:text-9xl"
        >
          <span className="bg-gradient-header bg-clip-text text-transparent">404</span>
        </motion.h1>

        {/* Heading & Subtext */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">Lost in the neighborhood?</h2>
          <p className="mx-auto mb-10 max-w-md text-lg text-muted-foreground">
            We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            variant="hero"
            onClick={() => navigate("/")}
            className="w-full sm:w-auto"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto border-2 hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
        </motion.div>

        {/* Subtle Search Lead-in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Search className="h-4 w-4" />
          <span>Try searching for our home services or community members</span>
        </motion.div>
      </div>

      {/* Decorative Floating Squares */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          className="absolute hidden h-8 w-8 rounded-lg bg-primary/20 backdrop-blur-md lg:block"
          style={{
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 20}%`,
          }}
        />
      ))}
    </div>
  );
};

export default NotFound;
