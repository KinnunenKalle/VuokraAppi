import React, { createContext, useContext, useState } from "react";

// Luodaan konteksti
const AuthContext = createContext();

// Provider, joka tarjoaa arvot koko sovellukselle
export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null); // JWT-token
  const [userId, setUserId] = useState(null); // Käyttäjän OID
  const [selectedRole, setSelectedRole] = useState(null); // ✅ Roolivalinta (Landlord / Tenant)

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        userId,
        setUserId,
        selectedRole,
        setSelectedRole, // ✅ Tarjotaan myös setter roolille
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook käyttöön komponenttien sisällä
export const useAuth = () => useContext(AuthContext);
