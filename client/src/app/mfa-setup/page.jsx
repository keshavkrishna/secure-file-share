"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setupMFA, validateMFA } from "../lib/api"; // API functions to call backend endpoints

export default function MFASetup() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Use `useSearchParams` for query params
  const userId = localStorage.getItem("userId") // Retrieve userId from query params

  const [qrCode, setQrCode] = useState(null); // Store QR code as an image
  const [otp, setOtp] = useState(""); // Store user input for OTP
  const [error, setError] = useState(""); // Error messages
  const [success, setSuccess] = useState(false); // Track successful validation

  // Fetch QR Code on component mount
  useEffect(() => {
    async function fetchQrCode() {
      if (!userId) return; // Wait for the query param to load
      try {
        const response = await setupMFA(userId);
        setQrCode(response); // Set QR code as a base64 image
      } catch (err) {
        setError("Failed to fetch QR Code. Please try again.");
      }
    }

    fetchQrCode();
  }, [userId]);

  // Handle OTP form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous error

    try {
      await validateMFA(otp, userId); // Call the validation API
      setSuccess(true);
      router.push("/dashboard"); // Redirect to dashboard after successful MFA setup
    } catch (err) {
      setError(err.message || "Failed to validate OTP. Please try again.");
    }
  };

  if (success) {
    return <div>MFA setup successful! Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Set Up MFA</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {qrCode ? (
          <div className="mb-6">
            <p className="text-center text-gray-600 mb-4">
              Scan the QR code below with Google Authenticator:
            </p>
            <img
              src={qrCode}
              alt="TOTP QR Code"
              className="mx-auto border border-gray-300 rounded-lg"
            />
          </div>
        ) : (
          <div>Loading QR code...</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700"
            >
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter the OTP"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Validate OTP
          </button>
        </form>
      </div>
    </div>
  );
}
