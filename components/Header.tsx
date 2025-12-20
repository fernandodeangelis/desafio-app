import React from 'react';
import { Group, Participant, User } from '../types';
import { Wallet, Calendar, ShieldAlert, Crown } from 'lucide-react';
import { getCurrentWeekLabel } from '../services/mockDataService';

interface HeaderProps {
  group: Group;
  participants: Participant[];
  users: User[]; // Needed to resolve names for Encargado
}

export const Header: React.FC<HeaderProps> = ({ group, participants, users }) => {
  // Ensure we are adding numbers, defaulting to 0 if undefined/null
  const totalPot = participants.reduce((acc, p) => acc + (Number(p.accumulatedFine) || 0), 0);
  const encargadoName = users.find(u => u.id === group.encargadoId)?.username || 'Desconocido';
  const weekLabel = getCurrentWeekLabel();

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold text-teal-400 truncate max-w-[200px]">
                {group.name}
            </h1>
            <div className="text-xs text-slate-400 flex flex-col items-end">
                <span>{new Date().toLocaleDateString()}</span>
                <span className="font-semibold text-teal-200">{weekLabel}</span>
            </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
          <div className="bg-slate-800 p-2 rounded-lg flex flex-col items-center justify-center border border-slate-700 shadow-inner">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
                <Wallet size={14} /> <span>Pozo</span>
            </div>
            <span className="font-bold text-green-400 text-lg">${totalPot}</span>
          </div>

          <div className="bg-slate-800 p-2 rounded-lg flex flex-col items-center justify-center border border-slate-700">
            <div className="flex items-center gap-1 text-slate-400 mb-1">
                <ShieldAlert size={14} /> <span>Multa</span>
            </div>
            <span className="font-bold text-red-400 text-lg">${group.currentFineAmount}</span>
          </div>

          <div className="bg-slate-800 p-2 rounded-lg flex flex-col items-center justify-center border border-slate-700">
             <div className="flex items-center gap-1 text-slate-400 mb-1">
                <Crown size={14} /> <span>Encargado</span>
            </div>
            <span className="font-bold text-yellow-400 truncate w-full text-center">
                {encargadoName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};