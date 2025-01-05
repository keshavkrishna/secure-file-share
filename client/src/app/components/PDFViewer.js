import React, { useState, useEffect } from 'react';

const PDFViewer = ({ url, filename }) => {
  const [PDFComponent, setPDFComponent] = useState(null);

  useEffect(() => {
    import('react-pdf').then(({ Document, Page, pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      
      const PDFComponent = ({ url }) => {
        const [numPages, setNumPages] = useState(null);
        const [pageNumber, setPageNumber] = useState(1);

        function onDocumentLoadSuccess({ numPages }) {
          setNumPages(numPages);
        }

        return (
          <div className="pdf-viewer">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              options={{
                cMapUrl: 'cmaps/',
                cMapPacked: true,
              }}
            >
              <Page pageNumber={pageNumber} />
            </Document>
            <div className="pdf-controls mt-4 flex justify-between items-center">
              <button
                onClick={() => setPageNumber(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                Previous
              </button>
              <p>
                Page {pageNumber} of {numPages}
              </p>
              <button
                onClick={() => setPageNumber(pageNumber + 1)}
                disabled={pageNumber >= numPages}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        );
      };

      setPDFComponent(() => PDFComponent);
    });
  }, []);

  if (!PDFComponent) {
    return <div>Loading PDF viewer...</div>;
  }

  return <PDFComponent url={url} />;
};

export default PDFViewer;

