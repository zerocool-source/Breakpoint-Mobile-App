import type { Express } from "express";
import { createServer, type Server } from "node:http";
import authRoutes, { authMiddleware, AuthenticatedRequest } from "./auth";
import { db } from "./db";
import { users, properties, jobs, assignments, estimates, routeStops, propertyChannels, insertAssignmentSchema } from "@shared/schema";
import { eq, and, desc, or } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/auth", authRoutes);

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
        priority: priority || 'MEDIUM',
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

      // Set notes if provided
      if (notes !== undefined) {
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
          name: users.name,
          email: users.email,
          role: users.role,
          county: users.county,
        });
      res.json(updated);
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
          name: users.name,
          email: users.email,
          role: users.role,
          county: users.county,
          supervisorId: users.supervisorId,
        });
      res.json(updated);
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
          name: users.name,
          email: users.email,
          role: users.role,
          county: users.county,
        });
      res.json(updated);
    } catch (error) {
      console.error("Error updating technician county:", error);
      res.status(500).json({ error: "Failed to update county" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
