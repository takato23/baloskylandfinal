/**
 * DailyRewardsPanel - Premium Animal Crossing-style daily login rewards
 * Features calendar view, streak animations, and delightful reward claiming
 */

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { useGameStore } from '../../store';
import { WEEKLY_REWARDS } from '../../types/daily-events';
import { playSound } from '../../utils/audio';

// ============================================
// Constants
// ============================================

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const STREAK_MILESTONES = [
  { days: 7, reward: '🎁', bonus: 100, title: 'Una semana' },
  { days: 14, reward: '🎊', bonus: 250, title: 'Dos semanas' },
  { days: 30, reward: '🏆', bonus: 500, title: 'Un mes' },
  { days: 60, reward: '👑', bonus: 1000, title: 'Dos meses' },
  { days: 100, reward: '⭐', bonus: 2000, title: 'Centenario' },
];

// ============================================
// Animated Background
// ============================================

const AnimatedStars: React.FC = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="absolute animate-twinkle"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        }}
      >
        <span className="text-yellow-300 text-opacity-60" style={{ fontSize: `${8 + Math.random() * 8}px` }}>
          ✦
        </span>
      </div>
    ))}
  </div>
));

AnimatedStars.displayName = 'AnimatedStars';

// ============================================
// Confetti Effect
// ============================================

interface ConfettiProps {
  isActive: boolean;
}

