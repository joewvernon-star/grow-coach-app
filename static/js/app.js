/* ── GROW COACH — CLIENT APPLICATION ─────────────────────────── */

const STEP_LABELS = [
  'Welcome', 'Cost trend', 'Pain area', 'Operation size',
  'Coaching culture', 'Driver check', 'Your focus', 'Actions this week', 'Wrap-up'
];

const COLOR = {
  teal:   { border: '#0F6E56', bg: '#E1F5EE', text: '#085041', accent: '#0F6E56' },
  amber:  { border: '#BA7517', bg: '#FAEEDA', text: '#633806', accent: '#BA7517' },
  purple: { border: '#534AB7', bg: '#EEEDFE', text: '#3C3489', accent: '#534AB7' }
};

// ── API LAYER ──────────────────────────────────────────────────────────
const API = {
  async get(path) {
    const r = await fetch(path);
    return r.json();
  },
  async post(path, body = {}) {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return r.json();
  }
};

// ── UI UTILITIES ───────────────────────────────────────────────────────
const UI = {
  chatBody() { return document.getElementById('chat-body'); },

  addBubble(html, isUser = false) {
    const cb = this.chatBody();
    const row = document.createElement('div');
    row.className = 'bubble-row';
    if (!isUser) {
      row.innerHTML = `<div class="coach-av"><i class="ti ti-plant-2"></i></div><div class="bubble">${html}</div>`;
    } else {
      row.innerHTML = `<div style="flex:1"></div><div class="bubble user-b">${html}</div>`;
    }
    cb.appendChild(row);
    cb.scrollTop = cb.scrollHeight;
    return row;
  },

  addTyping() {
    const cb = this.chatBody();
    const row = document.createElement('div');
    row.id = 'typing-row';
    row.className = 'bubble-row';
    row.innerHTML = `<div class="coach-av"><i class="ti ti-plant-2"></i></div>
      <div class="bubble">
        <div class="typing">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>`;
    cb.appendChild(row);
    cb.scrollTop = cb.scrollHeight;
  },

  removeTyping() {
    document.getElementById('typing-row')?.remove();
  },

  coachSay(html, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.addTyping();
        setTimeout(() => {
          this.removeTyping();
          this.addBubble(html);
          resolve();
        }, 650);
      }, delay);
    });
  },

  addChips(opts, callback) {
    const cb = this.chatBody();
    const id = 'chips-' + Date.now();
    const div = document.createElement('div');
    div.className = 'chips';
    div.id = id;

    opts.forEach(o => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = o.label;
      btn.onclick = () => {
        const parent = document.getElementById(id);
        if (!parent) return;
        parent.querySelectorAll('.chip').forEach(x => { x.disabled = true; });
        btn.className = 'chip selected';
        UI.addBubble(o.label, true);
        setTimeout(() => {
          document.getElementById(id)?.remove();
          callback(o.val, o.label);
        }, 300);
      };
      div.appendChild(btn);
    });

    cb.appendChild(div);
    cb.scrollTop = cb.scrollHeight;
  },

  updateDots(step) {
    for (let i = 0; i < 8; i++) {
      const d = document.getElementById('d' + i);
      if (!d) continue;
      d.className = 'dot' + (i < step ? ' done' : i === step ? ' active' : '');
    }
    const lbl = document.getElementById('step-label');
    const idx = Math.min(step, STEP_LABELS.length - 1);
    lbl.innerHTML = step === 0
      ? 'Welcome'
      : `<strong>Step ${idx} of 8</strong> — ${STEP_LABELS[idx]}`;
  },

  updateSnap(scores, hasPain) {
    document.getElementById('op-bar').style.width = scores.op + '%';
    document.getElementById('pe-bar').style.width = scores.pe + '%';
    document.getElementById('op-pct').textContent = scores.op + '%';
    document.getElementById('pe-pct').textContent = scores.pe + '%';
    document.getElementById('snap-goal').textContent = hasPain
      ? 'Goal: Reduce cost per order & build coaching culture.'
      : 'Start a coaching session to see your progress here.';
    document.getElementById('session-badge').style.display = 'inline-block';
  }
};

