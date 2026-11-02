import 'dotenv/config';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { admins, answerOptions, campaigns, questions } from './schema.js';

const DEMO_SLUG = 'wellbeing-basics';

// General knowledge questions only. We never ask about the visitor's own health.
const DEMO_QUESTIONS = [
  {
    text: 'Which of these is a common way to support your general wellbeing?',
    options: [
      { text: 'Regular sleep, movement and time with other people', isCorrect: true },
      { text: 'Skipping meals to save time', isCorrect: false },
      { text: 'Avoiding all social contact', isCorrect: false },
    ],
  },
  {
    text: 'What does "mental health awareness" mean?',
    options: [
      { text: 'Knowing that mental health matters and talking about it openly', isCorrect: true },
      { text: 'Diagnosing other people', isCorrect: false },
      { text: 'Keeping the topic secret', isCorrect: false },
      { text: 'Only a topic for doctors', isCorrect: false },
    ],
  },
  {
    text: 'If a friend says they feel low, what is a helpful first step?',
    options: [
      { text: 'Listen without judging and show that you care', isCorrect: true },
      { text: 'Tell them to just cheer up', isCorrect: false },
      { text: 'Change the subject', isCorrect: false },
    ],
  },
];

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in backend/.env');
  }

  const [existing] = await db.select().from(admins).where(eq(admins.email, email));
  if (existing) {
    console.log(`Admin ${email} already exists, skipping`);
    return;
  }

  await db.insert(admins).values({ email, passwordHash: await argon2.hash(password) });
  console.log(`Created admin ${email}`);
}

async function seedCampaign() {
  const [existing] = await db.select().from(campaigns).where(eq(campaigns.slug, DEMO_SLUG));
  if (existing) {
    console.log(`Campaign "${DEMO_SLUG}" already exists, skipping`);
    return;
  }

  await db.transaction(async (tx) => {
    const [campaign] = await tx
      .insert(campaigns)
      .values({
        slug: DEMO_SLUG,
        title: 'Wellbeing basics',
        description: 'A short quiz about general wellbeing and mental health awareness.',
        accentColor: '#FF7A00',
        status: 'published',
      })
      .returning();

    for (const [qIndex, q] of DEMO_QUESTIONS.entries()) {
      const [question] = await tx
        .insert(questions)
        .values({ campaignId: campaign.id, text: q.text, position: qIndex + 1 })
        .returning();

      await tx.insert(answerOptions).values(
        q.options.map((o, oIndex) => ({
          questionId: question.id,
          text: o.text,
          isCorrect: o.isCorrect,
          position: oIndex + 1,
        })),
      );
    }
  });
  console.log(`Created campaign "${DEMO_SLUG}" with ${DEMO_QUESTIONS.length} questions`);
}

try {
  await seedAdmin();
  await seedCampaign();
} finally {
  await pool.end();
}
