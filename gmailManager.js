const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const fs = require('fs');

// open the gmail login window
async function login() {
    const browser = await puppeteer.launch({
        headless: false,
        args: []
    });
    const page = await browser.newPage();
    try {
        await page.goto('https://mail.google.com');
    } catch (error) {
        console.log("Gmail login error.");
        await browser.close();
        return null;
    }
    return browser, page;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// init the gmail login process
exports.main = async function() {
    let browser, loginPage = await login();
    await sleep(10000);
    console.log(await loginPage.cookies());
}