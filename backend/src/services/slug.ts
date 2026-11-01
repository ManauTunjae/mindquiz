import { randomBytes } from 'node:crypto';

// "Wellbeing basics!" -> "wellbeing-basics". Accents are removed ("Café" -> "cafe").
export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');

  return slug || 'campaign';
}

// Used when a slug is already taken: "wellbeing-basics-a1b2c3"
export function withRandomSuffix(slug: string): string {
  return `${slug}-${randomBytes(3).toString('hex')}`;
}
