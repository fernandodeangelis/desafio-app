import React, { useState, useEffect } from 'react';
import { Participant, Challenge } from '../types';
import { createManoMano, getChallenges, updateChallengeStatus } from '../services/mockDataService';
import { Swords, Check, X, Trophy } from 'lucide-react';

interface Props {
  participants: Participant[];
  currentUser: any;
  groupId: string;
  isEncargado: boolean;
  onRefresh: () => void; // Added prop
}

export const ManoManoView: React.FC<Props> = ({ participants, currentUser, groupId, isEncargado, onRefresh }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  
  // Form State
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(500);

  useEffect(() => {
    load();
  }, [groupId]);

  const load = async () => {
    const data = await getChallenges(groupId);
    setChallenges(data.reverse());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const opponent = participants.find(p => p.userId === selectedOpponent);
    if (!opponent) return;

    await createManoMano({
        groupId,
        challengerId: currentUser.id,
        challengerName: currentUser.username,
        challengedId: opponent.userId,
        challengedName: opponent.username,
        description,
        fineAmount: amount
    });
    setShowCreate(false);
    load();
    onRefresh(); // Trigger refresh to show log or updates
  };

  const handleResponse = async (id: string, accept: boolean) => {
    await updateChallengeStatus(id, accept ? 'ACCEPTED' : 'REJECTED', groupId);
    load();
    onRefresh(); // Trigger refresh
  };

  const handleResolution = async (challenge: Challenge, winnerId: string) => {
    if (!isEncargado) return;
    const loserId = winnerId === challenge.challengerId ? challenge.challengedId : challenge.challengerId;
    const status = winnerId === challenge.challengerId ? 'COMPLETED_CHALLENGER_WON' : 'COMPLETED_CHALLENGED_WON';
    
    // This updates the backend/localstorage fine
    await updateChallengeStatus(challenge.id, status, groupId, challenge.fineAmount, loserId);
    
    load();
    onRefresh(); // Trigger refresh in parent to update Total Pot (Pozo)
  };

  return (
    <div className="pb-20">
        <button 
            onClick={() => setShowCreate(true)}
            className="w-full mb-6 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md"
        >
            <Swords size={20} /> Crear Nuevo Reto
        </button>

        <div className="space-y-4">
            {challenges.map(c => {
                const isMyChallenge = c.challengedId === currentUser.id;
                const isPending = c.status === 'PENDING';
                const isAccepted = c.status === 'ACCEPTED';
                const isCompleted = c.status.startsWith('COMPLETED');
                
                let borderColor = 'border-purple-100';
                if (isCompleted) borderColor = 'border-slate-200 bg-slate-50 opacity-75';

                return (
                    <div key={c.id} className={`bg-white p-4 rounded-xl border-2 ${borderColor} shadow-sm`}>
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <span className="text-purple-600">{c.challengerName}</span> vs <span className="text-orange-600">{c.challengedName}</span>
                             </h4>
                             <span className="text-xs px-2 py-1 bg-slate-100 rounded-full font-medium text-slate-500">
                                ${c.fineAmount}
                             </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3 italic">"{c.description}"</p>
                        
                        {/* Actions for Challenged */}
                        {isPending && isMyChallenge && (
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handleResponse(c.id, false)} className="flex-1 bg-red-100 text-red-700 py-1 rounded text-xs font-bold">Rechazar</button>
                                <button onClick={() => handleResponse(c.id, true)} className="flex-1 bg-green-100 text-green-700 py-1 rounded text-xs font-bold">Aceptar</button>
                            </div>
                        )}
                        {isPending && !isMyChallenge && (
                             <div className="text-xs text-center bg-yellow-50 text-yellow-700 py-1 rounded">Esperando respuesta...</div>
                        )}

                        {/* Actions for Encargado */}
                        {isAccepted && isEncargado && (
                            <div className="mt-3 border-t pt-3">
                                <p className="text-xs font-bold text-slate-400 mb-2 uppercase text-center">Definir Ganador</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleResolution(c, c.challengerId)} className="flex-1 border border-purple-200 hover:bg-purple-50 text-purple-700 py-2 rounded text-xs">Gana {c.challengerName}</button>
                                    <button onClick={() => handleResolution(c, c.challengedId)} className="flex-1 border border-orange-200 hover:bg-orange-50 text-orange-700 py-2 rounded text-xs">Gana {c.challengedName}</button>
                                </div>
                            </div>
                        )}

                        {isCompleted && (
                             <div className="mt-2 text-center text-xs font-bold text-slate-400 flex justify-center items-center gap-1">
                                <Trophy size={14} /> 
                                Ganador: {c.status === 'COMPLETED_CHALLENGER_WON' ? c.challengerName : c.challengedName}
                             </div>
                        )}
                        {!isCompleted && !isPending && !isEncargado && (
                            <div className="mt-2 text-center text-xs text-green-600 font-medium">Reto Activo</div>
                        )}
                        {!isPending && c.status === 'REJECTED' && (
                             <div className="mt-2 text-center text-xs text-red-400">Rechazado</div>
                        )}
                    </div>
                )
            })}
        </div>

        {showCreate && (
             <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                    <h3 className="text-lg font-bold mb-4">Proponer Mano a Mano</h3>
                    <form onSubmit={handleCreate}>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Rival</label>
                            <select 
                                className="w-full p-2 border rounded"
                                value={selectedOpponent}
                                onChange={e => setSelectedOpponent(e.target.value)}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {participants.filter(p => p.userId !== currentUser.id).map(p => (
                                    <option key={p.userId} value={p.userId}>{p.username}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Desafío</label>
                            <input 
                                className="w-full p-2 border rounded" 
                                placeholder="Ej: Partido de Tenis" 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Multa Extra ($)</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border rounded" 
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-slate-500">Cancelar</button>
                            <button type="submit" className="flex-1 bg-purple-600 text-white rounded font-bold">Lanzar Reto</button>
                        </div>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};