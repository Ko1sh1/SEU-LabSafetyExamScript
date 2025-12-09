import puppeteer from 'puppeteer-core';
import fs from 'fs';

// 实验室安全网站 cookie
const cookies = [
    {
        url: 'http://safe.seu.edu.cn/',
        name: '.ASPXAUTH',
        value: 'your aspxauth value here'
    },
    {
        url: 'http://safe.seu.edu.cn/',
        name: 'ASP.NET_SessionId',
        value: 'your net session id value here'
    }
];

// 对获取到的题目字符串进行正则匹配，获取题目、答案信息
function dealQ(input) {
    // 去掉换行符和多余空格
    input = input.replace(/\n/g, '').replace(/\s+/g, ' ').trim();

    // 去掉 <font> 标签
    input = input.replace(/<font.*?>(.*?)<\/font>/g, '$1');

    // 匹配题号、题型、题目和答案
    const strMatch = input.match(/^(\d+)\.\s*\[(.*?)\]\s*(.*)参考答案:\s*([A-E正确错误,]+)(?:.*解题分析.*)?$/);
    if (!strMatch) return null;

    let [_, index, type, qo, answer] = strMatch;
    let question, options;

    // 判断题
    if (type.includes('判断题')) {
        question = qo.trim();
        options = ['正确', '错误'];
    }
    // 单选题或多选题
    else if (type.includes('单选题') || type.includes('多选题')) {
        // 匹配选项
        const qoMatch = qo.match(/(.*)A\.(.*)B\.(.*)C\.(.*)D\.(.*)E\.(.*)/) ||
            qo.match(/(.*)A\.(.*)B\.(.*)C\.(.*)D\.(.*)/) ||
            qo.match(/(.*)A\.(.*)B\.(.*)C\.(.*)/) ||
            qo.match(/(.*)A\.(.*)B\.(.*)/);

        if (!qoMatch) {
            question = qo.trim();
            options = [];
        } else {
            [_, question, ...options] = qoMatch;
            options = options.filter(item => !!item).map(item => item.trim());
        }
    }

    // 处理答案，逗号分隔，并去掉空格
    answer = answer.split(',').map(a => a.trim());

    // 返回 index 为数字类型
    return {
        index: parseInt(index, 10),
        type,
        question,
        options,
        answer
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: "D:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    });

    const page = await browser.newPage();
    await page.setCookie(...cookies);

    console.log('打开页面...');
    await page.goto('https://safe.seu.edu.cn/LabSafetyExamSchoolSSO/Sindex.aspx#/LabSafetyExamSchoolSSO/SchoolLevel/LearnSchoolLevelQuestion.aspx', {waitUntil: 'networkidle0'});

    console.log('等待目标 iframe...');
    const frameHandle = await page.$('#mainPanel_bodyRegion_mainTabStrip_fnode4 iframe');
    const frame = await frameHandle.contentFrame();

    if (!frame) {
        console.log('⚠️ iframe 获取失败');
        await browser.close();
        return;
    }

    // 等待表格渲染
    await frame.waitForSelector('table.f-grid-table');
    console.log('表格加载完成');

    let allQs = [];
    let lastIndex = null; // 上一页最后一道题的题号
    while (true) {
        // 抓取当前页数据
        await sleep(1000);
        const qs = await frame.$$eval('table.f-grid-table tr span', els =>
            els.map(item => item.textContent)
        );

        const tmp = qs.map(item => dealQ(item)).filter(item => item !== null);
        if (tmp.length === 0) {
            console.log('当前页没有抓到题目，可能已到最后一页');
            break;
        }

        // 判断题号是否变化
        const currentFirstIndex = tmp[0].index;
        if (currentFirstIndex === lastIndex) {
            console.log('题号未变化，已到最后一页，抓取完成');
            break;
        }

        allQs = allQs.concat(tmp);
        console.log(`已抓取 ${allQs.length} 条题目`);

        lastIndex = tmp[0].index; // 记录上一页的第一题题号

        // 点击下一页
        const nextBtn = await frame.$('a.nextpage');
        if (!nextBtn) {
            console.log('没有找到下一页按钮，抓取结束');
            break;
        }
        await nextBtn.click();
        console.log('点击下一页，等待加载...');

        // 等待新页表格渲染完成
        await frame.waitForSelector('table.f-grid-table tr', {timeout: 3000});
    }

    // 保存结果
    fs.writeFileSync('data.json', JSON.stringify(allQs, null, 2));
    console.log(`全部题目抓取完成，共 ${allQs.length} 道题目，已保存到 data.json`);
    await browser.close();
})();
