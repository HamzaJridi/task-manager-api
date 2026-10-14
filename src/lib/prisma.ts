import { PrismaClient } from '../../prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../schemas/env.schema.js';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
