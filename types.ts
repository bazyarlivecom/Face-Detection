export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectedPerson {
  id: number;
  category: string;
  description: string;
  confidence: number;
  boundingBox: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
}

export interface AnalysisSession {
  timestamp: string;
  people: DetectedPerson[];
  imageUrl: string; // Base64 or Blob URL of the analyzed frame
}

export enum CameraSourceType {
  WEBCAM = 'WEBCAM',
  IP_CAMERA = 'IP_CAMERA' // Simulated via MJPEG URL or periodic fetch
}