const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import('resource://gre/modules/Downloads.jsm');
Cu.import('resource://gre/modules/PlacesUtils.jsm');
Cu.import('resource://gre/modules/Services.jsm');

'use strict';

//获取参数
var prefs = Services.prefs.getBranch('extensions.myNewTabMod.');
try {
	var backgroundImage = prefs.getComplexValue('backgroundImage', Ci.nsILocalFile);   //背景图片地址
} catch(e) {}
var bingMaxHistory = prefs.getIntPref('bingMaxHistory');   //最大历史天数，可设置[2, 16]
var bingImageDir = prefs.getComplexValue('imageDir', Ci.nsISupportsString).data;   //图片存储的文件夹名字
var isNewTab = prefs.getBoolPref('isNewTab');   //是否新标签页打开导航链接或搜索结果
var newTabDirPath = prefs.getComplexValue('path', Ci.nsISupportsString).data;   //myNewTabMod文件夹的相对于配置文件的路径
var title = prefs.getComplexValue('title', Ci.nsISupportsString).data;   //网页标题
var updateImageTime = prefs.getIntPref('updateImageTime');   //更新bing背景图片的间隔（单位：小时）
var bingImageSize = prefs.getBoolPref('useBigImage');   //bing图片的尺寸，0为默认的1366x768，1为1920x1080
var useBingImage = prefs.getBoolPref('useBingImage');   //使用bing的背景图片
var weatherSrc = prefs.getComplexValue('weatherSrc', Ci.nsISupportsString).data;   //天气代码的URL


var dataFolder = Services.dirsvc.get('ProfD', Ci.nsIFile);
dataFolder.appendRelativePath(newTabDirPath);
var dataFile = dataFolder.clone();
dataFile.appendRelativePath('data.txt');
var cssFile = dataFolder.clone();
cssFile.appendRelativePath('style.css');

//插入文件
var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = Services.io.newFileURI(cssFile).spec;
document.getElementsByTagName('head')[0].appendChild(style);

