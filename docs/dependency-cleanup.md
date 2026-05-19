# Backend Dependency Cleanup

The backend package file should only keep packages that are required by the current implemented system.

## Cleanup Command

Run this command from the project root:

```bash
cd backend
npm uninstall crypto nodemailer twilio
```

This updates both `package.json` and `package-lock.json` safely.

## Why This Helps

- The current password reset flow uses a demo reset PIN.
- Real email and SMS delivery are not part of the current submitted system.
- `crypto` is already available in Node.js.
- Removing unused dependencies makes the repository cleaner and easier to justify in viva.

## Check After Cleanup

```bash
npm install
npm run dev
```

Then test the API health endpoint in Postman:

```text
GET http://127.0.0.1:5000/api/health
```
