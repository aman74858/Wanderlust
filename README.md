# 🌍 Wanderlust

### Explore Places, Discover Stays, and Share Travel Experiences.

Wanderlust is a full-stack accommodation marketplace where guests can discover and book stays, while hosts can create and manage their property listings. Built using Node.js, Express.js, MongoDB, and EJS, it provides a user-friendly platform for exploring travel destinations and managing accommodation bookings.

## 📸 Project Preview

<img width="100%" alt="Wanderlust Homepage" src="https://github.com/user-attachments/assets/6fd1165c-d6b1-434a-aae4-a2329335d069" />
<a> https://wanderlust-le4az2lqh-a-261c.vercel.app/listings </a>
## ✨ Features

- 🏡 **Browse Listings:** Explore accommodation listings and view detailed property information.
- 🔐 **User Authentication:** Register, log in, and securely manage user accounts.
- 👤 **User Roles:** Support for guest and host roles.
- ➕ **Listing Management:** Hosts can create, edit, and delete property listings.
- 🖼️ **Image Uploads:** Upload and manage listing images using Cloudinary.
- 📅 **Booking System:** Book stays and view booking confirmations and history.
- ⭐ **Reviews & Ratings:** Share experiences through listing reviews.
- 🤖 **AI Chat Assistant:** Ask travel-related and listing questions using the AI chat agent.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js 5 | Server and routing |
| EJS | Server-side rendering |
| EJS-Mate | EJS layouts and templates |
| MongoDB | Database |
| Mongoose | Database modeling |
| Passport.js | Authentication |
| Passport Local Mongoose | User authentication |
| Multer | File uploads |
| Cloudinary | Image storage |
| Google Generative AI | AI chat assistant |
| Bootstrap / CSS | User interface |

## 📋 Prerequisites

Before running the project, install:

- Node.js (16.13 or later)
- npm
- MongoDB or MongoDB Atlas account
- Cloudinary account
- Google Generative AI API key

## 🚀 Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/aman74858/Wanderlust.git
```

### 2. Navigate to the project folder

```bash
cd Wanderlust
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the root directory.

```env
PORT=8080
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

SECRET=your_session_secret

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

GEMINI_API_KEY=your_google_generative_ai_api_key
```

Replace the placeholder values with your actual credentials.

**Important:** Never upload your `.env` file or expose API keys, passwords, or database credentials on GitHub.

### 5. Start the application

```bash
npm start
```

Or run directly:

```bash
node app.js
```

Open your browser:

```text
http://localhost:8080
```

## 📁 Project Structure

```text
Wanderlust/
│
├── controllers/
│   ├── listing.js
│   ├── user.js
│   ├── review.js
│   ├── booking.js
│   └── chat.js
│
├── models/
│   ├── listing.js
│   ├── user.js
│   ├── review.js
│   └── booking.js
│
├── routes/
│   ├── listing.js
│   ├── user.js
│   ├── review.js
│   ├── booking.js
│   └── chat.js
│
├── views/
│   ├── layouts/
│   ├── listings/
│   ├── users/
│   └── includes/
│
├── public/
│   ├── css/
│   └── js/
│
├── utils/
├── services/
├── app.js
├── cloudConfig.js
├── package.json
├── package-lock.json
└── .gitignore
```

*Note: This structure represents the main project areas; actual filenames and folders may vary.*

## ☁️ Deployment

Wanderlust can be deployed using **Render** with MongoDB Atlas.

### Deployment configuration

| Setting | Value |
|---|---|
| Hosting | Render Web Service |
| Repository | GitHub |
| Runtime | Node.js |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Database | MongoDB Atlas |

Configure the required environment variables in Render's Environment settings.

## 🧪 Testing

Automated tests are not configured yet. The project can currently be tested manually by checking registration, login, listing management, image uploads, bookings, reviews, and AI chat functionality.

## 🔮 Future Improvements

- Online payment integration
- Advanced search and filtering
- Interactive maps and location-based search
- Improved booking management
- More AI-powered travel recommendations

## 👨‍💻 Author

**Mohammad Aman**

B.Tech Computer Science & Engineering

- GitHub: [@aman74858](https://github.com/aman74858)

## 📄 License

This project is developed for educational and portfolio purposes.

---

⭐ If you like this project, consider giving it a star on GitHub!
