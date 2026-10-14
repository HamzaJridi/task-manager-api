import express from "express";
import {schemaValidator} from "../middlewares/validate.middleware.js";
import {loginSchema, registerSchema} from "../schemas/auth.schema.js";
import {catchAsync} from "../utils/catchAsync.js";
import {register, login} from "../controllers/auth.controller.js";
import { createAuthRateLimiter } from "../middlewares/ratelimit.middleware.js";


const router = express.Router();

router.post('/register', createAuthRateLimiter(), schemaValidator(registerSchema), catchAsync(register));

router.post('/login', createAuthRateLimiter(), schemaValidator(loginSchema), catchAsync(login));

export default router;
