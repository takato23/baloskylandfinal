/**
 * Seasonal Event Manager
 * Detects and manages active seasonal events based on current date
 * Shows event banners, notifications, and special effects
 */

import React, { useEffect, useState, useCallback, memo } from 'react';
import { useActivityStore } from '../../stores/activityStore';
import { SEASONAL_EVENTS, SPECIAL_VISITORS, HOURLY_EVENTS, type SeasonalEvent, type SpecialVisitor, type HourlyEvent } from '../../types/daily-events';
import { playSound } from '../../utils/audio';

// ============================================
// Helper Functions
// ============================================

const getCurrentDateString = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

const isDateInRange = (current: string, start: string, end: string): boolean => {
  // Handle year wrap-around (e.g., 12-31 to 01-02)
  if (start > end) {
    return current >= start || current <= end;
  }
  return current >= start && current <= end;
};

const getDayOfWeek = (): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  return days[new Date().getDay()] as any;
};

const getCurrentHour = () => new Date().getHours();

// ============================================
// Event Notification Component
// ============================================

interface EventNotificationProps {
  event: SeasonalEvent;
  onClose: () => void;
}

const EventNotification: React.FC<EventNotificationProps> = memo(({ event, onClose }) => {
  useEffect(() => {
    playSound('achievement');
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-10 duration-500">
      <div className="bg-gradient-to-br from-amber-100 to-orange-100 border-4 border-amber-400 rounded-2xl p-4 shadow-2xl max-w-sm">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-bounce">{event.icon}</span>
          <div>
            <h3 className="font-bold text-amber-900 text-lg">{event.nameEs}</h3>
            <p className="text-amber-700 text-sm">{event.descriptionEs}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-amber-600 bg-amber-200 px-2 py-1 rounded-full">
            Evento especial activo
          </span>
          <button
            onClick={onClose}
            className="text-amber-600 hover:text-amber-800 text-sm font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
});

EventNotification.displayName = 'EventNotification';

// ============================================
// Visitor Notification Component
// ============================================

interface VisitorNotificationProps {
  visitor: SpecialVisitor;
  onClose: () => void;
}

const VisitorNotification: React.FC<VisitorNotificationProps> = memo(({ visitor, onClose }) => {
  useEffect(() => {
    playSound('daily_reward');
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-10 duration-500">
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-400 rounded-2xl p-4 shadow-2xl max-w-xs">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{visitor.icon}</span>
          <div>
            <h3 className="font-bold text-purple-900">{visitor.nameEs}</h3>
            <p className="text-purple-700 text-xs">{visitor.descriptionEs}</p>
          </div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
            Visitante especial en la ciudad
          </span>
        </div>
      </div>
    </div>
  );
});

VisitorNotification.displayName = 'VisitorNotification';

// ============================================
// Hourly Event Toast Component
// ============================================

interface HourlyEventToastProps {
  event: HourlyEvent;
  onClose: () => void;
}

const HourlyEventToast: React.FC<HourlyEventToastProps> = memo(({ event, onClose }) => {
  useEffect(() => {
    playSound('coin');
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white/90 backdrop-blur-md border-2 border-gray-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
        <span className="text-xl">{event.icon}</span>
        <span className="text-sm font-medium text-gray-700">{event.nameEs}</span>
      </div>
    </div>
  );
});

HourlyEventToast.displayName = 'HourlyEventToast';

// ============================================
// Active Event Banner Component
// ============================================

interface ActiveEventBannerProps {
  event: SeasonalEvent;
  onClick: () => void;
}

const ActiveEventBanner: React.FC<ActiveEventBannerProps> = memo(({ event, onClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-4 right-4 z-30 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white animate-pulse"
        aria-label="Mostrar evento"
      >
        <span className="text-2xl">{event.icon}</span>
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-30">
      <button
        onClick={onClick}
        className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 text-white rounded-2xl px-4 py-2 shadow-lg border-2 border-white flex items-center gap-2 hover:scale-105 transition-transform"
      >
        <span className="text-xl animate-bounce">{event.icon}</span>
        <div className="text-left">
          <div className="font-bold text-sm">{event.nameEs}</div>
          <div className="text-xs opacity-90">Evento activo</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(true);
          }}
          className="ml-2 text-white/70 hover:text-white"
          aria-label="Minimizar"
        >
          ✕
        </button>
      </button>
    </div>
  );
});

ActiveEventBanner.displayName = 'ActiveEventBanner';

// ============================================
// Event Details Modal
// ============================================

interface EventDetailsModalProps {
  event: SeasonalEvent;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = memo(({ event, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl max-w-md w-full shadow-2xl border-4 border-amber-300 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-6 text-white relative">
          <span className="absolute top-4 right-4 text-6xl opacity-20">{event.icon}</span>
          <span className="text-5xl mb-2 block">{event.icon}</span>
          <h2 className="text-2xl font-bold">{event.nameEs}</h2>
          <p className="text-white/90 mt-1">{event.descriptionEs}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Duration */}
          <div className="bg-white rounded-xl p-3 mb-4 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Duración del evento</div>
            <div className="font-bold text-amber-700">
              {event.startDate.replace('-', '/')} - {event.endDate.replace('-', '/')}
            </div>
          </div>

          {/* Special Items */}
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Items especiales</div>
            <div className="flex flex-wrap gap-2">
              {event.specialItems.slice(0, 6).map((item) => (
                <span
                  key={item}
                  className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm border border-amber-200"
                >
                  {item.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Special Activities */}
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Actividades especiales</div>
            <div className="flex flex-wrap gap-2">
              {event.specialActivities.map((activity) => (
                <span
                  key={activity}
                  className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm border border-orange-200"
                >
                  {activity.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Special NPCs */}
          {event.specialNPCs && event.specialNPCs.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Visitantes especiales</div>
              <div className="flex gap-2">
                {event.specialNPCs.map((npc) => (
                  <span
                    key={npc}
                    className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200"
                  >
                    {npc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-amber-100 border-t border-amber-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-shadow"
          >
            Participar
          </button>
        </div>
      </div>
    </div>
  );
});

EventDetailsModal.displayName = 'EventDetailsModal';

// ============================================
// Main Component
// ============================================

export const SeasonalEventManager: React.FC = () => {
  const { activeEvent, setActiveEvent } = useActivityStore();
  const [showEventNotification, setShowEventNotification] = useState(false);
  const [currentVisitor, setCurrentVisitor] = useState<SpecialVisitor | null>(null);
  const [currentHourlyEvent, setCurrentHourlyEvent] = useState<HourlyEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [lastNotifiedEvent, setLastNotifiedEvent] = useState<string | null>(null);
  const [lastHour, setLastHour] = useState<number>(getCurrentHour());

  // Check for active seasonal events
  const checkSeasonalEvents = useCallback(() => {
    const currentDate = getCurrentDateString();

    const activeEvents = SEASONAL_EVENTS.filter(event =>
      isDateInRange(currentDate, event.startDate, event.endDate)
    );

    if (activeEvents.length > 0) {
      const event = activeEvents[0]; // Take first active event

      if (!activeEvent || activeEvent.id !== event.id) {
        setActiveEvent(event);

        // Show notification only once per event
        if (lastNotifiedEvent !== event.id) {
          setShowEventNotification(true);
          setLastNotifiedEvent(event.id);
        }
      }
    } else if (activeEvent) {
      setActiveEvent(null);
    }
  }, [activeEvent, setActiveEvent, lastNotifiedEvent]);

  // Check for special visitors
  const checkSpecialVisitors = useCallback(() => {
    const dayOfWeek = getDayOfWeek();

    const possibleVisitors = SPECIAL_VISITORS.filter(visitor =>
      visitor.visitDays.includes(dayOfWeek)
    );

    // Random chance for visitor to appear
    const randomVisitor = possibleVisitors.find(visitor =>
      Math.random() < visitor.visitChance
    );

    if (randomVisitor && (!currentVisitor || currentVisitor.id !== randomVisitor.id)) {
      setCurrentVisitor(randomVisitor);
    }
  }, [currentVisitor]);

  // Check for hourly events
  const checkHourlyEvents = useCallback(() => {
    const currentHour = getCurrentHour();

    if (currentHour !== lastHour) {
      setLastHour(currentHour);

      const hourlyEvent = HOURLY_EVENTS.find(event => event.hour === currentHour);
      if (hourlyEvent) {
        setCurrentHourlyEvent(hourlyEvent);
      }
    }
  }, [lastHour]);

  // Initial check and periodic updates
  useEffect(() => {
    checkSeasonalEvents();
    checkSpecialVisitors();
    checkHourlyEvents();

    // Check every minute for events
    const interval = setInterval(() => {
      checkSeasonalEvents();
      checkHourlyEvents();
    }, 60000);

    // Check for visitors once per hour
    const visitorInterval = setInterval(checkSpecialVisitors, 3600000);

    return () => {
      clearInterval(interval);
      clearInterval(visitorInterval);
    };
  }, [checkSeasonalEvents, checkSpecialVisitors, checkHourlyEvents]);

  const handleCloseEventNotification = useCallback(() => {
    setShowEventNotification(false);
  }, []);

  const handleCloseVisitorNotification = useCallback(() => {
    setCurrentVisitor(null);
  }, []);

  const handleCloseHourlyToast = useCallback(() => {
    setCurrentHourlyEvent(null);
  }, []);

  const handleOpenEventDetails = useCallback(() => {
    setShowEventDetails(true);
  }, []);

  const handleCloseEventDetails = useCallback(() => {
    setShowEventDetails(false);
  }, []);

  return (
    <>
      {/* Event Notification (shows once when event starts) */}
      {showEventNotification && activeEvent && (
        <EventNotification event={activeEvent} onClose={handleCloseEventNotification} />
      )}

      {/* Visitor Notification */}
      {currentVisitor && (
        <VisitorNotification visitor={currentVisitor} onClose={handleCloseVisitorNotification} />
      )}

      {/* Hourly Event Toast */}
      {currentHourlyEvent && (
        <HourlyEventToast event={currentHourlyEvent} onClose={handleCloseHourlyToast} />
      )}

      {/* Active Event Banner (persistent) */}
      {activeEvent && !showEventNotification && (
        <ActiveEventBanner event={activeEvent} onClick={handleOpenEventDetails} />
      )}

      {/* Event Details Modal */}
      {showEventDetails && activeEvent && (
        <EventDetailsModal event={activeEvent} onClose={handleCloseEventDetails} />
      )}
    </>
  );
};

export default SeasonalEventManager;
