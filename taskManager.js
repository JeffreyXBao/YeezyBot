const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const https = require('https');

puppeteer.use(StealthPlugin())
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

// get free proxies from geonode
function getFreeProxies() {
    return new Promise((resolve, reject) => {
        let options = {
            host: 'proxylist.geonode.com',
            path: '/api/proxy-list?limit=200&page=1&sort_by=lastChecked&sort_type=desc&country=US'
        };
        https.request(options, (response) => {
            var str = '';

            //another chunk of data has been received, so append it to `str`
            response.on('data', function (chunk) {
                str += chunk;
            });
          
            //the whole response has been received, so we just print it out here
            response.on('end', function () {
                let parsed = JSON.parse(str);
                let data = parsed.data;
                for (let i = 0; i < data.length; i++) {
                    let curr = data[i];
                    proxies.push(`${curr.ip}:${curr.port}`);
                }
                resolve();
            });
        }).end();
    });
}

// initiate a proxied connection
async function connectProxied(proxy, cookies) {
    const browser = await puppeteer.launch({
        //headless: false,
        args: [
            `--proxy-server=${proxy}`
        ]
    });
    const page = await browser.newPage();
    await page.setCookie(...cookies);

    try {
        await page.goto('https://www.yeezysupply.com');
        let contents = await page.content();
        if (contents.includes('403')) {
            console.log('Error 403');
            await browser.close();
            return;
        }
        console.log(`\nSuccess on ${proxy}\n`);
    } catch (error) {
        console.log('Error loading site: ' + error);
        await browser.close();
        return;
    }
}

// init the taskManager process
exports.main = async function(cookies) {
    await getFreeProxies();
    //await getProxies();
    for (let i = 0; i < proxies.length; i++) {
        connectProxied(proxies[i], cookies);
        await sleep(300);
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}   

// test a single proxy
exports.testProxy = async function(proxy, cookies) {
    connectProxied(proxy, cookies);
};

// test auto proxies
exports.freeProxies = async function() {
    await getFreeProxies();
    console.log(proxies);
};