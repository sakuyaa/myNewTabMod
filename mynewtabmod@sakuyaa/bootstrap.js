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
		prefs.setIntPref("bingMaxHistory", 10);   //最大历史天数，可设置[2, 16]
		prefs.setCharPref("imageDir", "bingImg");   //图片存储的文件夹名字
		prefs.setBoolPref("isNewTab", true);   //是否新标签页打开导航链接或搜索结果
		prefs.setCharPref("path", "myNewTabMod");   //myNewTabMod文件夹的相对于配置文件的路径
		prefs.setIntPref("updateImageTime", 12);   //更新bing背景图片的间隔（单位：小时）
		prefs.setBoolPref("useBigImage", true);   //bing图片的尺寸，0为默认的1366x768，1为1920x1080
		prefs.setBoolPref("useBingImage", true);   //使用bing的背景图片
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
