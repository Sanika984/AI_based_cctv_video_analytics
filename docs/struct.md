my-web-app/
├── .vscode/                      # VS Code workspace settings & debug launch configs
│   ├── launch.json
│   └── settings.json
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── api/                  # Route handlers / endpoints
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── users.py
│   │   │   │   │   └── items.py
│   │   │   │   └── api.py        # Combines v1 routers
│   │   ├── core/                 # Core configs, security, env settings
│   │   │   ├── config.py         # Pydantic BaseSettings
│   │   │   └── security.py       # JWT, password hashing
│   │   ├── crud/                 # Database CRUD operations
│   │   │   └── crud_item.py
│   │   ├── db/                   # Database session, base model
│   │   │   ├── session.py        # SQLAlchemy / async engine session
│   │   │   └── base.py
│   │   ├── models/               # ORM models (SQLAlchemy, Tortoise, SQLModel)
│   │   │   └── item.py
│   │   ├── schemas/              # Pydantic validation schemas (Request/Response)
│   │   │   └── item.py
│   │   ├── services/             # Third-party integrations, background jobs
│   │   └── main.py               # FastAPI entry point & CORS configuration
│   ├── tests/                    # Pytest test suite
│   ├── .env                      # Local environment variables
│   ├── .env.example
│   ├── requirements.txt          # or pyproject.toml / poetry.lock
│   └── Dockerfile
├── frontend/                     # React Frontend (Vite / Next.js)
│   ├── public/
│   ├── src/
│   │   ├── assets/               # Static images, icons, global styles
│   │   ├── components/           # Reusable UI components
│   │   │   ├── common/           # Button, Modal, Input, Spinner
│   │   │   └── layout/           # Navbar, Sidebar, Footer
│   │   ├── context/              # React Context (AuthContext, ThemeContext)
│   │   ├── hooks/                # Custom React hooks (useAuth, useDebounce)
│   │   ├── pages/                # Route views (Home, Dashboard, Login)
│   │   ├── services/             # API client & endpoint calls (Axios / Fetch)
│   │   │   ├── api.js            # Axios base instance with interceptors
│   │   │   └── itemService.js
│   │   ├── utils/                # Helper functions, formatters, constants
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml            # Multi-container local orchestration (optional)
├── .gitignore
└── README.md