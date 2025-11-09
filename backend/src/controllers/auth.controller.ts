import { Request, Response } from "express";
import { db } from "../config/firebase.config"; // Firestore client SDK
import { doc, setDoc } from "firebase/firestore";

// Custom request interface (optional)
interface CustomRequest extends Request {
    userId?: string;
}

// POST /api/auth/signup-metadata
export const signupMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid, displayName, email } = req.body;
    if (!uid || !displayName || !email) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Save metadata to Firestore
    // ... your Firestore logic here ...

    res.status(201).json({ message: "User metadata saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login endpoint placeholder (optional)
export const login = async (req: CustomRequest, res: Response) => {
  res.status(501).json({
    message: "Login handled client-side with Firebase Auth; backend only verifies ID tokens if needed.",
  });
};
