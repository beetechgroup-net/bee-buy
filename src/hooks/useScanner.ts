import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface UseScannerProps {
  onScanSuccess: (decodedText: string) => void;
  fps?: number;
  qrbox?: number;
}

export function useScanner({ onScanSuccess, fps = 10, qrbox = 250 }: UseScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const startScanner = useCallback(async (elementId: string) => {
    if (scannerRef.current) return;
    hasScannedRef.current = false;
    setError(null);

    try {
      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { 
          fps, 
          qrbox: { width: qrbox, height: qrbox },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            // The cleanup effect will handle stopping the camera,
            // avoiding race conditions when navigating away.
            onScanSuccess(decodedText);
          }
        },
        (_errorMessage) => {
          // Ignored
        }
      );
    } catch (err: any) {
      console.error('Camera start error', err);
      setError('Não foi possível iniciar a câmera. Verifique as permissões.');
    }
  }, [fps, qrbox, onScanSuccess]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(() => {});
        } else {
          scannerRef.current.clear();
        }
      } catch (e) {
        // Ignorar erros caso a câmera já esteja parada ou em processo de inicialização
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return { error, startScanner, stopScanner };
}
