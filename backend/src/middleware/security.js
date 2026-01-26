import helmet from 'helmet';

/**
 * Security middleware configuration
 */
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

export default securityMiddleware;