// ── DASHBOARD RENDERER ─────────────────────────────────────────────────
const Dashboard = {
  async render() {
    const data = await API.get('/api/dashboard');
    const el = document.getElementById('dash-body');
    const maxCPO = 5.50;
    const maxCoach = Math.max(...data.coaching_trend, 1);

    el.innerHTML = `
    <div class="dash-scroll" style="padding:24px">

      <div class="dash-section">
        <div class="dash-section-title"><i class="ti ti-layout-dashboard"></i> Grow dashboard</div>
        <div class="metric-grid">
          <div class="metric">
            <div class="metric-l">Cost per order</div>
            <div class="metric-v" style="color:var(--coral)">${data.metrics.cost_per_order.value}</div>
            <div class="metric-d bad"><i class="ti ti-arrow-up"></i> ${data.metrics.cost_per_order.delta}</div>
          </div>
          <div class="metric">
            <div class="metric-l">Coaching actions</div>
            <div class="metric-v" style="color:var(--teal)">${data.metrics.coaching_actions.value}</div>
            <div class="metric-d good">${data.metrics.coaching_actions.delta}</div>
          </div>
          <div class="metric">
            <div class="metric-l">Promotion readiness</div>
            <div class="metric-v" style="color:var(--purple)">${data.metrics.promotion_readiness.value}</div>
            <div class="metric-d promo"><i class="ti ti-arrow-up"></i> ${data.metrics.promotion_readiness.delta}</div>
          </div>
        </div>
      </div>

      <div class="dash-section">
        <div class="dash-section-title"><i class="ti ti-trending-down"></i> Cost per order — last 8 weeks</div>
        <div class="chart-card">
          <div class="mini-chart">
            ${data.cpo_trend.map((d, i) => `
              <div class="chart-bar ${d.above ? 'above' : 'below'}"
                   style="height:${Math.round((d.value / maxCPO) * 100)}%"
                   title="${d.week}: $${d.value.toFixed(2)}">
                <span class="chart-bar-val">$${d.value.toFixed(2)}</span>
              </div>`).join('')}
          </div>
          <div style="font-size:10px;color:var(--text-xs);margin-top:6px">Target: $4.25</div>
          <div class="chart-legend">
            <div class="legend-item"><div class="legend-dot" style="background:var(--coral)"></div> Above target</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--teal)"></div> At / near target</div>
          </div>
        </div>
      </div>

      <div class="dash-section">
        <div class="dash-section-title"><i class="ti ti-award"></i> Promotion readiness</div>
        <div class="promo-card">
          <div class="promo-header"><i class="ti ti-award"></i> Operations Manager track</div>
          <div class="promo-body">${data.promo_text}</div>
          <div class="promo-progress">
            <div class="promo-bar-label">
              <span>Overall readiness</span>
              <span>${data.promo_readiness}%</span>
            </div>
            <div class="promo-bar-track">
              <div class="promo-bar-fill" id="promo-fill" style="width:0%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="dash-section">
        <div class="dash-section-title"><i class="ti ti-users"></i> Coaching actions per week</div>
        <div class="chart-card">
          <div class="coach-bar-grid">
            ${data.coaching_trend.map((v, i) => `
              <div class="coach-bar"
                   style="height:${Math.max(Math.round((v / maxCoach) * 100), 12)}%"
                   title="Week ${i + 1}: ${v} actions">
                <span class="coach-bar-val">${v}</span>
              </div>`).join('')}
          </div>
          <div style="font-size:10px;color:var(--text-xs);margin-top:8px;text-align:center">Last 8 weeks</div>
        </div>
      </div>

      <div class="dash-section">
        <div class="dash-section-title"><i class="ti ti-list-check"></i> Recent actions</div>
        <div class="log-list">
          ${data.recent_actions.map(a => `
            <div class="log-item">
              <div class="log-dot"></div>
              <span class="log-text">${a.text}</span>
              <span class="log-time">${a.time}</span>
            </div>`).join('')}
        </div>
      </div>

    </div>`;

    // Animate promo bar after paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        const fill = document.getElementById('promo-fill');
        if (fill) fill.style.width = data.promo_readiness + '%';
      }, 100);
    });
  }
};

