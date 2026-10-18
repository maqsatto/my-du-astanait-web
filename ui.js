/* My DU Web Unlock v1.1 — UI layer (isolated world, document_start)
 * 1) Redirect landing (/ and /mobile) to /schedule
 * 2) Persistent left sidebar navbar (desktop) with Search by services
 * 3) Weekly schedule table on /schedule (built from the backend API)
 * 4) learn.astanait: hide online-lesson entries from lists
 */

/* ---------------- 1) Landing redirect ---------------- */
(function () {
  const p = location.pathname;
  if (location.hostname.endsWith("astanait.edu.kz") && (p === "/" || p === "/mobile")) {
    location.replace("/schedule");
    return;
  }
})();

/* ---------------- Sidebar + weekly table ---------------- */
const SIDEBAR_ITEMS = [
  { label: "Dormitory",            path: "/dormitory" },
  { label: "Academic calendar",    path: "/academic-calendar" },
  { label: "Class schedule",       path: "/schedule" },
  { label: "Documents for review", path: "/confirm-documents" },
  { label: "Applications",         path: "/student-applications" },
  { label: "Individual Study Plan", path: "/iup" },
  { label: "Peer Advisor",         path: null, note: "app only" },
  { label: "AI-Survey",            path: null, note: "app only" },
];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CSS = `
@media (max-width: 1023px) { #myduSidebar { display: none !important; } }
#myduSidebar {
  position: fixed; left: 0; top: 0; bottom: 0; width: 236px; z-index: 9500;
  background: rgba(18,20,24,.98); color: #e8eaee;
  display: flex; flex-direction: column; gap: 4px; padding: 14px 10px 12px;
  border-right: 1px solid rgba(255,255,255,.08);
  font-family: Roboto, Inter, system-ui, sans-serif;
}
#myduSidebar .mydu-brand { font-size: 15px; font-weight: 700; letter-spacing:.2px; padding: 2px 10px 10px; opacity:.95 }
#myduSidebar .mydu-search {
  width: 100%; box-sizing: border-box; background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.09); color: inherit; border-radius: 10px;
  padding: 8px 10px; font-size: 13px; outline: none; margin: 0 0 8px;
}
#myduSidebar .mydu-search::placeholder { color: rgba(232,234,238,.45) }
#myduSidebar a.mydu-item, #myduSidebar div.mydu-item {
  display: flex; align-items: center; gap: 10px;
  color: #cdd2da; text-decoration: none; font-size: 13.5px;
  padding: 9px 10px; border-radius: 10px; cursor: pointer; line-height: 1.2;
}
#myduSidebar a.mydu-item:hover, #myduSidebar div.mydu-item:hover { background: rgba(255,255,255,.07); color:#fff }
#myduSidebar a.mydu-item.active { background: rgba(80,120,255,.22); color: #fff; }
#myduSidebar .mydu-disabled { opacity: .38; cursor: default; }
#myduSidebar .mydu-footer { margin-top: auto; padding: 8px 10px; font-size: 11px; color: rgba(232,234,238,.35) }
#myduSidebar .mydu-badge { margin-left: auto; font-size: 10px; padding: 2px 6px; border-radius: 6px; background: rgba(255,255,255,.09); color: rgba(232,234,238,.6) }

@media (min-width: 1024px) {
  html.mydu-on > body > #app > [class*="AppShell-root"] { padding-left: 236px !important; }
  html.mydu-on [class*="bottomBar"], html.mydu-on .mydu-bottombar { display: none !important; }
}
.mydu-native-hidden { display: none !important; }

/* ---- weekly table ---- */
#myduWeekTableWrap { padding: 18px 16px 40px; font-family: Roboto, Inter, system-ui, sans-serif; }
#myduWeekTableWrap h3 { margin: 0 0 10px; font-size: 16px; display:flex; align-items:center; gap:12px }
#myduWeekTableWrap h3 .mydu-hide-native { font-size: 12px; font-weight: 500; color: inherit; opacity:.75; display:flex; gap:6px; align-items:center; cursor:pointer }
#myduWeekTable { width: 100%; border-collapse: collapse; background: transparent; }
#myduWeekTable th, #myduWeekTable td {
  border: 1px solid var(--mantine-color-dark-4, rgba(125,125,125,.25));
  padding: 6px 8px; vertical-align: top; font-size: 12.5px;
  min-width: 150px;
}
#myduWeekTable thead th { text-align: center; font-weight: 700; position: sticky; top: 0; }
#myduWeekTable tbody th {
  text-align: left; font-weight: 700; white-space: nowrap; min-width: 86px;
  font-size: 12px;
}
#myduWeekTable td.mydu-today { background: rgba(90,120,255,.10) }
#myduWeekTable thead th.mydu-today { background: rgba(90,120,255,.18) }
#myduWeekTable .mydu-subject { font-weight: 700; }
#myduWeekTable .mydu-meta { color: var(--mantine-color-dimmed, #888); font-size: 11.5px; }
#myduWeekTable .mydu-online { display:inline-block; font-size: 10px; padding: 1px 5px; border-radius: 6px; background: rgba(0,170,120,.15); color: #0aa573; margin-left: 4px }
#myduWeekTable a.mydu-online-link { color: inherit; text-decoration: underline dotted }
`;

