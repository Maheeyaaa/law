// frontend/src/pages/Settings.tsx

import { useState, useEffect, useRef, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../components/CitizenLayout";
import { getProfile, updateProfile, changePassword, uploadAvatar } from "../services/api";

const DM: CSSProperties = { fontFamily: "'DM Sans',sans-serif" };
const BN: CSSProperties = { fontFamily: "'Bebas Neue',cursive" };
const BLUE = "#1e5fff";
const BLUEB = "#4d8aff";
const ICEB = "#a8c8ff";
const SH_CARD = "0 8px 32px rgba(0,0,0,.7), 0 2px 8px rgba(0,0,0,.5)";

const GLASS = {
  background: "rgba(10,20,60,0.18)",
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  border: "1px solid rgba(90,130,220,0.2)",
  boxShadow: "6px 10px 40px rgba(0,0,0,.55), 4px 8px 24px rgba(0,0,0,.4)",
};

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() || "?";
}

export default function Settings() {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"profile" | "password" | "account">("profile");
  const [loading, setLoading] = useState(true);

  // Profile state
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
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
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
      if (err.response?.status === 401) {
        navigate("/login");
      }
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

      setProfile({
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
        address: updated.address || "",
        bio: updated.bio || "",
        avatar: updated.avatar || profile.avatar,
        role: updated.role || profile.role,
      });

      // Update localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.name = updated.name;
        user.email = updated.email;
        localStorage.setItem("user", JSON.stringify(user));
      }

      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      setEditMode(false);
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({ type: "error", text: "File size must be less than 5MB" });
      return;
    }

    try {
      setUploadingAvatar(true);
      setAvatarMsg(null);

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await uploadAvatar(formData);
      setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
      setAvatarMsg({ type: "success", text: "Avatar updated!" });
      setTimeout(() => setAvatarMsg(null), 3000);
    } catch (err: any) {
      setAvatarMsg({ type: "error", text: err.response?.data?.message || "Upload failed" });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMsg({ type: "error", text: "Please fill in all fields" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMsg(null);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordMsg(null), 3000);
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.response?.data?.message || "Failed to change password" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    if (!confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <CitizenLayout activeNav="set">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", ...DM }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(30,95,255,.3)", borderTop: "3px solid #1e5fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)" }}>Loading profile...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout activeNav="set">
      <div style={{ padding: "28px 28px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div>
          <p style={{ ...DM, fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(168,200,255,.5)" }}>SETTINGS</p>
          <p style={{ ...BN, fontSize: 32, color: "#fff", marginTop: 4 }}>Account Settings</p>
        </div>

        {/* Profile Card */}
        <div style={{ ...GLASS, borderRadius: 20, padding: "28px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#0a1840,#1e5fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, ...DM, color: "#fff", boxShadow: `0 0 24px rgba(30,95,255,.5)`, overflow: "hidden" }}>
                {profile.avatar ? (
                  <img src={`http://localhost:8000/uploads/${profile.avatar}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  getInitials(profile.name)
                )}
              </div>
              <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%", background: BLUE, border: "2px solid rgba(8,16,45,0.95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: uploadingAvatar ? "not-allowed" : "pointer", boxShadow: SH_CARD }}>
                {uploadingAvatar ? "..." : "📷"}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <p style={{ ...DM, fontSize: 22, fontWeight: 700, color: "#fff" }}>{profile.name}</p>
              <p style={{ ...DM, fontSize: 12, color: ICEB, marginTop: 2 }}>{profile.email}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <span style={{ ...DM, fontSize: 9, padding: "4px 12px", borderRadius: 99, background: "rgba(52,211,153,.15)", border: "1px solid rgba(52,211,153,.3)", color: "#34d399", textTransform: "capitalize" }}>{profile.role}</span>
                {profile.phone && (
                  <span style={{ ...DM, fontSize: 9, padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)" }}>📞 {profile.phone}</span>
                )}
              </div>
              {avatarMsg && (
                <p style={{ ...DM, fontSize: 10, color: avatarMsg.type === "success" ? "#34d399" : "#ff6b6b", marginTop: 8 }}>
                  {avatarMsg.type === "success" ? "✅" : "❌"} {avatarMsg.text}
                </p>
              )}
            </div>

            {/* Logout */}
            <button onClick={handleLogout} style={{ ...DM, background: "rgba(239,68,68,.15)", color: "#ef4444", fontSize: 11, fontWeight: 600, padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)", cursor: "pointer", transition: "all .2s ease", flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.25)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.15)"}>
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ ...GLASS, borderRadius: 16, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          {[
            { id: "profile" as const, label: "👤 Edit Profile" },
            { id: "password" as const, label: "🔒 Change Password" },
            { id: "account" as const, label: "ℹ️ Account Info" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ ...DM, fontSize: 12, fontWeight: 600, padding: "10px 24px", borderRadius: 10, cursor: "pointer", background: tab === t.id ? BLUE : "rgba(30,95,255,0.15)", color: "#fff", border: tab === t.id ? "none" : "1px solid rgba(30,95,255,0.4)", transition: "all .2s ease" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ PROFILE TAB ═══ */}
        {tab === "profile" && (
          <div style={{ ...GLASS, borderRadius: 20, padding: "28px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <p style={{ ...DM, fontSize: 16, fontWeight: 700, color: "#fff" }}>Profile Information</p>
              {!editMode ? (
                <button onClick={() => { setEditMode(true); setEditForm({ name: profile.name, email: profile.email, phone: profile.phone, address: profile.address, bio: profile.bio }); }} style={{ ...DM, background: "rgba(30,95,255,.15)", color: BLUEB, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(30,95,255,.3)", cursor: "pointer" }}>
                  Edit ✏️
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditMode(false); setProfileMsg(null); }} style={{ ...DM, background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.4)", fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} style={{ ...DM, background: saving ? "rgba(30,95,255,.4)" : BLUE, color: "#fff", fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 8, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {profileMsg && (
              <div style={{ ...DM, background: profileMsg.type === "success" ? "rgba(52,211,153,.15)" : "rgba(255,107,107,.15)", border: `1px solid ${profileMsg.type === "success" ? "rgba(52,211,153,.3)" : "rgba(255,107,107,.3)"}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: profileMsg.type === "success" ? "#34d399" : "#ff6b6b", marginBottom: 20 }}>
                {profileMsg.type === "success" ? "✅" : "❌"} {profileMsg.text}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Full Name", key: "name", placeholder: "Enter your name" },
                { label: "Email Address", key: "email", placeholder: "Enter your email" },
                { label: "Phone Number", key: "phone", placeholder: "Enter phone number" },
                { label: "Address", key: "address", placeholder: "Enter your address" },
              ].map(field => (
                <div key={field.key}>
                  <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>{field.label}</p>
                  {editMode ? (
                    <input value={(editForm as any)[field.key]} onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })} placeholder={field.placeholder} style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "12px 16px", color: "rgba(255,255,255,.7)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  ) : (
                    <p style={{ ...DM, fontSize: 13, color: (profile as any)[field.key] ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.2)", padding: "12px 0" }}>
                      {(profile as any)[field.key] || "Not set"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Bio - Full Width */}
            <div style={{ marginTop: 16 }}>
              <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Bio</p>
              {editMode ? (
                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} rows={3} placeholder="Tell us about yourself..." style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "12px 16px", color: "rgba(255,255,255,.7)", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} />
              ) : (
                <p style={{ ...DM, fontSize: 13, color: profile.bio ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.2)", lineHeight: 1.7 }}>
                  {profile.bio || "Not set"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ PASSWORD TAB ═══ */}
        {tab === "password" && (
          <div style={{ ...GLASS, borderRadius: 20, padding: "28px", position: "relative", overflow: "hidden", maxWidth: 520 }}>
            <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />

            <p style={{ ...DM, fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Change Password</p>
            <p style={{ ...DM, fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 24 }}>Enter your current password and choose a new one.</p>

            {passwordMsg && (
              <div style={{ ...DM, background: passwordMsg.type === "success" ? "rgba(52,211,153,.15)" : "rgba(255,107,107,.15)", border: `1px solid ${passwordMsg.type === "success" ? "rgba(52,211,153,.3)" : "rgba(255,107,107,.3)"}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: passwordMsg.type === "success" ? "#34d399" : "#ff6b6b", marginBottom: 20 }}>
                {passwordMsg.type === "success" ? "✅" : "❌"} {passwordMsg.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Current Password</p>
                <div style={{ position: "relative" }}>
                  <input type={showCurrentPassword ? "text" : "password"} value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Enter current password" style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "12px 16px", color: "rgba(255,255,255,.7)", fontSize: 13, outline: "none", boxSizing: "border-box", paddingRight: 48 }} />
                  <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.3)", fontSize: 14, cursor: "pointer" }}>
                    {showCurrentPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>New Password</p>
                <div style={{ position: "relative" }}>
                  <input type={showNewPassword ? "text" : "password"} value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Enter new password (min 6 chars)" style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "12px 16px", color: "rgba(255,255,255,.7)", fontSize: 13, outline: "none", boxSizing: "border-box", paddingRight: 48 }} />
                  <button onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.3)", fontSize: 14, cursor: "pointer" }}>
                    {showNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <p style={{ ...DM, fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Confirm New Password</p>
                <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Re-enter new password" style={{ ...DM, width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(30,95,255,.25)", borderRadius: 10, padding: "12px 16px", color: "rgba(255,255,255,.7)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>

              <button onClick={handleChangePassword} disabled={changingPassword} style={{ ...DM, background: changingPassword ? "rgba(30,95,255,.4)" : BLUE, color: "#fff", fontSize: 13, fontWeight: 600, padding: "12px 24px", borderRadius: 10, border: "none", cursor: changingPassword ? "not-allowed" : "pointer", boxShadow: SH_CARD, transition: "transform .2s ease", alignSelf: "flex-start", marginTop: 4 }}
                onMouseEnter={e => { if (!changingPassword) (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}>
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ ACCOUNT INFO TAB ═══ */}
        {tab === "account" && (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ flex: 1, ...GLASS, borderRadius: 20, padding: "28px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(150,200,255,0.6),transparent)", pointerEvents: "none" }} />
              <p style={{ ...DM, fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Account Details</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Full Name", value: profile.name },
                  { label: "Email", value: profile.email },
                  { label: "Phone", value: profile.phone || "Not set" },
                  { label: "Address", value: profile.address || "Not set" },
                  { label: "Role", value: profile.role, capitalize: true },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, background: i % 2 === 0 ? "rgba(0,0,0,0.25)" : "transparent" }}>
                    <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: "1px" }}>{item.label}</p>
                    <p style={{ ...DM, fontSize: 13, color: "rgba(255,255,255,.7)", fontWeight: 500, textTransform: item.capitalize ? "capitalize" : "none" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Quick Actions */}
              <div style={{ ...GLASS, borderRadius: 16, padding: "20px", position: "relative", overflow: "hidden" }}>
                <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 14 }}>Quick Actions</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Edit Profile", icon: "✏️", action: () => setTab("profile") },
                    { label: "Change Password", icon: "🔒", action: () => setTab("password") },
                    { label: "My Cases", icon: "📁", action: () => navigate("/citizen/cases") },
                    { label: "My Documents", icon: "📄", action: () => navigate("/citizen/documents") },
                    { label: "Help Center", icon: "❓", action: () => navigate("/citizen/help") },
                  ].map((qa, i) => (
                    <button key={i} onClick={qa.action} style={{ ...DM, width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(30,95,255,.15)", color: "rgba(255,255,255,.6)", fontSize: 12, cursor: "pointer", textAlign: "left", transition: "all .2s ease" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(30,95,255,.1)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.35)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.35)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,95,255,.15)"; }}>
                      <span style={{ fontSize: 14 }}>{qa.icon}</span>
                      <span>{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ ...GLASS, borderRadius: 16, padding: "20px", border: "1px solid rgba(239,68,68,.2)" }}>
                <p style={{ ...DM, fontSize: 13, fontWeight: 600, color: "#ef4444", marginBottom: 10 }}>Danger Zone</p>
                <p style={{ ...DM, fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 14, lineHeight: 1.6 }}>
                  Logging out will clear your session. You will need to log in again to access your account.
                </p>
                <button onClick={handleLogout} style={{ ...DM, width: "100%", background: "rgba(239,68,68,.15)", color: "#ef4444", fontSize: 12, fontWeight: 600, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)", cursor: "pointer", transition: "all .2s ease" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.25)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.15)"}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </CitizenLayout>
  );
}