# Database Engineering API - Documentation

## 1. Project Purpose

Database Engineering API is a practical backend project built to demonstrate how a Node.js application can work with MongoDB through Mongoose.

The project focuses on database-oriented backend concepts rather than only basic CRUD.

It demonstrates:

- MongoDB connectivity
- Mongoose schemas and models
- CRUD operations
- Data validation
- Database indexes
- Text search
- Filtering
- Sorting
- Pagination
- Soft deletion
- Record restoration
- Seed data
- Environment configuration
- Centralized error handling
- Graceful shutdown

---

# 2. Technology Stack

## Node.js

Node.js runs the backend JavaScript application.

It is responsible for starting the server, executing application logic, communicating with MongoDB, and handling incoming API requests.

## Express

Express provides the HTTP server and routing layer.

It is used for:

- API routes
- middleware
- JSON request parsing
- HTTP responses
- error handling

## MongoDB

MongoDB is the database used by the application.

Instead of storing data in relational tables, MongoDB stores documents inside collections.

Products are stored inside the `products` collection.

## Mongoose

Mongoose provides a structured layer between Node.js and MongoDB.

It gives the project:

- schemas
- models
- validation
- indexes
- query APIs
- timestamps
- document operations

---

# 3. Application Architecture

The project separates responsibilities into focused folders.

```text
Client Request
      |
      v
Express Application
      |
      v
Route
      |
      v
Validator
      |
      v
Controller
      |
      v
Mongoose Model
      |
      v
MongoDB
```

A request such as:

```http
GET /api/v1/products
```

travels through the route and controller before Mongoose queries MongoDB.

The response then travels back to the client as JSON.

---

# 4. Project Structure

```text
database-engineering-api/
├── scripts/
│   └── seed.js
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── product.controllers.js
│   ├── middlewares/
│   │   ├── errorHandler.middleware.js
│   │   └── notFound.middleware.js
│   ├── models/
│   │   └── product.model.js
│   ├── routes/
│   │   └── product.routes.js
│   ├── validators/
│   │   └── product.validators.js
│   ├── app.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── requests.http
├── README.md
└── DOCUMENTATION.md
```

---

# 5. `src/server.js`

`server.js` is the application entry point.

Its responsibilities are deliberately limited to application startup and shutdown.

It:

1. loads environment variables
2. connects to MongoDB
3. starts the Express HTTP server
4. displays useful local URLs
5. listens for shutdown signals
6. closes resources before exiting

The API starts only after MongoDB connects successfully.

Conceptually:

```js
await connectDatabase();

server = app.listen(PORT);
```

This prevents the HTTP API from accepting database-dependent requests while the database is unavailable.

---

# 6. Graceful Shutdown

The application listens for:

```text
SIGINT
SIGTERM
```

`SIGINT` commonly occurs when the application is stopped using `Ctrl + C`.

Instead of immediately terminating the process, the application attempts to:

```text
Stop accepting HTTP connections
        |
        v
Close HTTP server
        |
        v
Close MongoDB connection
        |
        v
Exit process
```

This is called graceful shutdown.

It helps avoid abruptly terminating active resources.

---

# 7. `src/app.js`

`app.js` configures the Express application.

It is separate from `server.js` so application configuration and process startup do not become mixed together.

Important configuration includes:

```js
app.disable("x-powered-by");
```

This removes Express's default `X-Powered-By` response header.

JSON request parsing is enabled with:

```js
app.use(express.json());
```

This allows endpoints to receive JSON bodies such as:

```json
{
    "name": "Wireless Keyboard",
    "price": 2499
}
```

---

# 8. API Versioning

Product routes use:

```text
/api/v1/products
```

instead of only:

```text
/products
```

The `v1` segment represents version 1 of the API.

Versioned APIs make future API changes easier to manage without silently changing an existing public contract.

---

# 9. Root Endpoint

```http
GET /
```

This endpoint provides a lightweight confirmation that the application is running.

Example:

```json
{
    "success": true,
    "message": "Database Engineering API is running.",
    "version": "v1"
}
```

---

# 10. Health Endpoint

