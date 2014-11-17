auto-password-registerer
========================

Registers given passwords to Firefox/Thunderbird's password manager automatically.

## Usage


    pref('extensions.auto-password-registerer@clear-code.com.(unique key).hostname',
         'http://www.example.com:8080');
    pref('extensions.auto-password-registerer@clear-code.com.(unique key).username',
         'myname');
    pref('extensions.auto-password-registerer@clear-code.com.(unique key).httpRealm',
         'httpRealm');
    pref('extensions.auto-password-registerer@clear-code.com.(unique key).password',
         'mypassword');
