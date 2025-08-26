import React, { createContext, useContext, useState } from "react";

// Konteksti kirjautumistiedolle ja käyttäjäprofiilille
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Tallennetaan profiilitiedot

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        userId,
        setUserId,
        selectedRole,
        setSelectedRole,
        userProfile,
        setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