// ── COACH FLOW ─────────────────────────────────────────────────────────
const Coach = {
  currentFocus: null,

  async setState(updates) {
    const res = await API.post('/api/state', updates);
    if (res.scores) {
      const hasPain = !!updates.pain || !!(await API.get('/api/state')).state.pain;
      UI.updateSnap(res.scores, hasPain);
    }
    return res;
  },

  async start() {
    document.getElementById('view-entry').classList.remove('active');
    document.getElementById('view-chat').classList.add('active');
    document.getElementById('chat-body').innerHTML = '';
    UI.updateDots(1);

    // Reset server session
    await API.post('/api/reset');

    await UI.coachSay(
      `Great choice, Alex. We'll look at what's driving your <strong>cost per order</strong> and how your team is working — because improving <em>processes</em> and developing <em>people</em> go hand in hand.<br><br>This takes about 5 minutes. Tap your answers as we go.`
    );
    setTimeout(() => this.stepTrend(), 300);
  },

  stepTrend() {
    UI.coachSay('First, how would you describe your <strong>cost per order trend</strong> right now?').then(() => {
      UI.addChips([
        { label: 'Higher than target, getting worse', val: 'worse' },
        { label: 'Higher than target, but stable',    val: 'stable' },
        { label: 'Close to target, not improving',    val: 'close' },
      ], async (val) => {
        await this.setState({ trend: val, step: 2 });
        UI.updateDots(2);
        setTimeout(() => this.stepPain(), 400);
      });
    });
  },

  stepPain() {
    UI.coachSay('Got it. Where does the biggest cost pressure come from?').then(() => {
      UI.addChips([
        { label: 'Labour and overtime',     val: 'labor' },
        { label: 'Errors and rework',       val: 'errors' },
        { label: 'Transport and routing',   val: 'transport' },
        { label: 'Waiting and bottlenecks', val: 'wait' },
        { label: "I'm not sure yet",        val: 'unsure' },
      ], async (val) => {
        await this.setState({ pain: val });
        setTimeout(() => this.stepSize(), 400);
      });
    });
  },

  stepSize() {
    UI.coachSay('A couple of quick context questions — how many <strong>orders per day</strong> does your site typically run?').then(() => {
      UI.addChips([
        { label: 'Under 500',    val: 's' },
        { label: '500 – 2,000', val: 'm' },
        { label: '2,000 – 5,000', val: 'l' },
        { label: 'Over 5,000',  val: 'xl' },
      ], async (val) => {
        await this.setState({ orders: val });
        UI.coachSay('And how many <strong>team leads or direct reports</strong> do you manage?').then(() => {
          UI.addChips([
            { label: '1 – 3',  val: 'xs' },
            { label: '4 – 8',  val: 's' },
            { label: '9 – 15', val: 'm' },
            { label: '16+',    val: 'l' },
          ], async (v) => {
            await this.setState({ team: v, step: 3 });
            UI.updateDots(3);
            setTimeout(() => this.stepCulture(), 400);
          });
        });
      });
    });
  },

  stepCulture() {
    UI.coachSay("Now let's check in on your <strong>team leads</strong>. Which sounds most like your current reality?").then(() => {
      UI.addChips([
        { label: 'They mostly follow my instructions',              val: 'follow' },
        { label: 'They sometimes bring ideas, but I usually drive', val: 'sometimes' },
        { label: 'They regularly bring ideas and own them',         val: 'frequent' },
      ], async (val) => {
        await this.setState({ culture: val, step: 4 });
        UI.updateDots(4);
        setTimeout(() => this.stepDrivers(), 400);
      });
    });
  },

  stepDrivers() {
    UI.coachSay("Almost done. Four quick driver questions — tap where you'd honestly put your operation today.").then(() => {
      UI.coachSay('<strong>Shift schedules vs. workload</strong> — how well do your shifts match when the work actually arrives?').then(() => {
        UI.addChips([
          { label: 'Often mismatched', val: 'mis' },
          { label: 'Mostly matched',   val: 'mostly' },
        ], async (v) => {
          await this.setState({ schedule: v });
          UI.coachSay('<strong>Errors and rework</strong> — how often do order errors require correction?').then(() => {
            UI.addChips([
              { label: 'Often — a real cost driver', val: 'often' },
              { label: 'Sometimes',                  val: 'sometimes' },
              { label: 'Rare',                       val: 'rare' },
            ], async (v2) => {
              await this.setState({ errors: v2 });
              UI.coachSay('<strong>Flow and bottlenecks</strong> — how would you describe throughput during peak periods?').then(() => {
                UI.addChips([
                  { label: 'Frequent bottlenecks', val: 'freq' },
                  { label: 'Some slowdowns',       val: 'some' },
                  { label: 'Mostly smooth',        val: 'smooth' },
                ], async (v3) => {
                  await this.setState({ flow: v3 });
                  UI.coachSay('<strong>Team initiative</strong> — how often do your leads surface improvement ideas without being asked?').then(() => {
                    UI.addChips([
                      { label: 'Rare — I have to pull ideas',  val: 'rare' },
                      { label: 'Sometimes',                    val: 'some' },
                      { label: 'Frequently — they drive it',   val: 'frequent' },
                    ], async (v4) => {
                      await this.setState({ initiative: v4, step: 5 });
                      UI.updateDots(5);
                      setTimeout(() => this.stepFocus(), 500);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  async stepFocus() {
    const { focus } = await API.get('/api/focus');
    this.currentFocus = focus;
    const c = COLOR[focus.color] || COLOR.teal;

    await UI.coachSay("Based on everything you've shared, here's where I think you'll get the most traction — on cost <em>and</em> on developing your team:");

    const cb = UI.chatBody();
    const div = document.createElement('div');
    div.className = 'focus-card';
    div.id = 'focus-card';
    div.style.border = `1.5px solid ${c.border}`;
    div.style.background = c.bg;
    div.innerHTML = `
      <div class="focus-label" style="color:${c.accent}">Recommended focus</div>
      <div class="focus-title" style="color:${c.text}">${focus.title}</div>
      <div class="focus-why"   style="color:${c.accent}">${focus.why}</div>
      <div class="focus-btns">
        <button class="btn-primary" id="btn-confirm-focus" style="background:${c.accent}">
          Yes, let's start here
        </button>
        <button class="btn-ghost" id="btn-next-focus" style="color:${c.accent};border-color:${c.accent}">
          Show another option
        </button>
      </div>`;
    cb.appendChild(div);
    cb.scrollTop = cb.scrollHeight;

    document.getElementById('btn-confirm-focus').onclick = () => this.confirmFocus();
    document.getElementById('btn-next-focus').onclick   = () => this.nextFocus();
  },

  async nextFocus() {
    document.getElementById('focus-card')?.remove();
    const { focus } = await API.post('/api/focus/next');
    this.currentFocus = focus;
    const c = COLOR[focus.color] || COLOR.teal;

    const cb = UI.chatBody();
    const div = document.createElement('div');
    div.className = 'focus-card';
    div.id = 'focus-card';
    div.style.border = `1.5px solid ${c.border}`;
    div.style.background = c.bg;
    div.innerHTML = `
      <div class="focus-label" style="color:${c.accent}">Alternative focus</div>
      <div class="focus-title" style="color:${c.text}">${focus.title}</div>
      <div class="focus-why"   style="color:${c.accent}">${focus.why}</div>
      <div class="focus-btns">
        <button class="btn-primary" id="btn-confirm-focus" style="background:${c.accent}">
          Yes, let's start here
        </button>
        <button class="btn-ghost" id="btn-next-focus" style="color:${c.accent};border-color:${c.accent}">
          Show another option
        </button>
      </div>`;
    cb.appendChild(div);
    cb.scrollTop = cb.scrollHeight;

    document.getElementById('btn-confirm-focus').onclick = () => this.confirmFocus();
    document.getElementById('btn-next-focus').onclick   = () => this.nextFocus();
  },

  async confirmFocus() {
    const card = document.getElementById('focus-card');
    if (card) {
      card.querySelector('.focus-btns').innerHTML =
        '<span style="font-size:12px;color:var(--teal);font-weight:500"><i class="ti ti-check"></i> Focus confirmed</span>';
    }
    const res = await API.post('/api/focus/confirm');
    this.currentFocus = res.focus;
    UI.updateDots(6);
    setTimeout(() => this.stepTasks(), 600);
  },

  stepTasks() {
    const f = this.currentFocus;
    UI.coachSay('Perfect. Here are <strong>two things to do this week</strong> — one for your operation, one for your people. Both matter equally.').then(() => {
      setTimeout(() => this.renderTaskCard('process', f), 400);
      setTimeout(() => {
        this.renderTaskCard('coaching', f);
        setTimeout(() => this.stepWrap(), 800);
      }, 1000);
    });
  },

  renderTaskCard(type, f) {
    const cb = UI.chatBody();
    const div = document.createElement('div');
    div.className = 'task-card';
    div.id = 'task-' + type;
    const isCoach = type === 'coaching';
    div.innerHTML = `
      <div class="task-header ${type}">
        <i class="ti ${isCoach ? 'ti-users' : 'ti-chart-bar'}"></i>
        ${isCoach ? 'Coaching task' : 'Process task'}
      </div>
      <div class="task-body" id="tbody-${type}">${isCoach ? f.coaching : f.process}</div>
      <div class="task-actions" id="tactions-${type}">
        <button class="task-chip" id="tchip-plan-${type}" onclick="Coach.taskAction('${type}','plan')">
          <i class="ti ti-calendar-check"></i> Mark as planned
        </button>
        <button class="task-chip" id="tchip-small-${type}" onclick="Coach.taskAction('${type}','small')">
          Too big — suggest smaller
        </button>
        ${isCoach ? `<button class="task-chip" id="tchip-ready-${type}" onclick="Coach.taskAction('${type}','notready')">Not ready to involve my leads yet</button>` : ''}
      </div>`;
    cb.appendChild(div);
    cb.scrollTop = cb.scrollHeight;
  },

  taskAction(type, action) {
    const f = this.currentFocus;
    const body = document.getElementById('tbody-' + type);
    if (action === 'plan') {
      const btn = document.getElementById('tchip-plan-' + type);
      btn.className = 'task-chip done-chip';
      btn.innerHTML = '<i class="ti ti-check"></i> Planned for this week';
      btn.disabled = true;
    } else if (action === 'small') {
      body.innerHTML = type === 'coaching' ? f.coachingSmall : f.processSmall;
      document.getElementById('tchip-small-' + type)?.remove();
    } else if (action === 'notready') {
      body.innerHTML = f.coachingNotReady;
      document.getElementById('tchip-ready-' + type)?.remove();
    }
    UI.chatBody().scrollTop = 99999;
  },

  async stepWrap() {
    UI.updateDots(7);
    const { state } = await API.get('/api/state');
    const trendLabels = {
      worse:  'above target and worsening',
      stable: 'above target but stable',
      close:  'near target but not improving'
    };
    const painLabels = {
      labor:     'labour and overtime',
      errors:    'errors and rework',
      transport: 'transport and routing',
      wait:      'waiting and bottlenecks',
      unsure:    'multiple areas'
    };

    await UI.coachSay(`Here's a summary of your session so far:<br><br>
      📌 <strong>Baseline:</strong> Cost per order is ${trendLabels[state.trend] || 'above target'}. Primary pressure: ${painLabels[state.pain] || state.pain}.<br>
      🎯 <strong>Focus:</strong> ${this.currentFocus.title.split(' by ')[0]}.<br>
      📋 <strong>This week:</strong> One process task, one coaching conversation.<br><br>
      When would you like me to check in with you?`);

    UI.addChips([
      { label: '3 days',          val: '3 days' },
      { label: '1 week',          val: '1 week' },
      { label: 'Remind me later', val: 'later'  },
    ], async (val) => {
      await this.setState({ checkin: val, step: 8 });
      UI.updateDots(8);
      setTimeout(() => this.stepDone(val), 400);
    });
  },

  async stepDone(checkin) {
    const label = checkin === 'later' ? "when you're ready" : `in <strong>${checkin}</strong>`;
    await UI.coachSay(`Got it — I'll check in ${label}.<br><br>You've done something important today: you've connected your cost challenge to how your team works. That's the mindset that gets Operations Leads promoted.<br><br>Good luck this week, Alex. 🌱`);

    const cb = UI.chatBody();
    const div = document.createElement('div');
    div.className = 'wrap-actions';
    div.innerHTML = `
      <button class="btn-ghost" style="color:var(--teal);border-color:var(--teal);font-size:12px" onclick="Coach.showManagerSummary()">
        <i class="ti ti-file-text"></i> Prepare a summary for my manager
      </button>
      <button class="btn-ghost" style="color:var(--purple);border-color:var(--purple);font-size:12px" onclick="App.showView('dash')">
        <i class="ti ti-layout-dashboard"></i> View my Grow dashboard
      </button>`;
    cb.appendChild(div);
    cb.scrollTop = cb.scrollHeight;
  },

  async showManagerSummary() {
    const summary = await API.get('/api/summary');
    const cb = UI.chatBody();
    const div = document.createElement('div');
    div.className = 'summary-card';
    div.style.cssText = 'margin: 8px 0 0 40px; max-width: 520px;';
    div.innerHTML = `
      <div class="summary-header">
        <i class="ti ti-file-text"></i> Manager summary — ready to share
      </div>
      <div class="summary-body">
        <p><strong>Context:</strong> Alex is working to reduce cost per order, which is currently ${summary.trend_label}. We've identified the primary focus as: "<em>${summary.focus_title}</em>".</p>
        <p><strong>This week's commitments:</strong><br>
           1. Process: ${summary.process_task}<br>
           2. Coaching: ${summary.coaching_task}</p>
        <p><strong>Check-in:</strong> ${summary.checkin}</p>
        <p><strong>Development note:</strong> Alex is actively building coaching habits alongside operational improvement — involving team leads in root cause work rather than directing solutions. This is a key signal of readiness for Operations Manager.</p>
      </div>`;
    cb.appendChild(div);
    cb.scrollTop = cb.scrollHeight;
  }
};

// ── APP CONTROLLER ─────────────────────────────────────────────────────
const App = {
  showView(v) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    if (v === 'coach') {
      const step = parseInt(document.getElementById('d1')?.classList.contains('done') ||
                            document.getElementById('d1')?.classList.contains('active'));
      const inSession = document.getElementById('chat-body')?.children.length > 0;
      document.getElementById(inSession ? 'view-chat' : 'view-entry').classList.add('active');
      document.getElementById('nav-coach').classList.add('active');
    } else {
      document.getElementById('view-dash').classList.add('active');
      document.getElementById('nav-dash').classList.add('active');
      Dashboard.render();
    }
  },

  startFlow() {
    Coach.start();
  }
};

// ── INIT ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  UI.updateDots(0);
});
