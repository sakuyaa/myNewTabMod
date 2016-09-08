/**************************************************
* 	myNewTabMod by sakuyaa.
*	
*	https://github.com/sakuyaa/
**************************************************/
'use strict';

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const {PlacesUtils} = Cu.import('resource://gre/modules/PlacesUtils.jsm');
Cu.import('resource://gre/modules/Downloads.jsm');
Cu.import('resource://gre/modules/osfile.jsm');
Cu.import('resource://gre/modules/Services.jsm');
const is47Up = Services.vc.compare(Services.appinfo.platformVersion, '47') >= 0;
const stringBundle = Services.strings.createBundle('chrome://mynewtabmod/locale/global.properties');   //本地化

//简化函数
const $s = stringBundle.GetStringFromName;
const $id = id => {
	return document.getElementById(id);
};

var myNewTabMod = {
	bingIndex: 0,   //Bing图片历史天数
	dataFolder: null,   //扩展数据文件夹
	dataFile: null,   //导航网址数据文件
	prefs: Services.prefs.getBranch('extensions.myNewTabMod.'),
	PREFS: {
		jsonData: '',
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
	
	//输出错误信息
	log: function(e) {
		if (e.lineNumber) {
			console.log('myNewTabMod line#' + e.lineNumber + ': ' + e);
		} else {
			console.log('myNewTabMod: ' + e);
		}
	},
	
	//显示桌面通知
	notify: function(title, content) {
		new Promise((resolve, reject) => {   //Requires Gecko 29.0
			if (!Notification || Notification.permission === 'denied') {
				reject();
			}
			if (Notification.permission === 'granted') {
				resolve();
			}
			if (is47Up) {
				Notification.requestPermission().then(permission => {   //Requires Gecko 47.0
					if (permission === 'granted') {
						resolve();
					} else {
						reject();
					}
				});
			} else {
				Notification.requestPermission(permission => {   //Deprecated since Gecko 46
					if (permission === 'granted') {
						resolve();
					} else {
						reject();
					}
				});
			}
		}).then(() => {
			new Notification(title, {body: content, icon: 'chrome://mynewtabmod/skin/sakuyaa.png'});
		});
	},
	
	//切换|下载背景图
	changeImg: function() {
		if (this.PREFS.useBingImage) {
			var today = new Date();
			today.setHours(0, 0, 0);   //毫秒就不管了
			if (this.PREFS.jsonData.lastCheckTime && new Date(this.PREFS.jsonData.lastCheckTime) < today) {
				this.bingIndex = 0;   //过0点重新获取
			}
			this.getBingImage();
			return;
		}
		var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
		fp.init(window, $s('title.setImage'), fp.modeOpen);
		fp.appendFilters(fp.filterImages);
		var fpCallback = {
			done: aResult => {
				if (aResult !== fp.returnCancel) {
					this.PREFS.backgroundImage = fp.file.path;
					this.prefs.setComplexValue('backgroundImage', Ci.nsIFile, fp.file);
					document.body.style.backgroundImage = 'url("' + fp.fileURL.spec + '")';
				}
			}
		};
		fp.open(fpCallback);   //Requires Gecko 17.0
	},
	//定位文件目录
	openDir: function() {
		try {
			var folder = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
			folder.initWithPath(this.dataFolder);
			folder.reveal();
		} catch(e) {
			this.notify($s('notify.pathError'), this.dataFolder);
			this.log(e);
		}
	},
	//编辑配置
	edit: function() {
		var editor = Services.prefs.getComplexValue('view_source.editor.path', Ci.nsISupportsString).toString();
		new Promise((resolve, reject) => {   //Requires Gecko 29.0
			OS.File.exists(editor).then(aExists => {
				if (aExists) {
					var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
					file.initWithPath(editor);
					resolve(file);
				} else if (confirm($s('confirm.editor')) == false) {
					var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
					fp.init(window, $s('title.setEditor'), fp.modeOpen);
					fp.appendFilters(fp.filterApps);
					var fpCallback = {
						done: aResult => {
							if (aResult !== fp.returnCancel) {
								Services.prefs.setComplexValue('view_source.editor.path', Ci.nsIFile, fp.file);
								resolve(fp.file);
							} else {
								reject();   //使用代码草稿纸
							}
						}
					};
					fp.open(fpCallback);   //Requires Gecko 17.0
				} else {
					reject();   //使用代码草稿纸
				}
			});
		}).then(file => {
			var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
			process.init(file);
			process.runw(false, [this.dataFile], 1);
		}, () => {
			var spWin = Services.wm.getMostRecentWindow('navigator:browser').Scratchpad.openScratchpad();
			spWin.addEventListener('load', function spOnLoad() {
				spWin.removeEventListener('load', spOnLoad, false);
				var sp = spWin.Scratchpad;
				sp.addObserver({
					onReady: function() {
						sp.removeObserver(this);
						sp.importFromFile.call(sp, OS.Path.toFileURI(myNewTabMod.dataFile));
						setTimeout(() => {   //延时出现文件路径
							sp.setFilename(myNewTabMod.dataFile);
						}, 100);
					}
				});
			}, false);
		});
	},
	
	//获取参数
	getPrefs: function() {
		this.PREFS.title = $s('prefs.title');
		for (var key in this.PREFS) {
			if (!this.prefs.prefHasUserValue(key)) {   //使用默认参数
				continue;
			}
			switch (this.prefs.getPrefType(key)) {
			case this.prefs.PREF_STRING:
				this.PREFS[key] = this.prefs.getComplexValue(key, Ci.nsISupportsString).toString();
				break;
			case this.prefs.PREF_INT:
				this.PREFS[key] = this.prefs.getIntPref(key);
				break;
			case this.prefs.PREF_BOOL:
				this.PREFS[key] = this.prefs.getBoolPref(key);
				break;
			}
		}
		try {
			this.PREFS.jsonData = JSON.parse(this.PREFS.jsonData);
		} catch(e) {
			this.log(e);
			this.PREFS.jsonData = {};
		}
	},
	//初始化数据文件
	initFile: function() {
		this.dataFolder = OS.Path.join(OS.Constants.Path.profileDir, this.PREFS.path);
		this.dataFile = OS.Path.join(this.dataFolder, 'data.txt');
		
		//插入css文件
		var style = document.createElement('link');
		style.rel = 'stylesheet';
		style.type = 'text/css';
		style.href = OS.Path.toFileURI(OS.Path.join(this.dataFolder, 'style.css'));
		document.getElementsByTagName('head')[0].appendChild(style);
	},
	//初始化日期
	initDate: function() {
		var solar = Solar.getSolar(new Date());
		var node = $id('solar');
		var span = document.createElement('span');
		span.textContent = solar.date;
		node.appendChild(span);
		span = document.createElement('span');
		span.id = 'solar_festival';
		span.textContent = ' ' + solar.festival;
		node.appendChild(span);
		span = document.createElement('span');
		span.id = 'solar_holiday';
		span.textContent = ' ' + solar.holiday;
		node.appendChild(span);
		
		var lunar = Lunar.getLunar(new Date());
		node = $id('lunar');
		span = document.createElement('span');
		span.textContent = lunar.date;
		node.appendChild(span);
		span = document.createElement('span');
		span.id = 'lunar_festival';
		span.textContent = ' ' + lunar.festival;
		node.appendChild(span);
		span = document.createElement('span');
		span.id = 'lunar_holiday';
		span.textContent = ' ' + lunar.holiday;
		node.appendChild(span);
	},
	//初始化网页
	initDocument: function() {
		document.title = this.PREFS.title;
		
		//本地化
		var indexBundle = Services.strings.createBundle('chrome://mynewtabmod/locale/index.properties');
		$id('my_nav').textContent = indexBundle.GetStringFromName('nav');
		$id('nav_edit').setAttribute('title', indexBundle.GetStringFromName('edit.title'));
		$id('nav_edit2').textContent = indexBundle.GetStringFromName('edit');
		$id('nav_openfolder').setAttribute('title', indexBundle.GetStringFromName('open.title'));
		$id('nav_openfolder2').textContent = indexBundle.GetStringFromName('open');
		$id('nav_random').setAttribute('title', indexBundle.GetStringFromName('change.title'));
		$id('nav_random2').textContent = indexBundle.GetStringFromName('change');
	},
	//初始化导航网址
	initSite: function() {
		var table = $id('navtable');
		if (table.children.lenth > 0) {
			return;
		}
		OS.File.read(this.dataFile).then(
			array => {
				var Yooo;
				var siteData = this.parseDataText(new TextDecoder().decode(array));
				for(var type in siteData) {
					if (type == 'Yooo') {   //神秘的代码
						Yooo = this.buildTr(type, siteData[type]);
						Yooo.setAttribute('hidden', 'hidden');
						Yooo.setAttribute('name', 'Yooo');
						table.appendChild(Yooo);
					} else {
						table.appendChild(this.buildTr(type, siteData[type]));
					}
				}
				setTimeout(() => {
					//当主div不占满网页时使其居中偏上
					var clientHeight = document.documentElement.clientHeight;
					var offsetHeight = $id('main').offsetHeight;
					if (offsetHeight < clientHeight) {
						$id('main').style.marginTop = (clientHeight - offsetHeight) / 4 + 'px';
					}
				}, 100);   //延时以避免主界面offsetHeight高度获取的值偏小
				$id('navs').style.marginLeft = (document.documentElement.clientWidth - $id('navs').offsetWidth) / 2 + 'px';
				addEventListener('resize', () => {   //窗口大小改变时相应调整
					var clientHeight = document.documentElement.clientHeight;
					var offsetHeight = $id('main').offsetHeight;
					if (offsetHeight < clientHeight) {
						$id('main').style.marginTop = (clientHeight - offsetHeight) / 4 + 'px';
					}
					$id('navs').style.marginLeft = (document.documentElement.clientWidth - $id('navs').offsetWidth) / 2 + 'px';
				}, false);
				
				//神秘的代码
				document.onkeydown = e => {
					//Firefox only, not IE
					//var e=e || event;
					//var currKey = e.keyCode || e.which || e.charCode;
					//var keyName = String.fromCharCode(currKey);
					//alert('按键码: ' + currKey + ' 字符: ' + keyName);
					if (e.which == 81 && e.ctrlKey) {
						for (var yooo of document.getElementsByName('Yooo')) {
							yooo.removeAttribute('hidden');
						}
					}
				};
				document.onkeyup = e => {
					for (var yooo of document.getElementsByName('Yooo')) {
						yooo.setAttribute('hidden', 'hidden');
					}
				};
			},
			aRejectReason => {
				if (aRejectReason instanceof OS.File.Error && aRejectReason.becauseNoSuchFile) {
					this.notify($s('notify.fileNotExist') + this.dataFile, aRejectReason);
				} else {
					this.notify($s('notify.cannotRead') + this.dataFile, aRejectReason);
				}
			}
		);
	},
	//初始化背景图片
	initImage: function() {
		if (this.PREFS.useBingImage) {   //获取bing中国主页的背景图片
			OS.File.exists(this.PREFS.jsonData.backgroundImage).then(aExists => {
				if (aExists) {
					document.body.style.backgroundImage = 'url("' + OS.Path.toFileURI(this.PREFS.jsonData.backgroundImage) + '")';
					var today = new Date();
					today.setHours(0, 0, 0);   //毫秒就不管了
					if (this.PREFS.jsonData.lastCheckTime && new Date(this.PREFS.jsonData.lastCheckTime) < today) {
						this.getBingImage();   //过0点重新获取
					} else {
						this.bingIndex++;
					}
				} else {
					this.getBingImage();
				}
			}).catch(this.log);
		} else {   //使用本地图片
			OS.File.exists(this.PREFS.backgroundImage).then(aExists => {
				if (aExists) {
					document.body.style.backgroundImage = 'url("' + OS.Path.toFileURI(this.PREFS.backgroundImage) + '")';
				} else {
					alert($s('alert.setImage'));
					this.changeImg();
				}
			}).catch(this.log);
		}
	},
	
	init: function() {
		this.getPrefs();
		
		var chromeWin = Services.wm.getMostRecentWindow('navigator:browser');
		chromeWin.BrowserOpenNewTabOrWindow = event => {   //http://bbs.kafan.cn/thread-2040917-1-1.html
			if (event.shiftKey) {
				chromeWin.OpenBrowserWindow();
			} else if (this.prefs.getBoolPref('setNewTab') && this.prefs.getBoolPref('reuseNewTab')) {   //重新判断参数
				chromeWin.switchToTabHavingURI('about:mynewtabmod', true);
				chromeWin.gBrowser.selectedTab.style.fontSize = '150%';
				setTimeout(() => {
					chromeWin.gBrowser.selectedTab.style.fontSize = '100%';
				}, 100);
			} else {
				chromeWin.BrowserOpenTab();
			}
		}
		
		this.initFile();
		this.initDate();
		this.initDocument();
		this.initSite();
		this.initImage();
		
		var weather = $id('weather');
		new Promise((resolve, reject) => {
			weather.onload = () => {
				resolve();
			};
			setTimeout(() => {
				weather.src = this.PREFS.weatherSrc;
			}, 100);
		}).then(() => {   //为天气iframe设置css
			var domWindowUtils = weather.contentWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
			domWindowUtils.loadSheet(Services.io.newURI('chrome://mynewtabmod/skin/weather.css', null, null), domWindowUtils.USER_SHEET);
		});
	},
	
	//设置背景图片并保存设置
	setAndSave: function(ImgPath) {
		document.body.style.backgroundImage = 'url("' + OS.Path.toFileURI(ImgPath) + '")';
		this.PREFS.jsonData = {
			lastCheckTime: Date.now(),
			backgroundImage: ImgPath
		};
		try {
			var str = Cc['@mozilla.org/supports-string;1'].createInstance(Ci.nsISupportsString);
			str.data = JSON.stringify(this.PREFS.jsonData);
			this.prefs.setComplexValue('jsonData', Ci.nsISupportsString, str);
		} catch(e) {
			this.log(e);
		}
	},
	
	getBingImage: function() {
		new Promise((resolve, reject) => {
			var url = 'http://cn.bing.com/HPImageArchive.aspx?format=js&n=1&mkt=zh-CN&idx=' + this.bingIndex++ % this.PREFS.bingMaxHistory;
			//var url = 'http://www.bing.com/HPImageArchive.aspx?format=js&idx=' + idx + '&n=1&nc=' + Date.now() + '&pid=hp&scope=web';
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.onload = () => {
				if (xhr.status == 200) {
					resolve(JSON.parse(xhr.responseText));
				} else {
					reject(new Error(xhr.statusText));
				}
			};
			xhr.onerror = () => {
				reject(new Error($s('notify.networkError')));
			};
			xhr.send(null);
		}).then(data => {
			var name = data.images[0].copyright;
			name = name.replace(/(\s|\(.*?\))/g, '')
				.replace(/(\\|\/|\*|\|)/g, '')   //Win文件名不能包含下列字符
				.replace(/(:)/g, '：')
				.replace(/(\?)/g, '？')
				.replace(/("|<|>)/g, '\'');
			var enddate = parseInt(data.images[0].enddate);
			var imageUrl = data.images[0].url;
			
			//处理图片地址
			if (this.PREFS.useBigImage) {
				imageUrl = imageUrl.replace('1366x768', '1920x1080');
			}
			if (!imageUrl.startsWith('http')) {
				imageUrl = 'http://www.bing.com' + imageUrl;
			}
			
			//本地图片
			var filePath = OS.Path.join(this.dataFolder, this.PREFS.imageDir, enddate + '-' + name + '.jpg');
			var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
			try {
				file.initWithPath(filePath);
			} catch(e) {
				this.notify($s('notify.pathError'), filePath);
				this.log(e);
				return;
			}
			if (file.exists()) {
				this.setAndSave(filePath);
				return;
			}
			
			//下载图片
			var t = new Image();
			t.src = imageUrl;
			t.onload = () => {
				file.create(file.NORMAL_FILE_TYPE, parseInt('0777', 8));
				Downloads.fetch(Services.io.newURI(imageUrl, null, null), file).then(() => {   //Requires Gecko 26.0
					this.setAndSave(filePath);
				}, aDownloadError => {
					this.notify($s('notify.downloadError') + imageUrl, aDownloadError);
				});
			};
		}, aReject => {
			this.notify(aReject);
		});
	},
	
	parseDataText: function (text) {
		var data = [], arr, type;
		for (var line of text.replace(/，/g, ',').split('\n')) {   //处理下，逗号修正为英文逗号
			line = line.trim();
			if (!line) {
				continue;
			}
			arr = line.split(',');
			if (arr.length == 1) {
				type = arr[0];
				data[type] = [];
			} else {
				data[type].push({
					name: arr[0].trim(),
					url: arr[1] ? arr[1].trim() : null,
					imgSrc: arr[2] ? arr[2].trim() : null
				});
			}
		}
		return data;
	},
	
	buildTr: function(type, sites) {
		var tr = document.createElement('tr'),
			th = document.createElement('th'),
			span = document.createElement('span'),
			td, a, img, textNode, path;
		
		//添加分类
		span.textContent = type;
		th.appendChild(span);
		tr.appendChild(th);
		
		//添加站点
		for (var site of sites) {
			td = document.createElement('td');
			a = document.createElement('a');
			img = document.createElement('img');
			textNode = document.createTextNode(site.name);
			
			a.setAttribute('title', site.name);
			path = this.handleUrl(site.url);
			if (path) {
				a.setAttribute('href', 'javascript:;');
				a.setAttribute('localpath', path);
				a.addEventListener('click', e => {
					this.exec(e.target.getAttribute('localpath'));
				}, false);
				site.exec = path;
			} else {
				a.setAttribute('href', site.url);
				if (this.PREFS.isNewTab) {
					a.setAttribute('target', '_blank');
				}
			}
			
			//设置图片的属性
			img.width = 16;
			img.height = 16;
			if (site.imgSrc) {
				if (site.imgSrc.charAt(0) == '/') {
					var icoPath = this.dataFolder;
					for (var pathList of site.imgSrc.substring(1).split('/')) {
						icoPath = OS.Path.join(icoPath, pathList);
					}
					try {
						img.src = OS.Path.toFileURI(OS.Path.normalize(icoPath));
					} catch(e) {
						this.log(e);
					}
				} else {
					img.src = site.imgSrc;
				}
			} else {
				this.setIcon(img, site);
			}
			
			a.appendChild(img);
			a.appendChild(textNode);
			td.appendChild(a);
			tr.appendChild(td);
		}
		return tr;
	},
	
	handleUrl: function (urlOrPath) {
		if (/^[a-z]+:\/\/[^\s]+$/i.test(urlOrPath)) {   //匹配URL
			return false;
		}
		if (Services.appinfo.OS == 'WINNT') {   //Win系统
			if (urlOrPath.charAt(0) == '/' || urlOrPath.charAt(0) == '\\') {   //相对扩展数据文件夹
				var path = urlOrPath.substring(1).split(urlOrPath.charAt(0));   //根据第一个字符进行分隔
				urlOrPath = this.dataFolder;
				for (var pathList of path) {
					urlOrPath = OS.Path.join(urlOrPath, pathList);
				}
			} else if (/^[a-z]:\\.+$/i.test(urlOrPath) == false) {   //不匹配windows路径
				return false;
			}
		}
		try {
			return OS.Path.normalize(urlOrPath);
		} catch(e) {
			this.log(e);
			return false;
		}
	},
	
	exec: function(path) {
		var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
		try {
			file.initWithPath(path);
		} catch(e) {
			this.notify($s('notify.pathError'), path);
			this.log(e);
			return;
		}
		if (!file.exists()) {
			this.notify($s('notify.fileNotExist'), path);
			return;
		}
		file.launch();
	},
	
	setIcon: function(img, obj) {
		if (obj.exec) {
			OS.File.exists(obj.exec).then(aExists => {
				if (aExists) {
					img.setAttribute('src', 'moz-icon://' + OS.Path.toFileURI(obj.exec) + '?size=16');
				} else {
					img.setAttribute('disabled', 'true');
				}
			}).catch(this.log);
			return;
		}
		
		var uri;
		try {
			uri = Services.io.newURI(obj.url, null, null);
		} catch (e) {
			this.log(e);
		}
		if (!uri) return;
		
		PlacesUtils.favicons.getFaviconURLForPage(uri, {
			onComplete: (aURI, aDataLen, aData, aMimeType) => {
				try {
					//javascript: URI の host にアクセスするとエラー
					img.setAttribute('src', aURI && aURI.spec?
						'moz-anno:favicon:' + aURI.spec :
						'moz-anno:favicon:' + uri.scheme + '://' + uri.host + '/favicon.ico');
				} catch (e) {
					this.log(e);
				}
			}
		});
	}
};

addEventListener('load', function onLoad() {
	removeEventListener('load', onLoad, false);
	myNewTabMod.init();
}, false);
