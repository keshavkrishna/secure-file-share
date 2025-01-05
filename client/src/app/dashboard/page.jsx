

"use client";
import Overlay from "../components/Overlay";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listUserFiles } from "../lib/api";
import { FileViewer } from "@/app/components/FileViewer"
import MessageDisplay from "../components/MessageDisplay";
import Loading from "../components/Loading";


export default function Dashboard() {
  const router = useRouter();
  const [ownedFiles, setOwnedFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [error, setError] = useState("");
  const [viewFile, setViewFile] = useState(null); 
  const [message, setMessage] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const startLoading = (state) => {
    setIsLoading(state);
  };


  useEffect(() => {
    async function fetchData() {
      try {
        // startLoading(true)
        const { owned_files, shared_files } = await listUserFiles();
        setOwnedFiles(owned_files);
        setSharedFiles(shared_files);
        // startLoading(false)
      } catch (err) {
        // startLoading(false)
        showMessage(`Error fetching files: ${err}`, 'error')
      }
    }

    fetchData();
  }, []);

  const formatFileSize = (sizeInBytes) => {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  };

  const hasValidShareableLink = (file) => {
    if (!file.shareable_link || !file.expires_at) {
      return false;
    }
    const currentTime = new Date();
    const expirationTime = new Date(file.expires_at);
    return expirationTime > currentTime;
  };

  const formatDate = (isoDateString) => {
    return new Date(isoDateString).toLocaleDateString();
  };


  const closeOverlay = () => {
    setViewFile(null); // Close the overlay
  };


  const showMessage = (message, type) => {
    setMessage({ text: message, type });
    setTimeout(() => setMessage(null), 5000);
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* My Files Section */}
      <div>
        <h2 className="text-lg font-bold mb-4">Owned Files</h2>
        <div className="space-y-4">
          {ownedFiles.map((file) => (
            <div key={file.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    Uploaded on {formatDate(file.uploaded_at)} • {formatFileSize(file.size)}
                  </p>
                  {hasValidShareableLink(file) ? (
                    <div>
                      <p>
                        <strong>Shareable Link:</strong>{" "}
                        <a
                          href={file.shareable_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {file.shareable_link}
                        </a>
                      </p>
                      <p>
                        <strong>Expires At:</strong>{" "}
                        {new Date(file.expires_at).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-600">No valid shareable link available</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/dashboard/file/${file.id}`)}
                    className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                    aria-label="View file details"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shared with Me Section */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Shared with Me</h2>
        <div className="space-y-4">
          {sharedFiles.map((file) => (
            <div key={file.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    Shared on {formatDate(file.uploaded_at)} • {formatFileSize(file.size)}
                  </p>
                  <div>
                    <p>
                      <strong>Shareable Link:</strong>{" "}
                      <a
                        href={file.shareable_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`http://localhost:3000/dashboard/file/link/{file.shareable_link}`}
                      </a>
                    </p>
                    <p>
                      <strong>Expires At:</strong>{" "}
                      {new Date(file.expires_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                <div className="flex space-x-2">
                   <button
                     onClick={() => router.push(`/dashboard/file/${file.id}`)}
                     className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                   >
                     {">"}
                   </button> 
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {viewFile && (
              <Overlay title={viewFile.name} onClose={closeOverlay}>
                <FileViewer blob={viewFile.blob} filename={viewFile.name} />
              </Overlay>
            )}
      {message && <MessageDisplay message={message.text} type={message.type} />}
      <Loading
        isLoading={isLoading}
        size="lg"
        color="white"
        thickness={3}
        backdropColor="rgba(0, 0, 0, 0.7)"
      />
    </div>
  );
}

