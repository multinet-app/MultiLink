const puppeteer = require("puppeteer");

let page, browser;
const width = 1920;
const height = 1080;

beforeAll(async() => {
    browser = await puppeteer.launch({
        headless: true,
        args: [`--window-size=${width},${height}`]
    });
    page = await browser.newPage();
    await page.setViewport({ width, height });
});

afterAll(() => {
    browser.close();
});

describe("End to end", () => {
    describe("Visualization", () => {
        it("Clicking on node highlights it", async() => {

            // Arrange
            let node, value;
            await page.goto("http://127.0.0.1:8080/?workspace=test&graph=test");
            await page.waitForSelector(".nodeGroup");


            await page.click(".node.nodeBox");
            node = await page.evaluate(() => document.querySelectorAll(".node.nodeBox")[0].classList)
            console.log(node)
            expect(node[2]).toBe("clicked");

            await page.click(".node.nodeBox");
            node = await page.evaluate(() => document.querySelectorAll(".node.nodeBox")[0].classList)
            console.log(node)
            expect(node[2]).toBe(undefined);

        });

        it("Dragging node moves it", async() => {
            await page.goto("http://127.0.0.1:8080/?workspace=test&graph=test");
            await page.waitForSelector(".nodeGroup");
            await page.click(".nodeGroup");
            e = await page.$(".nodeGroup");
            box = await e.boundingBox();
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(1300, 500);
            await page.mouse.up();
            await page.click(".nodeGroup");

        });
    });
});




// describe("End to end") {
//     describe("Search panel") {

//     };
// };
// describe("End to end") {
//     describe("Config panel") {

//     };
// };