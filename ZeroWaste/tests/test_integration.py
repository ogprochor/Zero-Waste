import requests
import random
import string

BASE_URL = "http://127.0.0.1:8080"

def random_string(n=6):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))

def test_full_user_flow():
    #Generowanie unikalnego użytkownika
    suffix = random_string()
    username = f"testuser_{suffix}"
    email = f"{username}@example.com"
    password = "A2345678!"

    #Rejestracja
    register_data = {
        "username": username,
        "email": email,
        "password": password
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    assert r.status_code == 201, f"Rejestracja nie powiodła się: {r.text}"

    #Logowanie
    login_data = {
        "username": email,
        "password": password
    }
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    assert r.status_code == 200, f"Logowanie nie powiodło się: {r.text}"
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    #Pobranie category_id (bierzemy pierwszą kategorię z backendu)
    r = requests.get(f"{BASE_URL}/categories")
    assert r.status_code == 200, f"Nie udało się pobrać kategorii: {r.text}"
    categories = r.json()
    assert len(categories) > 0, "Brak dostępnych kategorii w bazie"
    category_id = categories[0]["id"]

    #Dodanie oferty
    offer_data = {
        "title": "Testowa oferta",
        "description": "Opis testowy",
        "price": 100,
        "category_id": category_id
    }
    r = requests.post(f"{BASE_URL}/offers", json=offer_data, headers=headers)
    assert r.status_code == 201, f"Nie udało się dodać oferty: {r.text}"
    offer_id = r.json()["id"]

    #Edycja oferty
    update_data = {
        "title": "Zaktualizowana oferta",
        "description": "Zaktualizowany opis",
        "price": 150,
        "category_id": category_id
    }
    r = requests.put(f"{BASE_URL}/offers/{offer_id}", json=update_data, headers=headers)
    assert r.status_code == 200, f"Nie udało się edytować oferty: {r.text}"
    assert r.json()["title"] == "Zaktualizowana oferta"

    #Usunięcie oferty
    r = requests.delete(f"{BASE_URL}/offers/{offer_id}", headers=headers)
    assert r.status_code == 200, f"Nie udało się usunąć oferty: {r.text}"

    #Sprawdzenie braku autoryzacji po wylogowaniu
    r = requests.get(f"{BASE_URL}/offers")
    assert r.status_code == 200, "GET /offers zwrócił nieoczekiwany kod"
    assert r.json()["total"] == 0, "Niepoprawne sprawdzenie braku autoryzacji: nie jest pusta lista"