# myNewTabMod by sakuyaa

首先感谢一下原作者`defpt`和`ywzhaiqi`:clap:，
这个扩展是根据[myNewTab](http://bbs.kafan.cn/thread-1759418-1-1.html)这个扩展修改而成的

## 主要的不同之处
1. 实现火狐41上设置为新标签页
* 将参数存放在火狐preferences里面
* 将导航配置、壁纸等可能有改动的文件设置在profile文件夹内，实现扩展签名
* 扩展重装后不会覆盖配置
* 替换日历算法为我自己编写的算法，从而准确显示父亲节:man:、母亲节:woman:这样的节日
* 神秘的代码:underage:

## 可能造成不便的地方
1. 存放导航网址的数据文件data.txt中，为网址指定本地图标文件时需要以斜杠`/`开头
* 我写的农历算法由于是使用公式自动计算的缘故，可能会出现一些错误：
	* 2011年11月23日的小雪应在22日
	* 2015年8月14日-9月12日农历七月出错
* Bing壁纸的命名还是采取日期+壁纸的信息，不会自动删除，需要注意壁纸会一直累积下去
* 默认的导航网址中有返利链接
* 在火狐配置文件目录里的扩展数据文件夹中的style.css文件并不会随着扩展更新而更新，请自行从扩展目录的myNewTabMod文件夹中替换

## 扩展图文
* 扩展主界面，左上角的天气可以在附加组件管理器中该扩展选项界面设置其URL
	国历和农历日期会以不同颜色显示当天的节假日和节气信息
![](https://raw.githubusercontent.com/sakuyaa/myNewTabMod/master/pic/main.png "主界面")
* 参数设置  
![](https://raw.githubusercontent.com/sakuyaa/myNewTabMod/master/pic/config.png "参数设置")
* 将参数存放在火狐preferences里面  
![](https://raw.githubusercontent.com/sakuyaa/myNewTabMod/master/pic/prefs.png "首选项")
* 储存的Bing壁纸  
![](https://raw.githubusercontent.com/sakuyaa/myNewTabMod/master/pic/bingImg.png "Bing图片")

## 尚未解决（能力有限…）
* 通过扩展选项选择“背景图片地址”时，文件路径包含中文会造成乱码（已修复，但会造成选择文件后无法直接显示文件路径）

##### 另一种实现方式：
在`options.xul`中，添加以下代码：
```xml
<setting type="control" title="背景图片地址">
	<button id="setbackgroundimage" label="浏览..." />
</setting>
<setting pref="extensions.myNewTabMod.backgroundImage" type="string" title="背景图片地址" id="backgroundimage" />
```
在`bootstrap.js`中，添加以下代码：
```js
var myNewTabMod = {
	observer: {
		observe: function(aSubject, aTopic, aData) {
			if (aTopic == 'addon-options-displayed' && aData == 'mynewtabmod@sakuyaa') {
				var path;
				try {
					path = Services.prefs.getComplexValue('extensions.myNewTabMod.path', Ci.nsISupportsString).toString();
				} catch(e) {
					path = 'myNewTabMod';
				}
				aSubject.getElementById('backgroundimage').value = path;
				aSubject.getElementById('setbackgroundimage').onclick = function() {
					var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
					fp.init(window, '设置背景图片', fp.modeOpen);
					fp.appendFilters(fp.filterImages);
					if (fp.show() == fp.returnCancel || !fp.file) {
						return;
					}
					var str = Cc['@mozilla.org/supports-string;1'].createInstance(Ci.nsISupportsString);
					str.data = Services.io.newFileURI(fp.file).spec;
					aSubject.getElementById('backgroundimage').value = str.data;
					myNewTabMod.prefs.setComplexValue('backgroundImage', Ci.nsISupportsString, str);
				};
			}
		}
	}
};
var startup = function(data, reason) {
	Services.obs.addObserver(myNewTabMod.observer, 'addon-options-displayed', false);
};
var shutdown = function(data, reason) {
	Services.obs.removeObserver(myNewTabMod.observer, 'addon-options-displayed');
};
```
然而，由于无法获取到选项界面的**window**，使得**fp.init(window, '设置背景图片', fp.modeOpen);**这个函数无法执行。