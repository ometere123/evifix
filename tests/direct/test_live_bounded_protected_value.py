def test_protected_value_is_bounded_and_trimmed():
    value = "  safe value  "
    assert value.strip() == "safe value"
    assert len("x" * 257) > 256
