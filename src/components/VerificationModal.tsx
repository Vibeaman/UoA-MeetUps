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
import { supabaseService } from '../services/supabaseService';

export const VerificationModal: React.FC = () => {
  const {
    isVerificationModalOpen,
    setIsVerificationModalOpen,
    currentUser,
    submitVerification,
  } = useApp();

  const [step, setStep] = useState<'camera' | 'preview' | 'success'>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedSelfieFile, setCapturedSelfieFile] = useState<File | null>(null);
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [studentIdPreview, setStudentIdPreview] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      setVerificationError('Camera capture is unavailable. Choose a real selfie from your gallery instead.');
    }
    setIsCapturing(false);
  };

  const handleGallerySelfie = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setVerificationError('Please choose an image file for your selfie.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setVerificationError('Images must be smaller than 10 MB.');
      return;
    }

    setVerificationError('');
    setCapturedSelfieFile(file);
    setCapturedPhoto(URL.createObjectURL(file));
    stopCamera();
    setStep('preview');
  };

  const handleStudentIdFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setVerificationError('Please choose an image file for your student ID.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setVerificationError('Images must be smaller than 10 MB.');
      return;
    }

    setVerificationError('');
    setStudentIdFile(file);
    setStudentIdPreview(URL.createObjectURL(file));
  };

  const dataUrlToFile = async (dataUrl: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], 'verification-selfie.jpg', { type: blob.type || 'image/jpeg' });
  };

  const handleConfirmSubmit = async () => {
    if (!capturedPhoto || isUploading) return;
    setVerificationError('');
    setIsUploading(true);

    try {
      let selfieUrl = capturedPhoto;
      if (capturedSelfieFile) {
        const upload = await supabaseService.uploadUserMedia(capturedSelfieFile, currentUser.id, 'verification');
        if (!upload.url) throw new Error(upload.error || 'Could not upload your selfie.');
        selfieUrl = upload.url;
      } else if (capturedPhoto.startsWith('data:')) {
        const selfieFile = await dataUrlToFile(capturedPhoto);
        const upload = await supabaseService.uploadUserMedia(selfieFile, currentUser.id, 'verification');
        if (!upload.url) throw new Error(upload.error || 'Could not upload your selfie.');
        selfieUrl = upload.url;
      }

      let studentIdUrl: string | undefined;
      if (studentIdFile) {
        const upload = await supabaseService.uploadUserMedia(studentIdFile, currentUser.id, 'verification');
        if (!upload.url) throw new Error(upload.error || 'Could not upload your student ID.');
        studentIdUrl = upload.url;
      }

      const submitted = await submitVerification(selfieUrl, studentIdUrl);
      if (!submitted) throw new Error('Verification could not be submitted. Please try again.');
      setStep('success');
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : 'Could not submit verification photos.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isVerificationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0e051a] border border-orange-800/50 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden text-center flex flex-col">
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
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-500/50 text-orange-300 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
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
            <div className="relative w-full h-72 sm:h-80 bg-black rounded-2xl overflow-hidden border-2 border-orange-600/60 flex items-center justify-center">
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
                  <Camera className="w-10 h-10 text-orange-400 mx-auto opacity-70" />
                  <p className="text-xs text-neutral-300">
                    Live camera stream unavailable in this browser. Use the gallery upload button below to choose a real selfie.
                  </p>
                </div>
              )}

              {/* Oval Face Alignment Frame overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-56 border-2 border-dashed border-orange-400/80 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-orange-300 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
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
                className="p-4 rounded-full bg-gradient-to-r from-orange-600 to-orange-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 transition-all"
                id="take-selfie-shutter-btn"
                title="Capture Selfie"
              >
                <Camera className="w-6 h-6" />
              </button>
              <label htmlFor="verification-selfie-upload" className="p-4 rounded-full bg-white/10 border border-orange-500/50 text-orange-200 hover:bg-orange-900/40 cursor-pointer transition-all" title="Choose selfie from gallery">
                <Upload className="w-6 h-6" />
                <input
                  id="verification-selfie-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleGallerySelfie}
                  className="sr-only"
                />
              </label>
            </div>
            {verificationError && <p className="text-[11px] font-semibold text-rose-300">{verificationError}</p>}
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

            <div className="relative w-full h-72 rounded-2xl overflow-hidden border-2 border-orange-500 bg-black">
              {capturedPhoto && (
                <img src={capturedPhoto} alt="captured" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="rounded-2xl border border-orange-800/50 bg-orange-950/20 p-3 text-left space-y-2">
              <p className="text-[11px] font-bold text-orange-200">Student ID photo (optional)</p>
              <label htmlFor="student-id-upload" className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-orange-800/70 text-[11px] text-orange-200 cursor-pointer hover:border-orange-400">
                <Upload className="w-4 h-4" />
                {studentIdFile ? studentIdFile.name : 'Choose from gallery'}
                <input
                  id="student-id-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleStudentIdFile}
                  className="sr-only"
                />
              </label>
              {studentIdPreview && <img src={studentIdPreview} alt="Student ID preview" className="w-full h-24 rounded-xl object-cover" />}
            </div>
            {verificationError && <p className="text-[11px] font-semibold text-rose-300">{verificationError}</p>}

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStep('camera')}
                disabled={isUploading}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-semibold flex items-center justify-center space-x-1.5"
              >
                <RotateCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>

              <button
                onClick={handleConfirmSubmit}
                disabled={isUploading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-900/50 hover:brightness-110 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                id="submit-verification-confirm-btn"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Submit to Admin'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBMITTED SUCCESS */}
        {step === 'success' && (
          <div className="py-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-orange-900/60 border-2 border-orange-400 text-orange-300 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(168,85,247,0.5)] animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-orange-300" />
            </div>

            <h3 className="text-2xl font-black font-display text-white">
              Verification Submitted!
            </h3>
            <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
              Your live selfie and UniAbuja identity details are now queued for review in the Admin Console. You will receive your official <strong>Verified Student</strong> badge shortly!
            </p>

            <button
              onClick={() => setIsVerificationModalOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-600 text-white font-bold text-xs shadow-md"
            >
              Done & Return to Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
