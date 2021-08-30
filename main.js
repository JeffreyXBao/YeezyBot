var readline = require('readline');
const fs = require('fs');
var gmailManager = require('./gmailManager.js');
var taskManager = require('./taskManager.js');
var proxyManager = require('./proxyManager.js');

async function main() {
    console.log(`
 __          __  _                                _             __     __                 ____        _   
 \\ \\        / / | |                              | |            \\ \\   / /                |  _ \\      | |  
  \\ \\  /\\  / /__| | ___ ___  _ __ ___   ___      | |_ ___        \\ \\_/ /__  ___ _____   _| |_) | ___ | |_ 
   \\ \\/  \\/ / _ \\ |/ __/ _ \\| '_ \` _ \\ / _ \\     | __/ _ \\        \\   / _ \\/ _ \\_  / | | |  _ < / _ \\| __|
    \\  /\\  /  __/ | (_| (_) | | | | | |  __/     | || (_) |        | |  __/  __// /| |_| | |_) | (_) | |_ 
     \\/  \\/ \\___|_|\\___\\___/|_| |_| |_|\\___|      \\__\\___/         |_|\\___|\\___/___|\\__, |____/ \\___/ \\__|
                                                                                     __/ |                
                                                                                    |___/                 
    `);

    let gmails = [];
    let rl = readline.createInterface(process.stdin, process.stdout);

    console.log("Initializing gmail collection...");
    await getGmail();

    // gmail collection process to increase recaptcha score, initializes the postGmail process when done
    async function getGmail() {
        let [browser, loginPage] = await gmailManager.login();
        rl.question('Press enter to complete collection of this gmail. Type \'d\' if done collecting: ', async (txt) => {
            // harvest and close
            gmails.push(await loginPage.cookies());
            await browser.close();

            // collect more or stop and begin postGmail
            if (txt.includes('d')) {
                postGmail();
            } else {
                getGmail();
            }
        });
    }

    // all post gmail processes: testing proxies and initalizing tasks
    async function postGmail() {
        console.log(`\nCollected ${gmails.length} gmails.\n`)

        //taskManager.testButton();
        let [proxy, user, passes] = await getProxies();
        proxyManager.getValidCombos(gmails, proxy, user, passes, (validCombos) => {
            console.log(`Valid proxy Gmail combos: ${validCombos.length}`);

            rl.question('Enter product URL: ', async (url) => {
                for (let i = 0; i < validCombos.length; i++) {
                    let combo = validCombos[i];
                    taskManager.connectProxied(url, proxy, combo["gmail"], combo["login"]);
                }
            });
        });
    }
}

// update array based on txt file
function getProxies() {
    return new Promise((resolve, reject) => {
        fs.readFile('proxies.txt', 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            let lines = data.split('\n');

            let user = lines[0].split(':')[0];
            let proxy = 'proxy.packetstream.io:31112';

            for (let i = 0; i < lines.length; i++) {
                let temp = lines[i].split('@')[0];
                lines[i] = temp.split(':')[1]; 
            }
            resolve([proxy, user, lines]);
        });
    });
}

main();