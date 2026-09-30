"use client";

import { useState, type SubmitEvent } from "react";
import { publishUserMove } from "../socket-publishers";
import { useSocket } from "../SocketProvider";

export default function TemporaryMovementForm() {
  const socket = useSocket();
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const coordinates = { x: Number(x), y: Number(y) };
    if (
      !x.trim() ||
      !y.trim() ||
      !Number.isFinite(coordinates.x) ||
      !Number.isFinite(coordinates.y)
    ) {
      setErrorMessage("Enter valid numeric coordinates.");
      setStatusMessage("");
      return;
    }

    if (!socket.connected) {
      setErrorMessage("Waiting for the backend connection.");
      setStatusMessage("");
      return;
    }

    publishUserMove(socket, coordinates);
    setErrorMessage("");
    setStatusMessage("Movement update sent.");
  };

  return (
    <section className="rounded-(--rounded-corners) border border-gray-300 p-4">
      <h2 className="text-lg font-medium">Test user movement</h2>
      {/* TODO: Remove this temporary form when user movement comes from the sensor. */}
      <form
        onSubmit={handleSubmit}
        className="mt-3 flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="movement-x">X coordinate</label>
          <input
            id="movement-x"
            name="x"
            type="number"
            step="any"
            value={x}
            onChange={(event) => setX(event.target.value)}
            required
            className="w-32 border border-gray-300 rounded-(--rounded-corners) p-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="movement-y">Y coordinate</label>
          <input
            id="movement-y"
            name="y"
            type="number"
            step="any"
            value={y}
            onChange={(event) => setY(event.target.value)}
            required
            className="w-32 border border-gray-300 rounded-(--rounded-corners) p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-(--rounded-corners) hover:bg-blue-600 transition-colors cursor-pointer"
        >
          Send movement
        </button>
      </form>
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
    </section>
  );
}
