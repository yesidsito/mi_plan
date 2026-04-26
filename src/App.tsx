/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  Beef, 
  Droplets, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Flame,
  Bell,
  Trophy,
  History,
  Settings,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Meal, DailyStats, Tab, Achievement, HistoryEntry, Reminder } from './types';

const GLASS_COUNT = 8;
const DEFAULT_PROTEIN_GOAL = 150;

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'Novato de Vitalidad', description: 'Completa tu primer día al 100%', icon: '🌟', unlocked: false },
  { id: '2', title: 'Hidratación Maestra', description: 'Bebe 8 vasos de agua en un día', icon: '🌊', unlocked: false },
  { id: '3', title: 'Poder Proteico', description: 'Alcanza tu meta de proteína', icon: '💪', unlocked: false },
  { id: '4', title: 'Racha de 3 Días', description: 'Mantén tu racha activa por 3 días', icon: '🔥', unlocked: false },
  { id: '5', title: 'Semana Perfecta', description: 'Completa 7 días seguidos al 100%', icon: '👑', unlocked: false },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Stats & Main Day Data
  const [stats, setStats] = useState<DailyStats>(() => {
    const saved = localStorage.getItem('mi_plan_stats');
    const today = new Date().toISOString().split('T')[0];
    
    if (saved) {
      const parsed = JSON.parse(saved) as DailyStats;
      if (parsed.date !== today) {
        return {
          date: today,
          meals: [],
          waterGlasses: new Array(GLASS_COUNT).fill(false),
          proteinGoal: parsed.proteinGoal || DEFAULT_PROTEIN_GOAL,
          streak: parsed.streak,
          isDayCompleted: false
        };
      }
      return parsed;
    }
    
    return {
      date: today,
      meals: [],
      waterGlasses: new Array(GLASS_COUNT).fill(false),
      proteinGoal: DEFAULT_PROTEIN_GOAL,
      streak: 0,
      isDayCompleted: false
    };
  });

  // Achievements State
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('mi_plan_achievements');
    return saved ? JSON.parse(saved) : DEFAULT_ACHIEVEMENTS;
  });

  // History State
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('mi_plan_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Reminders State
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('mi_plan_reminders');
    return saved ? JSON.parse(saved) : [
      { id: 'r1', type: 'agua', time: '09:00', enabled: true },
      { id: 'r2', type: 'proteina', time: '13:00', enabled: true },
      { id: 'r3', type: 'agua', time: '16:00', enabled: true },
    ];
  });

  useEffect(() => {
    localStorage.setItem('mi_plan_stats', JSON.stringify(stats));
    localStorage.setItem('mi_plan_achievements', JSON.stringify(achievements));
    localStorage.setItem('mi_plan_history', JSON.stringify(history));
    localStorage.setItem('mi_plan_reminders', JSON.stringify(reminders));
  }, [stats, achievements, history, reminders]);

  // Derived Values
  const totalProteinInList = useMemo(() => 
    stats.meals.reduce((sum, m) => sum + m.protein, 0),
  [stats.meals]);

  const completedProtein = useMemo(() => 
    stats.meals.filter(m => m.completed).reduce((sum, m) => sum + m.protein, 0),
  [stats.meals]);

  const waterCount = useMemo(() => 
    stats.waterGlasses.filter(Boolean).length,
  [stats.waterGlasses]);

  const proteinProgress = totalProteinInList > 0 
    ? (completedProtein / totalProteinInList) * 100 
    : 0;
  
  const waterProgress = (waterCount / GLASS_COUNT) * 100;

  // Requirements for "Complete Day" button
  const canCompleteDay = proteinProgress >= 80 && waterProgress >= 80 && !stats.isDayCompleted;

  // Actions
  const addMeal = (name: string, protein: number) => {
    const newMeal: Meal = {
      id: crypto.randomUUID(),
      name,
      protein,
      completed: false
    };
    setStats(prev => ({ ...prev, meals: [...prev.meals, newMeal] }));
  };

  const toggleMeal = (id: string) => {
    setStats(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === id ? { ...m, completed: !m.completed } : m)
    }));
  };

  const removeMeal = (id: string) => {
    setStats(prev => ({
      ...prev,
      meals: prev.meals.filter(m => m.id !== id)
    }));
  };

  const toggleWater = (index: number) => {
    setStats(prev => {
      const newWater = [...prev.waterGlasses];
      newWater[index] = !newWater[index];
      return { ...prev, waterGlasses: newWater };
    });
  };

  const completeDayAction = () => {
    if (!canCompleteDay) return;

    setShowCelebration(true);
    const newStreak = stats.streak + 1;
    
    // Check for achievements
    let updatedAchievements = [...achievements];
    if (newStreak === 1 && !updatedAchievements[0].unlocked) updatedAchievements[0].unlocked = true;
    if (waterProgress === 100 && !updatedAchievements[1].unlocked) updatedAchievements[1].unlocked = true;
    if (proteinProgress === 100 && !updatedAchievements[2].unlocked) updatedAchievements[2].unlocked = true;
    if (newStreak === 3 && !updatedAchievements[3].unlocked) updatedAchievements[3].unlocked = true;
    if (newStreak === 7 && !updatedAchievements[4].unlocked) updatedAchievements[4].unlocked = true;

    setAchievements(updatedAchievements);

    // Save to History
    const historyEntry: HistoryEntry = {
      date: stats.date,
      proteinCompleted: completedProtein,
      proteinTotal: totalProteinInList,
      waterCount: waterCount,
      streak: newStreak
    };

    setHistory(prev => {
      const filtered = prev.filter(e => e.date !== stats.date);
      return [historyEntry, ...filtered];
    });

    setStats(prev => ({ ...prev, streak: newStreak, isDayCompleted: true }));
    setTimeout(() => setShowCelebration(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0518] text-gray-100 overflow-hidden relative">
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-purple-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-[#1a1a20] p-12 rounded-[40px] border border-purple-500/30 text-center shadow-[0_0_50px_rgba(168,85,247,0.3)]"
            >
              <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 mx-auto mb-6">
                <Flame size={48} fill="currentColor" />
              </div>
              <h2 className="text-3xl font-bold mb-2">¡Día Completado!</h2>
              <p className="text-purple-300 font-medium">Tu racha ha subido a {stats.streak + 1}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-8 pb-4 flex justify-between items-center bg-[#0A0518]/50 backdrop-blur-md sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent uppercase italic">
            MI-PLAN
          </h1>
          <p className="text-sm text-purple-300/60">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-2.5">
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-widest text-purple-300 font-semibold">Racha Actual</span>
            <span className="text-xl font-bold flex items-center gap-2">
              {stats.streak} <Flame size={20} className="text-orange-500 fill-orange-500" />
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-40 p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'inicio' && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 flex flex-col justify-between h-48">
                  <div>
                    <p className="text-xs font-bold text-purple-300/60 uppercase tracking-widest mb-1">Proteína Hoy</p>
                    <h2 className="text-4xl font-bold">{completedProtein}g <span className="text-base font-normal text-white/30">/ {totalProteinInList || stats.proteinGoal}g</span></h2>
                  </div>
                  <div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, proteinProgress)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Progreso Lista</span>
                      <span className="text-xs font-bold text-purple-400">{Math.round(proteinProgress)}%</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between h-48">
                  <div>
                    <p className="text-xs font-bold text-blue-300/60 uppercase tracking-widest mb-1">Hidratación</p>
                    <h2 className="text-4xl font-bold">{waterCount} <span className="text-base font-normal text-white/30">/ {GLASS_COUNT} vasos</span></h2>
                  </div>
                  <div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${waterProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Vasos Tomados</span>
                      <span className="text-xs font-bold text-blue-400">{Math.round(waterProgress)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Completion Button */}
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileTap={canCompleteDay ? { scale: 0.95 } : {}}
                  disabled={!canCompleteDay}
                  onClick={completeDayAction}
                  className={`w-full max-w-sm py-5 rounded-[2.5rem] text-lg font-black tracking-widest uppercase transition-all shadow-xl ${
                    canCompleteDay 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/20 shadow-lg' 
                      : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {stats.isDayCompleted ? 'DÍA COMPLETADO ✨' : 'FINALIZAR DÍA'}
                </motion.button>
                {!canCompleteDay && !stats.isDayCompleted && (
                  <p className="text-xs text-white/40 italic font-medium flex items-center gap-2">
                    <TrendingUp size={14} /> Necesitas al menos 80% en ambas barras para completar el día
                  </p>
                )}
              </div>

              {/* Achievement Quick View */}
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="text-purple-400" /> Logros Recientes
                  </h3>
                  <button onClick={() => setActiveTab('logros')} className="text-xs font-bold text-purple-400 hover:underline">VER TODOS</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {achievements.filter(a => a.unlocked).length === 0 ? (
                    <p className="text-sm text-white/20 italic p-4 text-center w-full">Aún no has desbloqueado logros</p>
                  ) : (
                    achievements.filter(a => a.unlocked).map(achievement => (
                      <div key={achievement.id} className="min-w-[120px] bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center gap-2">
                        <span className="text-3xl">{achievement.icon}</span>
                        <p className="text-[10px] font-bold uppercase leading-tight line-clamp-1">{achievement.title}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'proteina' && (
            <motion.div
              key="proteina"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                  Registro de Proteína
                </h2>
                <button 
                  onClick={() => {
                    const name = prompt("Nombre de la comida:");
                    const prot = parseInt(prompt("Gramos de proteína:") || "0");
                    if (name && prot) addMeal(name, prot);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-xs font-bold uppercase tracking-widest border border-white/10"
                >
                  + AÑADIR COMIDA
                </button>
              </div>

              <div className="space-y-3">
                {stats.meals.length === 0 ? (
                  <div className="glass-card py-20 text-center text-white/20 italic">
                    No hay comidas registradas aún
                  </div>
                ) : (
                  stats.meals.map(meal => (
                    <motion.div
                      layout
                      key={meal.id}
                      className={`group flex items-center p-5 rounded-3xl border transition-all cursor-pointer ${
                        meal.completed 
                          ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                      onClick={() => toggleMeal(meal.id)}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-5 transition-colors ${
                        meal.completed ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                      }`}>
                        {meal.completed && <CheckCircle2 size={16} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-lg ${meal.completed ? 'line-through text-white/40' : ''}`}>{meal.name}</p>
                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">{meal.protein}g Proteína</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMeal(meal.id);
                        }}
                        className="p-3 text-white/10 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'agua' && (
            <motion.div
              key="agua"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-3">
                  <span className="w-2 h-7 bg-blue-400 rounded-full"></span>
                  Vasos de Agua
                </h2>
                <p className="text-sm text-white/40 mt-2 font-medium tracking-wide">Mantente hidratado para rendir al máximo</p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                {stats.waterGlasses.map((taken, i) => (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    key={i}
                    onClick={() => toggleWater(i)}
                    className={`aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-4 border transition-all duration-500 ${
                      taken 
                        ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.3)]' 
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`transition-transform duration-700 ${taken ? 'scale-125' : 'scale-100'}`}>
                      <Droplets 
                        size={48} 
                        className={taken ? 'text-blue-400 fill-blue-400' : 'text-white/10'} 
                      />
                    </div>
                    <span className={`text-[10px] font-black tracking-[0.2em] ${taken ? 'text-blue-300' : 'text-white/20'}`}>
                      {taken ? 'TOMADO' : `VASO ${i + 1}`}
                    </span>
                  </motion.button>
                ))}
              </div>

              <p className="text-center text-sm italic text-white/20">
                {8 - waterCount === 0 
                  ? '¡Meta diaria alcanzada! 💧✨' 
                  : `¡Te faltan ${8 - waterCount} vasos para tu meta!`}
              </p>
            </motion.div>
          )}

          {activeTab === 'logros' && (
            <motion.div
              key="logros"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Trophy className="text-yellow-500" /> Sistema de Logros
              </h2>
              <div className="grid gap-4">
                {achievements.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className={`glass-card p-6 flex items-center gap-6 transition-all ${
                      achievement.unlocked ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-4xl shadow-xl">
                      {achievement.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{achievement.title}</h3>
                      <p className="text-sm text-white/40">{achievement.description}</p>
                      {achievement.unlocked && (
                        <span className="inline-block mt-2 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase">Desbloqueado</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'historial' && (
            <motion.div
              key="historial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <History className="text-emerald-400" /> Mi Historial
              </h2>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="glass-card py-20 text-center text-white/20 italic">
                    Aún no hay días registrados en el historial
                  </div>
                ) : (
                  history.map((entry, i) => (
                    <div key={i} className="glass-card p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center font-bold">
                          <span className="text-[10px] text-white/30 uppercase">{new Date(entry.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                          <span className="text-lg leading-none">{new Date(entry.date).getDate()}</span>
                        </div>
                        <div>
                          <p className="font-bold">Día {entry.streak}</p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-purple-400 font-bold flex items-center gap-1">
                              <Beef size={12} /> {entry.proteinCompleted}g
                            </span>
                            <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
                              <Droplets size={12} /> {entry.waterCount}v
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-xs font-black uppercase tracking-tighter">ÉXITO</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'ajustes' && (
            <motion.div
              key="ajustes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Settings className="text-gray-400" /> Configuración
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-4 ml-2">Recordatorios Diarios</h3>
                  <div className="space-y-3">
                    {reminders.map(reminder => (
                      <div key={reminder.id} className="glass-card p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${reminder.type === 'agua' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {reminder.type === 'agua' ? <Droplets size={20} /> : <Beef size={20} />}
                          </div>
                          <div>
                            <p className="font-bold">{reminder.type === 'agua' ? 'Hidratación' : 'Proteína'}</p>
                            <p className="text-sm font-mono text-white/40">{reminder.time}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, enabled: !r.enabled } : r))}
                          className={`w-14 h-8 rounded-full p-1 transition-all ${reminder.enabled ? 'bg-purple-600' : 'bg-white/10'}`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${reminder.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-4 ml-2">Metas Personales</h3>
                  <div className="glass-card p-6">
                    <label className="block text-xs font-bold text-white/30 uppercase mb-2">Meta de Proteína (Gramos)</label>
                    <input 
                      type="number"
                      value={stats.proteinGoal}
                      onChange={(e) => setStats(prev => ({ ...prev, proteinGoal: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Container */}
      <div className="fixed bottom-0 left-0 right-0 p-8 z-50">
        <nav className="glass-nav h-20 px-4 flex items-center justify-center max-w-lg mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <NavButton 
              active={activeTab === 'inicio'} 
              onClick={() => setActiveTab('inicio')}
              icon={<HomeIcon size={20} />}
              label="Inicio"
            />
            <NavButton 
              active={activeTab === 'proteina'} 
              onClick={() => setActiveTab('proteina')}
              icon={<Beef size={20} />}
              label="Proteína"
            />
            <NavButton 
              active={activeTab === 'agua'} 
              onClick={() => setActiveTab('agua')}
              icon={<Droplets size={20} />}
              label="Agua"
            />
            <NavButton 
              active={activeTab === 'logros'} 
              onClick={() => setActiveTab('logros')}
              icon={<Trophy size={20} />}
              label="Logros"
            />
            <NavButton 
              active={activeTab === 'historial'} 
              onClick={() => setActiveTab('historial')}
              icon={<History size={20} />}
              label="Historial"
            />
            <NavButton 
              active={activeTab === 'ajustes'} 
              onClick={() => setActiveTab('ajustes')}
              icon={<Settings size={20} />}
              label="Ajustes"
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 min-w-[70px] py-2 h-14 rounded-2xl transition-all duration-300 relative ${
        active ? 'text-white' : 'text-white/40 hover:text-white/70'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="nav-bg"
          className="absolute inset-0 bg-white/10 rounded-2xl -z-10"
        />
      )}
      <div className={`${active ? 'scale-110 mb-0.5' : 'scale-100'} transition-transform`}>
        {icon}
      </div>
      <span className="text-[8px] font-black tracking-widest uppercase">{label}</span>
    </button>
  );
}
