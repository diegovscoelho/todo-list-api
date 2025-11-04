# TODO-LIST-API

This is a simple RESTful API for managing a user's to-do list, built with Node.js and PostgreSQL. It includes user authentication (Registration and Login) using JWT and protected CRUD operations for managing tasks.

---

## Project URL

**https://github.com/diegovscoelho/todo-list-api**

---

## Features

* **User Authentication:** Registration and Login using JWT (JSON Web Tokens).
* **Secure Password Storage:** Passwords are hashed using `bcrypt`.
* **Authorization:** All TODO operations are protected and restricted to the logged-in user.
* **CRUD Operations:** Create, Read (with Pagination), Update, and Delete tasks.
* **Database:** PostgreSQL with relational design (Users 1:N Todos).

## Technical Stack

* **Backend:** Node.js, Express
* **Authentication:** `jsonwebtoken`, `bcrypt`
* **Database:** PostgreSQL (`pg` library)
* **Development Tools:** `dotenv`
