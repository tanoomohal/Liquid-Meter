import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// Helper to clamp a value between a min and max
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

// --== SVG Icons ==--
const ApertureIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-80">
    <circle cx="12" cy="12" r="10"></circle><path d="m14.31 8 5.74 9.94"></path><path d="M9.69 8h11.48"></path><path d="m7.78 12 4.24-7.34"></path><path d="m14.31 16 5.74-9.94"></path><path d="M9.69 16H-1.79"></path><path d="m7.78 12-4.24 7.34"></path>
  </svg>
);
const ShutterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-80">
    <path d="M12 2v20"></path><path d="M18.36 5.64l-1.42 1.42"></path><path d="M5.64 18.36l1.42-1.42"></path><path d="M22 12h-4"></path><path d="M6 12H2"></path><path d="M18.36 18.36l-1.42-1.42"></path><path d="M5.64 5.64l1.42 1.42"></path>
  </svg>
);
const IsoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-80">
    <path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="m4.93 17.66 1.41-1.41"></path><path d="m17.66 4.93 1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle>
  </svg>
);
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
    </svg>
);
const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"></path>
    </svg>
);


// --== Data Constants ==--
const APERTURE_STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const SHUTTER_SPEEDS = [
    { value: 1/8000, label: "1/8000" }, { value: 1/4000, label: "1/4000" },
    { value: 1/2000, label: "1/2000" }, { value: 1/1000, label: "1/1000" },
    { value: 1/500, label: "1/500" }, { value: 1/250, label: "1/250" },
    { value: 1/125, label: "1/125" }, { value: 1/60, label: "1/60" },
    { value: 1/30, label: "1/30" }, { value: 1/15, label: "1/15" },
    { value: 1/8, label: "1/8" }, { value: 1/4, label: "1/4" },
    { value: 1/2, label: "1/2" }, { value: 1, label: "1s" },
    { value: 2, label: "2s" }, { value: 4, label: "4s" },
    { value: 8, label: "8s" }, { value: 15, label: "15s" },
    { value: 30, label: "30s" }
];
const ISO_STOPS = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];

// --== Custom Slider Component ==--
const LiquidSlider = ({ label, icon, value, onChange, displayValues }) => {
  const valueIndex = displayValues.findIndex(v => (v.value !== undefined ? v.value : v) === value);
  const displayLabel = displayValues[valueIndex]?.label || `ƒ/${value}` || value;

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between text-sm font-medium text-white/80 px-1">
        <div className="flex items-center gap-2">{icon}</div>
        <span className="font-bold text-lg text-white tabular-nums tracking-wider">{displayLabel}</span>
      </div>
      <input
        type="range"
        min={0}
        max={displayValues.length - 1}
        step={1}
        value={valueIndex}
        onChange={(e) => {
          const selectedValue = displayValues[parseInt(e.target.value, 10)];
          onChange(selectedValue.value !== undefined ? selectedValue.value : selectedValue);
        }}
        className="w-full h-2 bg-black/20 rounded-full appearance-none cursor-pointer liquid-slider"
      />
    </div>
  );
};

