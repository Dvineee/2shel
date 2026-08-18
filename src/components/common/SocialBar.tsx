import React from 'react';
import { SocialLink } from '../../types';
import { MessageSquare, Send, Twitter, ExternalLink, Instagram } from 'lucide-react';

interface SocialBarProps {
  links: SocialLink[];
}

export const SocialBar: React.FC<SocialBarProps> = ({ links }) => {
  if (!links || links.length === 0) return null;

  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'messagesquare':
        return MessageSquare;
      case 'twitter':
        return Twitter;
      case 'instagram':
        return Instagram;
      case 'send':
      default:
        return Send;
    }
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-3 my-3 sm:my-4">
      {links.map((link) => {
        const Icon = getIcon(link.icon);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-between p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-b sm:bg-gradient-to-r from-violet-950/50 via-[#180f33]/60 to-violet-950/50 border border-violet-800/40 hover:border-violet-500/60 hover:bg-violet-900/40 transition-all duration-300 group shadow-md active:scale-95 text-center sm:text-left"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all shrink-0 shadow-sm">
                <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0 w-full">
                <span className="text-[11px] sm:text-sm font-bold text-white group-hover:text-violet-200 transition-colors truncate">
                  {link.title}
                </span>
                {link.subtitle && (
                  <span className="text-[10px] sm:text-xs text-violet-400 font-medium truncate hidden sm:block">
                    {link.subtitle}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 group-hover:bg-violet-600 group-hover:text-white text-xs font-bold transition-all shrink-0">
              <span>Katıl</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>
        );
      })}
    </div>
  );
};
