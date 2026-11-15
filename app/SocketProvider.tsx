"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { BACKEND_URL } from "./backend-url";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket] = useState<Socket>(() =>
    io(BACKEND_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
    }),
  );

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
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);

  if (!socket) {
    throw new Error("useSocket must be used inside a SocketProvider");
  }

  return socket;
}
