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
  const [streamError, setStreamError] = useState<string | null>(null);

  const startWebcam = useCallback(async () => {
    setStreamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setStreamError("خطا در وب‌کم. دسترسی به دوربین را چک کنید.");
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
            alert("تصویر دوربین لود نشده است. ابتدا مشکل CORS یا ۴۰۱ را حل کنید.");
            return;
        }
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      }
      onFrameCaptured(canvas.toDataURL('image/jpeg', 0.8));
    } catch (e) {
      console.error(e);
      alert("خطای امنیتی مرورگر (CORS)! حتماً افزونه Allow CORS را نصب و فعال کنید تا مرورگر اجازه پردازش تصویر داهوا را بدهد.");
    }
  }, [onFrameCaptured, sourceType]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 group">
      {sourceType === CameraSourceType.WEBCAM ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full relative">
            <img 
                ref={imageRef} 
                src={ipCameraUrl} 
                className="w-full h-full object-contain" 
                crossOrigin="anonymous" 
                onError={() => setStreamError("خطای دسترسی: ۴۰۱ یا CORS")}
                onLoad={() => setStreamError(null)}
            />
            {streamError && (
                <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
                    <p className="text-red-500 font-bold mb-4">ارتباط با داهوا برقرار نشد (خطای {streamError})</p>
                    <div className="text-slate-400 text-xs space-y-2 max-w-sm">
                        <p>۱. افزونه <b>Allow CORS</b> را در کروم فعال کنید.</p>
                        <p>۲. در پنل داهوا، استریم دوم را روی <b>MJPEG</b> قرار دهید.</p>
                        <p>۳. یوزرنیم و پسورد را در هدر چک کنید.</p>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Drawing Bounding Boxes */}
      <div className="absolute inset-0 pointer-events-none">
        {detectedPeople.map((person) => {
          const [ymin, xmin, ymax, xmax] = person.boundingBox;
          return (
            <div key={person.id} className="absolute border-2 border-blue-500"
              style={{ top: `${ymin/10}%`, left: `${xmin/10}%`, width: `${(xmax-xmin)/10}%`, height: `${(ymax-ymin)/10}%` }}>
              <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1 font-mono">#{person.id} {person.category}</div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={captureFrame} disabled={isAnalyzing} className="bg-blue-600 text-white px-8 py-2 rounded-full font-bold shadow-xl">
          {isAnalyzing ? "در حال آنالیز..." : "آنالیز تصویر"}
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraFeed;