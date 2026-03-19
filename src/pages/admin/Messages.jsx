import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Topbar from "../../components/Topbar";

export default function Messages() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadContacts();

    const sub = supabase
      .channel("contacts-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contacts" },
        (payload) => {
          setContacts((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  async function loadContacts() {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    setContacts(data || []);
    setLoading(false);
  }

  async function selectContact(c) {
    setSelected(c);
    setReply("");
    if (!c.read) {
      await supabase.from("contacts").update({ read: true }).eq("id", c.id);
      setContacts((prev) =>
        prev.map((m) => (m.id === c.id ? { ...m, read: true } : m)),
      );
    }
  }

  async function createRdvFromContact() {
    if (!selected) return;
    alert(
      `Fonctionnalité : Créer un RDV pour ${selected.first_name} ${selected.last_name}\nVous pouvez aller dans Rendez-vous > Nouveau RDV.`,
    );
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);

    try {
      // 1. Envoyer l'email via Edge Function
      const { error: fnError } = await supabase.functions.invoke("send-email", {
        body: {
          to: selected.email,
          subject: `Re: ${selected.subject || "Votre demande NM Therapy"}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #333;">
              <p>Bonjour ${selected.first_name},</p>
              <div style="white-space: pre-wrap; line-height: 1.7;">${reply}</div>
              <br/>
              <p style="color: #888; font-size: 0.85em;">— Nancy Massaoudi · NM Therapy</p>
            </div>
          `,
        },
      });

      if (fnError) throw new Error(fnError.message);

      // 2. Sauvegarder la réponse en DB
      await supabase.from("replies").insert([
        {
          contact_id: selected.id,
          message: reply,
          sent_at: new Date().toISOString(),
        },
      ]);

      // 3. Mettre à jour le statut
      await supabase
        .from("contacts")
        .update({ status: "replied" })
        .eq("id", selected.id);
      setContacts((prev) =>
        prev.map((m) =>
          m.id === selected.id ? { ...m, status: "replied" } : m,
        ),
      );

      setReply("");
      alert("✅ Email envoyé avec succès !");
    } catch (err) {
      alert("❌ Erreur lors de l'envoi : " + err.message);
    } finally {
      setSending(false);
    }
  }

  const unreadCount = contacts.filter((c) => !c.read).length;

  return (
    <div>
      <Topbar
        title="Messages"
        subtitle={`${unreadCount} message${unreadCount !== 1 ? "s" : ""} non lu${unreadCount !== 1 ? "s" : ""}`}
      />
      <div style={s.layout}>
        {/* List */}
        <div style={s.list}>
          <div style={s.listHeader}>
            <span style={s.listTitle}>Boîte de réception</span>
            {unreadCount > 0 && <span style={s.badge}>{unreadCount}</span>}
          </div>
          {loading ? (
            <div style={s.empty}>Chargement…</div>
          ) : contacts.length === 0 ? (
            <div style={s.empty}>Aucun message reçu.</div>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                style={{
                  ...s.msgItem,
                  ...(selected?.id === c.id ? s.msgSelected : {}),
                  ...(c.read ? {} : s.msgUnread),
                }}
                onClick={() => selectContact(c)}
              >
                <div style={s.av}>{c.first_name?.[0] || "?"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...s.msgName, fontWeight: c.read ? 400 : 600 }}>
                    {c.first_name} {c.last_name}
                  </div>
                  <div style={s.msgPreview}>
                    {c.subject || c.message?.slice(0, 60)}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={s.msgTime}>
                    {new Date(c.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {!c.read && <span style={s.unreadDot} />}
                  {c.status === "replied" && (
                    <span
                      style={{ fontSize: "0.65rem", color: "var(--success)" }}
                    >
                      ✓ Répondu
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div style={s.detail}>
          {!selected ? (
            <div style={s.noSelect}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>💬</div>
              <p>Sélectionnez un message pour le lire et y répondre.</p>
            </div>
          ) : (
            <>
              <div style={s.detailHeader}>
                <div style={s.av}>{selected.first_name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 500,
                      color: "var(--charcoal)",
                    }}
                  >
                    {selected.first_name} {selected.last_name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--mist)" }}>
                    {selected.email} · {selected.phone}
                  </div>
                </div>
                <button style={s.rdvBtn} onClick={createRdvFromContact}>
                  + Créer un RDV
                </button>
              </div>

              <div style={s.msgBubble}>
                {selected.subject && (
                  <div style={s.msgSubject}>Motif : {selected.subject}</div>
                )}
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--charcoal)",
                    lineHeight: 1.7,
                  }}
                >
                  {selected.message}
                </p>
                <div style={s.msgMeta}>
                  {new Date(selected.created_at).toLocaleString("fr-FR")}
                </div>
              </div>

              <form onSubmit={sendReply} style={s.replyForm}>
                <label style={s.replyLabel}>Votre réponse</label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={5}
                  placeholder={`Bonjour ${selected.first_name},\n\nMerci pour votre message…`}
                  style={s.replyArea}
                  required
                />
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" style={s.sendBtn} disabled={sending}>
                    {sending ? "Envoi…" : "Envoyer la réponse"}
                  </button>
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${selected.subject || "Votre demande NM Therapy"}&body=Bonjour ${selected.first_name},%0D%0A%0D%0A`}
                    style={s.mailtoBtn}
                  >
                    Ouvrir dans Gmail →
                  </a>
                </div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--mist)",
                    marginTop: "0.5rem",
                    fontStyle: "italic",
                  }}
                >
                  💡 Le lien "Ouvrir dans Gmail" lance votre client email avec
                  la réponse pré-remplie.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  layout: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    height: "calc(100vh - 73px)",
  },
  list: {
    borderRight: "1px solid rgba(139,158,126,0.15)",
    overflowY: "auto",
    background: "var(--warm-white)",
  },
  listHeader: {
    padding: "1.2rem 1.5rem",
    borderBottom: "1px solid rgba(139,158,126,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: { fontSize: "0.85rem", fontWeight: 500, color: "var(--charcoal)" },
  badge: {
    background: "var(--clay)",
    color: "var(--warm-white)",
    fontSize: "0.65rem",
    padding: "0.15rem 0.5rem",
    borderRadius: 10,
  },
  msgItem: {
    display: "flex",
    gap: "0.85rem",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid rgba(139,158,126,0.08)",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  msgSelected: { background: "var(--sage-pale)" },
  msgUnread: { background: "rgba(139,158,126,0.04)" },
  av: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--sage) 0%, var(--clay) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Cormorant Garamond, serif",
    fontSize: "1rem",
    color: "var(--warm-white)",
    flexShrink: 0,
  },
  msgName: { fontSize: "0.88rem", color: "var(--charcoal)" },
  msgPreview: {
    fontSize: "0.75rem",
    color: "var(--mist)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: "0.15rem",
  },
  msgTime: { fontSize: "0.68rem", color: "var(--mist)" },
  unreadDot: {
    display: "block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--clay)",
    margin: "0.25rem 0 0 auto",
  },
  detail: {
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    background: "#F7F4EE",
  },
  noSelect: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--mist)",
    fontSize: "0.88rem",
    fontStyle: "italic",
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem 2rem",
    background: "var(--warm-white)",
    borderBottom: "1px solid rgba(139,158,126,0.1)",
  },
  msgBubble: {
    margin: "1.5rem 2rem",
    background: "var(--warm-white)",
    borderRadius: 6,
    padding: "1.5rem",
    border: "1px solid rgba(139,158,126,0.15)",
  },
  msgSubject: {
    fontSize: "0.72rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--clay)",
    marginBottom: "0.75rem",
  },
  msgMeta: { fontSize: "0.7rem", color: "var(--mist)", marginTop: "1rem" },
  replyForm: {
    margin: "0 2rem 2rem",
    background: "var(--warm-white)",
    borderRadius: 6,
    padding: "1.5rem",
    border: "1px solid rgba(139,158,126,0.15)",
  },
  replyLabel: {
    display: "block",
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--mist)",
    marginBottom: "0.5rem",
  },
  replyArea: {
    width: "100%",
    border: "1px solid rgba(139,158,126,0.25)",
    borderRadius: 3,
    padding: "0.85rem 1rem",
    fontFamily: "Jost, sans-serif",
    fontSize: "0.9rem",
    color: "var(--charcoal)",
    background: "var(--warm-white)",
    outline: "none",
    resize: "vertical",
    marginBottom: "1rem",
  },
  sendBtn: {
    background: "var(--sage)",
    color: "var(--warm-white)",
    border: "none",
    padding: "0.75rem 1.5rem",
    fontFamily: "Jost, sans-serif",
    fontSize: "0.78rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    borderRadius: 3,
    cursor: "pointer",
  },
  mailtoBtn: {
    background: "transparent",
    color: "var(--clay)",
    border: "1px solid var(--clay)",
    padding: "0.75rem 1.2rem",
    fontFamily: "Jost, sans-serif",
    fontSize: "0.78rem",
    borderRadius: 3,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  },
  rdvBtn: {
    background: "var(--clay)",
    color: "var(--warm-white)",
    border: "none",
    padding: "0.5rem 1rem",
    fontFamily: "Jost, sans-serif",
    fontSize: "0.75rem",
    borderRadius: 3,
    cursor: "pointer",
    letterSpacing: "0.08em",
  },
  empty: {
    padding: "2rem",
    color: "var(--mist)",
    fontSize: "0.85rem",
    fontStyle: "italic",
  },
};
