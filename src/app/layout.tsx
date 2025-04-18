import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Committee System',
  description: 'A web app to manage committee members, contributions, and payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navigation Bar */}
        <nav className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              Committee System
            </Link>
            <div className="space-x-4">
              <Link href="/" className="hover:text-blue-200">
                Home
              </Link>
              <Link href="/users" className="hover:text-blue-200">
                Users
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}