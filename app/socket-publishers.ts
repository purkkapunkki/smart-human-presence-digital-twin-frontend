import type { Socket } from "socket.io-client";
import type { SensorUpdate } from "./backend-contracts";

export function publishSensorUpdate(socket: Socket, event: SensorUpdate) {
  socket.emit("sensor:update", event);
}
