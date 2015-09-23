/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.myNewTabMod.");
Cu.import("resource:///modules/NewTabURL.jsm");

var myNewTabMod = {
	startup: function() {
		Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("").setCharPref("browser.startup.homepage", "chrome://mynewtabmod/content/index.html");
		NewTabURL.override("chrome://mynewtabmod/content/index.html");
	},
	shutdown: function() {
		Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("").clearUserPref("browser.startup.homepage");
		NewTabURL.reset();
	},
	install: function() {
		prefs.setCharPref("imageDir", "bingImg");
		prefs.setIntPref("bingMaxHistory", 10);
		prefs.setBoolPref("firstRun", true);
		prefs.setBoolPref("isNewTab", true);
		prefs.setCharPref("path", "myNewTabMod");
		prefs.setIntPref("updateImageTime", 12);
		prefs.setBoolPref("useBigImage", true);
		prefs.setBoolPref("useBingImage", true);
	},
	uninstall: function() {
		prefs.deleteBranch("");
	}
};

/* bootstrap entry points */
var install = function(data, reason) {
	myNewTabMod.install();
};

var uninstall = function(data, reason) {
	myNewTabMod.uninstall();
};

var startup = function(data, reason) {
	myNewTabMod.startup();
};

var shutdown = function(data, reason) {
	myNewTabMod.shutdown();
};
