import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-[64px] font-extrabold leading-none text-brand-600">404</p>
      <h1 className="mt-3 text-2xl">This page isn’t on our shelves</h1>
      <p className="mt-2 max-w-sm text-text-2">The link may be old or mistyped.</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-sm bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">Back to the shop</Link>
    </main>
  );
}
