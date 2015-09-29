/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
Cu.import("resource:///modules/NewTabURL.jsm");
Cu.import("resource://gre/modules/Services.jsm");

//https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefBranch
var prefs = Services.prefs.getBranch("extensions.myNewTabMod.");

var myNewTabMod = {
	startup: function() {
		Services.prefs.getBranch("").setCharPref("browser.startup.homepage", "chrome://mynewtabmod/content/index.html");
		NewTabURL.override("chrome://mynewtabmod/content/index.html");
	},
	shutdown: function() {
		Services.prefs.getBranch("").clearUserPref("browser.startup.homepage");
		NewTabURL.reset();
	},
	install: function() {
		//将data.js文件复制到目录外，以避免此文件修改之后导致扩展签名失败
		//https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFile
		var file = Services.dirsvc.get("ProfD", Ci.nsIFile);
		var dataFile = file.clone();
		file.appendRelativePath("extensions\\mynewtabmod@sakuyaa\\myNewTabMod\\data.js");
		dataFile.appendRelativePath("myNewTabMod\\data.js");
		if (!dataFile.exists() && file.exists()) {   //避免重复安装后覆盖data.js
			file.copyTo(dataFile.parent, null);
		}
		file = Services.dirsvc.get("ProfD", Ci.nsIFile);
		file.appendRelativePath("extensions\\mynewtabmod@sakuyaa\\myNewTabMod\\ico");
		try {
			file.copyTo(dataFile.parent, null);   //复制ico文件夹
		}
		catch (e) {
		}

		prefs.setIntPref("bingMaxHistory", 10);   //最大历史天数，可设置[2, 16]
		prefs.setCharPref("imageDir", "bingImg");   //图片存储的文件夹名字
		prefs.setBoolPref("isNewTab", true);   //是否新标签页打开导航链接或搜索结果
		prefs.setCharPref("path", "myNewTabMod");   //myNewTabMod文件夹的相对于配置文件的路径
		prefs.setCharPref("title", "我的主页");   //网页标题
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
