import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center animate-fade-in">
      <div className="text-8xl font-bold gradient-text mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
      <p className="text-[hsl(220,12%,52%)] mb-8">
        The reservation or page you&apos;re looking for doesn&apos;t exist or has expired.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-blue-500 text-white font-semibold hover:from-brand-400 hover:to-blue-400 transition-all duration-200 shadow-lg hover:shadow-brand-500/30"
      >
        ← Back to Products
      </Link>
    </div>
  );
}