var NewTab = {
	localLinkRegExp: /^[a-z]:\\[^ ]+$/i,  //windows路径
	Yooo: {},   //神秘的代码

	init: function() {
		document.title = title;
		document.getElementById('weather').src = weatherSrc;
		
		document.getElementById('weather').onload = function() {   //为天气iframe设置css
			var cssWeather = Services.dirsvc.get('ProfD', Ci.nsIFile);
			cssWeather.appendRelativePath('extensions\\mynewtabmod@sakuyaa\\chrome\\skin\\weather.css');
			//https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMWindowUtils
			var domWindowUtils = document.getElementById('weather').contentWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
			domWindowUtils.loadSheet(Services.io.newFileURI(cssWeather), domWindowUtils.USER_SHEET);
		};

		document.getElementById('solar').innerHTML = Solar.getSolar(new Date());
		document.getElementById('lunar').innerHTML = Lunar.getLunar(new Date());
		
		var table = document.getElementById('navtable');
		if (table.children.lenth > 0) {
			return;
		}
		
		//读取配置文件
		if (!dataFile.exists()) {
			alert('文件不存在：' + dataFile.path); 
			return;
		}
		try {
			var fis = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
			fis.init(dataFile, 0x01, 00004, null);
			var sis = Cc['@mozilla.org/scriptableinputstream;1'].createInstance(Ci.nsIScriptableInputStream);
			sis.init(fis);
			var converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
			converter.charset = 'UTF-8';
			var content = converter.ConvertToUnicode(sis.read(sis.available()));
		} catch(e) {
			alert('不能读取文件：' + dataFile.path);
			sis.close();
			return;
		}
		sis.close();
		
		var siteData = this.parseDataText(content);
		//console.log(siteData);
		var tr, type;
		for(type in siteData) {
			if (type == 'Yooo') {   //神秘的代码
				this.Yooo = this.buildTr(type, siteData[type]);
				this.Yooo.id = 'Yooo';
				continue;
			}
			tr = this.buildTr(type, siteData[type]);
			table.appendChild(tr);
		}
		
		//当主div不占满网页时使其居中偏上
		var clientHeight = document.documentElement.clientHeight;
		var offsetHeight = document.getElementById('main').offsetHeight;
		if (offsetHeight < clientHeight) {
			document.getElementById('main').style.marginTop = (clientHeight - offsetHeight) / 4 + 'px';
		}
		
		if (useBingImage) {   //获取bing中国主页的背景图片
			var data = NewTab.loadSetting();
			if (data.backgroundImage && (Date.now() - data.lastCheckTime) < updateImageTime * 3600 * 1000) {
				document.body.style.backgroundImage = 'url(' + data.backgroundImage + ')';
			} else {
				NewTab.getBingImage(0);
			}
		} else {
			if (!backgroundImage || !backgroundImage.exists()) {   //尚未设置背景图片路径
				alert('请先设置背景图片的路径!!!');
				var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
				fp.init(window, '设置背景图片', fp.modeOpen);
				fp.appendFilters(fp.filterImages);
				if (fp.show() == fp.returnCancel || !fp.file) {
					return;
				} else {
					backgroundImage = fp.file;
					prefs.setCharPref('backgroundImage', backgroundImage.path);
				}
			}
			document.body.style.backgroundImage = 'url(' + Services.io.newFileURI(backgroundImage).spec + ')';
		}
	},
	
	//加载设置
	loadSetting: function() {
		var jsonData;
		try {
			jsonData = prefs.getCharPref('jsonData');
			jsonData = JSON.parse(jsonData);
		} catch(e) {
			jsonData = {}
		}
		return jsonData;
	},
	
	//设置背景图片并保存设置
	setAndSave: function(ImgPath) {
		document.body.style.backgroundImage = 'url(' + ImgPath + ')';
		var Jsondata = {
			lastCheckTime: Date.now(),
			backgroundImage: ImgPath
		};
		try {
			prefs.setCharPref('jsonData', JSON.stringify(Jsondata));
		} catch(e) {}
	},
	
	getBingImage: function(idx) {
		var url = 'http://cn.bing.com/HPImageArchive.aspx?format=js&idx=' + idx + '&n=1&nc=';
		//var url = 'http://www.bing.com/HPImageArchive.aspx?format=js&idx=' + idx + '&n=1&nc=' + Date.now() + '&pid=hp&scope=web';
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.onload = function() {
			var data = JSON.parse(xhr.responseText);

			var name = data.images[0].copyright;
			var enddate = parseInt(data.images[0].enddate);
			var imageUrl = data.images[0].url;

			//处理图片地址
			if (bingImageSize) {
				imageUrl = imageUrl.replace('1366x768', '1920x1080');
			}
			if (!imageUrl.startsWith('http')) {
				imageUrl = 'http://www.bing.com' + imageUrl;
			}

			//本地图片
			//file = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
			var file = dataFolder.clone();
			file.appendRelativePath(bingImageDir);
			file.appendRelativePath(enddate + '-' + name.replace(/(\s|\(.*?\))/g, '') + '.jpg');

			//转为本地路径
			var filePath = Services.io.newFileURI(file).spec;
			
			if (file.exists()) {
				NewTab.setAndSave(filePath);
				return;
			}

			//下载图片
			var t = new Image();
			t.src = imageUrl;
			t.onload = function() {
				try {
					file.create(file.NORMAL_FILE_TYPE, 0777);
					Downloads.fetch(Services.io.newURI(imageUrl, null, null), file);
					/*Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(Ci.nsIWebBrowserPersist)
						.saveURI(Services.io.newURI(imageUrl, null, null), null, null, null, null, null, file, null);*/
				} catch (ex if ex instanceof Downloads.Error && ex.becauseTargetFailed) {
					console.log('Unable to write to the target file, ignoring the error.');
				}
				setTimeout(function() {
					NewTab.setAndSave(filePath);
				}, 100);
			}
		};
		xhr.send(null);
	},
	
	parseDataText: function (text) {
		var data = [],
			lines, line, arr, type;

		//处理下，逗号修正为英文逗号
		text = text.replace(/，/g, ',');

		lines = text.split('\n');
		for (var i = 0, l = lines.length; i < l; i++) {
			line = lines[i].trim();
			if (!line) continue;
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
			site, td, a, img, textNode, path;
		
		//添加分类
		span.textContent = type;
		th.appendChild(span);
		tr.appendChild(th);

		//图标地址
		var icoURL = 'file:///' + encodeURI(dataFolder.path.replace(/\\/g, '/'));
		
		//添加站点
		for (var i = 0, l = sites.length; i < l; i++) {
			site = sites[i];

			td = document.createElement('td');
			a = document.createElement('a');
			img = document.createElement('img');
			textNode = document.createTextNode(site.name);

			a.setAttribute('title', site.name);
			path = this.handleUrl(site.url);
			if (path) {
				a.setAttribute('href', 'javascript:;');
				a.setAttribute('localpath', path);
				a.addEventListener('click', function(e) {
					var fullpath = e.target.getAttribute('localpath');
					NewTab.exec(fullpath);
				}, false);

				site.exec = path;
			} else {
				a.setAttribute('href', site.url);
			}

			if (isNewTab) {
				a.setAttribute('target', '_blank');
			}
			
			//设置图片的属性
			img.width = 16;
			img.height = 16;
			if (site.imgSrc) {
				if (site.imgSrc[0] == '/') {
					img.src = icoURL + site.imgSrc;   //转为本地路径
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
		if (urlOrPath.indexOf('\\') == 0) {   //相对firefox路径文件
			urlOrPath = urlOrPath.replace(/\//g, '\\').toLocaleLowerCase();
			var profileDir = Services.dirsvc.get('ProfD', Ci.nsILocalFile).path;
			return profileDir + urlOrPath;
		} else if (this.localLinkRegExp.test(urlOrPath)) {
			return urlOrPath;
		}
		return false;
	},
	
	exec: function(path) {
		var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
		file.initWithPath(path);
		if (!file.exists()) {
		    alert('路径并不存在：' + path);
		    return;
		}
		file.launch();
	},
	
	setIcon: function(img, obj) {
		if (obj.exec) {
		    var aFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
		    try {
		        aFile.initWithPath(obj.exec);
		    } catch (e) {
		        return;
		    }
		    if (!aFile.exists()) {
		        img.setAttribute('disabled', 'true');
		    } else {
		        var fileURL = Services.io.getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
		        img.setAttribute('src', 'moz-icon://' + fileURL + '?size=16');
		    }
		    return;
		}

		var uri;
		try {
		    uri = Services.io.newURI(obj.url, null, null);
		} catch (e) { }
		if (!uri) return;

		PlacesUtils.favicons.getFaviconDataForPage(uri, {
		    onComplete: function(aURI, aDataLen, aData, aMimeType) {
		        try {
    			    //javascript: URI の host にアクセスするとエラー
    			    img.setAttribute('src', aURI && aURI.spec?
    			        'moz-anno:favicon:' + aURI.spec :
    			        'moz-anno:favicon:' + uri.scheme + '://' + uri.host + '/favicon.ico');
    			} catch (e) { }
		    }
		});
	}
};

window.addEventListener('load', function() {
	NewTab.init();
}, false);

//切换|下载背景图
function changeImg() {
	if (useBingImage) {
		var n = Math.floor(Math.random() * bingMaxHistory);
		NewTab.getBingImage(n);
	}
}

//定位文件目录
function openDir() {
	dataFolder.reveal();
}

//编辑配置
function edit() {
	//get editor
	var editor;
	try {
	    editor = Services.prefs.getComplexValue('view_source.editor.path', Ci.nsILocalFile);
	} catch(e) {}

	if (!editor || !editor.exists()) {
	    alert('请先设置编辑器的路径!!!');
	    var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
	    fp.init(window, '设置全局脚本编辑器', fp.modeOpen);
	    fp.appendFilter('执行文件', '*.exe');
	    if (fp.show() == fp.returnCancel || !fp.file) {
	        return;
	    } else {
	    	editor = fp.file;
	        Services.prefs.setCharPref('view_source.editor.path', editor.path);
	    }
	}

	var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
	var args = [dataFile.path];
	process.init(editor);
	process.runw(false, args, args.length);
}

//神秘的代码
document.onkeydown = function(e) {
	//Firefox only, not IE
	//var e=e || event;
	//var currKey = e.keyCode || e.which || e.charCode;
	//var keyName = String.fromCharCode(currKey);
	//alert('按键码: ' + currKey + ' 字符: ' + keyName);
	if (e.which == 81 && e.ctrlKey && document.getElementById('Yooo') == null) {
		document.getElementById('navtable').appendChild(NewTab.Yooo);
	}
};
document.onkeyup = function(e) {
	var tr = document.getElementById('Yooo');
	if (tr != null) {
		document.getElementById('navtable').removeChild(tr);
	}
};

//从函数中获取多行注释的字符串
/*function getMStr(fn) {
	var fnSource = fn.toString();
	var ret = {};
	fnSource = fnSource.replace(/^[^{]+/, '');
	//console.log(fnSource);
	var matched;
	var reg = /var\s+([$\w]+)[\s\S]*?\/\*([\s\S]+?)\*\//g;
	while (matched = reg.exec(fnSource)) {
		//console.log(matched);
		ret[matched[1]] = matched[2];
	};
	return ret;
}*/
