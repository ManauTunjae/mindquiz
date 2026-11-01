import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const heading = Fraunces({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'MindQuiz',
  description: 'Practice quiz app for non-profit organisations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${heading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
