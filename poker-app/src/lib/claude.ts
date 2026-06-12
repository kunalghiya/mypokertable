export function callClaude(
  prompt: string,
  apiKey: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onErr: (msg: string) => void
): void {
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(e => { onErr((e.error?.message) || 'API error ' + res.status) })
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      function read() {
        reader.read().then(({ done, value }) => {
          if (done) { onDone(); return }
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop()!
          lines.forEach(line => {
            if (!line.startsWith('data:')) return
            try {
              const j = JSON.parse(line.slice(5).trim())
              if (j.type === 'content_block_delta' && j.delta?.text) onChunk(j.delta.text)
            } catch {}
          })
          read()
        }).catch(e => onErr(e.message))
      }
      read()
    })
    .catch(e => onErr(e.message))
}
