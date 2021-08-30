const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

exports.getValidCombos = async function(gmails, proxy, user, passes, callback) {
    let valid = [];
    let promises = [];
    for (let i = 0; i < passes.length; i++) {
        let gmail = gmails[i % gmails.length];
        let pass = passes[i];
        let login = {'username':user, 'password':pass};
        promises.push(checkCombo(gmail, proxy, login));
    }
    Promise.all(promises).then((values) => {
        console.log("Done checking all proxies!");
        callback(valid);
    });

    function checkCombo(gmail, proxy, login) {
        return new Promise((resolve, reject) => {
            getScore(gmail, proxy, login, (score) => {
                if (score >= 0.7) {
                    console.log(`\tProxy: ${proxy} has recaptcha v3 score: ${score} GOOD!`);
                    valid.push({"gmail":gmail, "login":login});
                    resolve();
                } else {
                    console.log(`\tProxy: ${proxy} has recaptcha v3 score: ${score} BAD!`);
                    resolve();
                }
            });
        });
    }
}

let connections = 0;

async function getScore(cookies, proxy, login, callback) {
    await sleep(getRandomInt(2000));

    while (connections > 10) {
        await sleep(100);
    }
    connections++;

    const browser = await puppeteer.launch({
        // headless: false,
        args: [
            `--proxy-server=${proxy}`
        ]
    });
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.authenticate(login);

    try {
        await page.goto('https://recaptcha-test.ghostaio.com/v3-recaptcha-test');
        let contents = await page.content();

        for (let i = 0; i < 10; i++) {
            await sleep(1000);
            contents = await page.content();
            let key = '"score": ';
            if (contents.includes(key)) {
                let start = contents.indexOf(key) + key.length;
                let score = parseFloat(contents.substring(start, start + 3));
                await browser.close();
                connections--;
                callback(score);
                return;
            }
        }
        await browser.close();
        connections--;
        callback(-1);
    } catch (error) {
        console.log('Error loading site: ' + error);
        await browser.close();
        connections--;
        callback(-1);
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}