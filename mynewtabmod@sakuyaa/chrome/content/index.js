var {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/PlacesUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var prefs = Services.prefs.getBranch("extensions.myNewTabMod.");
var bingMaxHistory = prefs.getIntPref("bingMaxHistory");   //最大历史天数，可设置[2, 16]
var bingImageDir = prefs.getCharPref("imageDir");   //图片存储的文件夹名字
var isNewTab = prefs.getBoolPref("isNewTab");   //是否新标签页打开导航链接或搜索结果
var newTabDirPath = prefs.getCharPref("path");   //myNewTabMod文件夹的相对于配置文件的路径
var title = prefs.getComplexValue("title", Ci.nsISupportsString).data;   //网页标题
var updateImageTime = prefs.getIntPref("updateImageTime");   //更新bing背景图片的间隔（单位：小时）
var bingImageSize = prefs.getBoolPref("useBigImage");   //bing图片的尺寸，0为默认的1366x768，1为1920x1080
var useBingImage = prefs.getBoolPref("useBingImage");   //使用bing的背景图片


var dataFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
dataFile.appendRelativePath(newTabDirPath);
dataFile.appendRelativePath('data.js');

var script = document.createElement("script");
script.type = "text/javascript";
script.src = 'file:///' + encodeURI(dataFile.path.replace(/\\/g, '/'));   //转为本地路径
document.getElementsByTagName('head')[0].appendChild(script);


"use strict";

var NewTab = {
	localLinkRegExp: /^[a-z]:\\[^ ]+$/i,  //windows路径
	/*get prefs() {
	    delete this.prefs;
	    return this.prefs = Services.prefs.getBranch("myNewTab.");
	},*/

	init: function() {
		document.title = title;
		
		var table = document.getElementById("navtable");
		if (table.children.lenth > 0) {
			return;
		}

		var siteData = this.parseDataText(Config.sites);
		//console.log(siteData);
		var tr, type;
		for(type in siteData) {
			tr = this.buildTr(type, siteData[type]);
			table.appendChild(tr);
			//神秘的代码
			if (type == "Yooo") {
				tr.id = "Yooooo";
				tr.style.visibility = 'hidden';
			}
		}
		
		//获取bing中国主页的背景图片
		if (useBingImage) {
			var data = NewTab.loadSetting();
			if (data.backgroundImage && (Date.now() - data.lastCheckTime) < updateImageTime * 3600 * 1000) {
				document.body.style.backgroundImage = 'url(' + data.backgroundImage + ')';
			} else {
				NewTab.getBingImage(0);
			}
		}
	},
	
	//加载设置
	loadSetting: function() {
		var jsonData;
		try {
			jsonData = prefs.getCharPref("jsonData");
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
			prefs.setCharPref("jsonData", JSON.stringify(Jsondata));
		} catch(e) {}
	},
	
	getBingImage: function(idx) {
		var self = this;
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
			//file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
			var file = Services.dirsvc.get("ProfD", Ci.nsIFile);
			file.appendRelativePath(newTabDirPath);
			file.appendRelativePath(bingImageDir)
			file.appendRelativePath(enddate + '-' + name.replace(/(\s|\(.*?\))/g, '') + ".jpg")

			//转为本地路径
			var filePath = 'file:///' + encodeURI(file.path.replace(/\\/g, '/'));
			
			if (file.exists()) {
				NewTab.setAndSave(filePath);
				return;
			}

			//下载图片
			var t = new Image();
			t.src = imageUrl;
			t.onload = function() {
				try {
					file.create(Ci.nsIFile.NOMAL_FILE_TYPE, 0777)
					Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Ci.nsIWebBrowserPersist)
						.saveURI(Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI(imageUrl, null, null), null, null, null, null, null, file, null);
				} catch (err) {
					//alert(err)
				}
				setTimeout(function(){
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
	
	buildTr: function (type, sites) {
		var tr = document.createElement('tr'),
			th = document.createElement('th'),
			span = document.createElement('span'),
			site, td, a, img, textNode, path;
		
		//添加分类
		span.innerHTML = type;
		th.appendChild(span);
		tr.appendChild(th);

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
				a.addEventListener('click', function(e){
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
				if (site.imgSrc.substr(0, 4) == "ico/") {
					var icoFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
					icoFile.appendRelativePath(newTabDirPath);
					icoFile.appendRelativePath(site.imgSrc.replace('/', '\\'));
					img.src = 'file:///' + encodeURI(icoFile.path.replace(/\\/g, '/'));   //转为本地路径
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
			var profileDir = Services.dirsvc.get("ProfD", Ci.nsILocalFile).path;
			return profileDir + urlOrPath;
		} else if (this.localLinkRegExp.test(urlOrPath)) {
			return urlOrPath;
		}
		return false;
	},
	
	exec: function (path) {
		var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
		file.initWithPath(path);
		if (!file.exists()) {
		    alert('路径并不存在：' + path);
		    return;
		}
		file.launch();
	},
	
	setIcon: function (img, obj) {
		if (obj.exec) {
		    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
		    try {
		        aFile.initWithPath(obj.exec);
		    } catch (e) {
		        return;
		    }
		    if (!aFile.exists()) {
		        img.setAttribute("disabled", "true");
		    } else {
		        var fileURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
		        img.setAttribute("src", "moz-icon://" + fileURL + "?size=16");
		    }
		    return;
		}

		var uri, iconURI;
		try {
		    uri = Services.io.newURI(obj.url, null, null);
		} catch (e) { }
		if (!uri) return;

		PlacesUtils.favicons.getFaviconDataForPage(uri, {
		    onComplete: function(aURI, aDataLen, aData, aMimeType) {
		        try {
    			    //javascript: URI の host にアクセスするとエラー
    			    img.setAttribute("src", aURI && aURI.spec?
    			        "moz-anno:favicon:" + aURI.spec:
    			        "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico");
    			} catch (e) { }
		    }
		});
	}
};

window.addEventListener('load', function(){
	NewTab.init();
}, false);

//切换|下载背景图
function changeImg() {
	var n = Math.floor(Math.random() * bingMaxHistory);
	NewTab.getBingImage(n);
}

//定位文件目录
function openDir() {
	dsFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
	dsFile.appendRelativePath(newTabDirPath);
	dsFile.reveal();
}

//编辑配置
function edit() {
	//get editor
	var editor;
	try {
	    editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsILocalFile);
	} catch(e) {}

	if (!editor || !editor.exists()) {
	    alert("请先设置编辑器的路径!!!");
	    var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
	    fp.init(window, "设置全局脚本编辑器", fp.modeOpen);
	    fp.appendFilter("执行文件", "*.exe");
	    if (fp.show() == fp.returnCancel || !fp.file)
	        return;
	    else {
	    	editor = fp.file;
	        Services.prefs.setCharPref("view_source.editor.path", editor.path);
	    }
	}

	dsFile = Services.dirsvc.get("ProfD", Ci.nsIFile);
	dsFile.appendRelativePath(newTabDirPath);
	dsFile.appendRelativePath('data.js');

	var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
	var args = [dsFile.path]
	process.init(editor);
	process.runw(false, args, args.length);
}

//神秘的代码
document.onkeydown =function (e) {
	var e=e||event;
	var currKey=e.keyCode||e.which||e.charCode;
	//var keyName = String.fromCharCode(currKey);
	if (currKey == 81 && e.ctrlKey) {
		document.getElementById("Yooooo").style.visibility = 'visible';
		//alert("按键码: " + currKey + " 字符: " + keyName);
	}
};
document.onkeyup =function (e) {
	document.getElementById("Yooooo").style.visibility = 'hidden';
};

//从函数中获取多行注释的字符串
function getMStr(fn) {
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
}
