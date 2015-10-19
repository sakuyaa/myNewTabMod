# myNewTabMod by sakuyaa

首先感谢一下原作者`defpt`和`ywzhaiqi`:clap:，
这个扩展是根据[myNewTab](http://bbs.kafan.cn/thread-1759418-1-1.html)这个扩展修改而成的

## 主要的不同之处
1. 壁纸的命名还是采取壁纸的信息，且不自动删除，方便以后查看
* 实现火狐41上设置为新标签页
* 将参数存放在火狐preferences里面
* 将导航配置、壁纸等可能有改动的文件设置在profile文件夹内，实现扩展签名（还要看看能不能通过先:flushed:）
* 替换日历算法为我自己编写的算法，从而准确显示父亲节:man:、母亲节:woman:这样的节日
* 神秘的代码:underage:

## 扩展详细介绍
* 待编辑

## 尚未实现（能力有限…）
* 天气iframe内字体的设置（解决不了啊:scream:目前只能通过Stylish设置）
* 通过defaults\preferences设置扩展默认参数（试过了，不知道为什么参数不会自动导入:broken_heart:）
* 将整个index.html移出扩展外，再作为iframe插入首页
```javascript
var frm = document.createElement('iframe');
iframe.src = 'index.html';
iframe.style.width = '100%';
iframe.style.height = '100%';
document.body.appendChild(frm);
```
