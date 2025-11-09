import { Schema, model, Document } from 'mongoose';

export interface AnalysisResult {
  overallScore?: number;
  categoryScores?: {
    formatting?: number;
    content?: number;
    keywords?: number;
    impact?: number;
  };
  suggestions?: string[];
  strengths?: string[];
  analysisTimestamp?: Date;
}

export interface ResumeDocument extends Document {
  userId: string;
  originalFilename: string;
  cloudinaryUrl: string;
  parsedText: string;
  uploadTimestamp: Date;
  analysis?: AnalysisResult;
}

const AnalysisSchema = new Schema<AnalysisResult>({
  overallScore: { type: Number },
  categoryScores: {
    formatting: { type: Number },
    content: { type: Number },
    keywords: { type: Number },
    impact: { type: Number },
  },
  suggestions: [{ type: String }],
  strengths: [{ type: String }],
  analysisTimestamp: { type: Date },
}, { _id: false });

const ResumeSchema = new Schema<ResumeDocument>({
  userId: { type: String, required: true },
  originalFilename: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  parsedText: { type: String, required: true },
  uploadTimestamp: { type: Date, default: Date.now },
  analysis: { type: AnalysisSchema },
});

ResumeSchema.index({ userId: 1, uploadTimestamp: -1 });


export const ResumeModel = model<ResumeDocument>('Resume', ResumeSchema);
