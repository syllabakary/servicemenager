import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const services = pgTable("services", {
  id: integer("id").primaryKey(),
  nom: text("nom").notNull(),
  description: text("description").notNull(),
  icone: text("icone").notNull(),
});

export const agencies = pgTable("agencies", {
  id: integer("id").primaryKey(),
  nom: text("nom").notNull(),
  ville: text("ville").notNull(),
  services: text("services").array().notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  horaires: text("horaires"),
  telephone: text("telephone"),
  email: text("email"),
});

export const quoteRequests = pgTable("quote_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  service: text("service").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  createdAt: true,
}).extend({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  service: z.string().min(1, "Veuillez sélectionner un service"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Agency = typeof agencies.$inferSelect;
