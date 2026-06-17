from flask import Flask, render_template, request, jsonify, session
import os
import uuid

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'grow-coach-dev-key-2024')

# ─── CPO FOCUS LIBRARY ───────────────────────────────────────────────
CPO_FOCUSES = [
    {
        "id": "errors",
        "title": "Reduce errors and rework by engaging your team leads as problem-solvers",
        "why": "Rework is one of the highest-cost, most fixable drivers — and solving it together with your team leads is exactly the coaching behaviour that gets you promoted to Operations Manager.",
        "color": "teal",
        "process": "Sample last week's orders, count rework cases, and list the top 2–3 root causes.",
        "coaching": "Share your findings with your two main shift leads and ask: \"What experiment would you try?\" Your role is to ask questions, not hand them the answer.",
        "processSmall": "Start smaller: pull just <strong>10 orders from last week</strong> and check them for any error. Jot down what you find — that's your baseline.",
        "coachingSmall": "That's okay. For now, just <strong>mention what you found</strong> in your next standup — no expectation of action yet. 'Here's what I noticed' is a valid first step.",
        "coachingNotReady": "No problem. <strong>Build your own view first:</strong> review the data yourself and note 2–3 patterns. You can decide later whether and how to involve your leads."
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

# ─── CULTURE FOCUS LIBRARY ───────────────────────────────────────────
CULTURE_FOCUSES = [
    {
        "id": "voice",
        "title": "Create a safe space for team leads to surface ideas and problems",
        "why": "When team leads don't speak up, it's usually because they've learned that speaking up doesn't change anything — or feels risky. One structured conversation this week can begin to change that pattern.",
        "color": "purple",
        "action": "Run a 15-minute 'what's in the way?' conversation with your team leads in your next huddle. Ask: 'What's one thing that slows you down that I could help remove?' Write every answer on the board. Don't respond — just listen and capture.",
        "coaching": "After the huddle, pick ONE item from the list and act on it visibly within 48 hours. Tell your leads what you did: 'You said X was a problem — I changed Y.' This closes the loop and shows speaking up has impact.",
        "actionSmall": "Too big for a group? Start 1-on-1. Ask just one of your leads: 'What's one thing that gets in your way that I could fix?' One question. One person. That's enough for this week.",
        "coachingSmall": "Skip the follow-through action for now. Just run the listening session and send a brief message afterwards: 'Thanks for sharing — I'm thinking about what you said.' Acknowledgement alone builds trust."
    },
    {
        "id": "ownership",
        "title": "Give a team lead real ownership of an improvement project",
        "why": "Coaching culture isn't built through conversations alone — it's built when leads experience what it feels like to own something, make decisions, and see the results. A small delegation done well is worth ten coaching chats.",
        "color": "teal",
        "action": "Identify one small, bounded improvement project and formally hand it to one team lead this week. Say: 'This is yours to solve. Come to me when you need a decision above your level.'",
        "coaching": "Schedule a 10-minute check-in with them mid-week. Ask only questions: 'What's your plan? What have you tried? What's getting in the way?' Resist giving answers. Your job is to help them think, not think for them.",
        "actionSmall": "Not ready to delegate a whole project? Give them a <strong>single decision</strong> instead: 'You choose how we handle X this week — I'll back whatever you decide.'",
        "coachingSmall": "Skip the formal check-in. Just notice this week if the lead takes any initiative on their own without being asked, and if so, <strong>name it out loud</strong>: 'I noticed you sorted that yourself — that's exactly what I want to see more of.'"
    },
    {
        "id": "feedback",
        "title": "Build a regular rhythm of feedback between you and your team leads",
        "why": "Most leads don't know how they're really doing until something goes wrong. A short, consistent feedback loop changes that — and signals that you're invested in their growth, not just their output.",
        "color": "amber",
        "action": "Introduce a brief end-of-week check-in with each team lead (10 minutes). Structure it simply: 'One thing that went well, one thing to work on, one thing I can do differently for you.'",
        "coaching": "When a lead shares something they want to work on, resist the urge to coach immediately. Instead ask: 'What do you think you'd do differently next time?' Let them generate the answer first.",
        "actionSmall": "Weekly is too much right now? Try it with <strong>just one lead</strong> this week as a test. Keep it to 5 minutes. If it feels useful, you can expand it.",
        "coachingSmall": "Skip the structured format. This week, just find one moment to say to a lead: 'That thing you did on Tuesday — that was good, and here's why.' Specific, genuine positive feedback is a strong foundation."
    }
]

# ─── PROMOTION FOCUS LIBRARY ─────────────────────────────────────────
PROMO_FOCUSES = [
    {
        "id": "evidence",
        "title": "Build a concrete evidence file of your operational impact",
        "why": "Promotion decisions are made on evidence, not impressions. Most strong candidates lose ground because they can't point to specific numbers and outcomes — not because they haven't done the work.",
        "color": "amber",
        "action": "Create a simple doc with three sections: (1) metrics I've moved — before/after numbers, (2) problems I've solved — situation, what I did, result, (3) people I've developed — what each lead can do now that they couldn't before. Spend 30 minutes filling in what you already know.",
        "evidence": "In your next 1-on-1 with your manager, share one specific example from your evidence file — not as self-promotion, but as a progress update: 'I've been tracking the impact of the changes we made to X. Here's what I'm seeing.' Make your work visible.",
        "actionSmall": "Too broad? Start with just <strong>one metric</strong> you've influenced in the last 90 days. Write the before number, the after number, and two sentences about what you did. That's your first evidence entry.",
        "evidenceSmall": "Not ready to share with your manager yet? Share it with a trusted peer or mentor first for feedback. Getting comfortable articulating your impact is the skill — the audience can come later."
    },
    {
        "id": "gaps",
        "title": "Close the most visible gap between your current role and Operations Manager",
        "why": "Promotion isn't about doing your current job perfectly — it's about demonstrating that you're already operating at the next level in at least one or two visible ways. One closed gap outweighs ten completed tasks.",
        "color": "teal",
        "action": "Identify the single biggest gap between how you work today and how an Operations Manager operates. Common ones: cross-functional thinking, financial fluency, developing people who develop others, influencing without authority. Write it down, then identify one concrete thing you could do this month to close it visibly.",
        "evidence": "Once you've identified your gap, tell your manager what you're working on: 'I've been thinking about what it takes to step into an Operations Manager role. I think my biggest development area is X — here's what I'm doing about it.' Naming your own gaps signals maturity and self-awareness.",
        "actionSmall": "Can't identify your own gap clearly? Ask your manager directly: 'What's the one thing you'd most want to see me develop before I'm ready for the next level?' That conversation itself is a signal of readiness.",
        "evidenceSmall": "Not ready to have that conversation yet? Ask a trusted peer who's been promoted, or review a job description for Operations Manager and note which bullets feel least comfortable. That's your gap list."
    },
    {
        "id": "visibility",
        "title": "Increase your visibility with decision-makers above your direct manager",
        "why": "Promotions are rarely decided by one person. Senior leaders need to recognise your name and associate it with impact before they'll advocate for you. Visibility isn't political — it's a practical part of career progression.",
        "color": "purple",
        "action": "Identify one opportunity in the next 30 days to present something — a result, a problem you solved, an idea — to an audience that includes someone above your direct manager. A team meeting, a safety review, a project update. Prepare 3 minutes of clear, data-backed content.",
        "evidence": "After any interaction with a senior leader, send a brief follow-up: 'Thanks for the time today — here's the one-pager on what we discussed.' It keeps you in mind and shows follow-through. One follow-up after one interaction is a meaningful step.",
        "actionSmall": "Not ready for a presentation? Start by <strong>contributing one insight</strong> in a meeting where senior leaders are present. A single well-framed observation — 'The data shows X, which suggests we should consider Y' — is visible without being high-stakes.",
        "evidenceSmall": "Instead of a written follow-up, just make a point of introducing yourself clearly in the next cross-functional meeting: name, role, and one sentence about what your team is working on. Being known is the prerequisite to being considered."
    }
]


# ─── SCORING ─────────────────────────────────────────────────────────

def score_cpo_focus(state):
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
    return [next(f for f in CPO_FOCUSES if f["id"] == k) for k, _ in sorted_scores]


def score_culture_focus(state):
    scores = {"voice": 0, "ownership": 0, "feedback": 0}
    barrier  = state.get("barrier", "")
    style    = state.get("style", "")
    freq     = state.get("idea_freq", "")
    decision = state.get("decision_style", "")

    if barrier == "voice":       scores["voice"]     += 4
    elif barrier == "ownership": scores["ownership"] += 4
    elif barrier == "feedback":  scores["feedback"]  += 4

    if style == "directive":       scores["ownership"] += 2; scores["feedback"] += 1
    elif style == "handsoff":      scores["voice"]     += 2; scores["feedback"] += 1
    elif style == "inconsistent":  scores["feedback"]  += 2; scores["voice"]    += 1

    if freq == "never":            scores["voice"] += 2
    elif freq == "rarely":         scores["voice"] += 1; scores["ownership"] += 1

    if decision == "always_me":    scores["ownership"] += 2
    elif decision == "sometimes":  scores["ownership"] += 1

    blocker = state.get("blocker", "")
    if blocker == "trust":   scores["ownership"] += 2
    elif blocker == "time":  scores["feedback"]  += 1; scores["voice"] += 1
    elif blocker == "skills": scores["feedback"] += 2

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [next(f for f in CULTURE_FOCUSES if f["id"] == k) for k, _ in sorted_scores]


def score_promo_focus(state):
    scores = {"evidence": 0, "gaps": 0, "visibility": 0}
    timeline    = state.get("timeline", "")
    blocker     = state.get("promo_blocker", "")
    feedback    = state.get("manager_feedback", "")
    track       = state.get("track_record", "")
    senior      = state.get("senior_visibility", "")

    # Timeline urgency — closer = evidence and gaps more urgent
    if timeline == "6months":
        scores["evidence"]   += 3
        scores["gaps"]       += 2
    elif timeline == "12months":
        scores["evidence"]   += 2
        scores["gaps"]       += 2
        scores["visibility"] += 1
    elif timeline == "18months":
        scores["gaps"]       += 2
        scores["visibility"] += 2

    # Primary blocker drives the focus
    if blocker == "no_evidence":   scores["evidence"]   += 4
    elif blocker == "gaps":        scores["gaps"]       += 4
    elif blocker == "not_visible": scores["visibility"] += 4
    elif blocker == "no_convo":    scores["evidence"]   += 2; scores["gaps"] += 2

    # Manager feedback signals
    if feedback == "not_discussed":  scores["gaps"]       += 2; scores["evidence"] += 1
    elif feedback == "positive":     scores["visibility"] += 3
    elif feedback == "needs_work":   scores["gaps"]       += 3
    elif feedback == "mixed":        scores["evidence"]   += 2; scores["gaps"]      += 1

    # Track record — if weak, evidence is more urgent
    if track == "strong":    scores["visibility"] += 2
    elif track == "mixed":   scores["evidence"]   += 2
    elif track == "unclear": scores["evidence"]   += 3

    # Senior visibility
    if senior == "none":    scores["visibility"] += 3
    elif senior == "some":  scores["visibility"] += 1
    elif senior == "good":  scores["evidence"]   += 1; scores["gaps"] += 1

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [next(f for f in PROMO_FOCUSES if f["id"] == k) for k, _ in sorted_scores]


def compute_scores(state):
    op = 0.1
    pe = 0.1
    flow_type = state.get("flow_type", "cpo")

    if flow_type == "cpo":
        trend = state.get("trend", "")
        if trend == "stable":   op += 0.15
        elif trend == "close":  op += 0.25
        if state.get("errors") == "rare":       op += 0.25
        elif state.get("errors") == "sometimes": op += 0.15
        if state.get("flow") == "smooth":  op += 0.2
        elif state.get("flow") == "some":  op += 0.1
        if state.get("schedule") == "mostly": op += 0.1

    elif flow_type == "culture":
        freq = state.get("idea_freq", "")
        if freq == "often":  op += 0.3
        elif freq == "rarely": op += 0.15
        decision = state.get("decision_style", "")
        if decision == "usually_them": op += 0.25
        elif decision == "sometimes":  op += 0.15
        if state.get("step", 0) >= 5: op += 0.1

    elif flow_type == "promo":
        # Promotion flow: op reflects the strength of their track record
        track = state.get("track_record", "")
        if track == "strong":  op += 0.4
        elif track == "mixed": op += 0.2
        senior = state.get("senior_visibility", "")
        if senior == "good":   op += 0.2
        elif senior == "some": op += 0.1
        if state.get("step", 0) >= 5: op += 0.1

    # People & coaching bar
    culture = state.get("culture", "")
    if culture == "frequent":   pe += 0.55
    elif culture == "sometimes": pe += 0.35
    elif culture == "follow":    pe += 0.1

    if flow_type == "culture":
        style = state.get("style", "")
        if style == "coach":        pe += 0.2
        elif style == "inconsistent": pe += 0.1
        if state.get("barrier", ""): pe += 0.1
        if state.get("step", 0) >= 4: pe += 0.1
        if state.get("step", 0) >= 6: pe += 0.15

    elif flow_type == "promo":
        # Promo flow — pe reflects how much they've developed their people
        feedback = state.get("manager_feedback", "")
        if feedback == "positive":     pe += 0.3
        elif feedback == "mixed":      pe += 0.15
        elif feedback == "needs_work": pe += 0.05
        if state.get("step", 0) >= 4: pe += 0.15
        if state.get("step", 0) >= 6: pe += 0.15

    else:
        if state.get("initiative") == "frequent": pe += 0.25
        elif state.get("initiative") == "some":   pe += 0.15
        if state.get("step", 0) >= 6: pe += 0.05
        if state.get("step", 0) >= 7: pe += 0.1

    return {
        "op": round(min(op, 1.0) * 100),
        "pe": round(min(pe, 1.0) * 100)
    }


MOCK_DASHBOARD = {
    "metrics": {
        "cost_per_order":      {"value": "$4.82", "delta": "+12% above target",  "trend": "up_bad"},
        "coaching_actions":    {"value": "3",      "delta": "this week",          "trend": "up_good"},
        "promotion_readiness": {"value": "62%",    "delta": "↑ 8pts this month", "trend": "up_good"}
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
        {"text": "Completed promotion readiness diagnostic",           "time": "today"},
        {"text": "Ran coaching culture diagnostic with Grow Coach",    "time": "3 days ago"},
        {"text": "Delegated handoff improvement project to Lead #2",   "time": "1 week ago"},
        {"text": "Completed cost per order diagnostic",                "time": "2 weeks ago"},
        {"text": "Set Q2 goal: reduce CPO by 15%",                    "time": "3 weeks ago"}
    ],
    "promo_text": "Alex is building a strong case for Operations Manager. Evidence of operational impact is growing, coaching culture is developing, and senior visibility is increasing. The next 90 days should focus on making impact visible to decision-makers and closing the most prominent skill gap.",
    "promo_readiness": 62
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
    flow_type = state.get("flow_type", "cpo")
    if flow_type == "culture":
        ordered = score_culture_focus(state)
    elif flow_type == "promo":
        ordered = score_promo_focus(state)
    else:
        ordered = score_cpo_focus(state)
    idx = state.get("focus_idx", 0)
    focus = ordered[idx % len(ordered)]
    return jsonify({"focus": focus, "idx": idx, "total": len(ordered)})


@app.route("/api/focus/next", methods=["POST"])
def next_focus():
    state = session.get("coach_state", {})
    flow_type = state.get("flow_type", "cpo")
    if flow_type == "culture":
        ordered = score_culture_focus(state)
    elif flow_type == "promo":
        ordered = score_promo_focus(state)
    else:
        ordered = score_cpo_focus(state)
    idx = (state.get("focus_idx", 0) + 1) % len(ordered)
    state["focus_idx"] = idx
    session["coach_state"] = state
    return jsonify({"focus": ordered[idx], "idx": idx})


@app.route("/api/focus/confirm", methods=["POST"])
def confirm_focus():
    state = session.get("coach_state", {})
    flow_type = state.get("flow_type", "cpo")
    if flow_type == "culture":
        ordered = score_culture_focus(state)
    elif flow_type == "promo":
        ordered = score_promo_focus(state)
    else:
        ordered = score_cpo_focus(state)
    idx = state.get("focus_idx", 0)
    focus = ordered[idx % len(ordered)]
    state["confirmed_focus"] = focus
    state["step"] = 6
    session["coach_state"] = state
    return jsonify({"ok": True, "focus": focus, "scores": compute_scores(state)})


@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    return jsonify(MOCK_DASHBOARD)


@app.route("/api/summary", methods=["GET"])
def manager_summary():
    state = session.get("coach_state", {})
    flow_type = state.get("flow_type", "cpo")
    checkin = state.get("checkin", "1 week")
    checkin_label = "when Alex is ready" if checkin == "later" else checkin

    if flow_type == "culture":
        focus = state.get("confirmed_focus") or (score_culture_focus(state)[0] if state else CULTURE_FOCUSES[0])
        style_labels = {
            "directive": "tends to direct rather than coach",
            "handsoff":  "gives lots of autonomy but limited feedback",
            "inconsistent": "is inconsistent in coaching approach",
            "coach": "is actively building a coaching approach"
        }
        return jsonify({
            "flow_type":     "culture",
            "style_label":   style_labels.get(state.get("style", ""), "is developing their coaching style"),
            "focus_title":   focus.get("title", "") if focus else "",
            "action_task":   focus.get("action", "") if focus else "",
            "coaching_task": focus.get("coaching", "") if focus else "",
            "checkin":       checkin_label
        })

    elif flow_type == "promo":
        focus = state.get("confirmed_focus") or (score_promo_focus(state)[0] if state else PROMO_FOCUSES[0])
        timeline_labels = {
            "6months":  "targeting promotion in approximately 6 months",
            "12months": "targeting promotion in approximately 12 months",
            "18months": "targeting promotion in approximately 18 months",
            "exploring": "exploring what promotion readiness looks like"
        }
        feedback_labels = {
            "positive":      "has received positive signals from their manager",
            "needs_work":    "has been told there are areas to develop first",
            "mixed":         "has received mixed signals",
            "not_discussed": "has not yet had an explicit promotion conversation"
        }
        return jsonify({
            "flow_type":      "promo",
            "timeline_label": timeline_labels.get(state.get("timeline", ""), "targeting promotion in the next 12–18 months"),
            "feedback_label": feedback_labels.get(state.get("manager_feedback", ""), ""),
            "focus_title":    focus.get("title", "") if focus else "",
            "action_task":    focus.get("action", "") if focus else "",
            "evidence_task":  focus.get("evidence", "") if focus else "",
            "checkin":        checkin_label
        })

    else:
        focus = state.get("confirmed_focus") or (score_cpo_focus(state)[0] if state else CPO_FOCUSES[0])
        return jsonify({
            "flow_type":    "cpo",
            "trend_label":  {"worse": "above target and worsening", "stable": "above target but stable", "close": "near target but not improving"}.get(state.get("trend", ""), "above target"),
            "pain_label":   {"labor": "labour and overtime", "errors": "errors and rework", "transport": "transport and routing", "wait": "waiting and bottlenecks", "unsure": "multiple areas"}.get(state.get("pain", ""), "operational costs"),
            "focus_title":  focus.get("title", "") if focus else "",
            "process_task": focus.get("process", "") if focus else "",
            "coaching_task": focus.get("coaching", "") if focus else "",
            "checkin":      checkin_label
        })


@app.route("/api/reset", methods=["POST"])
def reset():
    session["coach_state"] = {}
    return jsonify({"ok": True})


if __name__ == "__main__":
    print("\n🌱 AI Grow Coach is running!")
    print("   Open your browser at: http://localhost:5000\n")
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
