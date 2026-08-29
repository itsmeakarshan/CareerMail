import React, { useState } from 'react';
import { X, Check, Sparkles, Link as LinkIcon } from 'lucide-react';

export interface AvatarOption {
  id: string;
  name: string;
  category: 'illustrated' | 'realistic' | 'iconic';
  url: string;
}

export const PRESET_AVATARS: AvatarOption[] = [
  {
    id: 'personas-1',
    name: 'Modern Professional',
    category: 'illustrated',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Alex&backgroundColor=ffd5dc,ffdfbf',
  },
  {
    id: 'personas-2',
    name: 'Creative Specialist',
    category: 'illustrated',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=Sarah&backgroundColor=d1d4f9,c0aede',
  },
  {
    id: 'lorelei-1',
    name: 'Tech Innovator',
    category: 'illustrated',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya&backgroundColor=ffd5dc',
  },
  {
    id: 'lorelei-2',
    name: 'Software Engineer',
    category: 'illustrated',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo&backgroundColor=c0aede',
  },
  {
    id: 'bottts-1',
    name: 'AI CareerBot',
    category: 'iconic',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CareerBot&backgroundColor=ffd5dc,fbcfe8',
  },
  {
    id: 'micah-1',
    name: 'Minimalist Leader',
    category: 'illustrated',
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=Jordan&backgroundColor=ffd5dc',
  },
  {
    id: 'adventurer-1',
    name: 'Explorer & Builder',
    category: 'illustrated',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=ffd5dc',
  },
  {
    id: 'adventurer-2',
    name: 'Product Strategist',
    category: 'illustrated',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffdfbf',
  },
  {
    id: 'thumbs-1',
    name: 'Pink Sparkle',
    category: 'iconic',
    url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Sparkle&backgroundColor=f472b6',
  },
  {
    id: 'initials-1',
    name: 'Pink Monogram',
    category: 'iconic',
    url: 'https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=ec4899',
  },
  {
    id: 'photo-1',
    name: 'Studio Portrait 1',
    category: 'realistic',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-2',
    name: 'Studio Portrait 2',
    category: 'realistic',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-3',
    name: 'Studio Portrait 3',
    category: 'realistic',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo-4',
    name: 'Studio Portrait 4',
    category: 'realistic',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
];

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onSelectAvatar: (url: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSelectAvatar,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentAvatar || PRESET_AVATARS[0].url);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'illustrated' | 'realistic' | 'iconic'>('all');

  if (!isOpen) return null;

  const filteredAvatars =
    activeTab === 'all'
      ? PRESET_AVATARS
      : PRESET_AVATARS.filter((a) => a.category === activeTab);

  const handleSave = () => {
    if (customUrl.trim()) {
      onSelectAvatar(customUrl.trim());
    } else {
      onSelectAvatar(selectedUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#12182b] border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-5 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Choose Profile Avatar</h3>
              <p className="text-xs text-slate-400">Select from curated icons or paste a custom image URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview of Selected */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#0c101d] border border-slate-800">
          <div className="relative">
            <img
              src={customUrl.trim() || selectedUrl}
              alt="Selected Preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-pink-400 shadow-md bg-white/5"
              onError={(e) => {
                // fallback if custom URL broken
                (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Current Preview</span>
            <span className="text-xs text-slate-400">
              This avatar will appear on your dashboard, emails, and header.
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          {(['all', 'illustrated', 'iconic', 'realistic'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Avatars Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-56 overflow-y-auto pr-1">
          {filteredAvatars.map((item) => {
            const isSelected = selectedUrl === item.url && !customUrl.trim();
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedUrl(item.url);
                  setCustomUrl('');
                }}
                className={`relative group flex flex-col items-center p-2 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-pink-400 bg-pink-500/10 shadow-md shadow-pink-500/20 scale-105'
                    : 'border-slate-800/80 bg-[#0c101d] hover:border-slate-700 hover:bg-[#151c30]'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover bg-white/5"
                />
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1 truncate w-full text-center group-hover:text-slate-200">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom URL Input */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Or paste Custom Image URL</span>
          </label>
          <input
            type="url"
            placeholder="https://example.com/my-photo.jpg"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white text-xs font-bold shadow-md shadow-pink-500/25 transition-all hover:scale-105"
          >
            Save Avatar
          </button>
        </div>

      </div>
    </div>
  );
};
