import React, { createContext, useContext, useState } from "react";

// Luodaan uusi konteksti, jonka kautta jaetaan kirjautumistiedot
const AuthContext = createContext();

// AuthProvider tarjoaa kirjautumistiedot sovelluksen muille komponenteille
export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null); // Käyttäjän access token
  const [userId, setUserId] = useState(null); // Käyttäjän ID (oid tokenista)
  const [selectedRole, setSelectedRole] = useState(null); // Valittu rooli rekisteröityessä

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        userId,
        setUserId,
        selectedRole,
        setSelectedRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook helpompaan käyttöön muissa komponenteissa: esim. const { userId } = useAuth();
export const useAuth = () => useContext(AuthContext);
