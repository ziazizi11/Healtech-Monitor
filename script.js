const history = [];
const maxPoints = 50;

let simBpm = 75;
let simSpo2 = 98;
const $ = (id) => document.getElementById(id);

function setBar(id, percent) {
  const el = $(id);
  if (el) el.style.width = Math.max(0, Math.min(100, percent)) + "%";
}

function updateMetricNotes(data) {
  // Evaluasi BPM
  let bpmText = "Menunggu data...";
  let bpmColor = "var(--muted)";
  if (data.bpm) {
    if (data.bpm < 60) { bpmText = "Rendah"; bpmColor = "#d97706"; } // Oranye
    else if (data.bpm > 100) { bpmText = "Tinggi"; bpmColor = "#dc4c64"; } // Merah
    else { bpmText = "Normal"; bpmColor = "#16a36a"; } // Hijau
    bpmText += " (Standar: 60-100 BPM)";
  }
  $("bpmNote").textContent = bpmText;
  $("bpmNote").style.color = bpmColor;
  $("bpmNote").style.fontWeight = "600";

  // Evaluasi SpO2
  let spo2Text = "Menunggu data...";
  let spo2Color = "var(--muted)";
  if (data.spo2) {
    if (data.spo2 < 95) { spo2Text = "Rendah"; spo2Color = "#dc4c64"; }
    else { spo2Text = "Normal"; spo2Color = "#16a36a"; }
    spo2Text += " (Standar: ≥95% SpO₂)";
  }
  $("spo2Note").textContent = spo2Text;
  $("spo2Note").style.color = spo2Color;
  $("spo2Note").style.fontWeight = "600";

  setBar("bpmBar", Number(data.bpm) / 120 * 100);
  setBar("spo2Bar", Number(data.spo2));
}

function drawChart() {
  const canvas = $("historyChart");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 12, right: 28, bottom: 18, left: 28 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);
  ctx.font = "11px system-ui, sans-serif";
  ctx.lineWidth = 1;

  for (let i = 0; i < 4; i++) {
    const y = pad.top + (plotH / 3) * i;
    
    // Draw grid line
    ctx.strokeStyle = "#edf0f5";
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();

    // Draw Y-axis labels
    ctx.textBaseline = "middle";
    
    // BPM Label (Left, Red)
    ctx.fillStyle = "#dc4c64";
    ctx.textAlign = "right";
    const bpmVal = Math.round(50 + 60 * (1 - i / 3));
    ctx.fillText(bpmVal, pad.left - 6, y);

    // SpO2 Label (Right, Blue)
    ctx.fillStyle = "#3478d4";
    ctx.textAlign = "left";
    const spo2Val = Math.round(90 + 10 * (1 - i / 3));
    ctx.fillText(spo2Val, w - pad.right + 6, y);
  }
  if (history.length < 2) {
    ctx.fillStyle = "#8792a5";
    ctx.textAlign = "center";
    ctx.fillText("Grafik akan muncul setelah data diterima", w / 2, h / 2);
    return;
  }

  const series = [
    { key: "bpm", color: "#dc4c64", min: 50, max: 110 },
    { key: "spo2", color: "#3478d4", min: 90, max: 100 }
  ];
  series.forEach((s) => {
    ctx.beginPath();
    history.forEach((point, i) => {
      const x = pad.left + (i / (maxPoints - 1)) * plotW;
      const normalized = Math.max(0, Math.min(1, (point[s.key] - s.min) / (s.max - s.min)));
      const y = pad.top + plotH - normalized * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  });
}

async function updateDashboard() {
  const status = $("connectionStatus");

  // Pergerakan data yang halus (Random Walk)
  simBpm += (Math.random() - 0.5) * 4;
  simBpm = Math.max(65, Math.min(95, simBpm));
  
  simSpo2 += (Math.random() - 0.5) * 0.5;
  simSpo2 = Math.max(95, Math.min(100, simSpo2));

  const data = {
    bpm: Math.round(simBpm),
    spo2: Math.round(simSpo2)
  };

  $("bpm").textContent = data.bpm;
  $("spo2").textContent = data.spo2;

  updateMetricNotes(data);

  history.push({
    bpm: Number(data.bpm),
    spo2: Number(data.spo2)
  });

  if (history.length > maxPoints) {
    history.shift();
  }

  drawChart();

  const now = new Date();
  const time = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  $("lastUpdated").textContent = "Terakhir: " + time;
  $("footerTime").textContent = time;
  $("connectionText").textContent = "Simulasi aktif";

  status.classList.add("online");
  status.classList.remove("offline");

  $("dataState").textContent =
    "Dashboard menggunakan data simulasi lokal.";

  $("dataBadge").textContent = "SIMULASI";
  $("dataBadge").style.color = "#16815a";
}

window.addEventListener("resize", drawChart);
drawChart();
updateDashboard();
setInterval(updateDashboard, 100);
