# D-Care

*A dermatology case review platform for admins and doctors*

---

## Overview

**D-Care** is a web-based platform designed to streamline dermatology case management.
It provides separate interfaces for **Admins** and **Doctors**, making it easy to manage patient cases, assign reviews, and track verification history.

---

## Requirements

Before getting started, make sure you have:

* Node.js **v18+**
* pnpm **v9+**
* Firebase project credentials:

  * `FIREBASE_PROJECT_ID`
  * `FIREBASE_SERVICE_ACCOUNT` (base64 encoded)
* `AUTH_SECRET` for JWT authentication
* *(Optional)*

  * `DEFAULT_ADMIN_EMAIL`
  * `DEFAULT_ADMIN_PASSWORD`

---

## Setup Instructions

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure backend environment:
   Create a `.env` file inside `backend/` and add:

   ```
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_SERVICE_ACCOUNT=your_base64_key
   AUTH_SECRET=your_secret
   ```

3. Start backend server:

   ```bash
   cd backend
   pnpm dev
   ```

4. Run Admin app:

   ```bash
   pnpm dev:admin
   ```

5. Run Doctor app:

   ```bash
   pnpm dev:doctor
   ```

---

## Admin Console Features

* Manage patient cases (Create, Update, Delete)
* Assign cases to doctors
* Super Admin access:

  * Add / update / remove other admins
* View doctors and assigned cases

---

## Doctor Console Features

* View assigned patient cases
* Update and verify case details
* Submit verified cases
* View history of verified cases
* Update personal profile

---

## General Features

* Persistent login
* Patient data management
* Light / Dark theme support
* Dynamic header and navigation
* Responsive UI for smooth experience

---

## Project Structure

```
D-Care/
├── admin/      # Admin frontend
├── doctor/     # Doctor frontend
├── backend/    # API & authentication
├── styles/     # Shared styles
```

---

## Contribution

Feel free to fork and improve the project. Contributions are welcome!


