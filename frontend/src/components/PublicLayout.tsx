'use client';

import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <PublicNavbar />
      <main className="flex-grow">{children}</main>
      <PublicFooter />
    </div>
  );
}
