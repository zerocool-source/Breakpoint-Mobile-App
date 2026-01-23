import type { Express } from "express";
import { createServer, type Server } from "node:http";
import authRoutes, { authMiddleware, AuthenticatedRequest } from "./auth";
import { db } from "./db";
import { users, properties, jobs, assignments, estimates, routeStops, propertyChannels } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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
          eq(users.supervisorId, req.user!.id),
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
      const { technicianId } = req.params;
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
      const { technicianId } = req.params;
      await db.update(users)
        .set({ supervisorId: null, updatedAt: new Date() })
        .where(and(
          eq(users.id, technicianId),
          eq(users.supervisorId, req.user!.id)
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
      const { technicianId } = req.params;
      const { county } = req.body;
      if (!county || !['north_county', 'south_county', 'mid_county'].includes(county)) {
        return res.status(400).json({ error: "Valid county is required" });
      }

      const [updated] = await db.update(users)
        .set({ county, updatedAt: new Date() })
        .where(and(
          eq(users.id, technicianId),
          eq(users.supervisorId, req.user!.id)
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
