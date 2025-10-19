import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function scrape(query) {
    try {
      const url = `https://anichin.cafe/?s=${encodeURIComponent(query)}`
      const { data } = await axios.get(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
      const $ = cheerio.load(data)
      const results = []

      $(".listupd article").each((_, el) => {
        const title = $(el).find(".tt h2").text().trim()
        const type = $(el).find(".typez").text().trim()
        const status = $(el).find(".bt .epx").text().trim()
        const link = $(el).find("a").attr("href")
        const image = $(el).find("img").attr("src")
        results.push({
          title: title,
          type: type,
          status: status,
          link: link,
          image: image,
        })
      })
      return results
    } catch (error) {
      console.error("API Error:", error.message)
      throw new Error("Failed to get response from API")
    }
  }

  app.get("/anime/anichin-search", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { query } = req.query

      if (!query) {
        return res.status(400).json({
          status: false,
          error: "Query is required",
        })
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "Query must be a non-empty string",
        })
      }

      const results = await scrape(query.trim())

      if (!results || results.length === 0) {
        return res.status(404).json({
          status: false,
          error: "No results found for your query",
        })
      }

      res.status(200).json({
        status: true,
        data: results,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Internal Server Error",
      })
    }
  })

  app.post("/anime/anichin-search", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { query } = req.body

      if (!query) {
        return res.status(400).json({
          status: false,
          error: "Query is required",
        })
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "Query must be a non-empty string",
        })
      }

      const results = await scrape(query.trim())

      if (!results || results.length === 0) {
        return res.status(404).json({
          status: false,
          error: "No results found for your query",
        })
      }

      res.status(200).json({
        status: true,
        data: results,
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