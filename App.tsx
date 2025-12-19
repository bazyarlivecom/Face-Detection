import React, { useState, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import AnalysisLog from './components/AnalysisLog';
import { CameraSourceType, DetectedPerson } from './types';
import { analyzeFrame } from './services/geminiService';

const App: React.FC = () => {
  const [sourceType, setSourceType] = useState<CameraSourceType>(CameraSourceType.WEBCAM);
  const [ipCameraUrl, setIpCameraUrl] = useState<string>('http://admin:admin12345@192.168.1.108:80/cgi-bin/mjpeg?subtype=1');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPeople, setCurrentPeople] = useState<DetectedPerson[]>([]);
  const [history, setHistory] = useState<{ timestamp: string; count: number }[]>([]);

  // Dahua URL Builder States
  const [dahuaIP, setDahuaIP] = useState('192.168.1.108');
  const [dahuaUser, setDahuaUser] = useState('admin');
  const [dahuaPass, setDahuaPass] = useState('admin12345');

  useEffect(() => {
    if (sourceType === CameraSourceType.IP_CAMERA) {
      const newUrl = `http://${dahuaUser}:${dahuaPass}@${dahuaIP}:80/cgi-bin/mjpeg?subtype=1`;
      setIpCameraUrl(newUrl);
    }
  }, [dahuaIP, dahuaUser, dahuaPass, sourceType]);

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
      alert("Analysis failed. Ensure the camera stream is accessible and your API key is correct.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
                    placeholder="IP Address"
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
                 {isAnalyzing ? 'AI ANALYZING' : 'READY'}
             </div>

             {sourceType === CameraSourceType.IP_CAMERA && (
               <div className="absolute top-4 right-4 max-w-xs bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-700 text-[10px] text-slate-400 shadow-2xl">
                 <p className="font-bold text-blue-400 mb-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Dahua Setup Guide:
                 </p>
                 <ul className="list-disc ml-3 space-y-1">
                   <li>Using <b>HTTP Port 80</b> (as shown in your image).</li>
                   <li>Format generated: <code className="text-white/80">{ipCameraUrl.substring(0, 20)}...</code></li>
                   <li><b>Important:</b> In Dahua settings, enable <b>MJPEG</b> for Sub Stream 1.</li>
                   <li>If blocked, ensure your camera allows CORS or use a browser CORS proxy extension.</li>
                 </ul>
               </div>
             )}
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