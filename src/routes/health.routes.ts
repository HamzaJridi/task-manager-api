import {catchAsync} from "../utils/catchAsync.js";
import express from "express";
import {checkHealth} from "../controllers/health.controller.js";


const router = express.Router();
router.get('/health',catchAsync(checkHealth));
export default router;
