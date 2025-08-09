export interface JobQueueStatus {
  position: number
  estimatedStartTime: Date
  queueLength: number
  averageProcessingTime: number
}
