import { User, Group, Participant, Evidence, Challenge, LogEntry, EvidenceStatus } from '../types';

const API_URL = '/api';

// Helper to get headers with token
const getHeaders = (isMultipart = false) => {
    const token = localStorage.getItem('ds_token');
    const headers: any = {
        'Authorization': `Bearer ${token}`
    };
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

// --- Date Helpers (Kept for frontend utility) ---

export const getWeekId = (date: Date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const weekNo = Math.ceil((((d.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / 86400000) + 1) / 7);
  return `${year}-W${weekNo}`;
};

export const getCurrentWeekLabel = () => {
  const date = new Date();
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
  start.setDate(diff);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${start.getDate()} de ${months[start.getMonth()]} al ${end.getDate()} de ${months[end.getMonth()]}`;
};

// --- Auth Services ---

export const login = async (username: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    const data = await res.json();
    localStorage.setItem('ds_token', data.token);
    return data.user;
};

export const register = async (username: string, email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) throw new Error('Error al registrar');
    const data = await res.json();
    localStorage.setItem('ds_token', data.token);
    return data.user;
};

// --- Group Services ---

export const getUserGroups = async (userId: string): Promise<Group[]> => {
    const res = await fetch(`${API_URL}/groups?userId=${userId}`, { headers: getHeaders() });
    return res.json();
};

export const createGroup = async (userId: string, groupName: string): Promise<Group> => {
    const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, name: groupName })
    });
    return res.json();
};

export const joinGroup = async (userId: string, code: string): Promise<Group> => {
    const res = await fetch(`${API_URL}/groups/join`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, code })
    });
    if (!res.ok) throw new Error('Código inválido o ya eres miembro');
    return res.json();
};

// --- Participant Services ---

export const getParticipants = async (groupId: string): Promise<Participant[]> => {
    const res = await fetch(`${API_URL}/participants?groupId=${groupId}`, { headers: getHeaders() });
    return res.json();
};

export const updateParticipant = async (groupId: string, userId: string, updates: Partial<Participant>) => {
    await fetch(`${API_URL}/participants`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ groupId, userId, updates })
    });
};

// --- Evidence Services ---

export const getEvidence = async (groupId: string): Promise<Evidence[]> => {
    const res = await fetch(`${API_URL}/evidence?groupId=${groupId}`, { headers: getHeaders() });
    return res.json();
};

export const uploadEvidence = async (groupId: string, userId: string, username: string, description: string, imageFile: File | null) => {
    const formData = new FormData();
    formData.append('groupId', groupId);
    formData.append('userId', userId);
    formData.append('username', username);
    formData.append('description', description);
    if (imageFile) formData.append('image', imageFile);

    await fetch(`${API_URL}/evidence`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
    });
};

export const reviewEvidence = async (evidenceId: string, status: EvidenceStatus, reviewerName: string) => {
    await fetch(`${API_URL}/evidence/${evidenceId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, reviewerName })
    });
};

// --- Log Services ---

export const getLogs = async (groupId: string): Promise<LogEntry[]> => {
    const res = await fetch(`${API_URL}/logs?groupId=${groupId}`, { headers: getHeaders() });
    return res.json();
};

export const addLog = async (groupId: string, message: string, type: LogEntry['type']) => {
    // Logs are mostly handled by backend now, this is kept for compatibility if frontend needs to force log
    // Currently backend handles logs for actions. We can leave this empty or impelment an endpoint.
};

// --- Admin/Encargado Actions ---

export const updateGroupFine = async (groupId: string, amount: number) => {
    await fetch(`${API_URL}/groups/${groupId}/fine`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ amount })
    });
};

export const createManoMano = async (challenge: Omit<Challenge, 'id' | 'status'>) => {
    await fetch(`${API_URL}/challenges`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(challenge)
    });
};

export const getChallenges = async (groupId: string): Promise<Challenge[]> => {
    const res = await fetch(`${API_URL}/challenges?groupId=${groupId}`, { headers: getHeaders() });
    return res.json();
};

export const updateChallengeStatus = async (challengeId: string, status: Challenge['status'], groupId: string, fineAmount?: number, loserId?: string) => {
    await fetch(`${API_URL}/challenges/${challengeId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, fineAmount, loserId })
    });
};

// --- Automatic Week Closing Service ---

export const checkAndProcessWeekClosing = async (groupId: string) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/check-week`, {
        method: 'POST',
        headers: getHeaders()
    });
    return res.json();
};
