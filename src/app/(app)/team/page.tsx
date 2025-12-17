"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchMembers } from "../../../lib/data/members";
import { OrgMember } from "../../../lib/types";

export default function TeamPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchMembers();
        setMembers(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load team");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Team</h1>
        <p className="text-sm text-slate-600">
          Organization members (read-only view).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                User ID
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={3}>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && members.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={3}>
                  No members found.
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {member.display_name || "Unnamed"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {member.role || "n/a"}
                </td>
                <td className="px-4 py-3 text-slate-500">{member.user_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
