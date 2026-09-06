# Admin Authentication

This project uses secure, bcrypt-hashed passwords for administrator accounts.
For security, passwords are:
- Never stored in plaintext
- Never exposed to the client
- Never logged
- Rate-limited against brute-force attacks

## Local Development & Bootstrap

When setting up the project locally for the first time, or if you need to reset the local admin password, use the provided bootstrap script.

**Note: This script is restricted to non-production environments to prevent accidental credential resets.**

### Step-by-step Setup / Reset:

1. Open your `.env.local` file.
2. Set the `INITIAL_ADMIN_PASSWORD` variable to your desired local password. (Do not commit this file).
3. Ensure `MONGODB_URI` is correctly pointing to your local database.
4. Run the bootstrap command:
   ```bash
   npm run admin:bootstrap
   ```
5. The script will securely hash the password provided in `.env.local` using `bcrypt` and update the local MongoDB database.
6. You can now log in at `/admin/login/` using the password you configured.

*Once the account is created, normal logins only check the securely hashed value in the database.*
