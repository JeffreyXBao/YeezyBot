const puppeteer = require('puppeteer');
const fs = require('fs');

// array of proxy servers
var proxies = [];

// update array based on txt file
function getProxies() {
    return new Promise((resolve, reject) => {
        fs.readFile('proxies.txt', 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            proxies = data.split("\n");
            resolve();
        });
    });
}

async function connectProxied(proxy) {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--proxy-server=${proxy}`
        ]
    });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.yeezysupply.com');
    } catch (error) {
        await browser.close();
        return false;
    }
}

// init the taskManager process
exports.main = async function() {
    await getProxies();
    for (let i = 0; i < 10; i++) {
        connectProxied(proxies[i]);
    }
}