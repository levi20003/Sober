// Minimal Chrome DevTools Protocol client (no dependencies; Node >= 22 has a global
// WebSocket). Used to drive the REAL Android WebView of the installed APK from CI,
// and the same code is checked against desktop Chromium locally.

export async function findPageTarget(port, urlPrefix = '', { timeoutMs = 60_000 } = {}) {
  const t0 = Date.now();
  let last = '';
  while (Date.now() - t0 < timeoutMs) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.url.startsWith(urlPrefix) && t.webSocketDebuggerUrl);
      if (page) return page;
      last = `célpontok: ${list.map((t) => `${t.type}:${t.url}`).join(', ') || '(nincs)'}`;
    } catch (e) {
      last = String(e.message ?? e);
    }
    await sleep(500);
  }
  throw new Error(`Nem található oldal (${urlPrefix}) ${timeoutMs} ms alatt. ${last}`);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('A DevTools WebSocket nem nyílt meg'));
  });
  let nextId = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message}`));
      else resolve(msg.result);
    } else {
      for (const fn of listeners) fn(msg);
    }
  };
  ws.onclose = () => {
    for (const { reject } of pending.values()) reject(new Error('A DevTools kapcsolat megszakadt'));
    pending.clear();
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const api = {
    send,
    on: (fn) => listeners.push(fn),
    close: () => ws.close(),

    /** Evaluates an expression in the page; returns its JSON value. Throws on a page exception. */
    async eval(expression, { userGesture = false } = {}) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(`Oldalhiba: ${d.exception?.description ?? d.text}`);
      }
      return r.result.value;
    },

    /** Polls until `expression` is truthy (coerced in the page, so DOM nodes are fine). */
    async waitFor(expression, { timeoutMs = 20_000, what = expression } = {}) {
      const t0 = Date.now();
      let last;
      while (Date.now() - t0 < timeoutMs) {
        try {
          last = await api.eval(`Boolean(${expression})`);
          if (last) return last;
        } catch (e) {
          last = e.message;
        }
        await sleep(250);
      }
      throw new Error(`Időtúllépés (${timeoutMs} ms): ${what}. Utolsó érték: ${JSON.stringify(last)}`);
    },
  };
  return api;
}

/** Collects page errors and console errors/warnings for the final verdict. */
export async function collectProblems(c) {
  const problems = [];
  c.on((m) => {
    if (m.method === 'Runtime.exceptionThrown') {
      problems.push(`kivétel: ${m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text}`);
    } else if (m.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(m.params.type)) {
      problems.push(`console.${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      problems.push(`napló: ${m.params.entry.text} ${m.params.entry.url ?? ''}`);
    }
  });
  await c.send('Runtime.enable');
  await c.send('Log.enable');
  return problems;
}
