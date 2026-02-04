import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users, sessions, loginSchema, registerSchema } from "@shared/schema";
import { eq, and, gt, sql } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || "breakpoint-pool-systems-secret-key";
const TOKEN_EXPIRY = "7d";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      ),
    });

    if (!session) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
    req.user = {
      id: user.id,
      email: user.email,
      name: fullName,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", details: result.error.issues });
    }

    const { email, password, name, role } = result.data;
    const [firstName, ...lastParts] = (name || '').split(' ');
    const lastName = lastParts.join(' ');

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      firstName: firstName || 'User',
      lastName: lastName || '',
      role: role || 'tech',
    }).returning();

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    const fullName = [newUser.firstName, newUser.lastName].filter(Boolean).join(' ') || 'User';
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: fullName,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", details: result.error.issues });
    }

    const { email, password } = result.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is inactive" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: fullName,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user!.id),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
    res.json({
      id: user.id,
      email: user.email,
      name: fullName,
      role: user.role,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Tech login - supports email OR phone number
router.post("/tech/login", async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ error: "Email/phone and password are required" });
    }

    // Check if identifier is email or phone
    const isEmail = identifier.includes('@');
    
    let user;
    if (isEmail) {
      user = await db.query.users.findFirst({
        where: eq(users.email, identifier),
      });
    } else {
      // Clean phone number (remove non-digits)
      const cleanPhone = identifier.replace(/\D/g, '');
      user = await db.query.users.findFirst({
        where: eq(users.phone, cleanPhone),
      });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Account not set up for password login" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is inactive" });
    }

    // Create session
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt,
    });

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
    
    // Return in tech login format
    res.json({
      technician: {
        id: user.id,
        userId: user.id,
        name: fullName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        region: user.county || '',
      },
      token,
    });
  } catch (error) {
    console.error("Tech login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get technician jobs
router.get("/tech/:id/jobs", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get jobs assigned to this technician from tech_ops_entries
    const techOpsJobs = await db.execute(sql`
      SELECT id, property_id as "propertyId", property_name as "propertyName", 
             status, scheduled_date as "scheduledDate", issue_title as description
      FROM tech_ops_entries 
      WHERE technician_id = ${id} 
        AND entry_type = 'repair_request'
        AND status NOT IN ('completed', 'cancelled')
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    res.json({ items: techOpsJobs.rows || [] });
  } catch (error) {
    console.error("Get tech jobs error:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Get technician profile
router.get("/tech/:id/profile", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return res.status(404).json({ error: "Technician not found" });
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
    
    res.json({
      id: user.id,
      userId: user.id,
      name: fullName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      region: user.county || '',
      active: user.isActive,
    });
  } catch (error) {
    console.error("Get tech profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
