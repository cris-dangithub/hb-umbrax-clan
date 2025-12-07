'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import HabboAvatar from './HabboAvatar';
import AdminModal from './AdminModal';
import ConfirmationModal from './ConfirmationModal';
import { generateConfirmationCode } from '@/lib/confirmation';

interface Rank {
  id: number;
  name: string;
  order: number;
  icon: string;
}

interface User {
  id: string;
  habboName: string;
  rankId: number;
  rank: Rank;
}

interface SendTimeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

export default function SendTimeRequestModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: SendTimeRequestModalProps) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCodes, setConfirmationCodes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  // Valid for ranks 4-13 (all Súbditos and Soberanos, excluding Cúpula Directiva)
  const isFormValid = user.rank.order >= 4 && user.rank.order <= 13;

  const handlePreview = () => {
    if (!isFormValid) return;
    const code = generateConfirmationCode();
    setConfirmationCodes([code]);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/time-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectUserId: user.id,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar solicitud');
      }

      setShowConfirmation(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setShowConfirmation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewMessage = () => {
    return `Solicitud de time tracking enviada a ${user.habboName}. Esta acción quedará registrada en el sistema de auditoría.`;
  };

  return (
    <>
      <AdminModal
        isOpen={isOpen && !showConfirmation}
        onClose={onClose}
        title="Enviar Solicitud de Time"
        headerBgColor="rgba(59, 130, 246, 0.95)"
        borderColor="#3b82f6"
      >
        <div className="space-y-6">
          {/* User Info */}
          <div className="p-4 bg-[#1a1a1a] border border-[#3b82f6]/30 rounded">
            <div className="flex items-center gap-3">
              <HabboAvatar
                src={`https://www.habbo.com/habbo-imaging/avatarimage?user=${user.habboName}&direction=3&head_direction=3&gesture=sml&size=l`}
                alt={user.habboName}
                size={64}
              />
              <div>
                <p className="font-bold text-[#3b82f6] font-['Rajdhani'] text-lg">
                  {user.habboName}
                </p>
                <p className="text-white/70 font-['Rajdhani'] text-sm">
                  {user.rank.icon} {user.rank.name}
                </p>
              </div>
            </div>
          </div>

          {/* Validation Warning */}
          {!isFormValid && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500 rounded">
              <p className="text-yellow-500 font-['Rajdhani'] text-sm">
                <strong>Advertencia:</strong> Solo se pueden enviar solicitudes de time a usuarios de rangos 4-13 (Súbditos y Soberanos).
              </p>
            </div>
          )}

          {/* Notes Field */}
          <div>
            <label className="block text-[#3b82f6] font-['Rajdhani'] font-semibold mb-2 text-sm">
              <Clock className="inline w-4 h-4 mr-1" />
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#3b82f6]/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
              rows={4}
              placeholder="Ej: Time para completar misión de promoción a [próximo rango]..."
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded">
            <p className="text-[#60a5fa] font-['Rajdhani'] text-sm">
              <strong>Importante:</strong> La solicitud expirará en 5 minutos. El usuario deberá aprobarla antes de ese tiempo. Si se aprueba, se creará automáticamente una sesión de time tracking supervisada por ti.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded">
              <p className="text-red-500 font-['Rajdhani'] text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border-2 border-[#3b82f6]/30 text-white font-['Rajdhani'] font-semibold rounded hover:bg-[#3b82f6]/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePreview}
            disabled={!isFormValid}
            className={`flex-1 px-4 py-2 border-2 font-['Rajdhani'] font-semibold rounded transition-colors ${
              isFormValid
                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                : 'bg-[#1a1a1a] border-[#3b82f6]/30 text-white/50 cursor-not-allowed'
            }`}
          >
            Continuar
          </button>
        </div>
      </AdminModal>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
        title="Confirmar Envío de Solicitud"
        previewMessage={getPreviewMessage()}
        confirmationCodes={confirmationCodes}
        isLoading={isLoading}
      />
    </>
  );
}
