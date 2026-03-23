def test_register_user_success(client):
    response = client.post("/auth/register", json={
        "username": "testuser1",
        "email": "test1@example.com",
        "password": "Password!1",
        "phone": "+48123456789"
    })

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test1@example.com"


def test_register_duplicate(client):
    payload = {
        "username": "testuser2",
        "email": "test2@example.com",
        "password": "Password!1"
    }

    client.post("/auth/register", json=payload)
    response = client.post("/auth/register", json=payload)

    assert response.status_code == 400