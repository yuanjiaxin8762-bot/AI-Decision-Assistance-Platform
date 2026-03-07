const DEFAULT_AGENTS = [
  { name: "理性+", color: "linear-gradient(160deg,#6f7cff,#7a3cff)", mood: "calm" },
  { name: "冒险+", color: "linear-gradient(160deg,#ff9f6f,#ff5f8a)", mood: "excite" },
  { name: "情绪+", color: "linear-gradient(160deg,#7a3cff,#33e1ff)", mood: "wave" },
  { name: "直觉", color: "linear-gradient(160deg,#33e1ff,#6f7cff)", mood: "flow" },
  { name: "谨慎", color: "linear-gradient(160deg,#7a3cff,#222b45)", mood: "guard" }
];

let agents = [...DEFAULT_AGENTS];

const STORAGE_USERS = "persona_switch_users";
const STORAGE_SESSION = "persona_switch_session";
const DEEPSEEK_PROXY_ENDPOINT = "/api/chat";
const DEEPSEEK_MODEL = "deepseek-chat";
const TRAIT_KEYS = ["rationality", "risk", "altruism", "horizon", "autonomy"];
const TRAIT_LABELS = {
  rationality: "理性",
  risk: "冒险",
  altruism: "利他",
  horizon: "长期",
  autonomy: "自主"
};
const EXPERIENCE_PRESETS = [
  { id: "invest-win", icon: "INV", title: "一次成功的投资", hint: "增强机会识别与执行力" },
  { id: "emotion-deep", icon: "EMO", title: "一段深刻的情感关系", hint: "强化情绪洞察与共情" },
  { id: "startup-fail", icon: "RISK", title: "一次创业受挫", hint: "提升风险敏感与复盘习惯" },
  { id: "career-jump", icon: "JUMP", title: "跨行业转型", hint: "塑造适应性与长期视角" },
  { id: "family-duty", icon: "CARE", title: "家庭责任时刻", hint: "影响决策稳健性与优先级" }
];
const VALUE_PRESETS = ["自由", "安全", "成就", "和谐", "权力", "传统", "享乐", "利他", "创新", "稳定", "知识", "家庭"];
const SCENARIO_PRESETS = [
  {
    id: "s1",
    q: "你获得一笔意外之财，会如何使用？",
    options: ["保留现金缓冲", "分散投资", "立即投入新项目", "用于提升生活质量"]
  },
  {
    id: "s2",
    q: "朋友向你借钱但迟迟不还，你会？",
    options: ["理性沟通分期归还", "直接拒绝继续借款", "优先维持关系再协商", "请第三方协调"]
  },
  {
    id: "s3",
    q: "你接到一份高风险高回报机会，你会？",
    options: ["先做小范围试水", "直接抓住窗口期", "咨询可信专家后再决定", "放弃，等待更稳方案"]
  }
];

const incubatorState = {
  currentStep: 1,
  activeExperienceId: null,
  selectedAgentId: null,
  profile: {
    avatarDataUrl: "",
    nickname: "",
    age: 26,
    gender: "",
    job: "",
    edu: "本科",
    location: "",
    intro: ""
  },
  traits: {
    rationality: 68,
    risk: 44,
    altruism: 55,
    horizon: 62,
    autonomy: 58
  },
  radarPoints: {},
  experiences: EXPERIENCE_PRESETS.map(item => ({ ...item, selected: false, note: "" })),
  timeline: [],
  values: [...VALUE_PRESETS],
  principles: {
    p1: "",
    p2: "",
    justice: 52,
    collective: 48
  },
  scenarios: SCENARIO_PRESETS.map(item => ({ ...item, answer: "", reason: "" })),
  customAgents: []
};

const dialogState = {
  selectedAgent: null,
  mentionTarget: "",
  mutedAgents: {},
  thinkingAgents: {},
  messageSeed: 0,
  panelExpanded: false,
  panelPinned: false,
  history: [],
  isGenerating: false
};

const decisionState = {
  topic: "",
  options: ["方案A", "方案B", "方案C"],
  analysis: null
};

const PERSONA_LIBRARY = {
  rational: {
    id: "rational",
    moodLabel: "平稳 · 逻辑",
    theme: "theme-rational",
    ring: "#5ab8ff",
    c1: "#85a5ff",
    c2: "#546dff",
    c3: "#1e2d7d",
    accessory: "visor",
    avatar: "./assets/agents/rational.png"
  },
  adventure: {
    id: "adventure",
    moodLabel: "兴奋 · 进攻",
    theme: "theme-risk",
    ring: "#ff8a63",
    c1: "#ffb482",
    c2: "#ff6b7f",
    c3: "#7f2946",
    accessory: "horn",
    avatar: "./assets/agents/adventure.png"
  },
  empath: {
    id: "empath",
    moodLabel: "感性 · 共情",
    theme: "theme-emotion",
    ring: "#9f7bff",
    c1: "#8de9ff",
    c2: "#8c74ff",
    c3: "#2f2b7a",
    accessory: "wave",
    avatar: "./assets/agents/empath.png"
  },
  intuitive: {
    id: "intuitive",
    moodLabel: "灵动 · 洞察",
    theme: "theme-rational",
    ring: "#7dd7ff",
    c1: "#8be8ff",
    c2: "#67a8ff",
    c3: "#2b4d99",
    accessory: "antenna",
    avatar: "./assets/agents/intuitive.png"
  },
  guardian: {
    id: "guardian",
    moodLabel: "克制 · 防御",
    theme: "theme-rational",
    ring: "#63d4a8",
    c1: "#8b7dff",
    c2: "#5840d8",
    c3: "#223169",
    accessory: "shield",
    avatar: "./assets/agents/guardian.png"
  },
  balanced: {
    id: "balanced",
    moodLabel: "平衡 · 协调",
    theme: "theme-rational",
    ring: "#8aa4ff",
    c1: "#92c1ff",
    c2: "#7e8bff",
    c3: "#2d3978",
    accessory: "spark",
    avatar: "./assets/agents/rational.png"
  }
};

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USERS) || "{}");
  } catch (e) {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function setSession(session) {
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null");
  } catch (e) {
    return null;
  }
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const users = loadUsers();
  return users[session.email] || null;
}

function saveCurrentUser(user) {
  if (!user || !user.email) return;
  const users = loadUsers();
  users[user.email] = user;
  saveUsers(users);
}

function updateFeedback(text, status = "") {
  const el = document.getElementById("auth-feedback");
  if (!el) return;
  el.className = `auth-feedback ${status}`.trim();
  el.textContent = text;
}

function switchTab(tabName) {
  const loginTab = document.getElementById("tab-login");
  const registerTab = document.getElementById("tab-register");
  const loginForm = document.getElementById("form-login");
  const registerForm = document.getElementById("form-register");
  const isLogin = tabName === "login";
  loginTab?.classList.toggle("active", isLogin);
  registerTab?.classList.toggle("active", !isLogin);
  loginForm?.classList.toggle("active", isLogin);
  registerForm?.classList.toggle("active", !isLogin);
  updateFeedback("");
}

function revealApp() {
  document.querySelectorAll(".app-shell").forEach(node => node.classList.remove("hidden"));
  document.getElementById("auth-screen")?.classList.add("hidden");
}

