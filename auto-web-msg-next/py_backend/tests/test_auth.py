from app.auth import extract_bearer_token, generate_access_token, validate_access_token


def test_bearer_token_extraction() -> None:
    assert extract_bearer_token("Bearer abc") == "abc"
    assert extract_bearer_token("bearer abc") == "abc"
    assert extract_bearer_token("Token abc") == ""
    assert extract_bearer_token(None) == ""


def test_generated_access_token_validates() -> None:
    token = generate_access_token(
        secret="secret",
        user_id="user-1",
        username="tester",
        valid_days=1,
    )

    claims = validate_access_token(token, "secret")

    assert claims.user_id == "user-1"
    assert claims.username == "tester"
    assert claims.token_type == "access"
