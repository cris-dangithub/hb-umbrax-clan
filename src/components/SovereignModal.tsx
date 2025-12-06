'use client';

import { useState, useEffect } from 'react';
import { Crown, Shield } from 'lucide-react';
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
  isSovereign: boolean;
  rank: Rank;
}

interface SovereignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
  currentUserName: string;
}

export default function SovereignModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  currentUserName,
}: SovereignModalProps) {
  const [willBeSovereign, setWillBeSovereign] = useState<boolean>(user.isSovereign);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCodes, setConfirmationCodes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setWillBeSovereign(user.isSovereign);
      setReason('');
      setError('');
    }
  }, [isOpen, user.isSovereign]);

  const isFormComplete = reason.trim().length >= 10;
  const hasChanges = willBeSovereign !== user.isSovereign;

  const handlePreview = () => {
    if (!isFormComplete || !hasChanges) return;
    const code = generateConfirmationCode();
    setConfirmationCodes([code]);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}/rank-boss`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSovereign: willBeSovereign,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar estado de soberano');
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

  // Preview message in past tense
  const getPreviewMessage = () => {
    if (willBeSovereign) {
      return `${user.habboName} fue nombrado Soberano de ${user.rank.name} por ${currentUserName}.`;
    } else {
      return `${user.habboName} fue degradado de Soberano a Súbdito por ${currentUserName}.`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AdminModal
        isOpen={isOpen && !showConfirmation}
        onClose={onClose}
        title="Gestionar Soberano"
        headerBgColor="rgba(113, 63, 18, 0.95)"
        borderColor="#D97706"
      >
        <div className="space-y-6">
          {/* User Info */}
          <div className="p-4 bg-[#1a1a1a] border border-[#D97706]/30 rounded">
            <div className="flex items-center gap-3">
              <HabboAvatar
                src={`https://www.habbo.es/habbo-imaging/avatarimage?user=${user.habboName}&direction=2&head_direction=3&size=l`}
                alt={user.habboName}
                size={64}
              />
              <div className="flex-1">
                <p className="font-['Rajdhani'] text-white font-semibold text-lg">
                  {user.habboName}
                </p>
                <p className="font-['Rajdhani'] text-[#D97706] text-sm">
                  {user.rank.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {user.isSovereign ? (
                    <>
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span className="font-['Rajdhani'] text-yellow-500 text-xs font-bold">
                        SOBERANO
                      </span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="font-['Rajdhani'] text-gray-400 text-xs">
                        Súbdito
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-[#D97706]/10 border border-[#D97706]/30 rounded">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-1" />
              <div>
                <p className="font-['Rajdhani'] text-white font-semibold text-sm mb-1">
                  Privilegios de Soberano
                </p>
                <p className="font-['Rajdhani'] text-white/70 text-xs leading-relaxed">
                  Los soberanos tienen autoridad para modificar usuarios de su mismo nivel jerárquico, 
                  incluyendo cambios de rango dentro de su autoridad.
                </p>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-white font-['Rajdhani'] font-semibold mb-3">
              Nuevo Estado:
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setWillBeSovereign(true)}
                className={`w-full p-4 border-2 rounded transition-all text-left ${
                  willBeSovereign
                    ? 'bg-[#D97706]/20 border-[#D97706]'
                    : 'bg-[#1a1a1a] border-[#D97706]/30 hover:border-[#D97706]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className={`w-6 h-6 ${willBeSovereign ? 'text-yellow-500' : 'text-[#D97706]/50'}`} />
                  <div>
                    <p className="font-['Rajdhani'] text-white font-semibold">
                      Nombrar como Soberano
                    </p>
                    <p className="font-['Rajdhani'] text-white/60 text-xs mt-1">
                      Otorgar privilegios de autoridad sobre su nivel
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setWillBeSovereign(false)}
                className={`w-full p-4 border-2 rounded transition-all text-left ${
                  !willBeSovereign
                    ? 'bg-[#D97706]/20 border-[#D97706]'
                    : 'bg-[#1a1a1a] border-[#D97706]/30 hover:border-[#D97706]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`w-6 h-6 ${!willBeSovereign ? 'text-gray-400' : 'text-[#D97706]/50'}`} />
                  <div>
                    <p className="font-['Rajdhani'] text-white font-semibold">
                      Degradar a Súbdito
                    </p>
                    <p className="font-['Rajdhani'] text-white/60 text-xs mt-1">
                      Remover privilegios de soberano
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-white font-['Rajdhani'] font-semibold mb-2">
              Razón del Cambio (mínimo 10 caracteres):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#D97706]/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-[#D97706] transition-colors resize-none"
              rows={4}
              placeholder={
                willBeSovereign
                  ? 'Ejemplo: Ha demostrado liderazgo excepcional y compromiso con el clan...'
                  : 'Ejemplo: Restructuración organizativa del equipo de liderazgo...'
              }
            />
            <p className="text-xs font-['Rajdhani'] text-white/60 mt-1">
              {reason.length} / 10 caracteres mínimos
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
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border-2 border-[#D97706]/30 text-white font-['Rajdhani'] font-semibold rounded hover:bg-[#D97706]/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePreview}
            disabled={!isFormComplete || !hasChanges}
            className={`flex-1 px-4 py-2 border-2 font-['Rajdhani'] font-semibold rounded transition-colors ${
              isFormComplete && hasChanges
                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                : 'bg-[#1a1a1a] border-[#D97706]/30 text-white/50 cursor-not-allowed'
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
        title="Confirmar Cambio de Estado"
        previewMessage={getPreviewMessage()}
        confirmationCodes={confirmationCodes}
        isLoading={isLoading}
      />
    </>
  );
}
