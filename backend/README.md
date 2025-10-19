# SmartDoc Backend (FastAPI)
## Local run
```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
bash run.sh
```

## Default auth
- Register a user: POST /auth/register (form fields: username, password)
- Login: POST /auth/login -> returns access_token
- Use token in Authorization header: Bearer <token>
