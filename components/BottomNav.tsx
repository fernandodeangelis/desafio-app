import React from 'react';
import { Users, Swords, ScrollText, UserCog, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEncargado: boolean;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isEncargado, isAdmin }) => {
  const navItemClass = (tab: string) => 
    `flex flex-col items-center justify-center p-2 w-full transition-colors ${activeTab === tab ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        <button onClick={() => setActiveTab('participants')} className={navItemClass('participants')}>
          <Users size={20} />
          <span className="text-[10px] mt-1 font-medium">Participantes</span>
        </button>
        
        <button onClick={() => setActiveTab('mano-mano')} className={navItemClass('mano-mano')}>
          <Swords size={20} />
          <span className="text-[10px] mt-1 font-medium">Retos</span>
        </button>

        <button onClick={() => setActiveTab('log')} className={navItemClass('log')}>
          <ScrollText size={20} />
          <span className="text-[10px] mt-1 font-medium">Log</span>
        </button>

        {isEncargado && (
          <button onClick={() => setActiveTab('encargado')} className={navItemClass('encargado')}>
            <UserCog size={20} />
            <span className="text-[10px] mt-1 font-medium">Encargado</span>
          </button>
        )}

        {isAdmin && (
          <button onClick={() => setActiveTab('admin')} className={navItemClass('admin')}>
            <Settings size={20} />
            <span className="text-[10px] mt-1 font-medium">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
};