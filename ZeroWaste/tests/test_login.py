def test_login_success(client):
    client.post("/auth/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "Password!1"
    })

    response = client.post("/auth/login-json", json={
        "email": "login@example.com",
        "password": "Password!1"
    })

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_fail(client):
    response = client.post("/auth/login-json", json={
        "email": "wrong@example.com",
        "password": "wrong"
    })

    assert response.status_code == 400