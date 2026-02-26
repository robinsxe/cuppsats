import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const SECTIONS = [
  { slug: "inledning", title: "Inledning", sortOrder: 1 },
  { slug: "bakgrund", title: "Bakgrund / Tidigare forskning", sortOrder: 2 },
  { slug: "teoretisk-referensram", title: "Teoretisk referensram", sortOrder: 3 },
  { slug: "syfte-fragestallningar", title: "Syfte och frågeställningar", sortOrder: 4 },
  { slug: "metod", title: "Metod", sortOrder: 5 },
  { slug: "resultat", title: "Resultat", sortOrder: 6 },
  { slug: "analys", title: "Analys", sortOrder: 7 },
  { slug: "diskussion", title: "Diskussion", sortOrder: 8 },
  { slug: "slutsats", title: "Slutsats", sortOrder: 9 },
  { slug: "referenslista", title: "Referenslista", sortOrder: 10 },
];

async function main() {
  console.log("Seeding database...");

  const owner = await prisma.user.upsert({
    where: { email: "student@uppsats.se" },
    update: {},
    create: {
      name: "Student",
      email: "student@uppsats.se",
      hashedPassword: hashSync("student123", 10),
      role: "owner",
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "handledare@uppsats.se" },
    update: {},
    create: {
      name: "Handledare",
      email: "handledare@uppsats.se",
      hashedPassword: hashSync("handledare123", 10),
      role: "supervisor",
    },
  });

  console.log(`Created users: ${owner.name} (${owner.role}), ${supervisor.name} (${supervisor.role})`);

  for (const section of SECTIONS) {
    await prisma.section.upsert({
      where: { slug: section.slug },
      update: {},
      create: {
        slug: section.slug,
        title: section.title,
        sortOrder: section.sortOrder,
        status: "not_started",
        content: "",
      },
    });
  }

  console.log(`Created ${SECTIONS.length} thesis sections`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
