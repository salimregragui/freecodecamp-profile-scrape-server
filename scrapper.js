const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const fs = require("fs");

module.exports = async (username) => {
  const url = "https://www.freecodecamp.org/" + username;

  const allChallengesDone = [];

  try {
    (async () => {
      const browser = await puppeteer.launch({
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });

      const page = await browser.newPage();

      await page.goto(url);

      await page.screenshot({ path: "example.png" });

      const pageData = await page.evaluate(() => {
        return {
          html: document.documentElement.innerHTML,
        };
      });

      const $ = cheerio.load(pageData.html);

      const allLis = $("li.timeline-pagination_list_item");

      const totalPages = $(allLis[2]).text().split(" ")[2];

      for (let i = 0; i < totalPages; i++) {
        const pageData = await page.evaluate(() => {
          return {
            html: document.documentElement.innerHTML,
          };
        });

        const $ = cheerio.load(pageData.html);

        const challenges = $("tr.timeline-row");

        challenges.each((idx, el) => {
          allChallengesDone.push({
            name: $(el).children("td").first().children("a").text(),
            link:
              "https://www.freecodecamp.org/" +
              $(el).children("td").first().children("a").attr("href"),
          });
        });

        await page.$eval(
          'li.timeline-pagination_list_item > button[aria-label="Go to next page"]',
          (elem) => elem.click()
        );
      }

      await browser.close();

      console.log(allChallengesDone);

      fs.writeFile(
        username + ".json",
        JSON.stringify(allChallengesDone, null, 2),
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log("Successfully written data to file");
        }
      );

      return allChallengesDone;
    })();
  } catch (e) {
    console.log(e);
  }
};
