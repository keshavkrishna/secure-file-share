'use client'; // Declare this as a Client Component

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Welcome to File Sharing App</h1>
      <div className="flex space-x-4">
        <button
          onClick={() => router.push('/signin')}
          className="px-6 py-3 bg-blue-600 text-white text-lg rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Signin
        </button>
        <button
          onClick={() => router.push('/signup')}
          className="px-6 py-3 bg-green-600 text-white text-lg rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          Signup
        </button>
      </div>
    </div>
  );
}
