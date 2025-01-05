import React, { useState, useEffect } from 'react';

const MessageDisplay = ({ message, type }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress <= 0) {
          clearInterval(timer);
          setIsVisible(false);
          return 0;
        }
        return prevProgress - 2; // Decrease by 2% every 100ms
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getProgressBarColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-300';
      case 'success':
        return 'bg-green-300';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full animate-slide-in-bottom">
      <div className={`rounded-lg shadow-lg p-4 pr-10 ${getTypeStyles()} relative overflow-hidden`}>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-1 text-white hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <p>{message}</p>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-white bg-opacity-30">
          <div 
            className={`h-full ${getProgressBarColor()} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default MessageDisplay;

