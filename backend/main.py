from datetime import datetime, timezone
from threading import Lock
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class Side(BaseModel):
    label: str
    speaker: str
    votes: int = Field(ge=0)


class Debate(BaseModel):
    id: int
    question: str
    category: str
    status: Literal["live", "upcoming", "ended"]
    audience: int = Field(ge=0)
    time_label: str
    description: str
    tags: list[str]
    side_a: Side
    side_b: Side


class VoteRequest(BaseModel):
    side: Literal["a", "b"]


DEBATES: dict[int, Debate] = {
    1: Debate(
        id=1,
        question="Should artificial intelligence be regulated by governments?",
        category="Technology",
        status="live",
        audience=2847,
        time_label="12:48 remaining",
        description="Two leading voices unpack who should set the rules for the technology shaping our future.",
        tags=["AI", "Policy", "Ethics"],
        side_a=Side(label="Regulate now", speaker="Dr. Maya Chen", votes=1842),
        side_b=Side(label="Let innovation lead", speaker="Alex Rivera", votes=1421),
    ),
    2: Debate(
        id=2,
        question="Is remote work better for society?",
        category="Culture",
        status="live",
        audience=1534,
        time_label="28:16 remaining",
        description="A spirited discussion about flexibility, community, and the future of the office.",
        tags=["Work", "Society"],
        side_a=Side(label="Remote first", speaker="Jamie Park", votes=963),
        side_b=Side(label="Office matters", speaker="Sam Wilson", votes=841),
    ),
    3: Debate(
        id=3,
        question="Will electric vehicles solve the climate crisis?",
        category="Climate",
        status="upcoming",
        audience=892,
        time_label="Starts in 42 min",
        description="Beyond the hype: experts weigh transport electrification against wider systemic change.",
        tags=["Climate", "Transport"],
        side_a=Side(label="A vital solution", speaker="Nora Okafor", votes=0),
        side_b=Side(label="Not nearly enough", speaker="Theo Martin", votes=0),
    ),
    4: Debate(
        id=4,
        question="Should college education be free for everyone?",
        category="Education",
        status="ended",
        audience=4218,
        time_label="Ended yesterday",
        description="Educators and economists debate access, opportunity, and who should foot the bill.",
        tags=["Education", "Economics"],
        side_a=Side(label="Make it free", speaker="Priya Shah", votes=2712),
        side_b=Side(label="Target support", speaker="Marcus Reed", votes=2034),
    ),
}

app = FastAPI(title="Podium API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
vote_lock = Lock()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/debates", response_model=list[Debate])
def list_debates(
    status: Literal["all", "live", "upcoming", "ended"] = "all",
    search: str = Query(default="", max_length=100),
) -> list[Debate]:
    debates = list(DEBATES.values())
    if status != "all":
        debates = [debate for debate in debates if debate.status == status]
    if search:
        needle = search.casefold()
        debates = [
            debate
            for debate in debates
            if needle in debate.question.casefold()
            or needle in debate.category.casefold()
            or any(needle in tag.casefold() for tag in debate.tags)
        ]
    return debates


@app.get("/api/debates/{debate_id}", response_model=Debate)
def get_debate(debate_id: int) -> Debate:
    debate = DEBATES.get(debate_id)
    if debate is None:
        raise HTTPException(status_code=404, detail="Debate not found")
    return debate


@app.post("/api/debates/{debate_id}/vote", response_model=Debate)
def cast_vote(debate_id: int, vote: VoteRequest) -> Debate:
    debate = DEBATES.get(debate_id)
    if debate is None:
        raise HTTPException(status_code=404, detail="Debate not found")
    if debate.status != "live":
        raise HTTPException(status_code=409, detail="Voting is only open for live debates")
    with vote_lock:
        selected_side = debate.side_a if vote.side == "a" else debate.side_b
        selected_side.votes += 1
    return debate
