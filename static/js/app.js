/* ── GROW COACH — CLIENT APPLICATION ─────────────────────────── */

const CPO_STEP_LABELS     = ['Welcome','Cost trend','Pain area','Operation size','Coaching culture','Driver check','Your focus','Actions this week','Wrap-up'];
const CULTURE_STEP_LABELS = ['Welcome','Your style','Your team','Decision making','Barriers','Your focus','Actions this week','Wrap-up'];
const PROMO_STEP_LABELS   = ['Welcome','Your timeline','Manager signals','Track record','Senior visibility','Your focus','Actions this week','Wrap-up'];

const COLOR = {
  teal:   { border: '#0F6E56', bg: '#E1F5EE', text: '#085041', accent: '#0F6E56' },
  amber:  { border: '#BA7517', bg: '#FAEEDA', text: '#633806', accent: '#BA7517' },
  purple: { border: '#534AB7', bg: '#EEEDFE', text: '#3C3489', accent: '#534AB7' }
};

let _hasPain   = false;
let _inSession = false;
let _flowType  = null;

// ── API ───────────────────────────────────────────────────────────────
const API = {
  async get(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
    return r.json();
  },
  async post(path, body = {}) {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
    return r.json();
  }
};

// ── UI UTILITIES ──────────────────────────────────────────────────────
const UI = {
  chatBody() { return document.getElementById('chat-body'); },

  addBubble(html, isUser = false) {
    const cb = this.chatBody();
    const row = document.createElement('div');
    row.className = 'bubble-row';
    row.innerHTML = isUser
      ? `<div style="flex:1"></div><div class="bubble user-b">${html}</div>`
      : `<div class="coach-av"><i class="ti ti-plant-2"></i></div><div class="bubble">${html}</div>`;
    cb.appendChild(row);
    cb.scrollTop = cb.scrollHeight;
    return row;
  },

  addTyping() {
    if (document.getElementById('typing-row')) return;
    const cb = this.chatBody();
    const row = document.createElement('div');
    row.id = 'typing-row';
    row.className = 'bubble-row';
    row.innerHTML = `<div class="coach-av"><i class="ti ti-plant-2"></i></div>
      <div class="bubble"><div class="typing">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div></div>`;
    cb.appendChild(row);
    cb.scrollTop = cb.scrollHeight;
  },

  removeTyping() { document.getElementById('typing-row')?.remove(); },

  coachSay(html, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.addTyping();
        setTimeout(() => { this.removeTyping(); this.addBubble(html); resolve(); }, 650);
      }, delay);
    });
  },

  addChips(opts, callback) {
    const cb  = this.chatBody();
    const id  = 'chips-' + Date.now();
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
        parent.querySelectorAll('.chip').forEach(x => x.disabled = true);
        btn.className = 'chip selected';
        UI.addBubble(o.label, true);
        setTimeout(() => { document.getElementById(id)?.remove(); callback(o.val, o.label); }, 300);
      };
      div.appendChild(btn);
    });
    cb.appendChild(div);
    cb.scrollTop = cb.scrollHeight;
  },

  updateDots(step, total = 8) {
    for (let i = 0; i < 8; i++) {
      const d = document.getElementById('d' + i);
      if (d) d.className = 'dot' + (i < step ? ' done' : i === step ? ' active' : '');
    }
    const labels = _flowType === 'culture' ? CULTURE_STEP_LABELS
                 : _flowType === 'promo'   ? PROMO_STEP_LABELS
                 : CPO_STEP_LABELS;
    const idx = Math.min(step, labels.length - 1);
    document.getElementById('step-label').innerHTML = step === 0
      ? 'Welcome'
      : `<strong>Step ${idx} of ${total}</strong> — ${labels[idx]}`;
  },

  updateSnap(scores) {
    document.getElementById('op-bar').style.width  = scores.op + '%';
    document.getElementById('pe-bar').style.width  = scores.pe + '%';
    document.getElementById('op-pct').textContent  = scores.op + '%';
    document.getElementById('pe-pct').textContent  = scores.pe + '%';
    const goals = {
      cpo:     'Goal: Reduce cost per order & build coaching culture.',
      culture: 'Goal: Build a stronger coaching culture with your team leads.',
      promo:   'Goal: Build your case for Operations Manager promotion.'
    };
    document.getElementById('snap-goal').textContent = _hasPain
      ? (goals[_flowType] || goals.cpo)
      : 'Start a coaching session to see your progress here.';
  },

  showSessionBadge(show) { document.getElementById('session-badge').style.display = show ? 'inline-block' : 'none'; },
  showHomeBtn(show)      { document.getElementById('home-btn').style.display      = show ? 'flex'         : 'none'; }
};

