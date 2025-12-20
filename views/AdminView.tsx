import React, { useState } from 'react';
import { Group, Participant } from '../types';
import { updateParticipant, addLog } from '../services/mockDataService';
import { Trash2, Save } from 'lucide-react';

interface Props {
  group: Group;
  participants: Participant[];
  onRefresh: () => void;
}

export const AdminView: React.FC<Props> = ({ group, participants, onRefresh }) => {
  const [editingFines, setEditingFines] = useState<Record<string, number>>({});

  const handleFineChange = (userId: string, val: string) => {
    setEditingFines(prev => ({ ...prev, [userId]: Number(val) }));
  };

  const saveFine = async (userId: string, oldAmount: number) => {
    const newAmount = editingFines[userId];
    if (newAmount !== undefined && newAmount !== oldAmount) {
        await updateParticipant(group.id, userId, { accumulatedFine: newAmount });
        await addLog(group.id, `Admin ajustó manualmente la multa a $${newAmount}`, 'WARNING');
        onRefresh();
    }
  };

  // Mock remove (only visually for this demo as logic is complex)
  const handleRemove = (username: string) => {
    alert(`En una app real, ${username} sería eliminado del grupo.`);
  };

  return (
    <div className="pb-20">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h3 className="font-bold text-slate-800 mb-2">Código de Invitación</h3>
            <div className="bg-slate-100 p-3 rounded text-center text-2xl font-mono tracking-widest text-slate-600 select-all">
                {group.code}
            </div>
            <p className="text-xs text-center text-slate-400 mt-2">Comparte este código para agregar amigos.</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Gestión de Participantes</h3>
            <div className="space-y-4">
                {participants.map(p => (
                    <div key={p.userId} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">{p.username}</span>
                            <button onClick={() => handleRemove(p.username)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 w-24">Multa Acum.:</span>
                            <input 
                                type="number" 
                                className="w-24 border p-1 rounded text-sm"
                                value={editingFines[p.userId] !== undefined ? editingFines[p.userId] : p.accumulatedFine}
                                onChange={e => handleFineChange(p.userId, e.target.value)}
                            />
                            {editingFines[p.userId] !== undefined && editingFines[p.userId] !== p.accumulatedFine && (
                                <button onClick={() => saveFine(p.userId, p.accumulatedFine)} className="text-teal-600">
                                    <Save size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};