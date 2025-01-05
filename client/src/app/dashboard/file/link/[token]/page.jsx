'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { generateSharableLink, deleteSharableLink } from '@/app/lib/api';
import { downloadFile, fetchFileForView, fetchFileDetailsByToken, shareFile, deleteFile } from "../../../../lib/encrypt";
import Overlay from "../../../../components/Overlay";
import FileViewer from "../../../../components/FileViewer";
import MessageDisplay from '@/app/components/MessageDisplay';

export default function FileDetailPage({ params }) {
  const param = useParams();
  const router = useRouter();
  const [fileDetails, setFileDetails] = useState(null);
  const [error, setError] = useState('');
  const [viewFile, setViewFile] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const token = param.token;
        const data = await fetchFileDetailsByToken(token);
        setFileDetails(data);
      } catch (err) {
        showMessage(`Error fetching files: ${err.message}`, 'error')
      }
    }

    fetchDetails();
  }, []);


  const handleGenerateLink = async () => {
    setError("");
    try {
      const details = await generateSharableLink(fileDetails.file_id);
  
      setFileDetails((prevDetails) => ({
        ...prevDetails,
        shareable_links: [
          {
            token: details.token,
            created_at: details.created_at,
            expires_at: details.expires_at,
          },
        ],
      }));
    } catch (err) {
      // setError(`Failed to generate link: ${err.message}`);
      showMessage(`Failed to generate link: ${err.message}`, 'error')
    }
  };

  const  handleDeleteLink = async (token) => {
    try{
        const message = await deleteSharableLink(fileDetails.file_id, token);
        if (message === "Link Deleted Successfully")
        {
            setFileDetails((prevDetails) => ({
                ...prevDetails,
                shareable_links: [],
              }));
        }
            
    } catch (err) {
        // setError(`Failed to generate link: ${err.message}`);
        showMessage(`Failed to delete link: ${err.message}`, 'error')
    }
  }
  
  const handleViewFile = async () => {
    setError("");
    try {
      const { blob, name } = await fetchFileForView(fileDetails.file_id);
      setViewFile({ blob, name });
    } catch (err) {
      setError(err.message || "Failed to fetch file for viewing");
      showMessage(`Failed to fetch file for viewing: ${err.message}`, 'error')
    }
  };

  const handleDownloadFile = async () => {
    try {
      await downloadFile(fileDetails.file_id);
    } catch (err) {
      // setError(`Failed to download file: ${err.message}`);
      showMessage(`Failed to download file: ${err.message}`, 'error')

    }
  };

  const handleDeleteFile = async () => {
    try {
      await deleteFile(fileDetails.file_id);
      router.push('/dashboard')
    } catch (err) {
      // setError(`Failed to delete file: ${err.message}`);
      showMessage(`Failed to delete file: ${err.message}`, 'error')
    }
  };

  const closeOverlay = () => {
    setViewFile(null);
  };

  const hasValidShareableLink = () => {
    if (!fileDetails || !fileDetails.shareable_link || !fileDetails.expires_at) {
      return false;
    }
    const currentTime = new Date();
    const expirationTime = new Date(fileDetails.expires_at);
    return expirationTime > currentTime;
  };

  const handleShareClick = async () => {
    const username = document.getElementById('username').value
    const canDownload = !document.getElementById('viewOnly').checked

    if(username)
    {
        const response = await shareFile(fileDetails.file_id,username, canDownload);
        if(response.message !== 'Access updated successfully')
        {
          // setError(response.message)
          showMessage(`Failed to share file: ${response.message}`, 'error')
          return;
        }

        setFileDetails((prevDetails) => ({
          ...prevDetails,
          shared_with: [...prevDetails.shared_with, response.shared_with]
        }));
            

    }
  };

  const handleTogglePermission = async (username, permission, value) => {
    try {
      // Make an API call to update the permission
      await shareFile(fileDetails.file_id, username,  value);
      // Update the local state
      setFileDetails((prevDetails) => ({
        ...prevDetails,
        shared_with: prevDetails.shared_with.map((user) =>
          user.username === username ? { ...user, [permission]: value } : user
        ),
      }));
    } catch (err) {
      setError(`Failed to update permission: ${err.message}`);
      showMessage(`Failed to update permission: ${err.message}`, 'error')
    }
  };

  const handleRevokePermission = async (username) => {
    try {
      await revokeFileAccess(fileDetails.file_id, username);
      setFileDetails((prevDetails) => ({
        ...prevDetails,
        shared_with: prevDetails.shared_with.filter((user) => user.username !== username),
      }));
    } catch (err) {
      setError(`Failed to revoke permission: ${err.message}`);
      showMessage(`Failed to revoke permission:  ${err.message}`, 'error')
    }
  };
  
  

  const showMessage = (message, type) => {
    setMessage({ text: message, type });
    setTimeout(() => setMessage(null), 5000);
  };

  if (!fileDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

    {!fileDetails.is_owner || fileDetails.guest_user ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Details Section */}
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">File Details</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-gray-600 font-semibold w-1/4">Name:</span>
              <span className="text-gray-800">{fileDetails.name}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 font-semibold w-1/4">Size:</span>
              <span className="text-gray-800">{fileDetails.size} bytes</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 font-semibold w-1/4">Owner:</span>
              <span className="text-gray-800">{fileDetails.owner}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 font-semibold w-1/4">Uploaded At:</span>
              <span className="text-gray-800">{new Date(fileDetails.uploaded_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-8 px-10 flex space-x-4 justify-between">
                <button
                onClick={handleViewFile}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    View File
                </button>
                <button
                onClick={handleDownloadFile}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                    Download
                </button>
                {fileDetails.is_owner && (<button
                onClick={handleDeleteFile}
                className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                    Delete
                </button>)}
            </div>
        </div>
      </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Details Section */}
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-2">File Details</h2>
            <div className="space-y-4">
                <div className="flex items-center">
                <span className="text-gray-600 font-semibold w-1/4">Name:</span>
                <span className="text-gray-800">{fileDetails.name}</span>
                </div>
                <div className="flex items-center">
                <span className="text-gray-600 font-semibold w-1/4">Size:</span>
                <span className="text-gray-800">{fileDetails.size} bytes</span>
                </div>
                <div className="flex items-center">
                <span className="text-gray-600 font-semibold w-1/4">Owner:</span>
                <span className="text-gray-800">{fileDetails.owner}</span>
                </div>
                <div className="flex items-center">
                <span className="text-gray-600 font-semibold w-1/4">Uploaded At:</span>
                <span className="text-gray-800">{new Date(fileDetails.uploaded_at).toLocaleString()}</span>
                </div>
            </div>
            <div className="mt-8 px-10 flex space-x-4 justify-between">
                <button
                onClick={handleViewFile}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    View File
                </button>
                <button
                onClick={handleDownloadFile}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                    Download
                </button>
                {fileDetails.is_owner && (<button
                onClick={handleDeleteFile}
                className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                    Delete
                </button>)}
            </div>
        </div>



        {/* Sharing Section */}
        <div id="sharing" className="bg-white shadow-lg rounded-lg p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Sharing</h2>
                <div className="flex items-center space-x-4">
                
                {!hasValidShareableLink() && (
                    <button
                        onClick={handleGenerateLink}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition duration-300 ease-in-out mb-2"
                    >
                        Generate New Link
                    </button>
                )}
                </div>
            </div>
            
            {/** share with  */}
            
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Share with:</h3>
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Username"
                        className="w-full sm:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <input
                        id="viewOnly"
                        name="viewOnly"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="viewOnly" className="ml-2 text-sm text-gray-900">
                            view only
                        </label>
                    </div>
                    <button
                        type="submit"
                        onClick={handleShareClick}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Share
                    </button>
                    </div>
                </div>
            </div>

            {fileDetails.shareable_links && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Shareable Links:</h3>
                    <ul className="space-y-4">
                        {fileDetails.shareable_links.map((link, index) => (
                        <li
                            key={index}
                            className="bg-gray-50 p-4 rounded-md shadow-sm relative flex flex-col space-y-2"
                        >
                            {/* Delete Icon */}
                            <button
                            onClick={() => handleDeleteLink(link.token)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            title="Delete Link"
                            >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                >
                                <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 011-1h2a1 1 0 011 1v1h3a1 1 0 110 2h-1v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5H4a1 1 0 010-2h3V2zm1 1v1h4V3h-4zM7 7a1 1 0 012 0v7a1 1 0 11-2 0V7zm4 0a1 1 0 012 0v7a1 1 0 11-2 0V7z"
                                    clipRule="evenodd"
                                />
                                </svg>

                            </button>

                            {/* Link Details */}
                            <p className="text-sm text-gray-600">
                            <a href="http://localhost:3000/dashboard/file/link/${link.token}"><span className="font-medium">Link:</span> {`http://localhost:3000/dashboard/file/link/${link.token}`}</a>
                            </p>
                            <p className="text-sm text-gray-600">
                            <span className="font-medium">Created:</span>{" "}
                            {new Date(link.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                            <span className="font-medium">Expires:</span>{" "}
                            {new Date(link.expires_at).toLocaleString()}
                            </p>
                        </li>
                        ))}
                    </ul>
                    </div>
            )}
            </div>
      </div>
)}
      
        {fileDetails.shared_with && (
            <div className="bg-gray-100 rounded-lg p-4 shadow-md">
            <div className="mb-4">
            <h3 className="text-xl font-semibold mb-3">Shared With</h3>
            <ul className="space-y-3">
                {fileDetails.shared_with.map((user, index) => (
                <li
                    key={index}
                    className="bg-white rounded-md shadow p-3 flex justify-between items-center border border-gray-200"
                >
                    {/* Username */}
                    <div>
                    <p className="text-sm font-medium text-gray-800">Username: {user.username}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                    {/* Toggle Allow Download */}
                    <div className="flex items-center space-x-1">
                        <label
                            htmlFor={`toggle-download-${index}`}
                            className="text-sm text-gray-600"
                        >
                            Allow Download:
                        </label>
                        <input
                            type="checkbox"
                            id={`toggle-download-${index}`}
                            checked={user.can_download}
                            onChange={() =>
                                handleTogglePermission(user.username, "can_download", !user.can_download)
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                    </div>

                    {/* Revoke Permission Button */}
                    <button
                        onClick={() => handleRevokePermission(user.username)}
                        className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
                    >
                        Revoke
                    </button>
                    </div>
                </li>
                ))}
            </ul>
            </div>
            </div>
        )}
    

    
      <button 
        onClick={() => router.push('/dashboard')} 
        className="mt-6 bg-blue-600 mx-auto text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Back to Dashboard
      </button>

      {viewFile && (
        <Overlay title={viewFile.name} onClose={closeOverlay}>
          <FileViewer blob={viewFile.blob} filename={viewFile.name} />
        </Overlay>
      )}
    </div>
  );
}
