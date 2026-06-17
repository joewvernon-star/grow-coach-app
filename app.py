from flask import Flask, render_template, request, jsonify, session
import os
import uuid

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'grow-coach-dev-key-2024')

# ─── FOCUS LIBRARY ────────────────────────────────────────────────────
FOCUSES = [
    {
        "id": "errors",
        "title": "Reduce errors and rework by engaging your team leads as problem-solvers",
        "why": "Rework is one of the highest-cost, most fixable drivers — and solving it together with your team leads is exactly the coaching behaviour that gets you promoted to Operations Manager.",
        "color": "teal",
        "process": "Sample last week's orders, count rework cases, and list the top 2–3 root causes.",
        "coaching": "Share your findings with your two main shift leads and ask: \"What experiment would you try?\" Your role is to ask questions, not hand them the answer.",
        "processSmall": "Start smaller: pull just <strong>10 orders from last week</strong> and check them for any error. Jot down what you find — that's your baseline.",
        "coachingSmall": "That's okay. For now, just <strong>mention what you found</strong> in your next standup — no expectation of action yet. 'Here's what I noticed' is a valid first step.",
        "coachingNotReady": "No problem. <strong>Build your own view first:</strong> review the data yourself and note 2–3 patterns you see. You can decide later whether and how to involve your leads."
    },
    {
        "id": "schedule",
        "title": "Improve shift scheduling to reduce overtime and better match workload",
        "why": "Overtime often signals a scheduling mismatch hiding in plain sight. Fixing it reduces labour cost directly and gives your team leads a tangible project to own end-to-end.",
        "color": "amber",
        "process": "Pull last month's overtime hours by day and shift. Overlay it with your order volume curve to find the gaps.",
        "coaching": "Bring the data to your shift leads and ask: \"Where do you see the biggest gap, and what would you change first?\" Listen before you respond.",
        "processSmall": "Start with just <strong>last week's overtime log</strong>. Which two or three shifts stand out most? Note them down.",
        "coachingSmall": "Share the overtime data in your next team huddle with a simple question: \"Does this pattern surprise anyone?\" No pressure to solve it yet.",
        "coachingNotReady": "That's fine. Spend this week <strong>building your own view</strong> of the scheduling data. Having a clear picture yourself is the right foundation."
    },
    {
        "id": "flow",
        "title": "Smooth out bottlenecks to improve throughput and reduce idle time costs",
        "why": "Bottlenecks create hidden cost — idle labour, delayed orders, and overtime spikes. Mapping them with your team builds cross-lead ownership of the whole operation.",
        "color": "purple",
        "process": "Walk the floor during your peak hour and map where work stacks up. Time 3–5 handoffs to get hard numbers.",
        "coaching": "Do the floor walk with one team lead and ask them to narrate what they see. You observe — don't solve for them.",
        "processSmall": "Pick just <strong>one handoff point</strong> that feels slow and time it across five orders. That single data point is a strong start.",
        "coachingSmall": "No need to make it formal. Just <strong>ask one lead</strong> after a shift: \"Where did things feel slow today?\" One question, one conversation.",
        "coachingNotReady": "Understood. Do the floor walk solo this week. Take notes on what you see, and think about which lead you might involve when you feel ready."
    }
]

MOCK_DASHBOARD = {
    "metrics": {
        "cost_per_order": {"value": "$4.82", "delta": "+12% above target", "trend": "up_bad"},
        "coaching_actions": {"value": "3", "delta": "this week", "trend": "up_good"},
        "promotion_readiness": {"value": "62%", "delta": "↑ 8pts this month", "trend": "up_good"}
    },
    "cpo_trend": [
        {"week": "W1", "value": 5.10, "above": True},
        {"week": "W2", "value": 5.30, "above": True},
        {"week": "W3", "value": 5.00, "above": True},
        {"week": "W4", "value": 5.40, "above": True},
        {"week": "W5", "value": 4.90, "above": True},
        {"week": "W6", "value": 4.80, "above": False},
        {"week": "W7", "value": 4.50, "above": False},
        {"week": "W8", "value": 4.82, "above": True}
    ],
    "coaching_trend": [0, 1, 0, 2, 1, 3, 2, 3],
    "recent_actions": [
        {"text": "Completed cost per order diagnostic with Grow Coach", "time": "today"},
        {"text": "Shared order data in Monday standup", "time": "1 week ago"},
        {"text": "Ran rework root-cause review with shift leads", "time": "2 weeks ago"},
        {"text": "Mapped peak-hour bottlenecks on pick floor", "time": "3 weeks ago"},
        {"text": "Set Q2 goal: reduce CPO by 15%", "time": "4 weeks ago"}
    ],
    "promo_text": "Alex is showing consistent coaching behaviours — involving team leads in problem identification and root cause work. Two more completed coaching cycles will put Alex in a strong position for a promotion conversation in Q3. Keep the focus on making team leads the solution-finders, not just the executors.",
    "promo_readiness": 62
}


