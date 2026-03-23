def get_token(client):
    client.post("/auth/register", json={
        "username": "updateuser",
        "email": "update@example.com",
        "password": "Password!1"
    })

    res = client.post("/auth/login-json", json={
        "email": "update@example.com",
        "password": "Password!1"
    })

    return res.json()["access_token"]


def test_update_phone(client):
    token = get_token(client)

    response = client.patch(
        "/users/me/phone",
        json={"phone": "+48999999999"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["phone"] == "+48999999999"


def test_update_phone_no_auth(client):
    response = client.patch(
        "/users/me/phone",
        json={"phone": "+48999999999"}
    )

    assert response.status_code == 401