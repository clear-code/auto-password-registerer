/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const DEBUG = false;

const Cc = Components.classes;
const Ci = Components.interfaces;
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const kCID  = Components.ID('{4548de20-6e06-11e4-9803-0800200c9a66}'); 
const kID   = '@clear-code.com/auto-password-registerer/startup;1';
const kNAME = 'AutoPasswordRegistererStartupService';

const ObserverService = Cc['@mozilla.org/observer-service;1']
		.getService(Ci.nsIObserverService);

const Pref = Cc['@mozilla.org/preferences;1']
		.getService(Ci.nsIPrefBranch);

const ConsoleService = Cc['@mozilla.org/consoleservice;1']
		.getService(Ci.nsIConsoleService);

const LoginManager = Cc['@mozilla.org/login-manager;1']
		.getService(Ci.nsILoginManager);

const PAIRS_PREFIX     = 'extensions.auto-password-registerer@clear-code.com.';
const HOSTNAME_SUFFIX  = '.hostname';
const USERNAME_SUFFIX  = '.username';
const REALM_SUFFIX     = '.httpRealm';
const PASSWORD_SUFFIX  = '.password';
const TIMESTAMP_SUFFIX = '.lastRegisterationTimestamp';
const EXCLUSIVE_SUFFIX = '.exclusive';

const HOSTNAME_SUFFIX_MATCHER = new RegExp(HOSTNAME_SUFFIX.replace(/\./g, '\\.') + '$');

function mydump()
{
	var str = Array.slice(arguments).join('\n');
    ConsoleService.logStringMessage('[auto-password-registerer] ' + str);
	if (!DEBUG)
	  return;
	if (str.charAt(str.length-1) != '\n')
	  str += '\n';
	dump(str);
}

function UTF8ToUCS2(aString) {
  return decodeURIComponent(escape(aString));
}
function UCS2ToUTF8(aString) {
  return unescape(encodeURIComponent(aString));
}
 
