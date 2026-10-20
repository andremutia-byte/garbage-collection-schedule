"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Bell,
  BellOff,
  CalendarDays,
  Check,
  CheckCheck,
  Loader2,
  Recycle,
  Leaf,
  Trash2,
  X,
} from "lucide-react";
import type { ResidentNotification } from "@/app/actions/notifications";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/actions/notifications";

// ─── Category Helpers ─────────────────────────────────────────────────────────

function getCategoryIcon(name: string | null | undefined) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("recycl")) return <Recycle className="h-4 w-4" />;
  if (n.includes("green") || n.includes("garden") || n.includes("organic") || n.includes("bio"))
    return <Leaf className="h-4 w-4" />;
  return <Trash2 className="h-4 w-4" />;
}

function getCategoryColor(name: string | null | undefined) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("recycl"))
    return "bg-blue-50 text-blue-600 border-blue-200";
  if (n.includes("green") || n.includes("garden") || n.includes("organic") || n.includes("bio"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (n.includes("hazard"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Single Notification Item ──────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
}: {
  notification: ResidentNotification;
  onRead: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isUnread = !notification.read_at;
  const catName = notification.pickup?.waste_category?.name ?? null;

  const handleRead = () => {
    if (!isUnread || isPending) return;
    startTransition(async () => {
      await markNotificationRead(notification.id);
      onRead(notification.id);
    });
  };

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border p-3 transition-all ${
        isUnread
          ? "border-emerald-200 bg-emerald-50/70 shadow-2xs"
          : "border-slate-100 bg-white opacity-85 hover:opacity-100"
      }`}
    >
      {/* Category icon */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-lg border flex items-center justify-center mt-0.5 ${getCategoryColor(
          catName
        )}`}
      >
        {getCategoryIcon(catName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs sm:text-sm leading-snug ${
            isUnread ? "font-bold text-slate-900" : "font-normal text-slate-600"
          }`}
        >
          {notification.message}
        </p>

        {notification.pickup?.scheduled_date && (
          <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-medium">
            <CalendarDays className="h-3 w-3 text-emerald-600 shrink-0" />
            {new Date(notification.pickup.scheduled_date + "T00:00:00").toLocaleDateString(
              "en-US",
              { weekday: "short", month: "short", day: "numeric" }
            )}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-slate-400">
            {timeAgo(notification.created_at)}
          </span>
          {isUnread ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Unread
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">
              Read
            </span>
          )}
        </div>
      </div>

      {/* Mark single as read button */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-0.5">
        {isUnread && (
          <button
            type="button"
            onClick={handleRead}
            disabled={isPending}
            title="Mark as read"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/70 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Header Notification Bell & Dropdown ───────────────────────────────────────

interface NotificationBellDropdownProps {
  initialNotifications?: ResidentNotification[];
}

export function NotificationBellDropdown({
  initialNotifications = [],
}: NotificationBellDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ResidentNotification[]>(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Sync state if initialNotifications changes (e.g. server revalidation)
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleReadSingle = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clickable Notification Bell Button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Resident Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border transition-all cursor-pointer select-none ${
          isOpen
            ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
            : "border-slate-200/90 bg-white text-slate-600 hover:border-emerald-300 hover:bg-slate-50 hover:text-emerald-700 shadow-2xs"
        }`}
      >
        <Bell className="h-4.5 w-4.5" />

        {/* Small badge showing unread notifications count */}
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs animate-in zoom-in-75 duration-150"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Clean Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[420px] rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Dropdown Header — Always visible while scrolling inside notification list */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-emerald-600" />
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={isPending}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close notification panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dedicated Vertical Scrollable List Container */}
          <div
            id="notification-list-scroll-container"
            className="max-h-[360px] sm:max-h-[400px] overflow-y-auto overflow-x-hidden p-3 space-y-2 custom-scrollbar bg-slate-50/40"
            style={{ overscrollBehaviorY: "contain" }}
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-3">
                  <BellOff className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-900">No notifications yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Pickup reminders and collection updates for your registered address will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleReadSingle}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
