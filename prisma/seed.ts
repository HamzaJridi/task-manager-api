import bcrypt from 'bcrypt';
import prisma from "../src/lib/prisma.js";



const deleteAllTasks = async () => {
  await prisma.task.deleteMany();
};

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const hamza = await prisma.user.upsert({
    where: { email: 'hamza@example.com' },
    update: {},
    create: {
      name: 'Hamza',
      email: 'hamza@example.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  const hashedPassword2 = await bcrypt.hash('password123233', 10);

  const claude = await prisma.user.upsert({
    where: { email: 'claude@example.com' },
    update: {},
    create: {
      name: 'Claude',
      email: 'claude@example.com',
      password: hashedPassword2,
      role: 'MEMBER'
    }
  });

  await deleteAllTasks();

  await prisma.task.createMany({
    data: [
      { name: 'Task A', description: 'desc A', status: 'TODO', userId: hamza.id },
      { name: 'Task B', description: 'desc B', status: 'IN_PROGRESS', userId: hamza.id },
      { name: 'Task C', description: 'desc C', status: 'DONE', userId: hamza.id },
      { name: 'Task D', description: 'desc D', status: 'TODO', userId: claude.id },
      { name: 'Task E', description: 'desc E', status: 'DONE', userId: claude.id },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



