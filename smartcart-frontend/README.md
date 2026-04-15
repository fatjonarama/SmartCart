# SmartCart E-Commerce API

SmartCart është një aplikacion e-commerce i ndërtuar me teknologji moderne web.

## Teknologjitë

### Backend
- **Express.js** — Node.js framework
- **MySQL** + Sequelize ORM
- **MongoDB** + Mongoose ODM
- **JWT** — Authentication
- **Swagger/OpenAPI 3.0** — API Documentation
- **Winston + Morgan** — Logging
- **Helmet + Rate Limiting** — Security
- **node-cache** — Caching

### Frontend
- **React.js** — UI Framework
- **React Router** — Navigation
- **Axios** — HTTP Client
- **React Toastify** — Notifications

## Instalimi

### 1. Klono projektin
```bash
git clone https://github.com/YllkaBerisha11/SmartCart.git
cd SmartCart
```

### 2. Backend Setup
```bash
cd smartcart-backend
npm install
```

### 3. Krijo `.env` fajllin
```env
PORT=5000
JWT_SECRET=smartcart_jwt_secret_2024
DB_HOST=localhost
DB_NAME=smartcart
DB_USER=root
DB_PASS=
MONGO_URI=mongodb+srv://...
```

### 4. Frontend Setup
```bash
cd smartcart-frontend
npm install
npm start
```

### 5. Fillo serverin
```bash
cd smartcart-backend
node app.js
```

## API Endpoints

### Users `/api/v1/users`
| Method | Endpoint | Përshkrimi | Auth |
|--------|----------|------------|------|
| POST | /register | Regjistro user | Public |
| POST | /login | Login + JWT | Public |
| GET | /profile | Profili im | User |
| PUT | /profile | Përditëso profilin | User |
| GET | / | Të gjithë users | Admin |
| DELETE | /:id | Fshi user | Admin |

### Products `/api/v1/products`
| Method | Endpoint | Përshkrimi | Auth |
|--------|----------|------------|------|
| GET | / | Të gjitha produktet | Public |
| GET | /:id | Një produkt | Public |
| POST | / | Krijo produkt | Admin |
| PUT | /:id | Përditëso produkt | Admin |
| DELETE | /:id | Fshi produkt | Admin |

### Orders `/api/v1/orders`
| Method | Endpoint | Përshkrimi | Auth |
|--------|----------|------------|------|
| GET | / | Të gjitha orders | Admin |
| GET | /my | Orders e mia | User |
| GET | /:id | Një order | User/Admin |
| POST | / | Krijo order | User |
| PUT | /:id | Ndrysho status | Admin |
| DELETE | /:id | Fshi order | Admin |

### Stats `/api/v1/stats`
| Method | Endpoint | Përshkrimi | Auth |
|--------|----------|------------|------|
| GET | /overview | Statistikat | Admin |
| GET | /orders-by-month | Orders/muaj | Admin |
| GET | /users-by-role | Users/rol | Admin |

## Swagger Dokumentacion 
## Arkitektura
Sistemi përdor **MVC Architecture** me ndarje të qartë të shtresave:
- **Presentation Layer** — React.js Frontend
- **Business Logic Layer** — Express.js Routes + Middleware
- **Persistence Layer** — MySQL (Sequelize) + MongoDB (Mongoose)
- **Integration Layer** — JWT Auth + Swagger + Logging

## Siguria
- JWT Authentication me role-based authorization
- Helmet.js për HTTP security headers
- Rate Limiting — 100 kërkesa/15 minuta
- Joi Validation për të gjitha inputs
- bcryptjs për enkriptim të fjalëkalimeve

## Databaza

### MySQL Tables
- `users` — përdoruesit me role (user/admin)
- `products` — produktet me category dhe stock
- `orders` — porositë me status
- `orderitems` — artikujt e porosive

### MongoDB Collections
- `reviews` — vlerësimet e produkteve

## Ekipi
- **Yllka Berisha** — Full Stack Developer
- **Fatjona Rama** — Full Stack Developer