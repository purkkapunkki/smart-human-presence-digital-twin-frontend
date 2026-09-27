"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrentUser, useSocket } from "../SocketProvider";

export default function MapPage() {
  const router = useRouter();
  const socket = useSocket();
  const { currentUser, setCurrentUser } = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);

    if (socket.connected) {
      socket.emit("logout");
    }

    setCurrentUser(null);
    socket.disconnect();
    router.replace("/");
  };

  if (isLoggingOut) {
    return null;
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-md w-full rounded-(--rounded-corners) border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-semibold text-red-700">Access denied</h1>
          <p className="mt-2 text-red-600">
            You must log in before opening the map.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-500 text-white p-2 rounded-(--rounded-corners) hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Go to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Map</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-blue-500 text-white p-2 rounded-(--rounded-corners) hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>

        <div className="rounded-(--rounded-corners) border border-gray-300 p-4">
          <p className="text-sm text-gray-500">Current user</p>
          <p className="text-lg font-medium">{currentUser.username}</p>
          <p className="text-sm text-gray-500">
            Color: {currentUser.avatarColor}
          </p>
          <p className="text-sm text-gray-500">
            Position: {currentUser.location.x}, {currentUser.location.y}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Map rendering is coming soon.
          </p>
        </div>
      </div>
    </main>
  );
}
