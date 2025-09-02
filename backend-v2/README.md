# E-commerce Order System - Backend v2

A modern, professional e-commerce order management system built with FastAPI, SQLAlchemy, and PostgreSQL. Features strict user isolation, role-based access control, and comprehensive API documentation.

## Features

- **FastAPI Framework**: Modern, fast, and async Python web framework
- **SQLAlchemy ORM**: Database operations with async support
- **User Authentication**: JWT-based authentication with role management
- **Role-Based Access Control**: Customer, Vendor, and Admin roles
- **Strict User Isolation**: Users can only access their own orders
- **Professional Logging**: Structured logging with daily rotation
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Database Migrations**: Alembic for schema management
- **Environment Configuration**: Pydantic settings with validation
- **CORS Support**: Configurable cross-origin resource sharing
- **Health Checks**: Service monitoring endpoints

## Architecture

```
backend-v2/
├── app/
│   ├── api/                 # API routes and dependencies
│   │   ├── dependencies.py  # FastAPI dependencies
│   │   └── routes/         # Route modules
│   ├── core/               # Core configuration and utilities
│   │   ├── config.py       # Application settings
│   │   ├── database.py     # Database configuration
│   │   ├── logging.py      # Logging setup
│   │   └── security.py     # Authentication utilities
│   ├── models/             # SQLAlchemy ORM models
│   │   ├── base.py         # Base model mixins
│   │   ├── user.py         # User model
│   │   └── order.py        # Order models
│   ├── schemas/            # Pydantic request/response models
│   │   ├── common.py       # Common schemas
│   │   ├── user.py         # User schemas
│   │   └── order.py        # Order schemas
│   └── services/           # Business logic layer
│       ├── auth_service.py # Authentication service
│       ├── user_service.py # User management
│       └── order_service.py# Order management
├── logs/                   # Application logs (auto-created)
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL (or SQLite for development)
- Redis (optional, for caching)

### Installation

1. **Clone and navigate to backend-v2**:
   ```bash
   cd backend-v2
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database and security settings
   ```

5. **Run the application**:
   ```bash
   python main.py
   ```

The API will be available at `http://localhost:8000` with documentation at `http://localhost:8000/docs`.

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/ecommerce_db

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# CORS
CORS_ORIGINS=["http://localhost:3000"]
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh access token

### Orders
- `POST /api/orders/` - Create new order
- `GET /api/orders/my` - Get current user's orders
- `GET /api/orders/` - Get all orders (vendor/admin)
- `GET /api/orders/{id}` - Get order by ID
- `PUT /api/orders/{id}` - Update order
- `PATCH /api/orders/{id}/status` - Update order status
- `DELETE /api/orders/{id}` - Cancel order

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/` - List users (admin)
- `GET /api/users/search` - Search users (admin)

### Health
- `GET /health/` - Health check endpoint

## User Roles

### Customer
- Create and manage own orders
- View own order history
- Update profile information

### Vendor
- View all orders
- Update order status
- Manage order fulfillment

### Admin
- Full system access
- User management
- System monitoring

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access**: Granular permission system
- **User Isolation**: Strict data separation between users
- **Input Validation**: Pydantic schemas for request validation
- **CORS Protection**: Configurable cross-origin policies

## Database Models

### User
- Authentication and profile information
- Role-based access control
- Timestamps and UUID primary keys

### Order
- Customer and shipping information
- Order status tracking
- User association for isolation

### OrderItem
- Individual products in orders
- Pricing and quantity tracking
- Product information storage

## Development

### Running Tests
```bash
pytest
```

### Database Migrations
```bash
# Generate migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

### Code Quality
```bash
# Format code
black app/

# Type checking
mypy app/

# Linting
flake8 app/
```

## Deployment

### Docker
```bash
# Build image
docker build -t ecommerce-api .

# Run container
docker run -p 8000:8000 ecommerce-api
```

### Production Considerations
- Use PostgreSQL for production database
- Configure proper SECRET_KEY
- Set ENVIRONMENT=production
- Use reverse proxy (nginx)
- Enable SSL/TLS
- Configure logging aggregation
- Set up monitoring and alerts

## Logging

Structured logging with daily rotation:
- Console output for development
- File output with rotation
- JSON format for production
- Contextual information for debugging

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details.
