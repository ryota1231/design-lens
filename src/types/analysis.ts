import { z } from 'zod';

export const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'HEXコード形式である必要があります'),
  role: z.string(),
});

export const CategorySchema = z.enum(['sign', 'logo', 'pop', 'signage', 'other']);

export const AnalysisResultSchema = z.object({
  concept: z.string().min(1),
  typography: z.string().min(1),
  fontHints: z.array(z.string()),
  colors: z.array(ColorSchema),
  composition: z.string().min(1),
  target: z.string().min(1),
  extractedText: z.array(z.string()),
  category: CategorySchema,
  rawResponse: z.string(),
});

export const AnalyzeRequestSchema = z.object({
  image: z.string().startsWith('data:image/', '画像のdata URLである必要があります'),
  language: z.enum(['ja', 'en']),
});

export const PromptRequestSchema = z.object({
  analysis: AnalysisResultSchema.omit({ rawResponse: true }),
  language: z.enum(['ja', 'en']),
});

export const PromptResponseSchema = z.object({
  prompt: z.string().min(1),
});

export type Color = z.infer<typeof ColorSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type PromptRequest = z.infer<typeof PromptRequestSchema>;
export type PromptResponse = z.infer<typeof PromptResponseSchema>;
