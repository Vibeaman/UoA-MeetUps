import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Camera,
  RotateCw,
  CheckCircle2,
  Sparkles,
  Upload,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VerificationModal: React.FC = () => {
  const {
    isVerificationModalOpen,
    setIsVerificationModalOpen,
    currentUser,
    submitVerification,
  } = useApp();

  const [step, setStep] = useState<'camera' | 'preview' | 'success'>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sample verified selfie fallback if camera not allowed in iframe
  const sampleSelfieOptions = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  ];

  useEffect(() => {
    if (isVerificationModalOpen && step === 'camera') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isVerificationModalOpen, step]);

  const startCamera = async () => {
    try {
      setHasCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access prevented or not available:', err);
      setHasCameraError(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const takeSelfie = () => {
    setIsCapturing(true);
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
        stopCamera();
        setStep('preview');
      }
    } else {
      // Fallback
      setCapturedPhoto(sampleSelfieOptions[0]);
      setStep('preview');
    }
    setIsCapturing(false);
  };

  const handleSelectPresetSelfie = (url: string) => {
    setCapturedPhoto(url);
    stopCamera();
    setStep('preview');
  };

  const handleConfirmSubmit = () => {
    if (!capturedPhoto) return;
    submitVerification(
      capturedPhoto,
      'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80'
    );
    setStep('success');
  };

  if (!isVerificationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0e051a] border border-purple-800/50 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden text-center flex flex-col">
        {/* Floating Close */}
        <button
          onClick={() => {
            stopCamera();
            setIsVerificationModalOpen(false);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-neutral-300 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* STEP 1: CAMERA STREAM */}
        {step === 'camera' && (
          <div className="space-y-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>UniAbuja Live Photo Check</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                Take a Quick Verification Selfie
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Position your face inside the oval frame to earn your official verified student badge.
              </p>
            </div>

            {/* Video Feed / Fallback Container */}
            <div className="relative w-full h-72 sm:h-80 bg-black rounded-2xl overflow-hidden border-2 border-purple-600/60 flex items-center justify-center">
              {!hasCameraError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="p-4 text-center space-y-3">
                  <Camera className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
                  <p className="text-xs text-neutral-300">
                    Live camera stream unavailable in current browser frame. Choose a photo to verify:
                  </p>
                  <div className="flex justify-center gap-2">
                    {sampleSelfieOptions.map((opt, i) => (
                      <img
                        key={i}
                        src={opt}
                        alt="option"
                        onClick={() => handleSelectPresetSelfie(opt)}
                        className="w-14 h-14 rounded-full object-cover border-2 border-purple-500 cursor-pointer hover:scale-110 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Oval Face Alignment Frame overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-56 border-2 border-dashed border-purple-400/80 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-purple-300 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    Align Face Here
                  </span>
                </div>
              </div>
            </div>

            {/* Shutter Button */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={takeSelfie}
                disabled={isCapturing}
                className="p-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 transition-all"
                id="take-selfie-shutter-btn"
                title="Capture Selfie"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW CAPTURED SELFIE */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold font-display text-white">Review Your Live Selfie</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Ensure your face is clear, well-lit, and matches your UniAbuja student profile photo.
              </p>
            </div>

            <div className="relative w-full h-72 rounded-2xl overflow-hidden border-2 border-purple-500 bg-black">
              {capturedPhoto && (
                <img src={capturedPhoto} alt="captured" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStep('camera')}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-semibold flex items-center justify-center space-x-1.5"
              >
                <RotateCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>

              <button
                onClick={handleConfirmSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold shadow-lg shadow-purple-900/50 hover:brightness-110 flex items-center justify-center space-x-1.5"
                id="submit-verification-confirm-btn"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit to Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBMITTED SUCCESS */}
        {step === 'success' && (
          <div className="py-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-purple-900/60 border-2 border-purple-400 text-purple-300 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(168,85,247,0.5)] animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-purple-300" />
            </div>

            <h3 className="text-2xl font-black font-display text-white">
              Verification Submitted!
            </h3>
            <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
              Your live selfie and UniAbuja matric status are now queued for review in the Admin Console. You will receive your official <strong>🛡️ Verified Student</strong> badge shortly!
            </p>

            <button
              onClick={() => setIsVerificationModalOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-xs shadow-md"
            >
              Done & Return to Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
