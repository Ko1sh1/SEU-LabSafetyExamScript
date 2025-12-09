# SEU-LabSafetyExamScript (2025/12/9 Updated Version)
⚠️ **本仓库为自用更新版本**，原作者 [OxalisCu/SEU-LabSafetyExamScript](https://github.com/OxalisCu/SEU-LabSafetyExamScript) 的功能在现有版本中对 HTML 的识别存在问题，基于该作者的源码进行了部分改进。  

---

## 🚀 项目简介
该脚本用于自动抓取和处理**东南大学实验室安全考试题目**，并支持自动答题功能。  
本版本针对原仓库做了以下更新：
- 修复了自动答题脚本在新版网页中失效的问题
- 修复了题库爬虫脚本在新版网页中失效的问题

---

## 📦 安装与运行
与原项目使用方式一致
**题库爬虫：**
如题库添加新内容，可运行 crawler.js 进行更新，其中注意添加上自己的 cookie 信息

**自动答题：** 
将爬虫脚本生成的 data.json 内容替换 script.js 中的 getData 函数现有数据（如需）
将整体脚本复制后，在考试界面开启**浏览器控制台**，粘贴即可（建议注释自动提交部分，否则如脚本过期失效，您将得到一个 0 分试卷😆）
```javascript
    // 自动提交
    // const submitBtn = document.querySelector("#SubmitButton");
    // if (submitBtn) {
    //     submitBtn.click();
    //     console.log("已点击提交按钮");
    // } else {
    //     console.warn("未找到提交按钮");
    // }
