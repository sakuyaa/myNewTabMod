/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const {classes: Cc, interfaces: Ci, utils: Cu/*, results: Cr*/} = Components;
Cu.import('resource://gre/modules/Services.jsm');
const isNewVersion = Services.vc.compare(Services.appinfo.platformVersion, "41.*") >= 0;
if (isNewVersion) {
	Cu.import('resource:///modules/NewTabURL.jsm');   //火狐41上使用新标签页API
}

var myNewTabMod = {
	stringBundle: Services.strings.createBundle('chrome://mynewtabmod/locale/global.properties'),   //本地化
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
	addPrefs: function() {
		this.PREFS.title = this.stringBundle.GetStringFromName('prefs.title');
		for (var [key, value] in Iterator(this.PREFS)) {
			try {
				switch (typeof value) {
					case 'string':
						var str = Cc['@mozilla.org/supports-string;1'].createInstance(Ci.nsISupportsString);
						str.data = value;
						this.prefs.setComplexValue(key, Ci.nsISupportsString, str);
						break;
					case 'number':
						this.prefs.setIntPref(key, value);
						break;
					case 'boolean':
						this.prefs.setBoolPref(key, value);
						break;
				}
			} catch(e) {
				console.log('myNewTabMod line#' + e.lineNumber + ' ' + e.name + ' : ' + e.message);
			}
		}
	},
	copyFile: function(oldFilePath, newFilePath) {
		var oldFile = Services.dirsvc.get('ProfD', Ci.nsIFile);
		var newFile = oldFile.clone();
		oldFile.appendRelativePath(oldFilePath);
		newFile.appendRelativePath(newFilePath);
		if (arguments.length != 2) {   //第三个参数仅仅用于判断是文件夹复制操作
			try {
				oldFile.copyTo(newFile, null);
			} catch (e) {
				console.log('myNewTabMod line#' + e.lineNumber + ' ' + e.name + ' : ' + e.message);
			}
		} else if (!newFile.exists() && oldFile.exists()) {   //避免重复安装后覆盖
			oldFile.copyTo(newFile.parent, null);
		}
	}
};

/*bootstrap entry points*/
var startup = function(data, reason) {
	if (isNewVersion) {
		NewTabURL.override('chrome://mynewtabmod/content/index.html');
	}
	myNewTabMod.addPrefs();
	switch (reason) {
		case ADDON_ENABLE:
			if (!isNewVersion) {
				Services.prefs.setCharPref('browser.newtab.url', 'chrome://mynewtabmod/content/index.html');
			}
			Services.prefs.setCharPref('browser.startup.homepage', 'chrome://mynewtabmod/content/index.html');
			break;
		case ADDON_INSTALL:
			if (!isNewVersion) {
				Services.prefs.setCharPref('browser.newtab.url', 'chrome://mynewtabmod/content/index.html');
			}
			Services.prefs.setCharPref('browser.startup.homepage', 'chrome://mynewtabmod/content/index.html');
			//故意不break
		case ADDON_UPGRADE:
		case ADDON_DOWNGRADE:
			//以下代码不写在install里，是因为install调用在Registering manifest之前，无法使用stringBundle
			var path;
			try {
				path = Services.prefs.getComplexValue('extensions.myNewTabMod.path', Ci.nsISupportsString).toString();
			} catch(e) {
				path = 'myNewTabMod';
			}
			if (path != 'myNewTabMod') {
				if (Services.prompt.confirm(null, myNewTabMod.stringBundle.GetStringFromName('title.folder'),
					myNewTabMod.stringBundle.formatStringFromName('alert.folder', [path], 1)) == false) {
					path = 'myNewTabMod';
					Services.prefs.setCharPref('extensions.myNewTabMod.path', path);
				}
			}
			//将文件复制到目录外，以避免文件修改之后导致扩展签名失败
			myNewTabMod.copyFile('extensions\\mynewtabmod@sakuyaa\\myNewTabMod\\data.txt', path + '\\data.txt');
			myNewTabMod.copyFile('extensions\\mynewtabmod@sakuyaa\\myNewTabMod\\style.css', path + '\\style.css');
			myNewTabMod.copyFile('extensions\\mynewtabmod@sakuyaa\\myNewTabMod\\ico', path, true);
	}
};
var shutdown = function(data, reason) {
	switch (reason) {
		case ADDON_DISABLE:
		case ADDON_UNINSTALL:
			//https://bugzilla.mozilla.org/show_bug.cgi?id=620541
			if (isNewVersion) {
				NewTabURL.reset();
			} else {
				Services.prefs.clearUserPref('browser.newtab.url');
			}
			Services.prefs.clearUserPref('browser.startup.homepage');
			break;
	}
};
var install = function(data, reason) {
};
var uninstall = function(data, reason) {
	switch (reason) {
		case ADDON_UNINSTALL:
			myNewTabMod.prefs.deleteBranch('');   //升降级不删除参数
			var path;
			try {
				path = Services.prefs.getComplexValue('extensions.myNewTabMod.path', Ci.nsISupportsString).toString();
			} catch(e) {
				path = 'myNewTabMod';
			}
			if (Services.prompt.confirm(null, myNewTabMod.stringBundle.GetStringFromName('title.delete'),
				myNewTabMod.stringBundle.formatStringFromName('alert.delete', [path], 1))) {
				var folder = Services.dirsvc.get('ProfD', Ci.nsIFile);
				folder.appendRelativePath(path);
				try {
					folder.remove(true);
				} catch(e) {
					console.log('myNewTabMod line#' + e.lineNumber + ' ' + e.name + ' : ' + e.message);
				}
			}
			//故意不break，使得扩展移除并安装后能刷新stringBundle
		case ADDON_UPGRADE:
		case ADDON_DOWNGRADE:
			//https://bugzilla.mozilla.org/show_bug.cgi?id=719376
			Services.strings.flushBundles();
			break;
	}
};
