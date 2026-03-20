import requests
import random
import string

BASE_URL = "http://127.0.0.1:8080"

def random_string(n=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))

def create_user():
    """Tworzy nowego użytkownika i zwraca email, password"""
    suffix = random_string()
    username = f"testuser_{suffix}"
    email = f"{username}@example.com"
    password = "A2345678!"
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    assert r.status_code == 201, f"Rejestracja nie powiodła się: {r.text}"
    return email, password

def login_user(email, password):
    """Loguje użytkownika i zwraca headers z tokenem"""
    r = requests.post(f"{BASE_URL}/auth/login", data={
        "username": email,
        "password": password
    })
    assert r.status_code == 200, f"Logowanie nie powiodło się: {r.text}"
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_jwt_security():
    #Tworzymy użytkownika właściciela oferty
    email_owner, password_owner = create_user()
    headers_owner = login_user(email_owner, password_owner)

    #Tworzymy kategorię do oferty 
    r = requests.get(f"{BASE_URL}/categories")
    assert r.status_code == 200
    category_id = r.json()[0]["id"]

    #Tworzymy ofertę
    offer_data = {
        "title": "Oferta JWT",
        "description": "Test JWT",
        "price": 50,
        "category_id": category_id
    }
    r = requests.post(f"{BASE_URL}/offers", json=offer_data, headers=headers_owner)
    assert r.status_code == 201
    offer_id = r.json()["id"]

    #Próba użycia nieważnego tokena
    bad_headers = {"Authorization": "Bearer invalidtoken123"}
    r = requests.put(f"{BASE_URL}/offers/{offer_id}", json={"title": "Zmiana"}, headers=bad_headers)
    assert r.status_code == 401, f"Nieważny token nie został odrzucony: {r.text}"

    #Próba użycia zmodyfikowanego tokena
    # bierzemy prawidłowy token i zmieniamy jeden znak
    token_mod = headers_owner["Authorization"].split()[1][::-1]  # odwrócony token
    r = requests.put(f"{BASE_URL}/offers/{offer_id}", json={"title": "Zmiana"}, headers={"Authorization": f"Bearer {token_mod}"})
    assert r.status_code == 401, f"Zmodyfikowany token nie został odrzucony: {r.text}"

    #Próba bez tokena
    r = requests.put(f"{BASE_URL}/offers/{offer_id}", json={"title": "Zmiana"})
    assert r.status_code == 401, f"Brak tokena nie został odrzucony: {r.text}"

    #Próba edycji przez innego użytkownika (nie-właściciela)
    email_other, password_other = create_user()
    headers_other = login_user(email_other, password_other)
    r = requests.put(f"{BASE_URL}/offers/{offer_id}", json={"title": "Zmiana"}, headers=headers_other)
    assert r.status_code == 403, f"Nie-właściciel mógł edytować ofertę: {r.text}"

    #Sprzątanie: usunięcie oferty właścicielem
    r = requests.delete(f"{BASE_URL}/offers/{offer_id}", headers=headers_owner)
    assert r.status_code == 200