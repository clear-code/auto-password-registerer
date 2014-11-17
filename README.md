auto-password-registerer
========================

Registers given passwords to Firefox/Thunderbird's password manager automatically.

## Usage

Define a set of preferences like:

    pref('extensions.auto-password-registerer@clear-code.com.(unique key).hostname',
         'http://www.example.com:8080');
    pref('extensions.auto-password-registerer@clear-code.com.(unique key).username',
         'myname');
    pref('extensions.auto-password-registerer@clear-code.com.(unique key).httpRealm',
         'httpRealm');
    pref('extensions.auto-password-registerer@clear-code.com.(unique key).password',
         'mypassword');

Then, those given information will be stored to the password manager automatically.
If there is existing password for the hostname and username, it will be updated.

If you don't want to store multiple login informations for a host, define an extra preference like:

    pref('extensions.auto-password-registerer@clear-code.com.(unique key).exclusive',
         true);

Then, all other login informations will be removed automatically.
