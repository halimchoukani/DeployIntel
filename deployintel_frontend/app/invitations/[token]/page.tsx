"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { acceptInvitation, declineInvitation } from "@/lib/api/members";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";

export default function InvitationAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { data: currentUser, isLoading: isLoadingAuth } = useAuthUser();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "accepted" | "declined" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [acceptedProjectId, setAcceptedProjectId] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const member = await acceptInvitation(token);
      setStatus("accepted");
      setAcceptedProjectId(member.projectId);
      setTimeout(() => {
        router.push(`/projects/${member.projectId}`);
      }, 1600);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to accept invitation. It may be expired or already accepted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await declineInvitation(token);
      setStatus("declined");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to decline invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
        {/* Brand / Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Users className="w-7 h-7" />
        </div>

        {status === "accepted" ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Invitation Accepted!
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You are now a collaborator on this project. Redirecting you to the dashboard…
            </p>
            {acceptedProjectId && (
              <Link
                href={`/projects/${acceptedProjectId}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Go to project workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : status === "declined" ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Invitation Declined
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You have declined this project invitation.
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Return to your projects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-3.5 h-3.5" /> Project Collaboration Invitation
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Join Project Workspace
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                You have been invited to collaborate on DeployIntel with role-based permissions to monitor releases, gate verdicts, and test environments.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {!isLoadingAuth && !currentUser ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-left space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                  <Lock className="w-4 h-4" /> Please sign in to accept
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  You need an active DeployIntel account matching your invited email to accept this invitation.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/login?redirect=/invitations/${token}`}
                    className="flex-1 text-center py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Log In
                  </Link>
                  <Link
                    href={`/signup?redirect=/invitations/${token}`}
                    className="flex-1 text-center py-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl transition shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Accepting…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Accept Invitation & Join Team
                    </>
                  )}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Decline Invitation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
