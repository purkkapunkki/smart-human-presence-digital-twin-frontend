import type { Socket } from "socket.io-client";
import type { SensorUpdate, UserLocation } from "./backend-contracts";

export function publishUserMove(socket: Socket, coordinates: UserLocation) {
  socket.emit("user:move", coordinates);
}

export function publishSensorUpdate(socket: Socket, event: SensorUpdate) {
  socket.emit("sensor:update", event);
}
