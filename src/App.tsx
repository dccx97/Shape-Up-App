import { useState, useEffect } from 'react';
import { useSupplements } from './hooks/useSupplements';
import { useProfiles } from './hooks/useProfiles';
import { Dashboard } from './components/Dashboard';
import { Cabinet } from './components/Cabinet';
import { Analytics } from './components/Analytics';
import { Files } from './components/Files';
import { Health } from './components/Health';
import { Workouts } from './components/Workouts';
import { ProfileForm } from './components/ProfileForm';
import { LayoutDashboard, Archive, LineChart, Palette, Check, User, ChevronDown, Plus, Edit2, FolderOpen, Heart, Dumbbell } from 'lucide-react';
import { cn } from './lib/utils';
import { useFiles } from './hooks/useFiles';
import { useHealth } from './hooks/useHealth';
import { useHealthMetrics } from './hooks/useHealthMetrics';
import { useWorkouts } from './hooks/useWorkouts';
import { useAuth } from './hooks/useAuth';
import { Auth } from './components/Auth';

type Theme = 'light' | 'dark' | 'tan' | 'rose';

const THEMES = [
  { id: 'light', label: 'Light', bg: '#f8fafc', window: '#ffffff', accent: '#3b82f6' },
  { id: 'dark', label: 'Dark', bg: '#0f172a', window: '#1e293b', accent: '#3b82f6' },
  { id: 'tan', label: 'Tan', bg: '#f4efe6', window: '#fdfbf7', accent: '#3b82f6' },
  { id: 'rose', label: 'Rose', bg: '#fcf1f5', window: '#fffdfd', accent: '#db2777' },
] as const;

