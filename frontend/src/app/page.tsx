import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="font-serif text-4xl font-semibold">MindQuiz</h1>
      <p className="text-lg">Short quizzes that help people learn something new.</p>
      <Link
        href="/admin/login"
        className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-lg font-bold text-white shadow-md"
      >
        Admin login
      </Link>
    </main>
  );
}