```http
GET /api/v1/health
```

The health endpoint exposes basic runtime information including:

- service name
- version
- process uptime
- timestamp

It provides a simple operational check without querying product data.

---

# 11. `src/config/database.js`

This module owns MongoDB connection management.

Mongoose connects using:

```js
mongoose.connect(mongoUri);
```

The URI is read from:

```text
MONGODB_URI
```

If one is not supplied, the local development database is used:

```text
mongodb://127.0.0.1:27017/database_engineering_api
```

Centralizing database connectivity means other modules do not need to know how the connection is established.

---

# 12. `.env` and `.env.example`

The local `.env` file contains runtime configuration.

Example:

```env
PORT=1198
MONGODB_URI=mongodb://127.0.0.1:27017/database_engineering_api
```

`.env` is listed inside `.gitignore`.

Therefore it should not be committed to Git.

`.env.example` contains the variables required to configure the application but does not need to contain private production credentials.

This allows another developer to understand which environment variables must be configured.

---

# 13. Product Schema

The main database model is:

```text
src/models/product.model.js
```

A product contains:

```text
name
description
category
price
inStock
deletedAt
createdAt
updatedAt
```

Mongoose provides `_id` automatically for every document.

A simplified product looks like:

```json
{
    "_id": "...",
    "name": "Wireless Keyboard",
    "description": "Compact wireless keyboard for everyday productivity.",
    "category": "Accessories",
    "price": 2499,
    "inStock": true,
    "deletedAt": null
}
```

---

# 14. Schema Validation

The Mongoose schema defines constraints close to the database model.

For example:

```js
price: {
    type: Number,
    required: true,
    min: 0
}
```

This means price:

- must exist
- must be numeric
- cannot be negative

Validation at the model layer provides another data-integrity boundary even when application validation already exists.

---

# 15. Automatic Timestamps

The schema uses:

```js
timestamps: true;
```

Mongoose therefore maintains:

```text
createdAt
updatedAt
```

automatically.

`createdAt` records when the document was created.

`updatedAt` changes when supported Mongoose update operations modify the document.

---

# 16. Database Indexes

Indexes help MongoDB locate and organize queried data more efficiently.

This project defines indexes for frequently queried fields such as:

```text
name
category
price
inStock
deletedAt
```

It also includes a compound index involving:

```text
category
price
deletedAt
```

This demonstrates how indexes can be designed around common query patterns instead of being added randomly.

Indexes have a cost because they consume storage and must also be maintained when documents change.

Therefore indexes should support real access patterns.

---

# 17. Text Search Index

The schema defines a text index over:

```text
name
description
```

This supports requests such as:

```http
GET /api/v1/products?search=keyboard
```

The controller converts the query into a MongoDB text search:

```js
filter.$text = {
    $search: search,
};
```

This demonstrates database-supported text searching rather than manually scanning JavaScript arrays.

---

# 18. Controllers

The product controller contains the request-handling logic for product operations.

It implements:

```text
getProducts
getProductById
createProduct
updateProduct
deleteProduct
restoreProduct
```

Routes determine which controller runs.

Controllers determine what database operation should occur and what HTTP response should be returned.

---

# 19. Creating Products

Endpoint:

```http
POST /api/v1/products
```

The request body is validated first.

The controller then creates the document using:

```js
Product.create(...)
```

A successful creation returns:

```text
201 Created
```

`201` is used because a new resource has been created.

---

# 20. Reading Products

All active products can be requested using:

```http
GET /api/v1/products
```

A single product is retrieved using:

```http
GET /api/v1/products/:id
```

MongoDB documents use ObjectIds, so the ID is validated before the database query executes.

---

# 21. Updating Products

Endpoint:

```http
PUT /api/v1/products/:id
```

The project uses:

```js
findOneAndUpdate();
```

The query also checks:

```js
deletedAt: null;
```

Therefore a soft-deleted product cannot be updated as though it were still active.

The option:

```js
new: true
```

returns the updated document.

The option:

```js
runValidators: true;
```

ensures Mongoose validation also runs during the update.

---

# 22. Soft Delete

