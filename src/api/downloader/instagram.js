import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { createApiKeyMiddleware } from "../../middleware/apikey.js"

puppeteer.use(StealthPlugin())

export default (app) => {
  function transformResponse(apiResponse) {
    if (!apiResponse) {
      return []
    }

    let items = []

    if (Array.isArray(apiResponse)) {
      items = apiResponse
    } else if (typeof apiResponse === "object") {
      items = [apiResponse]
    } else {
      return []
    }

    return items.map((item) => {
      const mainUrl = item.url && Array.isArray(item.url) && item.url[0] ? item.url[0].url : ""
      const thumbnailUrl = item.thumb || ""

      return {
        thumbnail: thumbnailUrl,
        url: mainUrl,
      }
    }).filter((item) => item.url)
  }

  async function tryFastdl(instagramUrl) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()

    return new Promise(async (resolve, reject) => {
      let apiResponse = null
      let responseReceived = false

      page.on("response", async (response) => {
        if (response.url().includes("/api/convert") && !responseReceived) {
          responseReceived = true
          try {
            apiResponse = await response.json()
            const transformedData = transformResponse(apiResponse)
            await browser.close()
            resolve(transformedData)
          } catch (error) {
            await browser.close()
            reject(error)
          }
        }
      })

      await page.setRequestInterception(true)
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
          req.abort()
        } else {
          req.continue()
        }
      })

      try {
        await page.goto("https://fastdl.app/id", { waitUntil: "domcontentloaded" })
        await page.type("#search-form-input", instagramUrl)
        await page.click(".search-form__button")

        setTimeout(async () => {
          if (!responseReceived) {
            await browser.close()
            reject(new Error("Timeout waiting for API response"))
          }
        }, 30000)

      } catch (error) {
        await browser.close()
        reject(error)
      }
    })
  }

  async function tryIgram(instagramUrl) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()

    return new Promise(async (resolve, reject) => {
      let apiResponse = null
      let responseReceived = false

      page.on("response", async (response) => {
        if (response.url().includes("/api/convert") && !responseReceived) {
          responseReceived = true
          try {
            apiResponse = await response.json()
            const transformedData = transformResponse(apiResponse)
            await browser.close()
            resolve(transformedData)
          } catch (error) {
            await browser.close()
            reject(error)
          }
        }
      })

      await page.setRequestInterception(true)
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
          req.abort()
        } else {
          req.continue()
        }
      })

      try {
        await page.goto("https://igram.world/id/", { waitUntil: "networkidle2" })
        await page.waitForSelector("#search-form-input", { visible: true })
        await page.type("#search-form-input", instagramUrl)
        await page.waitForSelector(".search-form__button", { visible: true })
        await page.evaluate(() => {
          document.querySelector(".search-form__button")?.click()
        })

        setTimeout(async () => {
          if (!responseReceived) {
            await browser.close()
            reject(new Error("Timeout waiting for API response"))
          }
        }, 30000)

      } catch (error) {
        await browser.close()
        reject(error)
      }
    })
  }

  async function downloadInstagram(instagramUrl) {
    try {
      return await tryFastdl(instagramUrl)
    } catch (error) {
      try {
        return await tryIgram(instagramUrl)
      } catch (fallbackError) {
        throw new Error("Both services failed")
      }
    }
  }

  app.get("/downloader/instagram", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.query

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "Parameter URL is required",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "URL must be a non-empty string",
        })
      }

      const result = await downloadInstagram(url.trim())
      if (!result || result.length === 0) {
        return res.status(404).json({
          status: false,
          error: "No download links found for the provided URL",
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

  app.post("/downloader/instagram", createApiKeyMiddleware(), async (req, res) => {
    try {
      const { url } = req.body

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "Parameter URL is required",
        })
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({
          status: false,
          error: "URL must be a non-empty string",
        })
      }

      const result = await downloadInstagram(url.trim())
      if (!result || result.length === 0) {
        return res.status(404).json({
          status: false,
          error: "No download links found for the provided URL",
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