const calculateAge = (dob: string | undefined, legacyAge: number | undefined) => {
  if (dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return legacyAge || 0;
};

function App() {
  const { user, isLoading, signOut } = useAuth();
  
  const { profiles, activeProfile, activeProfileId, isLoadingProfiles, setActiveProfileId, addProfile, updateProfile } = useProfiles(user?.id);
  const { supplements, intakeLogs, addSupplement, updateSupplement, deleteSupplement, markTaken } = useSupplements(activeProfileId, user?.id);
  const { files, isLoading: filesLoading, addFile: addDocumentFile, deleteFile: deleteDocumentFile } = useFiles(activeProfileId, user?.id);
  const { healthLogs, addLog: addHealthLog, deleteLog: deleteHealthLog, updateLog: updateHealthLog } = useHealth(activeProfileId, user?.id);
  const { metrics, addMetric, deleteMetric } = useHealthMetrics(user?.id);
  const { workouts, workoutLogs, markWorkoutCompleted, addWorkout, updateWorkout, deleteWorkout } = useWorkouts(activeProfileId, user?.id);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cabinet' | 'workouts' | 'health' | 'analytics' | 'files'>('dashboard');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('app_theme') as Theme) || 'light';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Sync theme with active profile
  useEffect(() => {
    if (activeProfile?.theme) {
      setTheme(activeProfile.theme as Theme);
    }
  }, [activeProfile?.id, activeProfile?.theme]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    document.body.classList.remove('theme-dark', 'theme-tan', 'theme-rose');
    if (theme === 'dark') document.body.classList.add('theme-dark');
    if (theme === 'tan') document.body.classList.add('theme-tan');
    if (theme === 'rose') document.body.classList.add('theme-rose');
  }, [theme]);


  // ONBOARDING WALL: Auth Check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // ONBOARDING WALL: Profile Creation
  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAddingProfile || (profiles.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ProfileForm 
          onClose={profiles.length > 0 ? () => setIsAddingProfile(false) : undefined}
          onSave={(data) => {
            addProfile(data);
            setIsAddingProfile(false);
          }}
        />
      </div>
    );
  }

  const editingProfile = profiles.find(p => p.id === editingProfileId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {editingProfileId && (
        <ProfileForm 
          initialData={editingProfile}
          onClose={() => setEditingProfileId(null)}
          onSave={(data) => {
            updateProfile(editingProfileId, data);
            setEditingProfileId(null);
          }}
        />
      )}
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 rounded-xl px-2 py-1"
            style={{ backgroundColor: theme === 'dark' ? '#f8fafc' : 'transparent' }}
          >
            <img src="/logo_transparent.png" alt="Shape Up" className="h-10 object-contain" />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all bg-white"
              >
                {activeProfile?.image ? (
                  <img src={activeProfile.image} alt={activeProfile.name} className="w-8 h-8 rounded-full object-cover bg-slate-100" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">{activeProfile?.name}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2">
                    <div className="px-4 py-2 border-b border-slate-100 mb-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch Profile</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {profiles.map(p => (
                        <div
                          key={p.id}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors text-left group cursor-pointer",
                            p.id === activeProfileId ? "bg-slate-50" : ""
                          )}
                        >
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0"
                            onClick={() => {
                              setActiveProfileId(p.id);
                              setIsProfileMenuOpen(false);
                            }}
                          >
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                {p.name[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm truncate font-medium", p.id === activeProfileId ? "text-blue-600" : "text-slate-700")}>{p.name}</p>
                              <p className="text-xs text-slate-500 truncate">{calculateAge(p.dateOfBirth, p.age)}y • {p.sex}</p>
                            </div>
                            {p.id === activeProfileId && <Check className="w-4 h-4 text-blue-600 mr-2" />}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsProfileMenuOpen(false);
                              setEditingProfileId(p.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsAddingProfile(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Profile
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 mt-1 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className={cn(
                  "p-2 rounded-full transition-colors flex items-center gap-2",
                  isThemeMenuOpen ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
                title="Change Appearance"
              >
                <Palette className="w-5 h-5" />
              </button>

              {isThemeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsThemeMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Appearance</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            const newTheme = t.id as Theme;
                            setTheme(newTheme);
                            if (activeProfileId) {
                              updateProfile(activeProfileId, { theme: newTheme });
                            }
                            setIsThemeMenuOpen(false);
                          }}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div 
                            className={cn(
                              "w-full aspect-video rounded-md border-2 p-1 transition-all overflow-hidden relative",
                              theme === t.id ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 group-hover:border-slate-300"
                            )}
                            style={{ backgroundColor: t.bg }}
                          >
                            <div 
                              className="w-full h-full rounded shadow-sm border border-black/5 flex flex-col"
                              style={{ backgroundColor: t.window }}
                            >
                              <div className="h-1.5 w-full border-b border-black/5" />
                              <div className="flex-1 p-1">
                                <div className="w-1/2 h-1 rounded-sm mb-1" style={{ backgroundColor: t.accent }} />
                                <div className="w-3/4 h-1 rounded-sm bg-slate-200" />
                              </div>
                            </div>
                            {theme === t.id && (
                              <div className="absolute bottom-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                <Check className="w-2 h-2" />
                              </div>
                            )}
                          </div>
                          <span className={cn(
                            "text-xs font-medium",
                            theme === t.id ? "text-slate-900" : "text-slate-500"
                          )}>
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Navigation */}
        <nav className="mb-16 flex justify-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <NavButton 
            active={activeTab === 'cabinet'} 
            onClick={() => setActiveTab('cabinet')}
            icon={<Archive className="w-5 h-5" />}
            label="Cabinet"
          />
          <NavButton 
            active={activeTab === 'workouts'} 
            onClick={() => setActiveTab('workouts')}
            icon={<Dumbbell className="w-5 h-5" />}
            label="Workouts"
          />
          <NavButton 
            active={activeTab === 'health'} 
            onClick={() => setActiveTab('health')}
            icon={<Heart className="w-5 h-5" />}
            label="Health"
          />
          <NavButton 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
            icon={<LineChart className="w-5 h-5" />}
            label="Analytics"
          />
          <NavButton 
            active={activeTab === 'files'} 
            onClick={() => setActiveTab('files')}
            icon={<FolderOpen className="w-5 h-5" />}
            label="Files"
          />
        </nav>



        {activeTab === 'dashboard' && (
          <Dashboard 
            supplements={supplements} 
            intakeLogs={intakeLogs} 
            markTaken={markTaken} 
            activeProfile={activeProfile}
            workouts={workouts}
            workoutLogs={workoutLogs}
            markWorkoutCompleted={markWorkoutCompleted}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        
        {activeTab === 'cabinet' && (
          <Cabinet 
            supplements={supplements} 
            addSupplement={addSupplement} 
            updateSupplement={updateSupplement} 
            deleteSupplement={deleteSupplement} 
            profiles={profiles}
            activeProfileId={activeProfileId}
          />
        )}

        {activeTab === 'workouts' && (
          <Workouts
            workouts={workouts}
            addWorkout={addWorkout}
            updateWorkout={updateWorkout}
            deleteWorkout={deleteWorkout}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics 
            supplements={supplements}
            intakeLogs={intakeLogs}
            workoutLogs={workoutLogs}
          />
        )}

        {activeTab === 'health' && (
          <Health 
            healthLogs={healthLogs}
            metrics={metrics}
            addMetric={addMetric}
            deleteMetric={deleteMetric}
            addLog={addHealthLog}
            updateLog={updateHealthLog}
            deleteLog={deleteHealthLog}
          />
        )}

        {activeTab === 'files' && (
          <Files 
            files={files}
            isLoading={filesLoading}
            addFile={addDocumentFile}
            deleteFile={deleteDocumentFile}
          />
        )}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm whitespace-nowrap",
        active 
          ? "text-blue-600 bg-white shadow-sm border border-slate-200" 
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default App;
