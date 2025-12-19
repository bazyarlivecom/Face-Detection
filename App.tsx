import React, { useState, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import AnalysisLog from './components/AnalysisLog';
import { CameraSourceType, DetectedPerson } from './types';
import { analyzeFrame } from './services/geminiService';

const App: React.FC = () => {
  const [sourceType, setSourceType] = useState<CameraSourceType>(CameraSourceType.WEBCAM);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  // اطلاعات دوربین شما
  const [dahuaIP, setDahuaIP] = useState('192.168.1.53');
  const [dahuaUser, setDahuaUser] = useState('admin');
  const [dahuaPass, setDahuaPass] = useState('84315308Reza');
  
  const [ipCameraUrl, setIpCameraUrl] = useState<string>(`http://${dahuaUser}:${dahuaPass}@${dahuaIP}:80/cgi-bin/mjpeg?subtype=1`);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPeople, setCurrentPeople] = useState<DetectedPerson[]>([]);
  const [history, setHistory] = useState<{ timestamp: string; count: number }[]>([]);

  useEffect(() => {
    // بررسی وجود کلید API در محیط Studio
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (sourceType === CameraSourceType.IP_CAMERA) {
      const newUrl = `http://${dahuaUser}:${dahuaPass}@${dahuaIP}:80/cgi-bin/mjpeg?subtype=1`;
      setIpCameraUrl(newUrl);
    }
  }, [dahuaIP, dahuaUser, dahuaPass, sourceType]);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleFrameCaptured = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const results = await analyzeFrame(base64);
      setCurrentPeople(results);
      setHistory(prev => [
        ...prev, 
        { timestamp: new Date().toISOString(), count: results.length }
      ]);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("خطا در آنالیز. لطفاً اتصال اینترنت و کلید API را بررسی کنید.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">اتصال به هوش مصنوعی</h2>
        <p className="text-slate-400 mb-8 max-w-sm">برای استفاده از قابلیت تشخیص چهره و آنالیز تصویر، باید کلید API گوگل را متصل کنید.</p>
        <button 
          onClick={handleOpenKeyDialog}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg"
        >
          انتخاب کلید API
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-6 text-xs text-slate-500 underline">مشاهده مستندات پرداخت و Billing</a>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <header className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white">Sentinel <span className="text-blue-500">Eye</span></h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
               <button 
                  onClick={() => setSourceType(CameraSourceType.WEBCAM)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sourceType === CameraSourceType.WEBCAM ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
               >
                  Webcam
               </button>
               <button 
                  onClick={() => setSourceType(CameraSourceType.IP_CAMERA)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sourceType === CameraSourceType.IP_CAMERA ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
               >
                  Dahua IP Cam
               </button>
           </div>
           
           {sourceType === CameraSourceType.IP_CAMERA && (
               <div className="flex items-center gap-2">
                 <input 
                    type="text"
                    value={dahuaIP}
                    onChange={(e) => setDahuaIP(e.target.value)}
                    placeholder="IP"
                    className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-[10px] w-28 text-slate-200 focus:border-blue-500 outline-none"
                 />
                 <input 
                    type="text"
                    value={dahuaUser}
                    onChange={(e) => setDahuaUser(e.target.value)}
                    placeholder="User"
                    className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-[10px] w-20 text-slate-200 focus:border-blue-500 outline-none"
                 />
                 <input 
                    type="password"
                    value={dahuaPass}
                    onChange={(e) => setDahuaPass(e.target.value)}
                    placeholder="Pass"
                    className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-[10px] w-20 text-slate-200 focus:border-blue-500 outline-none"
                 />
               </div>
           )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-950 relative">
          <div className="w-full max-w-5xl aspect-video relative">
             <CameraFeed 
                sourceType={sourceType}
                ipCameraUrl={ipCameraUrl}
                isAnalyzing={isAnalyzing}
                onFrameCaptured={handleFrameCaptured}
                detectedPeople={currentPeople}
                onSwitchToIP={() => setSourceType(CameraSourceType.IP_CAMERA)}
             />
             
             <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded text-xs font-mono text-white flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div>
                 {isAnalyzing ? 'در حال پردازش هوشمند' : 'آماده مانیتورینگ'}
             </div>
          </div>
        </div>

        <div className="w-80 h-full shrink-0">
          <AnalysisLog 
             currentPeople={currentPeople} 
             history={history}
          />
        </div>
      </main>
    </div>
  );
};

export default App;