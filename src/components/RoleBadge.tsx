import React from "react";
import { Shield, Crown, User } from "lucide-react";

interface RoleBadgeProps {
  role?: string | null;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  if (!role) return null;

  const getConfig = () => {
    switch (role) {
      case "SuperAdmin":
        return {
          label: "Süper Admin",
          bg: "bg-red-100 text-red-800",
          Icon: Shield,
        };
      case "Admin":
        return {
          label: "Admin",
          bg: "bg-purple-100 text-purple-800",
          Icon: Shield,
        };
      case "VipUser":
        return {
          label: "VIP",
          bg: "bg-yellow-100 text-yellow-800",
          Icon: Crown,
        };
      default:
        return {
          label: "Kullanıcı",
          bg: "bg-gray-100 text-gray-800",
          Icon: User,
        };
    }
  };

  const { label, bg, Icon } = getConfig();

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${bg} ${
        className || ""
      }`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </span>
  );
};
