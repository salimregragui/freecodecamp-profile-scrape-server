const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fs = require("fs");

const app = express();
app.use(cors());

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());

app.get("/api/search/:name", (req, res) => {
  const url = "https://www.freecodecamp.org/" + req.params.name;

  const allChallengesDone = [];

  try {
    const chromeOptions = {
      headless: true,
      defaultViewport: null,
      args: ["--incognito", "--no-sandbox", "--single-process", "--no-zygote"],
    };

    (async () => {
      const browser = await puppeteer.launch(chromeOptions);

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
              "https://www.freecodecamp.org" +
              $(el).children("td").first().children("a").attr("href"),
            date: $(el).children("td").eq(2).children().first().text(),
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
        req.params.name + ".json",
        JSON.stringify(allChallengesDone, null, 2),
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log("Successfully written data to file");
        }
      );

      res.send(allChallengesDone);
    })();
  } catch (e) {
    console.log(e);
  }
});

const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there
app.listen(port, () => console.log(`Server up and running on port ${port} !`));
