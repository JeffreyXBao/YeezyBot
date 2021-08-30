const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const https = require('https');

puppeteer.use(StealthPlugin())
// array of proxy servers
var proxies = [];

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
exports.connectProxied = async function(url, proxy, cookies, login) {
    const browser = await puppeteer.launch({
        //headless: false,
        args: [
            `--proxy-server=${proxy}`
        ]
    });
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.authenticate(login);

    try {
        await page.goto(url);
        let contents = await page.content();
        if (contents.includes('403')) {
            console.log('Error 403: UNABLE TO GIVE YOU ACCESS');
            await browser.close();
            return;
        }
        console.log(`\nSuccess on ${proxy}\n`);

        while(true) {
            await sleep(100);

            contents = await page.content();

            let [purchaseButton] = await page.$x("//button[contains(., 'Purchase')]");
            // handle cases where the case is weird
            if (!purchaseButton) { [purchaseButton] = await page.$x("//button[contains(., 'purchase')]"); }
            if (!purchaseButton) { [purchaseButton] = await page.$x("//button[contains(., 'PURCHASE')]"); }

            if (purchaseButton) {
                console.log("QUEUE POPPED!!!");
                fs.writeFile(`./scrapes/${Date.now()}.txt`, contents, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Product add saved!');
                });

                let [sizeButton] = await page.$x("//button[contains(., 'Size')]");
                // handle cases where the case is weird
                if (!sizeButton) { [sizeButton] = await page.$x("//button[contains(., 'size')]"); }
                if (!sizeButton) { [sizeButton] = await page.$x("//button[contains(., 'SIZE')]"); }
                if (sizeButton) { await sizeButton.click(); }

                await sleep(100);

                contents = await page.content();
                fs.writeFile(`./scrapes/${Date.now()}.txt`, contents, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Size select saved!');
                });

                let [dropdown] = await page.$x("select");
                if (dropdown) {
                    page.select('select', '10'); // TODO: allow different sizes
                }

                await sleep(100);

                [purchaseButton] = await page.$x("//button[contains(., 'Purchase')]");
                // handle cases where the case is weird
                if (!purchaseButton) { [purchaseButton] = await page.$x("//button[contains(., 'purchase')]"); }
                if (!purchaseButton) { [purchaseButton] = await page.$x("//button[contains(., 'PURCHASE')]"); }
                if (purchaseButton) { await purchaseButton.click(); }

                await sleep(100);

                let [checkoutButton] = await page.$x("//button[contains(., 'Checkout')]");
                // handle cases where the case is weird
                if (!checkoutButton) { [checkoutButton] = await page.$x("//button[contains(., 'checkout')]"); }
                if (!checkoutButton) { [checkoutButton] = await page.$x("//button[contains(., 'CHECKOUT')]"); }
                if (checkoutButton) { await checkoutButton.click(); }

                await sleep(1000);

                contents = await page.content();
                fs.writeFile(`./scrapes/${Date.now()}.txt`, contents, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log('Checkout saved!');
                });

                let newCookies = await page.cookies();
                let newUrl = await page.url();
                await browser.close();
                openHeadful(newUrl, proxy, newCookies, login);
            }
        }
    } catch (error) {
        console.log('Error loading site: ' + error);
        await browser.close();
        return;
    }
}

async function openHeadful(url, proxy, cookies, login) {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            `--proxy-server=${proxy}`
        ]
    });
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.authenticate(login);

    try {
        page.goto(url);
    } catch (error) {
        console.log('Gmail login error.');
        await browser.close();
        return null;
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}