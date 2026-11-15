"use client";

import { useEffect, useRef, useState } from "react";
import type { BackendMap, BackendState } from "./backend-contracts";
import { BACKEND_URL } from "./backend-url";
import { useSocket } from "./SocketProvider";
import MapVisualization from "./map/MapVisualization";
import TemporarySensorForm from "./map/TemporarySensorForm";

export default function Home() {
  const socket = useSocket();
  const [hasConfirmedTracking, setHasConfirmedTracking] = useState(false);
  const [backendState, setBackendState] = useState<BackendState | null>(null);
  const [mapData, setMapData] = useState<BackendMap | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [socketStatus, setSocketStatus] = useState(
    socket.connected ? "Connected" : "Disconnected",
  );
  const mainRef = useRef<HTMLElement>(null);

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
    };

    const handleConnect = () => setSocketStatus("Connected");
    const handleConnectError = () => setSocketStatus("Connection failed");
    const handleDisconnect = () => setSocketStatus("Disconnected");

    socket.on("state:update", handleStateUpdate);
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("state:update", handleStateUpdate);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    if (hasConfirmedTracking) {
      mainRef.current?.focus();
    }
  }, [hasConfirmedTracking]);

  const handleConfirmTracking = () => {
    setSocketStatus(socket.connected ? "Connected" : "Connecting");
    setHasConfirmedTracking(true);

    if (!socket.connected) {
      socket.connect();
    }
  };

  return (
    <>
      <main
        ref={mainRef}
        tabIndex={-1}
        aria-hidden={!hasConfirmedTracking}
        inert={!hasConfirmedTracking}
        className={`min-h-screen p-6 transition-[filter] ${
          hasConfirmedTracking ? "" : "blur-sm"
        }`}
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Map</h1>
            <p className="text-sm text-gray-500" role="status">
              Backend: {socketStatus}
            </p>
          </div>

          <section className="rounded-(--rounded-corners) border border-gray-300 bg-white p-4">
            <h2 className="mb-3 text-lg font-medium">
              {mapData?.name ?? "Floor plan"}
            </h2>
            {mapError ? (
              <p className="text-sm text-red-600" role="alert">
                {mapError}
              </p>
            ) : isLoadingMap ? (
              <p className="text-sm text-gray-500" role="status">
                Loading map data...
              </p>
            ) : mapData ? (
              <MapVisualization
                map={mapData}
                presences={backendState?.anonymousPresences ?? []}
              />
            ) : null}
          </section>

          <TemporarySensorForm />

          <section
            className="rounded-(--rounded-corners) border border-gray-300 p-4"
            aria-live="polite"
          >
            <h2 className="text-lg font-medium">Live backend state</h2>
            {backendState ? (
              <div className="mt-3">
                <h3 className="font-medium">Anonymous presences</h3>
                {backendState.anonymousPresences.length ? (
                  <ul className="mt-2 space-y-2">
                    {backendState.anonymousPresences.map((presence) => (
                      <li
                        key={`${presence.zone_id}:${presence.timestamp}`}
                        className="text-sm"
                      >
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
            ) : (
              <p className="mt-2 text-sm text-gray-500" role="status">
                Waiting for the first state update...
              </p>
            )}
          </section>
        </div>
      </main>

      {!hasConfirmedTracking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracking-dialog-title"
            aria-describedby="tracking-dialog-description"
            className="w-full max-w-md rounded-(--rounded-corners) bg-white p-6 text-center shadow-xl"
          >
            <h2
              id="tracking-dialog-title"
              className="text-xl font-semibold text-gray-900"
            >
              Presence tracking
            </h2>
            <p
              id="tracking-dialog-description"
              className="mt-3 text-gray-700"
            >
              Your presence will be tracked anonymously while this page is open.
            </p>
            <button
              type="button"
              autoFocus
              onClick={handleConfirmTracking}
              className="mt-5 rounded-(--rounded-corners) bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Confirm
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
