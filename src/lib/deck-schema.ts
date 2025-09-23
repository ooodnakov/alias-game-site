import { z } from "zod";

export const DeckWordSchema = z.object({
  text: z.string().min(1),
  difficulty: z.number().int().min(0).max(10).optional(),
  category: z.string().optional(),
  wordClass: z.string().optional(),
});

export const DeckSchema = z.object({
  title: z.string().min(1).max(100),
  author: z.string().min(1).max(100),
  language: z.enum(["en", "ru"]),
  allowNSFW: z.boolean().default(false),
  words: z.array(DeckWordSchema).min(20),
  metadata: z
    .object({
      categories: z.array(z.string()).default([]),
      wordClasses: z.array(z.string()).default([]),
      coverImage: z.string().url().optional(),
      version: z.string().optional(),
    })
    .default({ categories: [], wordClasses: [] }),
});

export type DeckWord = z.infer<typeof DeckWordSchema>;
export type Deck = z.infer<typeof DeckSchema>;
