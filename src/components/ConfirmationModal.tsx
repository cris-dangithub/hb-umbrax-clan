'use client';

import { useState, useEffect } from 'react';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import AdminModal from './AdminModal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  previewMessage: string; // Mensaje en pasado que se mostrará al completar los códigos
  confirmationCodes: string[]; // Array de 1 o 2 códigos
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  previewMessage,
  confirmationCodes,
  isLoading = false,
}: ConfirmationModalProps) {
  const [inputCodes, setInputCodes] = useState<string[]>(() => 
    confirmationCodes.map(() => '')
  );

  // Reset input codes when modal opens or codes change
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to avoid cascading renders
      const timer = setTimeout(() => {
        setInputCodes(confirmationCodes.map(() => ''));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, confirmationCodes]);

  // Calculate if all codes are complete
  const allCodesComplete = confirmationCodes.every((code, index) => 
    inputCodes[index]?.toUpperCase() === code.toUpperCase()
  );

  const handleCodeChange = (index: number, value: string) => {
    const newInputCodes = [...inputCodes];
    newInputCodes[index] = value.toUpperCase();
    setInputCodes(newInputCodes);
  };

  const handleConfirm = () => {
    if (allCodesComplete && !isLoading) {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      headerBgColor="rgba(30, 58, 138, 0.95)"
      borderColor="#3B82F6"
    >
      <div className="space-y-4">
        {/* Códigos de Confirmación */}
        {confirmationCodes.map((code, index) => (
          <div key={index}>
            <div
              className={`p-4 rounded border-2 transition-all ${
                inputCodes[index]?.toUpperCase() === code.toUpperCase()
                  ? 'bg-green-500/10 border-green-500'
                  : 'bg-red-500/10 border-red-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {inputCodes[index]?.toUpperCase() === code.toUpperCase() ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-white font-['Rajdhani'] font-semibold">
                  {inputCodes[index]?.toUpperCase() === code.toUpperCase()
                    ? 'Código Verificado'
                    : `Código Requerido ${confirmationCodes.length > 1 ? `#${index + 1}` : ''}`}
                </span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-['Press_Start_2P'] text-[#CC933B] tracking-widest">
                  {code}
                </span>
              </div>
            </div>

            {/* Input Field */}
            <div className="mt-3">
              <label className="block text-white font-['Rajdhani'] font-semibold mb-2">
                Ingresa el código {confirmationCodes.length > 1 ? `#${index + 1}` : ''} para confirmar:
              </label>
              <input
                type="text"
                value={inputCodes[index] || ''}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#3B82F6]/30 rounded text-white font-['Rajdhani'] text-lg tracking-widest text-center focus:outline-none focus:border-[#3B82F6] transition-colors uppercase"
                placeholder="XXXXXX"
                maxLength={6}
                disabled={isLoading}
              />
            </div>
          </div>
        ))}

        {/* Aviso Naranja - Solo visible cuando NO están completos todos los códigos */}
        {!allCodesComplete && (
          <div className="p-4 bg-orange-500/10 border-2 border-orange-500 rounded">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-['Rajdhani'] text-orange-500 font-semibold text-sm">
                  Completa {confirmationCodes.length > 1 ? 'todos los códigos' : 'el código'} de confirmación para continuar
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vista Previa - Solo visible cuando TODOS los códigos están completos */}
        {allCodesComplete && (
          <div className="p-4 rounded border-2 bg-green-500/10 border-green-500">
            <p className="font-['Rajdhani'] text-white font-semibold mb-2">
              Vista Previa del Registro:
            </p>
            <p className="font-['Rajdhani'] text-white/90 text-sm leading-relaxed">
              {previewMessage}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-[#1a1a1a] border-2 border-[#3B82F6]/30 text-white font-['Rajdhani'] font-semibold rounded hover:bg-[#3B82F6]/10 transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        {allCodesComplete && (
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border-2 bg-green-500 border-green-500 text-white font-['Rajdhani'] font-semibold rounded hover:bg-green-600 hover:border-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Procesando...' : 'Continuar'}
          </button>
        )}
      </div>
    </AdminModal>
  );
}
