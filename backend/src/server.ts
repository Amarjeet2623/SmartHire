import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose'; // MongoDB connection

// Import routes
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import builderRoutes from './routes/builder.routes';
import matchRoutes from './routes/match.routes';
import tipsRoutes from './routes/tips.routes';
import coverLetterRoutes from './routes/coverLetter.routes';
import activityRoutes from './routes/activity.routes';

dotenv.config(); // Load environment variables from .env

const app: Express = express();
const port = process.env.PORT || 3001;

// --- MongoDB Connection ---
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-resume';
mongoose.connect(mongoUri)
  .then(() => console.log('[MongoDB]: Connected successfully'))
  .catch(err => {
      console.error('[MongoDB]: Connection error:', err);
      process.exit(1); // Stop server if DB connection fails
  });

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/builder', builderRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/cover-letter', coverLetterRoutes);
app.use('/api/activity', activityRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
    res.send('IntelliHire Backend is running!');
});

// Start server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`[server]: Server running at http://localhost:${port}`);
    });
}

export default app;
