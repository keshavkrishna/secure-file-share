"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateMFA } from '../lib/api';

export default function TwoFactorAuth() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous error
  
    try {
      const userId = localStorage.getItem("userId")
      const result = await validateMFA(pin, userId); // Call the validation API
      if(localStorage.getItem("role")==='Admin')
        router.push("/dashboard/admin");
      else
      router.push("/dashboard"); // Redirect to dashboard after successful MFA setup
    } catch (err) {
      setError(err.message || "Failed to validate OTP. Please try again.");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Two-Factor Authentication
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-center text-2xl tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="000000"
            />
          </div>

          <button
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}