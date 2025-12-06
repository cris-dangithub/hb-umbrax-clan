'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, TrendingUp, Key, Trash2, Crown, Clock } from 'lucide-react';

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

interface ActionDropdownProps {
  user: User;
  currentUserRankOrder: number;
  currentUserRankId?: number;
  isSovereign?: boolean;
  onChangeRank: () => void;
  onChangePassword: () => void;
  onDeleteUser: () => void;
  onManageSovereign: () => void;
  onSendTimeRequest: () => void;
}

export default function ActionDropdown({
  user,
  currentUserRankOrder,
  currentUserRankId,
  isSovereign = false,
  onChangeRank,
  onChangePassword,
  onDeleteUser,
  onManageSovereign,
  onSendTimeRequest,
}: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine permissions
  const isCupula = currentUserRankOrder <= 3;
  const canChangeRank = isCupula || (isSovereign && currentUserRankId !== undefined);
  const canChangePassword = isCupula;
  const canDeleteUser = isCupula;
  
  // Check if target user is Cúpula (can't delete or change password of Cúpula)
  const targetIsCupula = user.rank.order <= 3;
  
  // Only Cúpula can manage rank bosses, but NOT on Cúpula users (ranks 1-3)
  const canManageSovereign = isCupula && !targetIsCupula;
  
  // Time request: Cúpula or Soberanos can send requests to súbditos (ranks 5-10)
  const isTargetSubdito = user.rank.order >= 5 && user.rank.order <= 10;
  const canSendTimeRequest = (isCupula || isSovereign) && isTargetSubdito;

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  // Don't show dropdown if user has no permissions
  if (!canChangeRank && !canChangePassword && !canDeleteUser) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#CC933B] hover:bg-[#CC933B]/10 rounded transition-colors"
        title="Acciones"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0f0f0f] border-2 border-[#CC933B] rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Change Rank */}
          {canChangeRank && (
            <button
              onClick={() => handleAction(onChangeRank)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#CC933B]/20 transition-colors text-left"
            >
              <TrendingUp className="w-5 h-5 text-[#CC933B]" />
              <div>
                <p className="font-['Rajdhani'] font-semibold">Cambiar Rango</p>
                <p className="font-['Rajdhani'] text-xs text-white/60">
                  Ascender o descender usuario
                </p>
              </div>
            </button>
          )}

          {/* Manage Rank Boss - Only for non-Cúpula users */}
          {canManageSovereign && (
            <button
              onClick={() => handleAction(onManageSovereign)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#D97706]/20 transition-colors text-left border-t border-[#CC933B]/20"
            >
              <Crown className="w-5 h-5 text-[#D97706]" />
              <div>
                <p className="font-['Rajdhani'] font-semibold">Gestionar Soberano</p>
                <p className="font-['Rajdhani'] text-xs text-white/60">
                  Nombrar o degradar jefe
                </p>
              </div>
            </button>
          )}

          {/* Send Time Request - For súbditos only */}
          {canSendTimeRequest && (
            <button
              onClick={() => handleAction(onSendTimeRequest)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#3b82f6]/20 transition-colors text-left border-t border-[#CC933B]/20"
            >
              <Clock className="w-5 h-5 text-[#3b82f6]" />
              <div>
                <p className="font-['Rajdhani'] font-semibold">Enviar Solicitud de Time</p>
                <p className="font-['Rajdhani'] text-xs text-white/60">
                  Solicitar time tracking
                </p>
              </div>
            </button>
          )}

          {/* Change Password */}
          {canChangePassword && !targetIsCupula && (
            <button
              onClick={() => handleAction(onChangePassword)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#CC933B]/20 transition-colors text-left border-t border-[#CC933B]/20"
            >
              <Key className="w-5 h-5 text-[#CC933B]" />
              <div>
                <p className="font-['Rajdhani'] font-semibold">Cambiar Contraseña</p>
                <p className="font-['Rajdhani'] text-xs text-white/60">
                  Restablecer acceso
                </p>
              </div>
            </button>
          )}

          {/* Delete User */}
          {canDeleteUser && !targetIsCupula && (
            <button
              onClick={() => handleAction(onDeleteUser)}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/20 transition-colors text-left border-t border-[#CC933B]/20"
            >
              <Trash2 className="w-5 h-5" />
              <div>
                <p className="font-['Rajdhani'] font-semibold">Eliminar Usuario</p>
                <p className="font-['Rajdhani'] text-xs text-red-400/80">
                  Acción permanente
                </p>
              </div>
            </button>
          )}

          {/* No actions available message */}
          {!canChangeRank && !canChangePassword && !canDeleteUser && (
            <div className="px-4 py-3 text-white/60 font-['Rajdhani'] text-sm">
              No hay acciones disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
}
