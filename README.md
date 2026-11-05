# Wanderlust

Wanderlust is a full-stack accommodation marketplace where guests can discover and book stays, and hosts can manage their listings. It is built with Node.js, Express, MongoDB, and server-rendered EJS views.

## Features

- Browse accommodation listings and view listing details
- Create an account, sign in, and switch between guest and host roles
- Create, edit, and delete host listings
- Upload listing images to Cloudinary
- Book stays and view booking confirmations and booking history
- Leave reviews on listings
- Ask the Wanderlust AI chat agent travel and listing questions

## Tech stack

- **Server:** Node.js and Express 5
- **Views:** EJS and EJS-Mate
- **Database:** MongoDB with Mongoose
- **Authentication:** Passport Local and Passport Local Mongoose
- **Uploads:** Multer and Cloudinary
- **AI chat:** Google Generative AI

## Prerequisites

- Node.js 16.13 or later and npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- A Cloudinary account for listing image uploads
- A Google Generative AI API key for AI chat

## Getting started

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/aman74858/Wanderlust.git
   cd Wanderlust
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   Use `MONGO_URI` instead of `ATLASDB_URL` if you prefer that name. For a local MongoDB instance, for example:

   ```dotenv
   MONGO_URI=mongodb://127.0.0.1:27017/wanderlust
   ```

   Keep `.env` private; never commit real credentials. Cloudinary credentials are needed for listing image uploads, and `GEMINI_API_KEY` is needed for AI chat.

4. Start the server:

   ```bash
   node app.js
   ```

   Open [http://localhost:8080](http://localhost:8080). The server uses the `PORT` environment variable when provided, and otherwise listens on port `8080`.

## Project structure

```text
controllers/  Request handlers for listings, users, bookings, reviews, and chat
models/       Mongoose models
routes/       Express route definitions
services/     AI chat and application services
views/        EJS page templates and shared layout partials
public/       Stylesheets and browser-side JavaScript
utils/        Shared utilities and error handling
app.js        Express application entry point
cloudConfig.js Cloudinary upload configuration
```

## Deployment

Wanderlust is a server-rendered Node.js application and requires a running server and MongoDB database; GitHub Pages cannot host the application backend. Deploy it to a Node.js hosting service and configure the environment variables from the setup section in that service's settings. Set `PORT` only if your hosting provider requires it.

## Tests

No automated test suite is configured yet. The current `npm test` script is a placeholder and exits with an error.