// ── DASHBOARD ─────────────────────────────────────────────────────────
const Dashboard = {
  async render() {
    const el = document.getElementById('dash-body');
    el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-s)">
      <div class="typing" style="justify-content:center;margin-bottom:8px">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>Loading dashboard...</div>`;
    try {
      const data = await API.get('/api/dashboard');
      const maxCPO   = 5.50;
      const maxCoach = Math.max(...data.coaching_trend, 1);
      el.innerHTML = `<div style="padding:24px">
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
              ${data.cpo_trend.map(d => `
                <div class="chart-bar ${d.above ? 'above' : 'below'}"
                     style="height:${Math.round((d.value / maxCPO) * 100)}%" title="${d.week}: $${d.value.toFixed(2)}">
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
              <div class="promo-bar-label"><span>Overall readiness</span><span>${data.promo_readiness}%</span></div>
              <div class="promo-bar-track"><div class="promo-bar-fill" id="promo-fill" style="width:0%"></div></div>
            </div>
          </div>
        </div>
        <div class="dash-section">
          <div class="dash-section-title"><i class="ti ti-users"></i> Coaching actions per week</div>
          <div class="chart-card">
            <div class="coach-bar-grid">
              ${data.coaching_trend.map((v, i) => `
                <div class="coach-bar" style="height:${Math.max(Math.round((v / maxCoach) * 100), 12)}%"
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
      requestAnimationFrame(() => {
        setTimeout(() => {
          const fill = document.getElementById('promo-fill');
          if (fill) fill.style.width = data.promo_readiness + '%';
        }, 100);
      });
    } catch (err) {
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--coral)">
        <i class="ti ti-alert-circle" style="font-size:24px"></i>
        <p style="margin-top:8px">Could not load dashboard. Please refresh.</p></div>`;
    }
  }
};

// ── FOCUS ENGINE (shared) ─────────────────────────────────────────────
const FocusEngine = {
  currentFocus: null,

  async setState(updates) {
    try {
      if (updates.pain || updates.barrier || updates.promo_blocker || updates.timeline) _hasPain = true;
      const res = await API.post('/api/state', updates);
      if (res.scores) UI.updateSnap(res.scores);
      return res;
    } catch (err) { console.error('setState:', err); }
  },

  async loadFocus()  { const { focus } = await API.get('/api/focus');        this.currentFocus = focus; return focus; },
  async nextFocus()  { document.getElementById('focus-card')?.remove();
                       const { focus } = await API.post('/api/focus/next'); this.currentFocus = focus; return focus; },
  async confirmFocus() {
    const card = document.getElementById('focus-card');
    if (card) card.querySelector('.focus-btns').innerHTML =
      '<span style="font-size:12px;color:var(--teal);font-weight:500"><i class="ti ti-check"></i> Focus confirmed</span>';
    const res = await API.post('/api/focus/confirm');
    this.currentFocus = res.focus;
    return res;
  },

  renderFocusCard(focus, label, onConfirm, onNext) {
    const c = COLOR[focus.color] || COLOR.teal;
    UI.coachSay("Based on what you've shared, here's the focus I'd recommend — the highest-leverage place to put your energy right now:").then(() => {
      document.getElementById('focus-card')?.remove();
      const cb  = UI.chatBody();
      const div = document.createElement('div');
      div.className = 'focus-card';
      div.id = 'focus-card';
      div.style.border     = `1.5px solid ${c.border}`;
      div.style.background = c.bg;
      div.innerHTML = `
        <div class="focus-label" style="color:${c.accent}">${label}</div>
        <div class="focus-title" style="color:${c.text}">${focus.title}</div>
        <div class="focus-why"   style="color:${c.accent}">${focus.why}</div>
        <div class="focus-btns">
          <button class="btn-primary" id="btn-confirm-focus" style="background:${c.accent}">Yes, let's start here</button>
          <button class="btn-ghost"   id="btn-next-focus"    style="color:${c.accent};border-color:${c.accent}">Show another option</button>
        </div>`;
      cb.appendChild(div);
      cb.scrollTop = cb.scrollHeight;
      document.getElementById('btn-confirm-focus').onclick = onConfirm;
      document.getElementById('btn-next-focus').onclick   = onNext;
    });
  }
};

// ── CPO FLOW ──────────────────────────────────────────────────────────
const CpoFlow = {
  async start() {
    _flowType = 'cpo'; _hasPain = false;
    await API.post('/api/state', { flow_type: 'cpo' });
    UI.updateDots(1, 8);
    await UI.coachSay(`Great choice, Alex. We'll look at what's driving your <strong>cost per order</strong> and how your team is working — because improving <em>processes</em> and developing <em>people</em> go hand in hand.<br><br>This takes about 5 minutes. Tap your answers as we go.`);
    setTimeout(() => this.stepTrend(), 300);
  },

  stepTrend() {
    UI.coachSay('First, how would you describe your <strong>cost per order trend</strong> right now?').then(() => {
      UI.addChips([
        { label: 'Higher than target, getting worse', val: 'worse'  },
        { label: 'Higher than target, but stable',    val: 'stable' },
        { label: 'Close to target, not improving',    val: 'close'  },
      ], async (val) => {
        await FocusEngine.setState({ trend: val, step: 2 }); UI.updateDots(2, 8);
        setTimeout(() => this.stepPain(), 400);
      });
    });
  },

  stepPain() {
    UI.coachSay('Got it. Where does the biggest cost pressure come from?').then(() => {
      UI.addChips([
        { label: 'Labour and overtime',     val: 'labor'     },
        { label: 'Errors and rework',       val: 'errors'    },
        { label: 'Transport and routing',   val: 'transport' },
        { label: 'Waiting and bottlenecks', val: 'wait'      },
        { label: "I'm not sure yet",        val: 'unsure'    },
      ], async (val) => {
        await FocusEngine.setState({ pain: val });
        setTimeout(() => this.stepSize(), 400);
      });
    });
  },

  stepSize() {
    UI.coachSay('A couple of quick context questions — how many <strong>orders per day</strong> does your site typically run?').then(() => {
      UI.addChips([
        { label: 'Under 500',      val: 's'  }, { label: '500 – 2,000',   val: 'm'  },
        { label: '2,000 – 5,000', val: 'l'  }, { label: 'Over 5,000',     val: 'xl' },
      ], async (val) => {
        await FocusEngine.setState({ orders: val });
        UI.coachSay('And how many <strong>team leads or direct reports</strong> do you manage?').then(() => {
          UI.addChips([
            { label: '1 – 3', val: 'xs' }, { label: '4 – 8', val: 's' },
            { label: '9 – 15', val: 'm' }, { label: '16+',   val: 'l' },
          ], async (v) => {
            await FocusEngine.setState({ team: v, step: 3 }); UI.updateDots(3, 8);
            setTimeout(() => this.stepCulture(), 400);
          });
        });
      });
    });
  },

  stepCulture() {
    UI.coachSay("Now let's check in on your <strong>team leads</strong>. Which sounds most like your current reality?").then(() => {
      UI.addChips([
        { label: 'They mostly follow my instructions',              val: 'follow'    },
        { label: 'They sometimes bring ideas, but I usually drive', val: 'sometimes' },
        { label: 'They regularly bring ideas and own them',         val: 'frequent'  },
      ], async (val) => {
        await FocusEngine.setState({ culture: val, step: 4 }); UI.updateDots(4, 8);
        setTimeout(() => this.stepDrivers(), 400);
      });
    });
  },

  stepDrivers() {
    UI.coachSay("Almost done. Four quick driver questions — tap where you'd honestly put your operation today.").then(() => {
      UI.coachSay('<strong>Shift schedules vs. workload</strong> — how well do your shifts match when the work actually arrives?').then(() => {
        UI.addChips([
          { label: 'Often mismatched', val: 'mis' }, { label: 'Mostly matched', val: 'mostly' },
        ], async (v) => {
          await FocusEngine.setState({ schedule: v });
          UI.coachSay('<strong>Errors and rework</strong> — how often do order errors require correction?').then(() => {
            UI.addChips([
              { label: 'Often — a real cost driver', val: 'often' }, { label: 'Sometimes', val: 'sometimes' }, { label: 'Rare', val: 'rare' },
            ], async (v2) => {
              await FocusEngine.setState({ errors: v2 });
              UI.coachSay('<strong>Flow and bottlenecks</strong> — how would you describe throughput during peak periods?').then(() => {
                UI.addChips([
                  { label: 'Frequent bottlenecks', val: 'freq' }, { label: 'Some slowdowns', val: 'some' }, { label: 'Mostly smooth', val: 'smooth' },
                ], async (v3) => {
                  await FocusEngine.setState({ flow: v3 });
                  UI.coachSay('<strong>Team initiative</strong> — how often do your leads surface improvement ideas without being asked?').then(() => {
                    UI.addChips([
                      { label: 'Rare — I have to pull ideas', val: 'rare' }, { label: 'Sometimes', val: 'some' }, { label: 'Frequently — they drive it', val: 'frequent' },
                    ], async (v4) => {
                      await FocusEngine.setState({ initiative: v4, step: 5 }); UI.updateDots(5, 8);
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
    try {
      const focus = await FocusEngine.loadFocus();
      FocusEngine.renderFocusCard(focus, 'Recommended focus', () => this.confirmFocus(), () => this.nextFocus());
    } catch (e) { UI.addBubble('Could not load recommendation. Please refresh.'); }
  },
  async nextFocus() {
    try {
      const focus = await FocusEngine.nextFocus();
      FocusEngine.renderFocusCard(focus, 'Alternative focus', () => this.confirmFocus(), () => this.nextFocus());
    } catch (e) { UI.addBubble('Could not load alternative.'); }
  },
  async confirmFocus() {
    try { await FocusEngine.confirmFocus(); UI.updateDots(6, 8); setTimeout(() => this.stepTasks(), 600); }
    catch (e) { UI.addBubble('Something went wrong. Please refresh.'); }
  },

  stepTasks() {
    const f = FocusEngine.currentFocus;
    UI.coachSay('Perfect. Here are <strong>two things to do this week</strong> — one for your operation, one for your people.').then(() => {
      setTimeout(() => this._renderCard('process', f), 400);
      setTimeout(() => { this._renderCard('coaching', f); setTimeout(() => this.stepWrap(), 900); }, 1000);
    });
  },

  _renderCard(type, f) {
    const cb = UI.chatBody(), div = document.createElement('div');
    div.className = 'task-card'; div.id = 'task-' + type;
    const isCoach = type === 'coaching';
    div.innerHTML = `
      <div class="task-header ${type}"><i class="ti ${isCoach ? 'ti-users' : 'ti-chart-bar'}"></i>${isCoach ? 'Coaching task' : 'Process task'}</div>
      <div class="task-body" id="tbody-${type}">${isCoach ? f.coaching : f.process}</div>
      <div class="task-actions">
        <button class="task-chip" id="tchip-plan-${type}" onclick="CpoFlow.taskAction('${type}','plan')"><i class="ti ti-calendar-check"></i> Mark as planned</button>
        <button class="task-chip" onclick="CpoFlow.taskAction('${type}','small')">Too big — suggest smaller</button>
        ${isCoach ? `<button class="task-chip" onclick="CpoFlow.taskAction('${type}','notready')">Not ready to involve my leads yet</button>` : ''}
      </div>`;
    cb.appendChild(div); cb.scrollTop = cb.scrollHeight;
  },

  taskAction(type, action) {
    const f = FocusEngine.currentFocus, body = document.getElementById('tbody-' + type);
    if (!body) return;
    if (action === 'plan') {
      const btn = document.getElementById('tchip-plan-' + type);
      btn.className = 'task-chip done-chip'; btn.innerHTML = '<i class="ti ti-check"></i> Planned for this week'; btn.disabled = true;
    } else if (action === 'small')    { body.innerHTML = type === 'coaching' ? f.coachingSmall    : f.processSmall; body.closest('.task-card').querySelectorAll('.task-chip:not(.done-chip)')[0]?.remove(); }
      else if (action === 'notready') { body.innerHTML = f.coachingNotReady; body.closest('.task-card').querySelectorAll('.task-chip:not(.done-chip)')[1]?.remove(); }
    UI.chatBody().scrollTop = 99999;
  },

  async stepWrap() {
    UI.updateDots(7, 8);
    try {
      const { state } = await API.get('/api/state');
      const trendL = { worse: 'above target and worsening', stable: 'above target but stable', close: 'near target but not improving' };
      const painL  = { labor: 'labour and overtime', errors: 'errors and rework', transport: 'transport and routing', wait: 'waiting and bottlenecks', unsure: 'multiple areas' };
      await UI.coachSay(`Here's a summary of your session:<br><br>
        📌 <strong>Baseline:</strong> Cost per order is ${trendL[state.trend] || 'above target'}. Primary pressure: ${painL[state.pain] || state.pain}.<br>
        🎯 <strong>Focus:</strong> ${FocusEngine.currentFocus.title.split(' by ')[0]}.<br>
        📋 <strong>This week:</strong> One process task, one coaching conversation.<br><br>When would you like me to check in?`);
      UI.addChips([
        { label: '3 days', val: '3 days' }, { label: '1 week', val: '1 week' }, { label: 'Remind me later', val: 'later' },
      ], async (val) => {
        await FocusEngine.setState({ checkin: val, step: 8 }); UI.updateDots(8, 8);
        setTimeout(() => this.stepDone(val), 400);
      });
    } catch (e) { UI.addBubble('Could not load summary. Please refresh.'); }
  },

  async stepDone(checkin) {
    const label = checkin === 'later' ? "when you're ready" : `in <strong>${checkin}</strong>`;
    await UI.coachSay(`Got it — I'll check in ${label}.<br><br>You've done something important today: you've connected your cost challenge to how your team works. That's the mindset that gets Operations Leads promoted.<br><br>Good luck this week, Alex. 🌱`);
    _renderWrapButtons();
  }
};

// ── CULTURE FLOW ──────────────────────────────────────────────────────
const CultureFlow = {
  async start() {
    _flowType = 'culture'; _hasPain = false;
    await API.post('/api/state', { flow_type: 'culture' });
    UI.updateDots(1, 7);
    await UI.coachSay(`Great — building a coaching culture is one of the highest-leverage things you can do as an Operations Lead. It improves your team's results <em>and</em> it's exactly what gets people promoted.<br><br>I'll ask you a few honest questions about how things work today. No right answers — just tap what's true for you right now.`);
    setTimeout(() => this.stepStyle(), 300);
  },

  stepStyle() {
    UI.coachSay("When you think about <strong>how you lead day-to-day</strong>, which comes closest?").then(() => {
      UI.addChips([
        { label: 'I mostly direct — I tell my leads what to do',    val: 'directive'    },
        { label: "I give them space, but don't give much feedback", val: 'handsoff'     },
        { label: "I coach sometimes, but I'm inconsistent",         val: 'inconsistent' },
        { label: 'I actively coach — but want to get better at it', val: 'coach'        },
      ], async (val) => {
        await FocusEngine.setState({ style: val, step: 2 }); UI.updateDots(2, 7);
        setTimeout(() => this.stepTeam(), 400);
      });
    });
  },

  stepTeam() {
    UI.coachSay("How would you describe your team leads' current level of <strong>initiative</strong>?").then(() => {
      UI.addChips([
        { label: 'They wait to be told what to do',          val: 'never'  },
        { label: 'They act on their own occasionally',       val: 'rarely' },
        { label: 'They often take initiative independently', val: 'often'  },
      ], async (val) => {
        await FocusEngine.setState({ idea_freq: val, culture: val === 'often' ? 'frequent' : val === 'rarely' ? 'sometimes' : 'follow' });
        _hasPain = true; setTimeout(() => this.stepDecision(), 400);
      });
    });
  },

  stepDecision() {
    UI.coachSay("When a problem comes up on the floor, <strong>who typically makes the call</strong>?").then(() => {
      UI.addChips([
        { label: 'Almost always me',                           val: 'always_me'    },
        { label: 'Sometimes me, sometimes them',               val: 'sometimes'    },
        { label: 'Usually them, I just need to know about it', val: 'usually_them' },
      ], async (val) => {
        await FocusEngine.setState({ decision_style: val, step: 3 }); UI.updateDots(3, 7);
        setTimeout(() => this.stepBarrier(), 400);
      });
    });
  },

  stepBarrier() {
    UI.coachSay("When you picture your team leads stepping up more — what feels like the <strong>biggest thing in the way</strong>?").then(() => {
      UI.addChips([
        { label: "They don't speak up or share ideas",            val: 'voice'     },
        { label: "They don't take ownership without being pushed", val: 'ownership' },
        { label: "I don't give them enough feedback to grow",     val: 'feedback'  },
        { label: "I haven't trusted them with enough yet",        val: 'trust'     },
        { label: "I don't have time to coach properly",           val: 'time'      },
      ], async (val) => {
        const barrier = (val === 'trust') ? 'ownership' : (val === 'time') ? 'feedback' : val;
        await FocusEngine.setState({ blocker: val, barrier, step: 4 }); UI.updateDots(4, 7);
        setTimeout(() => this.stepFocus(), 500);
      });
    });
  },

  async stepFocus() {
    try {
      const focus = await FocusEngine.loadFocus();
      FocusEngine.renderFocusCard(focus, 'Recommended focus', () => this.confirmFocus(), () => this.nextFocus());
    } catch (e) { UI.addBubble('Could not load recommendation. Please refresh.'); }
  },
  async nextFocus() {
    try {
      const focus = await FocusEngine.nextFocus();
      FocusEngine.renderFocusCard(focus, 'Alternative focus', () => this.confirmFocus(), () => this.nextFocus());
    } catch (e) { UI.addBubble('Could not load alternative.'); }
  },
  async confirmFocus() {
    try { await FocusEngine.confirmFocus(); UI.updateDots(5, 7); setTimeout(() => this.stepTasks(), 600); }
    catch (e) { UI.addBubble('Something went wrong. Please refresh.'); }
  },

  stepTasks() {
    const f = FocusEngine.currentFocus;
    UI.coachSay('Here are <strong>two things to do this week</strong> — a concrete team action and a coaching behaviour to practise alongside it.').then(() => {
      setTimeout(() => this._renderAction(f), 400);
      setTimeout(() => { this._renderCoaching(f); setTimeout(() => this.stepWrap(), 900); }, 1000);
    });
  },

  _renderAction(f) {
    const cb = UI.chatBody(), div = document.createElement('div');
    div.className = 'task-card'; div.id = 'task-action';
    div.innerHTML = `
      <div class="task-header coaching"><i class="ti ti-users"></i> Team action</div>
      <div class="task-body" id="tbody-action">${f.action}</div>
      <div class="task-actions">
        <button class="task-chip" id="tchip-plan-action" onclick="CultureFlow.taskAction('action','plan')"><i class="ti ti-calendar-check"></i> Mark as planned</button>
        <button class="task-chip" onclick="CultureFlow.taskAction('action','small')">Too big — suggest smaller</button>
      </div>`;
    cb.appendChild(div); cb.scrollTop = cb.scrollHeight;
  },

  _renderCoaching(f) {
    const cb = UI.chatBody(), div = document.createElement('div');
    div.className = 'task-card'; div.id = 'task-coaching';
    div.innerHTML = `
      <div class="task-header process" style="color:var(--teal)"><i class="ti ti-bulb"></i> Coaching behaviour</div>
      <div class="task-body" id="tbody-coaching">${f.coaching}</div>
      <div class="task-actions">
        <button class="task-chip" id="tchip-plan-coaching" onclick="CultureFlow.taskAction('coaching','plan')"><i class="ti ti-calendar-check"></i> Mark as planned</button>
        <button class="task-chip" onclick="CultureFlow.taskAction('coaching','small')">Not ready for this yet</button>
      </div>`;
    cb.appendChild(div); cb.scrollTop = cb.scrollHeight;
  },

  taskAction(type, action) {
    const f = FocusEngine.currentFocus, body = document.getElementById('tbody-' + type);
    if (!body) return;
    if (action === 'plan') {
      const btn = document.getElementById('tchip-plan-' + type);
      btn.className = 'task-chip done-chip'; btn.innerHTML = '<i class="ti ti-check"></i> Planned for this week'; btn.disabled = true;
    } else if (action === 'small') {
      body.innerHTML = type === 'coaching' ? f.coachingSmall : f.actionSmall;
      body.closest('.task-card').querySelectorAll('.task-chip:not(.done-chip)')[0]?.remove();
    }
    UI.chatBody().scrollTop = 99999;
  },

  async stepWrap() {
    UI.updateDots(6, 7);
    const styleL = { directive: 'tend to direct rather than coach', handsoff: 'give lots of autonomy but limited feedback', inconsistent: 'are inconsistent in your coaching', coach: 'actively coach but want to sharpen it' };
    const blockerL = { voice: "team leads don't speak up enough", ownership: "leads don't take ownership without being pushed", feedback: "not enough feedback for leads to grow", trust: "haven't yet trusted leads with enough", time: "not enough time to coach properly" };
    const { state } = await API.get('/api/state').catch(() => ({ state: {} }));
    await UI.coachSay(`Here's what we've established today:<br><br>
      🪞 <strong>Self-assessment:</strong> You ${styleL[state.style] || 'are developing your coaching approach'}.<br>
      🚧 <strong>Biggest barrier:</strong> ${blockerL[state.blocker] || 'unclear — worth reflecting on'}.<br>
      🎯 <strong>Focus:</strong> ${FocusEngine.currentFocus.title}.<br>
      📋 <strong>This week:</strong> One team action, one coaching behaviour to practise.<br><br>When would you like me to check in?`);
    UI.addChips([
      { label: '3 days', val: '3 days' }, { label: '1 week', val: '1 week' }, { label: 'Remind me later', val: 'later' },
    ], async (val) => {
      await FocusEngine.setState({ checkin: val, step: 7 }); UI.updateDots(7, 7);
      setTimeout(() => this.stepDone(val), 400);
    });
  },

  async stepDone(checkin) {
    const label = checkin === 'later' ? "when you're ready" : `in <strong>${checkin}</strong>`;
    await UI.coachSay(`Got it — I'll check in ${label}.<br><br>Coaching culture doesn't happen overnight, but it starts with one consistent behaviour. You've picked yours.<br><br>Good luck this week, Alex. 🌱`);
    _renderWrapButtons();
  }
};

