// Singleton access to Runway service (and warm resume helpers)

import { RunwayAPIService } from "@/services/runway-api"

let _service: RunwayAPIService | null = null

export function getRunwayService() {
  if (!_service) {
    _service = new RunwayAPIService()
  }
  return _service
}
