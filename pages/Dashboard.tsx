import React, { useState, useEffect } from 'react';
import { Group, Participant, User } from '../types';
import { getParticipants, checkAndProcessWeekClosing } from '../services/mockDataService';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { ParticipantsView } from '../views/ParticipantsView';
import { ManoManoView } from '../views/ManoManoView';
import { LogView } from '../views/LogView';
import { EncargadoView } from '../views/EncargadoView';
import { AdminView } from '../views/AdminView';

interface DashboardProps {
  user: User;
  group: Group;
  allUsers: User[]; // Passed for resolving names
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, group, allUsers, onBack }) => {
  const [activeTab, setActiveTab] = useState('participants');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // 1. Check if we need to close previous week automatically
    const runChecks = async () => {
        const result = await checkAndProcessWeekClosing(group.id);
        if (result.processed) {
            handleRefresh(); // Refresh data if fines were applied
        }
    };
    runChecks();
  }, [group.id]);

  useEffect(() => {
    getParticipants(group.id).then(setParticipants);
  }, [group.id, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const isEncargado = group.encargadoId === user.id;
  const isAdmin = group.adminId === user.id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header group={group} participants={participants} users={allUsers} />
      
      <main className="flex-grow p-4 container mx-auto max-w-lg">
        <button onClick={onBack} className="text-xs text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1">
            ← Volver a mis grupos
        </button>

        {activeTab === 'participants' && <ParticipantsView participants={participants} currentUser={user} groupId={group.id} />}
        {activeTab === 'mano-mano' && (
            <ManoManoView 
                participants={participants} 
                currentUser={user} 
                groupId={group.id} 
                isEncargado={isEncargado}
                onRefresh={handleRefresh}
            />
        )}
        {activeTab === 'log' && <LogView groupId={group.id} />}
        {activeTab === 'encargado' && isEncargado && <EncargadoView group={group} participants={participants} currentUser={user} onRefresh={handleRefresh} />}
        {activeTab === 'admin' && isAdmin && <AdminView group={group} participants={participants} onRefresh={handleRefresh} />}
      </main>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isEncargado={isEncargado}
        isAdmin={isAdmin}
      />
    </div>
  );
};