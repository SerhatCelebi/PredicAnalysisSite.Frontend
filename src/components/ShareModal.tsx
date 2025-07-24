import React from "react";
import { X, Copy, Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  text: string;
}

const shareTargets: Array<{
  name: string;
  url: (u: string, t: string) => string;
  icon: JSX.Element;
}> = [
  {
    name: "Twitter",
    url: (u, t) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        u
      )}&text=${encodeURIComponent(t)}`,
    icon: <Share2 className="h-5 w-5" />, // Could use Twitter icon package
  },
  {
    name: "Facebook",
    url: (u) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    icon: <Share2 className="h-5 w-5" />,
  },
  {
    name: "WhatsApp",
    url: (u, t) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(t + " " + u)}`,
    icon: <Share2 className="h-5 w-5" />,
  },
  {
    name: "Telegram",
    url: (u, t) =>
      `https://t.me/share/url?url=${encodeURIComponent(
        u
      )}&text=${encodeURIComponent(t)}`,
    icon: <Share2 className="h-5 w-5" />,
  },
];

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  url,
  text,
}) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link kopyalandı");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Tam opak koyu arka plan */}
      <div className="fixed inset-0 bg-black bg-opacity-90" />
      <div
        className="relative bg-dark-800 rounded-xl shadow-2xl max-w-sm w-full p-6 z-10 border border-dark-600"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Paylaş</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-dark-700/70 transition-colors"
          >
            <X className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        <div className="space-y-2">
          {shareTargets.map((target) => (
            <a
              key={target.name}
              href={target.url(url, text)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center space-x-2 justify-start px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-100 transition-colors"
            >
              {target.icon}
              <span>{target.name}</span>
            </a>
          ))}

          <button
            onClick={handleCopy}
            className="w-full flex items-center space-x-2 justify-start px-4 py-2 rounded-lg bg-primary-700 hover:bg-primary-600 text-white transition-colors"
          >
            <Copy className="h-5 w-5" />
            <span>Linki Kopyala</span>
          </button>
        </div>
      </div>
    </div>
  );
};