/* ---------------- Router/SPA aware mounting ---------------- */
const HOST_MYDU = location.hostname === "my-du.astanait.edu.kz";
const HOST_LEARN = location.hostname === "learn.astanait.edu.kz";

function injectSidebar() {
  if (!HOST_MYDU) return;
  document.documentElement.classList.add("mydu-on");
  if (document.getElementById("myduSidebar")) return;
  const sb = document.createElement("div");
  sb.id = "myduSidebar";
  sb.innerHTML = `
    <div class="mydu-brand">➕ My DU</div>
    <input class="mydu-search" type="text" placeholder="Search by services" autocomplete="off" />
    ${SIDEBAR_ITEMS.map(it => it.path
      ? `<a class="mydu-item" href="${it.path}" data-path="${it.path}"><span>${it.label}</span></a>`
      : `<div class="mydu-item mydu-disabled" title="Only in the mobile app"><span>${it.label}</span><span class="mydu-badge">app</span></div>`
    ).join("")}
    <div class="mydu-footer">my-du-astanait-web/1.1</div>`;
  document.documentElement.appendChild(sb);

  const input = sb.querySelector(".mydu-search");
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    for (const el of sb.querySelectorAll(".mydu-item")) {
      el.style.display = !q || (el.textContent.toLowerCase().includes(q)) ? "" : "none";
    }
  });
  highlightActive(sb);
}

function highlightActive(sb) {
  const cur = location.pathname;
  for (const a of sb.querySelectorAll("a.mydu-item")) {
    const p = a.getAttribute("data-path");
    a.classList.toggle("active", cur === p || cur.startsWith(p + "/") || (p === "/iup" && cur.startsWith("/iup")));
  }
}

