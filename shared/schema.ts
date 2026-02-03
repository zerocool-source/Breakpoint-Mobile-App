import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum('user_role', ['service_tech', 'supervisor', 'repair_tech', 'repair_foreman']);
export const countyEnum = pgEnum('county', ['north_county', 'south_county', 'mid_county']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const jobPriorityEnum = pgEnum('job_priority', ['low', 'normal', 'high', 'urgent']);
export const jobTypeEnum = pgEnum('job_type', ['approved_repair', 'assessment']);
export const propertyTypeEnum = pgEnum('property_type', ['HOA', 'Apartment', 'Hotel', 'Commercial', 'Municipal']);
export const assignmentStatusEnum = pgEnum('assignment_status', ['pending', 'in_progress', 'completed', 'need_assistance']);
export const estimateStatusEnum = pgEnum('estimate_status', ['draft', 'sent', 'approved', 'rejected', 'expired']);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 50 }).notNull().default('tech'),
  phone: varchar("phone", { length: 50 }),
  county: varchar("county", { length: 100 }),
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
  propertyType: text("property_type"),
  gateCode: text("gate_code"),
  primaryContactName: text("primary_contact_name"),
  primaryContactPhone: text("primary_contact_phone"),
  primaryContactEmail: text("primary_contact_email"),
  notes: text("notes"),
  poolCount: integer("pool_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  jobType: text("job_type").notNull().default('approved_repair'),
  scheduledDate: timestamp("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  photos: text("photos").array().default([]),
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

// AI Learning System - Self-improving estimates
export const feedbackTypeEnum = pgEnum('feedback_type', ['selected', 'rejected', 'modified', 'ignored']);

// Tracks each AI search interaction
export const aiLearningInteractions = pgTable("ai_learning_interactions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id),
  propertyType: text("property_type"),
  userQuery: text("user_query").notNull(),
  suggestedProducts: text("suggested_products").notNull(), // JSON array of product SKUs
  selectedProducts: text("selected_products"), // JSON array of products user actually added
  sessionId: varchar("session_id", { length: 36 }), // Groups interactions in same estimate session
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tracks individual product feedback for learning
export const aiProductFeedback = pgTable("ai_product_feedback", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  interactionId: varchar("interaction_id", { length: 36 }).references(() => aiLearningInteractions.id),
  productSku: text("product_sku").notNull(),
  productName: text("product_name").notNull(),
  feedbackType: feedbackTypeEnum("feedback_type").notNull(),
  quantitySelected: integer("quantity_selected"),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // AI's original confidence
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Learned product patterns - products frequently used together
export const aiProductPatterns = pgTable("ai_product_patterns", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  primaryProductSku: text("primary_product_sku").notNull(),
  relatedProductSku: text("related_product_sku").notNull(),
  coOccurrenceCount: integer("co_occurrence_count").notNull().default(1),
  propertyType: text("property_type"), // Pattern may vary by property type
  avgQuantityRatio: decimal("avg_quantity_ratio", { precision: 5, scale: 2 }), // Avg qty of related vs primary
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Query term mappings - learns synonyms and user terminology
export const aiQueryMappings = pgTable("ai_query_mappings", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  queryTerm: text("query_term").notNull(),
  mappedProductSku: text("mapped_product_sku").notNull(),
  successCount: integer("success_count").notNull().default(1), // Times this mapping led to selection
  totalCount: integer("total_count").notNull().default(1), // Total times suggested
  lastUsed: timestamp("last_used").notNull().defaultNow(),
});

// Repair History - tracks all completed repairs per property
export const repairHistory = pgTable("repair_history", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id),
  technicianId: varchar("technician_id", { length: 36 }).notNull().references(() => users.id),
  jobId: varchar("job_id", { length: 36 }).references(() => jobs.id),
  estimateId: varchar("estimate_id", { length: 36 }).references(() => estimates.id),
  title: text("title").notNull(),
  description: text("description"),
  workPerformed: text("work_performed").notNull(),
  partsUsed: text("parts_used"), // JSON array of parts/products
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  notes: text("notes"),
  photoUrls: text("photo_urls"), // JSON array of photo URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const repairHistoryRelations = relations(repairHistory, ({ one }) => ({
  property: one(properties, {
    fields: [repairHistory.propertyId],
    references: [properties.id],
  }),
  technician: one(users, {
    fields: [repairHistory.technicianId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [repairHistory.jobId],
    references: [jobs.id],
  }),
  estimate: one(estimates, {
    fields: [repairHistory.estimateId],
    references: [estimates.id],
  }),
}));

// Admin Messages - direct chat between technicians and office/admin
export const adminMessageStatusEnum = pgEnum('admin_message_status', ['unread', 'read', 'archived']);
export const adminMessagePriorityEnum = pgEnum('admin_message_priority', ['normal', 'urgent']);

export const adminMessages = pgTable("admin_messages", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id", { length: 36 }).notNull().references(() => users.id),
  recipientId: varchar("recipient_id", { length: 36 }).references(() => users.id), // null = sent to office/admin
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id), // optional context
  jobId: varchar("job_id", { length: 36 }).references(() => jobs.id), // optional context
  subject: text("subject"),
  content: text("content").notNull(),
  priority: adminMessagePriorityEnum("priority").notNull().default('normal'),
  status: adminMessageStatusEnum("status").notNull().default('unread'),
  isFromAdmin: boolean("is_from_admin").notNull().default(false),
  parentMessageId: varchar("parent_message_id", { length: 36 }), // for reply threads
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminMessagesRelations = relations(adminMessages, ({ one }) => ({
  sender: one(users, {
    fields: [adminMessages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [adminMessages.recipientId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [adminMessages.propertyId],
    references: [properties.id],
  }),
  job: one(jobs, {
    fields: [adminMessages.jobId],
    references: [jobs.id],
  }),
  parentMessage: one(adminMessages, {
    fields: [adminMessages.parentMessageId],
    references: [adminMessages.id],
  }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Estimate = typeof estimates.$inferSelect;
export type RouteStop = typeof routeStops.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type TechOps = typeof techOps.$inferSelect;
export type RepairHistory = typeof repairHistory.$inferSelect;
export type AdminMessage = typeof adminMessages.$inferSelect;

// AI Learning System types
export type AILearningInteraction = typeof aiLearningInteractions.$inferSelect;
export type AIProductFeedback = typeof aiProductFeedback.$inferSelect;
export type AIProductPattern = typeof aiProductPatterns.$inferSelect;
export type AIQueryMapping = typeof aiQueryMappings.$inferSelect;

// Pool Regulations for AI Quote Descriptions
export const regulationCategoryEnum = pgEnum('regulation_category', [
  'anti_entrapment', 
  'pumps_equipment', 
  'filters', 
  'disinfection', 
  'safety_equipment', 
  'enclosure_fencing', 
  'lighting', 
  'signage', 
  'water_quality', 
  'turnover_time',
  'general_maintenance',
  'health_safety'
]);

export const poolRegulations = pgTable("pool_regulations", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  codeSection: text("code_section").notNull(),
  title: text("title").notNull(),
  category: regulationCategoryEnum("category").notNull(),
  summary: text("summary").notNull(),
  fullText: text("full_text").notNull(),
  hoaFriendlyExplanation: text("hoa_friendly_explanation").notNull(),
  relatedProducts: text("related_products"),
  sourceDocument: text("source_document").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PoolRegulation = typeof poolRegulations.$inferSelect;

// Urgent Notifications from Office
export const notificationTypeEnum = pgEnum('notification_type', ['urgent', 'warning', 'info']);

export const urgentNotifications = pgTable("urgent_notifications", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull().default('info'),
  icon: varchar("icon", { length: 50 }).default('bell'),
  targetRole: varchar("target_role", { length: 50 }), // null means all roles
  targetUserId: varchar("target_user_id", { length: 36 }), // null means all users of role
  propertyId: varchar("property_id", { length: 36 }), // optional: related property
  isRead: boolean("is_read").notNull().default(false),
  isDismissed: boolean("is_dismissed").notNull().default(false),
  expiresAt: timestamp("expires_at"), // optional expiration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 36 }), // office user who sent it
});

export type UrgentNotification = typeof urgentNotifications.$inferSelect;
export type InsertUrgentNotification = typeof urgentNotifications.$inferInsert;

export * from "./models/chat";
