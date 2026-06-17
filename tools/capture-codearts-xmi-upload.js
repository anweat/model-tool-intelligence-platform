(function captureCodeArtsXmiUpload() {
  const hits = [];
  const now = () => new Date().toISOString();
  const shouldLog = (url) => /xmi|import|upload|model|diagram|architecture|codearts|devcloud/i.test(String(url));
  const print = (item) => {
    hits.push(item);
    console.log("[CodeArts XMI capture]", item);
  };

  const originalFetch = window.fetch;
  window.fetch = async function patchedFetch(input, init = {}) {
    const url = typeof input === "string" ? input : input && input.url;
    const method = init.method || (input && input.method) || "GET";
    const startedAt = now();
    try {
      const response = await originalFetch.apply(this, arguments);
      if (shouldLog(url)) {
        const clone = response.clone();
        let body = "";
        try {
          body = await clone.text();
        } catch (error) {
          body = `<<failed to read response: ${error.message}>>`;
        }
        print({
          type: "fetch",
          method,
          url,
          status: response.status,
          statusText: response.statusText,
          startedAt,
          endedAt: now(),
          responseBody: body.slice(0, 4000),
        });
      }
      return response;
    } catch (error) {
      if (shouldLog(url)) {
        print({ type: "fetch-error", method, url, startedAt, endedAt: now(), error: error.message });
      }
      throw error;
    }
  };

  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function PatchedXMLHttpRequest() {
    const xhr = new OriginalXHR();
    let method = "GET";
    let url = "";
    let startedAt = "";
    const originalOpen = xhr.open;
    const originalSend = xhr.send;

    xhr.open = function patchedOpen(m, u) {
      method = m;
      url = u;
      return originalOpen.apply(xhr, arguments);
    };

    xhr.send = function patchedSend(body) {
      startedAt = now();
      xhr.addEventListener("loadend", function onLoadEnd() {
        if (!shouldLog(url)) return;
        let responseBody = "";
        try {
          responseBody = typeof xhr.responseText === "string" ? xhr.responseText : String(xhr.response || "");
        } catch (error) {
          responseBody = `<<failed to read response: ${error.message}>>`;
        }
        print({
          type: "xhr",
          method,
          url,
          status: xhr.status,
          statusText: xhr.statusText,
          startedAt,
          endedAt: now(),
          requestBodyType: body && body.constructor ? body.constructor.name : typeof body,
          responseBody: responseBody.slice(0, 4000),
        });
      });
      return originalSend.apply(xhr, arguments);
    };

    return xhr;
  };

  window.__codeArtsXmiCapture = {
    hits,
    dump() {
      console.table(hits.map((item) => ({
        type: item.type,
        status: item.status,
        method: item.method,
        url: item.url,
        response: String(item.responseBody || item.error || "").slice(0, 120),
      })));
      return hits;
    },
    copy() {
      const text = JSON.stringify(hits, null, 2);
      navigator.clipboard.writeText(text);
      return text;
    },
  };

  console.log("[CodeArts XMI capture] installed. Click the XMI import button now, then run __codeArtsXmiCapture.dump() or __codeArtsXmiCapture.copy().");
})();
