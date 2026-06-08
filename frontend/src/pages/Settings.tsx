// frontend/src/pages/Settings.tsx

import { useState, useEffect, useRef, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  getNotificationPreferences,
  updateNotificationPreferences,
  removeDevice,
} from "../services/api";

import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  isCurrentlySubscribed,
} from "../utils/pushSubscribe";

import Help from "./Help";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };

const BLUE = "#a88632";
const BLUEB = "#c6a24a";
const ICEB = "rgba(214,190,122,.72)";
const SH_CARD = "0 24px 70px rgba(0,0,0,.72), 0 0 0 1px rgba(168,134,50,.18)";

const PAGE_WRAP: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  background: "url('/set.jpg') center / cover fixed no-repeat",
  color: "#fff",
  overflowY: "auto",
  ...DM,
};

const GLASS: CSSProperties = {
  background: "transparent",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(168,134,50,.72)",
  borderTop: "2px solid rgba(198,162,74,.9)",
  boxShadow: "0 18px 50px rgba(0,0,0,.28)",
};

const ROLE_DISPLAY: Record<string, string> = {
  citizen: "Citizen",
  lawyer: "Lawyer",
  court_staff: "Legal Coordinator",
};

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || "?";
}

interface DeviceInfo {
  deviceLabel: string;
  createdAt: string;
  endpoint: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<
    "profile" | "password" | "notifications" | "help" | "privacy"
  >("profile");

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    avatar: "",
    role: "",
  });

  const [editMode, setEditMode] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  });

  const [saving, setSaving] = useState(false);

  const [profileMsg, setProfileMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [avatarMsg, setAvatarMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>("default");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const [notifMsg, setNotifMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [notifPrefs, setNotifPrefs] = useState({
    hearingReminders: true,
    caseUpdates: true,
    reminderDays: [7, 1, 0],
  });

  const [savingNotifs, setSavingNotifs] = useState(false);

  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    checkPushStatus();
    fetchNotificationPrefs();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await getProfile();
      const user = res.data.user;

      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
        role: user.role || "",
      });

      setEditForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
      });
    } catch (err: any) {
      if (err.response?.status === 401) navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      setProfileMsg({ type: "error", text: "Name is required" });
      return;
    }

    if (!editForm.email.trim()) {
      setProfileMsg({ type: "error", text: "Email is required" });
      return;
    }

    try {
      setSaving(true);
      setProfileMsg(null);

      const res = await updateProfile(editForm);
      const updated = res.data.user;

      setProfile((prev) => ({
        ...prev,
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        address: updated.address || "",
        bio: updated.bio || "",
      }));

      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const u = JSON.parse(storedUser);
        u.name = updated.name;
        u.email = updated.email;
        localStorage.setItem("user", JSON.stringify(u));
      }

      setProfileMsg({
        type: "success",
        text: "Profile updated successfully!",
      });

      setEditMode(false);
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({
        type: "error",
        text: "File size must be less than 5MB",
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      setAvatarMsg(null);

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await uploadAvatar(formData);

      setProfile((prev) => ({
        ...prev,
        avatar: res.data.avatar,
      }));

      setAvatarMsg({ type: "success", text: "Avatar updated!" });
      setTimeout(() => setAvatarMsg(null), 3000);
    } catch (err: any) {
      setAvatarMsg({
        type: "error",
        text: err.response?.data?.message || "Upload failed",
      });
    } finally {
      setUploadingAvatar(false);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMsg({
        type: "error",
        text: "Please fill in all fields",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: "Passwords do not match",
      });
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMsg(null);

      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordMsg({
        type: "success",
        text: "Password changed successfully!",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    if (!confirm("Are you sure you want to logout?")) return;

    const userStr = localStorage.getItem("user");

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const key = `voicePromptDone_${user.id || user._id || user.email}`;
        localStorage.removeItem(key);
      } catch {}
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("voiceGreetingDone");

    navigate("/");
  };

  const checkPushStatus = async () => {
    setPushSupported(isPushSupported());
    setPushPermission(getNotificationPermission());
    setPushSubscribed(await isCurrentlySubscribed());
  };

  const handleEnablePush = async () => {
    setPushLoading(true);

    const result = await subscribeToPush();

    setNotifMsg({
      type: result.success ? "success" : "error",
      text: result.message,
    });

    await checkPushStatus();
    await fetchNotificationPrefs();

    setPushLoading(false);
    setTimeout(() => setNotifMsg(null), 3000);
  };

  const handleDisablePush = async () => {
    setPushLoading(true);

    const result = await unsubscribeFromPush();

    setNotifMsg({
      type: result.success ? "success" : "error",
      text: result.message,
    });

    await checkPushStatus();
    await fetchNotificationPrefs();

    setPushLoading(false);
    setTimeout(() => setNotifMsg(null), 3000);
  };

  const handleTestPush = async () => {
    setPushLoading(true);

    const result = await sendTestPush();

    setNotifMsg({
      type: result.success ? "success" : "error",
      text: result.message,
    });

    setPushLoading(false);
    setTimeout(() => setNotifMsg(null), 3000);
  };

  const fetchNotificationPrefs = async () => {
    try {
      const { data } = await getNotificationPreferences();

      if (data.preferences) {
        setNotifPrefs({
          hearingReminders: data.preferences.hearingReminders ?? true,
          caseUpdates: data.preferences.caseUpdates ?? true,
          reminderDays: data.preferences.reminderDays ?? [7, 1, 0],
        });
      }

      setDevices(data.devices || []);
    } catch (err) {
      console.error("Failed to fetch notification prefs:", err);
    }
  };

  const handleSaveNotifPrefs = async (
    updates: Partial<typeof notifPrefs>
  ) => {
    const newPrefs = {
      ...notifPrefs,
      ...updates,
    };

    setNotifPrefs(newPrefs);
    setSavingNotifs(true);

    try {
      await updateNotificationPreferences(newPrefs);

      setNotifMsg({
        type: "success",
        text: "Preferences saved",
      });

      setTimeout(() => setNotifMsg(null), 2000);
    } catch (err: any) {
      setNotifMsg({
        type: "error",
        text: "Failed to save preferences",
      });
    } finally {
      setSavingNotifs(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    const current = notifPrefs.reminderDays;

    const newDays = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => b - a);

    handleSaveNotifPrefs({ reminderDays: newDays });
  };

  const handleRemoveDevice = async (endpoint: string, label: string) => {
    if (!confirm(`Remove "${label}" from notifications?`)) return;

    setRemovingDevice(endpoint);

    try {
      await removeDevice(endpoint);
      await fetchNotificationPrefs();
      await checkPushStatus();

      setNotifMsg({
        type: "success",
        text: "Device removed",
      });

      setTimeout(() => setNotifMsg(null), 2000);
    } catch (err) {
      setNotifMsg({
        type: "error",
        text: "Failed to remove device",
      });
    } finally {
      setRemovingDevice(null);
    }
  };

  if (loading) {
    return (
      <div style={PAGE_WRAP}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            ...DM,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid rgba(168,134,50,.22)",
                borderTop: "3px solid #a88632",
                borderRadius: 0,
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />

            <p style={{ fontSize: 14, color: "rgba(210,199,166,.62)" }}>
              Loading profile...
            </p>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={PAGE_WRAP}>
      <div
        style={{
          width: "min(1040px, calc(100% - 56px))",
          margin: "0 auto",
          padding: "72px 0 80px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Header */}
        <div>
          <p
            style={{
              ...DM,
              fontSize: 9,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "rgba(198,162,74,.72)",
            }}
          >
            ACCOUNT
          </p>

          <p
            style={{
              ...BN,
              fontSize: 32,
              color: "#fff",
              marginTop: 4,
            }}
          >
            My Account
          </p>
        </div>

        {/* Profile Card */}
        <div
          style={{
            ...GLASS,
            borderRadius: 0,
            padding: "28px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "8%",
              right: "8%",
              height: 1,
              background:
                "linear-gradient(90deg,transparent,rgba(212,175,55,0.75),transparent)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 0,
                  background: "linear-gradient(135deg,#17140f,#090c18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  ...DM,
                  color: "#fff",
                  boxShadow: "inset 0 0 0 1px rgba(168,134,50,.55), 0 18px 45px rgba(0,0,0,.55)",
                  overflow: "hidden",
                }}
              >
                {profile.avatar ? (
                  <img
                    src={`http://localhost:8000/uploads/${profile.avatar}`}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  getInitials(profile.name)
                )}
              </div>

              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  borderRadius: 0,
                  background: BLUE,
                  color: "#080a12",
                  border: "1px solid rgba(198,162,74,.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  cursor: uploadingAvatar ? "not-allowed" : "pointer",
                  boxShadow: SH_CARD,
                }}
              >
                {uploadingAvatar ? "..." : "+"}
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: "none" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <p
                style={{
                  ...DM,
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {profile.name}
              </p>

              <p
                style={{
                  ...DM,
                  fontSize: 12,
                  color: ICEB,
                  marginTop: 2,
                }}
              >
                {profile.email}
              </p>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span
                  style={{
                    ...DM,
                    fontSize: 9,
                    padding: "4px 12px",
                    borderRadius: 0,
                    background: "rgba(52,211,153,.15)",
                    border: "1px solid rgba(52,211,153,.3)",
                    color: "#34d399",
                  }}
                >
                  {ROLE_DISPLAY[profile.role] || profile.role}
                </span>

                {profile.phone && (
                  <span
                    style={{
                      ...DM,
                      fontSize: 9,
                      padding: "4px 12px",
                      borderRadius: 0,
                      background: "rgba(168,134,50,.08)",
                      border: "1px solid rgba(168,134,50,.28)",
                      color: "rgba(210,199,166,.62)",
                    }}
                  >
                    Phone: {profile.phone}
                  </span>
                )}
              </div>

              {avatarMsg && (
                <p
                  style={{
                    ...DM,
                    fontSize: 10,
                    color:
                      avatarMsg.type === "success" ? "#34d399" : "#ff6b6b",
                    marginTop: 8,
                  }}
                >
                  {avatarMsg.text}
                </p>
              )}
            </div>

            <button
              onClick={handleLogout}
              style={{
                ...DM,
                background: "rgba(239,68,68,.15)",
                color: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: 0,
                border: "1px solid rgba(239,68,68,.3)",
                cursor: "pointer",
                transition: "all .2s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(239,68,68,.25)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(239,68,68,.15)")
              }
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            ...GLASS,
            borderRadius: 0,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "profile" as const, label: "Profile" },
            { id: "password" as const, label: "Settings" },
            { id: "notifications" as const, label: "Notifications" },
            { id: "help" as const, label: "Help & Support" },
            { id: "privacy" as const, label: "Privacy" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...DM,
                fontSize: 12,
                fontWeight: 600,
                padding: "10px 24px",
                borderRadius: 0,
                cursor: "pointer",
                background: tab === t.id ? BLUE : "rgba(2,4,12,.55)",
                color: tab === t.id ? "#080a12" : "rgba(234,226,203,.78)",
                border:
                  tab === t.id ? "1px solid rgba(198,162,74,.95)" : "1px solid rgba(168,134,50,.48)",
                transition: "all .2s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div
            style={{
              ...GLASS,
              borderRadius: 0,
              padding: "28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "8%",
                right: "8%",
                height: 1,
                background:
                  "linear-gradient(90deg,transparent,rgba(212,175,55,0.75),transparent)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  ...DM,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                Profile Information
              </p>

              {!editMode ? (
                <button
                  onClick={() => {
                    setEditMode(true);
                    setEditForm({
                      name: profile.name,
                      email: profile.email,
                      phone: profile.phone,
                      address: profile.address,
                      bio: profile.bio,
                    });
                  }}
                  style={{
                    ...DM,
                    background: "rgba(168,134,50,.14)",
                    color: BLUEB,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "8px 16px",
                    borderRadius: 0,
                    border: "1px solid rgba(168,134,50,.5)",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setProfileMsg(null);
                    }}
                    style={{
                      ...DM,
                      background: "rgba(168,134,50,.08)",
                      color: "rgba(200,188,154,.5)",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "8px 16px",
                      borderRadius: 0,
                      border: "1px solid rgba(168,134,50,.28)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    style={{
                      ...DM,
                      background: saving ? "rgba(168,134,50,.42)" : BLUE,
                      color: "#080a12",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "8px 16px",
                      borderRadius: 0,
                      border: "1px solid rgba(198,162,74,.95)",
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {profileMsg && (
              <div
                style={{
                  ...DM,
                  background:
                    profileMsg.type === "success"
                      ? "rgba(52,211,153,.15)"
                      : "rgba(255,107,107,.15)",
                  border: `1px solid ${
                    profileMsg.type === "success"
                      ? "rgba(52,211,153,.3)"
                      : "rgba(255,107,107,.3)"
                  }`,
                  borderRadius: 0,
                  padding: "10px 14px",
                  fontSize: 12,
                  color:
                    profileMsg.type === "success" ? "#34d399" : "#ff6b6b",
                  marginBottom: 20,
                }}
              >
                {profileMsg.text}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {[
                {
                  label: "Full Name",
                  key: "name",
                  placeholder: "Enter your name",
                },
                {
                  label: "Email Address",
                  key: "email",
                  placeholder: "Enter your email",
                },
                {
                  label: "Phone Number",
                  key: "phone",
                  placeholder: "Enter phone number",
                },
                {
                  label: "Address",
                  key: "address",
                  placeholder: "Enter your address",
                },
              ].map((field) => (
                <div key={field.key}>
                  <p
                    style={{
                      ...DM,
                      fontSize: 10,
                      color: "rgba(200,188,154,.5)",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {field.label}
                  </p>

                  {editMode ? (
                    <input
                      value={(editForm as any)[field.key]}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      style={{
                        ...DM,
                        width: "100%",
                        background: "rgba(2,4,12,.72)",
                        border: "1px solid rgba(168,134,50,.44)",
                        borderRadius: 0,
                        padding: "12px 16px",
                        color: "rgba(234,226,203,.82)",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    <p
                      style={{
                        ...DM,
                        fontSize: 13,
                        color: (profile as any)[field.key]
                          ? "rgba(234,226,203,.82)"
                          : "rgba(200,188,154,.25)",
                        padding: "12px 0",
                      }}
                    >
                      {(profile as any)[field.key] || "Not set"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <p
                style={{
                  ...DM,
                  fontSize: 10,
                  color: "rgba(200,188,154,.5)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Bio
              </p>

              {editMode ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  rows={3}
                  placeholder="Tell us about yourself..."
                  style={{
                    ...DM,
                    width: "100%",
                    background: "rgba(2,4,12,.72)",
                    border: "1px solid rgba(168,134,50,.44)",
                    borderRadius: 0,
                    padding: "12px 16px",
                    color: "rgba(234,226,203,.82)",
                    fontSize: 13,
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <p
                  style={{
                    ...DM,
                    fontSize: 13,
                    color: profile.bio
                      ? "rgba(234,226,203,.82)"
                      : "rgba(200,188,154,.25)",
                    lineHeight: 1.7,
                  }}
                >
                  {profile.bio || "Not set"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Password Tab */}
        {tab === "password" && (
          <div
            style={{
              ...GLASS,
              borderRadius: 0,
              padding: "28px",
              position: "relative",
              overflow: "hidden",
              maxWidth: 520,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "8%",
                right: "8%",
                height: 1,
                background:
                  "linear-gradient(90deg,transparent,rgba(212,175,55,0.75),transparent)",
                pointerEvents: "none",
              }}
            />

            <p
              style={{
                ...DM,
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              Settings
            </p>

            <p
              style={{
                ...DM,
                fontSize: 12,
                color: "rgba(200,188,154,.46)",
                marginBottom: 24,
              }}
            >
              Manage account security and password.
            </p>

            {passwordMsg && (
              <div
                style={{
                  ...DM,
                  background:
                    passwordMsg.type === "success"
                      ? "rgba(52,211,153,.15)"
                      : "rgba(255,107,107,.15)",
                  border: `1px solid ${
                    passwordMsg.type === "success"
                      ? "rgba(52,211,153,.3)"
                      : "rgba(255,107,107,.3)"
                  }`,
                  borderRadius: 0,
                  padding: "10px 14px",
                  fontSize: 12,
                  color:
                    passwordMsg.type === "success" ? "#34d399" : "#ff6b6b",
                  marginBottom: 20,
                }}
              >
                {passwordMsg.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                {
                  label: "Current Password",
                  key: "currentPassword",
                  show: showCurrentPassword,
                  toggle: () =>
                    setShowCurrentPassword(!showCurrentPassword),
                },
                {
                  label: "New Password",
                  key: "newPassword",
                  show: showNewPassword,
                  toggle: () => setShowNewPassword(!showNewPassword),
                },
              ].map((field) => (
                <div key={field.key}>
                  <p
                    style={{
                      ...DM,
                      fontSize: 10,
                      color: "rgba(200,188,154,.5)",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {field.label}
                  </p>

                  <div style={{ position: "relative" }}>
                    <input
                      type={field.show ? "text" : "password"}
                      value={(passwordForm as any)[field.key]}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={
                        field.key === "currentPassword"
                          ? "Enter current password"
                          : "Enter new password (min 6 chars)"
                      }
                      style={{
                        ...DM,
                        width: "100%",
                        background: "rgba(2,4,12,.72)",
                        border: "1px solid rgba(168,134,50,.44)",
                        borderRadius: 0,
                        padding: "12px 48px 12px 16px",
                        color: "rgba(234,226,203,.82)",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />

                    <button
                      onClick={field.toggle}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "rgba(198,162,74,.82)",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      {field.show ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              ))}

              <div>
                <p
                  style={{
                    ...DM,
                    fontSize: 10,
                    color: "rgba(200,188,154,.5)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Confirm New Password
                </p>

                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Re-enter new password"
                  style={{
                    ...DM,
                    width: "100%",
                    background: "rgba(2,4,12,.72)",
                    border: "1px solid rgba(168,134,50,.44)",
                    borderRadius: 0,
                    padding: "12px 16px",
                    color: "rgba(234,226,203,.82)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                style={{
                  ...DM,
                  background: changingPassword
                    ? "rgba(168,134,50,.42)"
                    : BLUE,
                  color: "#080a12",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "12px 24px",
                  borderRadius: 0,
                  border: "1px solid rgba(198,162,74,.95)",
                  cursor: changingPassword ? "not-allowed" : "pointer",
                  boxShadow: SH_CARD,
                  transition: "transform .2s ease",
                  alignSelf: "flex-start",
                  marginTop: 4,
                }}
                onMouseEnter={(e) => {
                  if (!changingPassword) {
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-3px)";
                  }
                }}
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)")
                }
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {notifMsg && (
              <div
                style={{
                  ...DM,
                  background:
                    notifMsg.type === "success"
                      ? "rgba(52,211,153,.15)"
                      : "rgba(255,107,107,.15)",
                  border: `1px solid ${
                    notifMsg.type === "success"
                      ? "rgba(52,211,153,.3)"
                      : "rgba(255,107,107,.3)"
                  }`,
                  borderRadius: 0,
                  padding: "12px 16px",
                  fontSize: 12,
                  color:
                    notifMsg.type === "success" ? "#34d399" : "#ff6b6b",
                }}
              >
                {notifMsg.text}
              </div>
            )}

            {/* Push Notifications */}
            <div
              style={{
                ...GLASS,
                borderRadius: 0,
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <p
                style={{
                  ...DM,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Push Notifications
              </p>

              <p
                style={{
                  ...DM,
                  fontSize: 12,
                  color: "rgba(200,188,154,.5)",
                  marginBottom: 20,
                }}
              >
                Get notifications on your device, even when the app is closed.
              </p>

              {!pushSupported ? (
                <div
                  style={{
                    ...DM,
                    padding: "16px",
                    background: "rgba(255,107,107,.1)",
                    border: "1px solid rgba(255,107,107,.3)",
                    borderRadius: 0,
                    fontSize: 12,
                    color: "#ff6b6b",
                  }}
                >
                  Your browser does not support push notifications.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    background: "rgba(2,4,12,.55)",
                    borderRadius: 0,
                    border: "1px solid rgba(168,134,50,.08)",
                    gap: 16,
                  }}
                >
                  <div>
                    <p
                      style={{
                        ...DM,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fff",
                        marginBottom: 4,
                      }}
                    >
                      Status: {pushSubscribed ? "Enabled" : "Disabled"}
                    </p>

                    <p
                      style={{
                        ...DM,
                        fontSize: 11,
                        color: "rgba(200,188,154,.5)",
                      }}
                    >
                      Browser permission:{" "}
                      <span
                        style={{
                          color:
                            pushPermission === "granted"
                              ? "#34d399"
                              : pushPermission === "denied"
                              ? "#ff6b6b"
                              : "#fbbf24",
                        }}
                      >
                        {pushPermission}
                      </span>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {pushSubscribed ? (
                      <>
                        <button
                          onClick={handleTestPush}
                          disabled={pushLoading}
                          style={{
                            ...DM,
                            background: "rgba(168,134,50,.14)",
                            color: BLUEB,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "8px 16px",
                            borderRadius: 0,
                            border: "1px solid rgba(168,134,50,.5)",
                            cursor: pushLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          {pushLoading ? "..." : "Test"}
                        </button>

                        <button
                          onClick={handleDisablePush}
                          disabled={pushLoading}
                          style={{
                            ...DM,
                            background: "rgba(239,68,68,.15)",
                            color: "#ef4444",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "8px 16px",
                            borderRadius: 0,
                            border: "1px solid rgba(239,68,68,.3)",
                            cursor: pushLoading ? "not-allowed" : "pointer",
                          }}
                        >
                          Disable
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEnablePush}
                        disabled={pushLoading || pushPermission === "denied"}
                        style={{
                          ...DM,
                          background:
                            pushPermission === "denied"
                              ? "rgba(168,134,50,.08)"
                              : BLUE,
                          color: pushPermission === "denied" ? "rgba(234,226,203,.45)" : "#080a12",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "8px 16px",
                          borderRadius: 0,
                          border: "1px solid rgba(198,162,74,.95)",
                          cursor:
                            pushLoading || pushPermission === "denied"
                              ? "not-allowed"
                              : "pointer",
                          opacity: pushPermission === "denied" ? 0.5 : 1,
                        }}
                      >
                        {pushLoading ? "Enabling..." : "Enable Notifications"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {pushPermission === "denied" && (
                <p
                  style={{
                    ...DM,
                    fontSize: 11,
                    color: "#fbbf24",
                    marginTop: 12,
                    padding: "10px 14px",
                    background: "rgba(251,191,36,.08)",
                    borderRadius: 0,
                  }}
                >
                  Notifications are blocked in your browser. Click the lock
                  icon in your address bar to allow them.
                </p>
              )}
            </div>

            {/* Hearing Reminders */}
            <div
              style={{
                ...GLASS,
                borderRadius: 0,
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div>
                  <p
                    style={{
                      ...DM,
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    Hearing Reminders
                  </p>

                  <p
                    style={{
                      ...DM,
                      fontSize: 12,
                      color: "rgba(200,188,154,.5)",
                    }}
                  >
                    Get reminders before your court hearings.
                  </p>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={notifPrefs.hearingReminders}
                    onChange={(e) =>
                      handleSaveNotifPrefs({
                        hearingReminders: e.target.checked,
                      })
                    }
                    disabled={savingNotifs}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                      accentColor: BLUE,
                    }}
                  />

                  <span
                    style={{
                      ...DM,
                      fontSize: 12,
                      color: "rgba(234,226,203,.82)",
                      fontWeight: 600,
                    }}
                  >
                    {notifPrefs.hearingReminders ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>

              <div
                style={{
                  opacity: notifPrefs.hearingReminders ? 1 : 0.4,
                  pointerEvents: notifPrefs.hearingReminders ? "auto" : "none",
                  transition: "opacity .2s ease",
                }}
              >
                <p
                  style={{
                    ...DM,
                    fontSize: 10,
                    color: "rgba(200,188,154,.5)",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  Remind me:
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      day: 7,
                      label: "7 days before hearing",
                      desc: "Advance notice",
                    },
                    {
                      day: 1,
                      label: "1 day before hearing",
                      desc: "Tomorrow's hearing",
                    },
                    {
                      day: 0,
                      label: "On the day of hearing",
                      desc: "Same day reminder",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.day}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        background: notifPrefs.reminderDays.includes(opt.day)
                          ? "rgba(168,134,50,.13)"
                          : "rgba(2,4,12,.55)",
                        borderRadius: 0,
                        cursor: "pointer",
                        border: notifPrefs.reminderDays.includes(opt.day)
                          ? "1px solid rgba(168,134,50,.44)"
                          : "1px solid rgba(2,4,12,.72)",
                        transition: "all .15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={notifPrefs.reminderDays.includes(opt.day)}
                        onChange={() => toggleReminderDay(opt.day)}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                          accentColor: BLUE,
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            ...DM,
                            fontSize: 13,
                            color: "#fff",
                            fontWeight: 500,
                          }}
                        >
                          {opt.label}
                        </p>

                        <p
                          style={{
                            ...DM,
                            fontSize: 10,
                            color: "rgba(200,188,154,.5)",
                            marginTop: 2,
                          }}
                        >
                          {opt.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Case Updates */}
            <div
              style={{
                ...GLASS,
                borderRadius: 0,
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      ...DM,
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    Case Updates
                  </p>

                  <p
                    style={{
                      ...DM,
                      fontSize: 12,
                      color: "rgba(200,188,154,.5)",
                      lineHeight: 1.7,
                    }}
                  >
                    Notify me when my case details change - status updates,
                    hearing date changes, judge changes, or new court entries.
                  </p>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {[
                      "Status changes (e.g., Pending to Disposed)",
                      "Hearing date updates",
                      "Judge changes",
                      "New court history entries",
                    ].map((item, i) => (
                      <p
                        key={i}
                        style={{
                          ...DM,
                          fontSize: 11,
                          color: "rgba(210,199,166,.62)",
                        }}
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    flexShrink: 0,
                    marginLeft: 20,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={notifPrefs.caseUpdates}
                    onChange={(e) =>
                      handleSaveNotifPrefs({
                        caseUpdates: e.target.checked,
                      })
                    }
                    disabled={savingNotifs}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: "pointer",
                      accentColor: BLUE,
                    }}
                  />

                  <span
                    style={{
                      ...DM,
                      fontSize: 12,
                      color: "rgba(234,226,203,.82)",
                      fontWeight: 600,
                    }}
                  >
                    {notifPrefs.caseUpdates ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>
            </div>

            {/* Connected Devices */}
            <div
              style={{
                ...GLASS,
                borderRadius: 0,
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    ...DM,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 4,
                  }}
                >
                  Connected Devices ({devices.length})
                </p>

                <p
                  style={{
                    ...DM,
                    fontSize: 12,
                    color: "rgba(200,188,154,.5)",
                  }}
                >
                  Devices that receive your push notifications.
                </p>
              </div>

              {devices.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 20px",
                    background: "rgba(255,255,255,.02)",
                    borderRadius: 0,
                  }}
                >
                  <p
                    style={{
                      ...DM,
                      fontSize: 12,
                      color: "rgba(200,188,154,.5)",
                    }}
                  >
                    No devices connected.
                  </p>

                  <p
                    style={{
                      ...DM,
                      fontSize: 11,
                      color: "rgba(200,188,154,.32)",
                      marginTop: 4,
                    }}
                  >
                    Enable notifications above to add this device.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {devices.map((device, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 16px",
                        background: "rgba(2,4,12,.55)",
                        borderRadius: 0,
                        border: "1px solid rgba(2,4,12,.72)",
                        opacity:
                          removingDevice === device.endpoint ? 0.4 : 1,
                        transition: "opacity .2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>
                          {device.deviceLabel
                            ?.toLowerCase()
                            .includes("iphone") ||
                          device.deviceLabel?.toLowerCase().includes("android")
                            ? "Mobile"
                            : "Desktop"}
                        </span>

                        <div>
                          <p
                            style={{
                              ...DM,
                              fontSize: 13,
                              color: "#fff",
                              fontWeight: 500,
                            }}
                          >
                            {device.deviceLabel}
                          </p>

                          <p
                            style={{
                              ...DM,
                              fontSize: 10,
                              color: "rgba(200,188,154,.5)",
                              marginTop: 2,
                            }}
                          >
                            Added{" "}
                            {new Date(device.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleRemoveDevice(
                            device.endpoint,
                            device.deviceLabel
                          )
                        }
                        disabled={removingDevice === device.endpoint}
                        style={{
                          ...DM,
                          background: "rgba(239,68,68,.15)",
                          color: "#ef4444",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "7px 14px",
                          borderRadius: 0,
                          border: "1px solid rgba(239,68,68,.3)",
                          cursor:
                            removingDevice === device.endpoint
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {removingDevice === device.endpoint ? "..." : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Tab */}
        {tab === "help" && <Help embedded />}

        {/* Privacy Tab */}
        {tab === "privacy" && (
          <div
            style={{
              ...GLASS,
              padding: 28,
              borderRadius: 0,
            }}
          >
            <h3>Privacy</h3>
            <p>Manage privacy and security preferences.</p>
          </div>
        )}
      </div>
    </div>
  );
}
