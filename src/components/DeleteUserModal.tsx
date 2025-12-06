'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import HabboAvatar from './HabboAvatar';
import AdminModal from './AdminModal';
import ConfirmationModal from './ConfirmationModal';
import { generateConfirmationCode } from '@/lib/confirmation';

interface Rank {
  id: number;
  name: string;
  order: number;
}

interface User {
  id: string;
  habboName: string;
  rankId: number;
  rank: Rank;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
  currentUserName: string;
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  currentUserName,
}: DeleteUserModalProps) {
  const [reason, setReason] = useState('');
  const [doubleConfirm, setDoubleConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCodes, setConfirmationCodes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDoubleConfirm('');
      setError('');
    }
  }, [isOpen]);

  const expectedConfirmText = `ELIMINAR ${user.habboName}`;
  const isFormComplete = 
    reason.trim().length >= 10 && 
    doubleConfirm === expectedConfirmText;

  const handlePreview = () => {
    if (!isFormComplete) return;
    const code1 = generateConfirmationCode();
    const code2 = generateConfirmationCode();
    setConfirmationCodes([code1, code2]);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el usuario');
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
    return `El usuario ${user.habboName} fue eliminado permanentemente del sistema por ${currentUserName}.`;
  };

  if (!isOpen) return null;

  return (
    <>
      <AdminModal
        isOpen={isOpen && !showConfirmation}
        onClose={onClose}
        title="Eliminar Usuario"
        headerBgColor="rgba(127, 29, 29, 0.95)"
        borderColor="#EF4444"
      >
        <div className="space-y-6">
          {/* Warning */}
          <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-['Rajdhani'] text-red-500 font-bold text-lg mb-2">
                  ⚠️ ACCIÓN IRREVERSIBLE
                </p>
                <p className="font-['Rajdhani'] text-white/90 text-sm leading-relaxed">
                  Esta acción eliminará permanentemente al usuario <span className="font-bold text-red-500">{user.habboName}</span> y todos sus datos asociados del sistema. Esta acción NO puede deshacerse.
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 bg-[#1a1a1a] border border-red-500/30 rounded">
            <div className="flex items-center gap-3">
              <HabboAvatar
                src={`https://www.habbo.es/habbo-imaging/avatarimage?user=${user.habboName}&direction=2&head_direction=3&size=l`}
                alt={user.habboName}
                size={64}
              />
              <div>
                <p className="font-['Rajdhani'] text-white font-semibold text-lg">
                  {user.habboName}
                </p>
                <p className="font-['Rajdhani'] text-[#EF4444] text-sm">
                  Rango: {user.rank.name}
                </p>
                <p className="font-['Rajdhani'] text-red-500 text-xs mt-1">
                  ID: {user.id}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-white font-['Rajdhani'] font-semibold mb-2">
              Razón de la Eliminación (mínimo 10 caracteres):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-red-500/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-red-500 transition-colors resize-none"
              rows={4}
              placeholder="Ejemplo: Incumplimiento de normativas internas, conducta inapropiada..."
            />
            <p className="text-xs font-['Rajdhani'] text-white/60 mt-1">
              {reason.length} / 10 caracteres mínimos
            </p>
          </div>

          {/* Double Confirmation */}
          <div>
            <label className="block text-white font-['Rajdhani'] font-semibold mb-2">
              Confirma escribiendo: <span className="text-red-500 font-bold">{expectedConfirmText}</span>
            </label>
            <input
              type="text"
              value={doubleConfirm}
              onChange={(e) => setDoubleConfirm(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-red-500/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-red-500 transition-colors"
              placeholder={expectedConfirmText}
            />
            {doubleConfirm && doubleConfirm !== expectedConfirmText && (
              <p className="text-xs font-['Rajdhani'] text-red-500 mt-1">
                El texto no coincide. Debe ser exacto.
              </p>
            )}
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
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border-2 border-[#EF4444]/30 text-white font-['Rajdhani'] font-semibold rounded hover:bg-[#EF4444]/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePreview}
            disabled={!isFormComplete}
            className={`flex-1 px-4 py-2 border-2 font-['Rajdhani'] font-semibold rounded transition-colors ${
              isFormComplete
                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                : 'bg-[#1a1a1a] border-red-500/30 text-white/50 cursor-not-allowed'
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
        title="Confirmar Eliminación Definitiva"
        previewMessage={getPreviewMessage()}
        confirmationCodes={confirmationCodes}
        isLoading={isLoading}
      />
    </>
  );
}