// ── PROMOTION FLOW ────────────────────────────────────────────────────
const PromoFlow = {
  async start() {
    _flowType = 'promo'; _hasPain = false;
    await API.post('/api/state', { flow_type: 'promo' });
    UI.updateDots(1, 7);
    await UI.coachSay(`Let's build your case for Operations Manager. This isn't about doing your current job better — it's about making sure the right people can see that you're <em>already</em> operating at the next level.<br><br>I'll ask you four honest questions. The more direct you are, the more useful the recommendation.`);
    setTimeout(() => this.stepTimeline(), 300);
  },

  stepTimeline() {
    UI.coachSay("First — how are you thinking about <strong>your promotion timeline</strong>?").then(() => {
      UI.addChips([
        { label: 'I want to be ready in about 6 months',         val: '6months'   },
        { label: 'I\'m targeting the next 12 months',            val: '12months'  },
        { label: 'More like 18 months — I want to do it right',  val: '18months'  },
        { label: 'I\'m exploring — no fixed timeline yet',       val: 'exploring' },
      ], async (val) => {
        await FocusEngine.setState({ timeline: val, step: 2 }); UI.updateDots(2, 7);
        _hasPain = true;
        setTimeout(() => this.stepFeedback(), 400);
      });
    });
  },

  stepFeedback() {
    UI.coachSay("Has your manager given you any signals about <strong>where you stand</strong> on promotion readiness?").then(() => {
      UI.addChips([
        { label: "We haven't discussed it directly",        val: 'not_discussed' },
        { label: 'I\'ve had positive signals',             val: 'positive'      },
        { label: 'I\'ve been told there are gaps to close', val: 'needs_work'   },
        { label: 'Signals have been mixed',                val: 'mixed'         },
      ], async (val) => {
        await FocusEngine.setState({ manager_feedback: val, step: 3 }); UI.updateDots(3, 7);
        setTimeout(() => this.stepTrackRecord(), 400);
      });
    });
  },

  stepTrackRecord() {
    UI.coachSay("How would you describe your <strong>track record of operational impact</strong> over the last 6–12 months?").then(() => {
      UI.addChips([
        { label: 'Strong — I can point to clear results and numbers', val: 'strong'  },
        { label: 'Mixed — some wins but not consistently visible',    val: 'mixed'   },
        { label: 'Unclear — I\'ve done good work but haven\'t tracked it', val: 'unclear' },
      ], async (val) => {
        await FocusEngine.setState({ track_record: val, step: 4 }); UI.updateDots(4, 7);
        setTimeout(() => this.stepVisibility(), 400);
      });
    });
  },

  stepVisibility() {
    UI.coachSay("How visible are you to <strong>senior leaders above your direct manager</strong>?").then(() => {
      UI.addChips([
        { label: 'Barely — I mostly interact with my direct manager', val: 'none' },
        { label: 'Some exposure but not regularly',                   val: 'some' },
        { label: 'Good — I regularly interact with senior leaders',   val: 'good' },
      ], async (val) => {
        await FocusEngine.setState({ senior_visibility: val, promo_blocker: _inferBlocker(val), step: 5 });
        UI.updateDots(5, 7);
        setTimeout(() => this.stepFocus(), 500);
      });
    });
  },

  async stepFocus() {
    try {
      const focus = await FocusEngine.loadFocus();
      FocusEngine.renderFocusCard(focus, 'Recommended focus', () => this.confirmFocus(), () => this.nextFocus());
    } catch (e) { UI.addBubble('Could not load recommendation. Please refresh.'); }
  },
  async nextFocus() {
    try {
      const focus = await FocusEngine.nextFocus();
      FocusEngine.renderFocusCard(focus, 'Alternative focus', () => this.confirmFocus(), () => this.nextFocus());
    } catch (e) { UI.addBubble('Could not load alternative.'); }
  },
  async confirmFocus() {
    try { await FocusEngine.confirmFocus(); UI.updateDots(6, 7); setTimeout(() => this.stepTasks(), 600); }
    catch (e) { UI.addBubble('Something went wrong. Please refresh.'); }
  },

  stepTasks() {
    const f = FocusEngine.currentFocus;
    UI.coachSay("Here are <strong>two things to do this week</strong> — one that builds your case, one that makes it visible to the right people.").then(() => {
      setTimeout(() => this._renderBuildCard(f), 400);
      setTimeout(() => { this._renderVisibleCard(f); setTimeout(() => this.stepWrap(), 900); }, 1000);
    });
  },

  _renderBuildCard(f) {
    const cb = UI.chatBody(), div = document.createElement('div');
    div.className = 'task-card'; div.id = 'task-build';
    div.innerHTML = `
      <div class="task-header process" style="color:var(--amber)"><i class="ti ti-file-plus"></i> Build your case</div>
      <div class="task-body" id="tbody-build">${f.action}</div>
      <div class="task-actions">
        <button class="task-chip" id="tchip-plan-build" onclick="PromoFlow.taskAction('build','plan')"><i class="ti ti-calendar-check"></i> Mark as planned</button>
        <button class="task-chip" onclick="PromoFlow.taskAction('build','small')">Too big — suggest smaller</button>
      </div>`;
    cb.appendChild(div); cb.scrollTop = cb.scrollHeight;
  },

  _renderVisibleCard(f) {
    const cb = UI.chatBody(), div = document.createElement('div');
    div.className = 'task-card'; div.id = 'task-visible';
    div.innerHTML = `
      <div class="task-header coaching"><i class="ti ti-eye"></i> Make it visible</div>
      <div class="task-body" id="tbody-visible">${f.evidence}</div>
      <div class="task-actions">
        <button class="task-chip" id="tchip-plan-visible" onclick="PromoFlow.taskAction('visible','plan')"><i class="ti ti-calendar-check"></i> Mark as planned</button>
        <button class="task-chip" onclick="PromoFlow.taskAction('visible','small')">Not ready for this yet</button>
      </div>`;
    cb.appendChild(div); cb.scrollTop = cb.scrollHeight;
  },

  taskAction(type, action) {
    const f = FocusEngine.currentFocus, body = document.getElementById('tbody-' + type);
    if (!body) return;
    if (action === 'plan') {
      const btn = document.getElementById('tchip-plan-' + type);
      btn.className = 'task-chip done-chip'; btn.innerHTML = '<i class="ti ti-check"></i> Planned for this week'; btn.disabled = true;
    } else if (action === 'small') {
      body.innerHTML = type === 'visible' ? f.evidenceSmall : f.actionSmall;
      body.closest('.task-card').querySelectorAll('.task-chip:not(.done-chip)')[0]?.remove();
    }
    UI.chatBody().scrollTop = 99999;
  },

  async stepWrap() {
    UI.updateDots(7, 7);
    const timelineL = { '6months': 'in ~6 months', '12months': 'in ~12 months', '18months': 'in ~18 months', 'exploring': 'on your own timeline' };
    const feedbackL = { not_discussed: "haven't discussed promotion with your manager yet", positive: 'have received positive signals', needs_work: 'have been told there are gaps to close first', mixed: 'have received mixed signals' };
    const trackL   = { strong: 'strong and measurable', mixed: 'mixed — some visible wins', unclear: 'unclear — needs to be documented' };
    const { state } = await API.get('/api/state').catch(() => ({ state: {} }));
    await UI.coachSay(`Here's where you stand today:<br><br>
      🗓️ <strong>Timeline:</strong> Targeting promotion ${timelineL[state.timeline] || 'in the next 12–18 months'}.<br>
      💬 <strong>Manager signals:</strong> You ${feedbackL[state.manager_feedback] || 'are building your case'}.<br>
      📊 <strong>Track record:</strong> ${trackL[state.track_record] || 'In progress'}.<br>
      🎯 <strong>Focus:</strong> ${FocusEngine.currentFocus.title}.<br>
      📋 <strong>This week:</strong> Build your case. Make it visible.<br><br>When would you like me to check in?`);
    UI.addChips([
      { label: '3 days', val: '3 days' }, { label: '1 week', val: '1 week' }, { label: 'Remind me later', val: 'later' },
    ], async (val) => {
      await FocusEngine.setState({ checkin: val, step: 8 }); UI.updateDots(8, 7);
      setTimeout(() => this.stepDone(val), 400);
    });
  },

  async stepDone(checkin) {
    const label = checkin === 'later' ? "when you're ready" : `in <strong>${checkin}</strong>`;
    await UI.coachSay(`Got it — I'll check in ${label}.<br><br>Promotion readiness isn't one big moment — it's built from small, visible actions over time. You've started today.<br><br>Good luck this week, Alex. 🌱`);
    _renderWrapButtons();
  }
};

