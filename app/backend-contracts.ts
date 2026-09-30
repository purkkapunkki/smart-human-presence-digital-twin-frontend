export type UserLocation = {
  x: number;
  y: number;
};

export type CurrentUser = {
  username: string;
  avatarColor: string;
  location: UserLocation;
};

export type AnonymousPresence = {
  timestamp: string;
  zone_id: string;
  occupancy_count: number;
  movement_events: Array<{
    x: number;
    y: number;
    confidence: number;
  }>;
  confidence: number;
};

export type BackendState = {
  loggedInUsers: CurrentUser[];
  anonymousPresences: AnonymousPresence[];
};

export type BackendMap = {
  name: string;
  width: number;
  height: number;
  zones: Array<{
    id: string;
    label: string;
    polygon: [number, number][];
  }>;
};
