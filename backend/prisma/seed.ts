import "dotenv/config";
  import bcrypt from "bcrypt";
  import { prisma } from "../src/lib/prisma";

  async function main() {
    const email = "admin@ticketing.com";
    const password = "admin123";
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name: "Admin", email, passwordHash, role: "ADMIN" },
    });

    console.log("Admin ready:", admin.email, "| password:", password);
  }

  main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });