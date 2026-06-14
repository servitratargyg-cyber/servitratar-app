import { Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { profile } = useAuth();

  return (
    <header className="flex items-center justify-between h-[60px] px-6 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        {profile && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#e8734a] flex items-center justify-center text-white text-sm font-semibold">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-800 leading-tight">{profile.full_name}</p>
              <p className="text-xs text-gray-400 uppercase">{profile.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
