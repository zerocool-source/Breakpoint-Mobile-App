import type { Express } from "express";
import { createServer, type Server } from "node:http";
import authRoutes, { authMiddleware, AuthenticatedRequest } from "./auth";
import { db } from "./db";
import { users, properties, jobs, assignments, estimates, routeStops, propertyChannels, techOps, repairHistory, adminMessages } from "@shared/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import transcribeRouter from "./routes/transcribe";
import aiProductSearchRouter from "./routes/ai-product-search";
import aiLearningRouter from "./routes/ai-learning";

// Render API base URLs for proxy
const RENDER_API_URL = process.env.RENDER_API_URL || "https://breakpoint-api-v2.onrender.com";
const TECHOPS_API_URL = process.env.TECHOPS_API_URL || "https://breakpoint-app.onrender.com";
const MOBILE_API_KEY = process.env.MOBILE_API_KEY;

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy auth requests - try local first, then Render API
  app.post("/api/proxy/auth/login", async (req, res) => {
    try {
      // First try local auth
      const localRes = await fetch(`http://localhost:5000/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      
      if (localRes.ok) {
        const data = await localRes.json();
        return res.status(200).json(data);
      }
      
      // If local fails, try Render API
      const response = await fetch(`${RENDER_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("[Proxy] Login error:", error);
      res.status(503).json({ error: "Unable to reach authentication server" });
    }
  });

  app.get("/api/proxy/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      // First try local auth
      const localRes = await fetch(`http://localhost:5000/api/auth/me`, {
        headers: authHeader ? { Authorization: authHeader } : {},
      });
      
      if (localRes.ok) {
        const data = await localRes.json();
        return res.status(200).json(data);
      }
      
      // If local fails, try Render API
      const response = await fetch(`${RENDER_API_URL}/api/auth/me`, {
        headers: authHeader ? { Authorization: authHeader } : {},
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("[Proxy] Auth check error:", error);
      res.status(503).json({ error: "Unable to reach authentication server" });
    }
  });

  // Proxy Tech Ops requests to Render Admin BI API (for web testing - bypasses CORS)
  app.post("/api/proxy/tech-ops", async (req, res) => {
    try {
      const apiKey = MOBILE_API_KEY;
      if (!apiKey) {
        console.error("[Proxy] MOBILE_API_KEY not set");
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      // Forward Authorization header from client
      const authHeader = req.headers.authorization;
      
      console.log("[Proxy] Tech Ops request to:", `${TECHOPS_API_URL}/api/tech-ops`);
      console.log("[Proxy] Tech Ops payload:", JSON.stringify(req.body));
      console.log("[Proxy] Auth header present:", !!authHeader);
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-MOBILE-KEY": apiKey,
      };
      
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }
      
      const response = await fetch(`${TECHOPS_API_URL}/api/tech-ops`, {
        method: "POST",
        headers,
        body: JSON.stringify(req.body),
      });
      
      const responseText = await response.text();
      console.log("[Proxy] Tech Ops response status:", response.status);
      console.log("[Proxy] Tech Ops response:", responseText);
      
      // Try to parse as JSON, otherwise return as-is
      try {
        const data = JSON.parse(responseText);
        res.status(response.status).json(data);
      } catch {
        res.status(response.status).send(responseText);
      }
    } catch (error) {
      console.error("[Proxy] Tech Ops error:", error);
      res.status(503).json({ error: "Unable to reach Tech Ops server" });
    }
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/transcribe", transcribeRouter);
  app.use("/api/ai-product-search", aiProductSearchRouter);
  app.use("/api/ai-learning", aiLearningRouter);

  app.get("/api/properties", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const allProperties = await db.query.properties.findMany({
        where: eq(properties.isActive, true),
        orderBy: [properties.name],
      });
      res.json(allProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/jobs", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userJobs = await db.query.jobs.findMany({
        where: eq(jobs.assignedToId, req.user!.id),
        orderBy: [desc(jobs.createdAt)],
        with: {
          property: true,
        },
      });
      res.json(userJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/all", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.role !== "supervisor") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const allJobs = await db.query.jobs.findMany({
        orderBy: [desc(jobs.createdAt)],
        with: {
          property: true,
          assignedTo: true,
        },
      });
      res.json(allJobs);
    } catch (error) {
      console.error("Error fetching all jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/assignments", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userAssignments = await db.query.assignments.findMany({
        where: eq(assignments.technicianId, req.user!.id),
        orderBy: [desc(assignments.createdAt)],
        with: {
          property: true,
        },
      });
      res.json(userAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // GET /api/assignments/created - Supervisor gets assignments they created
  app.get("/api/assignments/created", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const role = req.user!.role;
      if (role !== "supervisor" && role !== "repair_foreman") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const createdAssignments = await db.query.assignments.findMany({
        where: eq(assignments.assignedById, req.user!.id),
        orderBy: [desc(assignments.createdAt)],
        with: {
          property: true,
          technician: {
            columns: {
              password: false,
            },
          },
        },
      });
      res.json(createdAssignments);
    } catch (error) {
      console.error("Error fetching created assignments:", error);
      res.status(500).json({ error: "Failed to fetch created assignments" });
    }
  });

  // POST /api/assignments - Create a new assignment (supervisor/repair_foreman only)
  app.post("/api/assignments", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const role = req.user!.role;
      if (role !== "supervisor" && role !== "repair_foreman") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { propertyId, technicianId, title, type, priority, scheduledDate, scheduledTime, notes } = req.body;

      // Validate required fields
      if (!propertyId) {
        return res.status(400).json({ error: "Property ID is required" });
      }
      if (!technicianId) {
        return res.status(400).json({ error: "Technician ID is required" });
      }
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: "Title is required" });
      }
      if (!type || typeof type !== 'string' || type.trim() === '') {
        return res.status(400).json({ error: "Type is required" });
      }

      // Validate priority if provided
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
      const normalizedPriority = priority ? String(priority).toUpperCase() : 'MEDIUM';
      if (!validPriorities.includes(normalizedPriority)) {
        return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
      }

      // Verify property exists
      const propertyExists = await db.query.properties.findFirst({
        where: eq(properties.id, propertyId),
      });
      if (!propertyExists) {
        return res.status(400).json({ error: "Property not found" });
      }

      // Verify technician exists
      const technicianExists = await db.query.users.findFirst({
        where: eq(users.id, technicianId),
      });
      if (!technicianExists) {
        return res.status(400).json({ error: "Technician not found" });
      }

      // Parse scheduledDate if provided
      let parsedScheduledDate: Date | undefined;
      if (scheduledDate) {
        parsedScheduledDate = new Date(scheduledDate);
        if (isNaN(parsedScheduledDate.getTime())) {
          return res.status(400).json({ error: "Invalid scheduled date format" });
        }
      }

      // Insert the assignment
      const [newAssignment] = await db.insert(assignments).values({
        propertyId,
        technicianId,
        assignedById: req.user!.id,
        title: title.trim(),
        type: type.trim(),
        priority: normalizedPriority,
        status: 'pending',
        scheduledDate: parsedScheduledDate,
        scheduledTime: scheduledTime || null,
        notes: notes || null,
      }).returning();

      // Fetch the assignment with property relation
      const assignmentWithProperty = await db.query.assignments.findFirst({
        where: eq(assignments.id, newAssignment.id),
        with: {
          property: true,
          technician: {
            columns: {
              password: false,
            },
          },
        },
      });

      res.status(201).json(assignmentWithProperty);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  // PATCH /api/assignments/:id - Update assignment status/notes
  app.patch("/api/assignments/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const assignmentId = req.params.id;
      const role = req.user!.role;
      const userId = req.user!.id;

      // Fetch the existing assignment
      const existingAssignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, assignmentId),
      });

      if (!existingAssignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Authorization check
      let isAuthorized = false;
      if (role === "service_tech") {
        // Service tech can only update their own assignments
        isAuthorized = existingAssignment.technicianId === userId;
      } else if (role === "supervisor" || role === "repair_foreman") {
        // Supervisor/foreman can update assignments they created
        isAuthorized = existingAssignment.assignedById === userId;
      }

      if (!isAuthorized) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { status, notes } = req.body;
      const updateData: Record<string, any> = { updatedAt: new Date() };

      // Validate and set status if provided
      if (status !== undefined) {
        const validStatuses = ['pending', 'in_progress', 'completed', 'need_assistance'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        updateData.status = status;

        // Set completedAt if status becomes completed
        if (status === 'completed') {
          updateData.completedAt = new Date();
        }
      }

      // Validate and set notes if provided
      if (notes !== undefined) {
        if (notes !== null && typeof notes !== 'string') {
          return res.status(400).json({ error: "Notes must be a string or null" });
        }
        updateData.notes = notes;
      }

      // Perform the update
      const [updatedAssignment] = await db.update(assignments)
        .set(updateData)
        .where(eq(assignments.id, assignmentId))
        .returning();

      // Fetch with relations
      const assignmentWithRelations = await db.query.assignments.findFirst({
        where: eq(assignments.id, updatedAssignment.id),
        with: {
          property: true,
        },
      });

      res.json(assignmentWithRelations);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  app.get("/api/estimates", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userEstimates = await db.query.estimates.findMany({
        where: eq(estimates.technicianId, req.user!.id),
        orderBy: [desc(estimates.createdAt)],
        with: {
          property: true,
        },
      });
      res.json(userEstimates);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      res.status(500).json({ error: "Failed to fetch estimates" });
    }
  });

  app.post("/api/estimates", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const {
        estimateNumber,
        propertyId,
        propertyName,
        estimateDate,
        expirationDate,
        description,
        lineItems,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxRate,
        taxAmount,
        total,
        woRequired,
        woReceived,
        woNumber,
        sendToOffice,
      } = req.body;

      const user = req.user!;
      const now = new Date();

      const status = sendToOffice ? 'pending_approval' : 'draft';

      const result = await db.execute(sql`
        INSERT INTO estimates (
          id, property_id, property_name, estimate_number, estimate_date, expiration_date,
          title, description, items, subtotal, discount_type, discount_value, discount_amount,
          sales_tax_rate, sales_tax_amount, total_amount, status,
          created_by_tech_id, created_by_tech_name, repair_tech_id, repair_tech_name,
          wo_required, wo_received, wo_number,
          created_at, reported_date, sent_for_approval_at
        ) VALUES (
          gen_random_uuid(),
          ${propertyId || ''},
          ${propertyName || ''},
          ${estimateNumber},
          ${estimateDate ? new Date(estimateDate) : now},
          ${expirationDate ? new Date(expirationDate) : null},
          ${'Pool Repair Estimate'},
          ${description || ''},
          ${JSON.stringify(lineItems || [])},
          ${Math.round((subtotal || 0) * 100)},
          ${discountType || 'percent'},
          ${discountValue || 0},
          ${Math.round((discountAmount || 0) * 100)},
          ${taxRate || 9},
          ${Math.round((taxAmount || 0) * 100)},
          ${Math.round((total || 0) * 100)},
          ${status},
          ${user.id},
          ${user.name || 'Technician'},
          ${user.id},
          ${user.name || 'Technician'},
          ${woRequired || false},
          ${woReceived || false},
          ${woNumber || null},
          ${now},
          ${now},
          ${sendToOffice ? now : null}
        )
        RETURNING id, estimate_number, status
      `);

      const savedEstimate = result.rows[0];

      res.status(201).json({
        success: true,
        message: sendToOffice ? 'Estimate sent to office for approval' : 'Estimate saved as draft',
        estimate: {
          id: savedEstimate?.id,
          estimateNumber: savedEstimate?.estimate_number,
          status: savedEstimate?.status,
        }
      });
    } catch (error) {
      console.error("Error creating estimate:", error);
      res.status(500).json({ error: "Failed to create estimate" });
    }
  });

  app.get("/api/route-stops", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const userRouteStops = await db.query.routeStops.findMany({
        where: eq(routeStops.technicianId, req.user!.id),
        orderBy: [routeStops.stopOrder],
        with: {
          property: true,
        },
      });
      res.json(userRouteStops);
    } catch (error) {
      console.error("Error fetching route stops:", error);
      res.status(500).json({ error: "Failed to fetch route stops" });
    }
  });

  app.get("/api/technicians", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.role !== "supervisor") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const technicians = await db.query.users.findMany({
        where: and(
          eq(users.isActive, true),
        ),
        columns: {
          password: false,
        },
      });
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ error: "Failed to fetch technicians" });
    }
  });

  app.get("/api/property-channels", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const channels = await db.query.propertyChannels.findMany({
        where: and(
          eq(propertyChannels.userId, req.user!.id),
          eq(propertyChannels.isActive, true)
        ),
        with: {
          property: true,
        },
      });
      res.json(channels);
    } catch (error) {
      console.error("Error fetching property channels:", error);
      res.status(500).json({ error: "Failed to fetch property channels" });
    }
  });

  app.post("/api/property-channels", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { propertyId } = req.body;
      if (!propertyId) {
        return res.status(400).json({ error: "Property ID is required" });
      }

      const existing = await db.query.propertyChannels.findFirst({
        where: and(
          eq(propertyChannels.userId, req.user!.id),
          eq(propertyChannels.propertyId, propertyId)
        ),
      });

      if (existing) {
        const [updated] = await db.update(propertyChannels)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(propertyChannels.id, existing.id))
          .returning();
        return res.json(updated);
      }

      const [channel] = await db.insert(propertyChannels).values({
        userId: req.user!.id,
        propertyId,
      }).returning();
      res.json(channel);
    } catch (error) {
      console.error("Error adding property channel:", error);
      res.status(500).json({ error: "Failed to add property channel" });
    }
  });

  app.delete("/api/property-channels/:propertyId", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const propId = req.params.propertyId as string;
      const userId = req.user!.id;
      const existing = await db.query.propertyChannels.findFirst({
        where: (pc, { and, eq }) => and(
          eq(pc.userId, userId),
          eq(pc.propertyId, propId)
        ),
      });
      if (existing) {
        await db.update(propertyChannels)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(propertyChannels.id, existing.id));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing property channel:", error);
      res.status(500).json({ error: "Failed to remove property channel" });
    }
  });

  app.put("/api/user/county", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { county } = req.body;
      if (!county || !['north_county', 'south_county', 'mid_county'].includes(county)) {
        return res.status(400).json({ error: "Valid county is required" });
      }

      const [updated] = await db.update(users)
        .set({ county, updatedAt: new Date() })
        .where(eq(users.id, req.user!.id))
        .returning({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          county: users.county,
        });
      const result = { ...updated, name: [updated.firstName, updated.lastName].filter(Boolean).join(' ') || 'User' };
      res.json(result);
    } catch (error) {
      console.error("Error updating county:", error);
      res.status(500).json({ error: "Failed to update county" });
    }
  });

  app.get("/api/roster", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.role !== "supervisor") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const roster = await db.query.users.findMany({
        where: and(
          eq(users.supervisorId, req.user!.id as string),
          eq(users.isActive, true)
        ),
        columns: {
          password: false,
        },
      });
      res.json(roster);
    } catch (error) {
      console.error("Error fetching roster:", error);
      res.status(500).json({ error: "Failed to fetch roster" });
    }
  });

  app.get("/api/available-technicians", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.role !== "supervisor") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const available = await db.query.users.findMany({
        where: and(
          eq(users.role, 'service_tech'),
          eq(users.isActive, true)
        ),
        columns: {
          password: false,
        },
      });
      res.json(available);
    } catch (error) {
      console.error("Error fetching available technicians:", error);
      res.status(500).json({ error: "Failed to fetch available technicians" });
    }
  });

  app.post("/api/roster/:technicianId", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.role !== "supervisor") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const technicianId = req.params.technicianId as string;
      const [updated] = await db.update(users)
        .set({ supervisorId: req.user!.id, updatedAt: new Date() })
        .where(eq(users.id, technicianId))
        .returning({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          county: users.county,
          supervisorId: users.supervisorId,
        });
      const result = { ...updated, name: [updated.firstName, updated.lastName].filter(Boolean).join(' ') || 'User' };
      res.json(result);
    } catch (error) {
      console.error("Error adding to roster:", error);
      res.status(500).json({ error: "Failed to add to roster" });
    }
  });

  app.delete("/api/roster/:technicianId", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.role !== "supervisor") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const technicianId = req.params.technicianId as string;
      await db.update(users)
        .set({ supervisorId: null, updatedAt: new Date() })
        .where(and(
          eq(users.id, technicianId),
          eq(users.supervisorId, req.user!.id as string)
        ));
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from roster:", error);
      res.status(500).json({ error: "Failed to remove from roster" });
    }
  });

  app.put("/api/roster/:technicianId/county", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user!.role !== "supervisor") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const technicianId = req.params.technicianId as string;
      const { county } = req.body;
      if (!county || !['north_county', 'south_county', 'mid_county'].includes(county)) {
        return res.status(400).json({ error: "Valid county is required" });
      }

      const [updated] = await db.update(users)
        .set({ county, updatedAt: new Date() })
        .where(and(
          eq(users.id, technicianId),
          eq(users.supervisorId, req.user!.id as string)
        ))
        .returning({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          county: users.county,
        });
      const result = { ...updated, name: [updated.firstName, updated.lastName].filter(Boolean).join(' ') || 'User' };
      res.json(result);
    } catch (error) {
      console.error("Error updating technician county:", error);
      res.status(500).json({ error: "Failed to update county" });
    }
  });

  // GET /api/tech-ops - Get all tech ops entries (admin/supervisor view)
  app.get("/api/tech-ops", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const role = req.user!.role;
      if (role !== "supervisor" && role !== "repair_foreman") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const entryType = req.query.entryType as string | undefined;
      
      let entries;
      if (entryType) {
        entries = await db.query.techOps.findMany({
          where: eq(techOps.entryType, entryType as any),
          orderBy: [desc(techOps.createdAt)],
        });
      } else {
        entries = await db.query.techOps.findMany({
          orderBy: [desc(techOps.createdAt)],
        });
      }
      
      res.json(entries);
    } catch (error) {
      console.error("Error fetching tech ops entries:", error);
      res.status(500).json({ error: "Failed to fetch tech ops entries" });
    }
  });

  // POST /api/tech-ops - Create a new tech ops entry
  // Supports both session auth (web) and mobile API key auth
  app.post("/api/tech-ops", async (req, res) => {
    try {
      const mobileApiKey = req.headers['x-mobile-key'] as string | undefined;
      const expectedMobileKey = process.env.MOBILE_API_KEY;

      // Check for mobile API key authentication
      if (mobileApiKey) {
        if (!expectedMobileKey) {
          console.error("MOBILE_API_KEY not configured on server");
          return res.status(500).json({ error: "Server configuration error" });
        }
        
        if (mobileApiKey !== expectedMobileKey) {
          return res.status(401).json({ error: "Invalid mobile API key" });
        }

        // Mobile API key can ONLY create repairs_needed entries
        const { entryType, description, priority, propertyId, propertyName, bodyOfWater, technicianId, technicianName, photoUrls, hasAudio, audioUri } = req.body;

        if (entryType !== 'repairs_needed') {
          return res.status(403).json({ error: "Mobile API key can only create repairs_needed entries" });
        }

        // Validate required fields for repairs_needed
        const errors: string[] = [];
        
        // Allow audio-only submissions OR text with 10+ characters
        const hasValidDescription = description && typeof description === 'string' && description.trim().length >= 10;
        const hasAudioMessage = hasAudio === true || (audioUri && typeof audioUri === 'string');
        
        if (!hasValidDescription && !hasAudioMessage) {
          errors.push("Description (min 10 chars) OR audio message is required");
        }
        if (!priority || !['urgent', 'normal'].includes(priority)) {
          errors.push("Priority is required and must be 'urgent' or 'normal'");
        }
        if (!propertyId || typeof propertyId !== 'string') {
          errors.push("propertyId is required");
        }
        if (!propertyName || typeof propertyName !== 'string') {
          errors.push("propertyName is required");
        }
        if (!bodyOfWater || typeof bodyOfWater !== 'string') {
          errors.push("bodyOfWater is required");
        }
        if (!technicianId || typeof technicianId !== 'string') {
          errors.push("technicianId is required");
        }
        if (!technicianName || typeof technicianName !== 'string') {
          errors.push("technicianName is required");
        }

        if (errors.length > 0) {
          return res.status(422).json({ error: "Validation failed", details: errors });
        }

        // Create the tech ops entry locally
        const finalDescription = hasValidDescription 
          ? description.trim() 
          : hasAudioMessage 
            ? '[Audio message attached]' 
            : '';
            
        const [newEntry] = await db.insert(techOps).values({
          entryType: 'repairs_needed',
          description: finalDescription,
          priority: priority as 'urgent' | 'normal',
          status: 'pending',
          propertyId,
          propertyName,
          bodyOfWater,
          technicianId,
          technicianName,
          photoUrls: photoUrls ? JSON.stringify(photoUrls) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        // Forward to Render Admin App API
        const renderApiUrl = process.env.TECHOPS_RENDER_URL || 'https://breakpoint-app.onrender.com';
        const renderPayload = {
          propertyId,
          propertyName,
          bodyOfWater,
          description: finalDescription,
          priority,
          submittedBy: technicianId,
          submittedByName: technicianName,
          submittedAt: new Date().toISOString(),
          photoUrls: photoUrls || [],
          audioUrl: audioUri || null,
          hasAudio: hasAudioMessage,
          localEntryId: newEntry.id,
        };

        try {
          console.log('[TechOps] Forwarding to Render:', `${renderApiUrl}/api/tech-ops`);
          const renderRes = await fetch(`${renderApiUrl}/api/tech-ops`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-MOBILE-KEY': expectedMobileKey,
            },
            body: JSON.stringify(renderPayload),
          });

          if (renderRes.ok) {
            console.log('[TechOps] Successfully forwarded to Render');
          } else {
            const errorText = await renderRes.text();
            console.error('[TechOps] Render API error:', renderRes.status, errorText);
          }
        } catch (renderError) {
          console.error('[TechOps] Failed to forward to Render:', renderError);
          // Don't fail the request - we've already saved locally
        }

        return res.status(201).json({
          success: true,
          entry: newEntry,
          forwardedToRender: true,
        });
      }

      // Fall back to session authentication for web users
      // For now, return 401 if no auth method provided
      return res.status(401).json({ error: "Authentication required. Provide X-MOBILE-KEY header or session token." });

    } catch (error) {
      console.error("Error creating tech ops entry:", error);
      res.status(500).json({ error: "Failed to create tech ops entry" });
    }
  });

  // PATCH /api/tech-ops/:id - Update a tech ops entry (supervisor only)
  app.patch("/api/tech-ops/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const role = req.user!.role;
      if (role !== "supervisor" && role !== "repair_foreman") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { status, resolutionNotes } = req.body;

      const updateData: any = { updatedAt: new Date() };
      
      if (status) {
        updateData.status = status;
        if (status === 'resolved' || status === 'closed') {
          updateData.resolvedAt = new Date();
          updateData.resolvedById = req.user!.id;
        }
      }
      if (resolutionNotes !== undefined) {
        updateData.resolutionNotes = resolutionNotes;
      }

      const [updated] = await db.update(techOps)
        .set(updateData)
        .where(eq(techOps.id, id as string))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Tech ops entry not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating tech ops entry:", error);
      res.status(500).json({ error: "Failed to update tech ops entry" });
    }
  });

  // ==================== REPAIR HISTORY ROUTES ====================

  // GET /api/repair-history - Get all repair history for a property
  app.get("/api/repair-history", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { propertyId } = req.query;
      
      if (propertyId) {
        // Get repair history for specific property
        const history = await db.query.repairHistory.findMany({
          where: eq(repairHistory.propertyId, propertyId as string),
          orderBy: [desc(repairHistory.completedAt)],
          with: {
            technician: true,
            property: true,
          },
        });
        return res.json(history);
      }
      
      // Get all repair history (limited to recent 100)
      const allHistory = await db.query.repairHistory.findMany({
        orderBy: [desc(repairHistory.completedAt)],
        limit: 100,
        with: {
          technician: true,
          property: true,
        },
      });
      res.json(allHistory);
    } catch (error) {
      console.error("Error fetching repair history:", error);
      res.status(500).json({ error: "Failed to fetch repair history" });
    }
  });

  // GET /api/repair-history/:id - Get specific repair history entry
  app.get("/api/repair-history/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      const entry = await db.query.repairHistory.findFirst({
        where: eq(repairHistory.id, id),
        with: {
          technician: true,
          property: true,
        },
      });
      
      if (!entry) {
        return res.status(404).json({ error: "Repair history entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching repair history entry:", error);
      res.status(500).json({ error: "Failed to fetch repair history entry" });
    }
  });

  // POST /api/repair-history - Create new repair history entry
  app.post("/api/repair-history", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { propertyId, title, description, workPerformed, partsUsed, laborHours, totalCost, notes, photoUrls, jobId, estimateId } = req.body;
      
      if (!propertyId || !title || !workPerformed) {
        return res.status(400).json({ error: "Missing required fields: propertyId, title, workPerformed" });
      }
      
      const [newEntry] = await db.insert(repairHistory).values({
        propertyId,
        technicianId: req.user!.id,
        jobId,
        estimateId,
        title,
        description,
        workPerformed,
        partsUsed: partsUsed ? JSON.stringify(partsUsed) : null,
        laborHours,
        totalCost,
        notes,
        photoUrls: photoUrls ? JSON.stringify(photoUrls) : null,
        completedAt: new Date(),
      }).returning();
      
      res.status(201).json(newEntry);
    } catch (error) {
      console.error("Error creating repair history entry:", error);
      res.status(500).json({ error: "Failed to create repair history entry" });
    }
  });

  // ==================== ADMIN MESSAGES ROUTES ====================

  // GET /api/admin-messages - Get messages for current user
  app.get("/api/admin-messages", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const messages = await db.query.adminMessages.findMany({
        where: or(
          eq(adminMessages.senderId, userId),
          eq(adminMessages.recipientId, userId),
          // Also include messages sent to office (no recipient) if user is supervisor
          req.user!.role === 'supervisor' ? eq(adminMessages.recipientId, null as any) : undefined
        ),
        orderBy: [desc(adminMessages.createdAt)],
        with: {
          sender: true,
          property: true,
        },
      });
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // GET /api/admin-messages/unread-count - Get count of unread messages
  app.get("/api/admin-messages/unread-count", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(adminMessages)
        .where(
          and(
            or(
              eq(adminMessages.recipientId, userId),
              req.user!.role === 'supervisor' ? eq(adminMessages.recipientId, null as any) : undefined
            ),
            eq(adminMessages.status, 'unread'),
            eq(adminMessages.isFromAdmin, req.user!.role !== 'supervisor') // Techs see admin messages, admins see tech messages
          )
        );
      
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // POST /api/admin-messages - Send a message to office/admin
  app.post("/api/admin-messages", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { content, subject, priority, propertyId, jobId, parentMessageId } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      const isFromAdmin = req.user!.role === 'supervisor' || req.user!.role === 'repair_foreman';
      
      const [newMessage] = await db.insert(adminMessages).values({
        senderId: req.user!.id,
        recipientId: null, // null = sent to office pool
        content,
        subject,
        priority: priority || 'normal',
        propertyId,
        jobId,
        parentMessageId,
        isFromAdmin,
        status: 'unread',
      }).returning();
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // PATCH /api/admin-messages/:id/read - Mark message as read
  app.patch("/api/admin-messages/:id/read", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      const [updated] = await db.update(adminMessages)
        .set({ status: 'read', readAt: new Date() })
        .where(eq(adminMessages.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to update message" });
    }
  });

  // POST /api/admin-messages/:id/reply - Reply to a message
  app.post("/api/admin-messages/:id/reply", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Reply content is required" });
      }
      
      // Get original message
      const originalMessage = await db.query.adminMessages.findFirst({
        where: eq(adminMessages.id, id),
      });
      
      if (!originalMessage) {
        return res.status(404).json({ error: "Original message not found" });
      }
      
      const isFromAdmin = req.user!.role === 'supervisor' || req.user!.role === 'repair_foreman';
      
      const [newMessage] = await db.insert(adminMessages).values({
        senderId: req.user!.id,
        recipientId: originalMessage.senderId, // Reply goes to original sender
        content,
        subject: originalMessage.subject ? `RE: ${originalMessage.subject}` : null,
        priority: originalMessage.priority,
        propertyId: originalMessage.propertyId,
        jobId: originalMessage.jobId,
        parentMessageId: id,
        isFromAdmin,
        status: 'unread',
      }).returning();
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending reply:", error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
