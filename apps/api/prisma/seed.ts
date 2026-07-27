import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { PLANT_SPECIES, PEST_LIBRARY } from '@jardimja/knowledge-base';

const prisma = new PrismaClient();

/**
 * Seeds a realistic dev dataset: an admin, sample clients & verified gardeners,
 * the knowledge base (species + pests), and per-city pricing config. Idempotent
 * via upserts, so it is safe to re-run.
 */
async function main(): Promise<void> {
  const password = await argon2.hash('senha1234');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@jardimja.com.br' },
    update: {},
    create: { name: 'Admin JardimJá', email: 'admin@jardimja.com.br', role: 'ADMIN', passwordHash: password, emailVerified: true },
  });

  const client = await prisma.user.upsert({
    where: { email: 'cliente@exemplo.com' },
    update: {},
    create: { name: 'Marina Cliente', email: 'cliente@exemplo.com', role: 'CLIENT', passwordHash: password, emailVerified: true },
  });

  const gardenerUser = await prisma.user.upsert({
    where: { email: 'jardineiro@exemplo.com' },
    update: {},
    create: { name: 'João Jardineiro', email: 'jardineiro@exemplo.com', role: 'GARDENER', passwordHash: password, emailVerified: true },
  });

  await prisma.gardenerProfile.upsert({
    where: { userId: gardenerUser.id },
    update: {},
    create: {
      userId: gardenerUser.id,
      cpfCnpj: '123.456.789-00',
      city: 'São Paulo',
      state: 'SP',
      baseLat: -23.5617,
      baseLng: -46.6559,
      serviceRadiusKm: 20,
      status: 'ACTIVE',
      verifiedAt: new Date(),
      specialties: ['CORTE_GRAMA', 'PODA', 'RETIRADA_FOLHAS', 'PAISAGISMO'],
      equipment: ['ROCADEIRA', 'CORTADOR_GRAMA', 'SOPRADOR', 'MOTOSSERRA'],
      crewSize: 2,
      minPriceCents: 10000,
      hourlyRateCents: 5000,
      ratingAvg: 4.8,
      ratingCount: 27,
      jobsCompleted: 27,
    },
  });

  // Pricing config override for São Paulo.
  await prisma.pricingConfig.upsert({
    where: { city_state: { city: 'São Paulo', state: 'SP' } },
    update: {},
    create: { city: 'São Paulo', state: 'SP', overrides: { baseHourlyRate: 50 } },
  });

  // Knowledge base.
  for (const s of PLANT_SPECIES) {
    await prisma.plantSpecies.upsert({
      where: { scientificName: s.scientificName },
      update: {},
      create: {
        scientificName: s.scientificName,
        commonNames: s.commonNames,
        category: s.category,
        careJson: s.care,
        pests: s.pests,
      },
    });
  }
  for (const p of PEST_LIBRARY) {
    await prisma.pest.upsert({
      where: { name: p.name },
      update: {},
      create: {
        name: p.name,
        scientificName: p.scientificName,
        affects: p.affects,
        symptomsJson: p.symptoms,
        treatmentJson: p.treatment,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('🌱 Seed concluído:', {
    admin: admin.email,
    client: client.email,
    gardener: gardenerUser.email,
    species: PLANT_SPECIES.length,
    pests: PEST_LIBRARY.length,
    login: 'senha1234',
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
