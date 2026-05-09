---
name: add-endpoint
description: Add a new FastAPI endpoint to the FloodGuard backend. Triggers when asked to add a route, create a new API, add a POST or GET handler, or extend the backend API surface.
---

# Skill: Add Endpoint

## Step 1 — Define the contract first

Before writing any Python, add the endpoint to `docs/api/ENDPOINTS.md`:
- HTTP method and path
- Request parameters or body schema
- Response schema (complete JSON example)
- Error codes it can return

Get this right first. The implementation must match the contract.

## Step 2 — Create models in the correct layer

In the appropriate `backend/<module>/models.py` (Types layer):

```python
from pydantic import BaseModel, Field

class NewRequest(BaseModel):
    field_name: str = Field(..., description="What this field is")
    numeric_field: float = Field(..., ge=0, le=100)

class NewResponse(BaseModel):
    result: str
    value: float
```

No logic in models. No I/O. Pydantic validation only.

## Step 3 — Implement the logic in the Repo layer

In `backend/<module>/engine.py`:

```python
def compute_new_thing(req: NewRequest) -> NewResponse:
    # Pure logic — no HTTP calls here
    ...
    return NewResponse(result=..., value=...)
```

If you need external data, it must be passed in as a parameter.
The engine function must be callable in tests with no network.

## Step 4 — Add the route in `backend/main.py` (Service layer)

```python
@app.post("/new-endpoint", response_model=NewResponse)
async def new_endpoint(req: NewRequest):
    # Fetch external data here if needed
    external_data = await fetch_something()
    # Pass to engine
    return compute_new_thing(req, external_data)
```

## Step 5 — Write the test

In `tests/<module>/test_new_endpoint.py`:

```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_new_endpoint_success():
    response = client.post("/new-endpoint", json={
        "field_name": "test",
        "numeric_field": 50.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "result" in data

def test_new_endpoint_validation_error():
    response = client.post("/new-endpoint", json={
        "numeric_field": 150.0  # over max
    })
    assert response.status_code == 422
```

## Step 6 — Add to `services/api.js` in frontend

```javascript
export async function callNewEndpoint(params) {
  const res = await fetch(`${BASE_URL}/new-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

## Step 7 — Run all checks

```bash
pytest tests/ -v
python scripts/check_layers.py
```
