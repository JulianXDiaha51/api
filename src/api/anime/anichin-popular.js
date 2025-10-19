import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function scrape(url) {
    try {
      const { data } = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
      const $ = cheerio.load(data)
      const popularToday = []

      $(".bixbox .listupd .bsx").each((_, element) => {
        const title = $(element).find(".tt").text().trim()
        const episode = $(element).find(".bt .epx").text().trim()
        const type = $(element).find(".typez").text().trim()
        const link = $(element).find("a").attr("href")
        const image = $(element).find("img").attr("src")
        popularToday.push({
          title: title,
          episode: episode,
          type: type,
          link: link,
          image: image,
        })
      })
      return popularToday
    } catch (error) {
      console.error("API Error:", error.message)
      throw new Error("Error scraping data: " + error.message)
    }
  }

  async function getRedirectUrl(domain) {
    try {
      const response = await axios.get(domain, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
      const $ = cheerio.load(response.data)
      const redirectScriptContent = $("script").filter(function () {
        return $(this).html()?.includes("setTimeout")
      }).html()

      if (!redirectScriptContent) {
        throw new Error("Redirect script content not found")
      }

      const urlMatch = redirectScriptContent.match(/location\.href = '(https:\/\/[^']+)'/)
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1]
      } else {
        throw new Error("Redirect URL not found in script")
      }
    } catch (error) {
      console.error("API Error:", error.message)
      throw new Error("Error fetching the page: " + error.message)
    }
  }

  app.get("/anime/anichin-popular", createApiKeyMiddleware(), async (req, res) => {
    try {
      const domain = "https://anichin.team/"
      const redirectUrl = await getRedirectUrl(domain)
      const data = await scrape(redirectUrl)

      res.status(200).json({
        status: true,
        data: data,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Internal Server Error",
      })
    }
  })

  app.post("/anime/anichin-popular", createApiKeyMiddleware(), async (req, res) => {
    try {
      const domain = "https://anichin.team/"
      const redirectUrl = await getRedirectUrl(domain)
      const data = await scrape(redirectUrl)

      res.status(200).json({
        status: true,
        data: data,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Internal Server Error",
      })
    }
  })
}