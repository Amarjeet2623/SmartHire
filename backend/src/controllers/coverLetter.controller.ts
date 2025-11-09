import { Request, Response } from 'express';
import { ResumeModel } from '../models/resume.model';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Types } from 'mongoose';

// Gemini Initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface CustomRequest extends Request {
  user?: { uid: string };
}

// Controller
export const generateCoverLetterController = async (req: CustomRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.uid) {
    res.status(401).json({ message: 'Unauthorized: User not authenticated or UID missing.' });
    return;
  }

  const userId = req.user.uid;
  const { selectedResume, jobDescription, companyName, roleName, selectedTemplate } = req.body;

  if (!selectedResume || !jobDescription) {
    res.status(400).json({ message: 'Bad Request: Missing selected resume ID or job description.' });
    return;
  }

  console.log(`[CoverLetterGen] User: ${userId} initiating cover letter generation...`);
  console.log(`[CoverLetterGen] Resume: ${selectedResume}, Company: ${companyName}, Role: ${roleName}, Template: ${selectedTemplate}`);

  try {
    // ✅ 1. Fetch resume from MongoDB using Mongoose
    if (!Types.ObjectId.isValid(selectedResume)) {
      res.status(400).json({ message: 'Invalid resume ID format.' });
      return;
    }

    const resumeDoc = await ResumeModel.findOne({ _id: selectedResume, userId }).lean();
    if (!resumeDoc) {
      console.warn(`[CoverLetterGen] Resume not found or unauthorized access. Resume ID: ${selectedResume}, User: ${userId}`);
      res.status(404).json({ message: 'Resume not found or you do not have permission to access it.' });
      return;
    }

    if (!resumeDoc.parsedText || resumeDoc.parsedText.trim() === '') {
      res.status(400).json({ message: 'Selected resume contains no text to use for generation.' });
      return;
    }

    const resumeContent = resumeDoc.parsedText;
    console.log(`[CoverLetterGen] Resume content fetched successfully. Length: ${resumeContent.length}`);

    // ✅ 2. Define template tone
    let tone = 'Write in a standard professional tone.';
    if (selectedTemplate === 'modern') {
      tone = 'Write in a confident, modern professional tone with strong action verbs.';
    } else if (selectedTemplate === 'creative') {
      tone = 'Write in a creative and engaging tone. Be expressive but remain professional.';
    }

    // ✅ 3. Construct AI prompt
    const prompt = `
      Generate a professional cover letter tailored for the position of **${roleName || '[Role Name]'}** 
      at **${companyName || '[Company Name]'}** based strictly on the following resume and job description.

      Tone: ${tone}

      Rules:
      - Highlight relevant skills and experiences from the resume that match the job description.
      - Do not invent information not in the resume.
      - Format as a traditional cover letter: intro, experience connection, and closing.
      - Address it to "Dear Hiring Manager".
      - Use clean paragraph breaks (\\n\\n).
      - Do not include markdown, commentary, or code blocks.

      --- START RESUME ---
      ${resumeContent}
      --- END RESUME ---

      --- START JOB DESCRIPTION ---
      ${jobDescription}
      --- END JOB DESCRIPTION ---

      Final Output: Full cover letter text only.
    `;

    console.log('[CoverLetterGen] Prompt ready. Calling Gemini...');

    // ✅ 4. Call Gemini AI
    const result = await model.generateContent(prompt, 
        // {
    //   generationConfig: {
    //     temperature: 0.6,
    //     topP: 0.95,
    //     maxOutputTokens: 3072,
    //   },
    //   safetySettings: [
    //     { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //     { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //     { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //     { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //   ],
    // }
);

    const response = await result.response;
    const generatedCoverLetter = response.text()?.trim();

    if (!generatedCoverLetter) {
      console.error(`[CoverLetterGen] Gemini returned an empty response.`);
      throw new Error('AI generation resulted in an empty cover letter.');
    }

    console.log(`[CoverLetterGen] Cover letter generated successfully. Length: ${generatedCoverLetter.length}`);

    // ✅ 5. Optional: Save generated cover letter
    // Uncomment if you want to persist
    // await CoverLetterModel.create({
    //   userId,
    //   resumeId: selectedResume,
    //   companyName,
    //   roleName,
    //   content: generatedCoverLetter,
    //   createdAt: new Date(),
    // });

    res.status(200).json({
      message: 'Cover letter generated successfully',
      generatedCoverLetter,
    });

  } catch (error: any) {
    console.error(`[CoverLetterGen] Error:`, error.message);

    let message = 'Internal server error during cover letter generation.';
    if (error.message.includes('API key')) {
      message = 'Invalid Gemini API Key.';
    } else if (error.message.includes('rate limit')) {
      message = 'Gemini rate limit exceeded. Try again later.';
    }

    res.status(500).json({ message });
  }
};
