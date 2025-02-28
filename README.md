# Ugo Mein Unterricht

A full-stack movie search application built with a NestJS backend and a React (Vite, TypeScript) frontend. The system pulls movie data from the OMDB API (for 2020 movies containing the word "space"), stores it in MongoDB, and provides a paginated, debounced search UI with responsive, modern styling using Tailwind CSS.

> **Note:**  
> This repository contains the **Backend** project for the full-stack solution.  
> There is a Frontend repository containing the code for the frontend project.


## Overview

This project demonstrates a robust, production-ready system that:

- **Backend:**  
  - Built with **NestJS** (TypeScript)  
  - Uses **Mongoose** for MongoDB integration, along with bulk upsert operations to efficiently store movie data  
  - Fetches movie data from the OMDB API 
  - Implements caching using `@nestjs/cache-manager` to reduce unnecessary database queries. I used cache-manager for this Proof of concept (POC) as it does not require a rigourous setup, it is recommended to use Redis when in production as it is more robust, scalable and supports cachin in a microservice architecture.
- **Containerization:**  
  - Both backend and MongoDB are containerized using **Docker** and orchestrated with **Docker Compose**

---

## Architecture

                                +---------------------------+
                                |      Client / Frontend    |
                                |  (HTTP REST API Requests) |
                                +-------------+-------------+
                                              |
                                              v
                                +-------------+-------------+
                                |     NestJS Application    |
                                |         (Backend)         |
                                +-------------+-------------+
                                              |
                                              | Global Modules
                                              | -------------------------
                                              |   ConfigModule          |
                                              |   CacheModule           | <-- Provides caching via @nestjs/cache-manager
                                              |   HttpModule            |
                                              |   MongooseModule        | <-- Connects to MongoDB
                                              +-------------+-------------+
                                                            |
                                                            v
                                +---------------------------+---------------------------+
                                |                Movies Module                        |
                                +---------------------------+---------------------------+
                                |                           |                           |
                                |  MoviesController         |     MoviesService         |
                                |  - Exposes REST endpoints | - Fetches OMDB data       |
                                |    (e.g., GET /movies)    |   using HttpService       |
                                |  - Uses ValidationPipe    | - Processes & filters     |
                                |  - Uses CacheInterceptor  |   data for duplicates     |
                                |                           | - Performs bulk upsert    |
                                |                           |   operations via Mongoose |
                                +-------------+-------------+-------------+-------------+
                                                                         |
                                                                         v
                                                             +-----------+-----------+
                                                             |   Mongoose (MongoDB)  |
                                                             |   - Movie Schema      |
                                                             |   - Text Indexes      |
                                                             +-----------+-----------+
                                                                         ^
                                                                         |
                                                                         |
                                                       +-----------------+-----------------+
                                                       |       External OMDB API         |
                                                       | - Provides movie data           |
                                                       |   (based on search criteria)    |
                                                       +---------------------------------+
                                              
                                              


- **Backend:**  
  Fetches and stores movie data from OMDB for movies from 2020 that include "space" in the title. It performs bulk upsert operations and uses a single environment variable to manage the MongoDB connection for both Docker and local setups.
- **Database:**  
  MongoDB stores movie data, accessible via Docker Compose (using the service name) or via localhost when running manually.

---

## Solution Details

- **Data Fetching & Storage:**  
  The backend fetches search results from OMDB and filters out movies already stored (using bulk operations) to avoid duplicates.
  
- **Caching & Optimization:**  
  Caching is implemented at the controller level using NestJS’s cache interceptor (via `@nestjs/cache-manager`). This reduces the number of database queries when serving frequent search requests. I used cache-manager for this Proof of concept (POC) as it does not require a rigourous setup, it is recommended to use Redis when in production as it is more robust, scalable and supports cachin in a microservice architecture.

- **Pagination:**  
  Supports paginated responses to search queries.

---

## Prerequisites

- **Docker & Docker Compose:** For containerized deployment.
- **Node.js (v20 or later):** For running backend.
- **npm or yarn:** Package manager.
- **MongoDB:** (If running locally outside Docker)

---

### Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/rockspetre/Ugo-MeinUnterricht-Backend.git
   cd Ugo-MeinUnterricht-Backend


Install dependencies:

```dotenv
npm install or yarn install
```

## Environment Variables

The application uses a single environment variable for the MongoDB connection, as well as the OMDB API key.

- **MONGO_URL**  
  - In Docker, set it to:  
    `mongodb://mongo:27017/movies`
  - When running locally, it is important to replace `mongo` with `localhost`.
  
- **OMDB_API_KEY** – Your OMDB API key.

Create a `.env` file at the project root (this file is used by both Docker and local setups):

```dotenv
MONGO_URL=mongodb://mongo:27017/movies
OMDB_API_KEY=your_omdb_api_key_here
```

To run the project use:
```
  npm run start:dev
```


