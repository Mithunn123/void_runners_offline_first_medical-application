import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export function RealOpticalScanner({ onScanSuccess, onClose, title = "Optical Camera Scanner", subtitle = "Point camera at QR code on screen or paper" }: ScannerProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const rawId = useId();
  const regionId = `qr-reader-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const isStartedRef = useRef<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    const startScanner = async () => {
      try {
        const instance = new Html5Qrcode(regionId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        scannerRef.current = instance;

        if (!isMountedRef.current) {
          return;
        }

        await instance.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const edge = Math.min(viewfinderWidth, viewfinderHeight);
              return {
                width: Math.floor(edge * 0.82),
                height: Math.floor(edge * 0.82)
              };
            },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            // Successfully scanned
            if (isStartedRef.current) {
              isStartedRef.current = false;
              // Immediately invoke callback so the transition happens without lag
              onScanSuccess(decodedText);
              if (instance.isScanning) {
                instance.stop().then(() => {
                  instance.clear();
                }).catch(() => {});
              }
            }
          },
          () => {
            // Frame read without QR - normal scanning loop
          }
        );
        isStartedRef.current = true;
        setIsScanning(true);
      } catch (err: unknown) {
        console.error("Camera scanner error:", err);
        const message = err instanceof Error ? err.message : String(err);
        setErrorMsg(`Camera access failed: ${message}. Ensure camera permissions are allowed.`);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      isStartedRef.current = false;
      const currentScanner = scannerRef.current;
      if (currentScanner && currentScanner.isScanning) {
        currentScanner.stop().then(() => {
          currentScanner.clear();
        }).catch(e => console.error("Error stopping scanner on unmount:", e));
      }
    };
  }, [onScanSuccess, regionId]);

  return (
    <div style={{
      position: 'relative',
      background: '#0f172a',
      borderRadius: '16px',
      padding: '20px',
      color: '#fff',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
      border: '1px solid #334155',
      maxWidth: '520px',
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isScanning ? '#22c55e' : '#eab308',
              display: 'inline-block',
              boxShadow: isScanning ? '0 0 8px #22c55e' : 'none'
            }}></span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{title}</h3>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{subtitle}</p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: '#1e293b',
              border: '1px solid #475569',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}>
            Close Camera
          </button>
        )}
      </div>

      {errorMsg ? (
        <div style={{
          padding: '20px',
          background: '#450a0a',
          border: '1px solid #dc2626',
          borderRadius: '12px',
          color: '#fecaca',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600 }}>⚠️ Camera Initialization Failed</p>
          <p style={{ margin: 0, fontSize: '0.75rem' }}>{errorMsg}</p>
        </div>
      ) : (
        <div>
          <div
            id={regionId}
            style={{
              width: '100%',
              maxWidth: '380px',
              margin: '0 auto',
              overflow: 'hidden',
              borderRadius: '12px',
              border: '2px solid #0d9488'
            }}
          />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px',
            fontSize: '0.76rem',
            color: '#38bdf8'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>Live optical feed active · Aim at counterpart screen</span>
          </div>
        </div>
      )}
    </div>
  );
}
