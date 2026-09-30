import type { Socket } from "socket.io-client";
import type { UserLocation } from "./backend-contracts";

export function publishUserMove(socket: Socket, coordinates: UserLocation) {
  socket.emit("user:move", coordinates);
}
