"use client"

import { AccountApiRequest } from "@/api-request/account";
import { AdminAccount } from "@/types/account";
import React, { createContext, useContext, useEffect, useState } from "react";

interface CurrentUserContextType {
  currentUser: AdminAccount | null;
  loading: boolean;
  setCurrentUser: (user: AdminAccount | null) => void;
}

const CurrentUserContext = createContext<CurrentUserContextType | null>(null);

export default function CurrentUserProvider ({children}: {children: React.ReactNode}){
    const [currentUser, setCurrentUser] = useState<AdminAccount | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
      try {
        setLoading(true);
        const response = await AccountApiRequest.getMe("");

        if(response.status === 200 && response.payload.success){
            setCurrentUser(response.payload.data);
        }
        else {
            setCurrentUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

     useEffect(() => {
       refreshUser();
     }, []);

    return (
        <CurrentUserContext.Provider value={{currentUser, setCurrentUser, loading}}>
            {children}
        </CurrentUserContext.Provider>
    )
}

export const useCurrentUser = () => {
    const currentUserContext = useContext(CurrentUserContext);

    if (!currentUserContext) {
        throw new Error(
            "useCurrentUser must be used within <CurrentUserContext.Provider>"
        );
    }

    return currentUserContext;   
};