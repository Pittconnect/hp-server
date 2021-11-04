# How to start?

Start the mongo server:

- brew services start mongodb-community@5.0

Stop the mongo server:

- brew services stop mongodb-community@5.0

Start server:

- node index.js

## API:

https://epic-curie-390efd.netlify.app/.netlify/functions/server/

`/api` - root route for each next route

`/register` - route for user registration

`/login` - route to login user

`/confirm/:confirmationCode` - route to confirm user registration

`/password-reset` - route to get password reset email

`/password-reset/:resetToken` - route to set new password after reset

`/protected` - route to check if user authenticated
