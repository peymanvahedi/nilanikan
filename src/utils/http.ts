function errorMessage(status: number, text: string): string {
  if (text) {
    try {
      const obj = JSON.parse(text);
      return (obj && (obj.error || obj.message)) || text;
    } catch {
      return text;
    }
  }
  return `HTTP ${status}`;
}

export async function httpGet<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(errorMessage(res.status, text));
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function httpPost<T = any>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(errorMessage(res.status, text));
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function httpPut<T = any>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(errorMessage(res.status, text));
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function httpDelete<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE", cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(errorMessage(res.status, text));
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}