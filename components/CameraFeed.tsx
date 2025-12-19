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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isSampleMode, setIsSampleMode] = useState(false);

  const SAMPLE_IMAGE_URL = "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=1200";

  const startWebcam = useCallback(async () => {
    setStreamError(null);
    setIsSampleMode(false);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access.");
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
      
      if (!hasVideoDevice) {
        throw new Error("No physical camera detected. If you are using a Dahua IP camera, please switch to 'IP Cam' mode above.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
      } catch (innerErr) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Webcam init error:", err);
      setStreamError(err.message || "Failed to initialize camera.");
    }
  }, []);

  useEffect(() => {
    setStreamError(null); // Reset error when switching sources
    if (sourceType === CameraSourceType.WEBCAM) {
      startWebcam();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [sourceType, startWebcam]);

  const captureFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isSampleMode) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = SAMPLE_IMAGE_URL;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        onFrameCaptured(canvas.toDataURL('image/jpeg', 0.8));
      };
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (sourceType === CameraSourceType.WEBCAM) {
      if (video.videoWidth === 0) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    } else {
      const img = video as unknown as HTMLImageElement;
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
    }

    try {
      ctx.drawImage(video as any, 0, 0, canvas.width, canvas.height);
      onFrameCaptured(canvas.toDataURL('image/jpeg', 0.8));
    } catch (e: any) {
      alert(`Capture failed: ${e.message}. For Dahua cameras, ensure you are using the HTTP port (80) and MJPEG is enabled.`);
    }
  }, [onFrameCaptured, sourceType, isSampleMode]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 group">
      {isSampleMode ? (
        <img src={SAMPLE_IMAGE_URL} className="w-full h-full object-cover" alt="Sample" />
      ) : sourceType === CameraSourceType.WEBCAM ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <img 
          ref={videoRef as any} 
          src={ipCameraUrl} 
          className="w-full h-full object-cover" 
          crossOrigin="anonymous" 
          onError={() => setStreamError("Cannot reach Dahua camera. Check IP/Port and MJPEG settings.")}
          onLoad={() => setStreamError(null)}
        />
      )}

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {detectedPeople.map((person) => {
          const [ymin, xmin, ymax, xmax] = person.boundingBox;
          return (
            <div 
              key={person.id}
              className={`absolute border-2 transition-all duration-300 ${
                person.category.toLowerCase().includes('staff') ? 'border-green-500' : 'border-blue-500'
              }`}
              style={{ top: `${ymin/10}%`, left: `${xmin/10}%`, width: `${(xmax-xmin)/10}%`, height: `${(ymax-ymin)/10}%` }}
            >
              <div className="absolute -top-6 left-0 bg-black/70 text-white text-[10px] px-1 py-0.5 font-mono">
                #{person.id} {person.category}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={captureFrame} 
          disabled={isAnalyzing || (!!streamError && !isSampleMode)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-xl flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Frame"}
        </button>
      </div>

      {streamError && !isSampleMode && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <div className="text-red-500 font-bold mb-2 uppercase tracking-widest text-sm">Connection Issue</div>
            <p className="text-slate-400 text-sm mb-6">{streamError}</p>
            <div className="flex flex-col gap-3">
              {sourceType === CameraSourceType.WEBCAM && (
                <button onClick={onSwitchToIP} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold transition-all">
                  Switch to IP Camera (Dahua)
                </button>
              )}
              <button onClick={() => setIsSampleMode(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs transition-colors">
                Try Demo Mode (Sample Image)
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraFeed;