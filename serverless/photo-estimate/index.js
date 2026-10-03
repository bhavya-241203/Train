/**
 * Cloudflare Worker: estimates calories/macros from a plate photo.
 *
 * Deploy this separately from the app (`wrangler deploy`) and point the app
 * at it via VITE_PHOTO_ESTIMATE_URL. The vision-model API key lives only in
 * this worker's secrets, never in the client bundle.
 *
 * Usage from the app: POST multipart/form-data with a `photo` file field.
 * Response: { name, calories, proteinG, carbsG, fatG }
 *
 * Set the secret once: `wrangler secret put ANTHROPIC_API_KEY`
 */

const SYSTEM_PROMPT = `You estimate calories and macros from a photo of a meal.
Respond with ONLY a JSON object, no prose, no markdown fences:
{"name": string, "calories": number, "proteinG": number, "carbsG": number, "fatG": number}
Numbers are your best single estimate for the whole plate shown. If you
cannot identify food in the image, respond with calories: 0 and name: "Unknown".`

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('POST a photo as multipart/form-data', { status: 405 })
    }

    try {
      const form = await request.formData()
      const photo = form.get('photo')
      if (!photo || typeof photo === 'string') {
        return Response.json({ error: 'missing photo field' }, { status: 400 })
      }

      const bytes = await photo.arrayBuffer()
      const base64 = arrayBufferToBase64(bytes)
      const mediaType = photo.type || 'image/jpeg'

      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                { type: 'text', text: 'Estimate this meal.' },
              ],
            },
          ],
        }),
      })

      if (!apiRes.ok) {
        return Response.json({ error: 'vision model request failed' }, { status: 502 })
      }

      const payload = await apiRes.json()
      const text = payload.content?.[0]?.text ?? '{}'
      const parsed = JSON.parse(text)

      return Response.json({
        name: parsed.name ?? 'Photo meal',
        calories: Number(parsed.calories) || 0,
        proteinG: Number(parsed.proteinG) || 0,
        carbsG: Number(parsed.carbsG) || 0,
        fatG: Number(parsed.fatG) || 0,
      })
    } catch (err) {
      return Response.json({ error: String(err) }, { status: 500 })
    }
  },
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
