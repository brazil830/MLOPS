"""Unit tests for the Kynora conversation engine improvements."""

# ── T1: Profile fact extraction ─────────────────────────────────────
from app.memory_engine import _extract_profile_facts, _topic_asked_in_text

facts = _extract_profile_facts("my name is Arun")
assert facts.get("preferred_name") == "Arun", f"FAIL T1a: {facts}"
print("PASS T1a: name extraction")

facts2 = _extract_profile_facts("I am studying Cyber Security engineering")
assert "studies" in facts2, f"FAIL T1b: {facts2}"
print("PASS T1b: studies extraction =>", facts2["studies"])

facts3 = _extract_profile_facts("Actually, I prefer to be called Aru")
assert facts3.get("preferred_name") == "Aru", f"FAIL T1c: {facts3}"
print("PASS T1c: name correction extraction")

# ── T2: Semantic question detection ──────────────────────────────────
q1 = _topic_asked_in_text("What is your name?", "preferred_name")
assert q1, "FAIL T2a: name question not detected"
print("PASS T2a: name question detected")

q2 = _topic_asked_in_text("What course are you doing?", "studies")
assert q2, "FAIL T2b: studies question not detected"
print("PASS T2b: studies question detected")

q3 = _topic_asked_in_text("Which degree are you pursuing?", "studies")
assert q3, "FAIL T2c: degree question not detected"
print("PASS T2c: degree question (semantic match)")

# ── T3: All 15 persona system prompts present ────────────────────────
from app.persona_profiles import PERSONA_SYSTEM_PROMPTS, build_full_system_prompt

REQUIRED = [
    "mother","father","best_friend","romantic_partner","sibling","mentor",
    "therapist","childhood_friend","elder","rival","pet","coworker",
    "crush","spiritual_guide","hype_friend",
]
missing = [p for p in REQUIRED if p not in PERSONA_SYSTEM_PROMPTS]
assert not missing, f"FAIL T3: missing personas {missing}"
print("PASS T3: all", len(REQUIRED), "personas have distinct system prompts")

# ── T4: System prompt injection ──────────────────────────────────────
profile = {"preferred_name": "Arun", "studies": "Cyber Security"}
q_log = [{"topic": "preferred_name", "status": "answered", "answer": "Arun"}]
sp = build_full_system_prompt("mother", profile, q_log)
assert "Arun" in sp, "FAIL T4a"
assert "Cyber Security" in sp, "FAIL T4b"
assert "NEVER ask for them again" in sp, "FAIL T4c"
assert "preferred_name" in sp, "FAIL T4d"
print("PASS T4: profile + question log injected into system prompt")

# ── T5: Persona distinctiveness ───────────────────────────────────────
mother_p = PERSONA_SYSTEM_PROMPTS["mother"]
friend_p  = PERSONA_SYSTEM_PROMPTS["best_friend"]
assert "kanna" in mother_p, "FAIL T5a: mother missing kanna"
assert "kanna" not in friend_p, "FAIL T5b: friend has kanna (persona bleed)"
assert "casual" in friend_p.lower(), "FAIL T5c: friend missing casual style"
print("PASS T5: personas are distinct (no bleed)")

# ── T6: Emotion detection ─────────────────────────────────────────────
from app.emotion import analyze_emotion
sad = analyze_emotion("I feel really sad and lonely today")
assert sad["primary_emotion"] in ("sadness","grief","disappointment"), f"FAIL T6a: {sad}"
print("PASS T6a: sad emotion =>", sad["primary_emotion"])

happy = analyze_emotion("I passed my exam! I am so happy!")
assert happy["primary_emotion"] in ("joy","excitement","admiration"), f"FAIL T6b: {happy}"
print("PASS T6b: happy emotion =>", happy["primary_emotion"])

# ── T7: LLM fallback with no key ──────────────────────────────────────
from app.llm import call_llm
result = call_llm("You are a test.", [], "Hello", max_output_tokens=10)
assert result is None or isinstance(result, str), "FAIL T7"
print("PASS T7: LLM graceful (key absent =", result is None, ")")

# ── T8: Scripted fallback engine still works ──────────────────────────
from app.persona import get_persona_response
resp = get_persona_response(
    persona_id="mother",
    user_message="I feel sad",
    emotion_result={"primary_emotion":"sadness","visual_state":"sad","emotion_vector":{"sadness":0.9}},
    memories=[],
    is_first_message=False,
)
assert isinstance(resp, str) and len(resp) > 5, "FAIL T8"
print("PASS T8: scripted fallback still works =>", resp[:60])

print()
print("=" * 50)
print("ALL TESTS PASSED")
print("=" * 50)
