import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScanner } from '../hooks/useScanner';
import { scraperService } from '../services/scraperService';
import { usePurchases } from '../hooks/usePurchases';
import { QrCode, AlertCircle, Loader2, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';

export function ScannerPage() {
  const navigate = useNavigate();
  const { purchases, addPurchase } = usePurchases();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState('');
  const [showManual, setShowManual] = useState(false);

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanning visually
    setProcessing(true);
    setErrorMsg(null);
    try {
      if (!decodedText.includes('http')) {
        throw new Error('QR Code não contém uma URL válida de NFC-e.');
      }
      
      const purchase = await scraperService.processQRCodeUrl(decodedText);
      
      // Verificar duplicidade pela chave de acesso (se não for a mockada 'UNKNOWN_KEY')
      const isUnknown = purchase.accessKey === 'UNKNOWN_KEY';
      const existingPurchase = purchases.find(p => p.accessKey === purchase.accessKey && !isUnknown);
      
      if (existingPurchase) {
        // Se já existe, apenas redireciona para a nota já salva
        setProcessing(false);
        navigate(`/purchase/${existingPurchase.id}`, { replace: true });
        return;
      }

      addPurchase(purchase);
      setProcessing(false);
      navigate(`/purchase/${purchase.id}`, { replace: true });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao processar a nota fiscal.');
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = manualKey.replace(/\D/g, '');
    if (cleanKey.length !== 44) {
      setErrorMsg('A chave de acesso deve ter exatamente 44 dígitos.');
      return;
    }
    
    const url = scraperService.generateUrlFromAccessKey(cleanKey);
    if (url) {
      onScanSuccess(url);
    }
  };

  const { startScanner, stopScanner } = useScanner({
    onScanSuccess,
    fps: 10,
    qrbox: 250,
  });

  useEffect(() => {
    if (!processing) {
      // Delay start slightly to allow dialog to animate away and camera to prep
      setTimeout(() => startScanner('reader'), 300);
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [processing, startScanner, stopScanner]);

  return (
    <div className="flex flex-col h-full items-center animate-in fade-in duration-300">
      <div className="text-center mb-6 w-full">
        <h2 className="text-2xl font-bold text-gray-800 flex justify-center items-center gap-2">
          <QrCode className="w-6 h-6 text-amber-600" />
          Escanear Nota
        </h2>
        <p className="text-sm text-gray-500 mt-1">Aponte a câmera para o QR Code da NFC-e</p>
      </div>

      <div className="w-full max-w-sm rounded-[2rem] overflow-hidden bg-black shadow-2xl relative aspect-[4/5] flex items-center justify-center border-4 border-gray-100">
        <div 
          id="reader" 
          className={`w-full h-full object-cover rounded-[2rem] overflow-hidden ${processing ? 'hidden' : 'block'}`}
        ></div>

        {processing && (
          <div className="absolute inset-0 bg-amber-900/90 flex flex-col items-center justify-center text-white z-20 animate-in fade-in">
            <Loader2 className="w-12 h-12 mb-4 animate-spin text-amber-300" />
            <h3 className="text-xl font-bold">Lendo dados...</h3>
            <p className="text-sm text-amber-100/80 mt-2 px-8 text-center text-balance">
              Conectando com a SEFAZ e extraindo os produtos da sua nota.
            </p>
          </div>
        )}
      </div>

      {errorMsg && !processing && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 w-full animate-in slide-in-from-bottom-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Leitura falhou</span>
            <span className="text-xs">{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Manual Entry Section */}
      <div className="w-full max-w-sm mt-6">
        <button 
          onClick={() => setShowManual(!showManual)}
          className="flex items-center justify-between w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-700 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <KeyRound className="w-4 h-4 text-amber-600" />
            Digitar chave de acesso
          </div>
          {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showManual && (
          <form 
            onSubmit={handleManualSubmit}
            className="mt-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-top-2"
          >
            <div className="flex flex-col gap-3">
              <label htmlFor="accessKey" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Chave da NFC-e (44 dígitos)
              </label>
              <textarea 
                id="accessKey"
                rows={2}
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value.replace(/\D/g, '').substring(0, 44))}
                placeholder="Ex: 5026 0419 3727 7700 0105 6510..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition resize-none uppercase"
              />
              <button 
                type="submit"
                disabled={manualKey.length !== 44 || processing}
                className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl shadow-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                Identificar Nota
              </button>
            </div>
          </form>
        )}
      </div>
      
      {!processing && (
        <button 
          onClick={() => navigate(-1)}
          className="mt-8 mb-8 text-gray-500 font-medium py-2 px-6 rounded-full hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
