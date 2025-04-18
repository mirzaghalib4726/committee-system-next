import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Hero Section */}
      <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Welcome to the Committee System
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Manage your committee members, track contributions, and handle payments
          with ease. Stay organized and efficient!
        </p>
        <Link
          href="/users"
          className="inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          View Members
        </Link>
      </div>
    </div>
  );
}