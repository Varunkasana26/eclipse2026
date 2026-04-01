const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const computers = [
    {
      name: "Lab-A-01",
      location: "Main Lab",
      description: "High performance workstation",
    },
    {
      name: "Lab-A-02",
      location: "Main Lab",
      description: "Standard programming machine",
    },
    {
      name: "Lab-B-01",
      location: "AI Lab",
      description: "GPU-enabled machine",
    },
  ];

  for (const computer of computers) {
    await prisma.computer.upsert({
      where: { name: computer.name },
      update: computer,
      create: computer,
    });
  }

  console.log("Seed completed successfully.");
  console.log("No sample auth user was seeded because authentication is managed by Supabase.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
