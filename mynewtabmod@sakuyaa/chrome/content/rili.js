var lunarInfo = new Array(19416, 19168, 42352, 21717, 53856, 55632, 91476, 22176, 39632, 21970, 19168, 42422, 42192, 53840, 119381, 46400, 54944, 44450, 38320, 84343, 18800, 42160, 46261, 27216, 27968, 109396, 11104, 38256, 21234, 18800, 25958, 54432, 59984, 28309, 23248, 11104, 100067, 37600, 116951, 51536, 54432, 120998, 46416, 22176, 107956, 9680, 37584, 53938, 43344, 46423, 27808, 46416, 86869, 19872, 42448, 83315, 21200, 43432, 59728, 27296, 44710, 43856, 19296, 43748, 42352, 21088, 62051, 55632, 23383, 22176, 38608, 19925, 19152, 42192, 54484, 53840, 54616, 46400, 46496, 103846, 38320, 18864, 43380, 42160, 45690, 27216, 27968, 44870, 43872, 38256, 19189, 18800, 25776, 29859, 59984, 27480, 21952, 43872, 38613, 37600, 51552, 55636, 54432, 55888, 30034, 22176, 43959, 9680, 37584, 51893, 43344, 46240, 47780, 44368, 21977, 19360, 42416, 86390, 21168, 43312, 31060, 27296, 44368, 23378, 19296, 42726, 42208, 53856, 60005, 54576, 23200, 30371, 38608, 19415, 19152, 42192, 118966, 53840, 54560, 56645, 46496, 22224, 21938, 18864, 42359, 42160, 43600, 111189, 27936, 44448)
var Gan = new Array('甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸')
var Zhi = new Array('子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥')
var SX = new Array('鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪')
var cmStr = new Array('日', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊')
var nStr1 = new Array('日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十')
var now;
var SY;
var SM;
var SD
function cyclical(num) {
	return (Gan[num % 10] + Zhi[num % 12])
}
function lYearDays(y) {
	var i,
	sum = 348
	for (i = 32768; i > 8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0
	return (sum + leapDays(y))
}
function leapDays(y) {
	if (leapMonth(y)) return ((lunarInfo[y - 1900] & 65536) ? 30 : 29) 
	else return (0)
}
function leapMonth(y) {
	return (lunarInfo[y - 1900] & 15)
}
function monthDays(y, m) {
	return ((lunarInfo[y - 1900] & (65536 >> m)) ? 30 : 29)
}
function Lunar(objDate) {
	var i,
	leap = 0,
	temp = 0
	var baseDate = new Date(1900, 0, 31)
	var offset = (objDate - baseDate) / 86400000
	this.dayCyl = offset + 40
	this.monCyl = 14
	for (i = 1900; i < 2050 && offset > 0; i++) {
		temp = lYearDays(i)
		offset -= temp
		this.monCyl += 12
	}
	if (offset < 0) {
		offset += temp;
		i--;
		this.monCyl -= 12
	}
	this.year = i
	this.yearCyl = i - 1864
	leap = leapMonth(i)
	this.isLeap = false
	for (i = 1; i < 13 && offset > 0; i++) {
		if (leap > 0 && i == (leap + 1) && this.isLeap == false)
		{
			--i;
			this.isLeap = true;
			temp = leapDays(this.year);
		} 
		else
		{
			temp = monthDays(this.year, i);
		}
		if (this.isLeap == true && i == (leap + 1)) this.isLeap = false
		offset -= temp
		if (this.isLeap == false) this.monCyl++
	}
	if (offset == 0 && leap > 0 && i == leap + 1)
	if (this.isLeap)
	{
		this.isLeap = false;
	} 
	else
	{
		this.isLeap = true;
		--i;
		--this.monCyl;
	}
	if (offset < 0) {
		offset += temp;
		--i;
		--this.monCyl;
	}
	this.month = i
	this.day = offset + 1
}
function YYMMDD() {
	return (SY + '年' + (SM + 1) + '月' + SD + '日')
}
function weekday() {
	return ('星期' + nStr1[now.getDay()]);
}
function cDay(m, d) {
	var nStr2 = new Array('初', '十', '廿', '卅', '　');
	var s
	s = cmStr[m] + '月'
	switch (d) {
		case 10:
			s += '初十';
			break;
		case 20:
			s += '二十';
			break;
		case 30:
			s += '三十';
			break;
		default:
			s += nStr2[Math.floor(d / 10)];
			s += nStr1[Math.round(d % 10)];
	}
	return (s)
}
function solarDay() {
	var sTermInfo = new Array(0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758)
	var solarTerm = new Array('小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至')
	var lFtv = new Array('0101*春节', '0115 元宵节', '0505 端午节', '0707 七夕', '0715 中元节', '0815 中秋节', '0909 重阳节', '1208 腊八节', '1224 小年', '0100*除夕')
	var sFtv = new Array('0101*元旦', '0214 情人节', '0308 妇女节', '0312 植树节', '0401 愚人节', '0501 劳动节', '0504 青年节', '0512 护士节', '0601 儿童节', '0701 建党节', '0801 建军节', '0811 记者日', '0910 教师节', '1001*国庆节', '1101 万圣节', '1225 圣诞节', '0511 母亲节', '0608 父亲节', '1129 感恩节')
	var sDObj = new Date(SY, SM, SD);
	var lDObj = new Lunar(sDObj);
	var lDPOS = new Array(3)
	var festival = '',
	solarTerms = '',
	solarFestival = '',
	lunarFestival = '',
	solarTerms = '',
	tmp1,
	tmp2;
	for (i in lFtv)
	if (lFtv[i].match(/^(\d{2})(.{2})([\s\*])(.+)$/)) {
		tmp1 = Number(RegExp.$1) - lDObj.month
		tmp2 = Number(RegExp.$2) - lDObj.day
		if (tmp1 == 0 && tmp2 == 0) lunarFestival = RegExp.$4
	}
	if (lunarFestival == '') {
		for (i in sFtv)
		if (sFtv[i].match(/^(\d{2})(\d{2})([\s\*])(.+)$/)) {
			tmp1 = Number(RegExp.$1) - (SM + 1)
			tmp2 = Number(RegExp.$2) - SD
			if (tmp1 == 0 && tmp2 == 0) solarFestival = RegExp.$4
		}
		if (solarFestival == '') {
			tmp1 = new Date((31556925974.7 * (SY - 1900) + sTermInfo[SM * 2 + 1] * 60000) + Date.UTC(1900, 0, 6, 2, 5))
			tmp2 = tmp1.getUTCDate()
			if (tmp2 == SD) solarTerms = solarTerm[SM * 2 + 1]
			tmp1 = new Date((31556925974.7 * (SY - 1900) + sTermInfo[SM * 2] * 60000) + Date.UTC(1900, 0, 6, 2, 5))
			tmp2 = tmp1.getUTCDate()
			if (tmp2 == SD) solarTerms = solarTerm[SM * 2]
			if (solarTerms == '') sFtv = '';
			 else sFtv = solarTerms
		} else sFtv = solarFestival
	} else sFtv = lunarFestival
	// if(sFtv=='')
	sTermInfo = cyclical(lDObj.year - 1900 + 36) + SX[(SY - 4) % 12] + '年 ' + cDay(lDObj.month, lDObj.day) + ' <font color=#DF0A10>' + sFtv + '</font>'
	// else sTermInfo=cDay(lDObj.month,lDObj.day)+' <font color=#DF0A10>'+sFtv+'</font>'
	return (sTermInfo)
}
function showcal(t) {
	now = new Date();
	SY = now.getFullYear();
	SM = now.getMonth();
	SD = now.getDate();
	//var str=YYMMDD()+' '+weekday()+"&nbsp;&nbsp;&nbsp;&nbsp;农历 </span>"+solarDay()
	var str = solarDay()
	if (t == 1) document.getElementById('rili').innerHTML = str 
	else document.write(str)
}
