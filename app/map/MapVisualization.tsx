import type { BackendMap, CurrentUser } from "../backend-contracts";

type MapVisualizationProps = {
  map: BackendMap;
  users: CurrentUser[];
};

function getZoneCenter(polygon: [number, number][]) {
  const total = polygon.reduce(
    (center, [x, y]) => ({ x: center.x + x, y: center.y + y }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / polygon.length,
    y: total.y / polygon.length,
  };
}

export default function MapVisualization({
  map,
  users,
}: MapVisualizationProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded border border-gray-300 bg-[#f4f7f5]"
      style={{ aspectRatio: `${map.width} / ${map.height}` }}
      role="group"
      aria-label={`${map.name} floor plan`}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${map.width} ${map.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="map-grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#dce5e1"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width={map.width} height={map.height} fill="url(#map-grid)" />
        {map.zones.map((zone, index) => {
          const hue = Math.round((index * 360) / map.zones.length);

          return (
            <polygon
              key={zone.id}
              points={zone.polygon.map(([x, y]) => `${x},${y}`).join(" ")}
              fill={`hsl(${hue} 62% 64%)`}
              fillOpacity="0.42"
              stroke="#465b56"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {map.zones.map((zone) => {
        const center = getZoneCenter(zone.polygon);

        return (
          <span
            key={zone.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/80 bg-white/85 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm"
            style={{
              left: `${(center.x / map.width) * 100}%`,
              top: `${(center.y / map.height) * 100}%`,
            }}
          >
            {zone.label}
          </span>
        );
      })}

      {users.map((user) => {
        const xPosition = (user.location.x / map.width) * 100;
        const yPosition = (user.location.y / map.height) * 100;
        const labelHorizontalPosition = xPosition > 82 ? "right-4" : "left-4";
        const labelVerticalPosition =
          yPosition < 12
            ? "top-4"
            : yPosition > 88
              ? "bottom-4"
              : "top-1/2 -translate-y-1/2";

        return (
          <span
            key={user.username}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-300 ease-out motion-reduce:transition-none"
            style={{ left: `${xPosition}%`, top: `${yPosition}%` }}
            role="img"
            aria-label={`${user.username} at ${user.location.x}, ${user.location.y}`}
          >
            <span
              className="block size-4 rounded-full border-2 border-white shadow-md ring-1 ring-black/20"
              style={{ backgroundColor: user.avatarColor }}
            />
            <span
              className={`absolute ${labelHorizontalPosition} ${labelVerticalPosition} whitespace-nowrap rounded-sm border border-gray-200 bg-white/95 px-2 py-1 text-xs font-medium text-gray-900 shadow-sm`}
            >
              {user.username}
            </span>
          </span>
        );
      })}
    </div>
  );
}