const Confetti: React.FC<ConfettiProps> = memo(({ isActive }) => {
  if (!isActive) return null;

  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'];
  const shapes = ['circle', 'square', 'triangle'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array.from({ length: 80 }).map((_, i) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = 6 + Math.random() * 10;
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 2.5 + Math.random() * 2;

        return (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${left}%`,
              top: '-20px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          >
            <div
              className="animate-confetti-spin"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: shape === 'circle' ? '50%' : shape === 'square' ? '2px' : '0',
                clipPath: shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                animationDuration: `${0.5 + Math.random()}s`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
});

Confetti.displayName = 'Confetti';

// ============================================
// Streak Fire Animation
// ============================================

interface StreakFireProps {
  streak: number;
}

const StreakFire: React.FC<StreakFireProps> = memo(({ streak }) => {
  const intensity = Math.min(streak / 30, 1);
  const flameCount = Math.min(3 + Math.floor(streak / 10), 8);

  return (
    <div className="relative w-20 h-24 flex items-end justify-center">
      {/* Flames */}
      {Array.from({ length: flameCount }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-flame"
          style={{
            bottom: '20%',
            left: `${35 + (i - flameCount / 2) * 8}%`,
            animationDelay: `${i * 0.1}s`,
            filter: `hue-rotate(${intensity * 20}deg)`,
          }}
        >
          <div
            className="w-4 h-12 rounded-full bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent opacity-90"
            style={{
              transform: `scaleY(${0.8 + intensity * 0.4}) scaleX(${0.9 + Math.random() * 0.2})`,
            }}
          />
        </div>
      ))}

      {/* Core flame */}
      <div className="relative z-10 text-5xl animate-bounce-slow drop-shadow-lg">
        🔥
      </div>

      {/* Streak number */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-lg px-3 py-1 rounded-full shadow-lg border-2 border-white">
        {streak}
      </div>
    </div>
  );
});

StreakFire.displayName = 'StreakFire';

// ============================================
// Calendar Day Cell
// ============================================

interface CalendarDayProps {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isClaimed: boolean;
  hasReward: boolean;
  onClick?: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = memo(({
  day,
  isCurrentMonth,
  isToday,
  isClaimed,
  hasReward,
  onClick,
}) => {
  if (!isCurrentMonth) {
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={onClick}
      disabled={!hasReward || isClaimed}
      className={`
        relative w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
        transition-all duration-200
        ${isToday
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-110 shadow-lg ring-2 ring-amber-300 ring-offset-2'
          : isClaimed
            ? 'bg-green-100 text-green-700'
            : hasReward
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 hover:scale-105 cursor-pointer'
              : 'bg-gray-50 text-gray-400'
        }
      `}
    >
      {day}

      {/* Claimed checkmark */}
      {isClaimed && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm">
          ✓
        </span>
      )}

      {/* Today pulse */}
      {isToday && hasReward && !isClaimed && (
        <span className="absolute inset-0 rounded-xl animate-ping bg-amber-400 opacity-30" />
      )}
    </button>
  );
});

CalendarDay.displayName = 'CalendarDay';

// ============================================
// Weekly Reward Track
// ============================================

interface WeeklyRewardTrackProps {
  currentDay: number;
  claimedDays: boolean[];
  onClaimToday: () => void;
  isClaimable: boolean;
}

const WeeklyRewardTrack: React.FC<WeeklyRewardTrackProps> = memo(({
  currentDay,
  claimedDays,
  onClaimToday,
  isClaimable,
}) => {
  return (
    <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
      {/* Track line */}
      <div className="absolute top-1/2 left-8 right-8 h-1 bg-amber-200 rounded-full -translate-y-1/2" />
      <div
        className="absolute top-1/2 left-8 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full -translate-y-1/2 transition-all duration-500"
        style={{ width: `${Math.min((currentDay / 6) * 100, 100)}%` }}
      />

      {/* Reward nodes */}
      <div className="relative flex justify-between items-center">
        {WEEKLY_REWARDS.map((reward, index) => {
          const isPast = index < currentDay;
          const isCurrent = index === currentDay;
          const isClaimed = claimedDays[index];
          const isLocked = index > currentDay;

          return (
            <div
              key={reward.day}
              className="flex flex-col items-center gap-1"
            >
              {/* Reward icon */}
              <button
                onClick={isCurrent && isClaimable ? onClaimToday : undefined}
                disabled={!isCurrent || !isClaimable}
                className={`
                  relative w-14 h-14 rounded-2xl flex items-center justify-center
                  transition-all duration-300
                  ${isClaimed
                    ? 'bg-green-400 scale-90 opacity-80'
                    : isCurrent
                      ? isClaimable
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 scale-110 shadow-xl cursor-pointer hover:scale-115 animate-bounce-slow'
                        : 'bg-gradient-to-br from-gray-300 to-gray-400'
                      : isLocked
                        ? 'bg-gray-200 opacity-50'
                        : 'bg-amber-200'
                  }
                  border-2 ${isCurrent ? 'border-white' : 'border-transparent'}
                `}
              >
                <span className={`text-2xl ${isLocked ? 'grayscale' : ''}`}>
                  {isClaimed ? '✓' : reward.icon}
                </span>

                {/* Glow effect for current claimable */}
                {isCurrent && isClaimable && (
                  <span className="absolute inset-0 rounded-2xl animate-pulse bg-amber-300 opacity-30" />
                )}
              </button>

              {/* Day label */}
              <span className={`text-xs font-bold ${isCurrent ? 'text-amber-700' : 'text-gray-500'}`}>
                Día {reward.day}
              </span>

              {/* Amount */}
              {reward.amount && (
                <span className={`text-[10px] ${isCurrent ? 'text-amber-600' : 'text-gray-400'}`}>
                  +{reward.amount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

WeeklyRewardTrack.displayName = 'WeeklyRewardTrack';

// ============================================
// Milestone Progress
// ============================================

interface MilestoneProgressProps {
  currentStreak: number;
}

const MilestoneProgress: React.FC<MilestoneProgressProps> = memo(({ currentStreak }) => {
  const nextMilestone = STREAK_MILESTONES.find(m => m.days > currentStreak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const prevMilestone = STREAK_MILESTONES.filter(m => m.days <= currentStreak).pop();

  const progress = prevMilestone
    ? ((currentStreak - prevMilestone.days) / (nextMilestone.days - prevMilestone.days)) * 100
    : (currentStreak / nextMilestone.days) * 100;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-purple-800">Próximo hito</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{nextMilestone.reward}</span>
          <div>
            <span className="text-xs text-purple-600 block">{nextMilestone.title}</span>
            <span className="text-sm font-bold text-purple-800">{nextMilestone.days} días</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-purple-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-purple-800">
          {currentStreak} / {nextMilestone.days} días
        </div>
      </div>

      {/* Bonus preview */}
      <div className="mt-2 text-center">
        <span className="text-xs text-purple-600">
          Bonus: <span className="font-bold text-purple-800">+{nextMilestone.bonus} Nook Miles</span>
        </span>
      </div>
    </div>
  );
});

MilestoneProgress.displayName = 'MilestoneProgress';

// ============================================
// Reward Claim Celebration
// ============================================

interface ClaimCelebrationProps {
  reward: typeof WEEKLY_REWARDS[0];
  streakBonus: number;
  onClose: () => void;
}

const ClaimCelebration: React.FC<ClaimCelebrationProps> = memo(({ reward, streakBonus, onClose }) => {
  useEffect(() => {
    playSound('achievement');
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-amber-100 via-white to-amber-50 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border-4 border-amber-300 animate-in zoom-in-95 duration-500">
        {/* Celebration header */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <span className="text-7xl block animate-bounce-slow drop-shadow-xl">{reward.icon}</span>
            <div className="absolute -inset-4 bg-amber-300 rounded-full blur-xl opacity-30 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-amber-800 mt-4">¡Recompensa!</h2>
          <p className="text-amber-600">{reward.descriptionEs}</p>
        </div>

        {/* Reward details */}
        <div className="space-y-3 mb-6">
          {reward.amount && (
            <div className="flex items-center justify-between bg-amber-100 rounded-xl px-4 py-3">
              <span className="text-amber-700">Monedas</span>
              <span className="font-black text-amber-800 text-xl">+{reward.amount}</span>
            </div>
          )}

          <div className="flex items-center justify-between bg-green-100 rounded-xl px-4 py-3">
            <span className="text-green-700">Nook Miles</span>
            <span className="font-black text-green-800 text-xl">+{50 + streakBonus}</span>
          </div>

          {streakBonus > 0 && (
            <div className="text-center text-sm text-amber-600">
              <span className="inline-flex items-center gap-1">
                🔥 Bonus de racha: +{streakBonus} millas
              </span>
            </div>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          ¡Genial! 🎉
        </button>
      </div>
    </div>
  );
});

ClaimCelebration.displayName = 'ClaimCelebration';

// ============================================
// Stats Footer
// ============================================

interface StatsFooterProps {
  totalDays: number;
  lifetimeMiles: number;
  longestStreak: number;
}

const StatsFooter: React.FC<StatsFooterProps> = memo(({ totalDays, lifetimeMiles, longestStreak }) => (
  <div className="grid grid-cols-3 gap-3 mt-4">
    <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-3 text-center border border-blue-200">
      <span className="text-2xl block mb-1">📅</span>
      <span className="text-xl font-black text-blue-800">{totalDays}</span>
      <span className="text-[10px] text-blue-600 block">Días totales</span>
    </div>
    <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-3 text-center border border-green-200">
      <span className="text-2xl block mb-1">✈️</span>
      <span className="text-xl font-black text-green-800">{lifetimeMiles.toLocaleString()}</span>
      <span className="text-[10px] text-green-600 block">Millas ganadas</span>
    </div>
    <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-3 text-center border border-orange-200">
      <span className="text-2xl block mb-1">🏆</span>
      <span className="text-xl font-black text-orange-800">{longestStreak}</span>
      <span className="text-[10px] text-orange-600 block">Mejor racha</span>
    </div>
  </div>
));

StatsFooter.displayName = 'StatsFooter';

// ============================================
// Main Component
// ============================================

interface DailyRewardsPanelProps {
  onClose: () => void;
}

export function DailyRewardsPanel({ onClose }: DailyRewardsPanelProps) {
  const [isClaimable, setIsClaimable] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [claimedReward, setClaimedReward] = useState<typeof WEEKLY_REWARDS[0] | null>(null);
  const [streakBonus, setStreakBonus] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dailyStreak = useActivityStore((s) => s.dailyStreak);
  const nookMiles = useActivityStore((s) => s.nookMiles);
  const claimDailyReward = useActivityStore((s) => s.claimDailyReward);
  const addNookMiles = useActivityStore((s) => s.addNookMiles);
  const addCoin = useGameStore((s) => s.addCoin);

  // Check if reward is claimable
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setIsClaimable(dailyStreak.lastClaimDate !== today);
  }, [dailyStreak.lastClaimDate]);

  // Generate calendar data
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateStr: string;
    }> = [];

    // Fill empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, isCurrentMonth: false, isToday: false, dateStr: '' });
    }

    // Fill actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        dateStr,
      });
    }

    return days;
  }, [currentMonth]);

  const handleClaim = useCallback(() => {
    if (!isClaimable) return;

    const success = claimDailyReward();
    if (success) {
      const dayIndex = dailyStreak.currentStreak % 7;
      const reward = WEEKLY_REWARDS[dayIndex];
      const bonus = Math.min(dailyStreak.currentStreak * 10, 100);

      setClaimedReward(reward);
      setStreakBonus(bonus);
      setShowConfetti(true);
      setShowCelebration(true);

      // Apply rewards
      if (reward.type === 'coins' && reward.amount) {
        addCoin(reward.amount);
      }
      addNookMiles(50 + bonus);

      setIsClaimable(false);
      playSound('daily_reward');

      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [isClaimable, claimDailyReward, dailyStreak.currentStreak, addCoin, addNookMiles]);

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
    setClaimedReward(null);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const currentDay = (dailyStreak.currentStreak % 7) || 0;

  return (
    <>
      {/* Confetti */}
      <Confetti isActive={showConfetti} />

      {/* Celebration modal */}
      {showCelebration && claimedReward && (
        <ClaimCelebration
          reward={claimedReward}
          streakBonus={streakBonus}
          onClose={handleCloseCelebration}
        />
      )}

      {/* Main panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative bg-gradient-to-b from-amber-50 via-white to-orange-50 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border-4 border-amber-300 animate-in zoom-in-95 duration-300">
          <AnimatedStars />

          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <StreakFire streak={dailyStreak.currentStreak} />
              <div>
                <h2 className="text-2xl font-black drop-shadow-md">Recompensas Diarias</h2>
                <p className="text-white/90">¡Vuelve cada día para más premios!</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                    Mejor: {dailyStreak.longestStreak} días
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {/* Weekly reward track */}
            <WeeklyRewardTrack
              currentDay={currentDay}
              claimedDays={dailyStreak.weeklyProgress}
              onClaimToday={handleClaim}
              isClaimable={isClaimable}
            />

            {/* Calendar section */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  ←
                </button>
                <span className="font-bold text-gray-800">
                  {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  →
                </button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map(day => (
                  <div key={day} className="text-center text-xs font-bold text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarData.map((day, index) => (
                  <CalendarDay
                    key={index}
                    day={day.day}
                    isCurrentMonth={day.isCurrentMonth}
                    isToday={day.isToday}
                    isClaimed={dailyStreak.lastClaimDate === day.dateStr}
                    hasReward={day.isToday && isClaimable}
                  />
                ))}
              </div>
            </div>

            {/* Milestone progress */}
            <MilestoneProgress currentStreak={dailyStreak.currentStreak} />

            {/* Nook Miles display */}
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✈️</span>
                <div>
                  <span className="text-sm text-white/80 block">Nook Miles</span>
                  <span className="text-2xl font-black">{nookMiles.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-white/80 block">Total ganado</span>
                <span className="font-bold">{nookMiles.lifetime.toLocaleString()}</span>
              </div>
            </div>

            {/* Stats */}
            <StatsFooter
              totalDays={dailyStreak.totalDaysClaimed}
              lifetimeMiles={nookMiles.lifetime}
              longestStreak={dailyStreak.longestStreak}
            />
          </div>

          {/* Claim button */}
          <div className="p-4 bg-gradient-to-t from-amber-100 to-transparent">
            <button
              onClick={handleClaim}
              disabled={!isClaimable}
              className={`
                w-full py-4 rounded-2xl font-black text-lg transition-all
                ${isClaimable
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isClaimable ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-bounce">🎁</span>
                  Reclamar Recompensa
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ✓ Vuelve mañana
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }

        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall ease-out forwards;
        }

        @keyframes confetti-spin {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }
        .animate-confetti-spin {
          animation: confetti-spin linear infinite;
        }

        @keyframes flame {
          0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.8; }
          50% { transform: scaleY(1.2) translateY(-5px); opacity: 1; }
        }
        .animate-flame {
          animation: flame 0.5s ease-in-out infinite;
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.5s ease-in-out infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.4);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.6);
        }
      `}</style>
    </>
  );
}

export default DailyRewardsPanel;
