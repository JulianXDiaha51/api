import axios from "axios"
import * as cheerio from "cheerio"
import FormData from "form-data"
import * as tough from "tough-cookie"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

export default (app) => {
  class SnapTikClient {
    constructor(config = {}) {
      this.config = {
        baseURL: "https://snaptik.app",
        ...config,
      }

      const cookieJar = new tough.CookieJar()
      this.axios = axios.create({
        ...this.config,
        withCredentials: true,
        jar: cookieJar,
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
          "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: 30000,
      })
    }

    async get_token() {
      const { data } = await this.axios.get("/en2", {
        headers: {
          "Referer": "https://snaptik.app/en2",
        },
      })
      const $ = cheerio.load(data)
      return $("input[name=\"token\"]").val()
    }

    async get_script(url) {
      const form = new FormData()
      const token = await this.get_token()

      if (!token) {
        throw new Error("Failed to get token")
      }

      form.append("url", url)
      form.append("lang", "en2")
      form.append("token", token)

      const { data } = await this.axios.post("/abc2.php", form, {
        headers: {
          ...form.getHeaders(),
          "authority": "snaptik.app",
          "accept": "*/*",
          "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "origin": "https://snaptik.app",
          "referer": "https://snaptik.app/en2",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
        },
      })
      return data
    }

    async eval_script(script1) {
      const script2 = await new Promise((resolve) =>
        Function("eval", script1)(resolve)
      )

      return new Promise((resolve, reject) => {
        let html = ""
        const mockObjects = {
          $: () => ({
            remove() {},
            style: { display: "" },
            get innerHTML() {
              return html
            },
            set innerHTML(t) {
              html = t
            },
          }),
          app: { showAlert: reject },
          document: { getElementById: () => ({ src: "" }) },
          fetch: (a) => {
            resolve({ html, oembed_url: a })
            return { json: () => ({ thumbnail_url: "" }) }
          },
          gtag: () => 0,
          Math: { round: () => 0 },
          XMLHttpRequest: function () {
            return { open() {}, send() {} }
          },
          window: { location: { hostname: "snaptik.app" } },
        }

        try {
          Function(
            ...Object.keys(mockObjects),
            script2
          )(...Object.values(mockObjects))
        } catch (error) {
          console.log("Eval error saved to eval.txt:", error.message)
          reject(error)
        }
      })
    }

    async get_hd_video(hdUrl, backupUrl) {
      try {
        const { data } = await this.axios.get(hdUrl)
        if (data && data.url) {
          return data.url
        }
      } catch (error) {
        console.log("HD URL failed, using backup:", error.message)
      }
      return backupUrl
    }

    async parse_html(html) {
      const $ = cheerio.load(html)
      const isVideo = !$("div.render-wrapper").length

      const thumbnail = $(".avatar").attr("src") || $("#thumbnail").attr("src")
      const title = $(".video-title").text().trim()
      const creator = $(".info span").text().trim()

      if (isVideo) {
        const hdButton = $("div.video-links > button[data-tokenhd]")
        const hdTokenUrl = hdButton.data("tokenhd")
        const backupUrl = hdButton.data("backup")

        let hdUrl = null
        if (hdTokenUrl) {
          hdUrl = await this.get_hd_video(hdTokenUrl, backupUrl)
        }

        const videoUrls = [
          hdUrl || backupUrl,
          ...$("div.video-links > a:not(a[href=\"/\"])")
            .map((_, elem) => $(elem).attr("href"))
            .get()
            .filter((url) => url && !url.includes("play.google.com"))
            .map((x) => (x.startsWith("/") ? this.config.baseURL + x : x)),
        ].filter(Boolean)

        return {
          type: "video",
          urls: videoUrls,
          metadata: {
            title: title || null,
            description: title || null,
            thumbnail: thumbnail || null,
            creator: creator || null,
          },
        }
      } else {
        const photos = $("div.columns > div.column > div.photo")
          .map((_, elem) => ({
            urls: [
              $(elem).find("img[alt=\"Photo\"]").attr("src"),
              $(elem)
                .find("a[data-event=\"download_albumPhoto_photo\"]")
                .attr("href"),
            ],
          }))
          .get()

        return {
          type: photos.length === 1 ? "photo" : "slideshow",
          urls:
            photos.length === 1
              ? photos[0].urls
              : photos.map((photo) => photo.urls),
          metadata: {
            title: title || null,
            description: title || null,
            thumbnail: thumbnail || null,
            creator: creator || null,
          },
        }
      }
    }

    async process(url) {
      try {
        const script = await this.get_script(url)
        const { html, oembed_url } = await this.eval_script(script)
        const result = await this.parse_html(html)

        return {
          original_url: url,
          oembed_url,
          type: result.type,
          urls: result.urls,
          metadata: result.metadata,
        }
      } catch (error) {
        console.error("Process error:", error.message)
        return {
          original_url: url,
          error: error.message,
        }
      }
    }
  }

  async function scrapeTiktok(url) {
    try {
      const client = new SnapTikClient()
      return await client.process(url)
    } catch (error) {
      console.error("Tiktok scrape error:", error)
      return null
    }
  }

  app.get("/downloader/tiktok", createApiKeyMiddleware(), async (req, res) => {
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

      const result = await scrapeTiktok(url.trim())
      if (!result) {
        return res.status(500).json({
          status: false,
          error: result?.error || "Failed to process TikTok URL",
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

  app.post("/downloader/tiktok", createApiKeyMiddleware(), async (req, res) => {
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

      const result = await scrapeTiktok(url.trim())
      if (!result) {
        return res.status(500).json({
          status: false,
          error: result?.error || "Failed to process TikTok URL",
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