'use client';

import { useState, useEffect } from 'react';
import HabboAvatar from './HabboAvatar';
import AdminModal from './AdminModal';
import ConfirmationModal from './ConfirmationModal';
import { generateConfirmationCode } from '@/lib/confirmation';
import { RankIcon } from '@/lib/rank-icons';

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

interface ChangeRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
  currentUserRankOrder: number;
  currentUserRankId?: number;
  isSovereign?: boolean;
  currentUserName: string;
}

export default function ChangeRankModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  currentUserRankOrder,
  currentUserRankId,
  isSovereign = false,
  currentUserName,
}: ChangeRankModalProps) {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [selectedRankId, setSelectedRankId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCodes, setConfirmationCodes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchRanks();
      setSelectedRankId(null);
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const fetchRanks = async () => {
    try {
      const response = await fetch('/api/ranks');
      if (!response.ok) return;
      const data = await response.json();
      setRanks(data.ranks || []);
    } catch (err) {
      console.error('Error fetching ranks:', err);
    }
  };

  const availableRanks = ranks.filter((rank) => {
    if (currentUserRankOrder <= 3) return true;
    if (isSovereign && currentUserRankId) return rank.id === currentUserRankId;
    return false;
  });

  const selectedRank = selectedRankId ? ranks.find((r) => r.id === selectedRankId) : null;
  const isFormComplete = selectedRankId !== null && reason.trim().length >= 10;
  const hasChanges = selectedRankId !== user.rankId;

  const handlePreview = () => {
    if (!isFormComplete || !hasChanges) return;
    const code = generateConfirmationCode();
    setConfirmationCodes([code]);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!selectedRankId) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankId: selectedRankId,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar el rango');
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
    if (!selectedRank) return '';
    const action = selectedRank.order < user.rank.order ? 'ascendido' : 'descendido';
    return `${user.habboName} fue ${action} de ${user.rank.name} a ${selectedRank.name} por ${currentUserName}.`;
  };

  if (!isOpen) return null;

  return (
    <>
      <AdminModal
        isOpen={isOpen && !showConfirmation}
        onClose={onClose}
        title="Cambiar Rango"
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
                  Rango Actual: {user.rank.name}
                </p>
              </div>
            </div>
          </div>

          {/* Rank Selection */}
          <div>
            <label className="block text-white font-['Rajdhani'] font-semibold mb-2">
              Nuevo Rango:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableRanks.map((rank) => (
                <button
                  key={rank.id}
                  onClick={() => setSelectedRankId(rank.id)}
                  disabled={rank.id === user.rankId}
                  className={`p-3 border-2 rounded transition-all text-left ${
                    selectedRankId === rank.id
                      ? 'bg-[#3B82F6]/20 border-[#3B82F6]'
                      : rank.id === user.rankId
                      ? 'bg-[#1a1a1a] border-[#3B82F6]/10 opacity-50 cursor-not-allowed'
                      : 'bg-[#1a1a1a] border-[#3B82F6]/30 hover:border-[#3B82F6]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RankIcon iconIdentifier={rank.icon} style={{ fontSize: '1.5rem' }} />
                    <div>
                      <p className="font-['Rajdhani'] text-white font-semibold">
                        {rank.name}
                      </p>
                      <p className="font-['Rajdhani'] text-[#3B82F6]/70 text-xs">
                        Nivel {rank.order}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
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
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#3B82F6]/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-[#3B82F6] transition-colors resize-none"
              rows={4}
              placeholder="Ejemplo: Promoción por buen desempeño en eventos..."
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
            disabled={!isFormComplete || !hasChanges}
            className={`flex-1 px-4 py-2 border-2 font-['Rajdhani'] font-semibold rounded transition-colors ${
              isFormComplete && hasChanges
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
        title="Confirmar Cambio de Rango"
        previewMessage={getPreviewMessage()}
        confirmationCodes={confirmationCodes}
        isLoading={isLoading}
      />
    </>
  );
}
