import type { Service, Agency, QuoteRequest, InsertQuoteRequest } from "@shared/schema";
import { randomUUID } from "crypto";

const cleaningImage = "/attached_assets/generated_images/Professional_cleaning_service_photo_2a582859.png";
const childcareImage = "/attached_assets/generated_images/Childcare_service_photo_e9f137e4.png";
const gardeningImage = "/attached_assets/generated_images/Gardening_service_photo_0007b568.png";
const abidjanImage = "/attached_assets/generated_images/Abidjan_agency_storefront_41598fcd.png";
const bouakeImage = "/attached_assets/generated_images/Bouaké_agency_storefront_efadb467.png";

export interface IStorage {
  getServices(): Promise<Service[]>;
  getAgencies(): Promise<Agency[]>;
  getAgencyById(id: number): Promise<Agency | undefined>;
  createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest>;
  getQuoteRequests(): Promise<QuoteRequest[]>;
}

export class MemStorage implements IStorage {
  private services: Service[];
  private agencies: Agency[];
  private quoteRequests: Map<string, QuoteRequest>;

  constructor() {
    this.services = [
      {
        id: 1,
        nom: "Ménage à domicile",
        description: "Service complet de ménage et d'entretien régulier ou ponctuel pour votre maison.",
        icone: "Sparkles",
      },
      {
        id: 2,
        nom: "Garde d'enfants",
        description: "Des professionnels de confiance pour la garde d'enfants à domicile en toute sécurité.",
        icone: "Baby",
      },
      {
        id: 3,
        nom: "Jardinage",
        description: "Entretien, taille, tonte et aménagement de vos espaces verts par des experts.",
        icone: "TreeDeciduous",
      },
    ];

    this.agencies = [
      {
        id: 1,
        nom: "Service Pro Abidjan",
        ville: "Abidjan",
        services: ["Ménage", "Repassage", "Garde d'enfants"],
        description: "Agence de services à domicile de confiance basée à Abidjan. Nous proposons des prestations de qualité avec des professionnels qualifiés et vérifiés.",
        image: abidjanImage,
        horaires: "Lundi - Samedi : 7h00 - 19h00",
        telephone: "+225 27 20 12 34 56",
        email: "contact@servicepro-abidjan.ci",
      },
      {
        id: 2,
        nom: "Maison Plus Bouaké",
        ville: "Bouaké",
        services: ["Ménage", "Jardinage"],
        description: "Prestataire local spécialisé dans l'entretien des maisons et des jardins. Service rapide et personnalisé pour tous vos besoins.",
        image: bouakeImage,
        horaires: "Lundi - Vendredi : 8h00 - 18h00",
        telephone: "+225 31 63 45 78 90",
        email: "info@maisonplus-bouake.ci",
      },
      {
        id: 3,
        nom: "Excellence Services Abidjan",
        ville: "Abidjan",
        services: ["Ménage", "Garde d'enfants", "Jardinage", "Repassage"],
        description: "L'excellence au service de votre quotidien. Une équipe dédiée pour tous vos besoins domestiques avec un service premium.",
        image: abidjanImage,
        horaires: "Lundi - Dimanche : 6h00 - 21h00",
        telephone: "+225 27 20 98 76 54",
        email: "contact@excellence-abidjan.ci",
      },
      {
        id: 4,
        nom: "Famille & Maison Yamoussoukro",
        ville: "Yamoussoukro",
        services: ["Garde d'enfants", "Ménage"],
        description: "Services familiaux de qualité pour votre tranquillité d'esprit. Professionnels expérimentés et de confiance.",
        image: cleaningImage,
        horaires: "Lundi - Samedi : 7h00 - 19h00",
        telephone: "+225 30 64 12 34 56",
        email: "contact@famille-maison.ci",
      },
      {
        id: 5,
        nom: "Jardin Vert Bouaké",
        ville: "Bouaké",
        services: ["Jardinage"],
        description: "Spécialistes de l'entretien et de l'aménagement paysager. Votre jardin mérite les meilleurs soins.",
        image: gardeningImage,
        horaires: "Lundi - Samedi : 6h00 - 17h00",
        telephone: "+225 31 63 78 90 12",
        email: "contact@jardinvert-bouake.ci",
      },
      {
        id: 6,
        nom: "Confort Home Abidjan",
        ville: "Abidjan",
        services: ["Ménage", "Repassage"],
        description: "Votre confort est notre priorité. Services de nettoyage et de repassage de haute qualité.",
        image: cleaningImage,
        horaires: "Lundi - Vendredi : 7h00 - 19h00",
        telephone: "+225 27 20 55 44 33",
        email: "info@confort-home.ci",
      },
    ];

    this.quoteRequests = new Map();
  }

  async getServices(): Promise<Service[]> {
    return this.services;
  }

  async getAgencies(): Promise<Agency[]> {
    return this.agencies;
  }

  async getAgencyById(id: number): Promise<Agency | undefined> {
    return this.agencies.find((a) => a.id === id);
  }

  async createQuoteRequest(request: InsertQuoteRequest): Promise<QuoteRequest> {
    const id = randomUUID();
    const quoteRequest: QuoteRequest = {
      ...request,
      id,
      createdAt: new Date().toISOString(),
    };
    this.quoteRequests.set(id, quoteRequest);
    return quoteRequest;
  }

  async getQuoteRequests(): Promise<QuoteRequest[]> {
    return Array.from(this.quoteRequests.values());
  }
}

export const storage = new MemStorage();
