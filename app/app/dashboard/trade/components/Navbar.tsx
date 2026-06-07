import React from "react";
import { Settings, Globe, ChevronDown } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <nav className="w-full h-12 bg-[#0e1114] border-b border-[#171c22] px-4 flex items-center justify-between shrink-0 z-40 select-none">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 cursor-pointer">
          <svg className="h-5 w-5 text-[#20e6a3]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-white font-black tracking-tight text-base">Hyperliquid</span>
        </div>
        <div className="hidden xl:flex items-center space-x-1 text-[13px] font-semibold">
          <span className="px-3 py-1.5 text-[#20e6a3] border-b-2 border-[#20e6a3] cursor-pointer">Trade</span>
          <span className="px-3 py-1.5 text-[#8e9aa9] hover:text-white cursor-pointer transition-colors">Portfolio</span>
          <span className="px-3 py-1.5 text-[#8e9aa9] hover:text-white cursor-pointer transition-colors">Earn</span>
          <span className="px-3 py-1.5 text-[#8e9aa9] hover:text-white cursor-pointer transition-colors">Vaults</span>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button className="bg-[#20e6a3] hover:bg-[#1cd193] text-black font-extrabold h-8 px-4 rounded transition-all text-xs">
          Connect
        </button>
        <Settings size={16} className="text-[#556070] hover:text-white cursor-pointer" />
        <Globe size={16} className="text-[#556070] hover:text-white cursor-pointer" />
      </div>
    </nav>
  );
};