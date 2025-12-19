import React, { useState, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import AnalysisLog from './components/AnalysisLog';
import { CameraSourceType, DetectedPerson } from './types';
import { analyzeFrame } from './services/geminiService';

const App: React.FC = () => {
  const [sourceType, setSourceType] = useState<CameraSourceType>(CameraSourceType.WEBCAM);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [useSnapshot, setUseSnapshot] = useState<boolean>(true);
  
  const [dahuaIP, setDahuaIP] = useState('192.168.1.53');
  const [dahuaUser, setDahuaUser] = useState('admin');
  const [dahuaPass, setDahuaPass] = useState('84315308Reza');
  
  const [ipCameraUrl, setIpCameraUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPeople, setCurrentPeople] = useState<DetectedPerson[]>([]);
  const [history, setHistory] = useState<{ timestamp: string; count: number }[]>([]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    // اصلاح بسیار مهم: استفاده از ? به جای & برای اولین پارامتر
    // فرمت snapshot.cgi?loginuse=admin&loginpas=pass در داهوا بسیار پایدار است
    const endpoint = useSnapshot ? 'snapshot.cgi' : 'mjpeg?subtype=1';
    const baseUrl = `http://${dahuaIP}/cgi-bin/${endpoint}`;
    
    // برخی داهواها از user/pwd و برخی از loginuse/loginpas استفاده می‌کنند
    const params = `user=${dahuaUser}&pwd=${dahuaPass}`;
    setIpCameraUrl(`${baseUrl}?${params}&t=${Date.now()}`);
  }, [dahuaIP, dahuaUser, dahuaPass, useSnapshot]);

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
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 font-sans">فعالسازی سیستم هوشمند</h2>
        <button onClick={handleOpenKeyDialog} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl font-bold transition-all">اتصال به Gemini</button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <header className="h-24 flex items-center justify-between px-6 bg-slate-900/80 border-b border-white/5 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight">Sentinel <span className="text-blue-500">Eye</span></h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">AI Surveillance Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-2">
                <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 shadow-inner">
                    <button onClick={() => setSourceType(CameraSourceType.WEBCAM)} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${sourceType === CameraSourceType.WEBCAM ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Webcam</button>
                    <button onClick={() => setSourceType(CameraSourceType.IP_CAMERA)} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${sourceType === CameraSourceType.IP_CAMERA ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Dahua Camera</button>
                </div>
                {sourceType === CameraSourceType.IP_CAMERA && (
                   <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                        <button onClick={() => setUseSnapshot(true)} className={`px-3 py-1 text-[9px] font-bold rounded-md border ${useSnapshot ? 'bg-slate-700 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-600'}`}>Snapshot Mode</button>
                        <button onClick={() => setUseSnapshot(false)} className={`px-3 py-1 text-[9px] font-bold rounded-md border ${!useSnapshot ? 'bg-slate-700 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-600'}`}>Stream Mode</button>
                   </div>
                )}
            </div>
            
            {sourceType === CameraSourceType.IP_CAMERA && (
               <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                 <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-bold ml-1 uppercase">IP Address</span>
                    <input type="text" value={dahuaIP} onChange={(e) => setDahuaIP(e.target.value)} className="bg-slate-800 border border-white/10 rounded-md px-2 py-1.5 text-xs w-32 focus:border-blue-500 outline-none text-blue-400 font-mono" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-bold ml-1 uppercase">User</span>
                    <input type="text" value={dahuaUser} onChange={(e) => setDahuaUser(e.target.value)} className="bg-slate-800 border border-white/10 rounded-md px-2 py-1.5 text-xs w-24 focus:border-blue-500 outline-none" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 font-bold ml-1 uppercase">Password</span>
                    <input type="password" value={dahuaPass} onChange={(e) => setDahuaPass(e.target.value)} className="bg-slate-800 border border-white/10 rounded-md px-2 py-1.5 text-xs w-32 focus:border-blue-500 outline-none" />
                 </div>
               </div>
            )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          
          <div className="w-full max-w-5xl aspect-video relative z-10">
             <CameraFeed 
                sourceType={sourceType}
                ipCameraUrl={ipCameraUrl}
                isAnalyzing={isAnalyzing}
                onFrameCaptured={handleFrameCaptured}
                detectedPeople={currentPeople}
                onSwitchToIP={() => setSourceType(CameraSourceType.IP_CAMERA)}
             />
          </div>
        </div>
        <div className="w-[400px] h-full shrink-0 shadow-2xl z-20">
          <AnalysisLog currentPeople={currentPeople} history={history} />
        </div>
      </main>
    </div>
  );
};

export default App;