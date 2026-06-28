interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
}

const sizes = { sm: "w-9 h-9 text-sm", md: "w-11 h-11 text-base", lg: "w-14 h-14 text-lg" };

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Deterministic color from name
function getBgColor(name: string) {
  const colors = [
    "bg-blue-600", "bg-purple-600", "bg-green-600",
    "bg-red-600", "bg-yellow-600", "bg-pink-600", "bg-teal-600",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function Avatar({ name, avatarUrl, size = "md", isOnline }: AvatarProps) {
  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} ${getBgColor(name)} rounded-full flex items-center justify-center font-semibold text-white`}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-signal-sidebar ${
            isOnline ? "bg-signal-online" : "bg-gray-500"
          }`}
        />
      )}
    </div>
  );
}
