import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


# ─── FIXTURE : Client FastAPI ──────────────────────────────────────────────────
@pytest.fixture
def client():
    """Client de test FastAPI — mocke la config Groq pour éviter les vraies requêtes."""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.groq_api_key = "fake-key-for-tests"
        with patch("app.agent.code_agent.client") as mock_groq:
            mock_groq.chat.completions.create.return_value = _make_groq_response("")
            from app.main import app
            yield TestClient(app)


# ─── FIXTURE : Réponse Groq simulée ───────────────────────────────────────────
def _make_groq_response(content: str):
    """Construit un objet réponse Groq simulé."""
    mock_response = MagicMock()
    mock_response.choices[0].message.content = content
    return mock_response


@pytest.fixture
def mock_groq_client():
    """Mock du client Groq injectable dans les tests."""
    with patch("app.agent.code_agent.client") as mock_client:
        yield mock_client


@pytest.fixture
def groq_response_factory():
    """Factory pour créer des réponses Groq avec différents contenus."""
    def _factory(content: str):
        return _make_groq_response(content)
    return _factory


# ─── FIXTURE : Réponse fullstack complète ─────────────────────────────────────
@pytest.fixture
def fullstack_raw_response():
    return """
### SQL
```sql
CREATE TABLE produits (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prix DECIMAL(10,2)
);
INSERT INTO produits (nom, prix) VALUES ('Laptop', 999.99);
```

### MODEL
```javascript
const pool = new Pool({ user: process.env.DB_USER });
const getAll = async () => pool.query('SELECT * FROM produits');
module.exports = { getAll };
```

### CONTROLLER
```javascript
const model = require('./model');
const getAll = async (req, res) => {
    const result = await model.getAll();
    res.json(result.rows);
};
module.exports = { getAll };
```

### ROUTES
```javascript
const router = require('express').Router();
const ctrl = require('./controller');
router.get('/', ctrl.getAll);
module.exports = router;
```

### FRONTEND
```jsx
import React, { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export default function App() {
    return <div style={styles.container}><h1>Produits</h1></div>;
}
const styles = { container: { background: '#111' } };
```

EXPLICATION: Application CRUD complète pour la gestion des produits.
"""


@pytest.fixture
def frontend_raw_response():
    return """
### FRONTEND
```jsx
import React from 'react';
export default function App() {
    return <div style={styles.container}><h1>Mon App</h1></div>;
}
const styles = { container: { background: '#111' } };
```

EXPLICATION: Interface frontend React.
"""


@pytest.fixture
def backend_raw_response():
    return """
### SQL
```sql
CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));
INSERT INTO users (name) VALUES ('Alice');
```

### MODEL
```javascript
const getAll = async () => pool.query('SELECT * FROM users');
module.exports = { getAll };
```

### CONTROLLER
```javascript
const getAll = async (req, res) => res.json([]);
module.exports = { getAll };
```

### ROUTES
```javascript
const router = require('express').Router();
router.get('/', require('./controller').getAll);
module.exports = router;
```

EXPLICATION: Backend Node.js + PostgreSQL.
"""