A normal permanent delete could remove a document entirely.

This project demonstrates soft deletion instead.

Endpoint:

```http
DELETE /api/v1/products/:id
```

Rather than deleting the MongoDB document, the application sets:

```text
deletedAt = current date and time
```

The record therefore remains in the database.

Normal product queries exclude these records.

Soft deletion is useful when applications need:

- recovery
- historical records
- auditability
- accidental-deletion protection

---

# 23. Restoring Products

Soft-deleted products can be restored using:

```http
PATCH /api/v1/products/:id/restore
```

Restoration changes:

```text
deletedAt
```

back to:

```text
null
```

The product then becomes part of normal active-product queries again.

---

# 24. Searching

Example:

```http
GET /api/v1/products?search=keyboard
```

Search is implemented using MongoDB's text index over product names and descriptions.

---

# 25. Category Filtering

Example:

```http
GET /api/v1/products?category=Accessories
```

A case-insensitive exact-category regular expression is used.

This allows category values with different letter casing to match the same category.

---

# 26. Price Filtering

Example:

```http
GET /api/v1/products?minPrice=2000&maxPrice=7000
```

MongoDB comparison operators are used:

```text
$gte
$lte
```

`$gte` means greater than or equal to.

`$lte` means less than or equal to.

---

# 27. Stock Filtering

Example:

```http
GET /api/v1/products?inStock=true
```

The query-string value arrives as text.

The application converts it into a Boolean before building the MongoDB filter.

---

# 28. Sorting

Example:

```http
GET /api/v1/products?sort=price&order=asc
```

Supported sorting fields are deliberately restricted.

This prevents arbitrary client values from directly determining database sort fields.

The API supports:

```text
asc
desc
```

for ascending and descending order.

---

# 29. Pagination

Example:

```http
GET /api/v1/products?page=2&limit=5
```

Pagination uses:

```text
page
limit
skip
```

The skip amount is calculated as:

```text
(page - 1) × limit
```

For example:

```text
page = 3
limit = 10

skip = 20
```

MongoDB therefore skips the first 20 matching documents and retrieves the next 10.

The response includes metadata:

```json
{
    "page": 1,
    "limit": 10,
    "totalItems": 10,
    "totalPages": 1
}
```

---

# 30. Combined Queries

The API can combine multiple database operations.

Example:

```http
GET /api/v1/products?search=keyboard&category=Accessories&inStock=true&sort=price&order=asc&page=1&limit=10
```

This demonstrates how a single MongoDB filter can be constructed dynamically from multiple optional query parameters.

---

# 31. Request Validation

Validation middleware lives inside:

```text
src/validators/product.validators.js
```

Validation is performed before controllers execute.

It checks:

- MongoDB ObjectId format
- name
- description
- category
- price
- stock value
- price filters
- sort fields
- sort order
- pagination
- deleted-record options

This prevents obviously invalid input from unnecessarily reaching database logic.

---

# 32. Two Validation Layers

This project intentionally demonstrates validation at two levels.

## API Validation

Express middleware validates incoming HTTP requests.

## Database Model Validation

Mongoose validates data according to the schema.

The flow is:

```text
HTTP Request
    |
    v
Request Validator
    |
    v
Controller
    |
    v
Mongoose Validation
    |
    v
MongoDB
```

This provides clearer API errors while also protecting the data model.

---

# 33. 404 Middleware

Unknown routes eventually reach:

```text
notFound.middleware.js
```

Example:

```http
GET /api/v1/not-found
```

Response:

```json
{
    "success": false,
    "message": "Route not found."
}
```

Keeping this behavior centralized avoids duplicating route-not-found responses.

---

# 34. Centralized Error Handling

Unexpected application errors are forwarded using:

```js
next(error);
```

They eventually reach:

```text
errorHandler.middleware.js
```

The middleware understands several important Mongoose/MongoDB errors, including:

```text
CastError
ValidationError
duplicate key error
```

This converts lower-level database errors into cleaner HTTP responses.

---

# 35. Why `next(error)` Is Used

Controllers contain asynchronous database operations.

