var Config = getMStr(function(){
	var sites;
/*
示例
	项目地址, https://github.com/sakuyaa/myNewTabMod
	卡饭, http://bbs.kafan.cn/forum.php?mod=forumdisplay&fid=215&filter=author&orderby=dateline
	贴吧, http://tieba.baidu.com/f?ie=utf-8&kw=firefox
	中文社区, https://www.firefox.net.cn/thread-29&orderby=postdate
Yooo
	王の教♂诲, http://www.bilibili.com/video/av1267
	Pump♂it, http://www.bilibili.com/video/av212109
*/
});


// !神秘的代码
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


// 从函数中获取多行注释的字符串
function getMStr(fn) {
    var fnSource = fn.toString();
    var ret = {};
    fnSource = fnSource.replace(/^[^{]+/, '');
    // console.log(fnSource);
    var matched;
    var reg = /var\s+([$\w]+)[\s\S]*?\/\*([\s\S]+?)\*\//g;
    while (matched = reg.exec(fnSource)) {
        // console.log(matched);
        ret[matched[1]] = matched[2];
    };
    
    return ret;
}