/* ---------------- Weekly schedule table ---------------- */
async function buildWeekTable() {
  if (!HOST_MYDU || !location.pathname.startsWith("/schedule")) return;
  let wrap = document.getElementById("myduWeekTableWrap");

  try {
    const cur = await fetch(`/api/edu-process/classSchedule/studentCurrentWeek?lang=en&studyYear=2026&term=1`, { credentials: "include" });
    let weekNum = 0;
    if (cur.ok) {
      const txt = await cur.text();
      try { weekNum = JSON.parse(txt).CurrentWeek || 0; } catch (e) {
        weekNum = parseInt(String(txt).replace(/\D/g, ""), 10) || 0;
      }
    }

    const res = await fetch("/api/edu-process/classSchedule/student/me/search?lang=en", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: [
          { id: "studyYear", value: "2026" },
          { id: "term", value: "1" },
          { id: "weekNumber", value: String(weekNum) },
        ],
        start: 0, size: 100,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();

    // собрать сетку: общий список таймслотов и пары для каждого дня
    const timesMap = new Map(); // title -> {order, shift}
    const days = {};
    for (const slot of data.slots || []) {
      const d = slot.weekDay;
      const key = d.name;
      days[d.id] = days[d.id] || { name: d.name, rows: [] };
      for (const it of slot.items || []) {
        const t = it.classTime || {};
        timesMap.set(t.title, { shift: t.shiftNumber || 0, order: t.orderNumber || 0 });
        if (it.subjectName || it.online) days[d.id].rows.push({ ...it, ct: t.title });
      }
    }
    const times = [...timesMap.entries()]
      .map(([title, o]) => ({ title, ...o }))
      .sort((a, b) => a.shift - b.shift || a.order - b.order);

    const todayName = DAY_NAMES[(new Date().getDay() + 6) % 7];

    let html = `<table id="myduWeekTable"><thead><tr><th style="text-align:left">Time</th>`;
    html += DAY_NAMES.map(d => `<th class="${d === todayName ? "mydu-today" : ""}">${d.slice(0,3)}${d === todayName ? " •" : ""}</th>`).join("");
    html += `</tr></thead><tbody>`;
    for (const t of times) {
      html += `<tr><th>${t.title}</th>`;
      for (const dname of DAY_NAMES) {
        const day = days[DAY_NAMES.indexOf(dname) + 1];
        const cell = day && day.rows && day.rows.filter(r => r.ct === t.title) || [];
        let cellHtml = "";
        for (const row of cell) {
          cellHtml += `<div class="mydu-subject">${row.subjectName || ""}${row.online ? '<span class="mydu-online">online</span>' : ""}</div>` +
            `<div class="mydu-meta">${[row.lessonType, [row.classroom, row.building].filter(Boolean).join(" · "), row.teacherName].filter(Boolean).join(" · ")}</div>` +
            (row.online && row.link ? `<a class="mydu-online-link" target="_blank" href="${row.link}">${row.platform || "link"}</a>` : "");
        }
        html += `<td class="${cell.length && dname === todayName ? "mydu-today" : ""}">${cellHtml}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table>`;

    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "myduWeekTableWrap";
      wrap.innerHTML = `<h3>Week ${data.weekNumber || weekNum} <label class="mydu-hide-native"><input type="checkbox" checked style="accent-color:#5a78ff" id="myduHideNative"> hide day cards</label></h3>` +
        html + `<div class="mydu-meta" style="margin-top:8px;font-size:11px;color:var(--mantine-color-dimmed,#888)">built by extension</div>`;
      // встраиваем вместо нативных секций дня (после монтирования React)
      const place = async () => {
        for (let i = 0; i < 20; i++) {
          const root = document.querySelector("#app main .flex.flex-col.min-h-svh") || document.querySelector("#app main");
          if (root && wrap.parentElement !== root) { root.appendChild(wrap); break; }
          await new Promise(r => setTimeout(r, 150));
        }
      };
      place().then(() => hideNativeScheduleCards(true));
      const chk = wrap.querySelector("#myduHideNative");
      chk.addEventListener("change", () => hideNativeScheduleCards(chk.checked));
    } else {
      const t = wrap.querySelector("#myduWeekTable");
      if (t) t.outerHTML = html;
      wrap.querySelector("h3").childNodes[0].textContent = `Week ${data.weekNumber || weekNum} `;
    }

    function hideNativeScheduleCards(hide) {
      const root = document.querySelector("#app main .flex.flex-col.min-h-svh") || document.querySelector("#app main");
      if (!root) return;
      const secs = [...root.children].filter(el => el.id !== "myduWeekTableWrap");
      for (const el of secs) el.classList.toggle("mydu-native-hidden", hide);
    }
  } catch (e) { /* jsx failed */ }
}

/* ---------------- learn.astanait: hide online lessons ---------------- */
function cleanLearn() {
  if (!HOST_LEARN) return;
  const words = ["онлайн урок", "онлайн-урок", "online lesson", "онлайн сабақ"];
  for (const li of document.querySelectorAll("li, td, tr, .activity, .section")) {
    const t = (li.innerText || "").toLowerCase();
    if (words.some(w => t.includes(w))) {
      const tgt = li.closest("li, .activity");
      if (tgt) tgt.style.display = "none";
    }
  }
}

/* mount loop: SPA routes change by document URL, sidebar re-highlight + injections */
let lastPath = null;
setInterval(() => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    injectSidebar();
    if (HOST_MYDU) {
      // rebuild table only once per route
      setTimeout(buildWeekTable, 50);
    }
    highlightActive(document.getElementById("myduSidebar"));
  } else if (HOST_LEARN) {
    cleanLearn();
  }
}, 800);

/* style tags once */
(function () {
  const st = document.createElement("style");
  st.textContent = CSS;
  document.documentElement.appendChild(st);
})();

injectSidebar();
buildWeekTable();
cleanLearn();
