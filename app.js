(() => {
  const storageKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const original = () => ({
    version: 1,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    onlyOpen: true,
    // Prototype state. `proto` switches between the original desk and the
    // changed check-in flow; both read and write the same loan records.
    proto: true,
    checkin: "",
    find: "",
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  // Who physically has the unit now. `who` stays the person who signed it out.
  const holder = (l) => l.holder || l.who;
  const dueOptions = ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"];
  const dueRank = { "Fri 8 pm": 1, "Sat 9 am": 2, "Sat 10 am": 3, "Sat noon": 4 };
  const nowRank = [0.5, 0.9, 2]; // Fri 3:45 pm, Fri 7:30 pm, Sat 9:00 am
  const timing = (l) => {
    const d = dueRank[l.due] - nowRank[s.phase];
    return d < 0 ? "Overdue" : d === 0 ? "Due now" : "";
  };
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, good = false) =>
    '<span class="tag' + (good ? " good" : "") + '">' + esc(t) + "</span>";
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        r.id +
        " · Approved</small><h3>" +
        r.event +
        "</h3><p>" +
        r.club +
        " · Filed by " +
        r.owner +
        "</p><p><b>Return by</b> " +
        r.due +
        "</p><p><b>Approved equipment</b></p><ul>" +
        r.items
          .map((x) => "<li>" + x + (s.proto ? kitLine(r.id, x) : "") + "</li>")
          .join("") +
        "</ul><p>" +
        r.note +
        "</p>" +
        (s.proto && s.loans.some((l) => l.req === r.id && !l.back)
          ? '<div class="buttons">' +
            btn("Check in this kit", "checkin", r.id, "primary") +
            "</div>"
          : "") +
        "</div>";
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club,
            btn("View form", "request", r.id),
          ),
        )
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const status = a.repair
        ? "In repair"
        : out(a.id)
          ? "On loan"
          : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · " + a.bin,
        badge(status, status === "On shelf"),
      );
    }
    return html;
  }
  // One line per approved item on the request form: where that item is now.
  function kitLine(reqId, type) {
    const l = s.loans
      .filter((x) => x.req === reqId && getAsset(x.asset).type === type)
      .pop();
    if (!l) return " " + badge("Not issued");
    if (l.back) return " " + badge(l.asset + " returned · L-" + l.num, true);
    return (
      " " +
      badge(
        l.asset +
          " with " +
          holder(l) +
          " · expected " +
          l.due +
          " · L-" +
          l.num,
      ) +
      (timing(l) ? " " + flag(timing(l)) : "")
    );
  }
  const flag = (t) => '<span class="tag late">' + esc(t) + "</span>";
  function slipRow(l) {
    const a = getAsset(l.asset);
    const custody =
      holder(l) === l.who
        ? "With " + l.who
        : "With " + holder(l) + " · collected by " + l.who;
    const log = (l.log || [])
      .map(
        (e) =>
          '<small class="log">' +
          esc(shifts[e.phase].time + " · " + e.text) +
          "</small>",
      )
      .join("");
    return (
      '<div class="row"><div><strong>' +
      esc("L-" + l.num + " · " + l.asset + " · " + a.type) +
      "</strong><small>" +
      esc(
        l.back
          ? "Returned · was with " + holder(l)
          : custody + " · Expected " + l.due,
      ) +
      "</small>" +
      log +
      "</div><div>" +
      (l.back ? badge("Returned", true) : timing(l) ? flag(timing(l)) : "") +
      "</div></div>"
    );
  }
  function checkinForm(r) {
    const open = s.loans.filter((l) => l.req === r.id && !l.back);
    let html =
      '<form data-checkin="' +
      esc(r.id) +
      '"><div class="record"><small>' +
      esc(r.id + " · " + r.club) +
      "</small><h3>Check in · " +
      esc(r.event) +
      "</h3><p>Read the label on each unit at the counter. Anything not back stays on its slip with who has it now and when it’s expected.</p></div>" +
      '<div class="form"><label><span>Brought back by</span><select name="by" required><option value="">Select…</option>' +
      opts(people.map((p) => [p, p])) +
      "</select></label></div>";
    for (const l of open) {
      const type = getAsset(l.asset).type;
      const same = assets.filter((a) => a.type === type);
      html +=
        '<fieldset class="unit" data-slip="' +
        l.num +
        '"><legend>' +
        esc("L-" + l.num + " · " + type) +
        " <small>" +
        esc("signed out to " + l.who + " · now with " + holder(l)) +
        '</small></legend><div class="form"><label><span>Label on the unit at the counter</span><select name="unit-' +
        l.num +
        '" data-unit required><option value="">Select…</option>' +
        opts(same.map((a) => [a.id, a.id + " · " + a.model])) +
        '<option value="out">Not back yet</option></select></label>' +
        '<div class="stillout" hidden><label><span>Who has it now</span><select name="holder-' +
        l.num +
        '"><option value="">Select…</option>' +
        opts(people.map((p) => [p, p])) +
        '</select></label><label><span>Expected back</span><select name="due-' +
        l.num +
        '"><option value="">Select…</option>' +
        opts(dueOptions.map((d) => [d, d])) +
        "</select></label></div></div></fieldset>";
    }
    return (
      html +
      '<p class="formerror" role="alert" data-formerror></p><div class="buttons"><button type="submit" class="primary">Save check-in</button>' +
      btn("Cancel", "cancelcheckin") +
      "</div></form>"
    );
  }
  function registerProto() {
    if (s.checkin) {
      const r = getReq(s.checkin);
      return (
        head("Loan register", "Check in a kit · one decision per unit") +
        checkinForm(r)
      );
    }
    let html = head(
      "Loan register",
      "Grouped by request · who has each unit now",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) return registerOriginal();
    html +=
      '<div class="buttons"><label class="find"><span class="sr">Find</span><input type="search" data-find placeholder="Find a person, unit or request" value="' +
      esc(s.find) +
      '" /></label>' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const needle = s.find.trim().toLowerCase();
    const matches = (l) => {
      if (!needle) return true;
      const r = getReq(l.req);
      return [
        "L-" + l.num,
        l.asset,
        getAsset(l.asset).type,
        l.who,
        holder(l),
        l.req,
        r.club,
        r.event,
      ].some((x) => x.toLowerCase().includes(needle));
    };
    const shown = s.loans.filter((l) => (!s.onlyOpen || !l.back) && matches(l));
    if (!shown.length)
      html += "<p>" + (needle ? "No slips match." : "No outstanding slips.") + "</p>";
    const reqIds = [...new Set(shown.map((l) => l.req))].sort();
    for (const id of reqIds) {
      const r = getReq(id);
      const anyOpen = s.loans.some((l) => l.req === id && !l.back);
      html +=
        '<div class="group"><div class="grouphead"><div><strong>' +
        esc(r.id + " · " + r.club) +
        "</strong><small>" +
        esc(r.event) +
        "</small></div>" +
        (anyOpen ? btn("Check in", "checkin", id, "primary") : "") +
        "</div>" +
        shown
          .filter((l) => l.req === id)
          .map(slipRow)
          .join("") +
        "</div>";
    }
    return html;
  }
  function register() {
    return s.proto ? registerProto() : registerOriginal();
  }
  function registerOriginal() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      const select = (label, key, options) =>
        "<label><span>" +
        label +
        '</span><select name="' +
        key +
        '" required><option value="">Select…</option>' +
        opts(options) +
        "</select></label>";
      return (
        html +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club]),
        ) +
        select(
          "Unit leaving the desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown)
      html += row(
        "L-" + l.num + " · " + l.asset,
        l.req + " · " + l.who + " · Due " + l.due,
        l.back
          ? badge("Returned")
          : btn("Record return", "return", String(l.num)),
      );
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([
        shifts[n.phase].time,
        n.author || "Counter handover",
        n.text,
      ]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-mode]").innerHTML =
      '<span>Desk version</span>' +
      [
        ["0", "Original"],
        ["1", "With my change"],
      ]
        .map(
          ([v, t]) =>
            '<button type="button" data-action="mode" data-val="' +
            v +
            '" aria-pressed="' +
            (s.proto === (v === "1")) +
            '">' +
            t +
            "</button>",
        )
        .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart": {
        const proto = s.proto;
        s = original();
        s.proto = proto;
        break;
      }
      case "mode":
        s.proto = v === "1";
        s.checkin = "";
        s.editing = false;
        s.notice = s.proto
          ? "Showing the desk with my change. Same records."
          : "Showing the original desk. Same records.";
        break;
      case "checkin":
        s.tab = "Loan register";
        s.selected = "";
        s.editing = false;
        s.checkin = v;
        break;
      case "cancelcheckin":
        s.checkin = "";
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.checkin = "";
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        l.back = true;
        s.notice = l.asset + " returned to stock. Slip L-" + l.num + " closed.";
        break;
      }
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
    if (e.target.matches("[data-unit]")) {
      const box = e.target.closest("fieldset").querySelector(".stillout");
      box.hidden = e.target.value !== "out";
      box
        .querySelectorAll("select")
        .forEach((x) => (x.required = e.target.value === "out"));
    }
  });
  root.addEventListener("input", (e) => {
    if (!e.target.matches("[data-find]")) return;
    s.find = e.target.value;
    commit();
    const el = q("[data-find]");
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  });
  function saveCheckin(f, form) {
    const r = getReq(f.dataset.checkin);
    const fail = (msg) => {
      f.querySelector("[data-formerror]").textContent = msg;
      q("[data-status]").textContent = msg;
    };
    const by = form.get("by");
    if (!people.includes(by)) return fail("Choose who brought the kit back.");
    const open = s.loans.filter((l) => l.req === r.id && !l.back);
    const plan = [];
    // Validate every unit before changing anything, so a wrong label never
    // leaves the kit half checked in.
    for (const l of open) {
      const got = form.get("unit-" + l.num);
      const type = getAsset(l.asset).type;
      if (got === "out") {
        const who = form.get("holder-" + l.num),
          due = form.get("due-" + l.num);
        if (!people.includes(who) || !dueRank[due])
          return fail(
            "L-" + l.num + ": say who has the " + type + " now and when it’s expected.",
          );
        plan.push({ l, back: false, who, due });
      } else if (got === l.asset) plan.push({ l, back: true });
      else if (getAsset(got)) {
        const other = out(got);
        return fail(
          other
            ? got +
                " is on a different loan (L-" +
                other.num +
                ", " +
                other.req +
                "). L-" +
                l.num +
                " is for " +
                l.asset +
                ". Check the label again."
            : got +
                " isn’t out on any slip. L-" +
                l.num +
                " is for " +
                l.asset +
                ". Check the label again. If it really reads " +
                got +
                ", keep L-" +
                l.num +
                " open and look for " +
                l.asset +
                ".",
        );
      } else return fail("L-" + l.num + ": choose what’s at the counter.");
    }
    const returned = [],
      still = [];
    for (const p of plan) {
      p.l.log = p.l.log || [];
      if (p.back) {
        p.l.back = true;
        p.l.log.push({ phase: s.phase, text: "Returned by " + by + ", label checked" });
        returned.push(p.l.asset);
      } else {
        const was = holder(p.l) + ", due " + p.l.due;
        if (holder(p.l) !== p.who || p.l.due !== p.due)
          p.l.log.push({
            phase: s.phase,
            text:
              "Not back with the kit. Now with " +
              p.who +
              ", expected " +
              p.due +
              " (was " +
              was +
              ")",
          });
        if (p.who === p.l.who) delete p.l.holder;
        else p.l.holder = p.who;
        p.l.due = p.due;
        still.push(
          p.l.asset +
            " " +
            getAsset(p.l.asset).type +
            " with " +
            p.who +
            ", expected " +
            p.due +
            " (slip L-" +
            p.l.num +
            ")",
        );
      }
    }
    const summary =
      r.id +
      " check-in: " +
      by +
      " returned " +
      (returned.join(", ") || "nothing") +
      ". " +
      (still.length ? "Still out: " + still.join("; ") + "." : "Kit complete.");
    s.notes.push({ phase: s.phase, text: summary, author: "Loan register · " + r.id });
    s.checkin = "";
    s.find = "";
    commit(summary);
  }
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-checkin]")) return saveCheckin(f, form);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, due, back: false });
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 1 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l && getReq(l.req) && getAsset(l.asset) && Number.isInteger(l.num),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      proto: d.proto !== false,
      checkin: getReq(d.checkin) ? d.checkin : "",
      find: typeof d.find === "string" ? d.find : "",
      loans: d.loans.map((l) => ({
        ...l,
        holder: people.includes(l.holder) ? l.holder : undefined,
        log: Array.isArray(l.log)
          ? l.log.filter((e) => e && shifts[e.phase] && typeof e.text === "string")
          : [],
      })),
      notes: d.notes.map((n) => ({
        ...n,
        author: typeof n.author === "string" ? n.author : undefined,
      })),
    };
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
