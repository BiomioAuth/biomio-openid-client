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
    <div onclick="var token = $('#external-token').val(); OIDClient.login(token, 'popup')">Login</div>

    <script src="js/oidclient.js"></script>
    <script>

        OIDClient.init({
          response_type: "token",
          scope: "openid profile",
          client_id: "aaabbbccc",
          redirect_uri: "https://example.com/",
        });

        if (OIDClient.isAuth) {
          console.info(OIDClient.getUser());
          console.info(OIDClient.getAccessToken());
        }

    </script>
  </body>
</html>
```