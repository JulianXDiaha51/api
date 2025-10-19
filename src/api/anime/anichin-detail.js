import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function scrapeDetail(url) {
    try {
      const { data } = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
      const $ = cheerio.load(data)
      const title = $(".entry-title").text().trim()
      const thumbnail = $(".thumb img").attr("src")
      const rating = $(".rating strong").text().replace("Rating ", "").trim()
      const followers = $(".bmc").text().replace("Followed ", "").replace(" people", "").trim()
      const synopsis = $(".synp .entry-content").text().trim()
      const alternativeTitles = $(".alter").text().trim()
      const status = $(".info-content .spe span:contains(\"Status\")").text().replace("Status:", "").trim()
      const network = $(".info-content .spe span:contains(\"Network\") a").text().trim()
      const studio = $(".info-content .spe span:contains(\"Studio\") a").text().trim()
      const released = $(".info-content .spe span:contains(\"Released\")").text().replace("Released:", "").trim()
      const duration = $(".info-content .spe span:contains(\"Duration\")").text().replace("Duration:", "").trim()
      const season = $(".info-content .spe span:contains(\"Season\") a").text().trim()
      const country = $(".info-content .spe span:contains(\"Country\") a").text().trim()
      const type = $(".info-content .spe span:contains(\"Type\")").text().replace("Type:", "").trim()
      const episodes = $(".info-content .spe span:contains(\"Episodes\")").text().replace("Episodes:", "").trim()
      const genres = $(".genxed a").map((_, el) => $(el).text().trim()).get()

      return {
        title,
        thumbnail,
        rating,
        followers,
        synopsis,
        alternativeTitles,
        status,
        network,
        studio,
        released,
        duration,
        season,
        country,
        type,
        episodes,
        genres,
      }
    } catch (error) {
      console.error("API Error:", error.message)
      throw new Error("Failed to get response from API")
    }
  }

  app.get("/anime/anichin-detail", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "URL is required",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "URL must be a non-empty string",
        })
      }

      const data = await scrapeDetail(url.trim())

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

  app.post("/anime/anichin-detail", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.body

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "URL is required",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "URL must be a non-empty string",
        })
      }

      const data = await scrapeDetail(url.trim())

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