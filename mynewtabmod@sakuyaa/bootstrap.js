/**************************************************
* 	myNewTabMod by sakuyaa.
*	
*	https://github.com/sakuyaa/
**************************************************/
'use strict';

const {classes: Cc, interfaces: Ci, manager: Cm, utils: Cu/*, results: Cr*/} = Components;
Cu.import('resource://gre/modules/osfile.jsm');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
const isOldVersion = Services.vc.compare(Services.appinfo.platformVersion, '41') < 0;
const isNewVersion = Services.vc.compare(Services.appinfo.platformVersion, '44') >= 0;
if (!isOldVersion && !isNewVersion) {
	Cu.import('resource:///modules/NewTabURL.jsm');   //火狐41上使用新标签页API
}

var myNewTabMod = {
	stringBundle: Services.strings.createBundle('chrome://mynewtabmod/locale/global.properties'),   //本地化
	prefs: Services.prefs.getDefaultBranch('extensions.myNewTabMod.'),
	PREFS: {
		setHomePage: true,   //设置为主页
		setNewTab: true,   //设置为新标签页
		backgroundImage: '',   //背景图片地址
		bingMaxHistory: 10,   //最大历史天数，可设置[2, 16]
		imageDir: 'bingImg',   //图片存储的文件夹名字
		isNewTab: true,   //是否新标签页打开导航链接或搜索结果
		path: 'myNewTabMod',   //myNewTabMod文件夹的相对于配置文件的路径
		title: '我的主页',   //网页标题
		useBigImage: true,   //bing图片的尺寸，0为默认的1366x768，1为1920x1080
		useBingImage: true,   //使用bing的背景图片
		weatherSrc: 'http://i.tianqi.com/index.php?c=code&id=8&num=3'   //天气代码的URL
	},
	
	log: function(e) {
		if (e.lineNumber) {
			console.log('myNewTabMod bootstrap line#' + e.lineNumber + ': ' + e);
		} else {
			console.log('myNewTabMod bootstrap: ' + e);
		}
	},
	addPrefs: function() {
		try {
			this.PREFS.title = this.stringBundle.GetStringFromName('prefs.title');
		} catch(e) {
			this.log(e);
		}
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
				this.log(e);
			}
		}
	},
	copyFile: function(oldFilePath, path, newFilePath) {
		var oldFile = OS.Path.join(OS.Constants.Path.profileDir, 'extensions', 'mynewtabmod@sakuyaa', 'myNewTabMod', oldFilePath);
		if (newFilePath) {
			try {
				OS.File.copy(oldFile, OS.Path.join(OS.Constants.Path.profileDir, path, newFilePath), {noOverwrite: true});
			} catch(e) {
				this.log(e);
			}
		} else {   //文件夹复制操作
			var newFileFolder = OS.Path.join(OS.Constants.Path.profileDir, path, oldFilePath);
			try {
				OS.File.makeDir(newFileFolder);
			} catch(e) {
				this.log(e);
			}
			let iterator = new OS.File.DirectoryIterator(oldFile);
			iterator.forEach(entry => {
				try {
					OS.File.copy(entry.path, OS.Path.join(newFileFolder, OS.Path.basename(entry.path)), {noOverwrite: true});
				} catch(e) {
					this.log(e);
				}
			}).then(() => {
				iterator.close();
			}, reason => {
				iterator.close();
				this.log(reason);
			});
		}
	},
	
	//设置主页和新标签页
	setHomePage: function(reset) {
		//reset为undefined，随setHomePage参数改变而设置；reset为true或false时，仅当setHomePage参数为true时设置
		var url = this.prefs.prefHasUserValue('setHomePage') ? null : 'about:mynewtabmod';
		if (url && !reset) {
			Services.prefs.setCharPref('browser.startup.homepage', url);
		} else if (url && reset || !url && reset == undefined) {
			Services.prefs.clearUserPref('browser.startup.homepage');
		}
	},
	setNewTab: function(reset) {
		var url = this.prefs.prefHasUserValue('setNewTab') ? null : 'about:mynewtabmod';
		if (url && !reset) {
			if (isNewVersion) {
				Cc['@mozilla.org/browser/aboutnewtab-service;1'].getService(Ci.nsIAboutNewTabService).newTabURL = url;
			} else {
				isOldVersion ? Services.prefs.setCharPref('browser.newtab.url', url) : NewTabURL.override(url);
			}
		} else if (url && reset || !url && reset == undefined) {
			if (isNewVersion) {
				Cc['@mozilla.org/browser/aboutnewtab-service;1'].getService(Ci.nsIAboutNewTabService).resetNewTabURL();
			} else {
				isOldVersion ? Services.prefs.clearUserPref('browser.newtab.url') : NewTabURL.reset();
			}
		}
	},
	
	//参数的改变
	register: function() {
		this.prefs.addObserver('', this, false);
	},
	unregister: function() {
		this.prefs.removeObserver('', this);
	},
	observe: function(aSubject, aTopic, aData) {
		switch (aData) {
		case 'setHomePage':
			this.setHomePage();
			break;
		case 'setNewTab':
			this.setNewTab();
			break;
		}
	}
};

