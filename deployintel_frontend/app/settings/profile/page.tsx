"use client";

import React, { useState, useRef } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { editProfile } from "@/lib/api/user";
import { uploadToCloudinary } from "@/lib/api/cloudinary";
import { clearAuthSession } from "@/lib/auth/session";
import { ThemeSelector } from "@/components/ui/theme-toggle";

function getInitialFormData(user: ProfileUser | undefined) {
  let fName = user?.firstName || "";
  let lName = user?.lastName || "";
  if (!fName && !lName && user?.email) {
    const parts = user.email.split("@")[0].split(/[._-]/);
    fName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    if (parts.length > 1) {
      lName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
  }
  return {
    firstName: fName,
    lastName: lName,
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || ""
  };
}

export default function ProfilePage() {
  const { data: user, isLoading } = useAuthUser();

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-card-border border-t-ring rounded-full animate-spin"></div>
      </div>
    );
  }

  return <ProfileContent key={user?.id || user?.email || "profile"} user={user} />;
}

interface ProfileUser {
  id?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

function ProfileContent({ user }: { user: ProfileUser | undefined }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCriticalAlertsEnabled, setIsCriticalAlertsEnabled] = useState(true);
  const [isWeeklySummaryEnabled, setIsWeeklySummaryEnabled] = useState(true);

  const [formData, setFormData] = useState(() => getInitialFormData(user));
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
      };
      const res = await editProfile(payload);
      if (res) {
        queryClient.invalidateQueries({ queryKey: ["auth_user"] });
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        console.error("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({ ...prev, avatarUrl: url }));
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert(err instanceof Error ? err.message : "Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    router.replace("/login");
  };

  const email = user?.email || "";
  const role = user?.role === "ADMIN" ? "Admin" : "Developer / Tech Lead";
  const gitHandle = email.split("@")[0].toLowerCase();

  return (
    <div className="p-8 max-w-4xl pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal information, developer credentials, and account preferences.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full border border-card-border">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[11px] font-medium text-muted-foreground">Session: CLI Verified</span>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="space-y-6">
        {/* Profile Card & Preview */}
        <div className="flex items-start gap-6 bg-card p-6 rounded-2xl border border-card-border shadow-sm">
          <div className="flex-1 flex gap-5">
            {/* Avatar */}
            <div className="relative">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="w-20 h-20 rounded-2xl bg-muted border border-card-border overflow-hidden flex items-center justify-center">
                {isUploadingAvatar ? (
                  <div className="w-6 h-6 border-2 border-muted-foreground border-t-ring rounded-full animate-spin" />
                ) : formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-ring rounded-full border-2 border-background flex items-center justify-center" />
            </div>

            {/* Info & Actions */}
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-foreground">{formData.firstName} {formData.lastName}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 dark:bg-accent/20 dark:border-accent/30">
                  Tech Lead
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">JPG, GIF or PNG. Max size 2MB.</p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 disabled:opacity-50 text-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isUploadingAvatar ? (
                    <>
                      <div className="w-3 h-3 border-2 border-muted-foreground border-t-ring rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : "Change photo"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: "" }))}
                  className="text-xs font-medium text-destructive hover:text-destructive transition-colors"
                >
                  Remove photo
                </button>
              </div>
            </div>
          </div>

          {/* Live Session Preview Popover */}
          <div className="w-[280px] bg-card rounded-xl shadow-lg border border-card-border overflow-hidden shrink-0">
            <div className="p-4 flex items-center gap-3 border-b border-card-border">
              <div className="w-10 h-10 rounded-full bg-muted border border-card-border flex items-center justify-center overflow-hidden shrink-0">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{formData.firstName} {formData.lastName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{email}</p>
              </div>
            </div>
            <div className="p-2 space-y-0.5">
              <div className="flex items-center justify-between px-3 py-2 rounded-md bg-accent/5 dark:bg-accent/10">
                <div className="flex items-center gap-2 text-accent">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="text-xs font-medium">Profile View</span>
                </div>
                <span className="text-[10px] font-medium text-accent">Active</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted cursor-pointer">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  <span className="text-xs font-medium">Settings</span>
                </div>
              </div>
            </div>
            <div className="p-2 border-t border-card-border">
              <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/10 dark:hover:bg-destructive/20 text-destructive transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-xs font-medium">Sign Out</span>
              </button>
            </div>
            <div className="bg-muted p-2 text-center border-t border-card-border">
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">Live Session Preview</span>
            </div>
          </div>
        </div>

        {/* Appearance / Theme */}
        <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-1">Appearance & Interface Theme</h3>
          <p className="text-sm text-muted-foreground mb-4">Choose how DeployIntel looks on your device.</p>
          <div className="max-w-md">
            <ThemeSelector />
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
            <span className="text-[11px] text-muted-foreground">Last updated today</span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full h-10 px-3 bg-input-bg border border-input-border focus:border-ring focus:ring-1 focus:ring-ring/20 rounded-lg text-sm text-foreground outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full h-10 px-3 bg-input-bg border border-input-border focus:border-ring focus:ring-1 focus:ring-ring/20 rounded-lg text-sm text-foreground outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Work Email</label>
              <div className="relative">
                <input type="email" defaultValue={email} readOnly className="w-full h-10 pl-3 pr-20 bg-input-bg border border-input-border rounded-lg text-sm text-muted-foreground outline-none" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded text-[10px] font-bold border border-success/20 dark:bg-success/20 dark:border-success/30">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Verified
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Role / Function</label>
              <input type="text" defaultValue={role} readOnly className="w-full h-10 px-3 bg-input-bg border border-input-border rounded-lg text-sm text-muted-foreground outline-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Git Identity</label>
              <div className="flex items-center gap-3 h-10 px-3 bg-input-bg border border-input-border rounded-lg text-sm">
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span className="text-muted-foreground">github.com/</span>
                <span className="text-foreground font-medium">{gitHandle}</span>
                <div className="ml-auto">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card p-6 rounded-2xl border border-card-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-1">Preferences & Notification Defaults</h3>
          <p className="text-sm text-muted-foreground mb-6">Configure how intelligence telemetry alerts are delivered to your inbox.</p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl border border-card-border bg-muted/40">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground">Critical & High Risk Deployments</h4>
                <p className="text-xs text-muted-foreground">Immediate ping via email and Slack when pipeline breach score {'>'} 80/100.</p>
              </div>
              <button
                onClick={() => setIsCriticalAlertsEnabled(!isCriticalAlertsEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isCriticalAlertsEnabled ? "bg-ring" : "bg-muted"}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isCriticalAlertsEnabled ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-card-border bg-muted/40">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground">Weekly Intelligence Summary</h4>
                <p className="text-xs text-muted-foreground">Aggregated report of blocked vulnerabilities, false positives, and speed metrics.</p>
              </div>
              <button
                onClick={() => setIsWeeklySummaryEnabled(!isWeeklySummaryEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isWeeklySummaryEnabled ? "bg-ring" : "bg-muted"}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isWeeklySummaryEnabled ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-6 right-6 left-[244px] max-w-[850px] bg-card border border-card-border rounded-xl shadow-lg p-3 flex items-center justify-between z-10">
        <div className={`flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-medium border border-success/20 dark:bg-success/20 dark:border-success/30 transition-opacity duration-300 ${showSuccessMessage ? 'opacity-100' : 'opacity-0'}`}>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          Profile updated successfully.
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2">
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="h-9 px-4 bg-ring hover:bg-ring/90 disabled:opacity-50 text-ring-foreground text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-ring-foreground border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}