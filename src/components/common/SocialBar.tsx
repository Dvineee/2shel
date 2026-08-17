import React from 'react';
import { SocialLink } from '../../types';
import { MessageSquare, Send, Twitter, ExternalLink } from 'lucide-react';

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
      case 'send':
      default:
        return Send;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
      {links.map((link) => {
        const Icon = getIcon(link.icon);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-violet-950/40 border border-violet-800/30 hover:border-violet-500/60 hover:bg-violet-900/30 transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors">
                  {link.title}
                </span>
                {link.subtitle && (
                  <span className="text-xs text-violet-400 font-medium">
                    {link.subtitle}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 group-hover:bg-violet-600 group-hover:text-white text-xs font-bold transition-all">
              <span>Katıl</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>
        );
      })}
    </div>
  );
};
