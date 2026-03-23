def test_get_phone_success(client):
    res = client.post("/auth/register", json={
        "username": "phoneuser",
        "email": "Phone123@example.com",
        "password": "Password!1",
        "phone": "+48123456789"
    })

    user_id = res.json()["id"]

    response = client.get(f"/users/{user_id}/phone_number")

    assert response.status_code == 200
    assert response.json()["phone_number"] == "+48123456789"


def test_get_phone_not_found(client):
    response = client.get("/users/999/phone_number")
    assert response.status_code == 404