export const mistralModels = [
  {
    title: "Mistral OCR Latest",
    value: "mistral-ocr-latest",
    id: "mistral-ocr-latest-byok",
    description: "Mistral OCR Latest — document and image OCR with your own API key.",
    is_online: true,
    is_enconvo_cloud: false,
  },
];

export default async function main() {
  return Response.json(mistralModels);
}
