import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraSourceType, DetectedPerson } from '../types';

interface CameraFeedProps {
  sourceType: CameraSourceType;
  ipCameraUrl: string;
  isAnalyzing: boolean;
  onFrameCaptured: (base64: string) => void;
  detectedPeople: DetectedPerson[];
  onSwitchToIP: () => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ 
  sourceType, 
  ipCameraUrl, 
  isAnalyzing, 
  onFrameCaptured,
  detectedPeople,
  onSwitchToIP
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const startWebcam = useCallback(async () => {
    setStreamError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setStreamError(true);
    }
  }, []);

  useEffect(() => {
    if (sourceType === CameraSourceType.WEBCAM) startWebcam();
  }, [sourceType, startWebcam]);

  const captureFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      if (sourceType === CameraSourceType.WEBCAM) {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
      } else {
        const img = imageRef.current;
        if (!img || img.naturalWidth === 0) {
            alert("خطا: تصویر دوربین داهوا هنوز لود نشده است. لطفاً تنظیمات IP و یوزرنیم را چک کنید.");
            return;
        }
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      }
      onFrameCaptured(canvas.toDataURL('image/jpeg', 0.9));
    } catch (e) {
      console.error(e);
      alert("خطای CORS! مرورگر اجازه تحلیل تصویر را نمی‌دهد. راه حل: افزونه 'Allow CORS' را فعال کنید و صفحه را رفرش کنید.");
    }
  }, [onFrameCaptured, sourceType]);

  const triggerRefresh = () => {
    setRefreshCounter(prev => prev + 1);
    setStreamError(false);
  };

  return (
    <div className="relative w-full h-full bg-black rounded-[2rem] overflow-hidden border border-white/10 group shadow-[0_0_80px_rgba(0,0,0,0.6)]">
      {sourceType === CameraSourceType.WEBCAM ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[10%]" />
      ) : (
        <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
            <img 
                key={`${ipCameraUrl}-${refreshCounter}`}
                ref={imageRef} 
                src={`${ipCameraUrl}&refresh=${refreshCounter}`} 
                className="max-w-full max-h-full object-contain" 
                crossOrigin="anonymous" 
                onError={() => setStreamError(true)}
                onLoad={() => setStreamError(false)}
            />
            {streamError && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center z-10" dir="rtl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">خطای عدم دسترسی (401 Unauthorized)</h3>
                    <div className="text-slate-400 text-xs space-y-4 max-w-md text-right leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/5 shadow-2xl">
                        <p>۱. حتماً در تب دیگر مرورگر آدرس دوربین را باز کرده و یکبار لاگین کنید تا سشن فعال شود.</p>
                        <p>۲. در تنظیمات داهوا به مسیر <code className="text-blue-400">Settings &gt; System &gt; Safety &gt; System Service</code> بروید و تیک <b>CGI</b> را بزنید.</p>
                        <p>۳. <b>Authentication Type</b> را روی حالت <b>Digest/Basic</b> قرار دهید.</p>
                        <p className="text-yellow-500 font-bold pt-2 border-t border-white/5">۴. آدرس فعلی جهت تست در تب جدید:</p>
                        <a href={ipCameraUrl} target="_blank" className="block p-2 bg-black/40 rounded font-mono text-[10px] text-blue-300 break-all text-left" dir="ltr">{ipCameraUrl}</a>
                        <button onClick={triggerRefresh} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold w-full transition-all shadow-lg shadow-blue-600/20 active:scale-95">تلاش مجدد برای اتصال</button>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Drawing Bounding Boxes */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {detectedPeople.map((person) => {
          const [ymin, xmin, ymax, xmax] = person.boundingBox;
          return (
            <div key={person.id} className="absolute border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-700 ease-out"
              style={{ top: `${ymin/10}%`, left: `${xmin/10}%`, width: `${(xmax-xmin)/10}%`, height: `${(ymax-ymin)/10}%` }}>
              <div className="absolute -top-7 left-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 font-bold rounded-t-md uppercase tracking-tighter whitespace-nowrap shadow-lg">
                ID#{person.id} | {person.category}
              </div>
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white"></div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-[-10px]">
        <button 
          onClick={captureFrame} 
          disabled={isAnalyzing || streamError} 
          className={`px-12 py-4 rounded-2xl font-black text-sm tracking-widest shadow-2xl transition-all flex items-center gap-4 ${
            isAnalyzing || streamError ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95'
          }`}
        >
          {isAnalyzing ? (
             <>
               <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
               PROCCESSING AI...
             </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
              CAPTURE & ANALYZE
            </>
          )}
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraFeed;