import React, { createContext, useContext, useState, useCallback } from "react";

const GUEST_KEY = "swadesh_guest_mode";

interface GuestContextType {
    isGuest: boolean;
    enableGuest: () => void;
    disableGuest: () => void;
}

const GuestContext = createContext<GuestContextType>({
    isGuest: false,
    enableGuest: () => { },
    disableGuest: () => { },
});

export function GuestProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem(GUEST_KEY) === "true");

    const enableGuest = useCallback(() => {
        localStorage.setItem(GUEST_KEY, "true");
        setIsGuest(true);
    }, []);

    const disableGuest = useCallback(() => {
        localStorage.removeItem(GUEST_KEY);
        setIsGuest(false);
    }, []);

    return (
        <GuestContext.Provider value={{ isGuest, enableGuest, disableGuest }}>
            {children}
        </GuestContext.Provider>
    );
}

export function useGuestMode(): GuestContextType {
    return useContext(GuestContext);
}
