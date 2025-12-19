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
  const [refreshKey, setRefreshKey] = useState(0);

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
            alert("تصویر لود نشده است. لطفاً آدرس IP و یوزرنیم/پسورد را در بالا چک کنید.");
            return;
        }
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      }
      onFrameCaptured(canvas.toDataURL('image/jpeg', 0.9));
    } catch (e) {
      console.error(e);
      alert("خطای CORS! مرورگر اجازه دسترسی به پیکسل‌های دوربین را نمی‌دهد. راه حل: افزونه 'Allow CORS' را در کروم فعال کنید.");
    }
  }, [onFrameCaptured, sourceType]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setStreamError(false);
  };

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden border border-white/10 group shadow-2xl">
      {sourceType === CameraSourceType.WEBCAM ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
            <img 
                key={refreshKey}
                ref={imageRef} 
                src={`${ipCameraUrl}&refresh=${refreshKey}`} 
                className="max-w-full max-h-full object-contain" 
                crossOrigin="anonymous" 
                onError={() => setStreamError(true)}
                onLoad={() => setStreamError(false)}
            />
            {streamError && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-10" dir="rtl">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">خطای احراز هویت یا شبکه (۴۰۱)</h3>
                    <div className="text-slate-400 text-[11px] space-y-3 max-w-md text-right leading-relaxed">
                        <p className="bg-white/5 p-3 rounded-lg border border-white/5 font-mono text-left" dir="ltr">ERR_401: Unauthorized access</p>
                        <p>۱. اگر از یوزر و پسورد مطمئن هستید، در پنل دوربین داهوا به قسمت <code className="text-blue-400">Security &gt; System Service</code> بروید و تیک <b>CGI</b> را بزنید و نوع آن را <b>Basic/Digest</b> قرار دهید.</p>
                        <p>۲. برای حل مشکل <b>CORS</b>، افزونه مربوطه را در مرورگر فعال کنید.</p>
                        <button onClick={handleRefresh} className="mt-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-xs font-bold w-full transition-colors">تلاش مجدد برای اتصال</button>
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
            <div key={person.id} className="absolute border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              style={{ top: `${ymin/10}%`, left: `${xmin/10}%`, width: `${(xmax-xmin)/10}%`, height: `${(ymax-ymin)/10}%` }}>
              <div className="absolute -top-5 left-0 bg-blue-600 text-white text-[8px] px-1 font-bold">
                #{person.id} {person.category}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button 
          onClick={captureFrame} 
          disabled={isAnalyzing || streamError} 
          className={`px-8 py-3 rounded-xl font-bold shadow-2xl transition-all ${
            isAnalyzing || streamError ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isAnalyzing ? "PROCCESSING..." : "ANALYZE NOW"}
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraFeed;