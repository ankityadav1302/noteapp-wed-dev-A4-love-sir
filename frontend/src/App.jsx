import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Search, Pin, Trash2, LogOut, Feather, FileText, Sparkles, X, Check, Clock3, Menu } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const colors = ["yellow", "pink", "blue", "green", "lavender"];
const dateLabel = d => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const timeLabel = d => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function App() {
  const [token, setToken] = useState(localStorage.getItem("paper_token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("paper_user") || "null"));
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [notes, setNotes] = useState([]);
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const request = async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Something went wrong");
    return data;
  };
  const notify = msg => { setToast(msg); window.setTimeout(() => setToast(""), 2400); };

  const loadNotes = async () => {
    try { const data = await request("/notes"); setNotes(data); }
    catch (e) { notify(e.message); if (e.message.toLowerCase().includes("session") || e.message.includes("Authentication")) logout(); }
  };
  useEffect(() => { if (token) loadNotes(); }, [token]);
  useEffect(() => {
    if (!active?._id) return;
    const current = notes.find(n => n._id === active._id);
    if (current) setActive(current);
  }, [notes]);

  const visible = useMemo(() => notes.filter(n => {
    const matches = `${n.title} ${n.content}`.toLowerCase().includes(search.toLowerCase());
    return matches && (filter === "all" || (filter === "pinned" ? n.pinned : !n.pinned));
  }), [notes, search, filter]);

  async function authenticate(e) {
    e.preventDefault(); setBusy(true);
    try {
      const data = await fetch(`${API}/auth/${authMode === "login" ? "login" : "register"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(authForm)
      }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message); return d; });
      if (authMode === "register") { notify("Account created — sign in to continue"); setAuthMode("login"); }
      else {
        localStorage.setItem("paper_token", data.token); localStorage.setItem("paper_user", JSON.stringify(data.user));
        setToken(data.token); setUser(data.user); notify("Welcome back");
      }
    } catch (e) { notify(e.message); }
    finally { setBusy(false); }
  }
  function logout() { localStorage.removeItem("paper_token"); localStorage.removeItem("paper_user"); setToken(""); setUser(null); setNotes([]); setActive(null); }

  async function createNote() {
    try {
      const note = await request("/notes", { method: "POST", body: JSON.stringify({ title: "Untitled note", content: "" }) });
      setNotes(prev => [note, ...prev]); setActive(note); notify("New note created");
    } catch (e) { notify(e.message); }
  }
  async function saveNote(patch) {
    if (!active?._id) return;
    const updated = await request(`/notes/${active._id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setNotes(prev => prev.map(n => n._id === updated._id ? updated : n)); setActive(updated);
  }
  async function deleteNote(id) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    try { await request(`/notes/${id}`, { method: "DELETE" }); setNotes(prev => prev.filter(n => n._id !== id)); if (active?._id === id) setActive(null); notify("Note deleted"); }
    catch (e) { notify(e.message); }
  }
  async function togglePin(note) {
    try { const updated = await request(`/notes/${note._id}`, { method: "PATCH", body: JSON.stringify({ pinned: !note.pinned }) }); setNotes(prev => prev.map(n => n._id === updated._id ? updated : n)); if (active?._id === updated._id) setActive(updated); }
    catch (e) { notify(e.message); }
  }
  // Debounced autosave keeps the editor responsive while persisting changes through the API.
  useEffect(() => {
    if (!active?._id) return;
    const snapshot = { _id: active._id, title: active.title, content: active.content, color: active.color };
    const timer = window.setTimeout(async () => {
      try {
        const updated = await request(`/notes/${snapshot._id}`, { method: "PATCH", body: JSON.stringify({ title: snapshot.title, content: snapshot.content, color: snapshot.color }) });
        setNotes(prev => prev.map(n => n._id === updated._id ? updated : n));
      } catch (e) { notify(e.message); }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [active?.title, active?.content, active?.color]);

  if (!token) return <main className="auth-screen"><div className="auth-art"><div className="art-mark"><Feather size={25}/></div><div className="art-copy"><span className="eyebrow">A LITTLE SPACE FOR YOU</span><h1>Thoughts deserve<br/><i>a place to land.</i></h1><p>Collect the little things, untangle the big ones, and make room for what matters.</p><div className="paper-stack"><div className="paper p1">today, I want to remember…</div><div className="paper p2">one thing at a time.</div><div className="paper p3"><Sparkles size={18}/></div></div></div><span className="art-foot">PAPER NOTES · EST. 2026</span></div><section className="auth-panel"><div className="auth-box"><div className="brand"><span className="brand-icon"><Feather size={18}/></span><span>paper<span className="brand-dot">.</span></span></div><span className="eyebrow muted">{authMode === "login" ? "WELCOME BACK" : "YOUR SPACE STARTS HERE"}</span><h2>{authMode === "login" ? "Good to see you." : "Create your space."}</h2><p className="auth-sub">{authMode === "login" ? "Pick up right where your thoughts left off." : "A calm corner for all the things on your mind."}</p><form onSubmit={authenticate}>{authMode === "register" && <label>Your name<input required placeholder="Alex Morgan" value={authForm.name} onChange={e => setAuthForm({...authForm, name:e.target.value})}/></label>}<label>Email address<input required type="email" placeholder="you@example.com" value={authForm.email} onChange={e => setAuthForm({...authForm, email:e.target.value})}/></label><label>Password<input required minLength="6" type="password" placeholder="At least 6 characters" value={authForm.password} onChange={e => setAuthForm({...authForm, password:e.target.value})}/></label><button className="primary wide" disabled={busy}>{busy ? "Please wait…" : authMode === "login" ? "Sign in to Paper" : "Create account"} <span>→</span></button></form><p className="switch-auth">{authMode === "login" ? "New around here?" : "Already have an account?"} <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create an account" : "Sign in"}</button></p><div className="secure"><span><Check size={13}/></span> Your notes are private to your account</div></div></section>{toast && <div className="toast">{toast}</div>}</main>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "show" : ""}`}><div className="brand"><span className="brand-icon"><Feather size={18}/></span><span>paper<span className="brand-dot">.</span></span></div><button className="new-note" onClick={createNote}><Plus size={17}/> New note <span>⌘ N</span></button><div className="nav-label">YOUR LIBRARY</div><button className={`nav-item ${filter==="all"?"selected":""}`} onClick={()=>{setFilter("all");setMobileMenu(false)}}><FileText size={17}/> All notes <span>{notes.length}</span></button><button className={`nav-item ${filter==="pinned"?"selected":""}`} onClick={()=>{setFilter("pinned");setMobileMenu(false)}}><Pin size={17}/> Pinned <span>{notes.filter(n=>n.pinned).length}</span></button><button className={`nav-item ${filter==="recent"?"selected":""}`} onClick={()=>{setFilter("recent");setMobileMenu(false)}}><Clock3 size={17}/> Recent</button><div className="sidebar-bottom"><div className="tip-card"><Sparkles size={16}/><b>A gentle reminder</b><p>You don't have to organize every thought. Just start writing.</p></div><div className="profile"><div className="avatar">{(user?.name||"U").slice(0,1).toUpperCase()}</div><div className="profile-info"><b>{user?.name || "Your account"}</b><small>{user?.email}</small></div><button className="icon-button" title="Sign out" onClick={logout}><LogOut size={16}/></button></div></div></aside>
    <main className="workspace"><header className="topbar"><button className="icon-button mobile-toggle" onClick={()=>setMobileMenu(!mobileMenu)}><Menu size={19}/></button><div className="crumb"><span>Workspace</span><span className="slash">/</span><b>{filter === "pinned" ? "Pinned notes" : filter === "recent" ? "Recent notes" : "All notes"}</b></div><div className="top-actions"><div className="searchbox"><Search size={16}/><input placeholder="Search your notes…" value={search} onChange={e=>setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><div className="avatar small">{(user?.name||"U").slice(0,1).toUpperCase()}</div></div></header>
      <div className="content"><div className="page-heading"><div><span className="eyebrow muted">TUESDAY, NOVEMBER 3, 2026</span><h1>{filter === "pinned" ? "Your pinned notes" : filter === "recent" ? "Recently updated" : "Your thoughts, collected."}</h1><p>A quiet place to capture whatever is on your mind.</p></div><button className="primary create-btn" onClick={createNote}><Plus size={17}/> Create note</button></div>
      <div className="section-heading"><div><b>{filter==="pinned"?"PINNED":filter==="recent"?"RECENT":"ALL NOTES"}</b><span>{visible.length} {visible.length===1?"note":"notes"}</span></div><span className="sort-label">SORTED BY LAST EDITED</span></div>
      <div className="main-grid"><section className="notes-area">{visible.length ? <div className="notes-grid">{visible.filter(n=>filter!=="recent" || Date.now()-new Date(n.updatedAt).getTime()<7*86400000).map(note=><article key={note._id} className={`note-card ${note.color} ${active?._id===note._id?"active":""}`} onClick={()=>setActive(note)}><div className="note-card-top"><span className="note-date">{dateLabel(note.updatedAt)}</span><button className={`pin-btn ${note.pinned?"pinned":""}`} onClick={e=>{e.stopPropagation();togglePin(note)}} title={note.pinned?"Unpin note":"Pin note"}><Pin size={15}/></button></div><h3>{note.title || "Untitled note"}</h3><p>{note.content || "A blank page is full of possibility…"}</p><div className="note-card-foot"><span>{note.content?.trim() ? `${note.content.trim().split(/\s+/).length} words` : "No content yet"}</span><span>{timeLabel(note.updatedAt)}</span></div></article>)}</div> : <div className="empty-state"><div className="empty-icon"><BookOpen size={25}/></div><h3>{search?"No matching notes":"Your page is still blank."}</h3><p>{search?"Try a different search term.":"Start with a thought, a plan, or anything you don't want to forget."}</p>{!search&&<button className="primary" onClick={createNote}><Plus size={16}/> Write your first note</button>}</div>}</section>
      {active && <aside className="editor"><div className="editor-top"><span className="editing-label"><span className="live-dot"/> EDITING NOTE</span><div className="editor-actions"><button className="icon-button" onClick={()=>togglePin(active)} title="Pin note"><Pin size={16}/></button><button className="icon-button danger" onClick={()=>deleteNote(active._id)} title="Delete note"><Trash2 size={16}/></button><button className="icon-button" onClick={()=>setActive(null)} title="Close editor"><X size={17}/></button></div></div><input className="title-input" value={active.title} onChange={e=>setActive({...active,title:e.target.value})} placeholder="Give your note a title…"/><div className="editor-meta">LAST EDITED {dateLabel(active.updatedAt)} · {timeLabel(active.updatedAt)}</div><div className="color-picker"><span>PAGE COLOR</span>{colors.map(c=><button key={c} className={`color-dot ${c} ${active.color===c?"chosen":""}`} onClick={()=>setActive({...active,color:c})} aria-label={`${c} page color`}/>)}</div><textarea className="note-textarea" value={active.content} onChange={e=>setActive({...active,content:e.target.value})} placeholder={"Let your thoughts flow…\n\nThere's no right way to begin."}/><div className="editor-footer"><span><span className="live-dot"/> Changes save automatically</span><span>{active.content?.length||0} characters</span></div></aside>}
      </div><footer className="workspace-footer"><span>MADE FOR THE THOUGHTFUL MOMENTS</span><span>paper. <span className="brand-dot">✳</span></span></footer></div>
    </main>{toast && <div className="toast">{toast}</div>}
  </div>;
}
export default App;
