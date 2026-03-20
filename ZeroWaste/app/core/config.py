import os
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = "sekretny_klucz_tokenu_bardzo_bezpieczny_fr_fr_csssss_nikomu_nie_podawajcie"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480   #8H ważnosci tokenu