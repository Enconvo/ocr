---
name: ocr_action
description: >
  OCR commands for extracting text from images and screenshots, with silent clipboard copy and interactive SmartBar display modes.
metadata:
  author: EnconvoAI
  version: "0.0.148"
---

## API Reference

Just use the `local_api` tool to request these APIs.

| Endpoint | Description |
|----------|-------------|
| `ocr_action/ocr` | Convert image to text. Params: `context_files` (array), `image_files` (array) |
| `ocr_action/silent_screenshot_ocr` | Select the screen area for OCR and copy the OCR results to the clipboard.. _No params_ |
| `ocr_action/screenshot_ocr` | Select the screen area for OCR and show the OCR results in a smartbar window.. _No params_ |
| `ocr_action/models/enconvo_mistral` | _No params_ |
| `ocr_action/models/mistral` | _No params_ |

