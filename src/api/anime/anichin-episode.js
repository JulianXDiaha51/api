import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function scrapeEpisodeList(url) {
    try {
      const { data } = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
      const $ = cheerio.load(data)
      const episodes = []

      $(".eplister ul li").each((_, element) => {
        const episodeNumber = $(element).find(".epl-num").text().trim()
        const title = $(element).find(".epl-title").text().trim()
        const subStatus = $(element).find(".epl-sub .status").text().trim()
        const releaseDate = $(element).find(".epl-date").text().trim()
        const link = $(element).find("a").attr("href")
        episodes.push({
          episodeNumber: episodeNumber,
          title: title,
          subStatus: subStatus,
          releaseDate: releaseDate,
          link: link,
        })
      })
      return episodes
    } catch (error) {
      console.error("API Error:", error.message)
      throw new Error("Failed to get response from API")
    }
  }

  app.get("/anime/anichin-episode", createApiKeyMiddleware(), async (req, res) => {
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

      const data = await scrapeEpisodeList(url.trim())

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

  app.post("/anime/anichin-episode", createApiKeyMiddleware(), async (req, res) => {
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

      const data = await scrapeEpisodeList(url.trim())

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