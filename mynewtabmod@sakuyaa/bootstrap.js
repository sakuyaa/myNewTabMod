/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

//https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/Bootstrapped_extensions
const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;
try {
	Cu.import('resource:///modules/NewTabURL.jsm');
} catch (e) {}   //向下兼容至26.0
Cu.import('resource://gre/modules/Services.jsm');

var myNewTabMod = {
	//https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefBranch
	prefs: Services.prefs.getDefaultBranch('extensions.myNewTabMod.'),
	PREFS: {
		backgroundImage: '',   //背景图片地址
		bingMaxHistory: 10,   //最大历史天数，可设置[2, 16]
		imageDir: 'bingImg',   //图片存储的文件夹名字
		isNewTab: true,   //是否新标签页打开导航链接或搜索结果
		path: 'myNewTabMod',   //myNewTabMod文件夹的相对于配置文件的路径
		title: '我的主页',   //网页标题
		updateImageTime: 12,   //更新bing背景图片的间隔（单位：小时）
		useBigImage: true,   //bing图片的尺寸，0为默认的1366x768，1为1920x1080
		useBingImage: true,   //使用bing的背景图片
		weatherSrc: 'http://i.tianqi.com/index.php?c=code&id=8&num=3'   //天气代码的URL
	},
	copyFile: function(oldFilePath, newFilePath) {
		//https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFile
		var oldFile = Services.dirsvc.get('ProfD', Ci.nsIFile);
		var newFile = oldFile.clone();
		oldFile.appendRelativePath(oldFilePath);
		newFile.appendRelativePath(newFilePath);
		if (arguments[2]) {   //第三个参数仅仅用于判断是文件夹复制操作
			try {
				oldFile.copyTo(newFile, null);
			} catch (e) { }
		} else if (!newFile.exists() && oldFile.exists()) {   //避免重复安装后覆盖
			oldFile.copyTo(newFile.parent, null);
		}
	},
	
	startup: function() {
		Services.prefs.setCharPref('browser.startup.homepage', 'chrome://mynewtabmod/content/index.html');
		NewTabURL.override('chrome://mynewtabmod/content/index.html');
	},
	shutdown: function() {
		Services.prefs.clearUserPref('browser.startup.homepage');
		NewTabURL.reset();
	},
	install: function() {
		//将文件复制到目录外，以避免文件修改之后导致扩展签名失败
		this.copyFile('extensions\\mynewtabmod@sakuyaa\\myNewTabMod\\data.txt', 'myNewTabMod\\data.txt');
		this.copyFile('extensions\\mynewtabmod@sakuyaa\\myNewTabMod\\style.css', 'myNewTabMod\\style.css');
		this.copyFile('extensions\\mynewtabmod@sakuyaa\\myNewTabMod\\ico', 'myNewTabMod', true);
		try {
			for (var [key, value] in Iterator(this.PREFS)) {
				switch (typeof value) {
					case 'string':
						this.prefs.setCharPref(key, value);
						/*为什么用这个反而会乱码啊啊啊
						var str = Cc['@mozilla.org/supports-string;1'].createInstance(Ci.nsISupportsString);
						str.data = value;
						prefs.setComplexValue(key, Ci.nsISupportsString, str);*/
						break;
					case 'number':
						this.prefs.setIntPref(key, value);
						break;
					case 'boolean':
						this.prefs.setBoolPref(key, value);
						break;
				}
			}
		} catch(e) {}
	},
	uninstall: function() {
		this.prefs.deleteBranch('');
	}
};

/* bootstrap entry points */
var startup = function(data, reason) {
	switch (reason) {
		case ADDON_ENABLE:
		case ADDON_INSTALL:
			myNewTabMod.startup();
			break;
		case APP_STARTUP:
			NewTabURL.override('chrome://mynewtabmod/content/index.html');
			break;
	}
};
var shutdown = function(data, reason) {
	//https://bugzilla.mozilla.org/show_bug.cgi?id=620541
	if (reason == ADDON_DISABLE || reason == ADDON_UNINSTALL) {
		myNewTabMod.shutdown();
	}
};
var install = function(data, reason) {
	myNewTabMod.install();
};
var uninstall = function(data, reason) {
	myNewTabMod.uninstall();
};