// --== Main App Component ==--
export default function App() {
  const [aperture, setAperture] = useState(APERTURE_STOPS[4]);
  const [shutterSpeed, setShutterSpeed] = useState(SHUTTER_SPEEDS[7].value);
  const [iso, setIso] = useState(ISO_STOPS[3]);
  const [lux, setLux] = useState(0);
  const [isCameraOn, setIsCameraOn].useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // State for Gemini feature
  const [geminiSuggestion, setGeminiSuggestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [geminiError, setGeminiError] = useState('');


  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraOn(true);
          setCameraError(null);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraError("Could not access camera. Please check permissions.");
        setIsCameraOn(false);
      }
    } else {
      setCameraError("Camera access is not supported by this browser.");
    }
  };
  
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    setIsCameraOn(false);
  }, []);

  const analyzeLight = useCallback(() => {
    if (!isCameraOn || !videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
        if(isCameraOn) animationFrameId.current = requestAnimationFrame(analyzeLight);
        return;
    };

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const sampleSize = 64;
    const sx = (video.videoWidth - sampleSize) / 2;
    const sy = (video.videoHeight - sampleSize) / 2;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(sx, sy, sampleSize, sampleSize).data;
    let totalBrightness = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      totalBrightness += 0.2126 * imageData[i] + 0.7152 * imageData[i+1] + 0.0722 * imageData[i+2];
    }
    const avgBrightness = totalBrightness / (imageData.length / 4);
    const estimatedLux = Math.pow(avgBrightness / 255, 2) * 10000 + 1;
    setLux(estimatedLux);

    animationFrameId.current = requestAnimationFrame(analyzeLight);
  }, [isCameraOn]);

  useEffect(() => {
    if (isCameraOn) {
      animationFrameId.current = requestAnimationFrame(analyzeLight);
    } else {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }
    return () => stopCamera();
  }, [isCameraOn, analyzeLight, stopCamera]);

  // Gemini API Call
  const getAiSuggestion = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
        setGeminiError("Camera not ready. Please try again.");
        return;
    }

    setIsGenerating(true);
    setGeminiSuggestion('');
    setGeminiError('');

    try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64ImageData = dataUrl.split(',')[1];

        const prompt = "You are a creative photography assistant. Analyze this scene and provide a concise, actionable suggestion for a compelling photograph. Focus on composition, mood, and potential camera settings. Keep your response under 50 words.";

        const payload = {
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/jpeg", data: base64ImageData } }
                ]
            }],
        };

        const apiKey = ""; // API key will be injected by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setGeminiSuggestion(text);
        } else {
            throw new Error("No suggestion received from the API.");
        }

    } catch (error) {
        console.error("Gemini API error:", error);
        setGeminiError("Could not get suggestion. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const exposureValue = useMemo(() => Math.log2((aperture * aperture) / shutterSpeed) - Math.log2(iso / 100), [aperture, shutterSpeed, iso]);
  const sceneEv = useMemo(() => lux <= 0 ? -Infinity : Math.log2(lux / 2.5), [lux]);
  const exposureDifference = useMemo(() => exposureValue - sceneEv, [exposureValue, sceneEv]);

  const exposureIndicator = useMemo(() => {
    if (!isCameraOn || sceneEv === -Infinity) return { label: "Metering Paused", color: "text-white/70", position: 50 };
    const diff = exposureDifference;
    if (diff > 0.3) return { label: "Overexposed", color: "text-yellow-300", position: clamp(50 + diff * 15, 50, 100) };
    if (diff < -0.3) return { label: "Underexposed", color: "text-blue-300", position: clamp(50 + diff * 15, 0, 50) };
    return { label: "Correct Exposure", color: "text-green-300", position: 50 };
  }, [isCameraOn, sceneEv, exposureDifference]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; overscroll-behavior: none; }
      `}</style>
      
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover bg-black -z-10"></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {isCameraOn && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/50 bg-white/10 rounded-lg pointer-events-none"></div>}

      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white">
        <h1 className="text-5xl font-bold text-white mb-8 text-shadow-lg">Liquid Glass Camera Controls</h1>
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
          
          <div className="relative glass-container p-6 md:p-8">
            <div className="absolute top-4 left-6 text-xs font-bold uppercase text-white/50 tracking-widest">Exposure Meter</div>
            <div className="flex flex-col space-y-6 pt-8">
              <LiquidSlider label="Aperture" icon={<ApertureIcon />} value={aperture} onChange={setAperture} displayValues={APERTURE_STOPS}/>
              <LiquidSlider label="Shutter" icon={<ShutterIcon />} value={shutterSpeed} onChange={setShutterSpeed} displayValues={SHUTTER_SPEEDS}/>
              <LiquidSlider label="ISO" icon={<IsoIcon />} value={iso} onChange={setIso} displayValues={ISO_STOPS}/>
            </div>
          </div>

          <div className="relative glass-container p-6">
             <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-center h-12">
                  <span className={`text-lg font-bold ${exposureIndicator.color} transition-colors duration-300`}>{exposureIndicator.label}</span>
                  {isCameraOn && <p className="text-sm text-white/60">Scene EV: {sceneEv.toFixed(2)}</p>}
                </div>
                <div className="w-full h-2 bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 rounded-full overflow-hidden relative">
                   <div className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg" style={{ left: `${exposureIndicator.position}%`, transition: 'left 0.3s ease-out' }}></div>
                </div>
                <div className="w-full flex justify-between text-xs text-white/50"><span>-2</span><span>-1</span><span>0</span><span>+1</span><span>+2</span></div>
             </div>
          </div>
          
          {/* Gemini AI Suggestion Panel */}
          <div className="glass-container p-4 flex flex-col items-center min-h-[100px] justify-center">
            {!geminiSuggestion && !isGenerating && !geminiError && (
                 <button onClick={getAiSuggestion} disabled={!isCameraOn || isGenerating} className="action-button bg-purple-500/50 hover:bg-purple-500/70 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center w-full max-w-xs shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                    <SparkleIcon />
                    ✨ Suggest a Shot
                </button>
            )}
            {isGenerating && <div className="text-white/80">Generating suggestion...</div>}
            {geminiError && <div className="text-red-400 text-center text-sm">{geminiError}</div>}
            {geminiSuggestion && (
                <div className="text-center">
                    <p className="text-white/90">{geminiSuggestion}</p>
                    <button onClick={() => setGeminiSuggestion('')} className="mt-3 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full">Clear</button>
                </div>
            )}
          </div>

          <div className="glass-container p-4 flex flex-col items-center">
            {!isCameraOn ? (
              <button onClick={startCamera} className="action-button bg-green-500/50 hover:bg-green-500/70 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center w-full max-w-xs shadow-lg">
                <CameraIcon />
                Start Live Metering
              </button>
            ) : (
               <button onClick={stopCamera} className="action-button bg-red-500/50 hover:bg-red-500/70 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center w-full max-w-xs shadow-lg">
                Stop Metering
              </button>
            )}
            {cameraError && <p className="text-red-400 text-center text-sm mt-4">{cameraError}</p>}
          </div>

        </div>
      </div>
    </>
  );
}
