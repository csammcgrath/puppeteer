const prompt = require('prompt');
const puppeteer = require('puppeteer');
const asyncLib = require('async');
const path = 'https://byui.brightspace.com/d2l/home';
const functions = [
   promptUser,
   start
];
var isAuthenticated = false;

async function start(data) {
   let courses = [
      10011,
   ];

   await courses.map(async course => await launchPuppeteer(data, course));
}

function promptUser(promptUserCallback) {
   let schema = {
      properties: {
         user: {
            pattern: /[a-zA-Z\d\s]+/,
            default: 'cct_allstars67',
            message: 'user must be only letters, spaces and numbers.',
            required: true
         },
         password: {
            pattern: /[a-zA-Z\d\s]+/,
            message: 'password must be only letters, spaces and numbers.',
            replace: '*',
            hidden: true,
            required: true
         }
      }
   };

   prompt.start();

   prompt.get(schema, (err, results) => {
      if (err) promptUserCallback(err);

      promptUserCallback(null, results);
   });
}

async function launchPuppeteer(data, url) {
   const browser = await puppeteer.launch();
   const page = await browser.newPage();

   if (!isAuthenticated) {
      console.log('Authenticating...')

      //begin authentication
      let tempUrl = 'https://byui.brightspace.com/d2l/login?noredirect=true';
      await page.goto(tempUrl);

      //insert information submitted by user
      await page.evaluate(data => {
         document.querySelector('#userName').value = data.user;
         document.querySelector('#password').value = data.password;
         document.querySelector('.d2l-button').click();
      }, data);

      //TODO: add error handling here!
      await page.waitForNavigation();
      console.log(`URL: ${page.url()}`);
      console.log('Authenticated.');
      isAuthenticated = true;
   }

   await page.screenshot({
      path: 'screenshot.png'
   });
   console.log('Screenshot inserted');

   // let updatedUrl = `${path}/${url}`;

   // await page.goto(updatedUrl);
   // await page.waitForNavigation();
   // console.log(`URL: ${page.url()}`);

   await browser.close();
}

asyncLib.waterfall(functions, (waterfallErr, results) => {
   if (waterfallErr) {
      console.log(`Error: ${waterfallErr}`);
   }

   console.log('Success');
});