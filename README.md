# Client to Biomio OpenId Connect provider
This library may helps you to implement Biomio login

## How to use

```html
<!doctype html>
<html lang="en">
  <head>
      <meta charset="utf-8">
      <title>OpenID client</title>
  </head>
  <body>
    <input type="text" value="" name="external-token" id="external-token">
    <div onclick="var token = $('#external-token').val(); client.login(token);">Login</div>

    <script src="js/oidclient.js"></script>
    <script>

      var client = new OIDClient({
        response_type: "token id_token",
        scope: "openid profile",
        client_id: "56ce9a6a93c17d2c867c5c293482b8f9"
      });

      if(client.isAuth()) {
        console.log(client.user);
      }

    </script>
  </body>
</html>
```