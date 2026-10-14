// Local-only bulk data generator for the index / EXPLAIN experiments (Session 12).
// Usage:
//   DATABASE_URL="postgresql://<user>:<password>@127.0.0.1:5433/<db>" npx tsx prisma/seed-bulk.ts
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, TaskStatus } from './generated/client.js';

const USERS = 100;
const TASKS_PER_USER = 2000;
const BATCH_SIZE = 5000;
const EMAIL_DOMAIN = '@bulk.example.com';
const PASSWORD = 'Password123!';

// Safety guard: this script never reads .env and only runs against a local database.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required: pass the LOCAL url inline.');
}
const host = new URL(databaseUrl).hostname;

if (host !== '127.0.0.1' && host !== 'localhost') {
  throw new Error(`Refusing to run: host "${host}" is not local.`);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const VERBS = ['Préparer', 'Envoyer', 'Relire', 'Planifier', 'Valider', 'Appeler', 'Corriger', 'Organiser', 'Rédiger', 'Vérifier'];
const NOUNS = ['réunion', 'réunions', 'client', 'clients', 'rapport', 'rapports', 'facture', 'factures', 'équipe', 'équipes', 'présentation', 'présentations', 'déploiement', 'contrat', 'contrats', 'planning', 'budget'];
const DETAILS = ['avant lundi', 'pour la direction', 'avec l\'équipe', 'cette semaine', 'dès que possible', 'chez le client', 'avant la livraison', 'après la réunion'];

const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)] as T;

// Skewed on purpose: IN_PROGRESS is rare, so a (userId, status) index can be measured against a userId-only one.
const pickStatus = (): TaskStatus => {
  const r = Math.random();
  if (r < 0.05) return TaskStatus.IN_PROGRESS;
  if (r < 0.25) return TaskStatus.TODO;
  return TaskStatus.DONE;
};

type NewTask = { name: string; description: string; status: TaskStatus; userId: string };

const buildTask = (userId: string): NewTask => {
  const verb = pick(VERBS);
  const noun = pick(NOUNS);
  return {
    name: `${verb} ${noun}`,
    description: `${verb} ${noun} ${pick(DETAILS)}, puis ${pick(VERBS).toLowerCase()} ${pick(NOUNS)} ${pick(DETAILS)}.`,
    status: pickStatus(),
    userId,
  };
};

async function main() {
  const started = Date.now();

  // Re-runnable: remove what a previous run generated (tasks first, the FK blocks deleting users).
  await prisma.task.deleteMany({ where: { user: { email: { endsWith: EMAIL_DOMAIN } } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });

  // Hash once and reuse it: 100 separate bcrypt hashes would take about 10 s.
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await prisma.user.createMany({
    data: Array.from({ length: USERS }, (_, i) => ({
      name: `Bulk User ${i + 1}`,
      email: `user${String(i + 1).padStart(3, '0')}${EMAIL_DOMAIN}`,
      password: passwordHash,
      role: Role.MEMBER,
    })),
  });
  const users = await prisma.user.findMany({
    where: { email: { endsWith: EMAIL_DOMAIN } },
    select: { id: true },
  });

  let buffer: NewTask[] = [];
  let inserted = 0;
  const flush = async () => {
    if (buffer.length === 0) return;
    await prisma.task.createMany({ data: buffer });
    inserted += buffer.length;
    console.log(`  ${inserted} / ${users.length * TASKS_PER_USER} tasks`);
    buffer = [];
  };

  for (const user of users) {
    for (let i = 0; i < TASKS_PER_USER; i++) {
      buffer.push(buildTask(user.id));
      if (buffer.length >= BATCH_SIZE) await flush();
    }
  }
  await flush();

  const total = await prisma.task.count({ where: { user: { email: { endsWith: EMAIL_DOMAIN } } } });
  console.log(`Done: ${users.length} users, ${total} tasks in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  console.log('Next: run  ANALYZE "Task";  so the planner has fresh statistics.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
