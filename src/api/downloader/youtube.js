import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function scrapeYoutubeCommunity(url) {
    try {
      const { data: response } = await axios.get(url)
      const $ = cheerio.load(response)
      const ytInitialData = JSON.parse(
        $("script")
          .text()
          .match(/ytInitialData = ({.*?});/)?.[1] || "{}"
      )

      const posts =
        ytInitialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents
          .flatMap((section) => section.itemSectionRenderer?.contents || [])
          .map((item) => {
            const postRenderer =
              item.backstagePostThreadRenderer?.post?.backstagePostRenderer
            if (!postRenderer) return null

            const images =
              postRenderer.backstageAttachment?.postMultiImageRenderer
                ?.images || []
            const imageUrls = images.map((imageObj) => {
              const thumbnails =
                imageObj.backstageImageRenderer.image.thumbnails
              return thumbnails[thumbnails.length - 1].url
            })

            return {
              postId: postRenderer.postId,
              author: postRenderer.authorText.simpleText,
              content:
                postRenderer.contentText?.runs
                  ?.map((run) => run.text)
                  .join("") || "",
              images: imageUrls,
            }
          })
          .filter(Boolean)

      return posts[0] || null
    } catch (error) {
      console.error("Youtube Community scrape error:", error.message)
      throw new Error("Failed to get response from API")
    }
  }

  app.get("/downloader/youtube", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "URL parameter is required",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "URL must be a non-empty string",
        })
      }

      const result = await scrapeYoutubeCommunity(url.trim())
      if (!result) {
        return res.status(404).json({
          status: false,
          error: "Failed to fetch community post or no post found",
        })
      }
      res.status(200).json({
        status: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || "Internal Server Error",
      })
    }
  })

  app.post("/downloader/youtube", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.body

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "URL parameter is required",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "URL must be a non-empty string",
        })
      }

      const result = await scrapeYoutubeCommunity(url.trim())
      if (!result) {
        return res.status(404).json({
          status: false,
          error: "Failed to fetch community post or no post found",
        })
      }
      res.status(200).json({
        status: true,
        data: result,
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