"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { io, type Socket } from "socket.io-client";
import { BACKEND_URL } from "./backend-url";
import type { CurrentUser } from "./backend-contracts";

export type { CurrentUser } from "./backend-contracts";

const SocketContext = createContext<Socket | null>(null);
const UserContext = createContext<{
  currentUser: CurrentUser | null;
  setCurrentUser: Dispatch<SetStateAction<CurrentUser | null>>;
} | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket] = useState<Socket>(() =>
    io(BACKEND_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
    }),
  );

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const onConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const onConnectError = (error: Error) => {
      console.error("Socket connect_error:", error.message);
    };

    const onDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason);
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      <UserContext.Provider value={{ currentUser, setCurrentUser }}>
        {children}
      </UserContext.Provider>
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);

  if (!socket) {
    throw new Error("useSocket must be used inside a SocketProvider");
  }

  return socket;
}

export function useCurrentUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used inside a SocketProvider");
  }

  return context;
}
