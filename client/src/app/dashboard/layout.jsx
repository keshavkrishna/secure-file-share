"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { validateToken, logoutUser } from "../lib/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await validateToken();
        if (!response.user) {
          router.push("/signin"); // Redirect to signin if not authenticated
        } else {
          setUserDetails(response.user); // Store user details
        }
      } catch (error) {
        console.error("Authentication failed:", error.message);
        router.push("/signin");
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await logoutUser();

      if (response.message === "Logged out successfully") {
        router.push("/signin");
      } else {
        console.error("Failed to log out");
      }
    } catch (err) {
      console.error("Error during logout:", err.message);
    }
  };

  const handleEnableMFA = () => {
    router.push(`/mfa-setup?userId=${userDetails.id}`);
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="text-xl font-bold text-gray-900">FileSecure</div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/dashboard/upload-file")}
                  disabled={userDetails && userDetails.role !== "Regular User"}
                  className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                    userDetails && userDetails.role !== "Regular User"
                      ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  }`}
                  title={
                    userDetails && userDetails.role !== "Regular User"
                      ? "You don't have permission to upload files. Ask your administrator for access."
                      : ""
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Add New File</span>
                </button>
                {userDetails && !userDetails.is_mfa_enabled && (
                  <button
                    onClick={handleEnableMFA}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex items-center space-x-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a7 7 0 100 14A7 7 0 109 2zm0 12a5 5 0 110-10 5 5 0 010 10zm1-5a1 1 0 10-2 0v2a1 1 0 002 0V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Enable MFA</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L8.414 10l2.293 2.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
