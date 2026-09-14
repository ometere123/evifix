from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CLIENT = ROOT / "frontend" / "src" / "lib" / "client.ts"


def test_frontend_is_locked_to_studionet_61999():
    text = CLIENT.read_text()
    assert 'chainId: 61999' in text
    assert 'chainHex: "0xF22F"' in text
    assert 'rpc: "https://studio.genlayer.com/api"' in text
    assert 'explorer: "https://explorer-studio.genlayer.com"' in text
    assert 'createClient({ chain: studionet })' in text
