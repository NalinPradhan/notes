import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  try {
    // Clear existing data
    await prisma.note.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    console.log("Database cleared");

    // Create password hash
    const password = await bcrypt.hash("password", 10);

    // Create Acme tenant
    const acmeTenant = await prisma.tenant.create({
      data: {
        name: "Acme Corporation",
        slug: "acme",
        subscriptionPlan: "FREE",
      },
    });

    // Create Globex tenant
    const globexTenant = await prisma.tenant.create({
      data: {
        name: "Globex Corporation",
        slug: "globex",
        subscriptionPlan: "FREE",
      },
    });

    console.log("Tenants created");

    // Create Acme users
    await prisma.user.createMany({
      data: [
        {
          email: "admin@acme.test",
          password,
          role: "ADMIN",
          tenantId: acmeTenant.id,
        },
        {
          email: "user@acme.test",
          password,
          role: "MEMBER",
          tenantId: acmeTenant.id,
        },
      ],
    });

    // Create Globex users
    await prisma.user.createMany({
      data: [
        {
          email: "admin@globex.test",
          password,
          role: "ADMIN",
          tenantId: globexTenant.id,
        },
        {
          email: "user@globex.test",
          password,
          role: "MEMBER",
          tenantId: globexTenant.id,
        },
      ],
    });

    console.log("Users created");

    // Create sample notes for each tenant
    const acmeAdmin = await prisma.user.findFirst({
      where: {
        email: "admin@acme.test",
      },
    });

    const globexAdmin = await prisma.user.findFirst({
      where: {
        email: "admin@globex.test",
      },
    });

    // Create a note for Acme
    if (acmeAdmin) {
      await prisma.note.create({
        data: {
          title: "Welcome to Acme Notes",
          content: "This is a sample note for Acme Corporation.",
          tenantId: acmeTenant.id,
          userId: acmeAdmin.id,
        },
      });
    }

    // Create a note for Globex
    if (globexAdmin) {
      await prisma.note.create({
        data: {
          title: "Welcome to Globex Notes",
          content: "This is a sample note for Globex Corporation.",
          tenantId: globexTenant.id,
          userId: globexAdmin.id,
        },
      });
    }

    console.log("Sample notes created");
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
