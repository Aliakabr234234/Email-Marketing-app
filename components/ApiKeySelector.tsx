
import React, { useState, useEffect } from 'react';

interface ApiKeySelectorProps {
  onValidated: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onValidated }) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const hasKey = await window.aistudio?.hasSelectedApiKey();
      if (hasKey) {
        onValidated();
      } else {
        setChecking(false);
      }
    };
    checkKey();
  }, [onValidated]);

  const handleOpenSelector = async () => {
    // @ts-ignore
    await window.aistudio?.openSelectKey();
    // After selection, proceed assuming success per guidelines
    onValidated();
  };

  if (checking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-key text-indigo-600 text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select your Gemini API Key</h2>
        <p className="text-gray-600 mb-6">
          To generate high-resolution (1K, 2K, 4K) visuals, you must select a valid API key from a paid GCP project.
          <br />
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            Learn about billing →
          </a>
        </p>
        <button
          onClick={handleOpenSelector}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-200"
        >
          Select API Key
        </button>
      </div>
    </div>
  );
};

export default ApiKeySelector;
