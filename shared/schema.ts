import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['service_tech', 'supervisor', 'repair_tech', 'repair_foreman']);
export const countyEnum = pgEnum('county', ['north_county', 'south_county', 'mid_county']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const jobPriorityEnum = pgEnum('job_priority', ['low', 'normal', 'high', 'urgent']);
export const propertyTypeEnum = pgEnum('property_type', ['HOA', 'Apartment', 'Hotel', 'Commercial', 'Municipal']);
export const assignmentStatusEnum = pgEnum('assignment_status', ['pending', 'in_progress', 'completed', 'need_assistance']);
export const estimateStatusEnum = pgEnum('estimate_status', ['draft', 'sent', 'approved', 'rejected', 'expired']);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull(),
  phone: text("phone"),
  county: countyEnum("county"),
  supervisorId: varchar("supervisor_id", { length: 36 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const properties = pgTable("properties", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: propertyTypeEnum("type").notNull(),
  gateCode: text("gate_code"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  poolCount: integer("pool_count").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  assignedToId: varchar("assigned_to_id", { length: 36 }).references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: jobPriorityEnum("priority").notNull().default('normal'),
  status: jobStatusEnum("status").notNull().default('pending'),
  scheduledDate: timestamp("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => users.id),
  assignedById: varchar("assigned_by_id", { length: 36 }).references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(),
  priority: text("priority").notNull().default('MEDIUM'),
  status: assignmentStatusEnum("status").notNull().default('pending'),
  scheduledDate: timestamp("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const estimates = pgTable("estimates", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  estimateNumber: text("estimate_number").notNull().unique(),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => users.id),
  status: estimateStatusEnum("status").notNull().default('draft'),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default('0'),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default('0'),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const estimateItems = pgTable("estimate_items", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  estimateId: varchar("estimate_id", { length: 36 }).notNull().references(() => estimates.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const routeStops = pgTable("route_stops", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => users.id),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time"),
  stopOrder: integer("stop_order").notNull().default(1),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  assignments: many(assignments),
  estimates: many(estimates),
  routeStops: many(routeStops),
  sessions: many(sessions),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  jobs: many(jobs),
  assignments: many(assignments),
  estimates: many(estimates),
  routeStops: many(routeStops),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  property: one(properties, {
    fields: [jobs.propertyId],
    references: [properties.id],
  }),
  assignedTo: one(users, {
    fields: [jobs.assignedToId],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  property: one(properties, {
    fields: [assignments.propertyId],
    references: [properties.id],
  }),
  technician: one(users, {
    fields: [assignments.technicianId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [assignments.assignedById],
    references: [users.id],
  }),
}));

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  property: one(properties, {
    fields: [estimates.propertyId],
    references: [properties.id],
  }),
  technician: one(users, {
    fields: [estimates.technicianId],
    references: [users.id],
  }),
  items: many(estimateItems),
}));

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimate: one(estimates, {
    fields: [estimateItems.estimateId],
    references: [estimates.id],
  }),
}));

export const routeStopsRelations = relations(routeStops, ({ one }) => ({
  technician: one(users, {
    fields: [routeStops.technicianId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [routeStops.propertyId],
    references: [properties.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const techOpsEntryTypeEnum = pgEnum('tech_ops_entry_type', ['repairs_needed', 'safety_issue', 'equipment_failure', 'water_quality', 'other']);
export const techOpsStatusEnum = pgEnum('tech_ops_status', ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed']);
export const techOpsPriorityEnum = pgEnum('tech_ops_priority', ['normal', 'urgent']);

export const techOps = pgTable("tech_ops", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  entryType: techOpsEntryTypeEnum("entry_type").notNull(),
  description: text("description").notNull(),
  priority: techOpsPriorityEnum("priority").notNull().default('normal'),
  status: techOpsStatusEnum("status").notNull().default('pending'),
  propertyId: varchar("property_id", { length: 36 }).notNull(),
  propertyName: text("property_name").notNull(),
  bodyOfWater: text("body_of_water").notNull(),
  technicianId: varchar("technician_id", { length: 36 }).notNull(),
  technicianName: text("technician_name").notNull(),
  photoUrls: text("photo_urls"),
  resolvedAt: timestamp("resolved_at"),
  resolvedById: varchar("resolved_by_id", { length: 36 }),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const techOpsRelations = relations(techOps, ({ one }) => ({
  property: one(properties, {
    fields: [techOps.propertyId],
    references: [properties.id],
  }),
  technician: one(users, {
    fields: [techOps.technicianId],
    references: [users.id],
  }),
  resolvedBy: one(users, {
    fields: [techOps.resolvedById],
    references: [users.id],
  }),
}));

export const propertyChannels = pgTable("property_channels", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const propertyChannelsRelations = relations(propertyChannels, ({ one }) => ({
  user: one(users, {
    fields: [propertyChannels.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [propertyChannels.propertyId],
    references: [properties.id],
  }),
}));

export type PropertyChannel = typeof propertyChannels.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  role: true,
  phone: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['service_tech', 'supervisor', 'repair_tech', 'repair_foreman']),
  phone: z.string().optional(),
  county: z.enum(['north_county', 'south_county', 'mid_county']).optional(),
});

export type County = 'north_county' | 'south_county' | 'mid_county';

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Estimate = typeof estimates.$inferSelect;
export type RouteStop = typeof routeStops.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type TechOps = typeof techOps.$inferSelect;
