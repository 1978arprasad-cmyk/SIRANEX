// SIRANEX — tiny real-time messages demo
// Requires: a Supabase table named "messages" with columns
//   id          int8         (auto-incrementing primary key)
//   created_at  timestamptz  (default now())
//   content     text
// Realtime must be enabled on the table, and there must be an
// RLS policy allowing anon SELECT and INSERT.

(function () {
  "use strict";

  // ---- Sanity check the config ------------------------------------------
  if (
    typeof SUPABASE_URL !== "string" ||
    typeof SUPABASE_KEY !== "string" ||
    SUPABASE_URL.indexOf("PASTE_") === 0 ||
    SUPABASE_KEY.indexOf("PASTE_") === 0
  ) {
    document.getElementById("status").textContent =
      "Open config.js and paste your Supabase URL + key, then reload.";
    document.getElementById("status").className = "status status--error";
    return;
  }

  // ---- Create the Supabase client ---------------------------------------
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const messagesEl = document.getElementById("messages");
  const formEl = document.getElementById("composer");
  const inputEl = document.getElementById("content");
  const sendBtn = document.getElementById("send");
  const statusEl = document.getElementById("status");

  // Track which message IDs are already rendered so Realtime events and
  // the initial fetch don't duplicate each other.
  const seenIds = new Set();

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status status--" + (kind || "ok");
  }

  function renderMessage(row) {
    if (!row || seenIds.has(row.id)) return;
    seenIds.add(row.id);

    // remove the "empty" placeholder if present
    const empty = messagesEl.querySelector(".messages__empty");
    if (empty) empty.remove();

    const item = document.createElement("div");
    item.className = "message";

    const body = document.createElement("div");
    body.className = "message__body";
    body.textContent = row.content || "";

    const time = document.createElement("div");
    time.className = "message__time";
    const d = row.created_at ? new Date(row.created_at) : new Date();
    time.textContent = d.toLocaleString();

    item.appendChild(body);
    item.appendChild(time);
    messagesEl.appendChild(item);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ---- Initial fetch ----------------------------------------------------
  async function loadExisting() {
    const { data, error } = await client
      .from("messages")
      .select("id, created_at, content")
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      console.error(error);
      setStatus("Could not load messages: " + error.message, "error");
      return;
    }
    (data || []).forEach(renderMessage);
  }

  // ---- Realtime subscription -------------------------------------------
  function subscribe() {
    client
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        function (payload) {
          renderMessage(payload.new);
        }
      )
      .subscribe(function (status) {
        if (status === "SUBSCRIBED") {
          setStatus("Live — new messages appear instantly", "ok");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setStatus("Realtime connection problem — try reloading", "error");
        }
      });
  }

  // ---- Send a message ---------------------------------------------------
  formEl.addEventListener("submit", async function (e) {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;

    sendBtn.disabled = true;
    const { error } = await client
      .from("messages")
      .insert({ content: text });

    sendBtn.disabled = false;

    if (error) {
      console.error(error);
      setStatus("Send failed: " + error.message, "error");
      return;
    }
    inputEl.value = "";
    inputEl.focus();
  });

  // ---- Go ---------------------------------------------------------------
  setStatus("Connecting…", "connecting");
  loadExisting().then(subscribe);
})();
