"use client";

import { useState } from "react";
import { uploadFile } from "@/app/lib/encrypt";
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError("");
    setSuccess("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setSelectedFile(e.dataTransfer.files[0]);
    setError("");
    setSuccess("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      const response = await uploadFile(selectedFile);
      setSuccess(`File uploaded successfully`);
      setSelectedFile(null); // Reset file input
      router.push('/dashboard')
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Upload File</h1>
      <div
        className="border-dashed border-2 border-gray-400 rounded-lg w-full max-w-md p-6 bg-white flex flex-col items-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          onChange={handleFileChange}
        />
        <label
          htmlFor="fileInput"
          className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
        >
          Browse File
        </label>
        <p className="text-gray-500 mt-2">or drag and drop your file here</p>
      </div>

      {selectedFile && (
        <p className="mt-4 text-gray-700">
          Selected File: <span className="font-semibold">{selectedFile.name}</span>
        </p>
      )}

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {success && <p className="mt-4 text-green-600">{success}</p>}

      <button
        onClick={handleSubmit}
        className="mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
      >
        Upload
      </button>
    </div>
  );
}
