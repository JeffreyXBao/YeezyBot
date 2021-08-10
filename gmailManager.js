const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const fs = require('fs');

// open the gmail login window
exports.login = async function() {
    const browser = await puppeteer.launch({
        headless: false,
        args: []
    });
    const page = await browser.newPage();
    try {
        page.goto('https://mail.google.com');
        return [browser, page];
    } catch (error) {
        console.log("Gmail login error.");
        await browser.close();
        return null;
    }
}

// function to test cookies
exports.testCookies = async function(cookies) {
    const browser = await puppeteer.launch({
        headless: false,
        args: []
    });
    const page = await browser.newPage();
    
    await page.setCookie(...cookies);

    try {
        page.goto('https://mail.google.com');
        return [browser, page];
    } catch (error) {
        console.log("Gmail login error.");
        await browser.close();
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}