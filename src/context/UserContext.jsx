import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext({
  userDetails: {
    username: "Vatsa Joshi",
    mobile: "+91 1234567898",
    email: "vatsa@example.com",
    profilePhoto: "https://via.placeholder.com/150"
  },
  updateUserDetails: () => {}
});

export function UserProvider({ children }) {
  const [userDetails, setUserDetails] = useState({
    username: "Vatsa Joshi",
    mobile: "+91 1234567898",
    email: "vatsa@example.com",
    profilePhoto: "https://via.placeholder.com/150"
  });

  const updateUserDetails = (newDetails) => {
    setUserDetails(newDetails);
  };

  return (
    <UserContext.Provider value={{ userDetails, updateUserDetails }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
