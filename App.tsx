
import React, { useState } from 'react';
import { ImageSize, AspectRatio, EmailCampaign, GenerationState } from './types';
import { generateCampaignCopy, generateCampaignImage } from './geminiService';
import ApiKeySelector from './components/ApiKeySelector';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [status, setStatus] = useState<GenerationState>({
    isGeneratingCopy: false,
    isGeneratingImage: false,
    error: null
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus({ isGeneratingCopy: true, isGeneratingImage: false, error: null });
    setCampaign(null);

    try {
      // Step 1: Generate Copy
      const copyData = await generateCampaignCopy(prompt);
      const newCampaign: EmailCampaign = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        ...copyData
      };
      setCampaign(newCampaign);
      setStatus({ isGeneratingCopy: false, isGeneratingImage: true, error: null });

      // Step 2: Generate Visual using Pro model
      try {
        const imageUrl = await generateCampaignImage(newCampaign.visualPrompt, imageSize, aspectRatio);
        setCampaign(prev => prev ? { ...prev, imageUrl } : null);
        setStatus(prev => ({ ...prev, isGeneratingImage: false }));
      } catch (imgError: any) {
        console.error("Image generation failed:", imgError);
        setStatus(prev => ({ 
          ...prev, 
          isGeneratingImage: false, 
          error: imgError.message.includes('not found') ? 'API Key error. Resetting key...' : 'Failed to generate image. Please try again.'
        }));
        if (imgError.message.includes('not found')) {
            setHasKey(false);
        }
      }
    } catch (copyError: any) {
      console.error("Campaign generation failed:", copyError);
      setStatus({ 
        isGeneratingCopy: false, 
        isGeneratingImage: false, 
        error: 'Failed to generate campaign structure. Please check your prompt.' 
      });
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {!hasKey && <ApiKeySelector onValidated={() => setHasKey(true)} />}
      
      {/* Header */}
      <nav className="glass-panel sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            CampaignGenie
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#" className="text-indigo-600">Campaigns</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Templates</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Analytics</a>
        </div>
        <button 
          onClick={() => { /* reset */ }}
          className="text-gray-500 hover:text-red-500"
        >
          <i className="fa-solid fa-trash-can"></i>
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Input Panel */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-pen-nib text-indigo-500"></i>
              Campaign Concept
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What are you promoting?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A summer sale for a premium coffee subscription box..."
                  className="w-full h-32 p-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Visual Settings
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as ImageSize)}
                    className="p-2 rounded-lg bg-gray-50 border-gray-100 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1K">1K Resolution</option>
                    <option value="2K">2K Resolution</option>
                    <option value="4K">4K Resolution</option>
                  </select>
                  <select 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="p-2 rounded-lg bg-gray-50 border-gray-100 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="16:9">Wide (16:9)</option>
                    <option value="1:1">Square (1:1)</option>
                    <option value="4:3">Photo (4:3)</option>
                    <option value="9:16">Tall (9:16)</option>
                  </select>
                </div>
              </div>

              <button
                disabled={status.isGeneratingCopy || status.isGeneratingImage}
                onClick={handleGenerate}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  status.isGeneratingCopy || status.isGeneratingImage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                }`}
              >
                {status.isGeneratingCopy ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    Thinking...
                  </>
                ) : status.isGeneratingImage ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    Generating Visual...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bolt"></i>
                    Generate Campaign
                  </>
                )}
              </button>

              {status.error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex gap-2 items-center">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {status.error}
                </div>
              )}
            </div>
          </section>

          <section className="bg-indigo-900 rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Campaign Tips</h3>
              <p className="text-indigo-200 text-sm leading-relaxed">
                Be specific about your audience and the action you want them to take. 
                "A discount for returning customers" works better than "A sale".
              </p>
            </div>
            <i className="fa-solid fa-lightbulb absolute -right-4 -bottom-4 text-8xl text-indigo-800 opacity-50"></i>
          </section>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8">
          {!campaign && !status.isGeneratingCopy && !status.isGeneratingImage ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                <i className="fa-solid fa-envelope-open-text text-gray-300 text-3xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-400 mb-2">No Campaign Drafted</h2>
              <p className="text-gray-400 max-w-sm">Enter a prompt on the left to start generating your high-conversion email marketing assets.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {campaign?.title || 'Drafting...'}
                </h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Export Assets
                  </button>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    Save Campaign
                  </button>
                </div>
              </div>

              {/* Subject Lines Display */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Subject Line Variants</h3>
                <div className="space-y-3">
                  {campaign?.subjectLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-indigo-50 transition-colors">
                      <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-indigo-500 group-hover:border-indigo-200">
                        {idx + 1}
                      </span>
                      <p className="text-gray-700 font-medium flex-1">{line}</p>
                      <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600">
                        <i className="fa-regular fa-copy"></i>
                      </button>
                    </div>
                  )) || [1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-xl" />
                  ))}
                </div>
              </div>

              {/* Email Canvas */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl email-canvas">
                <div className="bg-gray-50 border-b p-4 flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 bg-white border rounded-lg px-3 py-1.5 text-xs text-gray-400 flex justify-between">
                    <span>{campaign?.previewText || 'Loading preview text...'}</span>
                    <i className="fa-solid fa-lock text-[10px]"></i>
                  </div>
                </div>

                <div className="p-8 md:p-12 space-y-8 max-w-2xl mx-auto">
                   {/* Visual Image */}
                   <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video relative group">
                      {status.isGeneratingImage ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm z-10">
                          <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 text-4xl animate-bounce mb-4"></i>
                          <p className="text-indigo-600 font-bold animate-pulse">Designing Visual Asset...</p>
                        </div>
                      ) : null}
                      
                      {campaign?.imageUrl ? (
                        <>
                          <img 
                            src={campaign.imageUrl} 
                            alt="Campaign Visual" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {imageSize} RESOLUTION
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <i className="fa-regular fa-image text-5xl"></i>
                        </div>
                      )}
                   </div>

                   {/* Email Body */}
                   <div className="prose prose-indigo max-w-none text-gray-700">
                     {campaign?.bodyHtml ? (
                       <div dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }} />
                     ) : (
                       <div className="space-y-4">
                         <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                         <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                         <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
                         <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
                       </div>
                     )}
                   </div>

                   {/* Call to Action Button Placeholder */}
                   {campaign && (
                     <div className="pt-8 text-center">
                       <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-indigo-100 transition-all">
                         Learn More
                       </button>
                       <p className="mt-8 text-xs text-gray-400">
                         © 2024 CampaignGenie. All rights reserved. <br />
                         You are receiving this because you subscribed to our amazing updates.
                       </p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Chatbot overlay */}
      <ChatBot />
    </div>
  );
};

export default App;
