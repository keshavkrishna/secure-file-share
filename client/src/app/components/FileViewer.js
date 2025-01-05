import React from 'react';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <p>Loading PDF viewer...</p>
});

export const FileViewer = ({ blob, filename }) => {
  const fileType = filename.split('.').pop().toLowerCase();
  const url = URL.createObjectURL(blob);

  // Helper function to determine MIME type
  const getMimeType = (extension) => {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  };

  const renderContent = () => {
    const mimeType = getMimeType(fileType);

    // Images
    if (mimeType.startsWith('image/')) {
      return (
        <img 
          src={url} 
          alt={filename}
          className="max-w-full h-auto object-contain"
        />
      );
    }

    // PDFs
    // if (mimeType === 'application/pdf') {
    //   return (
    //     <iframe
    //       src={url}
    //       className="w-full h-full"
    //       title={filename}
    //     />
    //   );
    // }
    if (mimeType === 'application/pdf') {
      return <PDFViewer url={url} filename={filename} />;
    }
  

    // Office documents and other files
    const officePreviewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    if (mimeType.includes('officedocument') || mimeType.includes('msword') || mimeType.includes('ms-excel')) {
      return (
        <iframe
          src={officePreviewUrl}
          className="w-full h-full"
          title={filename}
        />
      );
    }

    // Text files
    if (mimeType.startsWith('text/')) {
      return (
        <iframe
          src={url}
          className="w-full h-full"
          title={filename}
        />
      );
    }

    // Fallback for unsupported types
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-600 mb-4">Preview not available for this file type</p>
        <a
          href={url}
          download={filename}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {renderContent()}
    </div>
  );
};

export default FileViewer;