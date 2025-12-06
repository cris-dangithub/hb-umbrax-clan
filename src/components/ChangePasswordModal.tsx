'use client';

import { useState, useEffect } from 'react';
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

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
  currentUserName: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  currentUserName,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCodes, setConfirmationCodes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const passwordValid = newPassword.length >= 8;
  const reasonValid = reason.trim().length >= 10;
  
  const isFormComplete = passwordsMatch && passwordValid && reasonValid;

  const handlePreview = () => {
    if (!isFormComplete) return;
    const code = generateConfirmationCode();
    setConfirmationCodes([code]);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña');
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
    return `La contraseña de ${user.habboName} ha sido actualizada por ${currentUserName}.`;
  };

  if (!isOpen) return null;

  return (
    <>
      <AdminModal
        isOpen={isOpen && !showConfirmation}
        onClose={onClose}
        title="Cambiar Contraseña"
        headerBgColor="rgba(30, 58, 138, 0.95)"
        borderColor="#3B82F6"
      >
        <div className="space-y-6">
          {/* User Info */}
          <div className="p-4 bg-[#1a1a1a] border border-[#3B82F6]/30 rounded">
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
                <p className="font-['Rajdhani'] text-[#3B82F6] text-sm">
                  Rango: {user.rank.name}
                </p>
              </div>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-white font-['Rajdhani'] font-semibold mb-2">
              Nueva Contraseña (mínimo 8 caracteres):
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#3B82F6]/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-[#3B82F6] transition-colors"
              placeholder="Ingresa la nueva contraseña..."
            />
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`h-1 flex-1 rounded transition-all ${
                  newPassword.length === 0
                    ? 'bg-white/20'
                    : passwordValid
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />
              <p className="text-xs font-['Rajdhani'] text-white/60">
                {newPassword.length} / 8 caracteres mínimos
              </p>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-white font-['Rajdhani'] font-semibold mb-2">
              Confirmar Nueva Contraseña:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#3B82F6]/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-[#3B82F6] transition-colors"
              placeholder="Confirma la nueva contraseña..."
            />
            {confirmPassword.length > 0 && (
              <p
                className={`text-xs font-['Rajdhani'] mt-1 ${
                  passwordsMatch ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-white font-['Rajdhani'] font-semibold mb-2">
              Razón del Cambio (mínimo 10 caracteres):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#3B82F6]/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-[#3B82F6] transition-colors resize-none"
              rows={4}
              placeholder="Ejemplo: Usuario reportó olvido de contraseña, solicitud por seguridad..."
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
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border-2 border-[#3B82F6]/30 text-white font-['Rajdhani'] font-semibold rounded hover:bg-[#3B82F6]/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePreview}
            disabled={!isFormComplete}
            className={`flex-1 px-4 py-2 border-2 font-['Rajdhani'] font-semibold rounded transition-colors ${
              isFormComplete
                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                : 'bg-[#1a1a1a] border-[#3B82F6]/30 text-white/50 cursor-not-allowed'
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
        title="Confirmar Cambio de Contraseña"
        previewMessage={getPreviewMessage()}
        confirmationCodes={confirmationCodes}
        isLoading={isLoading}
      />
    </>
  );
}
