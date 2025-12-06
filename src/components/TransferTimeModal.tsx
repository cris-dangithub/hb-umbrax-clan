'use client';

import { useState, useEffect } from 'react';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import HabboAvatar from './HabboAvatar';
import AdminModal from './AdminModal';
import ConfirmationModal from './ConfirmationModal';
import { generateConfirmationCode } from '@/lib/confirmation';

interface User {
  id: string;
  habboName: string;
  avatarUrl: string;
  rank: {
    name: string;
    order: number;
  };
  isSovereign: boolean;
}

interface TransferTimeModalProps {
  session: {
    id: string;
    subjectUser: {
      habboName: string;
      avatarUrl: string;
    };
    currentSupervisor: {
      id: string;
      habboName: string;
    } | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferTimeModal({ session, onClose, onSuccess }: TransferTimeModalProps) {
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCodes, setConfirmationCodes] = useState<string[]>([]);

  useEffect(() => {
    // Fetch usuarios que pueden ser supervisores (Cúpula + Soberanos)
    const fetchSupervisors = async () => {
      try {
        const response = await fetch('/api/admin/users?limit=100');
        if (response.ok) {
          const data = await response.json();
          const eligibleSupervisors = data.data.filter((user: User) => {
            const isCupula = user.rank.order <= 3;
            const isSovereign = user.isSovereign;
            return (isCupula || isSovereign) && user.id !== session.currentSupervisor?.id;
          });
          setSupervisors(eligibleSupervisors);
        }
      } catch (error) {
        console.error('Error fetching supervisors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisors();
  }, [session.currentSupervisor?.id]);

  const isFormValid = selectedSupervisor !== '';
  const selectedUser = supervisors.find(s => s.id === selectedSupervisor);

  const handlePreview = () => {
    if (!isFormValid) return;
    const code = generateConfirmationCode();
    setConfirmationCodes([code]);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!selectedSupervisor) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/time-sessions/${session.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newSupervisorId: selectedSupervisor,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al transferir supervisor');
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
    if (!selectedUser) return '';
    return `Supervisor transferido de ${session.currentSupervisor?.habboName || 'N/A'} a ${selectedUser.habboName} para la sesión de ${session.subjectUser.habboName}.`;
  };

  return (
    <>
      <AdminModal
        isOpen={!showConfirmation}
        onClose={onClose}
        title="Transferir Supervisor"
        headerBgColor="rgba(204, 147, 59, 0.95)"
        borderColor="#CC933B"
      >
        <div className="space-y-6">
          {/* Session Info */}
          <div className="p-4 bg-[#1a1a1a] border border-[#CC933B]/30 rounded">
            <p className="text-[#CC933B] font-['Rajdhani']">
              Transfiriendo supervisión del súbdito:{' '}
              <span className="font-bold">{session.subjectUser.habboName}</span>
            </p>
            {session.currentSupervisor && (
              <p className="mt-2 text-white/70 font-['Rajdhani'] text-sm">
                Supervisor actual: {session.currentSupervisor.habboName}
              </p>
            )}
          </div>

          {/* Supervisor Selector */}
          <div>
            <label className="block text-[#CC933B] font-['Rajdhani'] font-semibold mb-2 text-sm">
              <ArrowRightLeft className="inline w-4 h-4 mr-1" />
              Nuevo Supervisor *
            </label>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin" size={24} style={{ color: '#CC933B' }} />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {supervisors.map(supervisor => (
                  <label
                    key={supervisor.id}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                    style={{
                      backgroundColor: selectedSupervisor === supervisor.id 
                        ? 'rgba(204, 147, 59, 0.2)' 
                        : '#1a1a1a',
                      border: selectedSupervisor === supervisor.id 
                        ? '2px solid #CC933B' 
                        : '1px solid rgba(204, 147, 59, 0.3)',
                    }}
                  >
                    <input
                      type="radio"
                      name="supervisor"
                      value={supervisor.id}
                      checked={selectedSupervisor === supervisor.id}
                      onChange={(e) => setSelectedSupervisor(e.target.value)}
                      className="w-4 h-4"
                    />
                    <HabboAvatar 
                      src={supervisor.avatarUrl}
                      alt={supervisor.habboName}
                      size={48}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-[#CC933B] font-['Rajdhani']">
                        {supervisor.habboName}
                      </p>
                      <p className="text-sm text-white/70 font-['Rajdhani']">
                        {supervisor.rank.name}
                        {supervisor.isSovereign && ' (Soberano)'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-[#CC933B] font-['Rajdhani'] font-semibold mb-2 text-sm">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#CC933B]/30 rounded text-white font-['Rajdhani'] focus:outline-none focus:border-[#CC933B] transition-colors resize-none"
              rows={3}
              placeholder="Motivo de la transferencia..."
            />
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
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border-2 border-[#CC933B]/30 text-white font-['Rajdhani'] font-semibold rounded hover:bg-[#CC933B]/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePreview}
            disabled={!isFormValid}
            className={`flex-1 px-4 py-2 border-2 font-['Rajdhani'] font-semibold rounded transition-colors ${
              isFormValid
                ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                : 'bg-[#1a1a1a] border-[#CC933B]/30 text-white/50 cursor-not-allowed'
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
        title="Confirmar Transferencia"
        previewMessage={getPreviewMessage()}
        confirmationCodes={confirmationCodes}
        isLoading={isLoading}
      />
    </>
  );
}