function AboutModule() {}
AboutModule.prototype = Object.freeze({
	page: 'chrome://mynewtabmod/content/index.html',
	classDescription: 'about:mynewtabmod about page',
	contractID: '@mozilla.org/network/protocol/about;1?what=mynewtabmod',
	classID: Components.ID('d2d4f4d6-389f-4bb2-9905-c6ae30c84a58'),   //https://www.famkruithof.net/uuid/uuidgen
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
	
	getURIFlags: function(aURI) {
		return Ci.nsIAboutModule.ALLOW_SCRIPT;
	},
	newChannel: function(aURI) {
		let channel = Services.io.newChannel(this.page, null, null);
		channel.originalURI = aURI;
		return channel;
	}
});
Cm.QueryInterface(Ci.nsIComponentRegistrar);
function Factory(component) {
	this.createInstance = function(outer, iid) {
		if (outer) {
			throw Cr.NS_ERROR_NO_AGGREGATION;
		}
		return new component();
	};
	this.register = function() {
		Cm.registerFactory(component.prototype.classID, component.prototype.classDescription, component.prototype.contractID, this);
	};
	this.unregister = function() {
		Cm.unregisterFactory(component.prototype.classID, this);
	};
	Object.freeze(this);
	this.register();
}
var factory;

/*bootstrap entry points*/
var startup = function(data, reason) {
	try {
		factory = new Factory(AboutModule);
	} catch(e) {
		myNewTabMod.log(e);
	}
	myNewTabMod.addPrefs();
	myNewTabMod.register();
	myNewTabMod.setNewTab(false);
	switch (reason) {
	case ADDON_INSTALL:
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
			try {
				if (Services.prompt.confirm(null, myNewTabMod.stringBundle.GetStringFromName('title.folder'),
					myNewTabMod.stringBundle.formatStringFromName('alert.folder', [path], 1)) == false) {
					path = 'myNewTabMod';
				}
			} catch(e) {
				myNewTabMod.log(e);
			} finally {
				Services.prefs.setCharPref('extensions.myNewTabMod.path', path);
			}
		}
		//将文件复制到目录外，以避免文件修改之后导致扩展签名失败
		try {
			OS.File.makeDir(OS.Path.join(OS.Constants.Path.profileDir, path));
		} catch(e) {
			myNewTabMod.log(e);
		}
		myNewTabMod.copyFile('ico', path, false);
		myNewTabMod.copyFile('data.txt', path, 'data.txt');
		myNewTabMod.copyFile('style.css', path, 'style.css');
		//故意不break
	case ADDON_ENABLE:
		myNewTabMod.setHomePage(false);
	}
};
var shutdown = function(data, reason) {
	switch (reason) {
	case ADDON_DISABLE:
	case ADDON_UNINSTALL:
		//https://bugzilla.mozilla.org/show_bug.cgi?id=620541
		myNewTabMod.setHomePage(true);
		myNewTabMod.setNewTab(true);
		//故意不break
	case ADDON_UPGRADE:
	case ADDON_DOWNGRADE :
		try {
			factory.unregister();
		} catch(e) {
			myNewTabMod.log(e);
		}
		myNewTabMod.unregister();
		break;
	}
};
var install = function(data, reason) {
};
var uninstall = function(data, reason) {
	switch (reason) {
	case ADDON_UNINSTALL:
		var path;
		try {
			path = Services.prefs.getComplexValue('extensions.myNewTabMod.path', Ci.nsISupportsString).toString();
		} catch(e) {
			path = 'myNewTabMod';
		}
		try {
			if (Services.prompt.confirm(null, myNewTabMod.stringBundle.GetStringFromName('title.delete'),
				myNewTabMod.stringBundle.formatStringFromName('alert.delete', [path], 1))) {
				OS.File.removeDir(OS.Path.join(OS.Constants.Path.profileDir, path)).catch(e => {
					myNewTabMod.log(e);
				});
			}
		} catch(e) {
			myNewTabMod.log(e);
		}
		myNewTabMod.prefs.deleteBranch('');   //升降级不删除参数
		//故意不break，使得扩展移除并安装后能刷新stringBundle
	case ADDON_UPGRADE:
	case ADDON_DOWNGRADE:
		//https://bugzilla.mozilla.org/show_bug.cgi?id=719376
		Services.strings.flushBundles();
		break;
	}
};
