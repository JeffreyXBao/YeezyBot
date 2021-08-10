var readline = require('readline');
var gmailManager = require('./gmailManager.js');

async function main() {
    let cookies = null;
    let rl = readline.createInterface(process.stdin, process.stdout);
    let [browser, loginPage] = await gmailManager.login();

    rl.question('Press enter when done logging in ', async (txt) => {
        cookies = await loginPage.cookies();
        await browser.close();
        gmailManager.testCookies(cookies);
        rl.close();
    });
}

main();