function showAuthScreen(tabName = "login", message = "") {
  document.querySelectorAll(".app-shell").forEach(node => node.classList.add("hidden"));
  document.getElementById("auth-screen")?.classList.remove("hidden");
  switchTab(tabName);
  updateFeedback(message);
  const loginPwd = document.getElementById("login-password");
  const registerPwd = document.getElementById("register-password");
  if (loginPwd) loginPwd.value = "";
  if (registerPwd) registerPwd.value = "";
  document.getElementById("login-email")?.focus();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function logoutToAuth() {
  localStorage.removeItem(STORAGE_SESSION);
  showAuthScreen("login", "已退出当前会话，请重新登录或注册。");
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  window.scrollTo({ top: target.offsetTop - 30, behavior: "smooth" });
}

function resolvePersona(agent) {
  const mood = String(agent?.mood || "").toLowerCase();
  if (mood === "calm") return PERSONA_LIBRARY.rational;
  if (mood === "excite" || mood === "bold") return PERSONA_LIBRARY.adventure;
  if (mood === "wave") return PERSONA_LIBRARY.empath;
  if (mood === "flow") return PERSONA_LIBRARY.intuitive;
  if (mood === "guard") return PERSONA_LIBRARY.guardian;
  return PERSONA_LIBRARY.balanced;
}

function buildAvatarMarkup(persona, ringColor = "") {
  return `
    <span class="agent-emotion-ring" style="border-color:${ringColor || persona.ring};"></span>
    <img class="agent-avatar-image" src="${persona.avatar || ""}" alt="${persona.id}-avatar" loading="lazy" />
  `;
}

function getAgentTheme(agentName = "") {
  const target = agents.find(a => a.name === agentName);
  return resolvePersona(target).theme;
}

function pushDialogAgentVisuals() {
  const payload = agents.map((a, idx) => {
    const persona = resolvePersona(a);
    return {
      index: idx,
      name: a.name,
      enabled: !dialogState.mutedAgents[a.name],
      personaId: persona.id,
      color: persona.c2,
      accent: persona.ring,
      accessory: persona.accessory,
      avatar: persona.avatar || ""
    };
  });
  window.dispatchEvent(new CustomEvent("dialogAgentsUpdate", { detail: { agents: payload } }));
}

function radarCenter() {
  return { cx: 160, cy: 160, maxR: 110 };
}

function toCanonicalPoint(key, value) {
  const { cx, cy, maxR } = radarCenter();
  const index = TRAIT_KEYS.indexOf(key);
  const angle = ((-90 + index * 72) * Math.PI) / 180;
  const r = (maxR * value) / 100;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

function ensureRadarPoints() {
  if (Object.keys(incubatorState.radarPoints).length) return;
  TRAIT_KEYS.forEach(key => {
    incubatorState.radarPoints[key] = toCanonicalPoint(key, incubatorState.traits[key]);
  });
}

function syncTraitsFromRadarPoints() {
  const { cx, cy, maxR } = radarCenter();
  TRAIT_KEYS.forEach(key => {
    const point = incubatorState.radarPoints[key];
    if (!point) return;
    const dx = point.x - cx;
    const dy = point.y - cy;
    const radius = Math.sqrt(dx * dx + dy * dy);
    incubatorState.traits[key] = Math.max(0, Math.min(100, Math.round((radius / maxR) * 100)));
  });
}

function clampRadarPoint(point) {
  const { cx, cy, maxR } = radarCenter();
  const dx = point.x - cx;
  const dy = point.y - cy;
  const radius = Math.sqrt(dx * dx + dy * dy);
  if (radius <= maxR) return point;
  const ratio = maxR / radius;
  return { x: cx + dx * ratio, y: cy + dy * ratio };
}

function snapRadarPoint(point) {
  const { cx, cy, maxR } = radarCenter();
  const dx = point.x - cx;
  const dy = point.y - cy;
  const radius = Math.sqrt(dx * dx + dy * dy);
  const theta = Math.atan2(dy, dx);
  const ringStep = maxR / 5;
  const snappedRadius = Math.max(0, Math.min(maxR, Math.round(radius / ringStep) * ringStep));
  const angleStep = (15 * Math.PI) / 180;
  const snappedTheta = Math.round(theta / angleStep) * angleStep;
  return {
    x: cx + Math.cos(snappedTheta) * snappedRadius,
    y: cy + Math.sin(snappedTheta) * snappedRadius
  };
}

function gradientByOffsets(item) {
  const rational = Number(item.offsets?.rationality || 0);
  const risk = Number(item.offsets?.risk || 0);
  const emotion = Number(item.offsets?.emotion || 0);
  if (rational > 15) return "linear-gradient(160deg,#6f7cff,#7a3cff)";
  if (risk > 15) return "linear-gradient(160deg,#ff9f6f,#ff5f8a)";
  if (emotion > 15) return "linear-gradient(160deg,#7a3cff,#33e1ff)";
  return "linear-gradient(160deg,#33e1ff,#6f7cff)";
}

function moodByOffsets(item) {
  const rational = Number(item.offsets?.rationality || 0);
  const risk = Number(item.offsets?.risk || 0);
  const emotion = Number(item.offsets?.emotion || 0);
  if (rational >= 20) return "calm";
  if (risk >= 20) return "bold";
  if (emotion >= 20) return "wave";
  return "balanced";
}

function syncAgentsFromUser(user) {
  if (user?.customAgents && user.customAgents.length > 0) {
    agents = user.customAgents.map(item => ({
      name: item.name || "新 Agent",
      color: gradientByOffsets(item),
      mood: moodByOffsets(item)
    }));
  } else {
    agents = [...DEFAULT_AGENTS];
  }
  renderAgents("agent-list");
}

function routeAfterLogin(user, isNewUser = false) {
  revealApp();
  hydrateIncubatorFromUser(user);
  syncAgentsFromUser(user);

  if (isNewUser || !user.hasAgent) {
    user.lastSection = "incubate";
    saveCurrentUser(user);
    setIncubatorStep(1);
    scrollToSection("incubate");
    appendMessage({
      sender: "agent",
      agentName: "系统",
      content: `欢迎 ${user.nickname}，先完成人格孵化，再进入多 Agent 对话。`,
      theme: "theme-rational"
    });
    return;
  }

  const section = user.lastSection || "dialog";
  scrollToSection(section);
  appendMessage({
    sender: "agent",
    agentName: "系统",
    content: `欢迎回来 ${user.nickname}，已恢复到「${section === "dialog" ? "主对话" : "上次会话"}」。`,
    theme: "theme-rational"
  });
}

function registerUser(payload) {
  const users = loadUsers();
  if (users[payload.email]) {
    updateFeedback("该邮箱已注册，请直接登录。", "error");
    return;
  }

  const newUser = {
    email: payload.email,
    password: payload.password,
    nickname: payload.nickname,
    hasAgent: false,
    lastSection: "incubate",
    createdAt: Date.now(),
    profile: {
      ...incubatorState.profile,
      nickname: payload.nickname
    },
    persona: { ...incubatorState.traits },
    experiences: [],
    customAgents: []
  };
  users[payload.email] = newUser;
  saveUsers(users);
  setSession({ email: payload.email });
  updateFeedback("注册成功，正在进入人格孵化室...", "ok");
  setTimeout(() => routeAfterLogin(newUser, true), 450);
}

function loginUser(payload) {
  const users = loadUsers();
  const user = users[payload.email];
  if (!user) {
    updateFeedback("用户不存在，请先注册。", "error");
    return;
  }
  if (user.password !== payload.password) {
    updateFeedback("密码错误，请重试。", "error");
    return;
  }
  setSession({ email: user.email });
  updateFeedback("登录成功，正在进入系统...", "ok");
  setTimeout(() => routeAfterLogin(user, false), 420);
}

function googleQuickLogin() {
  const users = loadUsers();
  const email = "google.demo@persona.ai";
  if (!users[email]) {
    users[email] = {
      email,
      password: "google-oauth",
      nickname: "Google用户",
      hasAgent: true,
      lastSection: "dialog",
      createdAt: Date.now(),
      persona: { ...incubatorState.traits },
      experiences: [],
      customAgents: [...buildBaseAgents()]
    };
    saveUsers(users);
  }
  setSession({ email });
  updateFeedback("Google 登录成功，正在恢复会话...", "ok");
  setTimeout(() => routeAfterLogin(users[email], false), 420);
}

function renderAgents(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  if (dialogState.mentionTarget && dialogState.mutedAgents[dialogState.mentionTarget]) {
    dialogState.mentionTarget = "";
  }
  el.innerHTML = agents.map((a, idx) => {
    const isMuted = !!dialogState.mutedAgents[a.name];
    const isEnabled = !isMuted;
    const isActive = dialogState.selectedAgent === a.name;
    const persona = resolvePersona(a);
    const ringColor = persona.ring;
    return `
      <article class="agent-side-card ${isActive ? "active" : ""} ${isMuted ? "muted" : ""}" data-agent="${a.name}" data-index="${idx}">
        <div class="agent-mini-avatar avatar-${persona.id}" style="--agent-c1:${persona.c1};--agent-c2:${persona.c2};--agent-c3:${persona.c3};">
          ${buildAvatarMarkup(persona, ringColor)}
        </div>
        <div class="agent-meta">
          <div class="name">${a.name}</div>
          <div class="mood">${isEnabled ? persona.moodLabel : "已关闭 · 不参与回答"}${dialogState.thinkingAgents[a.name] ? " · 思考中..." : ""}</div>
        </div>
        <button class="agent-switch ${isEnabled ? "on" : "off"}" data-toggle="${a.name}" title="启用切换" aria-pressed="${isEnabled ? "true" : "false"}" type="button">
          <span class="agent-switch-track"></span>
          <span class="agent-switch-thumb"></span>
        </button>
      </article>
    `;
  }).join("");

  el.querySelectorAll(".agent-side-card").forEach(card => {
    card.addEventListener("click", evt => {
      if (evt.target.closest(".agent-switch")) return;
      const name = card.dataset.agent || "Agent";
      dialogState.selectedAgent = name;
      highlightAgent(name);
      renderAgents(targetId);
      focusLatestMessageByAgent(name);
    });
  });
  el.querySelectorAll(".agent-switch").forEach(btn => {
    btn.addEventListener("click", evt => {
      evt.stopPropagation();
      const name = btn.dataset.toggle;
      dialogState.mutedAgents[name] = !dialogState.mutedAgents[name];
      renderAgents(targetId);
    });
  });
  pushDialogAgentVisuals();
  renderMentionPicker();
}

function highlightAgent(name) {
  window.dispatchEvent(new CustomEvent("dialogSpeakerFocus", {
    detail: { index: Math.max(0, agents.findIndex(a => a.name === name)), name }
  }));
  const chat = document.getElementById("chat-area");
  const theme = getAgentTheme(name);
  if (!chat) return;
  chat.insertAdjacentHTML("beforeend", `
    <article class="chat-message" data-agent="${name}">
      <div class="meta-row"><span>${name}</span><span>${new Date().toLocaleTimeString()}</span></div>
      <div class="bubble agent ${theme}"><b>${name}</b>：已加入当前焦点讨论。</div>
    </article>
  `);
  chat.scrollTop = chat.scrollHeight;
}

function emotionFromInput(text) {
  if (/(焦虑|担心|害怕|风险)/.test(text)) return "anxious";
  if (/(兴奋|激动|机会|冲)/.test(text)) return "excited";
  return "calm";
}

function updateNetStatus(text, tone = "normal") {
  const node = document.getElementById("net-status");
  if (!node) return;
  node.textContent = text;
  node.style.color = tone === "error" ? "#ff9db2" : tone === "ok" ? "#9ef4cc" : "";
}

function syncDeepSeekStatus() {
  updateNetStatus("模型：后端代理模式", "ok");
}

function recordDialogMessage({ sender = "agent", agentName = "", content = "" }) {
  const text = String(content || "").trim();
  if (!text) return;
  dialogState.history.push({
    sender,
    agentName: sender === "agent" ? agentName : "",
    content: text,
    ts: Date.now()
  });
  if (dialogState.history.length > 36) {
    dialogState.history = dialogState.history.slice(-36);
  }
}

function getRecentDialogMessages(limit = 14) {
  return dialogState.history.slice(-limit);
}

function buildAgentSystemPrompt(agent) {
  const persona = resolvePersona(agent);
  return [
    "你是 Persona Switch 的多Agent成员之一，请使用中文简体回复。",
    `你的身份：${agent.name}，人格风格：${persona.moodLabel}。`,
    "任务：针对用户问题给出可执行建议、风险提示和下一步动作。",
    "要求：",
    "1) 回复结构清晰，先结论后理由；",
    "2) 尽量给出 2-4 条要点；",
    "3) 与其他Agent保持差异化视角，不重复空话；",
    "4) 内容要具体，避免泛泛而谈。"
  ].join("\n");
}

async function callDeepSeekChat(agent, userPrompt, opts = {}) {
  const history = getRecentDialogMessages(14);
  const messages = [
    { role: "system", content: buildAgentSystemPrompt(agent) },
    ...history.map(item => {
      if (item.sender === "user") return { role: "user", content: item.content };
      return { role: "assistant", content: `[${item.agentName || "Agent"}] ${item.content}` };
    })
  ];

  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    messages.push({ role: "user", content: userPrompt });
  }
  if (opts.extraUserPrompt) {
    messages.push({ role: "user", content: opts.extraUserPrompt });
  }

  const resp = await fetch(DEEPSEEK_PROXY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      temperature: typeof opts.temperature === "number" ? opts.temperature : 0.8,
      max_tokens: 500,
      stream: false,
      messages
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`代理请求失败(${resp.status}) ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = String(data?.content || data?.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    throw new Error("DeepSeek返回为空");
  }
  return text;
}

function appendMessage({ sender = "agent", agentName = "", content = "", theme = "theme-rational", typing = false }) {
  const chat = document.getElementById("chat-area");
  if (!chat) return null;
  const id = `m-${Date.now()}-${dialogState.messageSeed += 1}`;
  const safeName = sender === "user" ? "你" : agentName;
  const bubbleClass = sender === "user" ? "bubble user" : `bubble agent ${theme} ${typing ? "typing-dot" : ""}`;
  const targetAgent = agents.find(a => a.name === agentName);
  const persona = resolvePersona(targetAgent);
  const avatar = sender === "agent"
    ? `<span class="meta-avatar avatar-${persona.id}" style="--agent-c1:${persona.c1};--agent-c2:${persona.c2};--agent-c3:${persona.c3};">${buildAvatarMarkup(persona)}</span>`
    : "";
  const node = document.createElement("article");
  node.className = `chat-message ${sender === "user" ? "is-user" : "is-agent"}`;
  node.dataset.agent = agentName || "";
  node.dataset.id = id;
  node.innerHTML = `
    <div class="meta-row">${avatar}<span>${safeName}</span><span>${new Date().toLocaleTimeString()}</span></div>
    <div class="${bubbleClass}">${content}</div>
    ${sender === "agent" ? `
      <div class="message-actions">
        <button data-act="up">👍</button>
        <button data-act="down">👎</button>
        <button data-act="follow">💬</button>
        <button data-act="quote">🔗</button>
        <button data-act="copy">📋</button>
      </div>` : ""}
  `;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
  return node;
}

function streamText(node, fullText, speed = 22) {
  return new Promise(resolve => {
    if (!node) return resolve();
    const bubble = node.querySelector(".bubble");
    if (!bubble) return resolve();
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      bubble.textContent = fullText.slice(0, i);
      if (i >= fullText.length) {
        clearInterval(timer);
        bubble.classList.remove("typing-dot");
        resolve();
      }
    }, speed);
  });
}

function focusLatestMessageByAgent(name) {
  const list = [...document.querySelectorAll(`.chat-message[data-agent="${name}"]`)];
  const target = list[list.length - 1];
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.style.outline = "1px solid rgba(51,225,255,0.75)";
  setTimeout(() => { target.style.outline = ""; }, 1200);
}

function getUnmutedAgents() {
  return agents.filter(a => !dialogState.mutedAgents[a.name]);
}

function normalizeAgentName(name = "") {
  return String(name || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function findAgentByName(name = "") {
  const key = normalizeAgentName(name);
  if (!key) return null;
  return agents.find(a => normalizeAgentName(a.name) === key) || null;
}

function parseMentionTarget(rawText) {
  const text = String(rawText || "").trim();
  if (!text.startsWith("@")) return { mentioned: false, targetName: "", cleanText: text };

  const rest = text.slice(1).trimStart();
  const sortedAgents = [...agents].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
  const byPrefix = sortedAgents.find(a => rest.startsWith(a.name));
  if (byPrefix) {
    const tail = rest.slice(byPrefix.name.length).replace(/^[\s:：，,。.!！？?]+/, "").trim();
    return {
      mentioned: true,
      targetName: byPrefix.name,
      cleanText: tail || "请基于当前上下文继续给出建议。"
    };
  }

  const tokenMatch = rest.match(/^([^\s:：，,。.!！？?]+)/);
  const token = tokenMatch?.[1] || "";
  if (!token) return { mentioned: false, targetName: "", cleanText: text };
  const target = findAgentByName(token);
  if (target) {
    const tail = rest.slice(token.length).replace(/^[\s:：，,。.!！？?]+/, "").trim();
    return {
      mentioned: true,
      targetName: target.name,
      cleanText: tail || "请基于当前上下文继续给出建议。"
    };
  }
  return {
    mentioned: true,
    targetName: token,
    cleanText: rest.slice(token.length).replace(/^[\s:：，,。.!！？?]+/, "").trim() || "请基于当前上下文继续给出建议。"
  };
}

function pickMentionAgentName() {
  if (dialogState.mentionTarget) return dialogState.mentionTarget;
  if (dialogState.selectedAgent) return dialogState.selectedAgent;
  const first = getUnmutedAgents()[0];
  return first?.name || (agents[0]?.name || "理性+");
}

function upsertInputMention(input, targetName) {
  const rest = String(input.value || "").replace(/^@[^\s:：，,。.!！？?]+[\s:：，,。.!！？?]*/, "").trim();
  input.value = `@${targetName} ${rest}`.trim();
}

function closeMentionPicker() {
  document.getElementById("mention-picker")?.classList.add("hidden");
}

function syncMentionButtonLabel() {
  const mentionBtn = document.getElementById("btn-mention");
  if (!mentionBtn) return;
  if (dialogState.mentionTarget) {
    mentionBtn.textContent = `@${dialogState.mentionTarget}`;
    mentionBtn.classList.add("active");
  } else {
    mentionBtn.textContent = "@指定Agent";
    mentionBtn.classList.remove("active");
  }
}

function renderMentionPicker() {
  const list = document.getElementById("mention-picker-list");
  if (!list) return;
  const available = getUnmutedAgents();
  if (dialogState.mentionTarget && !available.some(a => a.name === dialogState.mentionTarget)) {
    dialogState.mentionTarget = "";
  }
  const current = pickMentionAgentName();
  if (!available.length) {
    list.innerHTML = `<div class="mention-empty">当前没有可用 Agent（可能已全部静音）。</div>`;
    syncMentionButtonLabel();
    return;
  }
  list.innerHTML = available.map(agent => `
    <button class="mention-item ${agent.name === current ? "active" : ""}" data-mention-agent="${agent.name}" type="button">
      ${agent.name}
    </button>
  `).join("");
  syncMentionButtonLabel();
}

function toggleMentionPicker(forceOpen = null) {
  const panel = document.getElementById("mention-picker");
  if (!panel) return;
  const opening = typeof forceOpen === "boolean" ? forceOpen : panel.classList.contains("hidden");
  if (!opening) {
    closeMentionPicker();
    return;
  }
  renderMentionPicker();
  panel.classList.remove("hidden");
}

function insertMentionToInput(targetName = "") {
  const input = document.getElementById("user-input");
  if (!input) return;
  const target = targetName || pickMentionAgentName();
  dialogState.mentionTarget = target;
  upsertInputMention(input, target);
  syncMentionButtonLabel();
  closeMentionPicker();
  input.focus();
  autoGrowTextarea(input);
}

async function mockDebate() {
  if (dialogState.isGenerating) return;
  const candidates = getUnmutedAgents().slice(0, 3);
  if (!candidates.length) return;
  const topic = [...dialogState.history].reverse().find(item => item.sender === "user")?.content || "当前决策方向";
  const sendBtn = document.getElementById("btn-send");
  const debateBtn = document.getElementById("btn-debate");
  if (sendBtn) sendBtn.disabled = true;
  if (debateBtn) debateBtn.disabled = true;
  dialogState.isGenerating = true;
  updateNetStatus("模型：辩论生成中...", "normal");
  try {
    for (let idx = 0; idx < candidates.length; idx += 1) {
      const agent = candidates[idx];
      dialogState.thinkingAgents[agent.name] = true;
      renderAgents("agent-list");
      window.dispatchEvent(new CustomEvent("dialogSpeakerFocus", { detail: { index: idx, name: agent.name } }));

      const node = appendMessage({
        sender: "agent",
        agentName: agent.name,
        content: "",
        theme: getAgentTheme(agent.name),
        typing: true
      });

      let result = "";
      try {
        result = await callDeepSeekChat(agent, topic, {
          temperature: 1.0,
          extraUserPrompt: `请发起辩论：围绕议题「${topic}」，先表达你的立场，再指出一个你不同意的潜在观点，并给出你主张的下一步。控制在120字内。`
        });
        updateNetStatus("模型：DeepSeek 已连接", "ok");
      } catch (err) {
        result = "我建议先验证关键假设，再决定是否扩大投入。";
        updateNetStatus("模型：请求失败，已回退", "error");
        console.error(err);
      }

      dialogState.thinkingAgents[agent.name] = false;
      renderAgents("agent-list");
      await streamText(node, `${agent.name}：${result}`, 10);
      recordDialogMessage({ sender: "agent", agentName: agent.name, content: result });
    }
    updateInsightPanel();
  } finally {
    dialogState.isGenerating = false;
    dialogState.thinkingAgents = {};
    renderAgents("agent-list");
    if (sendBtn) sendBtn.disabled = false;
    if (debateBtn) debateBtn.disabled = false;
    if (decisionState.topic || document.getElementById("decision-topic")?.value.trim()) {
      refreshDecisionAnalysis();
    }
  }
}

async function parallelAgentReply(prompt, options = {}) {
  if (dialogState.isGenerating) return;
  const targets = Array.isArray(options.targetAgents) && options.targetAgents.length
    ? options.targetAgents
    : getUnmutedAgents();
  const activeAgents = targets;
  if (!activeAgents.length) return;
  const sendBtn = document.getElementById("btn-send");
  const debateBtn = document.getElementById("btn-debate");
  dialogState.isGenerating = true;
  if (sendBtn) sendBtn.disabled = true;
  if (debateBtn) debateBtn.disabled = true;
  updateNetStatus("模型：生成中...", "normal");
  try {
    for (let i = 0; i < activeAgents.length; i += 1) {
      const agent = activeAgents[i];
      dialogState.thinkingAgents[agent.name] = true;
    }
    renderAgents("agent-list");

    for (let i = 0; i < activeAgents.length; i += 1) {
      const agent = activeAgents[i];
      await new Promise(r => setTimeout(r, 120));
      let result = "";
      try {
        result = await callDeepSeekChat(agent, prompt);
        updateNetStatus("模型：DeepSeek 已连接", "ok");
      } catch (err) {
        result = `基于你的问题「${prompt.slice(0, 18)}${prompt.length > 18 ? "..." : ""}」，我建议先做小范围验证，再决定资源分配。`;
        updateNetStatus("模型：请求失败，已回退", "error");
        console.error(err);
      }

      dialogState.thinkingAgents[agent.name] = false;
      renderAgents("agent-list");
      window.dispatchEvent(new CustomEvent("dialogSpeakerFocus", { detail: { index: i, name: agent.name } }));
      const node = appendMessage({
        sender: "agent",
        agentName: agent.name,
        content: "",
        theme: getAgentTheme(agent.name),
        typing: true
      });
      await streamText(node, `${agent.name}：${result}`, 10);
      recordDialogMessage({ sender: "agent", agentName: agent.name, content: result });
    }
    updateInsightPanel();
  } finally {
    dialogState.isGenerating = false;
    dialogState.thinkingAgents = {};
    renderAgents("agent-list");
    if (sendBtn) sendBtn.disabled = false;
    if (debateBtn) debateBtn.disabled = false;
    if (decisionState.topic || document.getElementById("decision-topic")?.value.trim()) {
      refreshDecisionAnalysis();
    }
  }
}

function mockSendFlow(text) {
  const { mentioned, targetName, cleanText } = parseMentionTarget(text);
  appendMessage({ sender: "user", content: text });
  recordDialogMessage({ sender: "user", content: text });
  if (!decisionState.topic) {
    decisionState.topic = cleanText || text;
    hydrateDecisionSetup();
  }

  let targetAgent = null;
  if (mentioned) {
    targetAgent = findAgentByName(targetName);
  } else if (dialogState.mentionTarget) {
    targetAgent = findAgentByName(dialogState.mentionTarget);
  }

  if (targetAgent && dialogState.mutedAgents[targetAgent.name]) {
    targetAgent = null;
  }

  if (!targetAgent && mentioned) {
    appendMessage({
      sender: "agent",
      agentName: "系统",
      content: `未找到可用 Agent「${targetName}」，请检查名称或取消静音后重试。`,
      theme: "theme-rational"
    });
    dialogState.mentionTarget = "";
    const mentionBtn = document.getElementById("btn-mention");
    if (mentionBtn) mentionBtn.textContent = "@指定Agent";
    return;
  }

  if (targetAgent) {
    dialogState.selectedAgent = targetAgent.name;
    dialogState.mentionTarget = targetAgent.name;
    renderAgents("agent-list");
    parallelAgentReply(cleanText, { targetAgents: [targetAgent] });
    return;
  }

  parallelAgentReply(cleanText);
}

function mockSpeak() {
  const input = document.getElementById("user-input");
  const val = input?.value.trim();
  if (!val) return;
  if (dialogState.isGenerating) return;
  window.dispatchEvent(new CustomEvent("dialogEmotionShift", { detail: { mood: emotionFromInput(val) } }));
  mockSendFlow(val);
  input.value = "";
  autoGrowTextarea(input);
}

function autoGrowTextarea(node) {
  if (!node) return;
  node.style.height = "auto";
  node.style.height = `${Math.min(node.scrollHeight, 120)}px`;
}

function mockLogin() {
  const user = getCurrentUser();
  if (!user) {
    document.getElementById("login-email")?.focus();
    return;
  }
  routeAfterLogin(user, false);
}

function updateStepChips() {
  document.querySelectorAll(".step-chip").forEach(chip => {
    chip.classList.toggle("active", Number(chip.dataset.jumpStep) === incubatorState.currentStep);
  });
}

function getSeedStepProgress(step) {
  if (step === 1) {
    const fields = [
      incubatorState.profile.nickname,
      incubatorState.profile.age,
      incubatorState.profile.gender,
      incubatorState.profile.job,
      incubatorState.profile.edu,
      incubatorState.profile.location,
      incubatorState.profile.intro
    ];
    const filled = fields.filter(v => String(v ?? "").trim() !== "").length;
    return Math.min(1, filled / fields.length);
  }
  if (step === 2) {
    const values = TRAIT_KEYS.map(key => Number(incubatorState.traits[key] || 0));
    const avg = values.reduce((sum, n) => sum + n, 0) / Math.max(1, values.length);
    return Math.max(0, Math.min(1, avg / 100));
  }
  if (step === 3) {
    const p1 = Math.min(1, String(incubatorState.principles.p1 || "").trim().length / 30);
    const p2 = Math.min(1, String(incubatorState.principles.p2 || "").trim().length / 30);
    const slider = ((Number(incubatorState.principles.justice || 50) + Number(incubatorState.principles.collective || 50)) / 2) / 100;
    return Math.max(0, Math.min(1, p1 * 0.35 + p2 * 0.35 + slider * 0.3));
  }
  if (step === 4) {
    const selected = incubatorState.experiences.filter(item => item.selected).length;
    const timeline = incubatorState.timeline.length;
    return Math.max(0, Math.min(1, (selected / 5) * 0.7 + (Math.min(5, timeline) / 5) * 0.3));
  }
  if (step === 5) {
    const done = incubatorState.scenarios.filter(item => item.answer).length;
    const reasons = incubatorState.scenarios.filter(item => String(item.reason || "").trim().length >= 6).length;
    return Math.max(0, Math.min(1, (done / incubatorState.scenarios.length) * 0.75 + (reasons / incubatorState.scenarios.length) * 0.25));
  }
  if (step === 6) {
    const count = Math.min(5, incubatorState.customAgents.length) / 5;
    const selected = getSelectedCustomAgent();
    const energy = selected
      ? Math.min(1, (
        Math.abs(Number(selected.offsets.rationality || 0)) +
        Math.abs(Number(selected.offsets.risk || 0)) +
        Math.abs(Number(selected.offsets.emotion || 0))
      ) / 90)
      : 0;
    return Math.max(0, Math.min(1, count * 0.65 + energy * 0.35));
  }
  return 0;
}

function updateSeedPreview() {
  const seed = document.getElementById("incubator-seed-preview");
  const hint = document.getElementById("incubator-seed-hint");
  if (!seed || !hint) return;
  const map = {
    1: "当前阶段：基础信息构建中",
    2: "当前阶段：人格结构校准中",
    3: "当前阶段：价值观权重计算中",
    4: "当前阶段：记忆锚点连接中",
    5: "当前阶段：情境偏好测试中",
    6: "当前阶段：Agent宇宙孵化中"
  };
  const step = incubatorState.currentStep;
  const progress = getSeedStepProgress(step);
  const glow = Math.round(12 + step * 2 + progress * 9);
  const scale = (0.92 + step * 0.04 + progress * 0.08).toFixed(3);
  const ringOpacity = (0.28 + progress * 0.45).toFixed(3);
  const pulseSpeed = (2.6 - progress * 0.9).toFixed(3);

  seed.classList.remove("phase-1", "phase-2", "phase-3", "phase-4", "phase-5", "phase-6");
  seed.classList.add(`phase-${step}`);
  seed.style.setProperty("--seed-progress", progress.toFixed(3));
  seed.style.setProperty("--seed-scale", scale);
  seed.style.setProperty("--seed-ring-opacity", ringOpacity);
  seed.style.setProperty("--seed-glow-size", `${glow}px`);
  seed.style.setProperty("--seed-pulse-speed", `${pulseSpeed}s`);
  seed.style.filter = `drop-shadow(0 0 ${glow}px rgba(111,124,255,0.4))`;
  hint.textContent = `${map[step]} · 演化进度 ${Math.round(progress * 100)}%`;
}

function setIncubatorStep(step) {
  incubatorState.currentStep = Math.max(1, Math.min(6, step));
  document.querySelectorAll(".incubate-step").forEach(node => {
    node.classList.toggle("active", Number(node.dataset.step) === incubatorState.currentStep);
  });

  const textMap = {
    1: "步骤 1/6：基础信息",
    2: "步骤 2/6：人格罗盘",
    3: "步骤 3/6：价值观与原则",
    4: "步骤 4/6：关键经历锚点",
    5: "步骤 5/6：决策情境测试",
    6: "步骤 6/6：Agent宇宙孵化"
  };
  const progress = document.getElementById("incubate-progress-fill");
  const stepText = document.getElementById("incubate-step-text");
  if (progress) progress.style.width = `${(incubatorState.currentStep / 6) * 100}%`;
  if (stepText) stepText.textContent = textMap[incubatorState.currentStep];

  document.getElementById("btn-prev-step")?.classList.toggle("hidden", incubatorState.currentStep === 1);
  document.getElementById("btn-next-step")?.classList.toggle("hidden", incubatorState.currentStep === 6);
  document.getElementById("btn-complete-incubate")?.classList.toggle("hidden", incubatorState.currentStep !== 6);
  document.getElementById("btn-skip-step")?.classList.toggle("hidden", incubatorState.currentStep === 2 || incubatorState.currentStep === 6);
  updateStepChips();
  updateSeedPreview();
}

function renderValueSortList() {
  const root = document.getElementById("value-sort-list");
  if (!root) return;
  root.innerHTML = incubatorState.values.map((value, idx) => `
    <div class="value-card">
      <span>${idx + 1}. ${value}</span>
      <span>
        <button data-value-up="${idx}">↑</button>
        <button data-value-down="${idx}">↓</button>
      </span>
    </div>
  `).join("");
}

function renderScenarioList() {
  const root = document.getElementById("scenario-list");
  if (!root) return;
  root.innerHTML = incubatorState.scenarios.map(s => `
    <article class="scenario-card" data-sid="${s.id}">
      <div><b>${s.q}</b></div>
      <div class="scenario-options">
        ${s.options.map(opt => `<button class="scenario-option ${s.answer === opt ? "active" : ""}" data-opt="${opt}">${opt}</button>`).join("")}
      </div>
      <input class="scenario-reason" data-reason-for="${s.id}" placeholder="可选：补充你的理由" value="${s.reason || ""}" />
    </article>
  `).join("");
}

function buildBaseAgents() {
  return [
    {
      id: `a-${Date.now()}-1`,
      name: "理性偏移",
      offsets: { rationality: 20, risk: -8, emotion: -12 }
    },
    {
      id: `a-${Date.now()}-2`,
      name: "感性偏移",
      offsets: { rationality: -12, risk: 2, emotion: 20 }
    },
    {
      id: `a-${Date.now()}-3`,
      name: "冒险偏移",
      offsets: { rationality: 4, risk: 22, emotion: 8 }
    }
  ];
}

function getIncubatorArchetype(agent) {
  const r = Number(agent?.offsets?.rationality || 0);
  const k = Number(agent?.offsets?.risk || 0);
  const e = Number(agent?.offsets?.emotion || 0);

  if (k <= -12) {
    return {
      id: "guardian",
      label: "谨慎偏移",
      icon: "🛡️",
      colorA: "#8b7dff",
      colorB: "#384a96",
      styleText: "稳健守护",
      accessoryText: "配饰：护盾环"
    };
  }
  if (k >= 12 && k >= r && k >= e) {
    return {
      id: "adventure",
      label: "冒险偏移",
      icon: "⚡",
      colorA: "#ffb482",
      colorB: "#ff6b7f",
      styleText: "冒险执行",
      accessoryText: "配饰：能量棱环"
    };
  }
  if (e >= 12 && e >= r) {
    return {
      id: "empath",
      label: "感性偏移",
      icon: "💗",
      colorA: "#8de9ff",
      colorB: "#8c74ff",
      styleText: "情绪共鸣",
      accessoryText: "配饰：波纹光晕"
    };
  }
  if (r >= 12) {
    return {
      id: "rational",
      label: "理性偏移",
      icon: "🧠",
      colorA: "#85a5ff",
      colorB: "#546dff",
      styleText: "冷静理性",
      accessoryText: "配饰：几何镜片"
    };
  }
  return {
    id: "balanced",
    label: "平衡偏移",
    icon: "✨",
    colorA: "#92c1ff",
    colorB: "#7e8bff",
    styleText: "中性风格",
    accessoryText: "配饰：标准环"
  };
}

function hydrateIncubatorFromUser(user) {
  if (!user) return;
  if (user.profile) {
    incubatorState.profile = {
      ...incubatorState.profile,
      ...user.profile
    };
  }
  if (user.persona) {
    TRAIT_KEYS.forEach(key => {
      if (typeof user.persona[key] === "number") {
        incubatorState.traits[key] = user.persona[key];
      }
    });
  }
  if (Array.isArray(user.experiences) && user.experiences.length) {
    incubatorState.experiences = EXPERIENCE_PRESETS.map(base => {
      const found = user.experiences.find(item => item.id === base.id);
      return found ? { ...base, selected: true, note: found.note || "" } : { ...base, selected: false, note: "" };
    });
  } else {
    incubatorState.experiences = EXPERIENCE_PRESETS.map(item => ({ ...item, selected: false, note: "" }));
  }
  if (Array.isArray(user.timeline)) {
    incubatorState.timeline = [...user.timeline];
  }
  if (Array.isArray(user.values) && user.values.length) {
    incubatorState.values = [...user.values];
  } else {
    incubatorState.values = [...VALUE_PRESETS];
  }
  if (user.principles) {
    incubatorState.principles = {
      ...incubatorState.principles,
      ...user.principles
    };
  }
  if (Array.isArray(user.scenarios) && user.scenarios.length) {
    incubatorState.scenarios = SCENARIO_PRESETS.map(s => {
      const hit = user.scenarios.find(x => x.id === s.id);
      return hit ? { ...s, answer: hit.answer || "", reason: hit.reason || "" } : { ...s, answer: "", reason: "" };
    });
  } else {
    incubatorState.scenarios = SCENARIO_PRESETS.map(item => ({ ...item, answer: "", reason: "" }));
  }
  if (Array.isArray(user.customAgents) && user.customAgents.length) {
    incubatorState.customAgents = user.customAgents.map(item => ({
      id: item.id || `a-${Math.random().toString(36).slice(2, 8)}`,
      name: item.name || "新 Agent",
      offsets: {
        rationality: Number(item.offsets?.rationality || 0),
        risk: Number(item.offsets?.risk || 0),
        emotion: Number(item.offsets?.emotion || 0)
      }
    }));
  } else {
    incubatorState.customAgents = buildBaseAgents();
  }

  incubatorState.selectedAgentId = incubatorState.customAgents[0]?.id || null;
  incubatorState.activeExperienceId = incubatorState.experiences.find(item => item.selected)?.id || null;
  incubatorState.radarPoints = {};
  ensureRadarPoints();
  syncTraitInputs();
  renderRadar();
  renderExperienceCards();
  renderExperienceSummary();
  renderValueSortList();
  renderTimelineList();
  renderScenarioList();
  renderIncubatorPool();
  syncSelectedAgentEditor();

  const baseNickname = document.getElementById("base-nickname");
  if (baseNickname) baseNickname.value = incubatorState.profile.nickname || "";
  const baseAge = document.getElementById("base-age");
  if (baseAge) baseAge.value = String(incubatorState.profile.age || 26);
  const baseAgeText = document.getElementById("val-base-age");
  if (baseAgeText) baseAgeText.textContent = String(incubatorState.profile.age || 26);
  const baseGender = document.getElementById("base-gender");
  if (baseGender) baseGender.value = incubatorState.profile.gender || "";
  const baseJob = document.getElementById("base-job");
  if (baseJob) baseJob.value = incubatorState.profile.job || "";
  const baseEdu = document.getElementById("base-edu");
  if (baseEdu) baseEdu.value = incubatorState.profile.edu || "本科";
  const baseLocation = document.getElementById("base-location");
  if (baseLocation) baseLocation.value = incubatorState.profile.location || "";
  const baseIntro = document.getElementById("base-intro");
  if (baseIntro) baseIntro.value = incubatorState.profile.intro || "";
  baseAge?.dispatchEvent(new Event("input"));
  baseJob?.dispatchEvent(new Event("input"));
  baseIntro?.dispatchEvent(new Event("input"));

  const p1 = document.getElementById("principle-1");
  if (p1) p1.value = incubatorState.principles.p1 || "";
  const p2 = document.getElementById("principle-2");
  if (p2) p2.value = incubatorState.principles.p2 || "";
  const pj = document.getElementById("principle-justice");
  if (pj) pj.value = String(incubatorState.principles.justice);
  const pjv = document.getElementById("val-principle-justice");
  if (pjv) pjv.textContent = String(incubatorState.principles.justice);
  const pc = document.getElementById("principle-collective");
  if (pc) pc.value = String(incubatorState.principles.collective);
  const pcv = document.getElementById("val-principle-collective");
  if (pcv) pcv.textContent = String(incubatorState.principles.collective);
}

function initRadarGrid() {
  const grid = document.getElementById("radar-grid");
  if (!grid || grid.dataset.ready) return;
  const cx = 160;
  const cy = 160;
  const maxR = 110;
  const levelCount = 5;

  for (let level = 1; level <= levelCount; level += 1) {
    const r = (maxR * level) / levelCount;
    const points = TRAIT_KEYS.map((_, index) => {
      const angle = ((-90 + index * 72) * Math.PI) / 180;
      return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
    }).join(" ");
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", points);
    grid.appendChild(poly);
  }

  TRAIT_KEYS.forEach((key, index) => {
    const angle = ((-90 + index * 72) * Math.PI) / 180;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(cx));
    line.setAttribute("y1", String(cy));
    line.setAttribute("x2", String(cx + Math.cos(angle) * maxR));
    line.setAttribute("y2", String(cy + Math.sin(angle) * maxR));
    grid.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(cx + Math.cos(angle) * (maxR + 18)));
    label.setAttribute("y", String(cy + Math.sin(angle) * (maxR + 18)));
    label.setAttribute("text-anchor", "middle");
    label.textContent = TRAIT_LABELS[key];
    grid.appendChild(label);
  });
  grid.dataset.ready = "1";
}

function renderRadar() {
  initRadarGrid();
  const valuePoly = document.getElementById("radar-value");
  const handleGroup = document.getElementById("radar-handles");
  if (!valuePoly || !handleGroup) return;
  ensureRadarPoints();
  const points = TRAIT_KEYS.map(key => ({ key, ...incubatorState.radarPoints[key] }));
  valuePoly.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
  handleGroup.innerHTML = points
    .map(p => `<circle data-key="${p.key}" cx="${p.x}" cy="${p.y}" r="6"></circle>`)
    .join("");
}

function syncTraitInputs() {
  TRAIT_KEYS.forEach(key => {
    const input = document.getElementById(`trait-${key}`);
    const valueNode = document.getElementById(`val-${key}`);
    if (input) input.value = String(incubatorState.traits[key]);
    if (valueNode) valueNode.textContent = String(incubatorState.traits[key]);
  });
  const meaning = document.getElementById("radar-meaning");
  if (meaning) {
    const rational = incubatorState.traits.rationality;
    const risk = incubatorState.traits.risk;
    const horizon = incubatorState.traits.horizon;
    const txt = [
      rational >= 55 ? "偏理性" : "偏感性",
      risk >= 55 ? "偏冒险" : "偏稳健",
      horizon >= 55 ? "偏长期导向" : "偏短期导向"
    ].join("、");
    meaning.textContent = `你当前${txt}，建议在关键决策中结合数据与情绪双重验证。`;
  }
}

function bindRadarDrag() {
  const svg = document.getElementById("persona-radar");
  if (!svg) return;
  let draggingKey = null;

  const getSvgPoint = evt => {
    const rect = svg.getBoundingClientRect();
    const x = ((evt.clientX - rect.left) * 320) / rect.width;
    const y = ((evt.clientY - rect.top) * 320) / rect.height;
    return { x, y };
  };

  svg.addEventListener("mousedown", evt => {
    const key = evt.target?.dataset?.key;
    if (!key) return;
    draggingKey = key;
  });

  window.addEventListener("mousemove", evt => {
    if (!draggingKey) return;
    const point = clampRadarPoint(getSvgPoint(evt));
    incubatorState.radarPoints[draggingKey] = point;
    syncTraitsFromRadarPoints();
    syncTraitInputs();
    renderRadar();
    updateSeedPreview();
  });

  window.addEventListener("mouseup", () => {
    if (draggingKey) {
      incubatorState.radarPoints[draggingKey] = snapRadarPoint(incubatorState.radarPoints[draggingKey]);
      syncTraitsFromRadarPoints();
      syncTraitInputs();
      renderRadar();
      updateSeedPreview();
    }
    draggingKey = null;
  });
}

function renderExperienceCards() {
  const grid = document.getElementById("experience-grid");
  if (!grid) return;
  const iconMap = {
    INV: "💹",
    EMO: "💞",
    RISK: "⚡",
    JUMP: "🧭",
    CARE: "🛡️"
  };
  grid.innerHTML = incubatorState.experiences.map(item => `
    <article class="exp-card ${item.selected ? "selected" : ""}" data-exp="${item.id}">
      <div class="exp-title">
        <span class="exp-icon">${iconMap[item.icon] || "✨"}</span>
        <div class="exp-main">
          <strong>${item.title}</strong>
          <div class="sub">${item.hint}</div>
        </div>
      </div>
      <div class="exp-footer">
        <span class="exp-code">${item.icon}</span>
        <span class="badge">${item.selected ? "已选择" : "点击选择"}</span>
      </div>
    </article>
  `).join("");
}

function renderExperienceSummary() {
  const panel = document.getElementById("selected-exp-list");
  if (!panel) return;
  const selected = incubatorState.experiences.filter(item => item.selected);
  if (!selected.length) {
    panel.textContent = "尚未选择经历锚点";
    return;
  }
  panel.innerHTML = selected
    .map(item => `<span class="pill">${item.title}${item.note ? `：${item.note}` : ""}</span>`)
    .join(" ");
}

function bindTraitInputs() {
  TRAIT_KEYS.forEach(key => {
    document.getElementById(`trait-${key}`)?.addEventListener("input", evt => {
      incubatorState.traits[key] = Number(evt.target.value);
      incubatorState.radarPoints[key] = toCanonicalPoint(key, incubatorState.traits[key]);
      document.getElementById(`val-${key}`).textContent = String(evt.target.value);
      renderRadar();
      updateSeedPreview();
    });
  });
}

function bindExperienceActions() {
  document.getElementById("experience-grid")?.addEventListener("click", evt => {
    const card = evt.target.closest(".exp-card");
    if (!card) return;
    const exp = incubatorState.experiences.find(item => item.id === card.dataset.exp);
    if (!exp) return;
    exp.selected = !exp.selected;
    incubatorState.activeExperienceId = exp.selected ? exp.id : null;
    const noteInput = document.getElementById("experience-note");
    if (noteInput) noteInput.value = exp.selected ? exp.note : "";
    renderExperienceCards();
    renderExperienceSummary();
    updateSeedPreview();
  });

  document.getElementById("experience-note")?.addEventListener("input", evt => {
    if (!incubatorState.activeExperienceId) return;
    const exp = incubatorState.experiences.find(item => item.id === incubatorState.activeExperienceId);
    if (!exp || !exp.selected) return;
    exp.note = String(evt.target.value || "");
    renderExperienceSummary();
    updateSeedPreview();
  });
}

function bindBaseProfileActions() {
  const nick = document.getElementById("base-nickname");
  const age = document.getElementById("base-age");
  const ageText = document.getElementById("val-base-age");
  const intro = document.getElementById("base-intro");
  const gender = document.getElementById("base-gender");
  const job = document.getElementById("base-job");
  const edu = document.getElementById("base-edu");
  const location = document.getElementById("base-location");

  const refreshBaseTagsAndProgress = () => {
    const requiredCount = 5;
    const filled = [
      incubatorState.profile.nickname,
      incubatorState.profile.age,
      incubatorState.profile.job,
      incubatorState.profile.edu,
      incubatorState.profile.intro
    ].filter(v => String(v ?? "").trim() !== "").length;
    const percent = Math.round((filled / requiredCount) * 100);
    const fill = document.getElementById("base-info-progress-fill");
    const txt = document.getElementById("base-info-progress-text");
    if (fill) fill.style.width = `${percent}%`;
    if (txt) txt.textContent = `${filled}/${requiredCount} 完成`;

    const tAge = document.getElementById("tag-base-age");
    const tJob = document.getElementById("tag-base-job");
    const tStyle = document.getElementById("tag-base-style");
    if (tAge) tAge.textContent = `年龄：${incubatorState.profile.age}`;
    if (tJob) tJob.textContent = `职业：${incubatorState.profile.job?.trim() ? incubatorState.profile.job : "待填写"}`;
    if (tStyle) {
      const style = incubatorState.profile.intro?.length > 10 ? "风格：表达清晰" : "风格：待分析";
      tStyle.textContent = style;
    }
  };

  nick?.addEventListener("input", e => {
    incubatorState.profile.nickname = e.target.value.trim();
    refreshBaseTagsAndProgress();
    updateSeedPreview();
  });
  age?.addEventListener("input", e => {
    incubatorState.profile.age = Number(e.target.value);
    if (ageText) ageText.textContent = String(e.target.value);
    updateSeedPreview();
    refreshBaseTagsAndProgress();
  });
  intro?.addEventListener("input", e => {
    incubatorState.profile.intro = e.target.value;
    refreshBaseTagsAndProgress();
    updateSeedPreview();
  });
  gender?.addEventListener("change", e => { incubatorState.profile.gender = e.target.value; refreshBaseTagsAndProgress(); updateSeedPreview(); });
  job?.addEventListener("input", e => { incubatorState.profile.job = e.target.value; refreshBaseTagsAndProgress(); updateSeedPreview(); });
  edu?.addEventListener("change", e => { incubatorState.profile.edu = e.target.value; refreshBaseTagsAndProgress(); updateSeedPreview(); });
  location?.addEventListener("input", e => { incubatorState.profile.location = e.target.value; updateSeedPreview(); });
  refreshBaseTagsAndProgress();
  updateSeedPreview();
}

function bindValueCompass() {
  document.getElementById("value-sort-list")?.addEventListener("click", evt => {
    const up = evt.target.dataset.valueUp;
    const down = evt.target.dataset.valueDown;
    if (up !== undefined) {
      const idx = Number(up);
      if (idx <= 0) return;
      [incubatorState.values[idx - 1], incubatorState.values[idx]] = [incubatorState.values[idx], incubatorState.values[idx - 1]];
      renderValueSortList();
      updateSeedPreview();
      return;
    }
    if (down !== undefined) {
      const idx = Number(down);
      if (idx >= incubatorState.values.length - 1) return;
      [incubatorState.values[idx + 1], incubatorState.values[idx]] = [incubatorState.values[idx], incubatorState.values[idx + 1]];
      renderValueSortList();
      updateSeedPreview();
    }
  });

  document.getElementById("principle-1")?.addEventListener("input", e => { incubatorState.principles.p1 = e.target.value; updateSeedPreview(); });
  document.getElementById("principle-2")?.addEventListener("input", e => { incubatorState.principles.p2 = e.target.value; updateSeedPreview(); });
  document.getElementById("principle-justice")?.addEventListener("input", e => {
    incubatorState.principles.justice = Number(e.target.value);
    document.getElementById("val-principle-justice").textContent = String(e.target.value);
    updateSeedPreview();
  });
  document.getElementById("principle-collective")?.addEventListener("input", e => {
    incubatorState.principles.collective = Number(e.target.value);
    document.getElementById("val-principle-collective").textContent = String(e.target.value);
    updateSeedPreview();
  });
}

function renderTimelineList() {
  const root = document.getElementById("timeline-list");
  if (!root) return;
  if (!incubatorState.timeline.length) {
    root.innerHTML = `<div class="timeline-item">尚未添加经历时间轴</div>`;
    return;
  }
  root.innerHTML = incubatorState.timeline
    .sort((a, b) => a.year - b.year)
    .map(item => `<div class="timeline-item">${item.year} · ${item.title} · ${item.result}<br />${item.desc}</div>`)
    .join("");
}

function bindTimelineActions() {
  document.getElementById("btn-add-timeline")?.addEventListener("click", () => {
    const title = document.getElementById("timeline-title")?.value.trim();
    const year = Number(document.getElementById("timeline-year")?.value);
    const desc = document.getElementById("timeline-desc")?.value.trim();
    const result = document.getElementById("timeline-result")?.value || "中立";
    if (!title || !year) {
      alert("请填写经历标题与年份。");
      return;
    }
    incubatorState.timeline.push({ title, year, desc, result });
    document.getElementById("timeline-title").value = "";
    document.getElementById("timeline-year").value = "";
    document.getElementById("timeline-desc").value = "";
    renderTimelineList();
    updateSeedPreview();
  });
}

function bindScenarioActions() {
  document.getElementById("scenario-list")?.addEventListener("click", evt => {
    const option = evt.target.closest(".scenario-option");
    if (!option) return;
    const sid = option.closest(".scenario-card")?.dataset.sid;
    const scenario = incubatorState.scenarios.find(item => item.id === sid);
    if (!scenario) return;
    scenario.answer = option.dataset.opt;
    renderScenarioList();
    updateSeedPreview();
  });

  document.getElementById("scenario-list")?.addEventListener("input", evt => {
    if (!evt.target.classList.contains("scenario-reason")) return;
    const sid = evt.target.dataset.reasonFor;
    const scenario = incubatorState.scenarios.find(item => item.id === sid);
    if (!scenario) return;
    scenario.reason = evt.target.value;
    updateSeedPreview();
  });
}

function renderIncubatorPool() {
  const pool = document.getElementById("incubator-pool");
  if (!pool) return;
  pool.innerHTML = incubatorState.customAgents.map(agent => {
    const archetype = getIncubatorArchetype(agent);
    return `
      <div class="seed-agent ${agent.id === incubatorState.selectedAgentId ? "active" : ""}" data-agent-id="${agent.id}">
        <div class="mini-orb archetype-${archetype.id}" style="--orb-a:${archetype.colorA};--orb-b:${archetype.colorB};">
          <span class="orb-icon">${archetype.icon}</span>
        </div>
        <div class="seed-agent-name">${agent.name}</div>
        <div class="seed-agent-meta">${archetype.label}</div>
      </div>
    `;
  }).join("");
}

function getSelectedCustomAgent() {
  return incubatorState.customAgents.find(item => item.id === incubatorState.selectedAgentId) || null;
}

function syncSelectedAgentEditor() {
  const target = getSelectedCustomAgent();
  if (!target) return;
  document.getElementById("custom-agent-name").value = target.name;
  document.getElementById("offset-rationality").value = String(target.offsets.rationality);
  document.getElementById("offset-risk").value = String(target.offsets.risk);
  document.getElementById("offset-emotion").value = String(target.offsets.emotion);
  document.getElementById("val-offset-rationality").textContent = String(target.offsets.rationality);
  document.getElementById("val-offset-risk").textContent = String(target.offsets.risk);
  document.getElementById("val-offset-emotion").textContent = String(target.offsets.emotion);
  updateAgentPreview(target);
}

function updateAgentPreview(agent) {
  const style = document.getElementById("agent-preview-style");
  const accessory = document.getElementById("agent-preview-accessory");
  if (!style || !accessory) return;

  const archetype = getIncubatorArchetype(agent);
  style.textContent = `${archetype.icon} ${archetype.styleText}`;
  accessory.textContent = archetype.accessoryText;
  window.__latestPreviewOffsets = {
    rationality: Number(agent.offsets.rationality || 0),
    risk: Number(agent.offsets.risk || 0),
    emotion: Number(agent.offsets.emotion || 0)
  };
  window.dispatchEvent(new CustomEvent("agentPreviewUpdate", { detail: window.__latestPreviewOffsets }));
}

function bindAgentCustomizer() {
  document.getElementById("incubator-pool")?.addEventListener("click", evt => {
    const card = evt.target.closest(".seed-agent");
    if (!card) return;
    incubatorState.selectedAgentId = card.dataset.agentId;
    renderIncubatorPool();
    syncSelectedAgentEditor();
    updateSeedPreview();
  });

  document.getElementById("btn-add-agent")?.addEventListener("click", () => {
    if (incubatorState.customAgents.length >= 5) {
      alert("最多只能创建 5 个 Agent。");
      return;
    }
    const count = incubatorState.customAgents.length + 1;
    const newAgent = {
      id: `a-${Date.now()}-${count}`,
      name: `自定义Agent ${count}`,
      offsets: { rationality: 0, risk: 0, emotion: 0 }
    };
    incubatorState.customAgents.push(newAgent);
    incubatorState.selectedAgentId = newAgent.id;
    renderIncubatorPool();
    syncSelectedAgentEditor();
    updateSeedPreview();
  });

  document.getElementById("custom-agent-name")?.addEventListener("input", evt => {
    const agent = getSelectedCustomAgent();
    if (!agent) return;
    agent.name = String(evt.target.value || "新 Agent");
    renderIncubatorPool();
    updateSeedPreview();
  });

  ["rationality", "risk", "emotion"].forEach(key => {
    document.getElementById(`offset-${key}`)?.addEventListener("input", evt => {
      const agent = getSelectedCustomAgent();
      if (!agent) return;
      const value = Number(evt.target.value);
      agent.offsets[key] = value;
      document.getElementById(`val-offset-${key}`).textContent = String(value);
      updateAgentPreview(agent);
      updateSeedPreview();
    });
  });
}

function validateStep(step) {
  if (step === 1) {
    if (!incubatorState.profile.nickname?.trim()) {
      alert("请先填写昵称。");
      return false;
    }
  }
  if (step === 4) {
    const selectedCount = incubatorState.experiences.filter(item => item.selected).length;
    if (!selectedCount) {
      alert("请至少选择 1 个关键经历锚点。");
      return false;
    }
  }
  if (step === 5) {
    const done = incubatorState.scenarios.filter(s => s.answer).length;
    if (!done) {
      alert("请至少完成 1 个情境题。");
      return false;
    }
  }
  if (step === 6) {
    if (!incubatorState.customAgents.length) {
      alert("请先生成至少 3 个 Agent。");
      return false;
    }
  }
  return true;
}

function onNextStep() {
  const current = incubatorState.currentStep;
  if (!validateStep(current)) return;
  if (current === 5 && !incubatorState.customAgents.length) {
    incubatorState.customAgents = buildBaseAgents();
    incubatorState.selectedAgentId = incubatorState.customAgents[0]?.id || null;
    renderIncubatorPool();
    syncSelectedAgentEditor();
  }
  setIncubatorStep(current + 1);
}

function onPrevStep() {
  setIncubatorStep(incubatorState.currentStep - 1);
}

function onSkipStep() {
  if (incubatorState.currentStep >= 6) return;
  if (incubatorState.currentStep === 5 && !incubatorState.customAgents.length) {
    incubatorState.customAgents = buildBaseAgents();
    incubatorState.selectedAgentId = incubatorState.customAgents[0]?.id || null;
    renderIncubatorPool();
    syncSelectedAgentEditor();
  }
  setIncubatorStep(incubatorState.currentStep + 1);
}

function completeIncubation() {
  if (!validateStep(6)) return;
  const user = getCurrentUser();
  if (!user) {
    alert("请先登录。");
    return;
  }

  user.profile = { ...incubatorState.profile };
  user.persona = { ...incubatorState.traits };
  user.values = [...incubatorState.values];
  user.principles = { ...incubatorState.principles };
  user.timeline = [...incubatorState.timeline];
  user.scenarios = incubatorState.scenarios.map(item => ({
    id: item.id,
    answer: item.answer,
    reason: item.reason
  }));
  user.experiences = incubatorState.experiences
    .filter(item => item.selected)
    .map(item => ({ id: item.id, title: item.title, note: item.note }));
  user.customAgents = incubatorState.customAgents.map(item => ({
    id: item.id,
    name: item.name,
    offsets: { ...item.offsets }
  }));
  user.hasAgent = true;
  user.lastSection = "dialog";
  saveCurrentUser(user);
  syncAgentsFromUser(user);

  appendMessage({
    sender: "agent",
    agentName: "系统",
    content: `孵化完成！欢迎 ${user.nickname}，你的 Agent 已就绪：${user.customAgents.map(a => a.name).join("、")}。`,
    theme: "theme-emotion"
  });
  scrollToSection("dialog");
}

function initIncubator() {
  initRadarGrid();
  bindBaseProfileActions();
  bindTraitInputs();
  bindRadarDrag();
  bindValueCompass();
  bindExperienceActions();
  bindTimelineActions();
  bindScenarioActions();
  bindAgentCustomizer();
  document.getElementById("btn-next-step")?.addEventListener("click", onNextStep);
  document.getElementById("btn-prev-step")?.addEventListener("click", onPrevStep);
  document.getElementById("btn-skip-step")?.addEventListener("click", onSkipStep);
  document.getElementById("btn-complete-incubate")?.addEventListener("click", completeIncubation);
  document.querySelectorAll(".step-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const step = Number(chip.dataset.jumpStep || "1");
      if (step <= incubatorState.currentStep + 1) {
        setIncubatorStep(step);
      }
    });
  });
  document.getElementById("btn-random-agent")?.addEventListener("click", () => {
    if (!incubatorState.customAgents.length) return;
    const agent = getSelectedCustomAgent() || incubatorState.customAgents[0];
    if (!agent) return;
    agent.offsets = {
      rationality: Math.floor(Math.random() * 41) - 20,
      risk: Math.floor(Math.random() * 41) - 20,
      emotion: Math.floor(Math.random() * 41) - 20
    };
    syncSelectedAgentEditor();
  });

  syncTraitInputs();
  ensureRadarPoints();
  renderRadar();
  renderValueSortList();
  renderExperienceCards();
  renderExperienceSummary();
  renderTimelineList();
  renderScenarioList();
  if (!incubatorState.customAgents.length) {
    incubatorState.customAgents = buildBaseAgents();
    incubatorState.selectedAgentId = incubatorState.customAgents[0]?.id || null;
  }
  renderIncubatorPool();
  syncSelectedAgentEditor();
  setIncubatorStep(1);
}

function updateClock() {
  const node = document.getElementById("dialog-time");
  if (!node) return;
  node.textContent = new Date().toLocaleTimeString();
}

function getRiskThemeColor(score = 50, alphaScale = 1) {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  const hue = 188 + Math.round((safe / 100) * 88); // cyan -> blue-violet
  const alpha = (0.22 + (safe / 100) * 0.28) * alphaScale;
  return `hsla(${hue}, 84%, 62%, ${Math.max(0.14, Math.min(0.62, alpha)).toFixed(2)})`;
}

function updateInsightPanel() {
  const clusters = document.getElementById("cluster-list");
  const heat = document.getElementById("mini-heatmap");
  const suggestion = document.getElementById("next-suggestion");
  if (!clusters || !heat || !suggestion) return;

  const source = decisionState.analysis;
  if (source) {
    clusters.innerHTML = `
      <div class="cluster-card" draggable="true">共识：${source.consensus[0] || "暂无"}</div>
      <div class="cluster-card" draggable="true">分歧：${source.divergence[0] || "暂无"}</div>
    `;
    const avgScores = source.options.flatMap(option => Object.values(option.risk));
    heat.innerHTML = avgScores.slice(0, 6).map(v => `<div style="background:${getRiskThemeColor(v, 1.06)};"></div>`).join("");
    suggestion.textContent = `建议下一步：优先推进「${source.best?.name || decisionState.options[0]}」，并安排一轮针对分歧点的追问。`;
    return;
  }

  clusters.innerHTML = `
    <div class="cluster-card" draggable="true">共识：先做小范围验证（${agents.length}个Agent提及）</div>
    <div class="cluster-card" draggable="true">分歧：品牌投入时机仍有分歧</div>
  `;
  heat.innerHTML = ["#f2878f", "#f4bc67", "#59d39c", "#7f93ff", "#ff9f6f", "#6dd6b4"].map(
    c => `<div style="background:${c};"></div>`
  ).join("");
  suggestion.textContent = `建议下一步：让 ${agents[0]?.name || "理性Agent"} 与 ${agents[1]?.name || "冒险Agent"} 发起一次辩论。`;
}

function hydrateDecisionSetup() {
  const topicInput = document.getElementById("decision-topic");
  const optionA = document.getElementById("decision-option-a");
  const optionB = document.getElementById("decision-option-b");
  const optionC = document.getElementById("decision-option-c");
  if (!topicInput || !optionA || !optionB || !optionC) return;
  topicInput.value = decisionState.topic;
  optionA.value = decisionState.options[0] || "";
  optionB.value = decisionState.options[1] || "";
  optionC.value = decisionState.options[2] || "";
}

function syncDecisionStateFromInputs() {
  const topicInput = document.getElementById("decision-topic");
  const optionA = document.getElementById("decision-option-a");
  const optionB = document.getElementById("decision-option-b");
  const optionC = document.getElementById("decision-option-c");
  if (!topicInput || !optionA || !optionB || !optionC) return;
  decisionState.topic = String(topicInput.value || "").trim();
  decisionState.options = [optionA.value, optionB.value, optionC.value]
    .map(v => String(v || "").trim())
    .filter(Boolean);
  if (!decisionState.options.length) decisionState.options = ["方案A", "方案B", "方案C"];
}

function extractDecisionSignals(text) {
  const t = String(text || "");
  return {
    caution: (t.match(/验证|试点|稳|现金流|风险|谨慎/g) || []).length,
    aggressive: (t.match(/窗口|立即|抢占|扩大|加码|投入/g) || []).length,
    emotional: (t.match(/情绪|关系|感受|共情|压力/g) || []).length
  };
}

function generateDecisionAnalysis() {
  const userQuestion = [...dialogState.history].reverse().find(item => item.sender === "user")?.content || "";
  const agentReplies = dialogState.history.filter(item => item.sender === "agent").slice(-15);
  const merged = agentReplies.map(item => item.content).join(" ");
  const signals = extractDecisionSignals(merged);
  const options = decisionState.options.map((name, idx) => {
    const base = 48 + idx * 8;
    const finance = Math.max(5, Math.min(95, base + signals.aggressive * 2 - signals.caution * 2));
    const emotion = Math.max(5, Math.min(95, base - signals.emotional * 2 + idx * 3));
    const time = Math.max(5, Math.min(95, base + signals.aggressive * 3 - signals.caution));
    return { name, risk: { 财务: finance, 情感: emotion, 时间: time } };
  });

  const consensus = [];
  const divergence = [];
  if (signals.caution >= signals.aggressive) {
    consensus.push(`优先“小步验证”再扩大投入，与当前对话倾向一致。`);
  }
  if (signals.aggressive > 0) {
    divergence.push("是否要立即放大投入规模，Agent存在明显分歧。");
  }
  if (signals.emotional > 0) {
    divergence.push("是否优先处理关系与情绪风险，观点分化。");
  }
  if (!consensus.length) consensus.push("先明确目标与约束，再进入执行阶段。");
  if (!divergence.length) divergence.push("当前分歧较小，可直接进入执行方案细化。");

  const wf = Number(document.getElementById("w-finance")?.value || 40);
  const we = Number(document.getElementById("w-emotion")?.value || 25);
  const wt = Number(document.getElementById("w-time")?.value || 35);
  const weighted = options.map(item => {
    const score = (item.risk.财务 * wf + item.risk.情感 * we + item.risk.时间 * wt) / Math.max(1, (wf + we + wt));
    return { ...item, weighted: Math.round(score) };
  });
  const best = [...weighted].sort((a, b) => a.weighted - b.weighted)[0];

  return {
    topic: decisionState.topic || userQuestion || "当前决策议题",
    options: weighted,
    consensus,
    divergence,
    best
  };
}

function renderDecisionClusters(analysis) {
  const consensusTitle = document.getElementById("consensus-title");
  const divergenceTitle = document.getElementById("divergence-title");
  const consensusList = document.getElementById("consensus-list");
  const divergenceList = document.getElementById("divergence-list");
  if (!consensusTitle || !divergenceTitle || !consensusList || !divergenceList) return;
  consensusTitle.textContent = `共识点 (${analysis.consensus.length})`;
  divergenceTitle.textContent = `分歧点 (${analysis.divergence.length})`;
  consensusList.innerHTML = analysis.consensus.map(item => `<div class="cluster-item" draggable="true">${item}</div>`).join("");
  divergenceList.innerHTML = analysis.divergence.map(item => `<div class="cluster-item" draggable="true">${item}</div>`).join("");
}

function renderDecisionRiskGrid(analysis) {
  const riskGrid = document.getElementById("risk-matrix-grid");
  const riskDetail = document.getElementById("risk-detail");
  if (!riskGrid) return;
  const options = analysis.options.map(v => v.name);
  const dims = ["财务", "情感", "时间"];
  const rows = [`<div class="risk-cell header">维度/选项</div>${options.map(v => `<div class="risk-cell header">${v}</div>`).join("")}`];
  dims.forEach(dim => {
    rows.push(`<div class="risk-cell header">${dim}</div>`);
    analysis.options.forEach(item => {
      const score = item.risk[dim];
      const color = getRiskThemeColor(score);
      rows.push(`<div class="risk-cell" data-risk="${dim}-${item.name}-${score}" style="background:${color};">${score}</div>`);
    });
  });
  riskGrid.innerHTML = rows.join("");
  riskGrid.querySelectorAll(".risk-cell[data-risk]").forEach(cell => {
    cell.addEventListener("click", () => {
      const [dim, option, score] = cell.dataset.risk.split("-");
      if (riskDetail) riskDetail.textContent = `${option} 在 ${dim} 维度风险评分 ${score}。`;
    });
  });
}

function renderDecisionTree(analysis) {
  const tree = document.getElementById("decision-tree");
  if (!tree) return;
  const [a, b, c] = analysis.options;
  tree.innerHTML = `
    <div class="tree-node"><button data-tree="root">决策起点：${analysis.topic}</button>
      <div class="tree-node"><button data-tree="a">${a?.name || "方案A"}（综合风险 ${a?.weighted ?? "-" }）</button>
        <div class="tree-node">后果：执行门槛中等，适合先验证再扩展。</div>
      </div>
      <div class="tree-node"><button data-tree="b">${b?.name || "方案B"}（综合风险 ${b?.weighted ?? "-" }）</button>
        <div class="tree-node">后果：收益潜力更高，但波动与资源压力更大。</div>
      </div>
      <div class="tree-node"><button data-tree="c">${c?.name || "方案C"}（综合风险 ${c?.weighted ?? "-" }）</button>
        <div class="tree-node">后果：更保守稳健，推进速度较慢。</div>
      </div>
      <div class="tree-node">推荐：${analysis.best?.name || "待定"}（综合风险最低）</div>
    </div>
  `;
  tree.querySelectorAll("button[data-tree]").forEach(btn => {
    btn.addEventListener("click", () => {
      const next = btn.nextElementSibling;
      if (next) next.classList.toggle("hidden");
    });
  });
}

function refreshDecisionAnalysis() {
  syncDecisionStateFromInputs();
  const analysis = generateDecisionAnalysis();
  decisionState.analysis = analysis;
  renderDecisionClusters(analysis);
  renderDecisionRiskGrid(analysis);
  renderDecisionTree(analysis);
  updateInsightPanel();
}

function initDecisionView() {
  if (!decisionState.topic) {
    decisionState.topic = [...dialogState.history].reverse().find(item => item.sender === "user")?.content || "当前决策议题";
  }
  hydrateDecisionSetup();
  refreshDecisionAnalysis();
}

function setInsightPanel(open, pinned = null) {
  const panel = document.getElementById("insight-panel");
  const shell = document.getElementById("dialog");
  if (!panel || !shell) return;
  panel.classList.toggle("collapsed", !open);
  shell.classList.toggle("insight-open", open);
  if (typeof pinned === "boolean") {
    dialogState.panelPinned = pinned;
  }
  dialogState.panelExpanded = open;
}

function seedInitialChat() {
  const chat = document.getElementById("chat-area");
  if (!chat || chat.children.length > 0) return;
  appendMessage({
    sender: "agent",
    agentName: "理性+",
    content: "建议先量化风险，列出 3 种情景。",
    theme: "theme-rational"
  });
  recordDialogMessage({ sender: "agent", agentName: "理性+", content: "建议先量化风险，列出 3 种情景。" });
  appendMessage({
    sender: "agent",
    agentName: "冒险+",
    content: "窗口期有限，建议先占位后优化。",
    theme: "theme-risk"
  });
  recordDialogMessage({ sender: "agent", agentName: "冒险+", content: "窗口期有限，建议先占位后优化。" });
  appendMessage({
    sender: "user",
    content: "可以展开说说市场进入的阻力吗？"
  });
  recordDialogMessage({ sender: "user", content: "可以展开说说市场进入的阻力吗？" });
}

function bindActions() {
  document.getElementById("tab-login")?.addEventListener("click", () => switchTab("login"));
  document.getElementById("tab-register")?.addEventListener("click", () => switchTab("register"));

  document.getElementById("form-login")?.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("login-email")?.value.trim().toLowerCase();
    const password = document.getElementById("login-password")?.value.trim();
    if (!email || !password) {
      updateFeedback("请完整填写邮箱和密码。", "error");
      return;
    }
    loginUser({ email, password });
  });

  document.getElementById("form-register")?.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("register-email")?.value.trim().toLowerCase();
    const password = document.getElementById("register-password")?.value.trim();
    const nickname = document.getElementById("register-nickname")?.value.trim();
    if (!email || !password || !nickname) {
      updateFeedback("请完整填写注册信息。", "error");
      return;
    }
    if (password.length < 6) {
      updateFeedback("密码至少 6 位。", "error");
      return;
    }
    registerUser({ email, password, nickname });
  });

  document.getElementById("btn-google")?.addEventListener("click", googleQuickLogin);
  document.getElementById("btn-back-login")?.addEventListener("click", logoutToAuth);
  document.getElementById("btn-incubate")?.addEventListener("click", () => scrollToSection("incubate"));
  document.getElementById("btn-view-matrix")?.addEventListener("click", () => {
    if (!decisionState.topic) {
      decisionState.topic = [...dialogState.history].reverse().find(item => item.sender === "user")?.content || "当前决策议题";
      hydrateDecisionSetup();
    }
    refreshDecisionAnalysis();
    scrollToSection("matrix");
  });
  document.getElementById("btn-back-dialog")?.addEventListener("click", () => scrollToSection("dialog"));
  document.getElementById("btn-continue-chat")?.addEventListener("click", () => scrollToSection("dialog"));

  document.getElementById("btn-toggle-insight")?.addEventListener("click", () => {
    const shouldOpen = !dialogState.panelExpanded;
    setInsightPanel(shouldOpen, shouldOpen);
  });
  document.getElementById("insight-panel")?.addEventListener("mouseenter", () => {
    if (dialogState.panelPinned) return;
    setInsightPanel(true);
  });
  document.getElementById("insight-panel")?.addEventListener("mouseleave", () => {
    if (dialogState.panelPinned) return;
    setInsightPanel(false);
  });

  document.getElementById("btn-send")?.addEventListener("click", mockSpeak);
  document.getElementById("btn-debate")?.addEventListener("click", mockDebate);
  document.getElementById("btn-upload")?.addEventListener("click", () => alert("上传文件入口（RAG）已预留。"));
  document.getElementById("btn-mention")?.addEventListener("click", evt => {
    evt.stopPropagation();
    toggleMentionPicker();
  });
  document.getElementById("mention-picker-list")?.addEventListener("click", evt => {
    const item = evt.target.closest("[data-mention-agent]");
    if (!item) return;
    insertMentionToInput(item.dataset.mentionAgent || "");
  });
  document.addEventListener("click", evt => {
    if (evt.target.closest("#mention-picker") || evt.target.closest("#btn-mention")) return;
    closeMentionPicker();
  });
  document.getElementById("btn-new-agent")?.addEventListener("click", () => scrollToSection("incubate"));
  document.getElementById("btn-edit-agent")?.addEventListener("click", () => alert("编辑模式：可拖拽排序与调整偏移。"));

  const input = document.getElementById("user-input");
  input?.addEventListener("input", () => autoGrowTextarea(input));
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      mockSpeak();
    }
  });

  document.getElementById("chat-area")?.addEventListener("click", evt => {
    const btn = evt.target.closest("button[data-act]");
    if (!btn) return;
    const action = btn.dataset.act;
    const messageNode = btn.closest(".chat-message");
    if (!messageNode) return;
    if (action === "copy") {
      navigator.clipboard?.writeText(messageNode.textContent || "");
      btn.textContent = "已复制";
      setTimeout(() => { btn.textContent = "📋"; }, 900);
    } else if (action === "quote") {
      const quote = `> ${messageNode.querySelector(".bubble")?.textContent || ""}`;
      const target = document.getElementById("user-input");
      if (target) {
        target.value = `${target.value}\n${quote}`.trim();
        autoGrowTextarea(target);
      }
    } else if (action === "follow") {
      const target = document.getElementById("user-input");
      target?.focus();
      if (target && !target.value) target.value = "继续追问：";
    } else if (action === "up" || action === "down") {
      btn.style.color = action === "up" ? "#58f4c6" : "#ff8da8";
    }
  });

  document.getElementById("btn-generate-report")?.addEventListener("click", () => {
    refreshDecisionAnalysis();
    document.getElementById("report-modal")?.classList.remove("hidden");
  });
  document.getElementById("btn-close-report")?.addEventListener("click", () => {
    document.getElementById("report-modal")?.classList.add("hidden");
  });
  document.getElementById("btn-download-pdf")?.addEventListener("click", () => alert("PDF导出入口已预留。"));
  document.getElementById("btn-share-report")?.addEventListener("click", () => alert("分享链接已生成（示例）。"));
  document.getElementById("btn-copy-report")?.addEventListener("click", () => alert("报告摘要已复制。"));
  document.getElementById("btn-export-tree")?.addEventListener("click", () => alert("树图PNG导出入口已预留。"));
  document.getElementById("btn-auto-layout")?.addEventListener("click", () => refreshDecisionAnalysis());
  document.getElementById("btn-refresh-report")?.addEventListener("click", () => refreshDecisionAnalysis());
  document.getElementById("risk-view-mode")?.addEventListener("change", () => refreshDecisionAnalysis());
  document.getElementById("btn-sync-decision")?.addEventListener("click", () => {
    refreshDecisionAnalysis();
    scrollToSection("matrix");
  });
  ["decision-topic", "decision-option-a", "decision-option-b", "decision-option-c"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => {
      syncDecisionStateFromInputs();
    });
  });
  ["w-finance", "w-emotion", "w-time"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => {
      if (decisionState.analysis) refreshDecisionAnalysis();
    });
  });
}

function bootstrapAuth() {
  const session = getSession();
  if (!session) {
    showAuthScreen("login", "欢迎使用 Persona Switch，请先登录或注册。");
    return;
  }
  const users = loadUsers();
  const user = users[session.email];
  if (!user) {
    localStorage.removeItem(STORAGE_SESSION);
    showAuthScreen("login", "会话已失效，请重新登录。");
    updateFeedback("会话已失效，请重新登录。", "error");
    return;
  }
  routeAfterLogin(user, false);
}

function trackSectionForResume() {
  const watchIds = ["incubate", "dialog", "matrix"];
  const io = new IntersectionObserver(
    entries => {
      const active = entries
        .filter(item => item.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      const user = getCurrentUser();
      if (!user) return;
      user.lastSection = active.target.id;
      saveCurrentUser(user);
    },
    { threshold: [0.35, 0.6, 0.8] }
  );

  watchIds.forEach(id => {
    const node = document.getElementById(id);
    if (node) io.observe(node);
  });
}

renderAgents("agent-list");
initIncubator();
bindActions();
syncDeepSeekStatus();
bootstrapAuth();
trackSectionForResume();
seedInitialChat();
updateInsightPanel();
initDecisionView();
setInsightPanel(false, false);
updateClock();
setInterval(updateClock, 1000);