// Helper: infer primary blocker from visibility answer + track record
function _inferBlocker(visibility) {
  if (visibility === 'none') return 'not_visible';
  return 'no_evidence';
}

// ── SHARED WRAP BUTTONS ───────────────────────────────────────────────
function _renderWrapButtons() {
  const cb  = UI.chatBody();
  const div = document.createElement('div');
  div.className = 'wrap-actions';
  div.innerHTML = `
    <button class="btn-ghost" style="color:var(--teal);border-color:var(--teal);font-size:12px" onclick="_showManagerSummary()">
      <i class="ti ti-file-text"></i> Prepare a summary for my manager
    </button>
    <button class="btn-ghost" style="color:var(--purple);border-color:var(--purple);font-size:12px" onclick="App.showView('dash')">
      <i class="ti ti-layout-dashboard"></i> View my Grow dashboard
    </button>
    <button class="btn-ghost" style="color:var(--gray-400);border-color:var(--gray-200);font-size:12px" onclick="App.goHome()">
      <i class="ti ti-home"></i> Back to home
    </button>`;
  cb.appendChild(div);
  cb.scrollTop = cb.scrollHeight;
}

async function _showManagerSummary() {
  try {
    const s   = await API.get('/api/summary');
    const cb  = UI.chatBody();
    const div = document.createElement('div');
    div.className = 'summary-card';
    div.style.cssText = 'margin: 8px 0 0 40px; max-width: 520px;';

    let body = '';
    if (s.flow_type === 'promo') {
      body = `
        <p><strong>Context:</strong> Alex is ${s.timeline_label} and ${s.feedback_label}.</p>
        <p><strong>Focus area:</strong> "<em>${s.focus_title}</em>"</p>
        <p><strong>This week's commitments:</strong><br>
           1. Build the case: ${s.action_task}<br>
           2. Make it visible: ${s.evidence_task}</p>
        <p><strong>Check-in:</strong> ${s.checkin}</p>
        <p><strong>Development note:</strong> Alex is actively building promotion readiness — not waiting to be noticed, but constructing a clear evidence base and increasing visibility with decision-makers. This proactive approach is itself a signal of Operations Manager readiness.</p>`;
    } else if (s.flow_type === 'culture') {
      body = `
        <p><strong>Context:</strong> Alex is working to build a stronger coaching culture. Current self-assessment: Alex ${s.style_label}.</p>
        <p><strong>Focus area:</strong> "<em>${s.focus_title}</em>"</p>
        <p><strong>This week's commitments:</strong><br>
           1. Team action: ${s.action_task}<br>
           2. Coaching behaviour: ${s.coaching_task}</p>
        <p><strong>Check-in:</strong> ${s.checkin}</p>
        <p><strong>Development note:</strong> Alex is actively working to shift from a directive style to a coaching approach — creating space for team leads to bring ideas, make decisions, and own improvements.</p>`;
    } else {
      body = `
        <p><strong>Context:</strong> Alex is working to reduce cost per order, currently ${s.trend_label}. Primary pressure: ${s.pain_label}.</p>
        <p><strong>Focus area:</strong> "<em>${s.focus_title}</em>"</p>
        <p><strong>This week's commitments:</strong><br>
           1. Process: ${s.process_task}<br>
           2. Coaching: ${s.coaching_task}</p>
        <p><strong>Check-in:</strong> ${s.checkin}</p>
        <p><strong>Development note:</strong> Alex is actively building coaching habits alongside operational improvement — involving team leads in root cause work rather than directing solutions.</p>`;
    }

    div.innerHTML = `
      <div class="summary-header"><i class="ti ti-file-text"></i> Manager summary — ready to share</div>
      <div class="summary-body">${body}</div>`;
    cb.appendChild(div);
    cb.scrollTop = cb.scrollHeight;
  } catch (err) { UI.addBubble('Could not generate summary. Please try again.'); }
}

