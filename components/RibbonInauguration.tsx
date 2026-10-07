'use client';

import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playRibbonCutSound, playClickSound, playCelebrationSound } from '@/lib/audio';
import { Sparkles, Scissors, CheckCircle, Star } from 'lucide-react';

interface RibbonInaugurationProps {
  onComplete?: () => void;
}

export const RibbonInauguration: React.FC<RibbonInaugurationProps> = ({ onComplete }) => {
  // Stages: 'PROMPT' | 'PLAYING' | 'REVEALED' | 'FINISHED'
  const [stage, setStage] = useState<'PROMPT' | 'PLAYING' | 'REVEALED' | 'FINISHED'>('PROMPT');
  const [logoPopped, setLogoPopped] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const cutTriggeredRef = useRef(false);

  // Real-time Canvas / WebGL Green Screen Chroma Keying Loop
  useEffect(() => {
    if (stage !== 'PLAYING') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;
    let useWebGL = false;

    try {
      gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
      if (gl) {
        // Vertex Shader
        const vsSource = `
          attribute vec2 a_position;
          attribute vec2 a_texCoord;
          varying vec2 v_texCoord;
          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
          }
        `;

        // Fragment Shader with Zero-Artifact Green Removal and Despill
        const fsSource = `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;

          void main() {
            vec4 color = texture2D(u_image, v_texCoord);
            
            float maxRB = max(color.r, color.b);
            float greenDiff = color.g - maxRB;
            
            // Ultra-clean Chroma Key: Discard all green pixels completely (zero shadow / zero box artifact)
            if (color.g > 0.22 && (color.g > color.r * 1.08 || color.g > color.b * 1.08) && greenDiff > 0.015) {
              discard;
            }
            if (color.g > 0.38 && color.r < 0.70 && color.b < 0.70) {
              discard;
            }

            // Green despill on non-discarded pixels (red satin ribbon, gold scissors)
            vec3 despilled = color.rgb;
            if (despilled.g > maxRB) {
              despilled.g = maxRB;
            }

            gl_FragColor = vec4(despilled, color.a);
          }
        `;

        const createShader = (glCtx: WebGLRenderingContext, type: number, source: string) => {
          const shader = glCtx.createShader(type);
          if (!shader) return null;
          glCtx.shaderSource(shader, source);
          glCtx.compileShader(shader);
          return shader;
        };

        const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
        if (vs && fs) {
          program = gl.createProgram();
          if (program) {
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
            gl.useProgram(program);

            // Buffer setup
            const posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([
                -1, -1,  1, -1, -1,  1,
                -1,  1,  1, -1,  1,  1,
              ]),
              gl.STATIC_DRAW
            );

            const posLocation = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(posLocation);
            gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

            const texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            // Flip Y for standard video orientation
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([
                0, 1,  1, 1,  0, 0,
                0, 0,  1, 1,  1, 0,
              ]),
              gl.STATIC_DRAW
            );

            const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
            gl.enableVertexAttribArray(texCoordLocation);
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

            texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            useWebGL = true;
          }
        }
      }
    } catch (e) {
      useWebGL = false;
    }

    if (!useWebGL) {
      ctx2d = canvas.getContext('2d', { willReadFrequently: true });
    }

    // Render loop
    const renderFrame = () => {
      if (!video || video.paused || video.ended) {
        if (stage === 'PLAYING') {
          animFrameIdRef.current = requestAnimationFrame(renderFrame);
        }
        return;
      }

      const w = video.videoWidth || 1920;
      const h = video.videoHeight || 1080;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      // =========================================================================
      // SYNCHRONIZED CUT MOMENT (~1.35s in video)
      // Exactly when ribbon cuts & opens:
      // 1. Immediately pop up the logo with radiant glow & motion (NO DELAY!)
      // 2. Fire celebratory confetti burst & royal fanfare
      // =========================================================================
      if (video.currentTime >= 1.35 && !cutTriggeredRef.current) {
        cutTriggeredRef.current = true;
        setLogoPopped(true);

        try {
          playRibbonCutSound();
          
          // Primary Gold & Electric Blue Flakes
          confetti({
            particleCount: 140,
            spread: 100,
            origin: { y: 0.5, x: 0.5 },
            colors: ['#00C8FF', '#FFD700', '#F4B400', '#FFFFFF', '#C41E3A', '#FFE57F'],
            startVelocity: 58,
            scalar: 1.3,
            zIndex: 99999,
          });

          // Secondary Golden Sparkle Cascade
          setTimeout(() => {
            confetti({
              particleCount: 95,
              spread: 160,
              origin: { y: 0.48, x: 0.5 },
              colors: ['#FFE57F', '#F4B400', '#FFFFFF', '#00E5FF', '#E50914'],
              startVelocity: 42,
              decay: 0.92,
              scalar: 0.95,
              zIndex: 99999,
            });
          }, 160);
        } catch (err) {}
      }

      if (useWebGL && gl && texture && program) {
        gl.viewport(0, 0, w, h);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (ctx2d) {
        // Fast 2D Canvas Fallback
        ctx2d.drawImage(video, 0, 0, w, h);
        try {
          const frame = ctx2d.getImageData(0, 0, w, h);
          const data = frame.data;
          const len = data.length;
          for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const maxRB = Math.max(r, b);
            // Green screen clean zeroing
            if (g > 55 && (g > r * 1.08 || g > b * 1.08) && (g - maxRB) > 4) {
              data[i + 3] = 0;
            } else if (g > 95 && r < 175 && b < 175 && g > maxRB) {
              data[i + 3] = 0;
            } else {
              // Despill
              if (g > maxRB) {
                data[i + 1] = maxRB;
              }
            }
          }
          ctx2d.putImageData(frame, 0, 0);
        } catch (e) {}
      }

      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [stage]);

  const handleLaunch = async () => {
    playClickSound();
    setStage('PLAYING');
    setLogoPopped(false);
    cutTriggeredRef.current = false;

    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
        await videoRef.current.play();
      } catch (err) {
        try {
          videoRef.current.muted = false;
          await videoRef.current.play();
        } catch (e) {}
      }
    }
  };

  // When ribbon video finishes -> hold glowing logo for 1.8s and enter web portal
  const handleVideoEnded = () => {
    setLogoPopped(true);
    
    // Hold the glowing logo showcase, then seamlessly enter the web portal
    setTimeout(() => {
      setStage('REVEALED');
      setShowBadge(true);

      setTimeout(() => {
        setShowBadge(false);
        setTimeout(() => {
          setStage('FINISHED');
          if (onComplete) onComplete();
        }, 800);
      }, 3000);
    }, 1800);
  };

  const handleDirectSkip = () => {
    setStage('REVEALED');
    setShowBadge(true);
    setTimeout(() => {
      setShowBadge(false);
      setStage('FINISHED');
      if (onComplete) onComplete();
    }, 1200);
  };

  if (stage === 'FINISHED' && !showBadge) {
    return null;
  }

  return (
    <>
      {/* Custom Keyframe Styles for Logo Motion & Radiant Glow */}
      <style jsx>{`
        @keyframes logoPulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 25px rgba(0, 200, 255, 0.85)) drop-shadow(0 0 55px rgba(244, 180, 0, 0.75));
            transform: scale(1.06) translateY(0px);
          }
          50% {
            filter: drop-shadow(0 0 50px rgba(0, 200, 255, 1)) drop-shadow(0 0 90px rgba(244, 180, 0, 1)) drop-shadow(0 0 120px rgba(255, 255, 255, 0.7));
            transform: scale(1.12) translateY(-8px);
          }
        }
        @keyframes shimmerSweep {
          0% {
            transform: translateX(-150%) skewX(-25deg);
            opacity: 0;
          }
          30% {
            opacity: 0.9;
          }
          70% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(250%) skewX(-25deg);
            opacity: 0;
          }
        }
        @keyframes particleOrbit {
          0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. MAIN VOLUMETRIC BACKDROP & CEREMONY OVERLAY */}
      {/* ========================================================================= */}
      {stage !== 'FINISHED' && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-1000 ease-out select-none overflow-hidden ${
            stage === 'REVEALED' ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
          }`}
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(16, 20, 30, 0.97) 0%, rgba(8, 10, 15, 0.99) 60%, #030406 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Volumetric Golden Spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[1200px] h-[90vh] bg-gradient-to-b from-premium-gold/30 via-premium-gold/10 to-transparent rounded-full blur-[150px] pointer-events-none" />

          {/* Floating Atmospheric Sparkles */}
          <div className="absolute inset-0 pointer-events-none opacity-45">
            <div className="absolute top-1/4 left-1/5 w-2.5 h-2.5 rounded-full bg-premium-gold animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute top-3/5 right-1/4 w-2 h-2 rounded-full bg-electric-blue animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
            <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-yellow-200 animate-pulse" />
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* ========================================================================= */}
          {/* 2. CHIEF GUEST INVITATION & CEREMONIAL PROMPT (STAGE: PROMPT) */}
          {/* ========================================================================= */}
          {stage === 'PROMPT' && (
            <div className="relative z-50 text-center max-w-2xl mx-auto px-6 space-y-7 animate-in fade-in zoom-in-95 duration-700">
              
              {/* Institution Header Badge */}
              <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#0D1117]/90 border border-premium-gold/50 text-premium-gold text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(244,180,0,0.35)]">
                <Star className="w-3.5 h-3.5 fill-premium-gold text-premium-gold animate-spin" style={{ animationDuration: '6s' }} />
                <span>OFFICIAL INAUGURATION CEREMONY</span>
                <Star className="w-3.5 h-3.5 fill-premium-gold text-premium-gold animate-spin" style={{ animationDuration: '6s' }} />
              </div>

              {/* Dignitary Invitation Typography */}
              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-mono tracking-widest text-text-secondary uppercase">
                  S.A. ENGINEERING COLLEGE (AUTONOMOUS) • ECE &amp; VLSI DEPARTMENTS
                </p>
                <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-wider text-white uppercase drop-shadow-[0_0_40px_rgba(244,180,0,0.65)]">
                  KERNEL PRIME'26
                </h1>
                <p className="text-base sm:text-xl font-mono font-bold text-electric-blue tracking-widest uppercase drop-shadow-[0_0_20px_rgba(0,200,255,0.6)]">
                  Software Problem Statement Allocation Portal
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface/80 border border-white/10 max-w-lg mx-auto backdrop-blur-md shadow-2xl">
                <p className="text-xs sm:text-sm text-text-secondary font-mono leading-relaxed">
                  We cordially invite the Respected Management, Dignitaries &amp; Chief Guests to inaugurate the official allocation portal.
                </p>
              </div>

              {/* Grand VIP Cut Ribbon Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="group relative inline-flex items-center justify-center gap-4 py-4 sm:py-5 px-10 sm:px-14 rounded-2xl font-mono text-sm sm:text-base tracking-widest uppercase font-black text-background bg-gradient-to-r from-premium-gold via-yellow-300 to-premium-gold shadow-[0_0_50px_rgba(244,180,0,0.85)] hover:shadow-[0_0_80px_rgba(244,180,0,1)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/90"
                >
                  <Scissors className="w-6 h-6 text-background transition-transform group-hover:rotate-45 duration-300" />
                  <span>CUT RIBBON &amp; LAUNCH PORTAL</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-text-muted pt-1">
                October 8, 2026 • Live 24-Hour Hackathon Allocation Engine
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SIMULTANEOUS SYNCHRONIZED LOGO EMERGENCE & VIDEO CANVAS (STAGE: PLAYING) */}
          {/* ========================================================================= */}
          {/* Hidden Source Video Element */}
          <video
            ref={videoRef}
            src="/Ribbon/ribbon-cut.mp4"
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
            className="hidden"
          />

          {stage === 'PLAYING' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none">
              
              {/* Header during launch */}
              <div className="absolute top-6 sm:top-10 text-center space-y-1.5 animate-in fade-in duration-500 z-50">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-premium-gold flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  {logoPopped ? 'OFFICIALLY INAUGURATED' : 'LAUNCH CEREMONY IN PROGRESS'}
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-2xl sm:text-4xl font-black font-mono tracking-widest text-white uppercase drop-shadow-[0_0_25px_rgba(244,180,0,0.5)]">
                  KERNEL PRIME'26
                </h2>
              </div>

              {/* ========================================================================= */}
              {/* LOGO: PURE TRANSPARENT 3D EMBLEM (NO SHADOW BOX OR RECTANGLE CONTAINER) */}
              {/* ========================================================================= */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div
                  className={`relative max-w-[90vw] transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center ${
                    logoPopped
                      ? 'w-[360px] sm:w-[620px] opacity-100 scale-100 z-30'
                      : 'w-[320px] sm:w-[500px] opacity-40 scale-90 z-10'
                  }`}
                >
                  {/* Layer 1: Soft Volumetric Electric Blue & Golden Halo Auras */}
                  <div
                    className={`absolute -inset-10 bg-gradient-to-r from-electric-blue/35 via-premium-gold/45 to-electric-blue/35 rounded-full blur-[80px] transition-opacity duration-700 pointer-events-none ${
                      logoPopped ? 'opacity-100 animate-pulse' : 'opacity-25'
                    }`}
                  />

                  {/* Layer 2: Orbiting Light Sparks when Popped */}
                  {logoPopped && (
                    <>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-yellow-300 blur-[1px] pointer-events-none" style={{ animation: 'particleOrbit 3s linear infinite' }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cyan-300 blur-[1px] pointer-events-none" style={{ animation: 'particleOrbit 3s linear infinite reverse', animationDelay: '-1.5s' }} />
                    </>
                  )}

                  {/* Layer 3: Main Glowing 3D Logo (Pure Image, No Box / Border) */}
                  <div
                    className="relative z-20 flex items-center justify-center"
                    style={{
                      animation: logoPopped ? 'logoPulseGlow 2.5s ease-in-out infinite' : 'none',
                    }}
                  >
                    <img
                      src="/assets/branding/kernel-prime-inauguration-logo.png"
                      alt="Kernel Prime 26 - The Core of Innovation"
                      className="w-full h-auto object-contain"
                    />

                    {/* Diagonal Metallic Shimmer Light Sweep (Fires at Cut) */}
                    {logoPopped && (
                      <div
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
                        style={{ animation: 'shimmerSweep 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Hardware-Accelerated Chroma-Key Canvas (Zero Drop Shadow, Pure Transparency) */}
              <div className={`relative w-full max-w-[1400px] aspect-video flex items-center justify-center z-20 transition-opacity duration-700 ${logoPopped ? 'opacity-80' : 'opacity-100'}`}>
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Subtitle Message during / after cut */}
              {logoPopped && (
                <div className="absolute bottom-16 sm:bottom-20 z-40 text-center space-y-1 animate-in slide-in-from-bottom-4 fade-in duration-500">
                  <h3 className="text-lg sm:text-2xl font-mono font-black text-white tracking-widest uppercase drop-shadow-[0_0_25px_rgba(244,180,0,0.8)]">
                    ENTERING SOFTWARE ALLOCATION PORTAL
                  </h3>
                  <p className="text-[11px] sm:text-xs font-mono text-electric-blue tracking-widest uppercase drop-shadow">
                    S.A. Engineering College (Autonomous) • 24-Hour Hackathon
                  </p>
                </div>
              )}

              {/* Dignitary Skip Action if needed */}
              <div className="absolute bottom-6 z-50 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleDirectSkip}
                  className="text-xs font-mono text-text-muted hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
                >
                  Skip to Portal
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. POST-LAUNCH FLOATING CELEBRATION BADGE */}
      {/* ========================================================================= */}
      {showBadge && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-top-6 fade-in duration-500 pointer-events-none">
          <div className="flex items-center gap-3.5 py-4 px-9 rounded-full bg-[#0D1117]/95 border-2 border-premium-gold shadow-[0_0_55px_rgba(244,180,0,0.85)] backdrop-blur-2xl">
            <CheckCircle className="w-6 h-6 text-emerald-400 animate-bounce" />
            <div className="flex flex-col">
              <span className="font-mono text-sm sm:text-base font-black text-white uppercase tracking-widest drop-shadow">
                ✨ PORTAL OFFICIALLY INAUGURATED ✨
              </span>
              <span className="font-mono text-[10px] text-premium-gold tracking-wider uppercase">
                KERNEL PRIME'26 Allocation Engine Live
              </span>
            </div>
            <span className="w-3 h-3 rounded-full bg-premium-gold animate-ping" />
          </div>
        </div>
      )}
    </>
  );
};