def score_focus(state):
    scores = {"errors": 0, "schedule": 0, "flow": 0}
    if state.get("errors") == "often":
        scores["errors"] += 3
    elif state.get("errors") == "sometimes":
        scores["errors"] += 1
    if state.get("schedule") == "mis":
        scores["schedule"] += 3
    if state.get("flow") == "freq":
        scores["flow"] += 2
    elif state.get("flow") == "some":
        scores["flow"] += 1
    if state.get("pain") == "errors":
        scores["errors"] += 2
    if state.get("pain") == "labor":
        scores["schedule"] += 2
    if state.get("pain") == "wait":
        scores["flow"] += 2
    if state.get("culture") == "follow":
        scores["errors"] += 1
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [next(f for f in FOCUSES if f["id"] == k) for k, _ in sorted_scores]


def compute_scores(state):
    op = 0.1
    pe = 0.1
    trend = state.get("trend", "")
    if trend == "stable":
        op += 0.15
    elif trend == "close":
        op += 0.25
    if state.get("errors") == "rare":
        op += 0.25
    elif state.get("errors") == "sometimes":
        op += 0.15
    if state.get("flow") == "smooth":
        op += 0.2
    elif state.get("flow") == "some":
        op += 0.1
    if state.get("schedule") == "mostly":
        op += 0.1
    culture = state.get("culture", "")
    if culture == "frequent":
        pe += 0.55
    elif culture == "sometimes":
        pe += 0.35
    elif culture == "follow":
        pe += 0.1
    if state.get("initiative") == "frequent":
        pe += 0.25
    elif state.get("initiative") == "some":
        pe += 0.15
    step = state.get("step", 0)
    if step >= 6:
        pe += 0.05
    if step >= 7:
        pe += 0.1
    return {
        "op": round(min(op, 1.0) * 100),
        "pe": round(min(pe, 1.0) * 100)
    }


# ─── ROUTES ──────────────────────────────────────────────────────────

@app.route("/")
def index():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
        session["coach_state"] = {}
    return render_template("index.html")


@app.route("/api/state", methods=["GET"])
def get_state():
    state = session.get("coach_state", {})
    scores = compute_scores(state)
    return jsonify({"state": state, "scores": scores})


@app.route("/api/state", methods=["POST"])
def update_state():
    data = request.get_json()
    state = session.get("coach_state", {})
    state.update(data)
    session["coach_state"] = state
    scores = compute_scores(state)
    return jsonify({"ok": True, "scores": scores})


@app.route("/api/focus", methods=["GET"])
def get_focus():
    state = session.get("coach_state", {})
    ordered = score_focus(state)
    idx = state.get("focus_idx", 0)
    focus = ordered[idx % len(ordered)]
    return jsonify({"focus": focus, "idx": idx, "total": len(ordered)})


@app.route("/api/focus/next", methods=["POST"])
def next_focus():
    state = session.get("coach_state", {})
    ordered = score_focus(state)
    idx = (state.get("focus_idx", 0) + 1) % len(ordered)
    state["focus_idx"] = idx
    session["coach_state"] = state
    focus = ordered[idx]
    return jsonify({"focus": focus, "idx": idx})


@app.route("/api/focus/confirm", methods=["POST"])
def confirm_focus():
    state = session.get("coach_state", {})
    ordered = score_focus(state)
    idx = state.get("focus_idx", 0)
    focus = ordered[idx % len(ordered)]
    state["confirmed_focus"] = focus
    state["step"] = 6
    session["coach_state"] = state
    scores = compute_scores(state)
    return jsonify({"ok": True, "focus": focus, "scores": scores})


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    return jsonify(MOCK_DASHBOARD)


@app.route("/api/summary", methods=["GET"])
def manager_summary():
    state = session.get("coach_state", {})
    focus = state.get("confirmed_focus") or (score_focus(state)[0] if state else FOCUSES[0])
    trend_labels = {
        "worse": "above target and worsening",
        "stable": "above target but stable",
        "close": "near target but not improving"
    }
    pain_labels = {
        "labor": "labour and overtime",
        "errors": "errors and rework",
        "transport": "transport and routing",
        "wait": "waiting and bottlenecks",
        "unsure": "multiple areas"
    }
    checkin = state.get("checkin", "1 week")
    summary = {
        "trend_label": trend_labels.get(state.get("trend", ""), "above target"),
        "pain_label": pain_labels.get(state.get("pain", ""), "operational costs"),
        "focus_title": focus.get("title", "process improvement") if focus else "process improvement",
        "process_task": focus.get("process", "") if focus else "",
        "coaching_task": focus.get("coaching", "") if focus else "",
        "checkin": "when Alex is ready" if checkin == "later" else checkin
    }
    return jsonify(summary)


@app.route("/api/reset", methods=["POST"])
def reset():
    session["coach_state"] = {}
    return jsonify({"ok": True})


if __name__ == "__main__":
    print("\n🌱 AI Grow Coach is running!")
    print("   Open your browser at: http://localhost:5000\n")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