// ── APP CONTROLLER ────────────────────────────────────────────────────
const App = {
  showView(v) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    if (v === 'coach') {
      document.getElementById(_inSession ? 'view-chat' : 'view-entry').classList.add('active');
      document.getElementById('nav-coach').classList.add('active');
    } else {
      document.getElementById('view-dash').classList.add('active');
      document.getElementById('nav-dash').classList.add('active');
      Dashboard.render();
    }
  },

  async goHome() {
    try { await API.post('/api/reset'); } catch (e) {}
    _inSession = false; _hasPain = false; _flowType = null;
    FocusEngine.currentFocus = null;
    document.getElementById('chat-body').innerHTML = '';
    UI.updateDots(0); UI.showSessionBadge(false); UI.showHomeBtn(false);
    document.getElementById('snap-goal').textContent = 'Start a coaching session to see your progress here.';
    ['op-bar','pe-bar'].forEach(id => document.getElementById(id).style.width = '0%');
    ['op-pct','pe-pct'].forEach(id => document.getElementById(id).textContent = '—');
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('view-entry').classList.add('active');
    document.getElementById('nav-coach').classList.add('active');
    document.getElementById('step-label').innerHTML = 'Welcome';
  },

  startFlow(type) {
    document.getElementById('view-entry').classList.remove('active');
    document.getElementById('view-chat').classList.add('active');
    document.getElementById('nav-coach').classList.add('active');
    document.getElementById('chat-body').innerHTML = '';
    _inSession = true;
    UI.showSessionBadge(true);
    UI.showHomeBtn(true);
    API.post('/api/reset').finally(() => {
      if (type === 'culture')       CultureFlow.start();
      else if (type === 'promo')    PromoFlow.start();
      else                          CpoFlow.start();
    });
  }
};

// ── INIT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  UI.updateDots(0);
  UI.showHomeBtn(false);
  UI.showSessionBadge(false);
});
