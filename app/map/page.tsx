"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { BackendMap, BackendState } from "../backend-contracts";
import { BACKEND_URL } from "../backend-url";
import { useCurrentUser, useSocket } from "../SocketProvider";
import TemporaryMovementForm from "./TemporaryMovementForm";
import TemporarySensorForm from "./TemporarySensorForm";

export default function MapPage() {
  const router = useRouter();
  const socket = useSocket();
  const { currentUser, setCurrentUser } = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [backendState, setBackendState] = useState<BackendState | null>(null);
  const [mapData, setMapData] = useState<BackendMap | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [socketStatus, setSocketStatus] = useState(
    socket.connected ? "Connected" : "Connecting",
  );
  const currentUsername = currentUser?.username;

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${BACKEND_URL}/api/map`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Map request failed (${response.status})`);
        }

        return (await response.json()) as BackendMap;
      })
      .then((data) => {
        setMapData(data);
        setMapError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMapError("Unable to load map data. Check the backend connection.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingMap(false);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleStateUpdate = (nextState: BackendState) => {
      setBackendState(nextState);

      if (!currentUsername) {
        return;
      }

      const normalizedUsername = currentUsername.toLowerCase();
      const matchingUser = nextState.loggedInUsers.find(
        (user) => user.username.toLowerCase() === normalizedUsername,
      );

      if (!matchingUser) {
        return;
      }

      setCurrentUser((previousUser) => {
        if (
          !previousUser ||
          previousUser.username.toLowerCase() !== normalizedUsername ||
          (previousUser.location.x === matchingUser.location.x &&
            previousUser.location.y === matchingUser.location.y)
        ) {
          return previousUser;
        }

        return { ...previousUser, location: matchingUser.location };
      });
    };

    const handleConnect = () => setSocketStatus("Connected");
    const handleDisconnect = () => setSocketStatus("Disconnected");

    socket.on("state:update", handleStateUpdate);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("state:update", handleStateUpdate);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [currentUsername, setCurrentUser, socket]);

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
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Map</h1>
            <p className="text-sm text-gray-500" role="status">
              Backend: {socketStatus}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-blue-500 text-white p-2 rounded-(--rounded-corners) hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>

        <section className="rounded-(--rounded-corners) border border-gray-300 p-4">
          <h2 className="text-lg font-medium">Current user</h2>
          <p>{currentUser.username}</p>
          <p className="text-sm text-gray-500">
            Color: {currentUser.avatarColor}
          </p>
          <p className="text-sm text-gray-500">
            Position: {currentUser.location.x}, {currentUser.location.y}
          </p>
        </section>

        <TemporaryMovementForm />
        <TemporarySensorForm />

        <section
          className="rounded-(--rounded-corners) border border-gray-300 p-4"
          aria-live="polite"
        >
          <h2 className="text-lg font-medium">Live backend state</h2>
          {backendState ? (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium">Logged-in users</h3>
                {backendState.loggedInUsers.length ? (
                  <ul className="mt-2 space-y-2">
                    {backendState.loggedInUsers.map((user) => (
                      <li key={user.username} className="text-sm">
                        <span className="font-medium">{user.username}</span>
                        {" | "}
                        {user.location.x}, {user.location.y}
                        {" | "}
                        {user.avatarColor}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    No logged-in users
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-medium">Anonymous presences</h3>
                {backendState.anonymousPresences.length ? (
                  <ul className="mt-2 space-y-2">
                    {backendState.anonymousPresences.map((presence) => (
                      <li key={presence.zone_id} className="text-sm">
                        <span className="font-medium">{presence.zone_id}</span>
                        {" | "}
                        {presence.occupancy_count} present
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    No sensor presence data
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500" role="status">
              Waiting for the first state update...
            </p>
          )}
        </section>

        <section className="rounded-(--rounded-corners) border border-gray-300 p-4">
          <h2 className="text-lg font-medium">Map data</h2>
          {mapError ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {mapError}
            </p>
          ) : isLoadingMap ? (
            <p className="mt-2 text-sm text-gray-500" role="status">
              Loading map data...
            </p>
          ) : (
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs">
              {JSON.stringify(mapData, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </main>
  );
}
