from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLIENT = (ROOT / "frontend" / "src" / "lib" / "client.ts").read_text()


def test_frontend_locked_to_studionet_61999():
    assert "61999" in CLIENT
    assert "0xF22F" in CLIENT
    assert "https://studio.genlayer.com/api" in CLIENT
    assert "https://explorer-studio.genlayer.com" in CLIENT
    assert "studionet" in CLIENT
    lowered = CLIENT.lower()
    assert "61997" not in lowered
    assert "studionet-dev" not in lowered
    assert "bradbury" not in lowered
