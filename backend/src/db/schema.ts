import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const campaignStatus = pgEnum('campaign_status', ['draft', 'published']);

export const admins = pgTable('admins', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text().notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: text().primaryKey(), // hash of the random token in the cookie
    adminId: integer('admin_id')
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_admin_id_idx').on(t.adminId)],
);

export const campaigns = pgTable('campaigns', {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  description: text().notNull().default(''),
  accentColor: text('accent_color').notNull().default('#FF7A00'),
  status: campaignStatus().notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const questions = pgTable(
  'questions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    text: text().notNull(),
    position: integer().notNull(),
  },
  (t) => [unique('questions_campaign_position_uq').on(t.campaignId, t.position)],
);

export const answerOptions = pgTable(
  'answer_options',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    text: text().notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    position: integer().notNull(),
  },
  (t) => [
    unique('answer_options_question_position_uq').on(t.questionId, t.position),
    // At most one correct option per question (the service makes sure there is exactly one)
    uniqueIndex('answer_options_one_correct_uq')
      .on(t.questionId)
      .where(sql`${t.isCorrect}`),
  ],
);

// uuid id: the id is used in a public URL, so it must not be guessable
export const submissions = pgTable(
  'submissions',
  {
    id: uuid().primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    score: integer().notNull(),
    total: integer().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('submissions_campaign_id_idx').on(t.campaignId)],
);

export const submissionAnswers = pgTable(
  'submission_answers',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    optionId: integer('option_id')
      .notNull()
      .references(() => answerOptions.id, { onDelete: 'cascade' }),
  },
  (t) => [unique('submission_answers_submission_question_uq').on(t.submissionId, t.questionId)],
);

export const leads = pgTable(
  'leads',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    submissionId: uuid('submission_id')
      .notNull()
      .unique()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    email: text().notNull(),
    consent: boolean().notNull(),
    consentText: text('consent_text').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('leads_consent_true_chk', sql`${t.consent} = true`),
    index('leads_campaign_id_idx').on(t.campaignId),
  ],
);
