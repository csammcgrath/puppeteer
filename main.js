const prompt = require('prompt');
const puppeteer = require('puppeteer');
const asyncLib = require('async');
const path = 'https://byui.brightspace.com/d2l/le/content';
const functions = [
   promptUser,
   start
];
var isAuthenticated = false;

/**
 * start(data)
 * @param {object} data username and password given to us by user
 * 
 * This function iterates through all of the preselected courses.
 **/
async function start(data) {
   let courses = [
      10011,
   ];

   await courses.map(async course => await launchPuppeteer(data, course));
}

/**
 * promptUser(promptUserCallback)
 * @param {callback} promptUserCallback the callback to pass the data object to
 * 
 * This function prompts the user for the username and password to use
 * for the program.
 * 
 * TODO
 * - Add checking for environment variables so user doesn't have to insert
 * multiple times
 **/
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

/**
 * launchPuppeteer(data, url)
 * @param {object} data username and password given to us by user
 * @param {int} url the course id
 * 
 * This function goes through and call different functions to get
 * the job done
 **/
async function launchPuppeteer(data, url) {
   const browser = await puppeteer.launch();
   const page = await browser.newPage();

   if (!isAuthenticated) await authenticate(page, data);

   let updatedUrl = `${path}/${url}/Home`;

   await page.goto(updatedUrl);
   await getScreenshot(page);
   await getPDF(page)
   await browser.close();
}

/**
 * authenticate(page, data)
 * @param {Page} page the current page we are on
 * @param {object} data username and password given to us by user
 * 
 * This function goes through the authentication phase.
 * 
 * TODO: 
 * - Error handling -> wrong user information
 **/
async function authenticate(page, data) {
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
   await page.waitForSelector('body > header > nav > div.d2l-navigation-s-main.d2l-navigation-main-tb > div > div > div');
   isAuthenticated = true;
   console.log('Authenticated.');
}

/**
 * getScreenshot(page)
 * @param {Page} page the current page we are on
 * 
 * This function calls the puppeteer api to take 
 * a screenshot.
 **/
async function getScreenshot(page) {
   await page.screenshot({
      path: 'screenshot.png'
   });
   console.log('Screenshot inserted');
}

/**
 * getPDF(page)
 * @param {Page} page the current page we are on
 * 
 * This function calls the puppeteer api to convert 
 * the headless Chromium to mobile format and then 
 * converts it to pdf.
 **/
async function getPDF(page) {
   await page.emulateMedia('screen');
   await page.pdf({
      path: 'page.pdf'
   });

   console.log('PDF inserted');
}

asyncLib.waterfall(functions, (waterfallErr, results) => {
   if (waterfallErr) {
      console.log(`Error: ${waterfallErr}`);
   }

   console.log('Success');
});

//selectors
//d2l-button d2l-loadmore-pager <=== load more button