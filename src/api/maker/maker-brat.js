import axios from "axios"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  async function generateBratImage(text, background = null, color = null) {
    try {
      const params = new URLSearchParams()
      params.append("text", text)

      if (background) {
        params.append("background", background)
      }

      if (color) {
        params.append("color", color)
      }

      const response = await axios.get(`https://raolbyte-brat.hf.space/maker/brat?${params.toString()}`, {
        timeout: 30000,
        headers: {
          "User-Agent": "Raol-APIs/2.0.0",
        },
      })

      if (response.data && response.data.image_url) {
        const imageResponse = await axios.get(response.data.image_url, {
          responseType: "arraybuffer",
          timeout: 30000,
          headers: {
            "User-Agent": "Raol-APIs/2.0.0",
          },
        })

        return Buffer.from(imageResponse.data)
      } else {
        throw new Error("Invalid response from BRAT API")
      }
    } catch (error) {
      console.error("Error generating BRAT image:", error)

      if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout - BRAT API took too long to respond")
      } else if (error.response) {
        throw new Error(`BRAT API error: ${error.response.status} - ${error.response.statusText}`)
      } else if (error.request) {
        throw new Error("Network error - Could not reach BRAT API")
      } else {
        throw new Error(`BRAT generation failed: ${error.message}`)
      }
    }
  }

  async function generateBratVideo(text, background = null, color = null) {
    try {
      const params = new URLSearchParams()
      params.append("text", text)

      if (background) {
        params.append("background", background)
      }

      if (color) {
        params.append("color", color)
      }

      const response = await axios.get(`https://raolbyte-brat.hf.space/maker/bratvid?${params.toString()}`, {
        timeout: 60000,
        headers: {
          "User-Agent": "Raol-APIs/2.0.0",
        },
      })

      if (response.data && response.data.video_url) {
        const videoResponse = await axios.get(response.data.video_url, {
          responseType: "arraybuffer",
          timeout: 60000,
          headers: {
            "User-Agent": "Raol-APIs/2.0.0",
          },
        })

        return Buffer.from(videoResponse.data)
      } else {
        throw new Error("Invalid response from BRATVID API")
      }
    } catch (error) {
      console.error("Error generating BRAT video:", error)

      if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout - BRATVID API took too long to respond")
      } else if (error.response) {
        throw new Error(`BRATVID API error: ${error.response.status} - ${error.response.statusText}`)
      } else if (error.request) {
        throw new Error("Network error - Could not reach BRATVID API")
      } else {
        throw new Error(`BRATVID generation failed: ${error.message}`)
      }
    }
  }

  app.get("/maker/brat", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text, background, color } = req.query

      if (!text) {
        return res.status(400).json({
          status: false,
          error: "Missing required parameter",
          message: "The 'text' parameter is required",
        })
      }

      if (text.length > 500) {
        return res.status(400).json({
          status: false,
          error: "Text too long",
          message: "Text must be 500 characters or less",
        })
      }

      if (background && !/^#[0-9A-Fa-f]{6}$/.test(background)) {
        return res.status(400).json({
          status: false,
          error: "Invalid background color",
          message: "Background color must be in hex format (e.g., #000000)",
        })
      }

      if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return res.status(400).json({
          status: false,
          error: "Invalid text color",
          message: "Text color must be in hex format (e.g., #FFFFFF)",
        })
      }

      const imageBuffer = await generateBratImage(text, background, color)

      res.setHeader("Content-Type", "image/png")
      res.setHeader("Content-Length", imageBuffer.length)
      res.setHeader("Cache-Control", "public, max-age=3600")
      res.setHeader("Content-Disposition", `inline; filename="brat_${Date.now()}.png"`)

      res.end(imageBuffer)
    } catch (error) {
      console.error("BRAT API Error:", error)

      res.status(500).json({
        status: false,
        error: "Image generation failed",
        message: error.message || "Failed to generate BRAT image",
      })
    }
  })

  app.get("/maker/bratvid", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { text, background, color } = req.query

      if (!text) {
        return res.status(400).json({
          status: false,
          error: "Missing required parameter",
          message: "The 'text' parameter is required",
        })
      }

      if (text.length > 500) {
        return res.status(400).json({
          status: false,
          error: "Text too long",
          message: "Text must be 500 characters or less",
        })
      }

      if (background && !/^#[0-9A-Fa-f]{6}$/.test(background)) {
        return res.status(400).json({
          status: false,
          error: "Invalid background color",
          message: "Background color must be in hex format (e.g., #000000)",
        })
      }

      if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return res.status(400).json({
          status: false,
          error: "Invalid text color",
          message: "Text color must be in hex format (e.g., #FFFFFF)",
        })
      }

      const videoBuffer = await generateBratVideo(text, background, color)

      res.setHeader("Content-Type", "video/mp4")
      res.setHeader("Content-Length", videoBuffer.length)
      res.setHeader("Cache-Control", "public, max-age=3600")
      res.setHeader("Content-Disposition", `inline; filename="bratvid_${Date.now()}.mp4"`)
      res.setHeader("Accept-Ranges", "bytes")
      res.setHeader("Access-Control-Allow-Origin", "*")
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
      res.setHeader("Access-Control-Allow-Headers", "Range")

      if (req.method === "HEAD") {
        return res.end()
      }

      const range = req.headers.range
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = Number.parseInt(parts[0], 10)
        const end = parts[1] ? Number.parseInt(parts[1], 10) : videoBuffer.length - 1
        const chunksize = end - start + 1
        const chunk = videoBuffer.slice(start, end + 1)

        res.status(206)
        res.setHeader("Content-Range", `bytes ${start}-${end}/${videoBuffer.length}`)
        res.setHeader("Content-Length", chunksize)
        res.end(chunk)
      } else {
        res.end(videoBuffer)
      }
    } catch (error) {
      console.error("BRATVID API Error:", error)

      res.status(500).json({
        status: false,
        error: "Video generation failed",
        message: error.message || "Failed to generate BRAT video",
      })
    }
  })
}
