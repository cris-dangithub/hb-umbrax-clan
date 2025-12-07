'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { RankIcon } from '@/lib/rank-icons';

interface Rank {
  id: number;
  name: string;
  order: number;
  icon: string;
}

interface RankFilterDropdownProps {
  ranks: Rank[];
  selectedRankId: string;
  onSelectRank: (rankId: string) => void;
}

export default function RankFilterDropdown({
  ranks,
  selectedRankId,
  onSelectRank,
}: RankFilterDropdownProps) {
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

  const handleSelectRank = (rankId: string) => {
    onSelectRank(rankId);
    setIsOpen(false);
  };

  // Find selected rank for display
  const selectedRank = selectedRankId
    ? ranks.find((r) => r.id.toString() === selectedRankId)
    : null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded bg-black/50 text-white border border-[#CC933B]/50 hover:border-[#CC933B] focus:border-[#CC933B] focus:outline-none transition-colors flex items-center gap-2 min-w-[200px] justify-between"
        style={{
          fontFamily: 'Rajdhani, sans-serif',
        }}
      >
        <span className="flex items-center gap-2">
          {selectedRank ? (
            <>
              <RankIcon iconIdentifier={selectedRank.icon} size={16} />
              <span>{selectedRank.name}</span>
            </>
          ) : (
            'Todos los rangos'
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f0f] border-2 border-[#CC933B] rounded-lg shadow-2xl z-50 max-h-[400px] overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CC933B #1a1a1a',
          }}
        >
          {/* Opción "Todos los rangos" */}
          <button
            onClick={() => handleSelectRank('')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#CC933B]/20 transition-colors text-left ${
              !selectedRankId ? 'bg-[#CC933B]/10' : ''
            }`}
          >
            <span
              className="font-['Rajdhani'] font-semibold"
              style={{ color: selectedRankId ? '#ededed' : '#CC933B' }}
            >
              Todos los rangos
            </span>
          </button>

          {/* Lista de rangos */}
          {ranks.map((rank) => (
            <button
              key={rank.id}
              onClick={() => handleSelectRank(rank.id.toString())}
              className={`w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#CC933B]/20 transition-colors text-left border-t border-[#CC933B]/20 ${
                selectedRankId === rank.id.toString() ? 'bg-[#CC933B]/10' : ''
              }`}
            >
              <RankIcon iconIdentifier={rank.icon} size={20} />
              <div className="flex-1">
                <p
                  className="font-['Rajdhani'] font-semibold"
                  style={{
                    color:
                      selectedRankId === rank.id.toString() ? '#CC933B' : '#ededed',
                  }}
                >
                  {rank.name}
                </p>
                <p className="font-['Rajdhani'] text-xs text-white/60">
                  Nivel {rank.order}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
