# Login With Plex
Allows your app to authenticate users with Plex (similar to OAuth2 authorization_code)

### Install
`npm install login-with-plex`

### Usage

#### Step 1 - Initalize
Using login with plex requires initalizing an instance of the PlexLogin class:

```javascript
const PlexLogin = require('login-with-plex')

const plexLoginInstance = new PlexLogin({
  appName: 'My App';
  clientId: 'UUID';
  forwardUrl: 'https://myapp.com/plex-login-redirect';
})
```

* `appName` is a string, the name of your application
* `clientId` is any string to use as the ID of your application - recommended to generate a UUID
* `forwardUrl` is the location that plex will forward your user to after they login

#### Step 2 - Send user to login page
When you want the user to login you will need to redirect them to the plex login page

Example implementation with express:

```javascript
App.get('/login', async function(req, res) {
  // Get plex user information (you should also add error handling)
  const plexUser = await plexLoginInstance.getUserInfo();
  
  // Save user information to their session (or however else you want to manage it)
  req.session.plex.credentials = plexUser;

  // Redirect user to plex login page
  res.redirect(plexLoginInstance.getLoginUrl(plexUser.code));
})
```

#### Step 3 - Retrieve user's plex information after they login
When the user has finished logging in, you can then get their plex information to check if they should be allowed access to your app

You need to create a route in your app which is the route that plex will forward users to (the `forwardUrl` provided)

Example implementation with express:

```javascript
App.get('/plex-login-redirect', function(req, res) {
  // Get user's plex information after they have logged in
  const plexUserInfo = await plexLoginInstance.getPlexInfo(req.session.plex.credentials)

  // You will probably want validate that this specific plex user should have access to your app

  // Save plex user's information somewhere, or in session
  req.session.plex.userinfo = plexUserInfo

  // Redirect user to your app
  res.redirect('/home');
})
```