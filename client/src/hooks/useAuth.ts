import { useQuery } from "@tanstack/react-query";
import { useGuestMode } from "@/lib/guest-context";

export { GuestProvider, useGuestMode } from "@/lib/guest-context";

export function disableGuestMode() {
  localStorage.removeItem("swadesh_guest_mode");
}

export function useAuth() {
  const { isGuest } = useGuestMode();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !isGuest,
  });

  const guestUser = isGuest
    ? {
      id: "guest",
      firstName: "Guest",
      lastName: "User",
      email: null,
      profileImageUrl: null,
      setupCompleted: true,
      isGuest: true,
    }
    : null;

  return {
    user: guestUser ?? user,
    isLoading: isGuest ? false : isLoading,
    isAuthenticated: isGuest || !!user,
    isGuest,
  };
}
