import { Router } from 'express';
// Import controller functions
import { signupMetadata, login } from '../controllers/auth.controller'; // Import signup and login

const router = Router();

// Define authentication routes
router.post("/signup-metadata", signupMetadata); // Use the imported signup controller
router.post('/login', login); // Use the imported login controller

export default router; 