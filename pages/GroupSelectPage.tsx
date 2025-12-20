import React, { useState, useEffect } from 'react';
import { User, Group } from '../types';
import { getUserGroups, createGroup, joinGroup } from '../services/mockDataService';
import { PlusCircle, LogIn, Users } from 'lucide-react';

interface Props {
  user: User;
  onSelectGroup: (group: Group) => void;
  onLogout: () => void;
}

export const GroupSelectPage: React.FC<Props> = ({ user, onSelectGroup, onLogout }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const data = await getUserGroups(user.id);
    setGroups(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await createGroup(user.id, inputVal);
        setInputVal('');
        setShowCreate(false);
        loadGroups();
    } catch (err) {
        setError('Error al crear grupo');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await joinGroup(user.id, inputVal);
        setInputVal('');
        setShowJoin(false);
        loadGroups();
    } catch (err: any) {
        setError(err.message || 'Error al unirse');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Mis Desafíos</h1>
            <button onClick={onLogout} className="text-sm text-red-500 font-medium">Salir</button>
        </div>

        {loading ? (
            <div className="text-center py-10 text-slate-400">Cargando...</div>
        ) : (
            <div className="space-y-4 mb-8">
                {groups.length === 0 && (
                    <div className="bg-white p-6 rounded-xl text-center shadow-sm">
                        <Users className="mx-auto text-slate-300 mb-2" size={48} />
                        <p className="text-slate-500">No perteneces a ningún grupo aún.</p>
                    </div>
                )}
                {groups.map(g => (
                    <button 
                        key={g.id}
                        onClick={() => onSelectGroup(g)}
                        className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:border-teal-400 transition-colors text-left"
                    >
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{g.name}</h3>
                            <p className="text-xs text-slate-500">Código: {g.code}</p>
                        </div>
                        <div className="text-teal-600">
                            →
                        </div>
                    </button>
                ))}
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => { setShowCreate(true); setShowJoin(false); setInputVal(''); setError(''); }}
                className="bg-slate-800 text-white p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-slate-700 transition"
            >
                <PlusCircle />
                <span className="font-medium text-sm">Nuevo Grupo</span>
            </button>
            <button 
                onClick={() => { setShowJoin(true); setShowCreate(false); setInputVal(''); setError(''); }}
                className="bg-teal-600 text-white p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-teal-700 transition"
            >
                <LogIn />
                <span className="font-medium text-sm">Unirse</span>
            </button>
        </div>

        {/* Modals */}
        {(showCreate || showJoin) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
                    <h3 className="text-lg font-bold mb-4">{showCreate ? 'Crear Nuevo Grupo' : 'Unirse a Grupo'}</h3>
                    <form onSubmit={showCreate ? handleCreate : handleJoin}>
                        <input 
                            className="w-full border border-slate-300 p-3 rounded-lg mb-4 outline-none focus:border-teal-500"
                            placeholder={showCreate ? "Nombre del Desafío" : "Código de Invitación"}
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value.toUpperCase())}
                            required
                        />
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="flex gap-3">
                            <button type="button" onClick={() => { setShowCreate(false); setShowJoin(false); }} className="flex-1 text-slate-500 py-2">Cancelar</button>
                            <button type="submit" className="flex-1 bg-teal-600 text-white rounded-lg py-2 font-bold">
                                {showCreate ? 'Crear' : 'Unirse'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};