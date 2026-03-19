---
name: ocr_action
description: >
  OCR commands for extracting text from images and screenshots, with silent clipboard copy and interactive SmartBar display modes.
metadata:
  author: EnconvoAI
  version: "0.0.137"
---

## API Reference

Just use the `local_api` tool to request these APIs.

To view full parameter details for a specific endpoint, run: `node skills/scripts/api_detail.cjs <endpoint-path>`

| Endpoint | Description |
|----------|-------------|
| `ocr_action/ocr` | Convert image to text |
| `ocr_action/silent_screenshot_ocr` | Select the screen area for OCR and copy the OCR results to the clipboard. |
| `ocr_action/screenshot_ocr` | Select the screen area for OCR and show the OCR results in a smartbar window. |

