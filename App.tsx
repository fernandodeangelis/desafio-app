import React, { useState, useEffect } from 'react';
import { User, Group } from './types';
import { AuthPage } from './pages/AuthPage';
import { GroupSelectPage } from './pages/GroupSelectPage';
import { Dashboard } from './pages/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Minimal cache for resolving names

  // Basic hydration from local storage if session existed (simplified)
  useEffect(() => {
    // In a real app, check token. Here we check session storage just for reload persistence
    const savedUser = sessionStorage.getItem('ds_session_user');
    if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
    }
    
    // Load all users for name resolution in UI (Encargado display, etc.)
    // In real app this would be an API call or handled differently
    const usersStr = localStorage.getItem('ds_users');
    if (usersStr) setAllUsers(JSON.parse(usersStr));
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('ds_session_user', JSON.stringify(user));
    // Refresh all users list
    const usersStr = localStorage.getItem('ds_users');
    if (usersStr) setAllUsers(JSON.parse(usersStr));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedGroup(null);
    sessionStorage.removeItem('ds_session_user');
  };

  // Rendering Logic based on state
  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (!selectedGroup) {
    return (
        <GroupSelectPage 
            user={currentUser} 
            onSelectGroup={setSelectedGroup} 
            onLogout={handleLogout}
        />
    );
  }

  return (
    <Dashboard 
        user={currentUser} 
        group={selectedGroup} 
        allUsers={allUsers}
        onBack={() => setSelectedGroup(null)} 
    />
  );
};

export default App;