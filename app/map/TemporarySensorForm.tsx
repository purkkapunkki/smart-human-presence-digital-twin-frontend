"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import type { SensorUpdate } from "../backend-contracts";
import { publishSensorUpdate } from "../socket-publishers";
import { useSocket } from "../SocketProvider";

type SensorErrorPayload = {
  message?: string;
  errors?: Array<{
    instancePath?: string;
    message?: string;
  }>;
};

function currentLocalDateTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default function TemporarySensorForm() {
  const socket = useSocket();
  const [timestamp, setTimestamp] = useState(currentLocalDateTime);
  const [zoneId, setZoneId] = useState("zone_1");
  const [occupancyCount, setOccupancyCount] = useState("0");
  const [confidence, setConfidence] = useState("1");
  const [includeMovement, setIncludeMovement] = useState(false);
  const [movementX, setMovementX] = useState("0");
  const [movementY, setMovementY] = useState("0");
  const [movementConfidence, setMovementConfidence] = useState("1");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const handleSensorError = (payload: SensorErrorPayload) => {
      const details = payload.errors
        ?.map((error) =>
          [error.instancePath, error.message].filter(Boolean).join(" "),
        )
        .filter(Boolean);

      setErrorMessage(
        [payload.message ?? "Sensor event rejected.", ...(details ?? [])].join(
          ": ",
        ),
      );
      setStatusMessage("");
    };

    socket.on("sensor:error", handleSensorError);
    return () => {
      socket.off("sensor:error", handleSensorError);
    };
  }, [socket]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedTimestamp = new Date(timestamp);
    const parsedOccupancyCount = Number(occupancyCount);
    const parsedConfidence = Number(confidence);
    const parsedMovement = {
      x: Number(movementX),
      y: Number(movementY),
      confidence: Number(movementConfidence),
    };

    if (!Number.isFinite(parsedTimestamp.getTime())) {
      setErrorMessage("Enter a valid timestamp.");
      setStatusMessage("");
      return;
    }

    if (
      !zoneId.trim() ||
      !Number.isInteger(parsedOccupancyCount) ||
      parsedOccupancyCount < 0 ||
      !Number.isFinite(parsedConfidence) ||
      parsedConfidence < 0 ||
      parsedConfidence > 1 ||
      (includeMovement &&
        (!Number.isFinite(parsedMovement.x) ||
          !Number.isFinite(parsedMovement.y) ||
          !Number.isFinite(parsedMovement.confidence) ||
          parsedMovement.confidence < 0 ||
          parsedMovement.confidence > 1))
    ) {
      setErrorMessage("Check the zone, occupancy, and confidence values.");
      setStatusMessage("");
      return;
    }

    if (!socket.connected) {
      setErrorMessage("Waiting for the backend connection.");
      setStatusMessage("");
      return;
    }

    const sensorUpdate: SensorUpdate = {
      timestamp: parsedTimestamp.toISOString(),
      zone_id: zoneId.trim(),
      occupancy_count: parsedOccupancyCount,
      movement_events: includeMovement ? [parsedMovement] : [],
      confidence: parsedConfidence,
    };

    publishSensorUpdate(socket, sensorUpdate);
    setErrorMessage("");
    setStatusMessage("Sensor event submitted; waiting for state update.");
  };

  return (
    <section className="rounded-(--rounded-corners) border border-gray-300 p-4">
      <h2 className="text-lg font-medium">Test sensor event</h2>
      {/* TODO: Remove this temporary form when sensor events come from the sensor. */}
      <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="sensor-timestamp">Timestamp</label>
          <input
            id="sensor-timestamp"
            type="datetime-local"
            value={timestamp}
            onChange={(event) => setTimestamp(event.target.value)}
            required
            className="border border-gray-300 rounded-(--rounded-corners) p-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sensor-zone-id">Zone ID</label>
          <input
            id="sensor-zone-id"
            type="text"
            value={zoneId}
            onChange={(event) => setZoneId(event.target.value)}
            required
            className="border border-gray-300 rounded-(--rounded-corners) p-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sensor-occupancy">Occupancy count</label>
          <input
            id="sensor-occupancy"
            type="number"
            min="0"
            step="1"
            value={occupancyCount}
            onChange={(event) => setOccupancyCount(event.target.value)}
            required
            className="border border-gray-300 rounded-(--rounded-corners) p-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sensor-confidence">Confidence</label>
          <input
            id="sensor-confidence"
            type="number"
            min="0"
            max="1"
            step="any"
            value={confidence}
            onChange={(event) => setConfidence(event.target.value)}
            required
            className="border border-gray-300 rounded-(--rounded-corners) p-2"
          />
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="font-medium">Movement event</legend>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeMovement}
              onChange={(event) => setIncludeMovement(event.target.checked)}
            />
            Include one movement event
          </label>
          {includeMovement ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="sensor-movement-x">X</label>
                <input
                  id="sensor-movement-x"
                  type="number"
                  step="any"
                  value={movementX}
                  onChange={(event) => setMovementX(event.target.value)}
                  required
                  className="border border-gray-300 rounded-(--rounded-corners) p-2"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sensor-movement-y">Y</label>
                <input
                  id="sensor-movement-y"
                  type="number"
                  step="any"
                  value={movementY}
                  onChange={(event) => setMovementY(event.target.value)}
                  required
                  className="border border-gray-300 rounded-(--rounded-corners) p-2"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sensor-movement-confidence">Confidence</label>
                <input
                  id="sensor-movement-confidence"
                  type="number"
                  min="0"
                  max="1"
                  step="any"
                  value={movementConfidence}
                  onChange={(event) =>
                    setMovementConfidence(event.target.value)
                  }
                  required
                  className="border border-gray-300 rounded-(--rounded-corners) p-2"
                />
              </div>
            </div>
          ) : null}
        </fieldset>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-(--rounded-corners) hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Send sensor event
          </button>
          {errorMessage ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {statusMessage ? (
            <p className="mt-2 text-sm text-green-700" role="status">
              {statusMessage}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
