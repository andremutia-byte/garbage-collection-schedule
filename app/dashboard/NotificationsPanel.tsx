"use client";

import { useState, useTransition } from "react";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryIcon(name: string | null | undefined) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("recycl")) return <Recycle className="h-4 w-4" />;
  if (n.includes("green") || n.includes("garden") || n.includes("organic"))
    return <Leaf className="h-4 w-4" />;
  return <Trash2 className="h-4 w-4" />;
}

function getCategoryColor(name: string | null | undefined) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("recycl"))
    return "bg-blue-100 text-blue-700 border-blue-200";
  if (n.includes("green") || n.includes("garden") || n.includes("organic"))
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (n.includes("hazard"))
    return "bg-red-100 text-red-700 border-red-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Single notification card ─────────────────────────────────────────────────

function NotificationCard({
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
      className={`relative flex gap-3 rounded-xl border p-4 transition-all ${
        isUnread
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-100 bg-white opacity-70"
      }`}
    >
      {/* Category icon badge */}
      <div
        className={`flex-shrink-0 h-9 w-9 rounded-full border flex items-center justify-center mt-0.5 ${getCategoryColor(catName)}`}
      >
        {getCategoryIcon(catName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            isUnread ? "font-medium text-slate-900" : "text-slate-600"
          }`}
        >
          {notification.message}
        </p>
        {notification.pickup?.scheduled_date && (
          <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
            <CalendarDays className="h-3 w-3" />
            {new Date(notification.pickup.scheduled_date + "T00:00:00").toLocaleDateString(
              "en-US",
              { weekday: "short", month: "short", day: "numeric" }
            )}
          </p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">{timeAgo(notification.created_at)}</p>
      </div>

      {/* Unread dot + dismiss */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {isUnread && (
          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1" />
        )}
        {isUnread && (
          <button
            onClick={handleRead}
            disabled={isPending}
            title="Mark as read"
            className="text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
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

// ─── Main panel ───────────────────────────────────────────────────────────────

interface NotificationsPanelProps {
  notifications: ResidentNotification[];
}

export function NotificationsPanel({ notifications: initial }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleRead = (id: string) => {
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <h2 className="font-semibold text-slate-900 text-sm">Notifications</h2>
          {unreadCount > 0 && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <BellOff className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No notifications yet</p>
            <p className="text-xs text-slate-400">
              Pickup reminders will appear here once scheduled.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