Instead of constructing an internal-server-error response inside every controller catch block, errors are forwarded:

```js
catch (error) {
    return next(error);
}
```

This keeps error-response behavior centralized.

---

# 36. Seed Data

The project includes:

```text
scripts/seed.js
```

Run:

```bash
npm run seed
```

The seed script:

1. connects to MongoDB
2. removes existing products
3. inserts predictable demonstration products
4. reports the number inserted
5. closes the database connection

Seed data makes development and API testing repeatable.

---

# 37. Why Seeding Clears Existing Products

The seed script uses:

```js
Product.deleteMany({});
```

before inserting demo records.

For this educational project, that means repeated seeding produces a predictable dataset rather than continually creating duplicates.

This command is destructive and is intended here for the project's local demonstration database.

---

# 38. `requests.http`

The project contains a ready-to-use HTTP request collection.

It demonstrates:

- root request
- health check
- product listing
- pagination
- search
- filters
- sorting
- creation
- retrieval by ID
- update
- soft delete
- restore
- invalid ID
- invalid input
- invalid query
- unknown route

This makes the backend testable directly from an HTTP-client-capable editor.

---

# 39. Important HTTP Status Codes

The API uses status codes according to the outcome.

```text
200 OK
Successful read, update, delete, or restore

201 Created
New product successfully created

400 Bad Request
Invalid client input

404 Not Found
Resource or route does not exist

409 Conflict
Conflicting database operation where applicable

500 Internal Server Error
Unexpected server failure
```

---

# 40. Security and Data Safety Decisions

Several small design decisions improve the API structure.

Express identification is disabled:

```js
app.disable("x-powered-by");
```

Environment configuration is separated from source code.

`.env` is excluded from Git.

Sort fields are allow-listed.

MongoDB IDs are validated before controller queries.

Input validation occurs before database operations.

Database operations use Mongoose APIs rather than constructing executable query strings from raw client input.

---

# 41. Why MongoDB Was Used

MongoDB fits this project because it allows database engineering concepts to be demonstrated using JavaScript-oriented documents and Mongoose.

The project shows that MongoDB development still requires deliberate decisions around:

- schema design
- validation
- indexes
- query construction
- pagination
- deletion strategy
- error handling

Using a NoSQL database does not remove the need for structured data engineering.

---

# 42. Local Development Flow

Install dependencies:

```bash
npm install
```

Ensure the MongoDB service is running.

Seed the database:

```bash
npm run seed
```

Start development mode:

```bash
npm run dev
```

The application uses:

```text
http://localhost:1198
```

The main products endpoint is:

```text
http://localhost:1198/api/v1/products
```

---

# 43. Request Lifecycle Example

Consider:

```http
GET /api/v1/products?category=Audio&sort=price&order=asc&page=1&limit=5
```

The request travels through:

```text
Express
   |
   v
product.routes.js
   |
   v
validateProductQuery
   |
   v
getProducts
   |
   v
Build MongoDB filter
   |
   v
Count matching documents
   |
   v
Query Product model
   |
   v
Sort + Skip + Limit
   |
   v
MongoDB
   |
   v
JSON response
```

This is one of the central flows demonstrated by the project.

---

# 44. Key Concepts Demonstrated

After studying this repository, the following concepts should be clear:

- connecting Node.js to MongoDB
- using Mongoose models
- defining schemas
- enforcing validation
- creating indexes
- building dynamic queries
- implementing CRUD
- implementing text search
- filtering data
- sorting results
- paginating results
- using MongoDB ObjectIds
- implementing soft deletion
- restoring deleted documents
- seeding development data
- separating routes and controllers
- using validation middleware
- centralizing error handling
- using environment variables
- gracefully shutting down backend resources

---

# 45. Summary

Database Engineering API is intentionally more than a basic CRUD example.

It demonstrates the complete path from:

```text
HTTP request
      |
      v
Validation
      |
      v
Controller logic
      |
      v
Mongoose
      |
      v
MongoDB
      |
      v
Structured HTTP response
```

The repository is designed to provide a compact but practical reference for building database-backed Node.js APIs with MongoDB and Mongoose.
