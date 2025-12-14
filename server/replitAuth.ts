import { type Express, type Request, type Response, type NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const PgStore = connectPg(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
  return session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: "sessions",
      ttl: sessionTtl / 1000,
    }),
    secret: process.env.SESSION_SECRET || "default_dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  // 1. Setup Session & Passport
  app.set("trust proxy", 1); // Required for Render/Replit proxies
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // 2. User Serialization (How user is stored in session)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        // We reconstruct the 'claims' object so your existing code (routes.ts) continues to work
        const userWithClaims = {
          ...user,
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            profile_image_url: user.profileImageUrl
          }
        };
        done(null, userWithClaims);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err);
    }
  });

  // 3. Google Strategy Configuration
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.BASE_URL) {
    console.warn("⚠️  Google Auth Missing Credentials! Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and BASE_URL env vars.");
  } else {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/callback/google`,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || "";
        const firstName = profile.name?.givenName || "User";
        const lastName = profile.name?.familyName || "";
        const photo = profile.photos?.[0]?.value;

        // Upsert user in database (Update if exists, Create if new)
        // We assume storage.upsertUser exists based on your previous code. 
        // If not, you might need to use storage.createUser logic here.
        await storage.upsertUser({
          id: googleId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          profileImageUrl: photo
        });

        const user = await storage.getUser(googleId);
        done(null, user);
      } catch (err) {
        console.error("Auth Error:", err);
        done(err, undefined);
      }
    }));

    // 4. Auth Routes
    // Start Login
    app.get("/api/login", passport.authenticate("google", { scope: ["profile", "email"] }));

    // Callback from Google
    app.get("/api/auth/callback/google", 
      passport.authenticate("google", { failureRedirect: "/login?error=auth_failed" }),
      (req, res) => {
        res.redirect("/"); // Redirect to home on success
      }
    );
  }

  // Logout
  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  });
}

// 5. Middleware to protect routes
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}