function AutoPasswordRegistererStartupService() { 
}
AutoPasswordRegistererStartupService.prototype = {
	 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				ObserverService.addObserver(this, 'profile-do-change', false);
				return;

			case 'profile-do-change':
				ObserverService.removeObserver(this, 'profile-do-change');
			case 'profile-after-change':
				this.init();
				return;
		}
	},

	init : function() 
	{
		this.savePasswords();
	},

	savePasswords : function()
	{
		mydump('savePasswords');

		var savedPasswords = {};
		var savedSites = {};
		try {
			let loginInfos = LoginManager.getAllLogins({});
			loginInfos.forEach(function(aInfo) {
				var key = this.keyFromLoginInfo(aInfo);
				savedPasswords[key] = aInfo;

				if (!(aInfo.hostname in savedSites))
					savedSites[aInfo.hostname] = {};
				savedSites[aInfo.hostname][aInfo.username] = aInfo;
			}, this);
		}
		catch(e) {
		}

		var now = Date.now();
		Pref.getChildList(PAIRS_PREFIX, {}).forEach(function(aPref) {
			if (!HOSTNAME_SUFFIX_MATCHER.test(aPref))
				return;
			try {
				if (Pref.getPrefType(aPref) != Pref.PREF_STRING)
					return;

				let hostnameKey  = aPref;
				let usernameKey  = hostnameKey.replace(HOSTNAME_SUFFIX_MATCHER, USERNAME_SUFFIX);
				let httpRealmKey = hostnameKey.replace(HOSTNAME_SUFFIX_MATCHER, REALM_SUFFIX);
				let passwordKey  = hostnameKey.replace(HOSTNAME_SUFFIX_MATCHER, PASSWORD_SUFFIX);
				let timestampKey = hostnameKey.replace(HOSTNAME_SUFFIX_MATCHER, TIMESTAMP_SUFFIX);
				let exclusiveKey = hostnameKey.replace(HOSTNAME_SUFFIX_MATCHER, EXCLUSIVE_SUFFIX);

				let hostname = this.getStringPref(hostnameKey, '');
				let timestamp = this.getStringPref(timestampKey, '');
				let username  = this.getStringPref(usernameKey, '');
				let httpRealm = this.getStringPref(httpRealmKey, '');
				let password  = this.getStringPref(passwordKey, '');

				if (!hostname)
					return;

				mydump('password info for '+hostname+' is detected.');

				if (timestamp) {
					timestamp = parseFloat(timestamp);
					if (!isNaN(timestamp) && now > timestamp) {
						mydump('password info is already stored.');
						return;
					}
				}

				if (this.getBoolPref(exclusiveKey) &&
					hostname in savedSites) {
					mydump('removing old login informations...');
					Object.keys(savedSites[hostname]).forEach(function(aUsername) {
						if (aUsername == username)
							return;
						mydump('removing old login information for '+aUsername+'...');
						var info = savedSites[hostname][aUsername];
						var key = this.keyFromLoginInfo(info);
						LoginManager.removeLogin(info);
						delete savedSites[hostname][aUsername];
						delete savedPasswords[key];
					}, this);
					mydump('done.');
				}

				let key = JSON.stringify({
					hostname: hostname,
					username: username
				});
				if (key in savedPasswords) {
					let oldLogin = savedPasswords[key];
					if (username  == oldLogin.username &&
						httpRealm == oldLogin.httpRealm &&
						password  == oldLogin.password) {
						mydump('not changed.');
						return;
					}
					mydump('updating login information...');
					let newLogin = Cc['@mozilla.org/login-manager/loginInfo;1']
									.createInstance(Ci.nsILoginInfo);
					let formSubmitURL = oldLogin.formSubmitURL;
					if (!httpRealm && !formSubmitURL)
						formSubmitURL = hostname;
					newLogin.init(
						hostname,
						formSubmitURL || null,
						httpRealm || null,
						username,
						password,
						oldLogin.usernameField || '',
						oldLogin.passwordField || ''
					);
					LoginManager.modifyLogin(oldLogin, newLogin);
					if (!(hostname in savedSites))
						savedSites[hostname] = {};
					savedSites[hostname][username] = newLogin;
					this.setStringPref(timestampKey, now);
					mydump('done.');
				}
				else {
					mydump('saving new login information...');
					let newLogin = Cc['@mozilla.org/login-manager/loginInfo;1']
									.createInstance(Ci.nsILoginInfo);
					let formSubmitURL = null;
					if (!httpRealm)
						formSubmitURL = hostname;
					newLogin.init(
						hostname,
						formSubmitURL || null,
						httpRealm || null,
						username,
						password,
						'',
						''
					);
					LoginManager.addLogin(newLogin);
					if (!(hostname in savedSites))
						savedSites[hostname] = {};
					savedSites[hostname][username] = newLogin;
					this.setStringPref(timestampKey, now);
					mydump('done.');
				}
			}
			catch(e) {
				mydump(aPref+'\n'+e);
			}
		}, this);
	},

	getBoolPref : function(aKey)
	{
		try {
			return Pref.getBoolPref(aKey);
		}
		catch(e) {
		}
		return false;
	},

	getStringPref : function(aKey, aDefault)
	{
		try {
			return UTF8ToUCS2(Pref.getCharPref(aKey));
		}
		catch(e) {
		}
		return aDefault || '';
	},

	setStringPref : function(aKey, aValue)
	{
		try {
			Pref.setCharPref(aKey, UCS2ToUTF8(String(aValue)));
		}
		catch(e) {
		}
	},

	keyFromLoginInfo : function(aInfo)
	{
		var info = {
			hostname : aInfo.hostname,
			username : aInfo.username
		};
		return JSON.stringify(info);
	},
  
	classID : kCID,
	contractID : kID,
	classDescription : kNAME,
	QueryInterface : XPCOMUtils.generateQI([Ci.nsIObserver]),
	_xpcom_categories : [
		{ category : 'app-startup', service : true }
	]
 
}; 

if (XPCOMUtils.generateNSGetFactory)
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([AutoPasswordRegistererStartupService]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([AutoPasswordRegistererStartupService]);
