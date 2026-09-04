import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-2">Country Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The country you are looking for does not exist in our database.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to PakVisa Advisor
        </Link>
      </div>
    </div>
  );
}
