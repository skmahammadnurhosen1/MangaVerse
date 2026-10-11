import { Router } from 'express';
import { FileController } from '../controllers/fileController.js';

const router = Router();

// Stream file asset by GridFS ID
router.get('/:fileId', FileController.serveFile);

export default router;
