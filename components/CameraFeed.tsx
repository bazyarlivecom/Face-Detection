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
            alert("خطا: تصویر دوربین لود نشده است. از منوی تنظیمات بالا آدرس و یوزر/پس را چک کنید.");
            return;
        }
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      }
      onFrameCaptured(canvas.toDataURL('image/jpeg', 0.9));
    } catch (e) {
      console.error(e);
      alert("خطای CORS! مرورگر اجازه تحلیل پیکسل‌های دوربین داهوا را نمی‌دهد. راه حل: افزونه 'Allow CORS: Access-Control-Allow-Origin' را در کروم نصب و فعال کنید.");
    }
  }, [onFrameCaptured, sourceType]);

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group">
      {sourceType === CameraSourceType.WEBCAM ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[20%] contrast-[110%]" />
      ) : (
        <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
            <img 
                ref={imageRef} 
                src={ipCameraUrl} 
                className="max-w-full max-h-full object-contain" 
                crossOrigin="anonymous" 
                onError={() => setStreamError(true)}
                onLoad={() => setStreamError(false)}
            />
            {streamError && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center z-10">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">عدم اتصال به دوربین داهوا</h3>
                    <div className="text-slate-400 text-xs space-y-3 max-w-sm leading-relaxed text-right" dir="rtl">
                        <p className="bg-white/5 p-3 rounded-xl border border-white/5">۱. افزونه <b>Allow CORS</b> را در کروم فعال کنید (آیکون C نارنجی شود).</p>
                        <p className="bg-white/5 p-3 rounded-xl border border-white/5">۲. در پنل داهوا: <code className="text-blue-400">Settings &gt; Camera &gt; Video &gt; Sub Stream</code> را روی <b>MJPEG</b> بگذارید.</p>
                        <p className="bg-white/5 p-3 rounded-xl border border-white/5 font-bold text-yellow-500">نکته: در صورت خطای ۵۰۲، مطمئن شوید IP و پورت صحیح است و دوربین روشن است.</p>
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
            <div key={person.id} className="absolute border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-500"
              style={{ top: `${ymin/10}%`, left: `${xmin/10}%`, width: `${(xmax-xmin)/10}%`, height: `${(ymax-ymin)/10}%` }}>
              <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[9px] px-2 py-0.5 font-bold rounded-t-sm uppercase tracking-tighter whitespace-nowrap">
                #{person.id} | {person.category}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-[-10px]">
        <button 
          onClick={captureFrame} 
          disabled={isAnalyzing || streamError} 
          className={`px-10 py-4 rounded-2xl font-bold shadow-2xl transition-all flex items-center gap-3 ${
            isAnalyzing || streamError ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white scale-105 active:scale-95'
          }`}
        >
          {isAnalyzing ? (
             <>
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               PROCESSING...
             </>
          ) : "ANALYZE CURRENT FRAME"}
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraFeed;