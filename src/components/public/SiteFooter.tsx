import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} IREWIN. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/jobs" className="hover:text-foreground">Browse Jobs</Link>
          <Link href="/categories" className="hover:text-foreground">Categories</Link>
        </div>
      </div>
    </footer>
  );
}
