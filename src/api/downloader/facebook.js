import axios from "axios"
import * as cheerio from "cheerio"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function fb(url) {
    try {
      const validUrl = /(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/
      if (!validUrl.test(url)) {
        throw new Error("Invalid URL provided")
      }

      const encodedUrl = encodeURIComponent(url)
      const formData = `url=${encodedUrl}&lang=en&type=redirect`

      const response = await axios.post("https://getvidfb.com/", formData, {
        headers: {
          'authority': 'getvidfb.com',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'max-age=0',
          'content-type': 'application/x-www-form-urlencoded',
          'origin': 'https://getvidfb.com',
          'referer': 'https://getvidfb.com/',
          'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
        },
        timeout: 30000,
      })

      const $ = cheerio.load(response.data)
      
      const videoContainer = $('#snaptik-video')
      if (!videoContainer.length) {
        throw new Error("Video container not found")
      }

      const thumb = videoContainer.find('.snaptik-left img').attr('src')
      const title = videoContainer.find('.snaptik-middle h3').text().trim()

      const hasil = []

      videoContainer.find('.abuttons a').each((_, el) => {
        const link = $(el).attr('href')
        const spanText = $(el).find('.span-icon span').last().text().trim()
        
        if (link && spanText && link.startsWith('http')) {
          let resolution = 'Unknown'
          let format = 'Unknown'
          
          if (spanText.includes('HD')) {
            resolution = 'HD'
            format = 'mp4'
          } else if (spanText.includes('SD')) {
            resolution = 'SD'
            format = 'mp4'
          } else if (spanText.includes('Mp3') || spanText.includes('Audio')) {
            resolution = 'Audio'
            format = 'mp3'
          } else if (spanText.includes('Photo') || spanText.includes('Jpg')) {
            resolution = 'Photo'
            format = 'jpg'
          }

          hasil.push({
            url: link,
            resolution,
            format,
          })
        }
      })

      if (hasil.length === 0) {
        throw new Error("No download links found for the provided URL.")
      }

      return {
        thumbnail: thumb,
        title: title || "Facebook Video",
        data: hasil,
      }

    } catch (err) {
      throw new Error(err.message || "Failed to retrieve data from Facebook video")
    }
  }

  app.get("/downloader/facebook", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "Parameter 'url' is required",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "Parameter 'url' must be a non-empty string",
        })
      }

      const result = await fb(url.trim())
      if (!result) {
        return res.status(500).json({
          status: false,
          error: "No result returned from API",
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

  app.post("/downloader/facebook", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.body

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "Parameter 'url' is required",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "Parameter 'url' must be a non-empty string",
        })
      }

      const result = await fb(url.trim())
      if (!result) {
        return res.status(500).json({
          status: false,
          error: "No result returned from API",
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