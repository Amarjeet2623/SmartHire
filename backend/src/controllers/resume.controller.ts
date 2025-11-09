import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v2 as cloudinary } from 'cloudinary';
import { ResumeModel } from '../models/resume.model';
import dotenv from 'dotenv';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

dotenv.config();
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


interface CustomRequest extends Request {
  user?: { uid: string };
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Upload Resume ---
export const uploadResume = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ message: 'Unauthorized: Missing user info' });
      return;
    }

    const userId = req.user.uid;
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const file = req.file;
    let parsedText = '';

    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      parsedText = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const { value } = await mammoth.extractRawText({ buffer: file.buffer });
      parsedText = value;
    } else {
      res.status(400).json({ message: 'Unsupported file type' });
      return;
    }

    parsedText = parsedText.replace(/\s+/g, ' ').trim();

    const cloudinaryUpload = (): Promise<any> =>
      new Promise((resolve, reject) => {
        try {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'raw', folder: 'resumes', public_id: `${userId}_${Date.now()}` },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(file.buffer);
        } catch (err) {
          reject(err);
        }
      });

    const cloudResult = await cloudinaryUpload();

    const resumeDoc = await ResumeModel.create({
      userId,
      originalFilename: file.originalname,
      parsedText,
      cloudinaryUrl: cloudResult.secure_url,
      uploadTimestamp: new Date(),
    });

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resumeId: resumeDoc._id,
      cloudinaryUrl: cloudResult.secure_url,
    });
  } catch (err) {
    console.error('[uploadResume]', err);
    res.status(500).json({
      message: 'Server error during resume upload',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};


// --- Analyze Resume ---
export const analyzeResume = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    const { resumeId } = req.params;

    const resumeDoc = await ResumeModel.findById(resumeId);
    console.log(resumeDoc);
    if (!resumeDoc) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }
    if (resumeDoc.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    if (!resumeDoc.parsedText || resumeDoc.parsedText.trim() === '') {
      res.status(400).json({ message: 'Empty resume' });
      return;
    }

    const prompt = `
    You are a resume analysis engine. 
    Analyze the following resume text and respond *only* in strict JSON (no explanations, no markdown).
    Use this schema:
    {
      "overallScore": number (0-100),
      "categoryScores": {
        "formatting": number,
        "content": number,
        "keywords": number,
        "impact": number
      },
      "suggestions": string[],
      "strengths": string[]
    }

    Resume text:
    ${resumeDoc.parsedText}
    `;

    const aiResponse = await model.generateContent(prompt);
    const aiText = (await aiResponse.response).text();

    let analysisResult = {};
    try {
      const jsonMatch = aiText.match(/\{.*\}/s);
      if (jsonMatch) analysisResult = JSON.parse(jsonMatch[0]);
    } catch (err) {
      res.status(500).json({ message: 'Failed to parse AI response', error: err });
      return;
    }

    resumeDoc.analysis = {
      ...analysisResult,
      analysisTimestamp: new Date(),
    };
    await resumeDoc.save();

    res.status(200).json({ message: 'Resume analyzed', analysis: resumeDoc.analysis });
  } catch (err) {
    console.error('[analyzeResume]', err);
    res.status(500).json({ message: 'Error analyzing resume', error: err });
  }
};

// --- Get Uploaded Resumes ---
export const getUploadedResumes = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const userId = req.user.uid;

    const resumes = await ResumeModel.find({ userId }).sort({ uploadTimestamp: -1 }).lean();

    res.status(200).json({ resumes });
  } catch (err) {
    console.error('[getUploadedResumes]', err);
    res.status(500).json({ message: 'Error fetching resumes', error: err });
  }
};
