import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuoteRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/services", async (_req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/agencies", async (_req, res) => {
    try {
      const agencies = await storage.getAgencies();
      res.json(agencies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agencies" });
    }
  });

  app.get("/api/agencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid agency ID" });
      }
      
      const agency = await storage.getAgencyById(id);
      if (!agency) {
        return res.status(404).json({ error: "Agency not found" });
      }
      
      res.json(agency);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agency" });
    }
  });

  app.post("/api/quote-requests", async (req, res) => {
    try {
      const validatedData = insertQuoteRequestSchema.parse(req.body);
      const quoteRequest = await storage.createQuoteRequest(validatedData);
      res.status(201).json(quoteRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create quote request" });
    }
  });

  app.get("/api/quote-requests", async (_req, res) => {
    try {
      const quoteRequests = await storage.getQuoteRequests();
      res.json(quoteRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quote requests" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
