# Absent Tracker (Documentation)

## Dependencies

* Node.JS (install via the Node.JS download website, <https://nodejs.org/en/download>)
* If you are downloading the system without the `node_modules` file, you can install all node modules with the following commands:
    1. `npm install express`
    2. `npm install jsonwebtoken`
    3. `npm install url`
    4. `npm install path`
    5. `npm install fs`

## Execution

**NOTE:** To run the absent tracker system, you must first have all dependencies installed on your system.

### Steps

* Open your terminal
* Copy the path to the directory of the project
* Back in your terminal, run the command `cd [PROJECT_DIRECTORY]` (replacing `PROJECT_DIRECTORY` with the actual directory)
* Then, run the command `npm run dev` to run the server
* When running, a `database.sqlite` file will be created. It is highly recommended that you backup that file, as it will save all user info.

## Use Overview

The product is designed for ease of use. As such, usage is very simple and highly optimized:

* You can go to the `.env` file, and you should see the variables:
    1. HR_FNAME
    2. HR_LNAME
    3. HR_PASSWORD
* Edit these before execution to set the HR credentials (**NOTE:** If you run the system before setting these, you should be able to access a user setting menu in the dashboard allowing you to edit the HR account variables, however you can also stop the system, delete the `database.sqlite` file, and restart the system. **WARNING:** Restarting the system is dangerous, and will remove all user data)
* When running, the system will print out a link in the terminal. Click that link to access the website
* Once open, type your HR credentials to access the HR account
* In the HR account you can add new accounts, edit accounts, and other functionalities.
* If you add a faculty / staff account, that account dashboard will have a form to request days off, in which they can insert the name of the supervisor which the request will be sent to.
* If you add a supervisor account, that account will also have a form to request days, and a section in which they can approve any requests to take days off from other users, which will then be forwarded to the HR account
* HR and all supervisors can see any requests they have approved / denied

## System Overview

### Database

The system uses SQLite to store all user data:
    *The database uses two seperate tables: users storing all user data (i.e. passwords, names, days left) and requests, storing all requests sent to that account
    * The database is initialized in the `db.js` file:
        1. If no `database.sqlite` file is found, it automatically creates a new database and links it to the `database.sqlite` file (this database is automatically loaded with the HR user from the `.env` credentials)
        2. If found, the database is simply loaded from the file

### Execution Timeline

* The `server.js` file is executes
    1. The program creates a new express website on the port in the `.env` file
    2. The program defines the login route and the index redirection to login
    3. The program configures the express middleware to accept json and manage cookies
    4. The program sets up the authentication routes, which redirect to the `authRoutes.js` file, and the user routes to the `userRoutes.js` file, and sets up the user routes to use the `authMiddleware.js` middleware
* When a hit on the login endpoint is recieved, the server serves up the `login.html` file
    1. This file automatically redirects to the dashboard once the login form is submitted via a simple redirection
* When a hit on the `auth/login` route is found, the system checks if a user with the provided credentials exists:
    1. If not, the user is redirected to the user not found page
    2. Otherwise, a JWT is generated and attatched to the cookies, and user is redirected to the user dashboard with the id in the queries
* When a hit on the `user/dashboard` is found, the system responds with seperate page responses based on the user type:
    1. If the user is not a supervisor or HR, they are sent the normal dashboard (`dashboard.html`):
        a. This dashboard includes a header of user data, and a form to take days off
    2. If the user is a supervisor they are sent the supervisor dashboard (`super-dashboard.html`):
        a. This dashboard includes all features of the normal dashboard with an added section to manage requests
    3. If the user is HR, they are sent the HR dashboard (`hr-dashboard.html`):
        a. This dashboard includes a data header, request manager, form to create a new user, and section to manage users
    4. For all of these the server quickly scans the file for certian data markers, replacing them with actual data from the database, before sending off the file
* When a hit on the `user/send-request` endpoint is found, the server simply reads the data from the request and generates a request based of the data which is inserted into the requests table
* When a hit on the `user/user-verify` endpoint is found, one of two things happens:
    1. If the attatched data contains an id to a request, the request is pulled up (which should only be a request to take days), and the request is executed:
        a. The days are removed from the linked user
        b. The request in the requests table is marked as complete
    2. Otherwise, depending on the request (add a user, change a users data, delete a user) the request is fullfilled based on the attatched data

### Code standards

* No recursive functions or unbounds loops:
    1. `for` loops are allowed, as they have a bound (the length of the provided data)
    2. `while` loops are not allowed unless they have definite bounds (i.e., a while loop that increments a value `x` until it no longer satisfies the criteria `x < n` is allowed, however a while loop which checks a condition based on a fluid dataset is not allowed)
    3. Any recursive functions are not allowed, as they are unbound
* No `var` keywords:
    1. Firstly, avoid using mutable data types unless absolutely necessary for security and efficiency
    2. If you need a mutable variable, use the `let` keyword instead
    3. `var` variables are automatically hoisted to the point in which they are first referenced: this can cause unintended functionalities, and will not throw undeclared errors
* Implement comprehensive error handling in any scenario in which there is a potential for errors
* Minimize normalized errors as much as possible unless absolutely necessary
* No classes:
    1. Functional programming is more efficient, more readable, and aligns closer to the express endpoint function order
* Always add semicolons at the end of every line:
    1. Not adding semicolons will lead to JS automatically inserting semicolons, which may lead to unintended consequences
* All variable / function names should use the camelCase convention (i.e. myVar)
* All variables in the `.env` section, or global variables should be all upercase (i.e. MY_GLOBAL)
* Ensure comments are prevolent, and meaningful:
    1. do not explain the syntax of a line, explain the impact of the line
* Ensure functions are reusable
* Make all variable names meaningful and concise
* Only use `async` labels when absolutely necessary
* Use hardcoded values listed at the top of the file
* Use REST test coverage
* Make commit names meaningful
* Ensure all security information is protected via `.gitignore`
