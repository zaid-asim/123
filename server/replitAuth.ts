import type { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import session from "express-session";
import { storage } from "./storage";

// ─── Session Setup ─────────────────────────────────────────────────────────────
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const secret = process.env.SESSION_SECRET || "swadesh_dev_secret_change_in_prod";

  if (process.env.DATABASE_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const connectPg = require("connect-pg-simple");
      const PgStore = connectPg(session);
      return session({
        store: new PgStore({
          conString: process.env.DATABASE_URL,
          createTableIfMissing: true,
          tableName: "sessions",
          ttl: sessionTtl / 1000,
        }),
        secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: sessionTtl,
        },
      });
    } catch {
      console.warn("⚠ PgStore unavailable, using MemoryStore");
    }
  }

  return session({
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

// ─── Auth Setup ────────────────────────────────────────────────────────────────
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user.id));

  passport.deserializeUser(async (id: string, done) => {
    try {
      if (!process.env.DATABASE_URL) { done(null, false); return; }
      const user = await storage.getUser(id);
      if (user) {
        done(null, {
          ...user,
          claims: { sub: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName, profile_image_url: user.profileImageUrl },
        });
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err);
    }
  });

  // ─── Google OAuth ────────────────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.BASE_URL) {
    const { Strategy: GoogleStrategy } = await import("passport-google-oauth20");
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: `${process.env.BASE_URL}/api/auth/callback/google`,
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const userData = {
              id: profile.id,
              email: profile.emails?.[0]?.value || "",
              firstName: profile.name?.givenName || "User",
              lastName: profile.name?.familyName || "",
              profileImageUrl: profile.photos?.[0]?.value,
            };
            await storage.upsertUser(userData);
            const user = await storage.getUser(profile.id);
            done(null, user);
          } catch (err) {
            console.error("Google Auth Error:", err);
            done(err as Error, undefined);
          }
        }
      )
    );

    app.get("/api/login", passport.authenticate("google", { scope: ["profile", "email"] }));
    app.get(
      "/api/auth/callback/google",
      passport.authenticate("google", { failureRedirect: "/" }),
      (_req, res) => res.redirect("/")
    );
  } else {
    // Dev bypass: auto-login with a dev user
    console.warn("⚠ Google OAuth not configured — dev bypass active at /api/login");
    app.get("/api/login", (req: any, res) => {
      req.session.devUser = {
        id: "dev-user-001",
        email: "dev@swadesh.ai",
        firstName: "Dev",
        lastName: "User",
        setupCompleted: true,
        profileImageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      res.redirect("/");
    });
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────
  app.get("/api/logout", (req: any, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      if (req.session) req.session.destroy(() => { });
      res.redirect("/");
    });
  });
}

// ─── Auth Middleware ───────────────────────────────────────────────────────────
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  if ((req as any).session?.devUser) {
    (req as any).user = {
      ...(req as any).session.devUser,
      claims: { sub: (req as any).session.devUser.id },
    };
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}