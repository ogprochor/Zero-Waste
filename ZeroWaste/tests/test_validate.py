import pytest

@pytest.mark.parametrize("phone", [
    "+48123456789",
    "48123456789",
    "1234567"
])
def test_valid_phone(client, phone):
    safe_phone = phone.replace("+", "")

    response = client.post("/auth/register", json={
        "username": f"user{safe_phone}",
        "email": f"user{safe_phone}@test.com",
        "password": "Password!1",
        "phone": phone
    })

    assert response.status_code == 201


@pytest.mark.parametrize("phone", [
    "abc123",
    "+48 123 456",
    "123",
    "+12345678901234567890"
])
def test_invalid_phone(client, phone):
    response = client.post("/auth/register", json={
        "username": f"user{phone}",
        "email": f"{phone}@test.com",
        "password": "Password!1",
        "phone": phone
    })

    assert response.status_code in (400, 422)