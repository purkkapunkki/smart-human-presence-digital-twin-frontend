"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import type { MovementEvent, SensorUpdate } from "../backend-contracts";
import { publishSensorUpdate } from "../socket-publishers";
import { useSocket } from "../SocketProvider";

const MAX_MOVEMENT_EVENTS = 3;

type MovementEventForm = {
  x: string;
  y: string;
  confidence: string;
};

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
  const [movementEvents, setMovementEvents] = useState<MovementEventForm[]>([]);
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

  const addMovementEvent = () => {
    setMovementEvents((events) =>
      events.length < MAX_MOVEMENT_EVENTS
        ? [...events, { x: "0", y: "0", confidence: "1" }]
        : events,
    );
  };

  const updateMovementEvent = (
    index: number,
    field: keyof MovementEventForm,
    value: string,
  ) => {
    setMovementEvents((events) =>
      events.map((movement, movementIndex) =>
        movementIndex === index ? { ...movement, [field]: value } : movement,
      ),
    );
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedTimestamp = new Date(timestamp);
    const parsedOccupancyCount = Number(occupancyCount);
    const parsedConfidence = Number(confidence);
    const parsedMovementEvents: MovementEvent[] = movementEvents.map(
      (movement) => ({
        x: Number(movement.x),
        y: Number(movement.y),
        confidence: Number(movement.confidence),
      }),
    );
    const hasInvalidMovementEvent = movementEvents.some(
      (movement, index) =>
        !movement.x.trim() ||
        !movement.y.trim() ||
        !movement.confidence.trim() ||
        !Number.isFinite(parsedMovementEvents[index].x) ||
        !Number.isFinite(parsedMovementEvents[index].y) ||
        !Number.isFinite(parsedMovementEvents[index].confidence) ||
        parsedMovementEvents[index].confidence < 0 ||
        parsedMovementEvents[index].confidence > 1,
    );

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
      hasInvalidMovementEvent
    ) {
      setErrorMessage(
        "Check the zone, occupancy, confidence, and movement values.",
      );
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
      movement_events: parsedMovementEvents,
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
          <legend className="font-medium">Movement events</legend>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {movementEvents.length} of {MAX_MOVEMENT_EVENTS} added
            </p>
            <button
              type="button"
              onClick={addMovementEvent}
              disabled={movementEvents.length >= MAX_MOVEMENT_EVENTS}
              className="rounded-(--rounded-corners) border border-gray-300 px-3 py-2 text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add movement event
            </button>
          </div>
          {movementEvents.length ? (
            <div className="mt-3 grid gap-3">
              {movementEvents.map((movement, index) => {
                const eventId = `sensor-movement-${index}`;

                return (
                  <div
                    key={index}
                    className="rounded-(--rounded-corners) border border-gray-200 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-medium">
                        Movement event {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setMovementEvents((events) =>
                            events.filter(
                              (_, movementIndex) => movementIndex !== index,
                            ),
                          )
                        }
                        className="text-sm text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`${eventId}-x`}>X</label>
                        <input
                          id={`${eventId}-x`}
                          type="number"
                          step="any"
                          value={movement.x}
                          onChange={(event) =>
                            updateMovementEvent(index, "x", event.target.value)
                          }
                          required
                          className="border border-gray-300 rounded-(--rounded-corners) p-2"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`${eventId}-y`}>Y</label>
                        <input
                          id={`${eventId}-y`}
                          type="number"
                          step="any"
                          value={movement.y}
                          onChange={(event) =>
                            updateMovementEvent(index, "y", event.target.value)
                          }
                          required
                          className="border border-gray-300 rounded-(--rounded-corners) p-2"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`${eventId}-confidence`}>
                          Confidence
                        </label>
                        <input
                          id={`${eventId}-confidence`}
                          type="number"
                          min="0"
                          max="1"
                          step="any"
                          value={movement.confidence}
                          onChange={(event) =>
                            updateMovementEvent(
                              index,
                              "confidence",
                              event.target.value,
                            )
                          }
                          required
                          className="border border-gray-300 rounded-(--rounded-corners) p-2"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              No movement events added.
            </p>
          )}
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
