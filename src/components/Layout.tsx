import { useState, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Activity,
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  Building2,
  DoorOpen,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Receipt,
  Pill,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'bills', label: 'Billing', icon: Receipt },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'rooms', label: 'Rooms', icon: DoorOpen },
  { id: 'records', label: 'Medical Records', icon: FileText },
];

const patientNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'appointments', label: 'My Appointments', icon: Calendar },
  { id: 'prescriptions', label: 'My Prescriptions', icon: Pill },
  { id: 'records', label: 'Medical Records', icon: FileText },
  { id: 'bills', label: 'My Bills', icon: Receipt },
];

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = isAdmin ? adminNavItems : patientNavItems;

  const isAdminPortal = isAdmin;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b ${
          isAdminPortal ? 'from-slate-900 to-slate-800' : 'from-blue-900 to-blue-800'
        } z-50 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isAdminPortal ? 'bg-rose-500' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0`}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <span className="text-white font-semibold text-lg">MediCare</span>
                <p className="text-xs text-slate-400">{isAdminPortal ? 'Admin' : 'Patient'}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block text-slate-400 hover:text-white"
          >
            <ChevronLeft
              className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-all ${
                  isActive
                    ? `${isAdminPortal ? 'bg-rose-500' : 'bg-blue-500'} text-white shadow-lg`
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-3">
            <div className={`w-10 h-10 rounded-full ${isAdminPortal ? 'bg-rose-500' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-medium">
                {profile?.first_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-white text-sm font-medium truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-slate-400 text-xs truncate capitalize">{profile?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div
        className={`transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <header className={`h-16 ${isAdminPortal ? 'bg-rose-50' : 'bg-blue-50'} border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 hidden lg:block">
            {navItems.find((item) => item.id === currentPage)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${isAdminPortal ? 'bg-rose-500' : 'bg-blue-500'} absolute top-0 right-0 animate-pulse`}></div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
