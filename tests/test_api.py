from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_lists_debates_and_filters_live() -> None:
    response = client.get("/api/debates", params={"status": "live"})
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert all(item["status"] == "live" for item in response.json())


def test_searches_by_tag() -> None:
    response = client.get("/api/debates", params={"search": "economics"})
    assert response.status_code == 200
    assert response.json()[0]["id"] == 4


def test_votes_on_live_debate() -> None:
    before = client.get("/api/debates/1").json()["side_a"]["votes"]
    response = client.post("/api/debates/1/vote", json={"side": "a"})
    assert response.status_code == 200
    assert response.json()["side_a"]["votes"] == before + 1


def test_rejects_vote_on_finished_debate() -> None:
    response = client.post("/api/debates/4/vote", json={"side": "a"})
    assert response.status_code == 409
