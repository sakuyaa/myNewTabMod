# myNewTabMod Reference by sakuyaa

这是我在开发过程中所参考的一些资料:smirk:

## [Add-ons](https://developer.mozilla.org/docs/Mozilla/Add-ons)
1. **Version**
	* [Version Format](https://developer.mozilla.org/en-US/docs/Toolkit_version_format)
	* [Extension Versioning, Update and Compatibility](https://developer.mozilla.org/docs/Extension_Versioning%2C_Update_and_Compatibility)
* **Preferences**
	* [Preferences](https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Preferences)
	* [内嵌选项](https://developer.mozilla.org/docs/Mozilla/Add-ons/Inline_Options)
	* [setting.xml](https://mxr.mozilla.org/mozilla-central/source/toolkit/mozapps/extensions/content/setting.xml)
* **L10n**
	* [本地化](https://developer.mozilla.org/docs/Mozilla/Tech/XUL/Tutorial/Localization)
	* [Localizing an extension](https://developer.mozilla.org/docs/Mozilla/Localization/Localizing_an_extension)
	* [Property Files](https://developer.mozilla.org/docs/Mozilla/Tech/XUL/Tutorial/Property_Files)
	* [demo](https://github.com/Noitidart/l10n)
* **Others**
	* [设置扩展开发环境](https://developer.mozilla.org/docs/Mozilla/Add-ons/Setting_up_extension_development_environment)
	* [自引导型扩展](https://developer.mozilla.org/docs/Mozilla/Add-ons/Bootstrapped_extensions)
	* [File I/O](https://developer.mozilla.org/en-US/Add-ons/Code_snippets/File_I_O)
	* [Custom about: URLs](https://developer.mozilla.org/docs/Custom_about:_URLs)

## [JavaScript code modules](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/Using)
1. **[Downloads.jsm](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/Downloads.jsm)**
* **[OSFile.jsm](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/OSFile.jsm)**
	* [OS.File for the main thread](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread)
	* [Calling OS.File.DirectoryIterator from the main thread](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File.DirectoryIterator_for_the_main_thread)
	* [Path manipulation](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.Path)
	* [OS.File.DirectoryIterator.Entry](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File.DirectoryIterator.Entry)
* **PlacesUtils.jsm**
	* favicons
		* [mozIAsyncFavicons](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/mozIAsyncFavicons)
		* [nsIFaviconDataCallback](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFaviconDataCallback)
* **[Services.jsm](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/Services.jsm)**
	* appinfo
		* [nsIXULAppInfo](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIXULAppInfo)
		* [nsIXULRuntime](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIXULRuntime)
	* prefs
		* [nsIPrefBranch](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefBranch)
		* [nsIPrefService](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPrefService)
	* prompt
		* [nsIPromptService](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIPromptService)
	* strings
		* [nsIStringBundleService](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundleService)
	* vc
		* [nsIVersionComparator](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIVersionComparator)
* **[XPCOMUtils.jsm](https://developer.mozilla.org/docs/Mozilla/JavaScript_code_modules/XPCOMUtils.jsm)**

## [XPCOM Interface](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface)
* [nsIAboutModule](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIAboutModule)
* [nsIDOMWindowUtils](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIDOMWindowUtils)
* [nsIFile](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFile)
* [nsIFilePicker](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFilePicker)
* [nsILocalFile](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsILocalFile)
* [nsIProcess](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIProcess)
* [nsIStringBundle](https://developer.mozilla.org/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIStringBundle)

## [JavaScript](https://developer.mozilla.org/docs/Web/JavaScript/Reference)
1. **[全局对象](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects)**
	* [Error](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Error)
	* [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)
	* [正则表达式](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
* **[语句](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements)**
	* [for...in](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for...in)
	* [for...of](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for...of)
* **[运算符](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators)**
	* [解构赋值](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
* **[函数](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Functions)**
	* [arguments](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Functions/arguments)
	* [箭头函数](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
* **附加参考**
	* [严格模式](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Strict_mode)

## [Web API 接口](https://developer.mozilla.org/docs/Web/API)
* [Notification](https://developer.mozilla.org/docs/Web/API/notification)
* [TextDecoder](https://developer.mozilla.org/docs/Web/API/TextDecoder)
* [XMLHttpRequest](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest)
