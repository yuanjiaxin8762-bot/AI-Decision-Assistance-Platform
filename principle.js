const revealNodes = [...document.querySelectorAll(".reveal")];

function playChapterSequence(node) {
  if (!node || node.dataset.played === "1") return;
  node.dataset.played = "1";
  node.classList.add("in-view");

  if (!node.classList.contains("chapter")) return;
  setTimeout(() => node.classList.add("phase-1"), 60);
  setTimeout(() => node.classList.add("phase-2"), 420);
  setTimeout(() => node.classList.add("phase-3"), 860);
  setTimeout(() => node.classList.add("phase-confirm"), 1220);
  setTimeout(() => {
    node.classList.remove("phase-confirm");
    node.classList.add("phase-done");
  }, 2260);
}

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playChapterSequence(entry.target);
      }
    });
  },
  { threshold: 0.22 }
);
revealNodes.forEach(node => observer.observe(node));

const stepInfo = {
  1: "基础信息：建立人口学与语言风格基线。",
  2: "人格罗盘：量化五维人格，构建决策原点。",
  3: "价值观排序：提取深层价值与原则偏好。",
  4: "关键经历：沉淀决策记忆锚点，用于语义检索。",
  5: "情境测试：补充即时决策反应，微调偏移。",
  6: "Agent定制：生成并调整3-5个专属思维伙伴。"
};

const dialog = document.getElementById("step-dialog");
const dialogTitle = document.getElementById("step-dialog-title");
const dialogContent = document.getElementById("step-dialog-content");

document.querySelectorAll(".step-tag").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = Number(btn.dataset.step || "1");
    dialogTitle.textContent = `步骤 ${id} 说明`;
    dialogContent.textContent = stepInfo[id] || "暂无说明。";
    dialog.showModal();
  });
});
document.getElementById("btn-close-step")?.addEventListener("click", () => dialog.close());

document.getElementById("btn-start-incubate")?.addEventListener("click", () => {
  window.location.href = "./index.html#incubate";
});

document.getElementById("btn-share")?.addEventListener("click", async () => {
  const title = "Persona Switch 原理·故事";
  const text = "三分钟读懂 Persona Switch 的同源异相、多Agent协作与六步孵化机制。";
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (_err) {
      // ignore
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    alert("链接已复制，可直接分享。");
  } catch (_err) {
    alert("当前浏览器不支持自动分享，请手动复制地址栏链接。");
  }
});

function mountParticles() {
  const canvas = document.getElementById("bg-particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const points = [];
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  const count = 90;
  for (let i = 0; i < count; i += 1) {
    points.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.24 + 0.08),
      a: Math.random() * 0.6 + 0.2
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(p => {
      p.y += p.vy;
      if (p.y < -8) {
        p.y = canvas.height + 8;
        p.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(126, 139, 255, ${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
  window.addEventListener("resize", resize);
}

mountParticles();

// 首屏立即触发一次，以免用户不滚动时看不到叙事动效
const firstVisible = revealNodes.find(node => {
  const r = node.getBoundingClientRect();
  return r.top < window.innerHeight * 0.78;
});
if (firstVisible) playChapterSequence(firstVisible);
