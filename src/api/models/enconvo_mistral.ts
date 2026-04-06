export const enconvoMistralModels = [
  {
    title: "Mistral OCR Latest",
    value: "mistral/mistral-ocr-latest",
    id: "enconvo-mistral-ocr-latest",
    description: "Mistral OCR Latest — document and image OCR via Enconvo Cloud Plan.",
    is_online: true,
    is_enconvo_cloud: true,
  },
];

export default async function main() {
  return Response.json(enconvoMistralModels);
}
