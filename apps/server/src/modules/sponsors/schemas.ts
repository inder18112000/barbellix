import { z } from 'zod';

export const createSponsorSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
});

export const updateSponsorSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  active: z.boolean().optional(),
});

export const sponsorIdParamSchema = z.object({ sponsorId: z.string() });
