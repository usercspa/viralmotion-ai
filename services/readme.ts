// Usage examples (for developers)

// Import the factory
// import { createServices } from "@/services"
// const { video, trends, social, analytics } = createServices()

// Generate a script
// const s = await video.generateScript({ idea, videoType: "product_demo", tone: "professional", platforms: ["YouTube"] })

// Start a video job
// const job = await video.startVideoJob({ templateId, brand: { primary, secondary, font }, script: s.script })
// Poll status:
// const status = await video.getJobStatus(job.jobId)

// Get trends
// const hashtags = await trends.getTrendingHashtags("SaaS")

// Publish
// const res = await social.publish({ videoId, platforms, captions, schedule: null })

// Analytics
// const overview = await analytics.getOverview("30d")
// const timeseries = await analytics.getTimeSeries("30d")
