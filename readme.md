# Secure File Sharing Application

## Project Overview

This project aims to develop a **secure file-sharing web application** that enables users to upload, download, and share files with stringent security measures. It showcases full-stack development expertise and adherence to cybersecurity best practices.

---

## Core Features

### 1. User Authentication and Authorization
- **Registration, Login, and Logout:** 
  Users can securely register, log in, and log out of the system.
- **Multi-Factor Authentication (MFA):**
  Implemented MFA using **TOTP (Time-based One-Time Password)** for enhanced login security.
- **Role-Based Access Control (RBAC):**
  - **Admin:** Manage all users and files.
  - **Regular User:** Upload, download, and share files.
  - **Guest:** View shared files with limited access.

### 2. File Upload and Encryption
- **File Uploads:** Users can securely upload files.
- **Encryption at Rest:**
  Files are encrypted using **AES-256** server-side, ensuring they remain secure even if accessed directly.
- **Client-Side Encryption:** Files are also encrypted on the client side before upload.
- **Decryption:** Files can be decrypted securely by authorized users.

### 3. File Sharing with Access Control
- Users can share files with specific users, assigning permissions such as:
  - **View Only**
  - **Download Access**
  - Users can revoke permissions or update access dynamically.
- ** Shareable Links:** 
  - Secure links with expiration times can be generated for temporary file sharing.
  - Shareable links automatically expire after a set time(60 mins)
  



## Tech Stack

- **Front-End Framework:** React with **Next.js**
- **Client-Side Encryption:** Files are encrypted using the Web Crypto API before upload.
- **Authentication:** JWT-based with support for MFA (using any TOTP based app like Google Authenticator) integrated during login.
- **Back-End Framework:** Django with Django Rest Framework (DRF).
- **Database:** SQLite.
- **Encryption:**
  - **AES-256 for Files at Rest:** Server-side encryption ensures files remain secure.
  - **RSA for Key Management:** Server-side key management ensures secure encryption/decryption processes.
- **Access Control:** 
  RBAC implemented to manage file access levels.

---

## Security Measures
- **SSL/TLS:** Configured to ensure HTTPS traffic with self-signed certificates for local development.
- **Password Security:** Passwords are hashed using **Argon2** before being stored.
---


### Steps
1. **Clone the Repository**
   ```bash
       git clone https://github.com/keshavkrishna/secure-file-share.git
       cd secure-file-share
       docker-compose up --build
    ```
2. **Access the Application**
- Front-End: http://localhost:3000
- Back-End: https://127.0.0.1:8000

