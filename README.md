auto-password-registerer
========================

Registers given passwords to Firefox/Thunderbird's password manager automatically.

## Usage

Define a set of preferences like:

    pref('extensions.auto-password-registerer@clear-code.com.login.(unique key).hostname',
         'http://www.example.com:8080');
    pref('extensions.auto-password-registerer@clear-code.com.login.(unique key).username',
         'myname');
    pref('extensions.auto-password-registerer@clear-code.com.login.(unique key).httpRealm',
         'httpRealm');
    pref('extensions.auto-password-registerer@clear-code.com.login.(unique key).password',
         'mypassword');

Then, those given information will be stored to the password manager automatically.
If there is existing password for the hostname and username, it will be updated.

If you don't want to store multiple login informations for a host, define an extra preference like:

    pref('extensions.auto-password-registerer@clear-code.com.login.(unique key).exclusive',
         true);

Then, all other login informations will be removed automatically.

Already-registered login information won't be registered again, even if you remove the stored password by hand.
To register it again, you have to clear a preference `extensions.auto-password-registerer@clear-code.com.login.(unique key).lastRegisterationTimestamp`.

## How to write preferences from visible information in the password manager

You can write preferences from the information shown in the password manager.
For example, if your password manager saying like following:

    Site               | Username  | Password  | Last Used | Last Changed
    ---------------------------------------------------------------------
    HOSTNAME1 (REALM1) | USERNAME1 | PASSWORD1 | ...       | ...
    HOSTNAME2          | USERNAME2 | PASSWORD2 | ...       | ...
    ...

Then, you can write them like:

    pref('extensions.auto-password-registerer@clear-code.com.login.ID1.hostname',
         'HOSTNAME1');
    pref('extensions.auto-password-registerer@clear-code.com.login.ID1.username',
         'USERNAME1');
    pref('extensions.auto-password-registerer@clear-code.com.login.ID1.httpRealm',
         'REALM1');
    pref('extensions.auto-password-registerer@clear-code.com.login.ID1.password',
         'PASSWORD1');
    pref('extensions.auto-password-registerer@clear-code.com.login.ID2.hostname',
         'HOSTNAME2');
    pref('extensions.auto-password-registerer@clear-code.com.login.ID2.username',
         'USERNAME2');
    pref('extensions.auto-password-registerer@clear-code.com.login.ID2.password',
         'PASSWORD2');

The value for "httpRealm" appears a part of the value in the "Site" column.
You have to split "hostname" and "httpRealm" manually like above.
