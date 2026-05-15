
import dotenv from 'dotenv';
import express, { Router, json } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

import gebouwRoutes from './routes/gebouw.routes.js';
import branddeurRoutes from './routes/branddeur.routes.js';
import branddeurInspectieRoutes from './routes/branddeurInspectie.routes.js';
import inspectieChecklistItemRoutes from './routes/inspectieChecklistItem.routes.js';
import inspectieChecklistCategoryRoutes from './routes/inspectieChecklistCategory.routes.js';

// Load environment variables from .env file (works in local dev, ignored in production)
dotenv.config();

const app = express();
const router = Router();

app.use(json());
app.use(cors({
    origin: '*',
    allowedHeaders: '*',
    allowCredentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.options('*', cors());

router.use('/gebouwen', gebouwRoutes);
router.use('/branddeuren', branddeurRoutes);
router.use('/branddeur-inspecties', branddeurInspectieRoutes);
router.use('/inspectie-checklist-items', inspectieChecklistItemRoutes);
router.use('/inspectie-checklist-categories', inspectieChecklistCategoryRoutes);

app.use('/.netlify/functions/branddeur-pro-server', router);

export const handler = serverless(app);
