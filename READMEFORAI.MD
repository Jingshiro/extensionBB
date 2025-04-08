# AI开发指南

## 项目结构
本项目严格遵循以下文件结构：
- index.js: 仅包含JavaScript逻辑代码
- style.css: 包含所有CSS样式定义

## 编码规则
1. 文件分离
   - ⚠️ JavaScript代码只能写入index.js
   - ⚠️ CSS样式只能写入style.css
   - 禁止在index.js中使用内联样式或style标签

2. 函数引用
   - ⚠️ 我提到的函数均可直接使用, 不需要任何前缀， 只需要在index.js中引入：
     -  比如// import { extension_settings, getContext, saveSettingsDebounced } from "../../../script.js"则是引入了extension_settings, getContext, saveSettingsDebounced这三个函数
     - 函数的使用示例在我提出需求时会给出，你只需要根据我提出的示例在index.js中引入即可
   - **这些函数已在全局作用域中定义，不属于任何对象或类**

## 代码示例
### 正确的JavaScript (index.js):
```javascript
// 获取数据并处理
const data = getData();
const processed = processData(data);
renderUI(processed);
