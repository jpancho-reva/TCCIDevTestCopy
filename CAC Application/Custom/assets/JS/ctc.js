function runMyScript() {
  function getCookieWithCT() {
    const regex = /(\b\w+_ct)=(\S+)/g;
    const matches = document.cookie.matchAll(regex);
    const result = {};
    for (let match of matches) {
      result[encodeURIComponent(match[1])] = encodeURIComponent(match[2]);
    }
    return result;
  }
 
  const cookies = getCookieWithCT();
  const urlParams = new URLSearchParams(cookies).toString();
 
  let parentUrl = "";
  try {
    parentUrl = window.parent.location.href;
  } catch (err) {
    return;
  }
 
  function extractIdFromUrl(url) {
    const regex = /\/item\/([^/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
 
  const extractedId = extractIdFromUrl(parentUrl);
  if (!extractedId) return;
 
  let token = "";
  try {
    token = localStorage.SAMLart;
  } catch (err) {
    return;
  }
 
  const soapEnvelope = `
<SOAP:Envelope xmlns:SOAP="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP:Header>
    <header xmlns="http://schemas.cordys.com/General/1.0/">
      <Logger>
        <DC name="XForms">/testtool/testtool.caf</DC>
        <DC name="hopCount">0</DC>
        <DC name="correlationID">000C29A4-908D-A1F0-879F-EB45FD79FD27</DC>
      </Logger>
    </header>
    <i18n:international xmlns:i18n="http://www.w3.org/2005/09/ws-i18n">
      <locale>en-GB</locale>
    </i18n:international>
  </SOAP:Header>
  <SOAP:Body>
    <GetCTCDetail xmlns="http://schemas.cordys.com/default">
      <ItemID>${extractedId}</ItemID>
      <BranchNum />
      <ApplicationNumber />
    </GetCTCDetail>
  </SOAP:Body>
</SOAP:Envelope>`;
 
  const response = window.parent.publicAPIProvider.resolveUserAndSystemDetails("system");
  const serviceUrl = `${response.baseDomain}${response.baseurl}com.eibus.web.soap.Gateway.wcp?${urlParams}`;
 
  fetch(serviceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=UTF-8",
      "Accept": "*/*"
    },
    body: soapEnvelope
  })
    .then(res => res.text())
    .then(responseText => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, "text/xml");
 
      const appNumber = xmlDoc.querySelector("ApplicationNumber")?.textContent.trim();
      const branchNumber = xmlDoc.querySelector("BranchNum")?.textContent.trim();
 
      if (appNumber && branchNumber) {
        const parentDoc = window.top.document;
 
       if (window.top === window || window.top.location.origin === window.location.origin) {
      const parentDoc = window.top.document;
              let copied = false;
      parentDoc.addEventListener("click", function onClickOnce() {
        if (!copied && extractedId) {
          const textToCopy = `${appNumber};${branchNumber}`;
         
          copyToClipboard(textToCopy);
          copied = true;
          console.log("ApplicationNumber:", appNumber);
 
          parentDoc.removeEventListener("click", onClickOnce);
        }
      });
      console.log("Click listener attached on parent document.");
    } else {
      console.warn("Clipboard copy not possible.");
    }
      }
    })
    .catch(error => {
      console.error("SOAP Request Failed:", error);
    });
 
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(err => fallbackCopy(text));
    } else 
    {
      fallbackCopy(text);
    }
  }
 
  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textarea);
  }
}
 
// í ½í¿¢ Run after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  runMyScript();
});