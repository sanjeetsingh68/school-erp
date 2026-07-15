export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('erp_session') : null;
  let isDemo = false;
  if (sessionStr) {
    try {
      const parsed = JSON.parse(sessionStr);
      if (parsed && parsed.isDemo) {
        isDemo = true;
      }
    } catch (e) {}
  }

  const newInit: RequestInit = init ? { ...init } : {};
  if (isDemo) {
    const headers = newInit.headers ? { ...newInit.headers } : {};
    if (headers instanceof Headers) {
      headers.set('x-demo-mode', 'true');
      newInit.headers = headers;
    } else if (Array.isArray(headers)) {
      (headers as any).push(['x-demo-mode', 'true']);
      newInit.headers = headers;
    } else {
      newInit.headers = {
        ...(headers as any),
        'x-demo-mode': 'true'
      };
    }
  }
  return fetch(input, newInit);
}
