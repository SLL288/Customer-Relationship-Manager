"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchMessages } from "../../../lib/data/messages";
import { SmsMessage } from "../../../lib/types";

export default function MessagesPage() {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMessages();
        setMessages(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-600">
          SMS activity history (read-only).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                To
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Body
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Sent at
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={4}>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && messages.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={4}>
                  No messages found.
                </td>
              </tr>
            )}
            {messages.map((msg) => (
              <tr key={msg.id}>
                <td className="px-4 py-3 text-slate-900">{msg.to_phone}</td>
                <td className="px-4 py-3 text-slate-700">{msg.body}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {msg.status || "n/a"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {msg.sent_at
                    ? new Date(msg.sent_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
